-- Trash list: filter by user + deleted_at IS NOT NULL, order by deleted_at DESC
CREATE INDEX IF NOT EXISTS idx_resonance_user_trash_deleted_at
    ON resonance (user_id, deleted_at DESC)
    WHERE deleted_at IS NOT NULL;
