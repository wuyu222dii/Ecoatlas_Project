-- Idempotent repair: ensures soft-delete + sidebar order columns exist.
-- Use when V6 was skipped, failed mid-flight, or the DB was restored without those columns.
ALTER TABLE resonance ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE resonance ADD COLUMN IF NOT EXISTS list_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_resonance_user_deleted ON resonance (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_resonance_user_active_order ON resonance (user_id, list_order)
    WHERE deleted_at IS NULL;

UPDATE resonance r
SET list_order = sub.rn
FROM (
    SELECT id,
           (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1)::INTEGER AS rn
    FROM resonance
) sub
WHERE r.id = sub.id;
