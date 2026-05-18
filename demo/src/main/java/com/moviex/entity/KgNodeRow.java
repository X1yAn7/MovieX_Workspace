package com.moviex.entity;

import lombok.Data;

@Data
public class KgNodeRow {
  private String nodeId;
  private String label;
  /** kg 节点的 type，对应 CSV 列名 type */
  private String type;
  private Double sizeScore;
  private String year;
  private String voteAverage;
}
