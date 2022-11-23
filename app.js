const fs = require('fs')
const { Transform, pipeline } = require('stream')
const { Pool } = require('pg')
const QueryStream = require('pg-query-stream')
const { stringify } = require('csv')

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
  
  

(async () => {
  try {
    await poolOld.connect() 
    console.log('oldDB connected!!!') 
  } catch(e) {
    console.error(e, 'error in first client')
  }
})();


(() => {
  
  try {
    poolNew.connect((err, client, done) => {
      console.log('newDB connected!!!')

      
      if (err) throw err
      const query = new QueryStream(`select * from accounts limit 10`)
      const stream = client.query(query)
      const writeStuff = fs.createWriteStream('./something.csv')
      /*
      {
        id,
        name,
        email,
        favorite_flavor,
        missingInNewDB: boolean
        corrupted: boolean
        newRecord: boolean
      }
      */
      const columns = [
        "id",
        "name",
        "email",
        "favorite_flavor",
        "not_in_new_db",
        "corrupted",
        "newRecord"
      ];
      const stringifier = stringify({ header: true, columns: columns });

      const isInTable = new Transform({
        objectMode: true,
        async transform(chunk, encoding, callback) {
          // console.log(chunk, 'CHUNK!@!@#')
          stream.pause()
          let results = await poolOld.query(`SELECT * FROM accounts WHERE id = $1`, [chunk['id']])
          // console.log(results.rows, 'after results!@#')
          stream.resume()

          if (results.rows.length === 0) {
            console.log(chunk, 'chunkinIFFFF')
            chunk['newRecord'] = 'true'
            stringifier.write(chunk)
            callback(null);
          } else {
            callback(null)
          }
        },
      });

      stream.on('end', done)
      
      stream.pipe(isInTable).pipe(stringifier).pipe(writeStuff)
    })
  } catch(e) {
    console.error(e, 'error in first client')
  }
})();

