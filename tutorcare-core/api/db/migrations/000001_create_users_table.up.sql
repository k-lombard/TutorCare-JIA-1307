SET TIMEZONE='US/Eastern';
ALTER DATABASE tutorcare_core SET timezone TO 'US/Eastern';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS users(user_id uuid DEFAULT uuid_generate_v4() NOT NULL, first_name varChar(255), last_name varChar(255), email varChar(255), password varChar(255), date_joined TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, status boolean NOT NULL DEFAULT FALSE, PRIMARY KEY (user_id));
