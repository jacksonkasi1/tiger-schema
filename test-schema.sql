-- Sample PostgreSQL Database Schema for Testing Import

-- Users table
CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL,
  username varchar(100) NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE posts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  title varchar(255) NOT NULL,
  content text,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE comments (
  id serial PRIMARY KEY,
  post_id integer NOT NULL REFERENCES posts(id),
  user_id integer NOT NULL REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE categories (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  slug varchar(100) NOT NULL,
  description text
);

-- Post categories junction table
CREATE TABLE post_categories (
  post_id integer NOT NULL REFERENCES posts(id),
  category_id integer NOT NULL REFERENCES categories(id),
  PRIMARY KEY (post_id, category_id)
);

-- User profiles table
CREATE TABLE user_profiles (
  user_id integer PRIMARY KEY REFERENCES users(id),
  first_name varchar(100),
  last_name varchar(100),
  bio text,
  avatar_url text,
  website varchar(255)
);

-- Post statistics view
CREATE VIEW post_stats AS
SELECT
  p.id,
  p.title,
  COUNT(c.id) as comment_count
FROM posts p
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, p.title;
