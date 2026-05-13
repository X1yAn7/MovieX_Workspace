package com.moviex.entity;

import lombok.Data;
import java.time.LocalDate;

/**
 * 电影详细信息实体
 * 包含电影的基本信息、制作信息、评价信息等完整数据
 */
@Data
public class MovieInfo {
    /** 电影ID */
    private Integer id;
    
    /** 电影标题（中文） */
    private String title;
    
    /** 原始标题（外文） */
    private String originalTitle;
    
    /** 剧情简介 */
    private String overview;
    
    /** 类型列表（多个类型用逗号分隔） */
    private String genres;
    
    /** 导演 */
    private String director;
    
    /** 编剧 */
    private String writers;
    
    /** 演员阵容 */
    private String cast;
    
    /** 片长（分钟） */
    private String duration;
    
    /** 上映日期 */
    private LocalDate releaseDate;
    
    /** 上映地区 */
    private String regions;
    
    /** 海报图片路径 */
    private String posterPath;
    
    /** 背景图片路径 */
    private String backdropPath;
    
    /** 平均评分（0-10分） */
    private Double voteAverage;
    
    /** 评分人数 */
    private Integer voteCount;
    
    /** 热度指数 */
    private Double popularity;
    
    /** 制作预算（单位：元） */
    private Long budget;
    
    /** 票房收入（单位：元） */
    private Long revenue;
    
    /** 电影状态（已上映/制作中/计划中等） */
    private String status;
    
    /** 关键词标签 */
    private String keywords;
}
