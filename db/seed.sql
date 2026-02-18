-- =========================================
-- Seed data for Goal/Plan/Review app
-- IDEMPOTENT: safe to re-run without duplicates
-- Run after schema.sql
-- =========================================

-- ---------- GOAL CATEGORIES ----------
-- Categories match frontend tab labels
INSERT INTO goal_categories (category_name, category_description) VALUES
  ('Credit',             'Goals related to improving or maintaining credit score'),
  ('Savings',            'Goals related to saving, budgeting, and financial planning'),
  ('Govt Assistance',    'Goals related to government programs and first-time buyer assistance'),
  ('Location Research',  'Goals related to researching neighborhoods and areas'),
  ('Tour Homes',         'Goals related to finding and evaluating properties'),
  ('Other',              'Miscellaneous home-buying goals')
ON CONFLICT (category_name) DO UPDATE SET
  category_description = EXCLUDED.category_description;

-- ---------- USERS ----------
-- Passwords: jdoe=password123, asmith=securepass456, bwilson=mypassword789
-- Hashes generated with bcrypt cost 10
INSERT INTO users (username, password_hash, email, first_name, last_name) VALUES
  ('jdoe',    '$2b$10$LUejvpfczxhigdU7bCebve3KshxG0Y85MaJ9SHAkPmW2oS6c6cDNy', 'john.doe@example.com',   'John',  'Doe'),
  ('asmith',  '$2b$10$/ik3EzKF0j8B/fUucleHQO3DSZ1gyZHjZ2AweGTaIU1QxZtYOZHTm',  'alice.smith@example.com', 'Alice', 'Smith'),
  ('bwilson', '$2b$10$yjQvzlnNPEH7GcJUFN0EdOku3YCgCetWVz5ABDKXvAFZAQQ2yf8nW', 'bob.wilson@example.com',  'Bob',   'Wilson')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email         = EXCLUDED.email,
  first_name    = EXCLUDED.first_name,
  last_name     = EXCLUDED.last_name,
  updated_date  = NOW();

-- ---------- PLAN (1:1 with users) ----------
INSERT INTO plan (user_id, current_savings, target_range_low, target_range_high, target_purchase_date, per_month_savings, down_payment_percent)
VALUES
  ((SELECT user_id FROM users WHERE username = 'jdoe'),
    25000.00, 300000.00, 400000.00, '2027-06-01', 1500.00, 20.00),
  ((SELECT user_id FROM users WHERE username = 'asmith'),
    40000.00, 250000.00, 350000.00, '2026-12-01', 2000.00, 15.00)
ON CONFLICT (user_id) DO UPDATE SET
  current_savings      = EXCLUDED.current_savings,
  target_range_low     = EXCLUDED.target_range_low,
  target_range_high    = EXCLUDED.target_range_high,
  target_purchase_date = EXCLUDED.target_purchase_date,
  per_month_savings    = EXCLUDED.per_month_savings,
  down_payment_percent = EXCLUDED.down_payment_percent,
  updated_date         = NOW();

-- ---------- GOALS ----------
-- Delete-and-reinsert for seeded users (idempotent)
DELETE FROM goals WHERE user_id IN (
  SELECT user_id FROM users WHERE username IN ('jdoe', 'asmith', 'bwilson')
);

INSERT INTO goals (user_id, category_id, goal_name, due_date, is_completed, completed_date) VALUES
  -- jdoe: 2 incomplete goals
  ((SELECT user_id FROM users WHERE username = 'jdoe'),
   (SELECT category_id FROM goal_categories WHERE category_name = 'Savings'),
   'Save $5,000 for down payment', '2026-06-01', FALSE, NULL),

  ((SELECT user_id FROM users WHERE username = 'jdoe'),
   (SELECT category_id FROM goal_categories WHERE category_name = 'Credit'),
   'Raise credit score to 750', '2026-09-01', FALSE, NULL),

  -- asmith: 1 completed, 1 incomplete
  ((SELECT user_id FROM users WHERE username = 'asmith'),
   (SELECT category_id FROM goal_categories WHERE category_name = 'Tour Homes'),
   'Tour 10 homes in target neighborhood', '2026-04-15', TRUE, '2026-03-20T10:00:00Z'),

  ((SELECT user_id FROM users WHERE username = 'asmith'),
   (SELECT category_id FROM goal_categories WHERE category_name = 'Savings'),
   'Get pre-approved for mortgage', '2026-05-01', FALSE, NULL),

  -- bwilson: 1 completed, 1 incomplete
  ((SELECT user_id FROM users WHERE username = 'bwilson'),
   (SELECT category_id FROM goal_categories WHERE category_name = 'Savings'),
   'Open a high-yield savings account', '2026-03-01', TRUE, '2026-02-10T14:30:00Z'),

  ((SELECT user_id FROM users WHERE username = 'bwilson'),
   (SELECT category_id FROM goal_categories WHERE category_name = 'Govt Assistance'),
   'Research FHA loan requirements', '2026-07-01', FALSE, NULL);

-- ---------- REVIEWS ----------
-- Delete-and-reinsert for seeded users (idempotent)
DELETE FROM reviews WHERE user_id IN (
  SELECT user_id FROM users WHERE username IN ('jdoe', 'asmith', 'bwilson')
);

INSERT INTO reviews (user_id, review_title, num_stars, review_text) VALUES
  ((SELECT user_id FROM users WHERE username = 'jdoe'),
   'Great tool for tracking savings', 5,
   'This app helped me stay on top of my home buying goals. Highly recommend!'),

  ((SELECT user_id FROM users WHERE username = 'asmith'),
   'Useful but could use more features', 4,
   'The goal tracking is solid. Would love to see mortgage calculator integration.'),

  ((SELECT user_id FROM users WHERE username = 'bwilson'),
   'Simple and effective', 4,
   'Easy to set up my plan and track progress toward buying my first home.');
