package com.moviex.entity;

import lombok.Data;

/**
 * 电影评分分布统计实体
 * 用于统计不同评分区间的电影数量分布
 */
@Data
public class RatingDist {
    /** 评分区间（如：9-10分、8-9分等） */
    private String ratingRange;
    
    /** 该评分区间内的电影数量 */
    private Integer movieCount;
}
