package com.moviex.mapper;

import com.moviex.entity.User;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM sys_user WHERE id = #{id}")
    User getById(@Param("id") Integer id);

    @Select("SELECT * FROM sys_user WHERE username = #{username}")
    User getByUsername(@Param("username") String username);

    @Select("SELECT * FROM sys_user ORDER BY create_time DESC LIMIT #{offset}, #{pageSize}")
    List<User> listUsers(@Param("offset") Integer offset, @Param("pageSize") Integer pageSize);

    @Select("SELECT COUNT(*) FROM sys_user")
    Long countUsers();

    @Select("<script>" +
            "SELECT * FROM sys_user " +
            "<where>" +
            "  <if test='keyword != null and keyword != \"\"'>" +
            "    AND (username LIKE CONCAT('%',#{keyword},'%') OR nickname LIKE CONCAT('%',#{keyword},'%'))" +
            "  </if>" +
            "  <if test='role != null and role != \"\"'>" +
            "    AND role = #{role}" +
            "  </if>" +
            "  <if test='status != null'>" +
            "    AND status = #{status}" +
            "  </if>" +
            "</where>" +
            "ORDER BY create_time DESC LIMIT #{offset}, #{pageSize}" +
            "</script>")
    List<User> search(@Param("keyword") String keyword,
                      @Param("role") String role,
                      @Param("status") Integer status,
                      @Param("offset") Integer offset,
                      @Param("pageSize") Integer pageSize);

    @Select("<script>" +
            "SELECT COUNT(*) FROM sys_user " +
            "<where>" +
            "  <if test='keyword != null and keyword != \"\"'>" +
            "    AND (username LIKE CONCAT('%',#{keyword},'%') OR nickname LIKE CONCAT('%',#{keyword},'%'))" +
            "  </if>" +
            "  <if test='role != null and role != \"\"'>" +
            "    AND role = #{role}" +
            "  </if>" +
            "  <if test='status != null'>" +
            "    AND status = #{status}" +
            "  </if>" +
            "</where>" +
            "</script>")
    Long searchCount(@Param("keyword") String keyword,
                     @Param("role") String role,
                     @Param("status") Integer status);

    @Insert("INSERT INTO sys_user(username, password, nickname, avatar, email, role, status, create_time, update_time) " +
            "VALUES(#{username}, #{password}, #{nickname}, #{avatar}, #{email}, #{role}, #{status}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Update("UPDATE sys_user SET nickname=#{nickname}, avatar=#{avatar}, email=#{email}, " +
            "role=#{role}, status=#{status}, update_time=NOW() WHERE id=#{id}")
    int update(User user);

    @Update("UPDATE sys_user SET password=#{password}, update_time=NOW() WHERE id=#{id}")
    int updatePassword(@Param("id") Integer id, @Param("password") String password);

    @Delete("DELETE FROM sys_user WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);
}
