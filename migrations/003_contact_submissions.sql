-- Public contact-form submissions. Run once after coordinating with the team.
-- This table is intentionally not exposed through public GET endpoints.

CREATE TABLE contact_submissions (
    id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'in_progress', 'closed') NOT NULL DEFAULT 'new',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pk),
    KEY idx_contact_submissions_status_submitted_at (status, submitted_at)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;