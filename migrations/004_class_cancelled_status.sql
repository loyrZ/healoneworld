-- Add the cancelled session status used by instructor and admin views.
-- Run once after migrations/002_class_schedule_fields.sql and
-- migrations/003_class_submission_creator.sql have been applied.
-- Cancelled sessions remain in staff and instructor history but never appear
-- in public class/calendar results, which only query status = 'published'.

ALTER TABLE classes
    MODIFY COLUMN status ENUM('pending', 'published', 'cancelled')
        NOT NULL DEFAULT 'pending';