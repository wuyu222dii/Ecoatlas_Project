-- Allow data URLs and long CDN URLs for resonance cover images
ALTER TABLE resonance
    ALTER COLUMN image_url TYPE TEXT;
