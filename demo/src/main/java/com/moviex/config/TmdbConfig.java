package com.moviex.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "tmdb")
public class TmdbConfig {
    private String apiKey;
    private String imageBaseUrl;
}