package com.moviex.service;

import com.moviex.common.ReleaseDates;
import com.moviex.dto.RatingsVsTmdbResponse;
import com.moviex.dto.RatingsVsTmdbResponse.Meta;
import com.moviex.dto.RatingsVsTmdbResponse.RatingRow;
import com.moviex.entity.MovieDashboardMeta;
import com.moviex.entity.RatingMlAggRow;
import com.moviex.mapper.DashboardMovieMapper;
import com.moviex.mapper.RatingMlMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RatingsVsTmdbService {

  private static final String SCALE_NOTE =
      "用户评分为 MovieLens 5 分制，已 ×2 映射到 10 分制后与 TMDB vote_average 对比";

  private final DashboardMovieMapper movieMapper;
  private final RatingMlMapper ratingMlMapper;

  /** 按 minCount 缓存明细聚合结果，避免重复扫 movie_dashboard_rating_ml（首次可能较慢） */
  private volatile RatingAggCache ratingCache;

  public RatingsVsTmdbResponse build(int limit, int minCount) {
    List<RatingMlAggRow> aggregates = loadRatingAggregates(minCount);

    List<MovieDashboardMeta> movies = movieMapper.listAll();
    Map<String, MovieDashboardMeta> byId = new HashMap<>();
    for (MovieDashboardMeta m : movies) {
      if (m.getId() != null && !m.getId().isBlank()) {
        byId.put(m.getId(), m);
      }
    }

    List<RatingRow> rows = new ArrayList<>();
    for (RatingMlAggRow agg : aggregates) {
      MovieDashboardMeta mr = byId.get(agg.getMovieId());
      if (mr == null) continue;
      double tmdb = nz(mr.getVoteAverage());
      if (!Double.isFinite(tmdb)) continue;
      Double sum = agg.getRatingSum();
      Long cnt = agg.getCnt();
      if (sum == null || cnt == null || cnt <= 0) continue;
      double userAvg = sum / cnt;
      double userAvgOnTen = userAvg * 2;
      String title =
          mr.getTitle() != null && !mr.getTitle().isBlank()
              ? mr.getTitle().trim()
              : agg.getMovieId();
      rows.add(
          new RatingRow(
              agg.getMovieId(),
              title,
              ReleaseDates.parseYear(mr.getReleaseDate()),
              Double.parseDouble(String.format("%.3f", userAvg)),
              Double.parseDouble(String.format("%.2f", userAvgOnTen)),
              Double.parseDouble(String.format("%.2f", tmdb)),
              Double.parseDouble(String.format("%.2f", userAvgOnTen - tmdb)),
              cnt));
    }

    List<RatingRow> platformHigher =
        rows.stream()
            .filter(r -> r.delta() > 0)
            .sorted(
                Comparator.comparingDouble(RatingRow::delta)
                    .reversed()
                    .thenComparing(Comparator.comparingLong(RatingRow::ratingCount).reversed()))
            .limit(limit)
            .toList();

    List<RatingRow> platformLower =
        rows.stream()
            .filter(r -> r.delta() < 0)
            .sorted(
                Comparator.comparingDouble(RatingRow::delta)
                    .thenComparing(
                        Comparator.comparingLong(RatingRow::ratingCount).reversed()))
            .limit(limit)
            .toList();

    return new RatingsVsTmdbResponse(platformHigher, platformLower, new Meta(limit, minCount, SCALE_NOTE));
  }

  private static double nz(Double v) {
    return v == null ? Double.NaN : v;
  }

  private synchronized List<RatingMlAggRow> loadRatingAggregates(int minCount) {
    RatingAggCache c = ratingCache;
    if (c != null && c.minCount == minCount) {
      return c.rows;
    }
    List<RatingMlAggRow> rows = ratingMlMapper.aggregatesFromRaw(minCount);
    ratingCache = new RatingAggCache(minCount, rows);
    return rows;
  }

  private record RatingAggCache(int minCount, List<RatingMlAggRow> rows) {}
}
