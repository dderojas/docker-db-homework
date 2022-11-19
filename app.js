const express = require('express')
// const { Sequelize } = require('sequelize')
const { Client } = require('pg')

const app = express()
const port = 3001

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'old',
  password: 'hehehe',
})

  
  app.get('/', async (req, res) => {
    console.log('dfslas;jdflkjadf')

    // try {
    //   let results = await client.query(`dt`)
    //   res.status(200).send(results)
    // } catch (e) {
    //   console.error(e)
    // }
  })
  
  client.connect()
  .then(() => {
    console.log('db connected!')
    app.listen(port, () => {
      console.log(`server listening at port ${port}`)
    })
  })
  .catch((error) => console.error(error))

// const sequelize = new Sequelize('old', 'old', 'hehehe', {
  //   host: 'localhost',
  //   dialect: 'postgres',
  //   port: 5432
  // });

// sequelize.sync().then(() => {
//   console.log('db connected!')
//   app.listen(port, () => {
//     console.log(`server listening at port ${port}`)
//   })
// })
// .catch((error) => console.error(error))