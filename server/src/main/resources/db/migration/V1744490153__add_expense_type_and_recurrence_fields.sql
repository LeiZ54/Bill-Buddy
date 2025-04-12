ALTER TABLE expenses
    ADD COLUMN title               VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    ADD COLUMN type                VARCHAR(50)  NOT NULL DEFAULT 'OTHER',
    ADD COLUMN is_recurring        BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN recurrence_unit     VARCHAR(20),
    ADD COLUMN recurrence_interval INT;
