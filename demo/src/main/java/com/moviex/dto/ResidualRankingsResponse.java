package com.moviex.dto;

import java.util.List;

public record ResidualRankingsResponse(List<RankRow> overPerformers, List<RankRow> underPerformers) {

  public record RankRow(
      String movieId,
      String title,
      Integer year,
      double voteAverage,
      double revenue,
      double budget,
      double logRevenue,
      double predictedLogRevenue,
      double residual) {}
}
