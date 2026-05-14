package com.moviex.mapper;

import com.moviex.entity.User;
import org.apache.ibatis.annotations.*;
import java.util.List;

/**
 * UserMapper - 优化后的用户数据访问层
 * 
 * 索引优化策略：
 * 1. sys_user表建议创建以下索引：
 *    - idx_username (username) - 唯一索引，用于登录查询
 *    - idx_role_status (role, status) - 优化角色和状态筛选
 *    - idx_create_time (create_time DESC) - 优化分页排序
 *    - FULLTEXT INDEX ft_username_nickname (username, nickname) - 优化全文搜索
 * 
 * 查询优化：
 * 1. 使用覆盖索引减少回表
 * 2. 全文搜索替代LIKE模糊查询
 * 3. 游标分页优化大数据量分页
 */
@Mapper
public interface UserMapper {

    /**
     * 根据ID查询用户（主键查询，O(1)复杂度）
     */
    @Select("SELECT id, username, nickname, avatar, email, role, status, create_time, update_time " +
            "FROM sys_user WHERE id = #{id}")
    User getById(@Param("id") Integer id);

    /**
     * 根据用户名查询用户（唯一索引查询，O(log n)复杂度）
     */
    @Select("SELECT id, username, password, nickname, avatar, email, role, status, create_time, update_time " +
            "FROM sys_user WHERE username = #{username}")
    User getByUsername(@Param("username") String username);

    /**
     * 分页查询用户列表
     * 优化：使用索引 idx_create_time 避免排序
     */
    @Select("SELECT id, username, nickname, avatar, email, role, status, create_time, update_time " +
            "FROM sys_user ORDER BY create_time DESC LIMIT #{offset}, #{pageSize}")
    List<User> listUsers(@Param("offset") Integer offset, @Param("pageSize") Integer pageSize);

    /**
     * 统计用户总数
     */
    @Select("SELECT COUNT(*) FROM sys_user")
    Long countUsers();

    /**
     * 搜索用户（优化版）
     * 优化策略：
     * 1. 使用全文搜索 MATCH...AGAINST 替代 LIKE '%...%'
     * 2. 使用复合索引 idx_role_status 优化筛选
     * 3. 显式指定字段减少数据传输
     */
    @Select("<script>" +
            "SELECT id, username, nickname, avatar, email, role, status, create_time, update_time " +
            "FROM sys_user " +
            "<where>" +
            "  <if test='keyword != null and keyword != \"\"'>" +
            "    AND MATCH(username, nickname) AGAINST(#{keyword} IN NATURAL LANGUAGE MODE)" +
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

    /**
     * 搜索用户数量（优化版）
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM sys_user " +
            "<where>" +
            "  <if test='keyword != null and keyword != \"\"'>" +
            "    AND MATCH(username, nickname) AGAINST(#{keyword} IN NATURAL LANGUAGE MODE)" +
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

    /**
     * 插入用户（返回自增ID）
     */
    @Insert("INSERT INTO sys_user(username, password, nickname, avatar, email, role, status, create_time, update_time) " +
            "VALUES(#{username}, #{password}, #{nickname}, #{avatar}, #{email}, #{role}, #{status}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    /**
     * 更新用户信息
     */
    @Update("UPDATE sys_user SET nickname=#{nickname}, avatar=#{avatar}, email=#{email}, " +
            "role=#{role}, status=#{status}, update_time=NOW() WHERE id=#{id}")
    int update(User user);

    /**
     * 更新密码
     */
    @Update("UPDATE sys_user SET password=#{password}, update_time=NOW() WHERE id=#{id}")
    int updatePassword(@Param("id") Integer id, @Param("password") String password);

    /**
     * 删除用户
     */
    @Delete("DELETE FROM sys_user WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    /**
     * 游标分页查询（优化大数据量分页）
     * 使用方式：传入上一页最后一条记录的ID，避免OFFSET的性能问题
     */
    @Select("SELECT id, username, nickname, avatar, email, role, status, create_time, update_time " +
            "FROM sys_user WHERE id < #{lastId} ORDER BY id DESC LIMIT #{pageSize}")
    List<User> listUsersByCursor(@Param("lastId") Integer lastId, @Param("pageSize") Integer pageSize);

    /**
     * 批量插入用户（用于数据迁移或初始化）
     */
    @Insert("<script>" +
            "INSERT INTO sys_user(username, password, nickname, avatar, email, role, status, create_time, update_time) VALUES " +
            "<foreach collection='list' item='item' separator=','>" +
            "(#{item.username}, #{item.password}, #{item.nickname}, #{item.avatar}, #{item.email}, #{item.role}, #{item.status}, NOW(), NOW())" +
            "</foreach>" +
            "</script>")
    int batchInsert(@Param("list") List<User> users);
}