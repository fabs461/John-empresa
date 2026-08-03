-- Crear la base de datos
CREATE DATABASE john_empresa;
USE john_empresa;

-- Tabla de administradores
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2b$10$MsVuQi.o5lXpfugHqiXKDeqPTsWrl3PSzAWzg6S0fmNJYsH9Jzc0y');

-- Tabla de productos (basada en tu estructura Frontend)
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    size VARCHAR(5) NOT NULL,
    color VARCHAR(50) NOT NULL,
    description TEXT,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
USE john_empresa;
UPDATE admins 
SET password_hash = '$2b$10$MsVuQi.o5lXpfugHqiXKDeqPTsWrl3PSzAWzg6S0fmNJYsH9Jzc0y' 
WHERE username = 'admin';
SELECT * FROM admins;
ALTER TABLE products
ADD image_url VARCHAR(255);