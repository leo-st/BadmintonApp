-- Load sample data for badminton app
SET search_path TO badminton, public;

-- Insert sample users (passwords are 'password123' hashed with pbkdf2_sha256)
INSERT INTO badminton."User" ("username", "email", "full_name", "hashed_password") VALUES
('alice', 'alice@example.com', 'Alice Johnson', '$pbkdf2-sha256$29000$yBlDiBFiDEFoTakVgpAyBg$vKkJszu6Pa3Lk0c498VuVHDQ/5zTQ2VYAk0vni2uKwc'),
('bob', 'bob@example.com', 'Bob Smith', '$pbkdf2-sha256$29000$x3iv1bq3tnaulbJ2rtWacw$.E.dV59Yiit9cZnRpl8JM6spW1CFaYfezzhmrkUk73Y'),
('charlie', 'charlie@example.com', 'Charlie Brown', '$pbkdf2-sha256$29000$jHFu7R0DwPgfIwSAcE4pxQ$/TkMnwBV6wB.BMorZ8.wWClIDWkHQVYCI8QHSDPxyCE'),
('diana', 'diana@example.com', 'Diana Prince', '$pbkdf2-sha256$29000$4XwPoTTmnPNeK.V8zzkHQA$6YeUOtRvNZAEk4D7YFsDNoLcvYnATv2xMl63EQA6KbA');

-- Insert sample tournament
INSERT INTO badminton."Tournament" ("name", "description", "start_date", "end_date") VALUES
('Spring Championship 2024', 'Annual spring badminton tournament', NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days');

-- Insert sample matches
INSERT INTO badminton."Match" (
    "player1_id", "player2_id", "player1_score", "player2_score", 
    "match_type", "status", "submitted_by_id", "verified_by_id", 
    "notes", "verified_at"
) VALUES
(1, 2, 21, 18, 'CASUAL', 'VERIFIED', 1, 2, 'Great match!', NOW()),
(3, 4, 19, 21, 'CASUAL', 'PENDING_VERIFICATION', 3, NULL, 'Waiting for verification', NULL),
(1, 4, 21, 15, 'TOURNAMENT', 'VERIFIED', 1, 4, 'Tournament match', NOW());

-- Update the tournament match to reference the tournament
UPDATE badminton."Match" 
SET "tournament_id" = 1 
WHERE "id" = 3;
