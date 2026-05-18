package com.moviex.dto;

import java.util.List;

public record ResidualModelResponse(
    int n,
    double r2,
    double residualMean,
    double residualStd,
    List<HistBin> histogram,
    List<Coef> coefficients,
    String definition) {

  public record HistBin(double from, double to, int count) {}

  public record Coef(String name, double coef) {}
}
