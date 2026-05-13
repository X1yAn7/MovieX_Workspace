package com.moviex.mapper;

import com.moviex.entity.MovieInfo;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface MovieMapper {

    @Select("SELECT * FROM movie_info WHERE id = #{id}")
    MovieInfo getById(@Param("id") Integer id);

    @Select("<script>" +
            "SELECT * FROM movie_info " +
            "<where>" +
            "  <if test='title != null and title != \"\"'>" +
            "    AND title LIKE CONCAT('%', #{title}, '%')" +
            "  </if>" +
            "  <if test='genre != null and genre != \"\"'>" +
            "    AND genres LIKE CONCAT('%', #{genre}, '%')" +
            "  </if>" +
            "  <if test='minRating != null'>" +
            "    AND vote_average &gt;= #{minRating}" +
            "  </if>" +
            "  <if test='maxRating != null'>" +
            "    AND vote_average &lt;= #{maxRating}" +
            "  </if>" +
            "  <if test='year != null'>" +
            "    AND YEAR(release_date) = #{year}" +
            "  </if>" +
            "  <if test='minBudget != null'>" +
            "    AND budget &gt;= #{minBudget}" +
            "  </if>" +
            "  <if test='maxBudget != null'>" +
            "    AND budget &lt;= #{maxBudget}" +
            "  </if>" +
            "</where>" +
            "ORDER BY ${orderBy} ${orderDir} " +
            "LIMIT #{offset}, #{pageSize}" +
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

    @Select("<script>" +
            "SELECT COUNT(*) FROM movie_info " +
            "<where>" +
            "  <if test='title != null and title != \"\"'>" +
            "    AND title LIKE CONCAT('%', #{title}, '%')" +
            "  </if>" +
            "  <if test='genre != null and genre != \"\"'>" +
            "    AND genres LIKE CONCAT('%', #{genre}, '%')" +
            "  </if>" +
            "  <if test='minRating != null'>" +
            "    AND vote_average &gt;= #{minRating}" +
            "  </if>" +
            "  <if test='maxRating != null'>" +
            "    AND vote_average &lt;= #{maxRating}" +
            "  </if>" +
            "  <if test='year != null'>" +
            "    AND YEAR(release_date) = #{year}" +
            "  </if>" +
            "  <if test='minBudget != null'>" +
            "    AND budget &gt;= #{minBudget}" +
            "  </if>" +
            "  <if test='maxBudget != null'>" +
            "    AND budget &lt;= #{maxBudget}" +
            "  </if>" +
            "</where>" +
            "</script>")
    Long searchCount(@Param("title") String title,
                     @Param("genre") String genre,
                     @Param("minRating") Double minRating,
                     @Param("maxRating") Double maxRating,
                     @Param("year") Integer year,
                     @Param("minBudget") Long minBudget,
                     @Param("maxBudget") Long maxBudget);

    @Select("SELECT * FROM movie_info ORDER BY popularity DESC LIMIT #{limit}")
    List<MovieInfo> getTopPopular(@Param("limit") Integer limit);

    @Select("SELECT * FROM movie_info ORDER BY vote_average DESC LIMIT #{limit}")
    List<MovieInfo> getTopRated(@Param("limit") Integer limit);

    @Insert("INSERT INTO movie_info(title, original_title, overview, genres, director, writers, " +
            "`cast`, duration, release_date, regions, poster_path, backdrop_path, " +
            "vote_average, vote_count, popularity, budget, revenue, status, keywords) " +
            "VALUES(#{title}, #{originalTitle}, #{overview}, #{genres}, #{director}, #{writers}, " +
            "#{cast}, #{duration}, #{releaseDate}, #{regions}, #{posterPath}, #{backdropPath}, " +
            "#{voteAverage}, #{voteCount}, #{popularity}, #{budget}, #{revenue}, #{status}, #{keywords})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(MovieInfo movie);

    @Update("UPDATE movie_info SET title=#{title}, original_title=#{originalTitle}, " +
            "overview=#{overview}, genres=#{genres}, director=#{director}, writers=#{writers}, " +
            "`cast`=#{cast}, duration=#{duration}, release_date=#{releaseDate}, regions=#{regions}, " +
            "poster_path=#{posterPath}, backdrop_path=#{backdropPath}, " +
            "vote_average=#{voteAverage}, vote_count=#{voteCount}, popularity=#{popularity}, " +
            "budget=#{budget}, revenue=#{revenue}, status=#{status}, keywords=#{keywords} " +
            "WHERE id=#{id}")
    int update(MovieInfo movie);

    @Delete("DELETE FROM movie_info WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    @Select("SELECT DISTINCT genres FROM movie_info WHERE genres IS NOT NULL AND genres != ''")
    List<String> getAllGenres();
}
