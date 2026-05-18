package com.moviex.controller;

import com.moviex.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin
@RestController
@RequestMapping("/api/explore")
public class DataExploreController {

    // 注入我们刚才专门为 Hive 配置的 JdbcTemplate
    @Autowired
    @Qualifier("hiveJdbcTemplate")
    private JdbcTemplate hiveJdbcTemplate;

    /**
     * 大数据即席探查接口：动态聚合查询
     * 场景：前端想查“某个原始语言的平均预算和总票房”
     * 访问示例：GET http://localhost:8080/api/explore/language?lang=en
     */
    @GetMapping("/language")
    public Result<List<Map<String, Object>>> exploreByLanguage(@RequestParam(defaultValue = "en") String lang) {
        // 这个 SQL 会被直接发送到虚拟机的 Spark 集群，进行真正的 MapReduce/Spark 分布式计算！
        String sql = "SELECT original_language, " +
                "COUNT(*) as movie_count, " +
                "AVG(budget) as avg_budget, " +
                "SUM(revenue) as total_revenue " +
                "FROM cinema_db.dwd_movies " + // 查的是虚拟机上的 Hive 表！
                "WHERE original_language = ? " +
                "GROUP BY original_language";

        // 执行查询 (这可能会比 MySQL 慢几秒，因为它在调动大数据集群)
        List<Map<String, Object>> result = hiveJdbcTemplate.queryForList(sql, lang);

        return Result.success(result);
    }
}