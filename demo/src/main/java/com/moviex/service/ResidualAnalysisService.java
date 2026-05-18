package com.moviex.service;

import com.moviex.common.LinearAlgebra;
import com.moviex.common.ReleaseDates;
import com.moviex.dto.ResidualExplainResponse;
import com.moviex.dto.ResidualExplainResponse.Factor;
import com.moviex.dto.ResidualModelResponse;
import com.moviex.dto.ResidualModelResponse.Coef;
import com.moviex.dto.ResidualModelResponse.HistBin;
import com.moviex.dto.ResidualRankingsResponse;
import com.moviex.dto.ResidualRankingsResponse.RankRow;
import com.moviex.entity.MovieDashboardMeta;
import com.moviex.entity.MovieIdCount;
import com.moviex.mapper.DashboardCompanyMapper;
import com.moviex.mapper.DashboardMovieMapper;
import com.moviex.mapper.GenreCountMapper;
import com.moviex.mapper.MovieCastMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResidualAnalysisService {

  private static final String[] FEAT_LABELS =
      new String[] {
        "截距",
        "TMDB 均分",
        "log(预算)",
        "log(评分人数)",
        "片长(百分钟)",
        "上映月份(归一)",
        "log(热度指标)",
        "是否系列电影",
        "类型标签数",
        "出品公司数",
        "主演阵容人数",
      };

  private static final String MODEL_DEFINITION =
      "因变量：log(票房)。在控制预算、口碑、热度、档期、类型与公司等线性项后，残差 = 实际 log 票房 − 预测值。残差高表示相对模型「更卖座」。";

  private static final String EXPLAIN_NOTE =
      "占比为各特征对「预测相对样本均值偏离」的绝对贡献归一化，用于相对排序，非因果权重。";

  private final DashboardMovieMapper movieMapper;
  private final GenreCountMapper genreCountMapper;
  private final DashboardCompanyMapper companyMapper;
  private final MovieCastMapper castMapper;

  private DatasetPayload cached;

  public synchronized void invalidateCache() {
    cached = null;
  }

  private synchronized DatasetPayload getDataset(boolean refresh) {
    if (refresh) {
      cached = null;
    }
    if (cached == null) {
      cached = buildDataset();
    }
    return cached;
  }

  public ResidualModelResponse model(boolean refresh) {
    DatasetPayload d = getDataset(refresh);
    List<MovieVec> rows = d.rows();
    double[] beta = d.beta();

    double[] residuals = new double[rows.size()];
    int p = beta.length;
    for (int i = 0; i < rows.size(); i++) {
      MovieVec r = rows.get(i);
      double pr = pred(r.X, beta, p);
      residuals[i] = r.y - pr;
    }

    double m = LinearAlgebra.mean(residuals);
    double s = LinearAlgebra.stdSample(residuals);
    double[] sorted = residuals.clone();
    java.util.Arrays.sort(sorted);

    double lo = quantile(sorted, 0.05);
    double hi = quantile(sorted, 0.95);
    int bins = 18;
    double step = (hi - lo) / bins;
    if (step == 0) {
      step = 1;
    }
    double[] froms = new double[bins];
    double[] tos = new double[bins];
    for (int i = 0; i < bins; i++) {
      froms[i] = lo + i * step;
      tos[i] = lo + (i + 1) * step;
    }
    int[] counts = new int[bins];
    for (double e : residuals) {
      if (e < lo) {
        counts[0]++;
      } else if (e >= hi) {
        counts[bins - 1]++;
      } else {
        int idx = (int) Math.floor((e - lo) / step);
        idx = Math.min(bins - 1, idx);
        counts[idx]++;
      }
    }

    List<HistBin> immutableHist = new ArrayList<>();
    for (int i = 0; i < bins; i++) {
      immutableHist.add(new HistBin(froms[i], tos[i], counts[i]));
    }

    List<Coef> coefs = new ArrayList<>();
    for (int j = 0; j < p; j++) {
      coefs.add(new Coef(FEAT_LABELS[j], round(beta[j], 6)));
    }

    return new ResidualModelResponse(
        rows.size(),
        round(d.r2, 4),
        round(m, 5),
        round(s, 5),
        immutableHist,
        coefs,
        MODEL_DEFINITION);
  }

  private static double quantile(double[] sorted, double t) {
    if (sorted.length == 0) {
      return 0;
    }
    int idx = (int) Math.floor(t * (sorted.length - 1));
    idx = Math.max(0, Math.min(sorted.length - 1, idx));
    return sorted[idx];
  }

  public ResidualRankingsResponse rankings(int limit) {
    DatasetPayload d = getDataset(false);
    List<MovieVec> rows = d.rows();
    double[] beta = d.beta();
    int p = beta.length;

    List<RankRow> scored = new ArrayList<>();
    for (MovieVec r : rows) {
      double pr = pred(r.X, beta, p);
      double resid = r.y - pr;
      scored.add(
          new RankRow(
              r.id,
              r.title,
              r.year,
              r.voteAverage,
              r.revenue,
              r.budget,
              Double.parseDouble(String.format("%.4f", r.y)),
              Double.parseDouble(String.format("%.4f", pr)),
              Double.parseDouble(String.format("%.4f", resid))));
    }

    scored.sort(Comparator.comparingDouble(RankRow::residual).reversed());
    List<RankRow> over = scored.stream().limit(limit).toList();
    scored.sort(Comparator.comparingDouble(RankRow::residual));
    List<RankRow> under = scored.stream().limit(limit).toList();
    return new ResidualRankingsResponse(over, under);
  }

  public ResidualExplainResponse explain(String movieId) {
    String id = Objects.requireNonNullElse(movieId, "").trim();
    if (id.isEmpty()) {
      throw new BadRequestException("缺少 movieId");
    }
    DatasetPayload d = getDataset(false);
    MovieVec r = null;
    for (MovieVec v : d.rows()) {
      if (id.equals(v.id)) {
        r = v;
        break;
      }
    }
    if (r == null) {
      throw new NotFoundException("未找到该片或未进入建模样本（需票房>0、预算≥1万等）");
    }
    double[] beta = d.beta();
    double[] colMeans = d.colMeans();
    int p = beta.length;
    double prediction = pred(r.X, beta, p);
    double residual = r.y - prediction;

    List<Factor> draft = new ArrayList<>();
    for (int j = 1; j < p; j++) {
      double val = beta[j] * (r.X[j] - colMeans[j]);
      draft.add(new Factor(FEAT_LABELS[j], round(val, 5), 0));
    }
    double absSum = draft.stream().mapToDouble(f -> Math.abs(f.contribution())).sum();
    final double denom = absSum <= 1e-15 ? 1.0 : absSum;
    List<Factor> factors =
        draft.stream()
            .map(
                f ->
                    new Factor(f.name(), f.contribution(),
                        round(100 * Math.abs(f.contribution()) / denom, 2)))
            .sorted(Comparator.comparingDouble(Factor::pct).reversed())
            .toList();

    return new ResidualExplainResponse(
        r.id,
        r.title,
        r.year,
        r.voteAverage,
        r.revenue,
        r.budget,
        Double.parseDouble(String.format("%.4f", r.y)),
        Double.parseDouble(String.format("%.4f", prediction)),
        Double.parseDouble(String.format("%.4f", residual)),
        round(d.r2, 4),
        factors,
        EXPLAIN_NOTE);
  }

  private static double pred(double[] rowX, double[] beta, int p) {
    double pr = 0;
    for (int j = 0; j < p; j++) {
      pr += beta[j] * rowX[j];
    }
    return pr;
  }

  private DatasetPayload buildDataset() {
    List<MovieDashboardMeta> movieRows = movieMapper.listAll();
    Map<String, Integer> genreCount = loadCounts(genreCountMapper.countPerMovie());
    Map<String, Integer> companyCount = loadCounts(companyMapper.countCompaniesByMovie());
    Map<String, Integer> castTop = loadCounts(castMapper.countTopBillingByMovie());

    List<MovieVec> rows = new ArrayList<>();
    for (MovieDashboardMeta m : movieRows) {
      String mid = m.getId();
      if (mid == null || mid.isBlank()) continue;
      double revenue = nz(m.getRevenue());
      double budget = nz(m.getBudget());
      double voteAverage = nz(m.getVoteAverage());
      long voteCount = nzL(m.getVoteCount());
      double runtime = nz(m.getRuntime());
      if (!(revenue > 0 && budget >= 10_000 && voteAverage > 0 && voteCount >= 8 && runtime > 10)) continue;

      double pop = nz(m.getPopularity());
      int mo = ReleaseDates.parseMonthOrdinal(m.getReleaseDate());
      String coll = m.getBelongsToCollectionId() == null ? "" : m.getBelongsToCollectionId().trim();
      int hasColl = !coll.isEmpty() && !"0".equals(coll) ? 1 : 0;
      int gN = genreCount.getOrDefault(mid, 0);
      int cN = companyCount.getOrDefault(mid, 0);
      int castN = castTop.getOrDefault(mid, 0);

      double[] x =
          new double[] {
            1,
            voteAverage,
            Math.log(budget),
            Math.log(voteCount + 1),
            runtime / 100,
            (mo - 1) / 11.0,
            Math.log(pop + 1),
            hasColl,
            gN / 5.0,
            Math.min(cN, 8) / 4.0,
            Math.min(castN, 12) / 8.0,
          };

      String title = m.getTitle() == null ? mid : m.getTitle().trim();
      if (title.isEmpty()) title = mid;

      rows.add(
          new MovieVec(
              mid,
              title,
              ReleaseDates.parseYear(m.getReleaseDate()),
              Math.log(revenue),
              x,
              voteAverage,
              revenue,
              budget));
    }

    if (rows.size() < 30) {
      throw new IllegalStateException("有效样本过少，无法拟合模型");
    }

    int p = FEAT_LABELS.length;
    double[][] xMat = new double[rows.size()][];
    double[] yvec = new double[rows.size()];
    for (int i = 0; i < rows.size(); i++) {
      xMat[i] = rows.get(i).X;
      yvec[i] = rows.get(i).y;
    }

    double[] colMeans = new double[p];
    for (int j = 0; j < p; j++) {
      double sum = 0;
      for (double[] xv : xMat) {
        sum += xv[j];
      }
      colMeans[j] = sum / xMat.length;
    }

    double lambda = 2;
    double[] beta = LinearAlgebra.ridgeFit(xMat, yvec, lambda);

    double yMean = LinearAlgebra.mean(yvec);
    double ssTot = 0;
    double ssRes = 0;
    for (MovieVec r : rows) {
      double pr = pred(r.X, beta, p);
      ssTot += (r.y - yMean) * (r.y - yMean);
      ssRes += (r.y - pr) * (r.y - pr);
    }
    double r2 = ssTot > 1e-10 ? 1 - ssRes / ssTot : 0;

    return new DatasetPayload(List.copyOf(rows), beta, colMeans, r2);
  }

  private static Map<String, Integer> loadCounts(List<MovieIdCount> counts) {
    Map<String, Integer> m = new HashMap<>();
    for (MovieIdCount c : counts) {
      if (c.getMovieId() == null) continue;
      m.put(c.getMovieId(), Optional.ofNullable(c.getCnt()).orElse(0));
    }
    return m;
  }

  private static double nz(Double v) {
    return v == null || !Double.isFinite(v) ? 0 : v;
  }

  private static long nzL(Long v) {
    return v == null ? 0 : v;
  }

  private static double round(double v, int dec) {
    double pw = Math.pow(10, dec);
    return Math.round(v * pw) / pw;
  }

  private record DatasetPayload(List<MovieVec> rows, double[] beta, double[] colMeans, double r2) {}

  static final class MovieVec {
    final String id;
    final String title;
    final Integer year;
    final double y;
    final double[] X;
    final double voteAverage;
    final double revenue;
    final double budget;

    MovieVec(
        String id,
        String title,
        Integer year,
        double y,
        double[] X,
        double voteAverage,
        double revenue,
        double budget) {
      this.id = id;
      this.title = title;
      this.year = year;
      this.y = y;
      this.X = X;
      this.voteAverage = voteAverage;
      this.revenue = revenue;
      this.budget = budget;
    }
  }

  public static final class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
      super(message);
    }
  }

  public static final class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
      super(message);
    }
  }
}
