const fs = require('fs')
const { Transform } = require('stream')
const { Pool } = require('pg')
const QueryStream = require('pg-query-stream')
const { stringify } = require('csv')
const isEqual = require('lodash.isequal')

const poolOld = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'old',
  password: 'hehehe',
});

const poolNew = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'new',
  password: 'hahaha',
});



const newDBColumns = [
  "id",
  "name",
  "email",
  "favorite_flavor",
  "not_in_new_db",
  "corrupted",
  "newRecord"
];

const oldDBColumns = [
  "id",
  "name",
  "email",
  "favorite_flavor",
  "not_in_new_db",
  "corrupted",
  "newRecord"
];

const migratedDBreport = fs.createWriteStream('./migratedDBreport.csv')
const oldDBreport = fs.createWriteStream('./oldDBreport.csv')

const stringifyMigratedData = stringify({ header: true, columns: newDBColumns });
const stringifyOldData = stringify({ header: true, columns: oldDBColumns });


try {
  poolOld.connect((err, client, done) => {
      console.log('oldDB connected!!!') 

      if (err) throw err
      // create stream from old DB
      const query = new QueryStream(`select * from accounts limit 5`)
      const stream = client.query(query)

      const isInTable = new Transform({
        objectMode: true,
        async transform(chunk, encoding, callback) {
          stream.pause()
          // make sure records from old DB are in the new DB
          let results = await poolNew.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
          stream.resume()

          // save records that didn't make it to new DB
          if (results.rows.length === 0) {
            chunk['not_in_new_db'] = 'true'
            stringifyOldData.write(chunk)
          }
          callback(null)
        },
      });

      stream.on('end', async () => {
        done()
        console.log('FINISHED oldDB!!!!!!!')
      })
      
      stream.pipe(isInTable).pipe(stringifyOldData).pipe(oldDBreport)

    })
  } catch(e) {
      console.error(e)
  }


  
  try {
    poolNew.connect((err, client, done) => {
      console.log('newDB connected!!!')

      
      if (err) throw err
      // create stream from new DB
      const query = new QueryStream(`select * from accounts limit 5`)
      const stream = client.query(query)

      const isInTable = new Transform({
        objectMode: true,
        async transform(chunk, encoding, callback) {
          stream.pause()

          // check to see if data from new DB is from the old DB
          let results = await poolOld.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
          stream.resume()

          // record new records
          if (results.rows.length === 0) {

            chunk['newRecord'] = 'true'
            stringifyMigratedData.write(chunk)

          // check that migrated records were not corrupted  
          } else if (!isEqual(chunk, results.rows[0])) {

            chunk['corrupted'] = 'true'
            stringifyMigratedData.write(chunk)

          }
          callback(null)
        },
      });

      stream.on('end', async () => {
        done()
        console.log('FINISHED!!!!!!!')
      })
      
      stream.pipe(isInTable).pipe(stringifyMigratedData).pipe(migratedDBreport)
    })
  } catch(e) {
    console.error(e, 'error in first client')
  }


