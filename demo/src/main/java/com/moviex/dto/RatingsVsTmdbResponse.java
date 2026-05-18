package com.moviex.dto;

import java.util.List;

public record RatingsVsTmdbResponse(
    List<RatingRow> platformHigher,
    List<RatingRow> platformLower,
    Meta meta) {

  public record Meta(int limit, int minCount, String scaleNote) {}

  public record RatingRow(
      String movieId,
      String title,
      Integer releaseYear,
      double userAvg,
      double userAvgOnTen,
      double tmdbAvg,
      double delta,
      long ratingCount) {}
}
