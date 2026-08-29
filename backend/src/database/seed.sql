
-- Seed Roles
INSERT INTO roles (name, description) VALUES
    ('System Administrator', 'Full system control and administrative privileges'),
    ('Practice Lead', 'Practice oversight and resource management'),
    ('Regional Lead', 'Regional operations and bench monitoring'),
    ('Training Manager', 'Curriculum management and assessment tracking'),
    ('Mentor', 'Mentorship pairings, code reviews, and mock interviews'),
    ('Resource', 'Engineering resource learning and deployment readiness'),
    ('Management', 'Executive summary and strategic dashboard access')
ON CONFLICT DO NOTHING;

-- Seed Regions (APAC, KSA, UAE, VSI)
INSERT INTO regions (name, code, is_active) VALUES
    ('APAC', 'APAC', TRUE),
    ('KSA', 'KSA', TRUE),
    ('UAE', 'UAE', TRUE),
    ('VSI', 'VSI', TRUE)
ON CONFLICT DO NOTHING;
