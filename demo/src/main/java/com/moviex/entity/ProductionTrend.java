package com.moviex.entity;

import lombok.Data;

/**
 * 电影制作趋势统计实体
 * 用于分析每年电影产量的变化趋势
 */
@Data
public class ProductionTrend {
    /** 年份 */
    private Integer year;
    
    /** 该年份的电影产量 */
    private Integer count;
    
    /** 同比增长率（百分比） */
    private Double growth;
}
