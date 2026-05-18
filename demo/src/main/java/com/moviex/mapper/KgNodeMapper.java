package com.moviex.mapper;

import com.moviex.entity.KgNodeRow;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface KgNodeMapper {

  @Select(
      """
      SELECT node_id AS nodeId, IFNULL(label,'') AS label, IFNULL(`type`,'') AS type,
        IFNULL(size_score, 0) AS sizeScore,
        IFNULL(CAST(year AS CHAR), '') AS year,
        IFNULL(CAST(vote_average AS CHAR), '') AS voteAverage
      FROM movie_dashboard_kg_node
      """)
  List<KgNodeRow> listAll();
}
