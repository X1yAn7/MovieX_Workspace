package com.moviex.entity;

import lombok.Data;

@Data
public class KgEdgeRow {
  private String source;
  private String target;
  private String rel;
  private Double weight;
  private String edgeDesc;
}
