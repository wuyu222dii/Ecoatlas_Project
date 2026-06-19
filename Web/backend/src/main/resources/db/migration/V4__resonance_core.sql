CREATE TABLE resonance (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    mood        VARCHAR(64),
    story       TEXT,
    image_url   VARCHAR(1024),
    visibility  VARCHAR(16)  NOT NULL DEFAULT 'PRIVATE',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resonance_user_created_at ON resonance (user_id, created_at DESC);

CREATE TABLE resonance_place (
    id               BIGSERIAL PRIMARY KEY,
    resonance_id     BIGINT       NOT NULL UNIQUE REFERENCES resonance(id) ON DELETE CASCADE,
    place_name       VARCHAR(255),
    address          VARCHAR(512),
    latitude         NUMERIC(10, 7) NOT NULL,
    longitude        NUMERIC(10, 7) NOT NULL,
    google_place_id  VARCHAR(255),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resonance_place_geo ON resonance_place (latitude, longitude);

CREATE TABLE resonance_spotify (
    id                BIGSERIAL PRIMARY KEY,
    resonance_id      BIGINT       NOT NULL UNIQUE REFERENCES resonance(id) ON DELETE CASCADE,
    spotify_track_id  VARCHAR(32)  NOT NULL,
    spotify_uri       VARCHAR(256),
    track_name        VARCHAR(512),
    artist_names      TEXT,
    album_name        VARCHAR(512),
    image_url         VARCHAR(1024),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resonance_spotify_track_id ON resonance_spotify (spotify_track_id);
