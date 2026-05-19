import express, { type Application, type Request, type Response } from 'express'
import { pool } from './db';

const app : Application = express()


app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))

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

    await pool.query(`
      INSERT INTO user_profiles (user_id, display_name)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO NOTHING;
    `, [result.rows[0].id, name])

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

app.get('/api/users/:id/profile', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Valid user id is required' })
    }

    const result = await pool.query(`
      SELECT
        u.id AS user_id,
        u.name,
        u.email,
        u.age,
        u.is_active,
        p.id AS profile_id,
        p.display_name,
        p.bio,
        p.avatar_url,
        p.location,
        p.website,
        p.created_at AS profile_created_at,
        p.updated_at AS profile_updated_at
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = $1;
    `, [userId])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({ data: result.rows[0] })
  } catch (err) {
    console.error('Error fetching profile:', err)
    return res.status(503).json({
      error: 'Database unavailable',
      details: err instanceof Error ? err.message : String(err)
    })
  }
})

app.put('/api/users/:id/profile', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Valid user id is required' })
    }

    const { display_name, bio, avatar_url, location, website } = req.body

    const userResult = await pool.query(`
      SELECT id
      FROM users
      WHERE id = $1;
    `, [userId])

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const result = await pool.query(`
      INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, location, website, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
        bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
        avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
        location = COALESCE(EXCLUDED.location, user_profiles.location),
        website = COALESCE(EXCLUDED.website, user_profiles.website),
        updated_at = NOW()
      RETURNING *;
    `, [userId, display_name, bio, avatar_url, location, website])

    return res.status(200).json({ message: 'Profile saved', data: result.rows[0] })
  } catch (err) {
    console.error('Error saving profile:', err)
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

export default app
