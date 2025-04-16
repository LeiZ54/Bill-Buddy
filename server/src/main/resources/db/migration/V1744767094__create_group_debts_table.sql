CREATE TABLE group_debts
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,

    group_id    BIGINT         NOT NULL,
    lender_id   BIGINT         NOT NULL,
    borrower_id BIGINT         NOT NULL,
    amount      DECIMAL(10, 2) NOT NULL,
    deleted     BOOLEAN      NOT NULL DEFAULT FALSE,

    created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_group_debts_group FOREIGN KEY (group_id) REFERENCES groups_table (id),
    CONSTRAINT fk_group_debts_lender FOREIGN KEY (lender_id) REFERENCES users (id),
    CONSTRAINT fk_group_debts_borrower FOREIGN KEY (borrower_id) REFERENCES users (id)
);
