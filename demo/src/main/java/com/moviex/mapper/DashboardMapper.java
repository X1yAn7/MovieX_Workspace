package com.moviex.mapper;

import com.moviex.entity.*;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface DashboardMapper {

    @Select("SELECT COUNT(id) as total_movies, " +
            "SUM(revenue) as total_revenue, " +
            "SUM(budget) as total_budget, " +
            "ROUND(AVG(vote_average), 2) as average_rating " +
            "FROM movie_info WHERE revenue > 0 AND budget > 0")
    GlobalMetrics getGlobalMetrics();

    @Select("SELECT * FROM ads_movie_roi_top ORDER BY roi_ratio DESC")
    List<MovieRoi> getTopRoiMovies();

    @Select("SELECT * FROM ads_genre_distribution ORDER BY movie_count DESC")
    List<GenreDist> getGenreDistribution();

    @Select("SELECT * FROM ads_rating_distribution ORDER BY rating_range ASC")
    List<RatingDist> getRatingDistribution();

    @Select("SELECT YEAR(release_date) as year, COUNT(*) as count " +
            "FROM movie_info WHERE release_date IS NOT NULL " +
            "GROUP BY YEAR(release_date) ORDER BY year")
    List<ProductionTrend> getProductionTrends();
}
