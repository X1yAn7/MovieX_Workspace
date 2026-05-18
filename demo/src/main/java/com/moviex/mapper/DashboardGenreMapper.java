package com.moviex.mapper;

import com.moviex.entity.GenreMapRow;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DashboardGenreMapper {

  @Select(
      """
      SELECT CAST(movie_id AS CHAR) AS movieId, genre_name AS genreName
      FROM movie_dashboard_genres_map
      """)
  List<GenreMapRow> listAll();
}
