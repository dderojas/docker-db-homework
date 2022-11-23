const { Pool } = require('pg')


const poolOld = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'old',
  password: 'hehehe'
});

const poolNew = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'new',
  password: 'hahaha',
});

module.exports = {
  poolOld,
  poolNew
}