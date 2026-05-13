package com.moviex.service;

import com.moviex.common.PageResult;
import com.moviex.entity.*;
import com.moviex.mapper.DashboardMapper;
import com.moviex.mapper.MovieMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MovieService {

    @Autowired
    private MovieMapper movieMapper;

    @Autowired
    private DashboardMapper dashboardMapper;

    public MovieInfo getById(Integer id) {
        return movieMapper.getById(id);
    }

    /**
     * 优化点：增加 skipCount 参数。当跳过统计时，直接返回 total = 0
     */
    public PageResult<MovieInfo> search(String title, String genre, Double minRating, Double maxRating,
                                        Integer year, Long minBudget, Long maxBudget,
                                        String orderBy, String orderDir,
                                        Integer page, Integer pageSize, Boolean skipCount) {
        String safeOrderBy = sanitizeOrderBy(orderBy);
        String safeDir = "DESC".equalsIgnoreCase(orderDir) ? "DESC" : "ASC";
        int offset = (page - 1) * pageSize;

        List<MovieInfo> records = movieMapper.search(title, genre, minRating, maxRating,
                year, minBudget, maxBudget, safeOrderBy, safeDir, offset, pageSize);

        Long total = 0L;
        if (skipCount == null || !skipCount) {
            total = movieMapper.searchCount(title, genre, minRating, maxRating, year, minBudget, maxBudget);
        }

        return PageResult.of(records, total, page, pageSize);
    }

    /**
     * 独立暴露的数据总数统计服务
     */
    public Long searchCount(String title, String genre, Double minRating, Double maxRating,
                            Integer year, Long minBudget, Long maxBudget) {
        return movieMapper.searchCount(title, genre, minRating, maxRating, year, minBudget, maxBudget);
    }

    public List<MovieInfo> getTopPopular(Integer limit) {
        return movieMapper.getTopPopular(limit == null ? 10 : limit);
    }

    public List<MovieInfo> getTopRated(Integer limit) {
        return movieMapper.getTopRated(limit == null ? 10 : limit);
    }

    public MovieInfo create(MovieInfo movie) {
        movieMapper.insert(movie);
        return movie;
    }

    public MovieInfo update(MovieInfo movie) {
        movieMapper.update(movie);
        return movieMapper.getById(movie.getId());
    }

    public boolean delete(Integer id) {
        return movieMapper.deleteById(id) > 0;
    }

    public List<String> getAllGenres() {
        return movieMapper.getAllGenres();
    }

    // ===== Dashboard aggregations =====

    public GlobalMetrics getGlobalMetrics() {
        return dashboardMapper.getGlobalMetrics();
    }

    public List<MovieRoi> getTopRoiMovies() {
        return dashboardMapper.getTopRoiMovies();
    }

    public List<GenreDist> getGenreDistribution() {
        return dashboardMapper.getGenreDistribution();
    }

    public List<RatingDist> getRatingDistribution() {
        return dashboardMapper.getRatingDistribution();
    }

    public List<ProductionTrend> getProductionTrends() {
        List<ProductionTrend> trends = dashboardMapper.getProductionTrends();
        for (int i = 1; i < trends.size(); i++) {
            int prev = trends.get(i - 1).getCount();
            int curr = trends.get(i).getCount();
            double growth = prev == 0 ? 0 : ((double)(curr - prev) / prev) * 100;
            trends.get(i).setGrowth(Math.round(growth * 10.0) / 10.0);
        }
        if (!trends.isEmpty()) {
            trends.get(0).setGrowth(0.0);
        }
        return trends;
    }

    private String sanitizeOrderBy(String orderBy) {
        Set<String> allowed = Set.of("id", "title", "vote_average", "revenue", "budget", "release_date");
        if (orderBy != null && "popularity".equalsIgnoreCase(orderBy)) {
            return "revenue";
        }
        if (orderBy != null && allowed.contains(orderBy.toLowerCase())) {
            return orderBy.toLowerCase();
        }
        return "revenue";
    }
}