const { poolNew, poolOld } = require('../db')
const fs = require('fs')
const csvParser = require('csv-parser')
const { oldDBStream, newDBStream } = require('../utils')



describe('test', () => {

  it('should output populated csv from oldDBStream', async () => {
    const oldDBQueryStream = `select * from accounts limit 10`
    const oldDBReport = fs.createWriteStream('./missedRecordsFromOld.csv')

    try {
     poolOld.connect(oldDBStream(oldDBQueryStream, oldDBReport))
    } catch(e) {
      console.error(e)
    }

    const results = []
    
    setTimeout(() => {
      fs.createReadStream('./missedRecordsFromOld.csv')
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(results);
        expect(results.length > 0).toBe(true)
      });
    }, '5000')

  })

  it('should output populated csv from newDBStream', async () => {
    const newDBQueryStream = `select * from accounts limit 10`
    
    const migratedDBReport = fs.createWriteStream('./migratedDBreport.csv')


    try {
      poolNew.connect(newDBStream(newDBQueryStream, migratedDBReport))
    } catch(e) {
      console.error(e)
    }

    const results = []
    
    setTimeout(() => {
      fs.createReadStream('./migratedDBreport.csv')
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(results);
        expect(results.length > 0).toBe(true)
      });
    }, '5000')

  })
})