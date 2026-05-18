package com.moviex.mapper;

import com.moviex.entity.MovieDashboardMeta;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DashboardMovieMapper {

  @Select(
      """
      SELECT CAST(id AS CHAR) AS id, title,
        IFNULL(DATE_FORMAT(release_date, '%Y-%m-%d'), '') AS releaseDate,
        budget, revenue, vote_average AS voteAverage, vote_count AS voteCount,
        runtime, popularity,
        IFNULL(CAST(belongs_to_collection_id AS CHAR), '') AS belongsToCollectionId
      FROM movie_dashboard_meta
      """)
  List<MovieDashboardMeta> listAll();
}
