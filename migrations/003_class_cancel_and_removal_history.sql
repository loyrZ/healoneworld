-- HOW-287, HOW-567: canceled class status + admin removal history.
-- DRAFT for review. Don't run this on the shared Railway db until the group ok's it.
-- The registrations table belongs to HOW-228, so it isn't created here.
--
-- Rollout:
-- - order: after HOW-228's registrations table exists
-- - add the same classes columns to bin/dbloader.js so fresh databases match
-- - backfill: none, existing classes keep their status and nobody is removed
-- - rollback (HOW-287): set any 'canceled' classes back to 'published',
--   drop the foreign key, then drop canceled_by_fk and canceled_at, then
--   MODIFY status back to ENUM('pending', 'published'). Shrinking the enum
--   while 'canceled' rows remain would fail, so clear them first.
-- - rollback (HOW-567): DROP TABLE class_registration_history. Removed
--   registrations stay 'removed' in HOW-228's table either way.

-- HOW-287: the class row stays, only the status changes. canceled_by_fk
-- references users.id_pk (INT UNSIGNED) so it must match that column's type.
ALTER TABLE classes
    MODIFY COLUMN status ENUM('pending', 'published', 'canceled')
        NOT NULL DEFAULT 'pending',
    ADD COLUMN canceled_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN canceled_by_fk INT UNSIGNED NULL DEFAULT NULL,
    ADD CONSTRAINT fk_classes_canceled_by
        FOREIGN KEY (canceled_by_fk) REFERENCES users(id_pk);

-- HOW-567: who removed someone and when.
-- Separate table so HOW-228's registrations table doesn't need extra columns from me.
-- HOW-228's class_registrations table only allows 'registered' and 'cancelled',
-- so an admin removal sets 'cancelled' and adds a row here; this table is what
-- marks it as removed. HOW-228's table isn't changed.
-- Not in bin/dbloader.js yet, because the loader doesn't create HOW-228's table.
CREATE TABLE class_registration_history (
    id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
    registration_id_fk INT UNSIGNED NOT NULL,
    action ENUM('removed_by_admin') NOT NULL,
    actor_user_fk INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pk),
    KEY idx_registration_history_registration (registration_id_fk),
    FOREIGN KEY (registration_id_fk) REFERENCES class_registrations(id_pk),
    FOREIGN KEY (actor_user_fk) REFERENCES users(id_pk)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
