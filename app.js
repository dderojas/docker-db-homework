const { poolNew, poolOld } = require('./db')
const { oldDBStream, newDBStream } = require('./utils/utilFunctions')
const fs = require('fs')

const newDBQueryStream = `select * from accounts limit`
const oldDBQueryStream = `select * from accounts limit`

const migratedDBReport = fs.createWriteStream('./migratedDBreport.csv')
const oldDBReport = fs.createWriteStream('./missedRecordsFromOld.csv')


  try {
    poolOld.connect(oldDBStream(oldDBQueryStream, oldDBReport))
  } catch(e) {
    console.error(e)
  }


  
  try {
    poolNew.connect(newDBStream(newDBQueryStream, migratedDBReport))
  } catch(e) {
    console.error(e, 'error in first client')
  }


