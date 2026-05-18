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

    @Select(
        "SELECT movie_id AS movieId, title AS title, budget AS budget, revenue AS revenue, "
            + "profit AS profit, roi_ratio AS roiRatio, poster_path AS posterPath "
            + "FROM ads_movie_roi_top ORDER BY roi_ratio DESC")
    List<MovieRoi> getTopRoiMovies();

    @Select(
        "SELECT genre_name AS genreName, movie_count AS movieCount "
            + "FROM ads_genre_distribution ORDER BY movie_count DESC")
    List<GenreDist> getGenreDistribution();

    @Select(
        "SELECT rating_range AS ratingRange, movie_count AS movieCount "
            + "FROM ads_rating_distribution")
    List<RatingDist> getRatingDistribution();

    @Select("SELECT YEAR(release_date) as year, COUNT(*) as count " +
            "FROM movie_info WHERE release_date IS NOT NULL " +
            "GROUP BY YEAR(release_date) ORDER BY year")
    List<ProductionTrend> getProductionTrends();
}
