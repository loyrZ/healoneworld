-- HOW-132: Add the shared class fields used by the admin class list,
-- class editing, the public calendar, and class details.
-- Field meanings: docs/class-data.md.
-- Run once after coordinating with the team. Existing rows are kept:
-- class_name stays the title and user_name stays the instructor name.
-- New columns are nullable or defaulted, and existing rows become
-- 'pending' so they are not shown publicly until an admin reviews them.

-- Claude revised

ALTER TABLE classes
    ADD COLUMN description TEXT NULL,
    ADD COLUMN starts_at DATETIME NULL,
    ADD COLUMN ends_at DATETIME NULL,
    ADD COLUMN time_zone VARCHAR(64) NOT NULL DEFAULT 'America/Los_Angeles',
    ADD COLUMN attendance_format ENUM('in_person', 'virtual', 'hybrid')
        NOT NULL DEFAULT 'in_person',
    ADD COLUMN location VARCHAR(255) NULL,
    ADD COLUMN meeting_link VARCHAR(2048) NULL,
    ADD COLUMN capacity INT UNSIGNED NULL,
    ADD COLUMN status ENUM('pending', 'published') NOT NULL DEFAULT 'pending',
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    ADD KEY idx_classes_starts_at (starts_at),
    ADD KEY idx_classes_status (status);
