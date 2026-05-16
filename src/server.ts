import express, { type Application, type Request, type Response } from 'express'
import {Pool} from 'pg'

const app : Application = express()
const port = 5000

app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))


const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_B2lE8zAGIaeg@ep-twilight-star-aq8pmibs-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false }
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
    res.status(500).json({ error: 'Failed to list tables', details: String(err) })
  }
})


app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Express Server', author: 'Kevin Volland' })
});

app.post('/', async(req: Request, res: Response) => {

    // console.log(req.body)
    const { name,email,password, age} = req.body

const result = await pool.query(`
INSERT INTO users (name, email, password, age)
VALUES ($1, $2, $3, $4)
RETURNING *;
`, [name,email,password,age])

console.log(result.rows[0])


    res.status(200).json({ received: "Created", data: result.rows[0] })

    })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
