ALTER TABLE expenses
    DROP COLUMN currency,
    DROP COLUMN is_recurring,
    DROP COLUMN recurrence_unit,
    DROP COLUMN recurrence_interval;
