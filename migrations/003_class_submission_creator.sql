-- Store the verified application user that submitted a class for staff review.
-- Run once after coordinating with the team. Existing classes remain unowned.
-- Do not run automatically against the shared database.

ALTER TABLE classes
    ADD COLUMN creator_user_id INT UNSIGNED NULL,
    ADD KEY idx_classes_creator_user_id (creator_user_id),
    ADD CONSTRAINT fk_classes_creator_user
        FOREIGN KEY (creator_user_id) REFERENCES users(id_pk)
        ON DELETE SET NULL;