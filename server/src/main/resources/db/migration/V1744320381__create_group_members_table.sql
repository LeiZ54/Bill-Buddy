CREATE TABLE group_members
(
    id        BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id  BIGINT   NOT NULL,
    user_id   BIGINT   NOT NULL,
    role      VARCHAR(50)       DEFAULT 'member',
    joined_at DATETIME NOT NULL,
    deleted   BOOLEAN  NOT NULL DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES groups_table (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);