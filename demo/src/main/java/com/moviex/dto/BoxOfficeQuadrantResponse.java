package com.moviex.dto;

import java.util.List;

public record BoxOfficeQuadrantResponse(
    List<QuadrantPoint> points,
    QuadrantMedians medians,
    List<String> genreOptions,
    QuadrantMeta meta) {

  public record QuadrantMedians(double roiLog, double voteAverage) {}

  public record QuadrantMeta(int yearFrom, int yearTo, String genre, int minVotes) {}

  public record QuadrantPoint(
      String id,
      String title,
      int year,
      double voteAverage,
      long voteCount,
      double budget,
      double revenue,
      double roi,
      double roiLog,
      List<String> genres) {}
}
