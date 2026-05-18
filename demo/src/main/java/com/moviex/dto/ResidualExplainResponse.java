package com.moviex.dto;

import java.util.List;

public record ResidualExplainResponse(
    String movieId,
    String title,
    Integer year,
    double voteAverage,
    double revenue,
    double budget,
    double actualLogRevenue,
    double predictedLogRevenue,
    double residual,
    double r2,
    List<Factor> factors,
    String note) {

  public record Factor(String name, double contribution, double pct) {}
}
