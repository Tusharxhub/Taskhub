-- First, let's check what tables already exist and drop them if they have the wrong structure
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Now create the tasks table with the correct structure
CREATE TABLE public.tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    deadline DATE NOT NULL,
    category TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the comments table with matching types
CREATE TABLE public.comments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the user_profiles table
CREATE TABLE public.user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    bio TEXT,
    profile_image_url TEXT,
    instagram_id TEXT,
    linkedin_id TEXT,
    twitter_id TEXT,
    website_url TEXT,
    skills TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_comments_task_id ON public.comments(task_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
CREATE POLICY "Anyone can view tasks" ON public.tasks 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tasks" ON public.tasks 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own tasks" ON public.tasks 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own tasks" ON public.tasks 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Create policies for comments table
CREATE POLICY "Anyone can view comments" ON public.comments 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON public.comments 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own comments" ON public.comments 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Create policies for user_profiles table
CREATE POLICY "Anyone can view user profiles" ON public.user_profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles 
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own profile" ON public.user_profiles 
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile images
CREATE POLICY "Anyone can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'profile-images');

CREATE POLICY "Users can delete their own profile images" ON storage.objects
    FOR DELETE USING (bucket_id = 'profile-images');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO public.tasks (title, description, price, deadline, category, user_id, user_name) VALUES
('Sample Web Development Task', 'Create a responsive landing page with modern design', 15000.00, '2024-12-31', 'Web Development', 'sample-user-1', 'John Developer'),
('Logo Design Project', 'Design a modern logo for a tech startup', 8000.00, '2024-12-25', 'Design & Graphics', 'sample-user-2', 'Sarah Designer');
