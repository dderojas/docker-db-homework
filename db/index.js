require('dotenv').config()
const { Pool } = require('pg')


const poolOld = new Pool({
  host: 'localhost',
  port: process.env.OLD_DB_PORT,
  user: process.env.OLD_DB_USER,
  password: process.env.OLD_DB_PASSWORD
});

const poolNew = new Pool({
  host: 'localhost',
  port: process.env.NEW_DB_PORT,
  user: process.env.NEW_DB_USER,
  password: process.env.NEW_DB_PASSWORD,
});

module.exports = {
  poolOld,
  poolNew
}