-- =============================================================================
--  LearnTrack — MySQL Database
--  Full schema + demo seed data
--  Compatible with MySQL 8.0+
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Setup
-- -----------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS learntrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learntrack;

SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = '+00:00';


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1  users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              CHAR(36)      NOT NULL,
  username        VARCHAR(50)   NOT NULL,
  avatar_url      TEXT          NOT NULL,
  bio             TEXT                       DEFAULT '',
  current_streak  INT UNSIGNED  NOT NULL     DEFAULT 0,
  created_at      DATETIME      NOT NULL     DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 1.2  passwords  (hashed; separate from profile for clarity)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passwords (
  user_id         CHAR(36)      NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  updated_at      DATETIME      NOT NULL     DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  CONSTRAINT fk_passwords_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 1.3  learning_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_logs (
  id                  CHAR(36)      NOT NULL,
  user_id             CHAR(36)      NOT NULL,
  topic               VARCHAR(200)  NOT NULL,
  description         TEXT                       DEFAULT '',
  minutes_spent       SMALLINT UNSIGNED NOT NULL DEFAULT 30
                      COMMENT 'Goal / planned minutes',
  minutes_completed   SMALLINT UNSIGNED NOT NULL DEFAULT 0
                      COMMENT 'Actual completed minutes (0 → minutes_spent)',
  sticky_color        ENUM(
                        'bg-yellow-100',
                        'bg-emerald-100',
                        'bg-purple-100',
                        'bg-pink-100',
                        'bg-sky-100'
                      ) NOT NULL DEFAULT 'bg-yellow-100',
  date_logged         DATE          NOT NULL,
  created_at          DATETIME      NOT NULL     DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_logs_user_id   (user_id),
  KEY idx_logs_date      (date_logged),
  KEY idx_logs_created   (created_at),

  CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_minutes_completed
    CHECK (minutes_completed <= minutes_spent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 1.4  log_reactions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS log_reactions (
  id            CHAR(36)    NOT NULL,
  log_id        CHAR(36)    NOT NULL,
  user_id       CHAR(36)    NOT NULL,
  reaction_type VARCHAR(10) NOT NULL
                COMMENT 'Emoji string: 🔥 🗿 🧠 💀 👏',
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_reaction_per_user (log_id, user_id, reaction_type),
  KEY idx_reactions_log  (log_id),
  KEY idx_reactions_user (user_id),

  CONSTRAINT fk_reactions_log
    FOREIGN KEY (log_id)  REFERENCES learning_logs (id) ON DELETE CASCADE,
  CONSTRAINT fk_reactions_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 1.5  fragments  (threaded messages on a log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fragments (
  id          CHAR(36)  NOT NULL,
  log_id      CHAR(36)  NOT NULL,
  user_id     CHAR(36)  NOT NULL,
  message     TEXT      NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_fragments_log     (log_id),
  KEY idx_fragments_user    (user_id),
  KEY idx_fragments_created (created_at),

  CONSTRAINT fk_fragments_log
    FOREIGN KEY (log_id)  REFERENCES learning_logs (id) ON DELETE CASCADE,
  CONSTRAINT fk_fragments_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 1.6  external_links  (resources attached to a log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_links (
  id          CHAR(36)      NOT NULL,
  log_id      CHAR(36)      NOT NULL,
  added_by    CHAR(36)      NOT NULL  COMMENT 'user_id of the log owner who added it',
  url         TEXT          NOT NULL,
  title       VARCHAR(300)  NOT NULL  DEFAULT '',
  created_at  DATETIME      NOT NULL  DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_links_log  (log_id),
  KEY idx_links_user (added_by),

  CONSTRAINT fk_links_log
    FOREIGN KEY (log_id)   REFERENCES learning_logs (id) ON DELETE CASCADE,
  CONSTRAINT fk_links_user
    FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 2. VIEWS  (handy read-only aggregates)
-- =============================================================================

-- Leaderboard view: completed minutes per user, all time
CREATE OR REPLACE VIEW vw_leaderboard_all AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  u.current_streak,
  SUM(l.minutes_completed) AS total_minutes_completed,
  SUM(l.minutes_spent)     AS total_minutes_goal,
  COUNT(l.id)              AS total_sessions
FROM users u
JOIN learning_logs l ON l.user_id = u.id
GROUP BY u.id, u.username, u.avatar_url, u.current_streak
ORDER BY total_minutes_completed DESC;


-- Weekly leaderboard
CREATE OR REPLACE VIEW vw_leaderboard_week AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  u.current_streak,
  SUM(l.minutes_completed) AS total_minutes_completed,
  COUNT(l.id)              AS total_sessions
FROM users u
JOIN learning_logs l ON l.user_id = u.id
WHERE l.date_logged >= CURDATE() - INTERVAL 7 DAY
GROUP BY u.id, u.username, u.avatar_url, u.current_streak
ORDER BY total_minutes_completed DESC;


-- Monthly leaderboard
CREATE OR REPLACE VIEW vw_leaderboard_month AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  u.current_streak,
  SUM(l.minutes_completed) AS total_minutes_completed,
  COUNT(l.id)              AS total_sessions
FROM users u
JOIN learning_logs l ON l.user_id = u.id
WHERE l.date_logged >= CURDATE() - INTERVAL 30 DAY
GROUP BY u.id, u.username, u.avatar_url, u.current_streak
ORDER BY total_minutes_completed DESC;


-- Full feed view (joins logs + user info)
CREATE OR REPLACE VIEW vw_feed AS
SELECT
  l.id             AS log_id,
  l.topic,
  l.description,
  l.minutes_spent,
  l.minutes_completed,
  ROUND(l.minutes_completed / l.minutes_spent * 100, 0) AS progress_pct,
  l.sticky_color,
  l.date_logged,
  l.created_at,
  u.id             AS user_id,
  u.username,
  u.avatar_url,
  u.current_streak
FROM learning_logs l
JOIN users u ON u.id = l.user_id
ORDER BY l.created_at DESC;


-- =============================================================================
-- 3. STORED PROCEDURES
-- =============================================================================

DELIMITER $$

-- Toggle a reaction (insert if missing, delete if present)
CREATE PROCEDURE IF NOT EXISTS sp_toggle_reaction(
  IN  p_id            CHAR(36),
  IN  p_log_id        CHAR(36),
  IN  p_user_id       CHAR(36),
  IN  p_reaction_type VARCHAR(10),
  OUT p_action        VARCHAR(10)   -- 'added' | 'removed'
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM log_reactions
    WHERE log_id = p_log_id AND user_id = p_user_id AND reaction_type = p_reaction_type
  ) THEN
    DELETE FROM log_reactions
    WHERE log_id = p_log_id AND user_id = p_user_id AND reaction_type = p_reaction_type;
    SET p_action = 'removed';
  ELSE
    INSERT INTO log_reactions (id, log_id, user_id, reaction_type)
    VALUES (p_id, p_log_id, p_user_id, p_reaction_type);
    SET p_action = 'added';
  END IF;
END$$


-- Safely update progress (clamps to [0, minutes_spent])
CREATE PROCEDURE IF NOT EXISTS sp_update_progress(
  IN p_log_id           CHAR(36),
  IN p_minutes_completed SMALLINT UNSIGNED
)
BEGIN
  UPDATE learning_logs
  SET minutes_completed = LEAST(GREATEST(p_minutes_completed, 0), minutes_spent)
  WHERE id = p_log_id;
END$$


DELIMITER ;


-- =============================================================================
-- 4. DEMO SEED DATA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.1  Users
-- -----------------------------------------------------------------------------
INSERT INTO users (id, username, avatar_url, bio, current_streak, created_at) VALUES
  ('u-alex',
   'alex_codes',
   'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
   'Full-stack enjoyer. RSC evangelist. Rust curious.',
   12,
   '2024-01-01 00:00:00'),

  ('u-priya',
   'priya_learns',
   'https://api.dicebear.com/7.x/bottts/svg?seed=priya',
   'Systems thinker. Database whisperer. Consistent hasher.',
   7,
   '2024-01-02 00:00:00'),

  ('u-marcus',
   'marcus_grind',
   'https://api.dicebear.com/7.x/bottts/svg?seed=marcus',
   'TypeScript or bust. Containerizing everything I own.',
   3,
   '2024-01-03 00:00:00'),

  ('u-nina',
   'nina_nerd',
   'https://api.dicebear.com/7.x/bottts/svg?seed=nina',
   'ML researcher by day, LeetCode grinder by night. 21d streak!',
   21,
   '2024-01-04 00:00:00'),

  ('u-carlos',
   'carlos_dev',
   'https://api.dicebear.com/7.x/bottts/svg?seed=carlos',
   'CSS artist. Vim escapee. Still figuring out exits.',
   0,
   '2024-01-05 00:00:00');


-- -----------------------------------------------------------------------------
-- 4.2  Passwords  (plain-text shown for demo; hash in production with bcrypt)
-- -----------------------------------------------------------------------------
-- Production note: replace values with bcrypt hashes, e.g.:
--   $2b$12$exampleHashHere...
INSERT INTO passwords (user_id, password_hash) VALUES
  ('u-alex',   'demo_password'),
  ('u-priya',  'demo_password'),
  ('u-marcus', 'demo_password'),
  ('u-nina',   'demo_password'),
  ('u-carlos', 'demo_password');


-- -----------------------------------------------------------------------------
-- 4.3  Learning logs
-- -----------------------------------------------------------------------------
INSERT INTO learning_logs
  (id, user_id, topic, description, minutes_spent, minutes_completed, sticky_color, date_logged, created_at)
VALUES
  ('l-01', 'u-alex',
   'React Server Components',
   'Deep dived RSC patterns, figured out the data fetching story. Mind = blown.',
   90, 90, 'bg-yellow-100',
   CURDATE(),            DATE_SUB(NOW(), INTERVAL 2 HOUR)),

  ('l-02', 'u-priya',
   'System Design: URL Shortener',
   'Walked through consistent hashing & sharding strategies. Good stuff.',
   120, 80, 'bg-emerald-100',
   CURDATE(),            DATE_SUB(NOW(), INTERVAL 3 HOUR)),

  ('l-03', 'u-marcus',
   'TypeScript Generics',
   'Finally clicked. Conditional types are actually insane.',
   60, 45, 'bg-purple-100',
   CURDATE() - INTERVAL 1 DAY, DATE_SUB(NOW(), INTERVAL 26 HOUR)),

  ('l-04', 'u-nina',
   'Algorithms: Binary Search',
   'Solved 8 LeetCode problems. Off-by-one errors are my nemesis.',
   150, 150, 'bg-pink-100',
   CURDATE() - INTERVAL 1 DAY, DATE_SUB(NOW(), INTERVAL 28 HOUR)),

  ('l-05', 'u-carlos',
   'CSS Grid Layout',
   'Built a full magazine-style grid. Grid areas are elite.',
   45, 20, 'bg-sky-100',
   CURDATE() - INTERVAL 2 DAY, DATE_SUB(NOW(), INTERVAL 50 HOUR)),

  ('l-06', 'u-alex',
   'Rust Ownership Model',
   'The borrow checker humbled me. Fought it for 2 hours. Won 3 rounds.',
   120, 120, 'bg-emerald-100',
   CURDATE() - INTERVAL 2 DAY, DATE_SUB(NOW(), INTERVAL 52 HOUR)),

  ('l-07', 'u-priya',
   'Database Indexing',
   'B-trees, covering indexes, EXPLAIN ANALYZE. This is real power.',
   75, 60, 'bg-yellow-100',
   CURDATE() - INTERVAL 3 DAY, DATE_SUB(NOW(), INTERVAL 75 HOUR)),

  ('l-08', 'u-nina',
   'Machine Learning: Backprop',
   'Implemented backpropagation from scratch. My gradients finally flow.',
   200, 160, 'bg-purple-100',
   CURDATE() - INTERVAL 3 DAY, DATE_SUB(NOW(), INTERVAL 76 HOUR)),

  ('l-09', 'u-marcus',
   'Docker & Containers',
   'Containerized my whole dev setup. Ship it everywhere now.',
   90, 90, 'bg-sky-100',
   CURDATE() - INTERVAL 4 DAY, DATE_SUB(NOW(), INTERVAL 98 HOUR)),

  ('l-10', 'u-carlos',
   'Vim Motions',
   'Spent 30 mins figuring out how to exit. Progress!',
   30, 10, 'bg-pink-100',
   CURDATE() - INTERVAL 5 DAY, DATE_SUB(NOW(), INTERVAL 120 HOUR)),

  ('l-11', 'u-nina',
   'Kubernetes Basics',
   'Pods, deployments, services. K8s is just Docker with anxiety.',
   180, 180, 'bg-emerald-100',
   CURDATE() - INTERVAL 5 DAY, DATE_SUB(NOW(), INTERVAL 121 HOUR)),

  ('l-12', 'u-alex',
   'Web Performance Optimization',
   'CLS, LCP, INP. Scored 98 on Lighthouse. Gigachad moment.',
   105, 105, 'bg-purple-100',
   CURDATE() - INTERVAL 6 DAY, DATE_SUB(NOW(), INTERVAL 145 HOUR));


-- -----------------------------------------------------------------------------
-- 4.4  Reactions
-- -----------------------------------------------------------------------------
INSERT INTO log_reactions (id, log_id, user_id, reaction_type, created_at) VALUES
  ('r-01', 'l-01', 'u-priya',  '🔥', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  ('r-02', 'l-01', 'u-nina',   '🧠', DATE_SUB(NOW(), INTERVAL 85 MINUTE)),
  ('r-03', 'l-01', 'u-marcus', '🔥', DATE_SUB(NOW(), INTERVAL 80 MINUTE)),
  ('r-04', 'l-02', 'u-alex',   '🗿', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  ('r-05', 'l-02', 'u-nina',   '🔥', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  ('r-06', 'l-03', 'u-priya',  '👏', DATE_SUB(NOW(), INTERVAL 25 HOUR)),
  ('r-07', 'l-04', 'u-alex',   '💀', DATE_SUB(NOW(), INTERVAL 27 HOUR)),
  ('r-08', 'l-04', 'u-carlos', '🧠', DATE_SUB(NOW(), INTERVAL 27 HOUR)),
  ('r-09', 'l-08', 'u-alex',   '🔥', DATE_SUB(NOW(), INTERVAL 75 HOUR)),
  ('r-10', 'l-08', 'u-priya',  '🗿', DATE_SUB(NOW(), INTERVAL 75 HOUR)),
  ('r-11', 'l-11', 'u-marcus', '💀', DATE_SUB(NOW(), INTERVAL 120 HOUR)),
  ('r-12', 'l-12', 'u-nina',   '🔥', DATE_SUB(NOW(), INTERVAL 144 HOUR));


-- -----------------------------------------------------------------------------
-- 4.5  Fragment messages
-- -----------------------------------------------------------------------------
INSERT INTO fragments (id, log_id, user_id, message, created_at) VALUES
  ('f-01', 'l-01', 'u-priya',
   'RSC is a game changer. Did you try it with Next.js 14?',
   DATE_SUB(NOW(), INTERVAL 90 MINUTE)),

  ('f-02', 'l-01', 'u-alex',
   'Yeah! The server actions make forms actually fun to write now 🔥',
   DATE_SUB(NOW(), INTERVAL 72 MINUTE)),

  ('f-03', 'l-01', 'u-marcus',
   'Gonna study this tomorrow. Thanks for the inspo!',
   DATE_SUB(NOW(), INTERVAL 48 MINUTE)),

  ('f-04', 'l-02', 'u-nina',
   'System design interviews are the final boss. Keep grinding 💪',
   DATE_SUB(NOW(), INTERVAL 150 MINUTE)),

  ('f-05', 'l-02', 'u-priya',
   'Update: finished the hashing section. Consistency is wild 🤯',
   DATE_SUB(NOW(), INTERVAL 108 MINUTE)),

  ('f-06', 'l-04', 'u-alex',
   'Binary search on a rotated array is where it gets spicy. You done that one?',
   DATE_SUB(NOW(), INTERVAL 25 HOUR)),

  ('f-07', 'l-04', 'u-nina',
   'Did 3 of those! Off-by-one errors haunt my dreams 💀',
   DATE_SUB(NOW(), INTERVAL 24 HOUR)),

  ('f-08', 'l-08', 'u-priya',
   'Backprop from scratch is PEAK brain training. W move.',
   DATE_SUB(NOW(), INTERVAL 74 HOUR)),

  ('f-09', 'l-08', 'u-carlos',
   'I tried this once and gave up 😭 respect.',
   DATE_SUB(NOW(), INTERVAL 73 HOUR)),

  ('f-10', 'l-08', 'u-nina',
   'Progress update: 40 more minutes in, gradients actually converging now!',
   DATE_SUB(NOW(), INTERVAL 70 HOUR)),

  ('f-11', 'l-09', 'u-alex',
   'Docker compose or bare containers?',
   DATE_SUB(NOW(), INTERVAL 96 HOUR)),

  ('f-12', 'l-09', 'u-marcus',
   'Both! compose for dev, bare for the CI pipeline.',
   DATE_SUB(NOW(), INTERVAL 95 HOUR)),

  ('f-13', 'l-12', 'u-priya',
   '98 on Lighthouse?? That is actual witchcraft.',
   DATE_SUB(NOW(), INTERVAL 143 HOUR)),

  ('f-14', 'l-12', 'u-alex',
   'It is just lazy loading + font subsetting. Anyone can do it!',
   DATE_SUB(NOW(), INTERVAL 142 HOUR));


-- -----------------------------------------------------------------------------
-- 4.6  External links
-- -----------------------------------------------------------------------------
INSERT INTO external_links (id, log_id, added_by, url, title, created_at) VALUES
  ('lk-01', 'l-01', 'u-alex',
   'https://www.youtube.com/watch?v=g5BGoLyGjY0',
   'React Server Components Deep Dive',
   DATE_SUB(NOW(), INTERVAL 108 MINUTE)),

  ('lk-02', 'l-01', 'u-alex',
   'https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md',
   'RFC: React Server Components',
   DATE_SUB(NOW(), INTERVAL 96 MINUTE)),

  ('lk-03', 'l-02', 'u-priya',
   'https://www.youtube.com/watch?v=UF9Ubu1x5Ow',
   'Consistent Hashing Explained',
   DATE_SUB(NOW(), INTERVAL 168 MINUTE)),

  ('lk-04', 'l-02', 'u-priya',
   'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
   'System Design Notes (Drive)',
   DATE_SUB(NOW(), INTERVAL 150 MINUTE)),

  ('lk-05', 'l-04', 'u-nina',
   'https://github.com/neetcode-gh/leetcode',
   'NeetCode LeetCode Solutions',
   DATE_SUB(NOW(), INTERVAL 27 HOUR)),

  ('lk-06', 'l-08', 'u-nina',
   'https://colab.research.google.com/drive/1qMc3-supporting-example',
   'Backprop Implementation Notebook',
   DATE_SUB(NOW(), INTERVAL 75 HOUR)),

  ('lk-07', 'l-09', 'u-marcus',
   'https://docs.google.com/document/d/1supporting-example/edit',
   'Docker Cheatsheet',
   DATE_SUB(NOW(), INTERVAL 97 HOUR)),

  ('lk-08', 'l-12', 'u-alex',
   'https://www.youtube.com/watch?v=reG_FNVFONU',
   'Web Vitals Explained by Google',
   DATE_SUB(NOW(), INTERVAL 144 HOUR));


-- =============================================================================
-- 5. RE-ENABLE CONSTRAINTS
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- 6. QUICK VERIFICATION QUERIES  (run manually to confirm seed loaded)
-- =============================================================================

/*
-- Count rows per table
SELECT 'users'          AS tbl, COUNT(*) AS n FROM users
UNION ALL
SELECT 'passwords',     COUNT(*) FROM passwords
UNION ALL
SELECT 'learning_logs', COUNT(*) FROM learning_logs
UNION ALL
SELECT 'log_reactions', COUNT(*) FROM log_reactions
UNION ALL
SELECT 'fragments',     COUNT(*) FROM fragments
UNION ALL
SELECT 'external_links',COUNT(*) FROM external_links;

-- Leaderboard (all time)
SELECT * FROM vw_leaderboard_all;

-- Full feed (latest 10)
SELECT log_id, username, topic, progress_pct, created_at
FROM vw_feed
LIMIT 10;

-- Reaction counts per log
SELECT l.topic, r.reaction_type, COUNT(*) AS cnt
FROM log_reactions r
JOIN learning_logs l ON l.id = r.log_id
GROUP BY l.topic, r.reaction_type
ORDER BY l.topic, cnt DESC;
*/
