-- =========================================
-- Schema: Goal/Plan/Review app
-- Target DB: PostgreSQL
-- Notes:
--  - Use snake_case in SQL (agent can map to camelCase in code)
--  - Store password as a hash (never plaintext)
-- =========================================

-- Optional: case-insensitive text for unique email/username
-- CREATE EXTENSION IF NOT EXISTS citext;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  user_id        BIGSERIAL PRIMARY KEY,

  username       TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  email          TEXT NOT NULL,

  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,

  created_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_username_uk UNIQUE (username),
  CONSTRAINT users_email_uk UNIQUE (email)
);

-- ---------- GOAL CATEGORIES ----------
CREATE TABLE IF NOT EXISTS goal_categories (
  category_id          BIGSERIAL PRIMARY KEY,
  category_name        TEXT NOT NULL,
  category_description TEXT,

  CONSTRAINT goal_categories_name_uk UNIQUE (category_name)
);

-- ---------- GOALS ----------
CREATE TABLE IF NOT EXISTS goals (
  goal_id         BIGSERIAL PRIMARY KEY,

  user_id         BIGINT NOT NULL,
  category_id     BIGINT NOT NULL,

  goal_name       TEXT NOT NULL,
  due_date        DATE,

  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date  TIMESTAMPTZ,

  created_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT goals_user_fk
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT goals_category_fk
    FOREIGN KEY (category_id) REFERENCES goal_categories(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  -- If is_completed is true, completed_date must be present
  CONSTRAINT goals_completed_date_ck
    CHECK (
      (is_completed = FALSE AND completed_date IS NULL)
      OR
      (is_completed = TRUE  AND completed_date IS NOT NULL)
    )
);

-- Helpful indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category_id ON goals(category_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_completed ON goals(user_id, is_completed);

-- ---------- PLAN (1:1 with users) ----------
-- ERD shows: Plan.userID is both PK and FK -> exactly one plan per user (optional/existence depends on app rules)
CREATE TABLE IF NOT EXISTS plan (
  user_id              BIGINT PRIMARY KEY,

  current_savings       NUMERIC(12,2) NOT NULL DEFAULT 0,

  target_range_low      NUMERIC(12,2),
  target_range_high     NUMERIC(12,2),

  target_purchase_date  DATE,

  per_month_savings     NUMERIC(12,2) NOT NULL DEFAULT 0,

  down_payment_percent  NUMERIC(5,2), -- e.g., 20.00 = 20%
  created_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT plan_user_fk
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT plan_target_range_ck
    CHECK (
      target_range_low IS NULL OR target_range_high IS NULL
      OR target_range_low <= target_range_high
    ),

  CONSTRAINT plan_down_payment_percent_ck
    CHECK (down_payment_percent IS NULL OR (down_payment_percent >= 0 AND down_payment_percent <= 100))
);

-- ---------- REVIEWS ----------
CREATE TABLE IF NOT EXISTS reviews (
  review_id     BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL,

  review_title  TEXT NOT NULL,
  num_stars     INT NOT NULL,
  review_text   TEXT,

  created_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_user_fk
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT reviews_num_stars_ck
    CHECK (num_stars BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_date ON reviews(created_date);
