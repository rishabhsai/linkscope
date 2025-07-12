# Supabase Setup Guide for LinkScope (No Auth)

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

## 3. Set Up Environment Variables

Create a `.env` file in the root of your project with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase credentials.

## 4. Create Database Table

Run the following SQL in your Supabase SQL Editor:

### Analyzed Links Table (No Auth)
```sql
CREATE TABLE analyzed_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Username (not UUID)
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  context TEXT,
  type TEXT CHECK (type IN ('video', 'link')) NOT NULL DEFAULT 'link',
  platform TEXT CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'other')) DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  thumbnail TEXT,
  description TEXT,
  is_manually_added BOOLEAN DEFAULT FALSE,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_analyzed_links_user_id ON analyzed_links(user_id);
CREATE INDEX idx_analyzed_links_status ON analyzed_links(status);
CREATE INDEX idx_analyzed_links_tags ON analyzed_links USING GIN(tags);
CREATE INDEX idx_analyzed_links_created_at ON analyzed_links(created_at);

-- Enable RLS
ALTER TABLE analyzed_links ENABLE ROW LEVEL SECURITY;

-- Create policies: shared links + personal todos
CREATE POLICY "Users can view shared links and own todos" ON analyzed_links
  FOR SELECT USING (
    status IN ('active', 'archived') OR 
    (status IN ('todo', 'completed') AND user_id = current_setting('request.jwt.claims', true)::json->>'username')
  );

CREATE POLICY "Users can insert own links" ON analyzed_links
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'username');

CREATE POLICY "Users can update own links and shared links" ON analyzed_links
  FOR UPDATE USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'username' OR
    status IN ('active', 'archived')
  );

CREATE POLICY "Users can delete own links" ON analyzed_links
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'username');
```

> **Note:** If you want to allow public access (no RLS), you can disable RLS or use a simpler policy: `USING (true)` for all actions.

## 5. Test the Setup

1. Run `npm run dev` to start the development server
2. Enter a username when prompted
3. Analyze and save links

## Features

- **No authentication required**
- **Username is stored in browser**
- **All links are associated with the entered username**
- **Data is private per username** 