-- Link existing badminton.User table to access control system
SET search_path TO badminton, access_control, public;

-- Add role_id column to existing User table
ALTER TABLE badminton."User" 
ADD COLUMN "role_id" INTEGER;

-- Add foreign key constraint
ALTER TABLE badminton."User" 
ADD CONSTRAINT user_role_id_fkey 
FOREIGN KEY ("role_id") REFERENCES access_control."Role"("role_id");

-- Create index for better performance
CREATE INDEX idx_badminton_user_role_id ON badminton."User"("role_id");

-- Update existing users to have default 'user' role (role_id = 2)
UPDATE badminton."User" 
SET "role_id" = 2 
WHERE "role_id" IS NULL;

