package com.moviex.mapper;

import com.moviex.entity.RatingMlAggRow;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface RatingMlMapper {

  @Select(
      """
      SELECT CAST(movie_id AS CHAR) AS movieId,
        SUM(rating) AS ratingSum, COUNT(*) AS cnt
      FROM movie_dashboard_rating_ml
      GROUP BY movie_id
      HAVING cnt >= #{minCount}
      """)
  List<RatingMlAggRow> aggregatesFromRaw(@Param("minCount") int minCount);
}
