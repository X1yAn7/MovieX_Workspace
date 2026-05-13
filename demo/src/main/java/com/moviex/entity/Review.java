package com.moviex.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户评论实体
 * 存储用户对电影的评分和评论内容
 */
@Data
public class Review {
    /** 评论ID */
    private Integer id;
    
    /** 用户ID */
    private Integer userId;
    
    /** 电影ID */
    private Integer movieId;
    
    /** 评分（0-10分） */
    private Double rating;
    
    /** 评论内容 */
    private String content;
    
    /** 情感分析结果（Positive积极/Neutral中性/Analytical分析性/Critical批判性） */
    private String sentiment;
    
    /** 评论创建时间 */
    private LocalDateTime createTime;

    // ========== 以下字段用于关联查询时填充 ==========
    
    /** 用户名（关联查询字段，非数据库表字段） */
    private String userName;
    
    /** 用户头像（关联查询字段，非数据库表字段） */
    private String userAvatar;
    
    /** 电影标题（关联查询字段，非数据库表字段） */
    private String movieTitle;
}
