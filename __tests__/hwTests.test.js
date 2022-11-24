const { poolNew, poolOld } = require('../db')
const fs = require('fs')
const csvParser = require('csv-parser')
const { oldDBStream, newDBStream } = require('../utils')
const isEqual = require('lodash.isequal')



describe('output csv', () => {

  it('should output populated csv from oldDBStream', (done) => {
    const oldDBQueryStream = `select * from accounts limit 5`
    const oldDBReport = fs.createWriteStream('./missedRecordsFromOld.csv')

    try {
     poolOld.connect(oldDBStream(oldDBQueryStream, oldDBReport))
     const results = []
      
     setTimeout(() => {
       fs.createReadStream('./missedRecordsFromOld.csv')
       .pipe(csvParser())
       .on('data', (data) => results.push(data))
       .on('end', () => {
         expect(results.length > 0).toBe(true)
         done()
       });
     }, '3000')
     
    } catch(e) {
      console.error(e)
    }


  })

  it('should output populated csv from newDBStream', (done) => {
    const newDBQueryStream = `select * from accounts limit 5`
    const migratedDBReport = fs.createWriteStream('./migratedDBreport.csv')

    try {
      poolNew.connect(newDBStream(newDBQueryStream, migratedDBReport))
      const results = []

      setTimeout(() => {
        fs.createReadStream('./migratedDBreport.csv')
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          expect(results.length > 0).toBe(true)
          done()
        });
      }, '3000')

    } catch(e) {
      console.error(e)
    }
  })

  it('missedRecordsFromOld csv should only have the missed records', async () => {
    const readStream = fs.createReadStream('./missedRecordsFromOld.csv')

    try {
      const client = await poolNew.connect()
      const results = []

     setTimeout(() => {
      readStream.pipe(csvParser())
      .on('data', async (chunk) => {
        readStream.pause()
        let queryResults = await client.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])

        if (queryResults.rows.length > 0) {
          results.push(queryResults.rows[0])
          readStream.resume()
        }
        readStream.resume()
      })
      .on('end', () => {
         expect(results.length === 0).toBe(true)
         client.release()
       });
     }, '3000')

    } catch(e) {
      console.error(e)
    }
  })

  it('should output csv from newDBStream with new or corrupted files', async () => {
    const readStream = fs.createReadStream('./migratedDBreport.csv')

    try {
      const client = await poolOld.connect()
      const results = []

     setTimeout(() => {
      readStream.pipe(csvParser())
      .on('data', async (chunk) => {
        readStream.pause()
        let queryResults = await client.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])

        if (queryResults.rows.length > 0) {
          if (chunk['newRecord'] === true) {
            results.push(chunk)
            readStream.resume()

          } else if (chunk['corrupted'] && isEqual(chunk, queryResults.rows[0])) {
            results.push(chunk)
            readStream.resume()
          }

          readStream.resume()
        }
      })
      .on('end', () => {
         expect(results.length === 0).toBe(true)
         client.release()
       });
     }, '3000')

    } catch(e) {
      console.error(e)
    }
  })
})