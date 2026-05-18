package com.moviex.controller;

import com.moviex.common.QueryInts;
import com.moviex.dto.RatingsVsTmdbResponse;
import com.moviex.service.RatingsVsTmdbService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RatingsVsTmdbController {

  private final RatingsVsTmdbService ratingsVsTmdbService;

  @GetMapping("/api/ratings/vs-tmdb")
  public RatingsVsTmdbResponse vsTmdb(
      @RequestParam(required = false) String limit,
      @RequestParam(required = false) String minCount) {
    int lim = QueryInts.parse(limit, 12, 1, 50);
    int min = QueryInts.parse(minCount, 5, 1, 10_000);
    return ratingsVsTmdbService.build(lim, min);
  }
}
