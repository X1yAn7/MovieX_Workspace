package com.moviex.controller;

import com.moviex.common.PageResult;
import com.moviex.common.Result;
import com.moviex.entity.User;
import com.moviex.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 用户注册
     * POST /api/users/register
     */
    @PostMapping("/register")
    public Result<User> register(@RequestBody User user) {
        try {
            return Result.success(userService.register(user));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 用户登录
     * POST /api/users/login
     */
    @PostMapping("/login")
    public Result<User> login(@RequestBody Map<String, String> params) {
        try {
            User user = userService.login(params.get("username"), params.get("password"));
            return Result.success(user);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取用户信息
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public Result<User> getById(@PathVariable Integer id) {
        User user = userService.getById(id);
        if (user == null) return Result.error("用户不存在");
        user.setPassword(null);
        return Result.success(user);
    }

    /**
     * 更新用户资料
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public Result<User> update(@PathVariable Integer id, @RequestBody User user) {
        user.setId(id);
        return Result.success(userService.update(user));
    }

    /**
     * 修改密码
     * PUT /api/users/{id}/password
     */
    @PutMapping("/{id}/password")
    public Result<Boolean> updatePassword(@PathVariable Integer id, @RequestBody Map<String, String> params) {
        try {
            boolean ok = userService.updatePassword(id, params.get("oldPassword"), params.get("newPassword"));
            return Result.success(ok);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    // ===== 管理员接口 =====

    /**
     * 用户列表（管理员，支持搜索/筛选/分页）
     * GET /api/users?keyword=xxx&role=ADMIN&status=1&page=1&pageSize=20
     */
    @GetMapping
    public Result<PageResult<User>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        return Result.success(userService.search(keyword, role, status, page, pageSize));
    }

    /**
     * 管理员创建用户
     * POST /api/users
     */
    @PostMapping
    public Result<User> createUser(@RequestBody User user) {
        try {
            return Result.success(userService.register(user));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 管理员删除用户
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Boolean> deleteUser(@PathVariable Integer id) {
        boolean deleted = userService.delete(id);
        return deleted ? Result.success(true) : Result.error("删除失败");
    }
}
