CREATE DATABASE users;

CREATE TABLE userInfo (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(10) NOT NULL,
    user_password INTEGER NOT NULL,
    isAdmin BOOLEAN DEFAULT 'false'
);