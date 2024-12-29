-- Delete existing business categories
DELETE FROM business_categories;

-- Insert business categories
INSERT INTO business_categories (name, description, is_active) VALUES 
('Doctor', 'Healthcare professionals and medical services', true),
('Mentor', 'Coaches, trainers, and educational experts', true),
('Artist', 'Visual artists, designers, and creative professionals', true),
('Musician', 'Musicians, bands, and music producers', true),
('Fitness Trainer', 'Personal trainers and fitness experts', true),
('Business Owner', 'Entrepreneurs and business professionals', true),
('Content Creator', 'YouTubers, streamers, and digital content makers', true),
('Writer', 'Authors, bloggers, and journalists', true),
('Developer', 'Software developers and tech professionals', true); 