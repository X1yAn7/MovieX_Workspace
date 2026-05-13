package com.moviex.mapper;

import com.moviex.entity.Review;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ReviewMapper {

    @Select("SELECT r.*, u.nickname as user_name, u.avatar as user_avatar, m.title as movie_title " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "WHERE r.id = #{id}")
    Review getById(@Param("id") Integer id);

    @Select("SELECT r.*, u.nickname as user_name, u.avatar as user_avatar, m.title as movie_title " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "WHERE r.movie_id = #{movieId} " +
            "ORDER BY r.create_time DESC LIMIT #{offset}, #{pageSize}")
    List<Review> getByMovieId(@Param("movieId") Integer movieId,
                              @Param("offset") Integer offset,
                              @Param("pageSize") Integer pageSize);

    @Select("SELECT COUNT(*) FROM review WHERE movie_id = #{movieId}")
    Long countByMovieId(@Param("movieId") Integer movieId);

    @Select("SELECT r.*, u.nickname as user_name, u.avatar as user_avatar, m.title as movie_title " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "WHERE r.user_id = #{userId} " +
            "ORDER BY r.create_time DESC LIMIT #{offset}, #{pageSize}")
    List<Review> getByUserId(@Param("userId") Integer userId,
                             @Param("offset") Integer offset,
                             @Param("pageSize") Integer pageSize);

    @Select("SELECT COUNT(*) FROM review WHERE user_id = #{userId}")
    Long countByUserId(@Param("userId") Integer userId);

    @Select("SELECT r.*, u.nickname as user_name, u.avatar as user_avatar, m.title as movie_title " +
            "FROM review r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "LEFT JOIN movie_info m ON r.movie_id = m.id " +
            "ORDER BY r.create_time DESC LIMIT #{limit}")
    List<Review> getLatest(@Param("limit") Integer limit);

    @Insert("INSERT INTO review(user_id, movie_id, rating, content, sentiment, create_time) " +
            "VALUES(#{userId}, #{movieId}, #{rating}, #{content}, #{sentiment}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Review review);

    @Update("UPDATE review SET rating=#{rating}, content=#{content}, sentiment=#{sentiment} WHERE id=#{id}")
    int update(Review review);

    @Delete("DELETE FROM review WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    @Select("SELECT ROUND(AVG(rating), 2) FROM review WHERE movie_id = #{movieId}")
    Double getAverageRating(@Param("movieId") Integer movieId);
}
