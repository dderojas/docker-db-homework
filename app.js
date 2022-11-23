
const { poolNew, poolOld } = require('./db')
const { oldDBStream, newDBStream } = require('./utils/utilFunctions')



  try {
    poolOld.connect(oldDBStream)
  } catch(e) {
    console.error(e)
  }


  
  try {
    poolNew.connect(newDBStream)
  } catch(e) {
    console.error(e, 'error in first client')
  }


