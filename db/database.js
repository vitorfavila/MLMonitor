var sqlite3 = require("sqlite3").verbose();

const DBSOURCE = "./db/ml_monitor.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log("Connected to the SQLite database.");
    db.run(
      `CREATE TABLE IF NOT EXISTS pesquisa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            search text UNIQUE,
            active integer DEFAULT 1,
            posfilter text,
            exclfilter text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP, 
            updated_at datetime DEFAULT CURRENT_TIMESTAMP, 
            CONSTRAINT search_unique UNIQUE (search)
            )`,
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS price_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          at datetime DEFAULT CURRENT_TIMESTAMP,
          pesquisa_id INTEGER,
          lower_price REAL,
          lower_parcel REAL,
          installments INTEGER,
          FOREIGN KEY (pesquisa_id) REFERENCES pesquisa(id)
      )`
    );
  }
});

module.exports = db;
