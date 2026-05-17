import { Pool } from "pg";
import { config } from "../config";

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  max: 1
});

export const initDB = async () => {
try {
await pool.query(`
    
CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
password VARCHAR(20) NOT NULL,
is_active BOOLEAN DEFAULT true,
age INT,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()

);

    `); console.log('Database initialized successfully');
}
catch (err) {
    console.error('Error initializing database:', err);

}

}