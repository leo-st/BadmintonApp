-- Add verification tracking fields to Match table
SET search_path TO badminton, public;

-- Add verification fields for each player
ALTER TABLE badminton."Match" 
ADD COLUMN "player1_verified" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE badminton."Match" 
ADD COLUMN "player2_verified" BOOLEAN NOT NULL DEFAULT FALSE;

-- Add fields to track who verified (for each player)
ALTER TABLE badminton."Match" 
ADD COLUMN "player1_verified_by_id" INTEGER;

ALTER TABLE badminton."Match" 
ADD COLUMN "player2_verified_by_id" INTEGER;

-- Add foreign key constraints
ALTER TABLE badminton."Match" 
ADD CONSTRAINT match_player1_verified_by_id_fkey 
FOREIGN KEY ("player1_verified_by_id") REFERENCES badminton."User"("id") ON DELETE SET NULL;

ALTER TABLE badminton."Match" 
ADD CONSTRAINT match_player2_verified_by_id_fkey 
FOREIGN KEY ("player2_verified_by_id") REFERENCES badminton."User"("id") ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_match_player1_verified ON badminton."Match"("player1_verified");
CREATE INDEX idx_match_player2_verified ON badminton."Match"("player2_verified");
CREATE INDEX idx_match_verification_status ON badminton."Match"("player1_verified", "player2_verified");
