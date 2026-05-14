package com.moviex.mapper;

import com.moviex.entity.Review;
import org.apache.ibatis.annotations.*;
import java.util.List;

/**
 * ReviewMapper - 优化后的评论数据访问层
 * 
 * 索引优化策略：
 * 1. review表建议创建以下索引：
 *    - idx_movie_id_create_time (movie_id, create_time DESC) - 优化按电影查询评论
 *    - idx_user_id_create_time (user_id, create_time DESC) - 优化按用户查询评论
 *    - idx_create_time (create_time DESC) - 优化最新评论查询
 *    - idx_rating_create_time (rating DESC, create_time DESC) - 优化热评查询
 *    - idx_movie_id_rating (movie_id, rating) - 优化平均评分查询
 */
@Mapper
public interface ReviewMapper {

    /**
     * 根据ID查询评论（主键查询，O(1)复杂度）
     */
    @Select("SELECT r.*, u.nickname as user_name, u.avatar as user_avatar, m.title as movie_title, m.poster_path AS movie_poster " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "WHERE r.id = #{id}")
    Review getById(@Param("id") Integer id);

    /**
     * 按电影ID分页查询评论
     * 优化：使用复合索引 idx_movie_id_create_time 可直接获取排序结果，避免filesort
     */
    @Select("<script>" +
            "SELECT r.id, r.user_id, r.movie_id, r.rating, r.content, r.sentiment, r.create_time, " +
            "       u.nickname as user_name, u.avatar as user_avatar, " +
            "       m.title as movie_title, m.poster_path as movie_poster " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "WHERE r.movie_id = #{movieId} " +
            "ORDER BY r.create_time DESC " +
            "<if test='offset != null and pageSize != null'>" +
            "LIMIT #{offset}, #{pageSize}" +
            "</if>" +
            "</script>")
    List<Review> getByMovieId(@Param("movieId") Integer movieId,
                              @Param("offset") Integer offset,
                              @Param("pageSize") Integer pageSize);

    /**
     * 统计电影评论数（使用覆盖索引，避免回表）
     */
    @Select("SELECT COUNT(*) FROM review WHERE movie_id = #{movieId}")
    Long countByMovieId(@Param("movieId") Integer movieId);

    /**
     * 按用户ID分页查询评论
     * 优化：使用复合索引 idx_user_id_create_time
     */
    @Select("SELECT r.id, r.user_id, r.movie_id, r.rating, r.content, r.sentiment, r.create_time, " +
            "       u.nickname as user_name, u.avatar as user_avatar, " +
            "       m.title as movie_title, m.poster_path as movie_poster " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "WHERE r.user_id = #{userId} " +
            "ORDER BY r.create_time DESC LIMIT #{offset}, #{pageSize}")
    List<Review> getByUserId(@Param("userId") Integer userId,
                             @Param("offset") Integer offset,
                             @Param("pageSize") Integer pageSize);

    /**
     * 统计用户评论数
     */
    @Select("SELECT COUNT(*) FROM review WHERE user_id = #{userId}")
    Long countByUserId(@Param("userId") Integer userId);

    /**
     * 获取最新评论
     * 优化：使用索引 idx_create_time，避免全表扫描排序
     */
    @Select("SELECT r.id, r.user_id, r.movie_id, r.rating, r.content, r.sentiment, r.create_time, " +
            "       u.nickname as user_name, u.avatar as user_avatar, " +
            "       m.title as movie_title, m.poster_path as movie_poster " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "ORDER BY r.create_time DESC LIMIT #{limit}")
    List<Review> getLatest(@Param("limit") Integer limit);

        /**
     * 获取热门评论（按评分排序）
     * 优化：使用复合索引 idx_rating_create_time
     */
    @Select("SELECT r.id, r.user_id, r.movie_id, r.rating, r.content, r.sentiment, r.create_time, " +
            "       u.nickname as user_name, u.avatar as user_avatar, " +
            "       m.title as movie_title, m.poster_path as movie_poster " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "ORDER BY r.rating DESC, r.create_time DESC LIMIT #{limit}")
    List<Review> getHotReviews(@Param("limit") Integer limit);
    /**
     * 插入评论（返回自增ID）
     */
    @Insert("INSERT INTO review(user_id, movie_id, rating, content, sentiment, create_time) " +
            "VALUES(#{userId}, #{movieId}, #{rating}, #{content}, #{sentiment}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Review review);

    /**
     * 更新评论
     */
    @Update("UPDATE review SET rating=#{rating}, content=#{content}, sentiment=#{sentiment}, update_time=NOW() WHERE id=#{id}")
    int update(Review review);

    /**
     * 删除评论
     */
    @Delete("DELETE FROM review WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    /**
     * 获取电影平均评分
     * 优化：使用索引 idx_movie_id_rating，避免全表扫描
     */
    @Select("SELECT IFNULL(ROUND(AVG(rating), 2), 0.0) FROM review WHERE movie_id = #{movieId}")
    Double getAverageRating(@Param("movieId") Integer movieId);

    /**
     * 批量插入评论（用于数据迁移或批量操作）
     */
    @Insert("<script>" +
            "INSERT INTO review(user_id, movie_id, rating, content, sentiment, create_time) VALUES " +
            "<foreach collection='list' item='item' separator=','>" +
            "(#{item.userId}, #{item.movieId}, #{item.rating}, #{item.content}, #{item.sentiment}, NOW())" +
            "</foreach>" +
            "</script>")
    int batchInsert(@Param("list") List<Review> reviews);
}