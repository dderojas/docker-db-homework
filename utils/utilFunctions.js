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

const transformFunc = (stream, pool) => {

  const isInTable = new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {

      if (pool === 'new') {
        console.log('new!!!!!!!')
        stream.pause()
        // make sure records from old DB are in the new DB
        let resultsNewQuery = await poolNew.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
        stream.resume()
  
        // save records that didn't make it to new DB
        if (resultsNewQuery.rows.length === 0) {
          stringifyOldData.write(chunk)
        }
        callback(null)

      }

      if (pool == 'old') {
        stream.pause()
        console.log('old!!!!!!!!')
        // check to see if data from new DB is from the old DB
        let resultsOldQuery = await poolOld.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
        stream.resume()
  
        // record new records
        if (resultsOldQuery.rows.length === 0) {
  
          chunk['newRecord'] = 'true'
          stringifyMigratedData.write(chunk)
  
        // check that migrated records were not corrupted  
        } else if (!isEqual(chunk, resultsOldQuery.rows[0])) {
  
          chunk['corrupted'] = 'true'
          stringifyMigratedData.write(chunk)
  
        }
        callback(null)
      }
    },
  });

  return isInTable
}

const oldDBStream = (streamQuery) => {

  return (err, client, done) => {
    console.log('oldDB connected!!!') 
  
    if (err) throw err
    // create stream from old DB
    const query = new QueryStream(streamQuery)
    const stream = client.query(query)
  
  
    stream.on('end', async () => {
      done()
      console.log('FINISHED oldDB!!!!!!!')
    })
    
    stream.pipe(transformFunc(stream, 'new')).pipe(stringifyOldData).pipe(oldDBreport)
  
  }
}

const newDBStream = (streamQuery) => {

  return (err, client, done) => {
    console.log('newDB connected!!!')
  
    
    if (err) throw err
    // create stream from new DB
    const query = new QueryStream(streamQuery)
    const stream = client.query(query)
  
  
    stream.on('end', async () => {
      done()
      console.log('FINISHED newDB!!!!!!!')
    })
    
    stream.pipe(transformFunc(stream, 'old')).pipe(stringifyMigratedData).pipe(migratedDBreport)

  }
}

module.exports = {
  oldDBStream,
  newDBStream
}