package com.moviex.mapper;

import com.moviex.entity.MovieIdCount;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MovieCastMapper {

  /**
   * 每部电影取「前 7 条 cast 记录」计数（按 cast_id 排序），兼容无 cast_order 列的导入表。
   */
  @Select(
      """
      SELECT CAST(movie_id AS CHAR) AS movieId, COUNT(*) AS cnt
      FROM (
        SELECT movie_id,
               ROW_NUMBER() OVER (PARTITION BY movie_id ORDER BY cast_id) AS rn
        FROM movie_cast
        WHERE movie_id IS NOT NULL
      ) t
      WHERE rn < 8
      GROUP BY movie_id
      """)
  List<MovieIdCount> countTopBillingByMovie();
}
