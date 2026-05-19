package com.moviex.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
public class ResidualAnalysisController {

    private final RestTemplate rest = new RestTemplate();
    private final String BASE = "http://localhost:8000";

    @GetMapping("/api/analysis/residual-model")
    public Map residualModel(@RequestParam(required = false) String refresh) {
        return rest.getForObject(BASE + "/api/analysis/residual-model?refresh=" + ("1".equals(refresh) ? "1" : "0"), Map.class);
    }

    @GetMapping("/api/analysis/residual-rankings")
    public Map residualRankings(@RequestParam(required = false) String limit) {
        int lim = parseInt(limit, 12, 1, 50);
        return rest.getForObject(BASE + "/api/analysis/residual-rankings?limit=" + lim, Map.class);
    }

    @GetMapping("/api/analysis/residual-explain")
    public Map residualExplain(@RequestParam(required = false) String movieId) {
        return rest.getForObject(BASE + "/api/analysis/residual-explain?movieId=" + (movieId == null ? "" : movieId), Map.class);
    }

    private int parseInt(String v, int def, int min, int max) {
        if (v == null || v.isBlank()) return def;
        try {
            int n = Integer.parseInt(v.trim());
            return Math.min(max, Math.max(min, n));
        } catch (NumberFormatException e) { return def; }
    }
}
