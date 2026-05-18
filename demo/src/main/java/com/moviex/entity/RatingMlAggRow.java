package com.moviex.entity;

import lombok.Data;

@Data
public class RatingMlAggRow {
  private String movieId;
  private Double ratingSum;
  private Long cnt;
}
