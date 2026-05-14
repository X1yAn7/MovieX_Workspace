package com.moviex.mapper;

import com.moviex.entity.MovieInfo;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface MovieMapper {

    @Select("SELECT m.id, m.title, m.original_language AS originalTitle, m.overview, " +
            "m.runtime AS duration, m.release_date AS releaseDate, " +
            "m.vote_average AS voteAverage, m.budget, m.revenue, m.poster_path AS posterPath, " +
            "(SELECT GROUP_CONCAT(DISTINCT genre_name SEPARATOR ', ') FROM movie_genres_map WHERE movie_id = m.id) AS genres, " +
            "(SELECT GROUP_CONCAT(DISTINCT director_name SEPARATOR ', ') FROM movie_director WHERE movie_id = m.id) AS director, " +
            "(SELECT GROUP_CONCAT(DISTINCT cast_name SEPARATOR ', ') FROM movie_cast WHERE movie_id = m.id) AS `cast` " +
            "FROM movie_info m WHERE m.id = #{id} LIMIT 1")
    MovieInfo getById(@Param("id") Integer id);

    /**
     * 极致优化版分页查询：
     * 1. 采用 GROUP BY id + MAX() 聚合消除物理表中的重复冗余行。
     * 2. 采用 IN + CAST 转换子查询取代 EXISTS，避免 O(N^2) 的全表扫描慢查询。
     */
    @Select("<script>" +
            "SELECT m.id, MAX(m.title) AS title, MAX(m.original_language) AS originalTitle, " +
            "MAX(m.overview) AS overview, MAX(m.runtime) AS duration, " +
            "MAX(m.release_date) AS releaseDate, MAX(m.vote_average) AS voteAverage, " +
            "MAX(m.budget) AS budget, MAX(m.revenue) AS revenue, " +
            "MAX(m.poster_path) AS posterPath, " +
            "(SELECT GROUP_CONCAT(DISTINCT genre_name SEPARATOR ', ') FROM movie_genres_map WHERE movie_id = m.id) AS genres " +
            "FROM (" +
            "  SELECT id FROM movie_info " +
            "  <where>" +
            "    <if test='title != null and title != \"\"'> AND title LIKE CONCAT('%', #{title}, '%') </if>" +
            "    <if test='genre != null and genre != \"\"'> AND id IN (SELECT CAST(movie_id AS UNSIGNED) FROM movie_genres_map WHERE genre_name = #{genre}) </if>" +
            "    <if test='minRating != null'> AND vote_average &gt;= #{minRating} </if>" +
            "    <if test='maxRating != null'> AND vote_average &lt;= #{maxRating} </if>" +
            "    <if test='year != null'> AND YEAR(release_date) = #{year} </if>" +
            "    <if test='minBudget != null'> AND budget &gt;= #{minBudget} </if>" +
            "    <if test='maxBudget != null'> AND budget &lt;= #{maxBudget} </if>" +
            "  </where>" +
            "  GROUP BY id " +
            "  ORDER BY MAX(${orderBy}) ${orderDir}, id ASC " +
            "  LIMIT #{offset}, #{pageSize}" +
            ") AS temp " +
            "JOIN movie_info m ON m.id = temp.id " +
            "GROUP BY m.id " +
            "ORDER BY MAX(m.${orderBy}) ${orderDir}, m.id ASC" +
            "</script>")
    List<MovieInfo> search(@Param("title") String title,
                           @Param("genre") String genre,
                           @Param("minRating") Double minRating,
                           @Param("maxRating") Double maxRating,
                           @Param("year") Integer year,
                           @Param("minBudget") Long minBudget,
                           @Param("maxBudget") Long maxBudget,
                           @Param("orderBy") String orderBy,
                           @Param("orderDir") String orderDir,
                           @Param("offset") Integer offset,
                           @Param("pageSize") Integer pageSize);

    /**
     * 采用 COUNT(DISTINCT id) 保证即使物理表有冗余重复行，分页总数依然精确
     */
    @Select("<script>" +
            "SELECT COUNT(DISTINCT id) FROM movie_info " +
            "<where>" +
            "  <if test='title != null and title != \"\"'> AND title LIKE CONCAT('%', #{title}, '%') </if>" +
            "  <if test='genre != null and genre != \"\"'> AND id IN (SELECT CAST(movie_id AS UNSIGNED) FROM movie_genres_map WHERE genre_name = #{genre}) </if>" +
            "  <if test='minRating != null'> AND vote_average &gt;= #{minRating} </if>" +
            "  <if test='maxRating != null'> AND vote_average &lt;= #{maxRating} </if>" +
            "  <if test='year != null'> AND YEAR(release_date) = #{year} </if>" +
            "  <if test='minBudget != null'> AND budget &gt;= #{minBudget} </if>" +
            "  <if test='maxBudget != null'> AND budget &lt;= #{maxBudget} </if>" +
            "</where>" +
            "</script>")
    Long searchCount(@Param("title") String title,
                     @Param("genre") String genre,
                     @Param("minRating") Double minRating,
                     @Param("maxRating") Double maxRating,
                     @Param("year") Integer year,
                     @Param("minBudget") Long minBudget,
                     @Param("maxBudget") Long maxBudget);

    @Select("SELECT m.id, MAX(m.title) AS title, MAX(m.original_language) AS originalTitle, " +
            "MAX(m.overview) AS overview, MAX(m.runtime) AS duration, " +
            "MAX(m.release_date) AS releaseDate, MAX(m.vote_average) AS voteAverage, " +
            "MAX(m.budget) AS budget, MAX(m.revenue) AS revenue, MAX(m.poster_path) AS posterPath, " +
            "(SELECT GROUP_CONCAT(DISTINCT genre_name SEPARATOR ', ') FROM movie_genres_map WHERE movie_id = m.id) AS genres " +
            "FROM movie_info m " +
            "GROUP BY m.id " +
            "ORDER BY MAX(m.revenue) DESC LIMIT #{limit}")
    List<MovieInfo> getTopPopular(@Param("limit") Integer limit);

    @Select("SELECT m.id, MAX(m.title) AS title, MAX(m.original_language) AS originalTitle, " +
            "MAX(m.overview) AS overview, MAX(m.runtime) AS duration, " +
            "MAX(m.release_date) AS releaseDate, MAX(m.vote_average) AS voteAverage, " +
            "MAX(m.budget) AS budget, MAX(m.revenue) AS revenue, MAX(m.poster_path) AS posterPath, " +
            "(SELECT GROUP_CONCAT(DISTINCT genre_name SEPARATOR ', ') FROM movie_genres_map WHERE movie_id = m.id) AS genres " +
            "FROM movie_info m " +
            "GROUP BY m.id " +
            "ORDER BY MAX(m.vote_average) DESC LIMIT #{limit}")
    List<MovieInfo> getTopRated(@Param("limit") Integer limit);

    @Insert("INSERT INTO movie_info(title, original_language, overview, release_date, budget, revenue, runtime, vote_average, poster_path) " +
            "VALUES(#{title}, #{originalTitle}, #{overview}, #{releaseDate}, #{budget}, #{revenue}, #{duration}, #{voteAverage}, #{posterPath})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(MovieInfo movie);

    @Update("UPDATE movie_info SET title=#{title}, original_language=#{originalTitle}, overview=#{overview}, " +
            "release_date=#{releaseDate}, budget=#{budget}, revenue=#{revenue}, runtime=#{duration}, " +
            "vote_average=#{voteAverage}, poster_path=#{posterPath} " +
            "WHERE id=#{id}")
    int update(MovieInfo movie);

    @Delete("DELETE FROM movie_info WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    @Select("SELECT DISTINCT genre_name FROM movie_genres_map WHERE genre_name IS NOT NULL")
    List<String> getAllGenres();
}