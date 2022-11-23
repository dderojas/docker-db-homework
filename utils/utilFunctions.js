const fs = require('fs')
const { Transform } = require('stream')
const QueryStream = require('pg-query-stream')
const { stringify } = require('csv')
const isEqual = require('lodash.isequal')
const { poolNew, poolOld } = require('../db')


const columns = [
  "id",
  "name",
  "email",
  "favorite_flavor",
  "corrupted",
  "newRecord"
];

const migratedDBreport = fs.createWriteStream('./migratedDBreport.csv')
const oldDBreport = fs.createWriteStream('./missedRecordsFromOld.csv')

const stringifyMigratedData = stringify({ header: true, columns });
const stringifyOldData = stringify({ header: true, columns });

const oldDBStream = (err, client, done) => {
  console.log('oldDB connected!!!') 

  if (err) throw err
  // create stream from old DB
  const query = new QueryStream(`select * from accounts limit 5`)
  const stream = client.query(query)

  const isInNewTable = new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      stream.pause()
      // make sure records from old DB are in the new DB
      let results = await poolNew.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
      stream.resume()

      // save records that didn't make it to new DB
      if (results.rows.length === 0) {
        stringifyOldData.write(chunk)
      }
      callback(null)
    },
  });

  stream.on('end', async () => {
    done()
    console.log('FINISHED oldDB!!!!!!!')
  })
  
  stream.pipe(isInNewTable).pipe(stringifyOldData).pipe(oldDBreport)

}

const newDBStream = (err, client, done) => {
  console.log('newDB connected!!!')

  
  if (err) throw err
  // create stream from new DB
  const query = new QueryStream(`select * from accounts limit 5`)
  const stream = client.query(query)

  const isInOldTable = new Transform({
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
    console.log('FINISHED newDB!!!!!!!')
  })
  
  stream.pipe(isInOldTable).pipe(stringifyMigratedData).pipe(migratedDBreport)
}

module.exports = {
  oldDBStream,
  newDBStream
}