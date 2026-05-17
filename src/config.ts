import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing from .env')
}

export const config = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl,
}