package com.moviex.controller;

import com.moviex.common.QueryInts;
import com.moviex.dto.BoxOfficeQuadrantResponse;
import com.moviex.service.BoxOfficeQuadrantService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class BoxOfficeQuadrantController {

  private final BoxOfficeQuadrantService boxOfficeQuadrantService;

  @GetMapping("/api/analysis/box-office-quadrant")
  public BoxOfficeQuadrantResponse quadrant(
      @RequestParam(required = false) String yearFrom,
      @RequestParam(required = false) String yearTo,
      @RequestParam(required = false) String genre,
      @RequestParam(required = false) String minVotes) {
    int yf = QueryInts.parse(yearFrom, 1980, 1900, 2035);
    int yt = QueryInts.parse(yearTo, 2020, 1900, 2035);
    int mv = QueryInts.parse(minVotes, 30, 0, 1_000_000);
    return boxOfficeQuadrantService.build(yf, yt, genre == null ? "" : genre, mv);
  }
}
