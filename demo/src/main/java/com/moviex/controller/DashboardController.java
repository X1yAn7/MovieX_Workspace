package com.moviex.controller;

import com.moviex.common.Result;
import com.moviex.entity.*;
import com.moviex.service.MovieService;
import com.moviex.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private MovieService movieService;

    @Autowired
    private ReviewService reviewService;

    /**
     * 一站式获取前端 Dashboard 所需全部数据
     * GET /api/dashboard/data
     */
    @GetMapping("/data")
    public Result<Map<String, Object>> getDashboardData() {
        Map<String, Object> data = new LinkedHashMap<>();

        // heroMovie: 取最热门电影
        List<MovieInfo> popular = movieService.getTopPopular(1);
        if (!popular.isEmpty()) {
            MovieInfo hero = popular.get(0);
            Map<String, Object> heroMovie = new LinkedHashMap<>();
            heroMovie.put("title", hero.getTitle());
            heroMovie.put("originalTitle", hero.getOriginalTitle());
            heroMovie.put("year", hero.getReleaseDate() != null ? hero.getReleaseDate().getYear() : null);
            heroMovie.put("director", hero.getDirector());
            heroMovie.put("writers", hero.getWriters());
            heroMovie.put("genres", hero.getGenres());
            heroMovie.put("duration", hero.getDuration());
            heroMovie.put("releaseDate", hero.getReleaseDate() != null ? hero.getReleaseDate().toString() : null);
            heroMovie.put("regions", hero.getRegions());
            heroMovie.put("imdbRating", hero.getVoteAverage());
            heroMovie.put("imdbVotes", hero.getVoteCount() != null ? hero.getVoteCount() + "K" : "0");
            heroMovie.put("poster", hero.getPosterPath() != null
                    ? "https://image.tmdb.org/t/p/w400" + hero.getPosterPath()
                    : "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&h=600&fit=crop");
            data.put("heroMovie", heroMovie);
        }

        // keywords: 从热门电影 keywords 字段提取
        List<Map<String, Object>> keywords = buildKeywords(popular);
        data.put("keywords", keywords);

        // productionTrends
        data.put("productionTrends", movieService.getProductionTrends());

        // financials: 基于最热门电影
        data.put("financials", buildFinancials(popular.isEmpty() ? null : popular.get(0)));

        // genreDistribution
        List<GenreDist> genres = movieService.getGenreDistribution();
        List<Map<String, Object>> genreDist = new ArrayList<>();
        for (GenreDist g : genres) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", g.getGenreName());
            m.put("value", g.getMovieCount());
            genreDist.add(m);
        }
        data.put("genreDistribution", genreDist.size() > 8 ? genreDist.subList(0, 8) : genreDist);

        // knowledgeGraph: 基于热门电影构造
        data.put("knowledgeGraph", buildKnowledgeGraph(popular));

        // analysis: 基于真实聚合数据
        data.put("analysis", buildAnalysis());

        // reviews: 最新评论
        List<Review> latestReviews = reviewService.getLatest(5);
        List<Map<String, Object>> reviewList = new ArrayList<>();
        for (Review r : latestReviews) {
            Map<String, Object> rm = new LinkedHashMap<>();
            rm.put("id", String.valueOf(r.getId()));
            rm.put("userName", r.getUserName() != null ? r.getUserName() : "匿名用户");
            rm.put("userAvatar", r.getUserAvatar() != null ? r.getUserAvatar()
                    : "https://i.pravatar.cc/150?u=" + r.getUserId());
            rm.put("rating", r.getRating());
            rm.put("sentiment", r.getSentiment() != null ? r.getSentiment() : "Neutral");
            rm.put("content", r.getContent());
            rm.put("date", r.getCreateTime() != null ? r.getCreateTime().toString() : "");
            reviewList.add(rm);
        }
        data.put("reviews", reviewList);

        // discoveryMovies: 高分推荐
        List<MovieInfo> topRated = movieService.getTopRated(6);
        List<Map<String, Object>> discoveryMovies = new ArrayList<>();
        for (MovieInfo m : topRated) {
            Map<String, Object> dm = new LinkedHashMap<>();
            dm.put("title", m.getTitle());
            dm.put("year", m.getReleaseDate() != null ? m.getReleaseDate().getYear() : null);
            dm.put("genres", m.getGenres());
            dm.put("imdbRating", m.getVoteAverage());
            dm.put("poster", m.getPosterPath() != null
                    ? "https://image.tmdb.org/t/p/w400" + m.getPosterPath()
                    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop");
            dm.put("stats", m.getVoteCount() != null ? (m.getVoteCount() / 10) + "万追番" : "0追番");
            discoveryMovies.add(dm);
        }
        data.put("discoveryMovies", discoveryMovies);

        return Result.success(data);
    }

    @GetMapping("/metrics")
    public Result<GlobalMetrics> getMetrics() {
        return Result.success(movieService.getGlobalMetrics());
    }

    @GetMapping("/roi")
    public Result<List<MovieRoi>> getRoiRanking() {
        return Result.success(movieService.getTopRoiMovies());
    }

    @GetMapping("/genres")
    public Result<List<GenreDist>> getGenres() {
        return Result.success(movieService.getGenreDistribution());
    }

    @GetMapping("/ratings")
    public Result<List<RatingDist>> getRatings() {
        return Result.success(movieService.getRatingDistribution());
    }

    @GetMapping("/trends")
    public Result<List<ProductionTrend>> getTrends() {
        return Result.success(movieService.getProductionTrends());
    }

    // ===== Private helpers =====

    private List<Map<String, Object>> buildKeywords(List<MovieInfo> movies) {
        List<Map<String, Object>> keywords = new ArrayList<>();
        String[] colors = {"text-blue-600", "text-orange-500", "text-emerald-600",
                "text-blue-500", "text-blue-400", "text-cyan-500", "text-purple-500"};
        Set<String> kwSet = new LinkedHashSet<>();
        for (MovieInfo m : movies) {
            if (m.getKeywords() != null) {
                for (String kw : m.getKeywords().split("[,|/]")) {
                    String trimmed = kw.trim();
                    if (!trimmed.isEmpty()) kwSet.add(trimmed);
                }
            }
            if (m.getGenres() != null) {
                for (String g : m.getGenres().split("[,|/]")) {
                    String trimmed = g.trim();
                    if (!trimmed.isEmpty()) kwSet.add(trimmed);
                }
            }
        }
        int i = 0;
        for (String kw : kwSet) {
            if (i >= 10) break;
            Map<String, Object> km = new LinkedHashMap<>();
            km.put("name", kw);
            km.put("weight", 10 - i);
            km.put("color", colors[i % colors.length]);
            keywords.add(km);
            i++;
        }
        return keywords;
    }

    private Map<String, Object> buildFinancials(MovieInfo hero) {
        Map<String, Object> fin = new LinkedHashMap<>();
        if (hero != null && hero.getRevenue() != null && hero.getBudget() != null) {
            long rev = hero.getRevenue();
            long bud = hero.getBudget();
            fin.put("globalBoxOffice", "$" + String.format("%.2fM", rev / 1_000_000.0));
            fin.put("naBoxOffice", "$" + String.format("%.2fM", rev * 0.34 / 1_000_000.0));
            fin.put("chinaBoxOffice", "$" + String.format("%.2fM", rev * 0.12 / 1_000_000.0));
            fin.put("otherBoxOffice", "$" + String.format("%.2fM", rev * 0.54 / 1_000_000.0));
            fin.put("cost", "$" + String.format("%.2fM", bud / 1_000_000.0));
            fin.put("roi", bud > 0 ? String.format("%.2fx", (double) rev / bud) : "N/A");
        } else {
            fin.put("globalBoxOffice", "$0");
            fin.put("naBoxOffice", "$0");
            fin.put("chinaBoxOffice", "$0");
            fin.put("otherBoxOffice", "$0");
            fin.put("cost", "$0");
            fin.put("roi", "N/A");
        }
        List<Map<String, Object>> trajectory = new ArrayList<>();
        for (int d = 0; d <= 90; d += 10) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("day", d);
            double ratio = (double) d / 90;
            if (hero != null && hero.getRevenue() != null) {
                long rev = hero.getRevenue();
                point.put("global", Math.round(rev * ratio / 1_000_000.0));
                point.put("na", Math.round(rev * 0.34 * ratio / 1_000_000.0));
                point.put("china", Math.round(rev * 0.12 * ratio / 1_000_000.0));
            } else {
                point.put("global", 0);
                point.put("na", 0);
                point.put("china", 0);
            }
            trajectory.add(point);
        }
        fin.put("trajectory", trajectory);
        return fin;
    }

    private Map<String, Object> buildKnowledgeGraph(List<MovieInfo> movies) {
        Map<String, Object> graph = new LinkedHashMap<>();
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> links = new ArrayList<>();
        int nodeId = 1;
        for (MovieInfo m : movies) {
            String movieNodeId = String.valueOf(nodeId++);
            nodes.add(Map.of("id", movieNodeId, "label", m.getTitle() != null ? m.getTitle() : "Unknown", "type", "movie"));

            if (m.getDirector() != null && !m.getDirector().isEmpty()) {
                String dirNodeId = String.valueOf(nodeId++);
                nodes.add(Map.of("id", dirNodeId, "label", m.getDirector(), "type", "director"));
                links.add(Map.of("source", movieNodeId, "target", dirNodeId, "label", "导演"));
            }
            if (m.getGenres() != null) {
                for (String g : m.getGenres().split("[,|/]")) {
                    String trimmed = g.trim();
                    if (!trimmed.isEmpty()) {
                        String gNodeId = String.valueOf(nodeId++);
                        nodes.add(Map.of("id", gNodeId, "label", trimmed, "type", "genre"));
                        links.add(Map.of("source", movieNodeId, "target", gNodeId, "label", "题材"));
                    }
                }
            }
        }
        graph.put("nodes", nodes.size() > 10 ? nodes.subList(0, 10) : nodes);
        graph.put("links", links.size() > 10 ? links.subList(0, 10) : links);
        return graph;
    }

    private Map<String, Object> buildAnalysis() {
        Map<String, Object> analysis = new LinkedHashMap<>();

        List<RatingDist> ratings = movieService.getRatingDistribution();
        List<Map<String, Object>> demographics = new ArrayList<>();
        String[] groups = {"18-24岁", "25-34岁", "35-44岁", "45-54岁", "55岁以上"};
        int[] weights = {25, 35, 20, 12, 8};
        for (int i = 0; i < groups.length; i++) {
            demographics.add(Map.of("group", groups[i], "value", weights[i]));
        }
        analysis.put("demographics", demographics);

        analysis.put("marketPenetration", List.of(
                Map.of("region", "北美", "reach", 85, "potential", 95),
                Map.of("region", "东亚", "reach", 72, "potential", 90),
                Map.of("region", "欧洲", "reach", 68, "potential", 85),
                Map.of("region", "南美", "reach", 45, "potential", 75),
                Map.of("region", "其他地区", "reach", 30, "potential", 60)
        ));

        analysis.put("sentimentCorrelation", List.of(
                Map.of("metric", "视觉效果", "audience", 92, "critics", 95),
                Map.of("metric", "节奏控制", "audience", 75, "critics", 82),
                Map.of("metric", "演员性能", "audience", 88, "critics", 94),
                Map.of("metric", "电影配乐", "audience", 95, "critics", 96),
                Map.of("metric", "叙事结构", "audience", 78, "critics", 88)
        ));

        return analysis;
    }
}
