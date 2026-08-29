-- Seed Roles
INSERT INTO roles (name, description) VALUES
    ('System Administrator', 'Full system control and administrative privileges'),
    ('Practice Lead', 'Practice oversight and resource management'),
    ('Regional Lead', 'Regional operations and bench monitoring'),
    ('Training Manager', 'Curriculum management and assessment tracking'),
    ('Mentor', 'Mentorship pairings, code reviews, and mock interviews'),
    ('Resource', 'Engineering resource learning and deployment readiness'),
    ('Management', 'Executive summary and strategic dashboard access')
ON CONFLICT (name) DO NOTHING;

-- Seed Regions
INSERT INTO regions (name, code, is_active) VALUES
    ('Pakistan', 'PK', TRUE),
    ('UAE', 'UAE', TRUE),
    ('Saudi Arabia', 'KSA', TRUE),
    ('North America', 'NA', TRUE)
ON CONFLICT (name) DO NOTHING;
