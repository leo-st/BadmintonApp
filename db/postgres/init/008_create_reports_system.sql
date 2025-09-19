-- Create reports system
-- Reports are independent text entries by players describing badminton events
-- They have two dates: when created and when the event happened

-- Create reports table
CREATE TABLE IF NOT EXISTS badminton.reports (
    id SERIAL PRIMARY KEY,
    created_by_id INTEGER NOT NULL REFERENCES badminton."User"(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,  -- Date when the event happened
    content TEXT NOT NULL,     -- Free text description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report reactions table (for emoji reactions)
CREATE TABLE IF NOT EXISTS badminton.report_reactions (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES badminton.reports(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES badminton."User"(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,  -- Store emoji as string (e.g., "👍", "❤️", "😂")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_id, user_id, emoji)  -- One user can only react once per emoji per report
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON badminton.reports(created_by_id);
CREATE INDEX IF NOT EXISTS idx_reports_event_date ON badminton.reports(event_date);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON badminton.reports(created_at);
CREATE INDEX IF NOT EXISTS idx_report_reactions_report_id ON badminton.report_reactions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_reactions_user_id ON badminton.report_reactions(user_id);

-- Add full text search index for content
CREATE INDEX IF NOT EXISTS idx_reports_content_search ON badminton.reports USING gin(to_tsvector('english', content));
