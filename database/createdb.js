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
  let sql = "CREATE TABLE `student` (`name` TEXT NOT NULL,`surname` TEXT NOT NULL,`position` TEXT NOT NULL);";
  db.run(sql);
  sql = "CREATE TABLE `chatClient` (`studentId` INT,`chatId` INT NOT NULL, `operation` TEXT NOT NULL, `admin` BOOLEAN NOT NULL);";
  db.run(sql);
  sql = "CREATE TABLE `subject` (`name` INT NOT NULL,PRIMARY KEY (`name`));";
  db.run(sql);
  sql = "CREATE TABLE `interrogation` (`subjectId` TEXT NOT NULL,`studentId` INT NOT NULL,`position` INT NOT NULL);";
  db.run(sql);
});