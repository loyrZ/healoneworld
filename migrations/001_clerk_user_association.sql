-- HOW-531: Prepare existing users for Clerk authentication.
-- Run once after coordinating with the team.
-- Existing users remain unlinked, and existing password hashes are preserved.

ALTER TABLE users
    ADD COLUMN clerk_user_id VARCHAR(255)
        CHARACTER SET ascii COLLATE ascii_bin NULL,
    ADD UNIQUE KEY uq_users_clerk_user_id (clerk_user_id),
    MODIFY COLUMN password_hash VARCHAR(255)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

CREATE TABLE permission (
    id_fk INT UNSIGNED NOT NULL,
    instructor BOOLEAN NOT NULL DEFAULT FALSE,
    volunteer BOOLEAN NOT NULL DEFAULT FALSE,
    staff BOOLEAN NOT NULL DEFAULT FALSE,
    admin BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id_fk),
    FOREIGN KEY (id_fk) REFERENCES users(id_pk)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;