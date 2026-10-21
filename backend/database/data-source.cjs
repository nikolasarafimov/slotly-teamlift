const path = require('node:path')
const { DataSource } = require('typeorm')
const dotenv = require('dotenv')

const {
  InitialSlotlySchema1792531200000,
} = require('./migrations/1792531200000-initial-slotly-schema.cjs')

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

function required(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    )
  }

  return value
}

const dataSource = new DataSource({
  type: 'postgres',

  host: required('DB_HOST'),
  port: Number(required('DB_PORT')),

  username: required('DB_USERNAME'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),

  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: true }
      : false,

  synchronize: false,

  migrationsTableName: 'schema_migrations',

  migrations: [
    InitialSlotlySchema1792531200000,
  ],
})

module.exports = dataSource