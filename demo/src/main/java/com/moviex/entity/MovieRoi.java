package com.moviex.entity;

import lombok.Data;

/**
 * 电影投资回报率(ROI)分析实体
 * 用于分析电影的盈利能力和投资效益
 */
@Data
public class MovieRoi {
    /** 电影ID */
    private Integer movieId;
    
    /** 电影标题 */
    private String title;
    
    /** 制作预算（单位：元） */
    private Long budget;
    
    /** 票房收入（单位：元） */
    private Long revenue;
    
    /** 利润（收入-预算，单位：元） */
    private Long profit;
    
    /** 投资回报率（百分比，ROI = 利润/预算 * 100%） */
    private Double roiRatio;
    
    /** 海报图片路径 */
    private String posterPath;
}
