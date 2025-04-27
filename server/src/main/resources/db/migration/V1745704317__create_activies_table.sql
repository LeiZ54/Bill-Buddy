CREATE TABLE activities
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    action      VARCHAR(20)  NOT NULL,
    object_type VARCHAR(20)  NOT NULL,
    object_id   BIGINT       NOT NULL,
    template    VARCHAR(100) NOT NULL,
    params      TEXT,
    created_at  DATETIME     NOT NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_object (object_type, object_id)
);

