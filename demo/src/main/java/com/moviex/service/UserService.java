package com.moviex.service;

import com.moviex.common.PageResult;
import com.moviex.entity.User;
import com.moviex.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public User getById(Integer id) {
        return userMapper.getById(id);
    }

    public User getByUsername(String username) {
        return userMapper.getByUsername(username);
    }

    public User register(User user) {
        User existing = userMapper.getByUsername(user.getUsername());
        if (existing != null) {
            throw new RuntimeException("用户名已存在");
        }
        if (user.getRole() == null) user.setRole("USER");
        if (user.getStatus() == null) user.setStatus(1);
        if (user.getNickname() == null) user.setNickname(user.getUsername());
        userMapper.insert(user);
        user.setPassword(null);
        return user;
    }

    public User login(String username, String password) {
        User user = userMapper.getByUsername(username);
        if (user == null || !user.getPassword().equals(password)) {
            throw new RuntimeException("用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用");
        }
        user.setPassword(null);
        return user;
    }

    public User update(User user) {
        userMapper.update(user);
        User updated = userMapper.getById(user.getId());
        updated.setPassword(null);
        return updated;
    }

    public boolean updatePassword(Integer id, String oldPassword, String newPassword) {
        User user = userMapper.getById(id);
        if (user == null || !user.getPassword().equals(oldPassword)) {
            throw new RuntimeException("原密码错误");
        }
        return userMapper.updatePassword(id, newPassword) > 0;
    }

    public boolean delete(Integer id) {
        return userMapper.deleteById(id) > 0;
    }

    public PageResult<User> search(String keyword, String role, Integer status, Integer page, Integer pageSize) {
        int offset = (page - 1) * pageSize;
        List<User> records = userMapper.search(keyword, role, status, offset, pageSize);
        Long total = userMapper.searchCount(keyword, role, status);
        records.forEach(u -> u.setPassword(null));
        return PageResult.of(records, total, page, pageSize);
    }

    public PageResult<User> listAll(Integer page, Integer pageSize) {
        int offset = (page - 1) * pageSize;
        List<User> records = userMapper.listUsers(offset, pageSize);
        Long total = userMapper.countUsers();
        records.forEach(u -> u.setPassword(null));
        return PageResult.of(records, total, page, pageSize);
    }
}
