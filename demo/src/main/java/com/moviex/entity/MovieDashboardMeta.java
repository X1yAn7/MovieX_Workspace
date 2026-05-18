package com.moviex.entity;

import lombok.Data;

@Data
public class MovieDashboardMeta {
  private String id;
  private String title;
  /** yyyy-MM-dd 或空 */
  private String releaseDate;
  private Double budget;
  private Double revenue;
  private Double voteAverage;
  private Long voteCount;
  private Double runtime;
  private Double popularity;
  private String belongsToCollectionId;
}
