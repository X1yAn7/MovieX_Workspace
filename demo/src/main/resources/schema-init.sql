-- =============================================
-- MovieX 系统新增表结构
-- 数据库: cinema_db
-- =============================================

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    nickname VARCHAR(100) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '角色: USER/ADMIN',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用 1=正常',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 评论表
CREATE TABLE IF NOT EXISTS review (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    movie_id INT NOT NULL COMMENT '电影ID',
    rating DOUBLE DEFAULT NULL COMMENT '评分(0-5)',
    content TEXT COMMENT '评论内容',
    sentiment VARCHAR(20) DEFAULT 'Neutral' COMMENT '情感: Positive/Neutral/Analytical/Critical',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_movie_id (movie_id),
    INDEX idx_user_id (user_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电影评论表';

-- 初始管理员账号 (密码: admin123)
INSERT IGNORE INTO sys_user (username, password, nickname, avatar, role, status)
VALUES ('admin', 'admin123', '系统管理员', 'https://i.pravatar.cc/150?u=admin', 'ADMIN', 1);

-- 初始测试用户
INSERT IGNORE INTO sys_user (username, password, nickname, avatar, role, status)
VALUES ('user1', '123456', '影迷小王', 'https://i.pravatar.cc/150?u=user1', 'USER', 1);

INSERT IGNORE INTO sys_user (username, password, nickname, avatar, role, status)
VALUES ('user2', '123456', '电影评论家', 'https://i.pravatar.cc/150?u=user2', 'USER', 1);

-- 示例评论数据（需确保 movie_info 表中存在对应的 id）
-- INSERT INTO review (user_id, movie_id, rating, content, sentiment)
-- VALUES (2, 1, 4.5, '叙事结构巧妙地映射了记忆和良知的碎片化本质。', 'Analytical');
-- INSERT INTO review (user_id, movie_id, rating, content, sentiment)
-- VALUES (3, 1, 5.0, '视觉上令人震撼，情感上沉重有力。', 'Positive');
