CREATE TABLE expenses
(
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_id     BIGINT         NOT NULL,
    payer_id     BIGINT         NOT NULL,
    amount       DECIMAL(10, 2) NOT NULL,
    currency     VARCHAR(10)    NOT NULL,
    deleted      BOOLEAN        NOT NULL DEFAULT FALSE,
    description  VARCHAR(255)   NOT NULL,
    expense_date DATETIME       NOT NULL,
    created_at   DATETIME       NOT NULL,
    updated_at   DATETIME       NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups_table (id),
    FOREIGN KEY (payer_id) REFERENCES users (id)
);