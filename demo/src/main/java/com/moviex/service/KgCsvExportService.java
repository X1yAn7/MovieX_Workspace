package com.moviex.service;

import com.moviex.entity.KgEdgeRow;
import com.moviex.entity.KgNodeRow;
import com.moviex.mapper.KgEdgeMapper;
import com.moviex.mapper.KgNodeMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KgCsvExportService {

  private final KgNodeMapper nodeMapper;
  private final KgEdgeMapper edgeMapper;

  /** UTF-8 BOM + 节点 CSV，列名与原 kg_nodes 一致 */
  public String nodesCsvUtf8WithBom() {
    List<KgNodeRow> rows = nodeMapper.listAll();
    StringBuilder sb = new StringBuilder("\uFEFF");
    sb.append("node_id,label,type,size_score,year,vote_average\n");
    for (KgNodeRow r : rows) {
      sb.append(esc(r.getNodeId()))
          .append(',')
          .append(esc(r.getLabel()))
          .append(',')
          .append(esc(r.getType()))
          .append(',')
          .append(esc(r.getSizeScore() == null ? "" : String.valueOf(r.getSizeScore())))
          .append(',')
          .append(esc(r.getYear()))
          .append(',')
          .append(esc(r.getVoteAverage()))
          .append('\n');
    }
    return sb.toString();
  }

  public String edgesCsvUtf8WithBom() {
    List<KgEdgeRow> rows = edgeMapper.listAll();
    StringBuilder sb = new StringBuilder("\uFEFF");
    sb.append("source,target,rel,weight,desc\n");
    for (KgEdgeRow r : rows) {
      double w = r.getWeight() == null ? 1 : r.getWeight();
      sb.append(esc(r.getSource()))
          .append(',')
          .append(esc(r.getTarget()))
          .append(',')
          .append(esc(r.getRel()))
          .append(',')
          .append(esc(String.valueOf(w)))
          .append(',')
          .append(esc(r.getEdgeDesc() == null ? "" : r.getEdgeDesc()))
          .append('\n');
    }
    return sb.toString();
  }

  private static String esc(String s) {
    if (s == null) return "";
    boolean needQuote = s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0;
    if (!needQuote) return s;
    return "\"" + s.replace("\"", "\"\"") + "\"";
  }
}
