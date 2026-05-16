package com.moviex.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;

@Configuration
public class HiveConfig {

    @Value("${bigdata.hive.url}")
    private String url;

    @Value("${bigdata.hive.username}")
    private String username;

    @Value("${bigdata.hive.password}")
    private String password;

    @Value("${bigdata.hive.driver-class-name}")
    private String driverClassName;

    // 手动创建一个专属的数据源，不和 MySQL 抢戏
    @Bean(name = "hiveDataSource")
    public DataSource hiveDataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName(driverClassName);
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }

    // 暴露一个专门用来查大数据的 JdbcTemplate
    @Bean(name = "hiveJdbcTemplate")
    public JdbcTemplate hiveJdbcTemplate() {
        return new JdbcTemplate(hiveDataSource());
    }
}