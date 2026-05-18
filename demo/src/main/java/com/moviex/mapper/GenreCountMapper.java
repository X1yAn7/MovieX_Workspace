package com.moviex.mapper;

import com.moviex.entity.MovieIdCount;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface GenreCountMapper {

  @Select(
      """
      SELECT CAST(movie_id AS CHAR) AS movieId, COUNT(*) AS cnt
      FROM movie_dashboard_genres_map
      GROUP BY movie_id
      """)
  List<MovieIdCount> countPerMovie();
}
