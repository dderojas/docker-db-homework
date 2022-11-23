const { Transform } = require('stream')
const QueryStream = require('pg-query-stream')
const isEqual = require('lodash.isequal')
const { poolNew, poolOld } = require('../db')
const { stringify } = require('csv')

const columns = [
  "id",
  "name",
  "email",
  "favorite_flavor",
  "corrupted",
  "newRecord"
];

const migratedDataHeaders = stringify({ header: true, columns });
const oldDataHeaders = stringify({ header: true, columns });

const transformFunc = (stream, pool) => {

  const isInTable = new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {

      if (pool === 'new') {
        stream.pause()
        // make sure records from old DB are in the new DB
        let resultsNewQuery = await poolNew.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
        stream.resume()
        // save records that didn't make it to new DB
        if (resultsNewQuery.rows.length === 0) {
          oldDataHeaders.write(chunk)
        }
        callback(null)

      }

      if (pool == 'old') {
        stream.pause()
        // check to see if data from new DB is from the old DB
        let resultsOldQuery = await poolOld.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
        stream.resume()
  
        // record new records
        if (resultsOldQuery.rows.length === 0) {
  
          chunk['newRecord'] = 'true'
          migratedDataHeaders.write(chunk)
  
        // check that migrated records were not corrupted  
        } else if (!isEqual(chunk, resultsOldQuery.rows[0])) {
  
          chunk['corrupted'] = 'true'
          migratedDataHeaders.write(chunk)
  
        }
        callback(null)
      }
    },
  });

  return isInTable
}

const oldDBStream = (streamQuery, reportPath) => {

  return (err, client, done) => {
    console.log('oldDB connected!!!') 
  
    if (err) throw err
    // create stream from old DB
    const query = new QueryStream(streamQuery)
    const stream = client.query(query)
  
  
    stream.on('end', () => {
      done()
      console.log('FINISHED oldDB!!!!!!!')
    })
    
    stream.pipe(transformFunc(stream, 'new')).pipe(oldDataHeaders).pipe(reportPath)
  
  }
}

const newDBStream = (streamQuery, reportPath) => {

  return (err, client, done) => {
    console.log('newDB connected!!!')
  
    
    if (err) throw err
    // create stream from new DB
    const query = new QueryStream(streamQuery)
    const stream = client.query(query)
  
  
    stream.on('end', () => {
      done()
      console.log('FINISHED newDB!!!!!!!')
    })
    
    stream.pipe(transformFunc(stream, 'old')).pipe(migratedDataHeaders).pipe(reportPath)

  }
}

module.exports = {
  oldDBStream,
  newDBStream
}