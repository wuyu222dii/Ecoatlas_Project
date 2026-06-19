-- Spotify OAuth short-lived state row (PKCE callback verification)
CREATE TABLE spotify_oauth_state (
    state       VARCHAR(64) PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_spotify_oauth_state_expires ON spotify_oauth_state (expires_at);

-- Spotify account binding and tokens per user
CREATE TABLE spotify_connection (
    id                       BIGSERIAL PRIMARY KEY,
    user_id                  BIGINT      NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE CASCADE,
    spotify_user_id          VARCHAR(64),
    refresh_token            TEXT        NOT NULL,
    access_token             TEXT,
    access_token_expires_at  TIMESTAMPTZ,
    scope                    TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User saved tracks (library rows keyed by Spotify track id)
CREATE TABLE saved_track (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    spotify_track_id  VARCHAR(32)  NOT NULL,
    source            VARCHAR(32)  NOT NULL DEFAULT 'SEARCH',
    track_name        VARCHAR(512),
    artist_names      TEXT,
    album_name        VARCHAR(512),
    image_url         VARCHAR(1024),
    preview_url       VARCHAR(1024),
    duration_ms       INTEGER,
    spotify_uri       VARCHAR(256),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_saved_track_user_track UNIQUE (user_id, spotify_track_id)
);

CREATE INDEX idx_saved_track_user ON saved_track (user_id);
CREATE INDEX idx_saved_track_user_name ON saved_track (user_id, track_name);
