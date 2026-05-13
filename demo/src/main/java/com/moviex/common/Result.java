package com.moviex.common;

import lombok.Data;

/**
 * 企业级统一 API 响应格式
 */
@Data
public class Result<T> {
    private Integer code; // 状态码：200代表成功，500代表失败
    private String msg;   // 提示信息
    private T data;       // 真正返回给前端的数据

    // 成功时的快捷方法
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("请求成功");
        result.setData(data);
        return result;
    }

    // 失败时的快捷方法
    public static <T> Result<T> error(String msg) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMsg(msg);
        result.setData(null);
        return result;
    }
}