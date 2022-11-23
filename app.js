
const { poolNew, poolOld } = require('./db')
const { oldDBStream, newDBStream } = require('./utils/utilFunctions')

const something = `select * from accounts limit 5`
const somethingElse = `select * from accounts limit 5`

  try {
    poolOld.connect(oldDBStream(something))
  } catch(e) {
    console.error(e)
  }


  
  try {
    poolNew.connect(newDBStream(somethingElse))
  } catch(e) {
    console.error(e, 'error in first client')
  }


