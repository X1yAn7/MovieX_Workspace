package com.moviex.entity;

import lombok.Data;

/**
 * 全局统计指标实体
 * 用于展示电影数据的总体概览信息
 */
@Data
public class GlobalMetrics {
    /** 电影总数 */
    private Integer totalMovies;
    
    /** 总票房收入（单位：元） */
    private Long totalRevenue;
    
    /** 总预算成本（单位：元） */
    private Long totalBudget;
    
    /** 平均评分 */
    private Double averageRating;
}
