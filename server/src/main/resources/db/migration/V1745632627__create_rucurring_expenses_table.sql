CREATE TABLE recurring_expenses
(
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    title               VARCHAR(255)   NOT NULL,
    group_id            BIGINT         NOT NULL,
    payer_id            BIGINT         NOT NULL,
    amount              DECIMAL(10, 2) NOT NULL,
    type                VARCHAR(50)    NOT NULL,
    deleted             BOOLEAN        NOT NULL DEFAULT FALSE,
    description         TEXT,
    start_date          DATETIME       NOT NULL,
    recurrence_unit     VARCHAR(50),
    recurrence_interval INT,
    created_at          DATETIME       NOT NULL,

    participant_ids     TEXT           NOT NULL,
    share_amounts       TEXT           NOT NULL,

    CONSTRAINT fk_recurring_expenses_group
        FOREIGN KEY (group_id) REFERENCES groups_table (id),

    CONSTRAINT fk_recurring_expenses_payer
        FOREIGN KEY (payer_id) REFERENCES users (id)
);
