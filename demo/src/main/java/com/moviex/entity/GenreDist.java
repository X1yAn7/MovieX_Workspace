package com.moviex.entity;

import lombok.Data;

/**
 * 电影类型分布统计实体
 * 用于统计不同类型电影的數量分布
 */
@Data
public class GenreDist {
    /** 类型名称（如：动作、喜剧、爱情等） */
    private String genreName;
    
    /** 该类型下的电影数量 */
    private Integer movieCount;
}
