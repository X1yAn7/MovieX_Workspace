package com.moviex.controller;

import com.moviex.common.QueryInts;
import com.moviex.dto.ResidualExplainResponse;
import com.moviex.dto.ResidualModelResponse;
import com.moviex.dto.ResidualRankingsResponse;
import com.moviex.service.ResidualAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ResidualAnalysisController {

  private final ResidualAnalysisService residualAnalysisService;

  @GetMapping("/api/analysis/residual-model")
  public ResidualModelResponse residualModel(@RequestParam(required = false) String refresh) {
    return residualAnalysisService.model("1".equals(refresh));
  }

  @GetMapping("/api/analysis/residual-rankings")
  public ResidualRankingsResponse residualRankings(@RequestParam(required = false) String limit) {
    int lim = QueryInts.parse(limit, 12, 1, 50);
    return residualAnalysisService.rankings(lim);
  }

  @GetMapping("/api/analysis/residual-explain")
  public ResidualExplainResponse residualExplain(@RequestParam(required = false) String movieId) {
    return residualAnalysisService.explain(movieId);
  }
}
