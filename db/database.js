var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "./db/ml_monitor.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE IF NOT EXISTS pesquisa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            search text UNIQUE,
            active integer DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP, 
            updated_at datetime DEFAULT CURRENT_TIMESTAMP, 
            CONSTRAINT search_unique UNIQUE (search)
            )`,
            (err) => {
                if (err) {
                    console.log(err)
                }
            });
    }
});


module.exports = db
