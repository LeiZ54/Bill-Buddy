CREATE TABLE groups_table
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    created_by BIGINT       NOT NULL,
    type       VARCHAR(255),
    deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME     NOT NULL,
    updated_at DATETIME     NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users (id)
);