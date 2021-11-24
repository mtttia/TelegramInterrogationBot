import sqlite3 from 'sqlite3'
const sqlite = sqlite3.verbose()
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = new sqlite.Database(path.join(__dirname, 'database.db'), sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
  if (err) {
    console.log(err.message)
  }
})



db.serialize(function() {
    let sql = "DELETE FROM deleteMessage WHERE 1=1";
    db.run(sql);
  });