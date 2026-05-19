package com.moviex.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * 商业四象限：转发到 Python 服务进行大数据计算
 */
@RestController
public class BoxOfficeQuadrantController {

    private final RestTemplate rest = new RestTemplate();

    @GetMapping("/api/analysis/box-office-quadrant")
    public Map quadrant(
            @RequestParam(required = false) String yearFrom,
            @RequestParam(required = false) String yearTo,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String minVotes) {
        int yf = parseInt(yearFrom, 1980);
        int yt = parseInt(yearTo, 2020);
        int mv = parseInt(minVotes, 30);
        String url = String.format(
                "http://localhost:8000/api/analysis/box-office-quadrant?yearFrom=%d&yearTo=%d&genre=%s&minVotes=%d",
                yf, yt, genre == null ? "" : genre, mv);
        return rest.getForObject(url, Map.class);
    }

    private int parseInt(String v, int def) {
        if (v == null || v.isBlank()) return def;
        try { return Integer.parseInt(v.trim()); } catch (NumberFormatException e) { return def; }
    }
}
