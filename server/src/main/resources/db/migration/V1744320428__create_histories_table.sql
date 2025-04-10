CREATE TABLE histories
(
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id       BIGINT   NOT NULL,
    user_id        BIGINT   NOT NULL,
    created_by     BIGINT   NOT NULL,
    user_lent_json TEXT,
    user_paid_json TEXT,
    member_ids     TEXT,
    expense_ids    TEXT,
    created_at     DATETIME NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups_table (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);