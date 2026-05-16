import 'dotenv/config'
import express, { type Application, type Request, type Response } from 'express'
import {Pool} from 'pg'

const app : Application = express()
const port = 5000

app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  max: 1
});

const initDB = async () => {
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

initDB()

app.get('/tables', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)
    res.status(200).json({ tables: rows.map(r => r.table_name) })
  } catch (err) {
    console.error('Error listing tables:', err)
    res.status(500).json({
      error: 'Failed to list tables',
      details: err instanceof Error ? err.message : String(err)
    })
  }
})


app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Express Server', author: 'Kevin Volland' })
});

app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, email, password, is_active, age, created_at, updated_at
      FROM users
      ORDER BY id ASC;
    `)

    return res.status(200).json({ count: rows.length, data: rows })
  } catch (err) {
    console.error('Error fetching users:', err)
    return res.status(503).json({
      error: 'Database unavailable',
      details: err instanceof Error ? err.message : String(err)
    })
  }
});

app.post('/api/users', async(req: Request, res: Response) => {
  try {
    const { name, email, password, age } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' })
    }

    const result = await pool.query(`
      INSERT INTO users (name, email, password, age)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [name, email, password, age])

    console.log(result.rows[0])

    return res.status(201).json({ received: 'Created', data: result.rows[0] })
  } catch (err) {
    console.error('Error creating user:', err)
    return res.status(503).json({
      error: 'Database unavailable',
      details: err instanceof Error ? err.message : String(err)
    })
  }
})

app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Valid user id is required' })
    }

    const { name, email, password, age, is_active } = req.body

    const result = await pool.query(`
      UPDATE users
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        password = COALESCE($3, password),
        age = COALESCE($4, age),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `, [name, email, password, age, is_active, userId])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({ message: 'User updated', data: result.rows[0] })
  } catch (err) {
    console.error('Error updating user:', err)
    return res.status(503).json({
      error: 'Database unavailable',
      details: err instanceof Error ? err.message : String(err)
    })
  }
})

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Valid user id is required' })
    }

    const result = await pool.query(`
      DELETE FROM users
      WHERE id = $1
      RETURNING *;
    `, [userId])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({ message: 'User deleted', data: result.rows[0] })
  } catch (err) {
    console.error('Error deleting user:', err)
    return res.status(503).json({
      error: 'Database unavailable',
      details: err instanceof Error ? err.message : String(err)
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
