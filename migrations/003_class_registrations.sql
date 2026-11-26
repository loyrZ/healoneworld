-- HOW: Persist class registrations and cancellations.
-- Run once after coordinating with the team. Do not run automatically.

CREATE TABLE class_registrations (
    id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
    class_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    phone VARCHAR(30) NULL,
    accessibility_notes TEXT NULL,
    status ENUM('registered', 'cancelled') NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id_pk),
    UNIQUE KEY uq_class_registrations_class_user (class_id, user_id),
    KEY idx_class_registrations_class_status (class_id, status),
    KEY idx_class_registrations_user_status (user_id, status),
    CONSTRAINT fk_class_registrations_class
        FOREIGN KEY (class_id) REFERENCES classes(id_pk) ON DELETE CASCADE,
    CONSTRAINT fk_class_registrations_user
        FOREIGN KEY (user_id) REFERENCES users(id_pk) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;