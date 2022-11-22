const express = require('express')
const fs = require('fs')
const { Transform, pipeline } = require('stream')
const { Pool } = require('pg')
const QueryStream = require('pg-query-stream')

const app = express()
const port = 3001

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'old',
  password: 'hehehe',
});

const pool2 = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'new',
  password: 'hahaha',
});
  
  app.get('/', async (req, res) => {
    console.log('success call!')

    const isInTable = new Transform({
      transform(chunk, encoding, callback) {
        console.log(chunk, 'INCHUCNK!@!@#')
        callback(null);
      },
    });

    const query = new QueryStream(`select * from accounts limit 2`)
    let results = await pool.query(query)
    try {
      console.log(results.rows, 'first resultsssss')
      const writeStuff = fs.createWriteStream('./something.txt')

      pipeline(results, isInTable, writeStuff, () => {
        console.log('itworked!@#!@#')
      })
      // let something = results.rows[0]['id']
      // console.log(something, 'SOMETHING!@#!@#!2')
      // let results2 = await pool2.query(`SELECT * FROM accounts WHERE id = $1`, ['ght'])
      // console.log(results2.rows, 'results2222222')

      // res.status(200).send(results.rows)
    } catch (e){ 
      console.error(e)
    }
  });
  


(async () => {
  try {
    await pool.connect() 
    console.log('db1 connected!!!') 
  } catch(e) {
    console.error(e, 'error in first client')
  }
})();

(async () => {
  try {
    await pool2.connect()
    console.log('db2 connected!!!') 
  } catch(e) {
    console.error(e, 'error in first client')
  }
})();

  
  app.listen(port, () => {
    console.log(`server listening at port ${port}`)
  })
