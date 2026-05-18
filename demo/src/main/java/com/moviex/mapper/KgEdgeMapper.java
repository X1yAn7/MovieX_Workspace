package com.moviex.mapper;

import com.moviex.entity.KgEdgeRow;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface KgEdgeMapper {

  @Select(
      """
      SELECT `source` AS source, `target` AS target, rel, IFNULL(weight, 1) AS weight,
        IFNULL(edge_desc,'') AS edgeDesc
      FROM movie_dashboard_kg_edge
      """)
  List<KgEdgeRow> listAll();
}
