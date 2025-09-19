-- Tournament invitation system
-- This script creates tables for tournament invitations and participants

-- Add tournament status enum
CREATE TYPE badminton.tournament_status AS ENUM ('draft', 'inviting', 'active', 'completed');

-- Add status column to tournaments table
ALTER TABLE badminton."Tournament" 
ADD COLUMN status badminton.tournament_status DEFAULT 'draft';

-- Create tournament participants table
CREATE TABLE IF NOT EXISTS badminton.tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_tournament_participants_tournament 
        FOREIGN KEY (tournament_id) REFERENCES badminton."Tournament"(id) ON DELETE CASCADE,
    CONSTRAINT fk_tournament_participants_user 
        FOREIGN KEY (user_id) REFERENCES badminton."User"(id) ON DELETE CASCADE,
    CONSTRAINT unique_tournament_participant 
        UNIQUE (tournament_id, user_id)
);

-- Create tournament invitations table
CREATE TABLE IF NOT EXISTS badminton.tournament_invitations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    invited_by INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    CONSTRAINT fk_tournament_invitations_tournament 
        FOREIGN KEY (tournament_id) REFERENCES badminton."Tournament"(id) ON DELETE CASCADE,
    CONSTRAINT fk_tournament_invitations_user 
        FOREIGN KEY (user_id) REFERENCES badminton."User"(id) ON DELETE CASCADE,
    CONSTRAINT fk_tournament_invitations_invited_by 
        FOREIGN KEY (invited_by) REFERENCES badminton."User"(id) ON DELETE CASCADE,
    CONSTRAINT unique_tournament_invitation 
        UNIQUE (tournament_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_tournament_participants_tournament_id ON badminton.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user_id ON badminton.tournament_participants(user_id);
CREATE INDEX idx_tournament_invitations_tournament_id ON badminton.tournament_invitations(tournament_id);
CREATE INDEX idx_tournament_invitations_user_id ON badminton.tournament_invitations(user_id);
CREATE INDEX idx_tournament_invitations_status ON badminton.tournament_invitations(status);

-- Update existing tournaments to have 'active' status if they have matches
UPDATE badminton."Tournament" 
SET status = 'active' 
WHERE id IN (
    SELECT DISTINCT tournament_id 
    FROM badminton."Match" 
    WHERE tournament_id IS NOT NULL
);
