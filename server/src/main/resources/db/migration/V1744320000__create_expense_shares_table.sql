CREATE TABLE expense_shares
(
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    expense_id   BIGINT         NOT NULL,
    user_id      BIGINT         NOT NULL,
    deleted      BOOLEAN        NOT NULL DEFAULT FALSE,
    share_amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);