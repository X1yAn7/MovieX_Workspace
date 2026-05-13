package com.moviex.controller;

import com.moviex.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/tmdb")
public class TmdbController {

    // 直接读取你 application.yml 中配置的 api-key
    @Value("${tmdb.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/config")
    public Result<String> getConfig() {
        try {
            // 直接请求 TMDB 官方 Configuration 接口
            String url = "https://api.themoviedb.org/3/configuration?api_key=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("images")) {
                Map<String, Object> images = (Map<String, Object>) response.get("images");
                // 提取最安全的 secure_base_url (https协议)
                String secureBaseUrl = (String) images.get("secure_base_url");
                return Result.success(secureBaseUrl);
            }
        } catch (Exception e) {
            System.err.println("TMDB 配置获取失败: " + e.getMessage());
        }
        // 如果官方接口连不上，返回一个默认的保底 BaseURL
        return Result.success("https://image.tmdb.org/t/p/");
    }
}