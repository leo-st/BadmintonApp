-- Add report views tracking system
-- This tracks which users have seen which reports

CREATE TABLE badminton.report_views (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES badminton.reports(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES badminton.User(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (report_id, user_id) -- A user can only view a report once
);

-- Create indexes for better performance
CREATE INDEX idx_report_views_report_id ON badminton.report_views (report_id);
CREATE INDEX idx_report_views_user_id ON badminton.report_views (user_id);
CREATE INDEX idx_report_views_viewed_at ON badminton.report_views (viewed_at);
