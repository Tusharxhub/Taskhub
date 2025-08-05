-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Create more permissive policies for testing
CREATE POLICY "Anyone can view tasks" ON tasks FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tasks" ON tasks 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own tasks" ON tasks 
FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own tasks" ON tasks 
FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Also fix comments policies
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON comments 
FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own comments" ON comments 
FOR DELETE USING (user_id = auth.jwt() ->> 'sub');
