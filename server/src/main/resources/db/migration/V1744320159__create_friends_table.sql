CREATE TABLE friends
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT   NOT NULL,
    friend_id  BIGINT   NOT NULL,
    deleted    BOOLEAN  NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (friend_id) REFERENCES users (id)
);