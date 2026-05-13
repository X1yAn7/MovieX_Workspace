package com.moviex.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户实体
 * 存储系统用户的基本信息和权限信息
 */
@Data
public class User {
    /** 用户ID */
    private Integer id;
    
    /** 登录用户名 */
    private String username;
    
    /** 登录密码（加密存储） */
    private String password;
    
    /** 昵称（显示名称） */
    private String nickname;
    
    /** 头像图片路径 */
    private String avatar;
    
    /** 电子邮箱 */
    private String email;
    
    /** 用户角色（USER普通用户/ADMIN管理员） */
    private String role;
    
    /** 账号状态（0=禁用 1=正常） */
    private Integer status;
    
    /** 账号创建时间 */
    private LocalDateTime createTime;
    
    /** 账号更新时间 */
    private LocalDateTime updateTime;
}
