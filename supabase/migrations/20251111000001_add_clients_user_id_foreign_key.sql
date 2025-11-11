-- Add foreign key constraint from clients.user_id to profiles.user_id
-- This resolves PostgREST PGRST200 error where it was searching for this relationship
-- in the schema cache but couldn't find it.

-- This constraint is valid because profiles.user_id has a UNIQUE constraint
ALTER TABLE clients
ADD CONSTRAINT clients_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(user_id);

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
