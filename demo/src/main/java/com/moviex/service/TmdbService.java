package com.moviex.service;

import com.moviex.config.TmdbConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
public class TmdbService {

    @Autowired
    private TmdbConfig tmdbConfig;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 根据 TMDB ID 获取最新的海报路径
     */
    public String getLatestPosterPath(Integer tmdbId) {
        try {
            String url = String.format("https://api.themoviedb.org/3/movie/%d?api_key=%s",
                    tmdbId, tmdbConfig.getApiKey());
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("poster_path")) {
                return (String) response.get("poster_path");
            }
        } catch (Exception e) {
            // 记录日志，防止接口报错导致系统崩溃
            System.err.println("TMDB API 调用失败: " + e.getMessage());
        }
        return null;
    }
}