CREATE TABLE friend_requests
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id   BIGINT       NOT NULL,
    receiver_id BIGINT       NOT NULL,
    status      VARCHAR(255) NOT NULL DEFAULT 'pending',
    created_at  DATETIME     NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (receiver_id) REFERENCES users (id)
);