-- Soft-delete (recycle bin) + user-defined sidebar order
-- Split into two ALTERs for broader PostgreSQL / pooler compatibility.
ALTER TABLE resonance ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE resonance ADD COLUMN IF NOT EXISTS list_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_resonance_user_deleted ON resonance (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_resonance_user_active_order ON resonance (user_id, list_order)
    WHERE deleted_at IS NULL;

-- Backfill list_order: preserve previous "newest first" (created_at DESC) as order 0,1,2,...
UPDATE resonance r
SET list_order = sub.rn
FROM (
    SELECT id,
           (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1)::INTEGER AS rn
    FROM resonance
) sub
WHERE r.id = sub.id;
