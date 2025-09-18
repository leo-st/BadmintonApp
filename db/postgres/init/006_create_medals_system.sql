-- Create medals table
CREATE TABLE IF NOT EXISTS badminton.medals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tournament_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    medal_type VARCHAR(10) NOT NULL CHECK (medal_type IN ('gold', 'silver', 'bronze', 'wood')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_medals_user FOREIGN KEY (user_id) REFERENCES badminton."User"(id) ON DELETE CASCADE,
    CONSTRAINT fk_medals_tournament FOREIGN KEY (tournament_id) REFERENCES badminton."Tournament"(id) ON DELETE CASCADE,
    
    -- Ensure unique medal per user per tournament
    CONSTRAINT unique_user_tournament_medal UNIQUE (user_id, tournament_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_medals_user_id ON badminton.medals(user_id);
CREATE INDEX IF NOT EXISTS idx_medals_tournament_id ON badminton.medals(tournament_id);
CREATE INDEX IF NOT EXISTS idx_medals_medal_type ON badminton.medals(medal_type);
