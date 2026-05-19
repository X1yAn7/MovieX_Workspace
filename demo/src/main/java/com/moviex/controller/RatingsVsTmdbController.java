package com.moviex.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
public class RatingsVsTmdbController {

    private final RestTemplate rest = new RestTemplate();

    @GetMapping("/api/ratings/vs-tmdb")
    public Map vsTmdb(
            @RequestParam(required = false) String limit,
            @RequestParam(required = false) String minCount) {
        int lim = parseInt(limit, 12, 1, 50);
        int min = parseInt(minCount, 5, 1, 10_000);
        return rest.getForObject(
                "http://localhost:8000/api/ratings/vs-tmdb?limit=" + lim + "&minCount=" + min,
                Map.class);
    }

    private int parseInt(String v, int def, int min, int max) {
        if (v == null || v.isBlank()) return def;
        try {
            int n = Integer.parseInt(v.trim());
            return Math.min(max, Math.max(min, n));
        } catch (NumberFormatException e) { return def; }
    }
}
