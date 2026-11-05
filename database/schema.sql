-- NexSwap reference schema (MySQL 8)
-- Hibernate creates these tables automatically. This file documents the schema and
-- can be used to provision a database manually.

CREATE DATABASE IF NOT EXISTS nexswap
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nexswap;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password VARCHAR(255) NOT NULL,
  college_name VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_users_email UNIQUE (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS books (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  author VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(40) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  book_condition VARCHAR(20) NOT NULL,
  listing_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  image_url VARCHAR(500) NULL,
  seller_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_books_seller FOREIGN KEY (seller_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_books_seller (seller_id),
  INDEX idx_books_category (category),
  INDEX idx_books_status (status),
  INDEX idx_books_listing_type (listing_type),
  INDEX idx_books_price (price),
  INDEX idx_books_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exchange_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  book_id BIGINT NOT NULL,
  requester_id BIGINT NOT NULL,
  owner_id BIGINT NOT NULL,
  offered_book_id BIGINT NULL,
  message VARCHAR(1000) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  responded_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_exchange_book FOREIGN KEY (book_id) REFERENCES books (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_exchange_requester FOREIGN KEY (requester_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_exchange_owner FOREIGN KEY (owner_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_exchange_offered_book FOREIGN KEY (offered_book_id) REFERENCES books (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_exchange_book (book_id),
  INDEX idx_exchange_requester (requester_id),
  INDEX idx_exchange_owner (owner_id),
  INDEX idx_exchange_status (status),
  INDEX idx_exchange_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional sample administrator. Replace the password hash before executing.
-- INSERT INTO users (name, email, password, college_name, role, created_at, updated_at)
-- VALUES ('NexSwap Administrator', 'admin@example.com', '$2a$10$REPLACE_WITH_BCRYPT_HASH',
--         'NexSwap University', 'ADMIN', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6));
