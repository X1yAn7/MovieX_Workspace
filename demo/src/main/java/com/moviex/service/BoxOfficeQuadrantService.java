package com.moviex.service;

import com.moviex.common.ReleaseDates;
import com.moviex.dto.BoxOfficeQuadrantResponse;
import com.moviex.dto.BoxOfficeQuadrantResponse.QuadrantMedians;
import com.moviex.dto.BoxOfficeQuadrantResponse.QuadrantMeta;
import com.moviex.dto.BoxOfficeQuadrantResponse.QuadrantPoint;
import com.moviex.entity.GenreMapRow;
import com.moviex.entity.MovieDashboardMeta;
import com.moviex.mapper.DashboardGenreMapper;
import com.moviex.mapper.DashboardMovieMapper;

import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BoxOfficeQuadrantService {

  private final DashboardMovieMapper movieMapper;
  private final DashboardGenreMapper genreMapper;

  public BoxOfficeQuadrantResponse build(int yearFrom, int yearTo, String genreParam, int minVotes) {
    String genreTrim = genreParam == null ? "" : genreParam.trim();

    List<GenreMapRow> genreRows = genreMapper.listAll();
    Map<String, List<String>> genresByMovie = new HashMap<>();
    for (GenreMapRow r : genreRows) {
      String mid = r.getMovieId();
      if (mid == null || mid.isBlank()) continue;
      String g = r.getGenreName() == null ? "" : r.getGenreName().trim();
      if (g.isEmpty()) continue;
      genresByMovie.computeIfAbsent(mid, k -> new ArrayList<>()).add(g);
    }
    TreeSet<String> genreSet = new TreeSet<>();
    for (GenreMapRow r : genreRows) {
      if (r.getGenreName() != null && !r.getGenreName().isBlank()) {
        genreSet.add(r.getGenreName().trim());
      }
    }
    List<String> genreOptions = new ArrayList<>(genreSet);

    List<MovieDashboardMeta> movieRows = movieMapper.listAll();
    List<QuadrantPoint> points = new ArrayList<>();

    for (MovieDashboardMeta row : movieRows) {
      String id = row.getId();
      if (id == null || id.isBlank()) continue;

      double budget = nz(row.getBudget());
      double revenue = nz(row.getRevenue());
      double voteAverage = nz(row.getVoteAverage());
      long voteCount = nzL(row.getVoteCount());

      Integer y = ReleaseDates.parseYear(row.getReleaseDate());
      if (y == null || y < yearFrom || y > yearTo) continue;
      if (!(Double.isFinite(voteAverage)) || !(Double.isFinite(voteCount)) || voteCount < minVotes) continue;
      if (!(Double.isFinite(budget)) || budget < 10_000) continue;
      if (!(Double.isFinite(revenue)) || revenue <= 0) continue;

      List<String> mg = genresByMovie.getOrDefault(id, List.of());
      if (!genreTrim.isEmpty() && !mg.contains(genreTrim)) continue;

      double roi = revenue / budget;
      double roiLog = Math.log10(Math.max(roi, 0.01));

      String title = row.getTitle() == null ? id : row.getTitle().trim();
      if (title.isEmpty()) title = id;

      points.add(
          new QuadrantPoint(
              id,
              title,
              y,
              voteAverage,
              voteCount,
              budget,
              revenue,
              roi,
              roiLog,
              new ArrayList<>(mg)));
    }

    double roiLogMed = median(points.stream().mapToDouble(QuadrantPoint::roiLog).toArray());
    double voteMed = median(points.stream().mapToDouble(QuadrantPoint::voteAverage).toArray());

    return new BoxOfficeQuadrantResponse(
        points,
        new QuadrantMedians(roiLogMed, voteMed),
        genreOptions,
        new QuadrantMeta(yearFrom, yearTo, genreTrim.isEmpty() ? null : genreTrim, minVotes));
  }

  private static double nz(Double v) {
    return v == null || !Double.isFinite(v) ? 0 : v;
  }

  private static long nzL(Long v) {
    return v == null ? 0 : v;
  }

  private static double median(double[] nums) {
    if (nums.length == 0) return 0;
    double[] s = nums.clone();
    java.util.Arrays.sort(s);
    int m = s.length / 2;
    return s.length % 2 != 0 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
}
