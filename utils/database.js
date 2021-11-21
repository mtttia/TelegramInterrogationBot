import sqlite3 from "sqlite3";
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.join(__dirname, '../database/database.db')

export function addStudent(name, surname) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT position FROM student ORDER BY position DESC LIMIT 1')
    stmt.all((err, row) => {
      if (err) reject(err)
      else {
        let position = 1
        if (row.length == 0) {
          //no student in db
          position = 1
        }
        else {
          position = row[0].position
          position++          
        }
        let stmt2 = db.prepare('INSERT INTO student (name, surname, position) VALUES (?, ?, ?)')
        stmt2.all(name, surname, position, (err, row) => {
          if (err) reject(err)
          else {
            resolve()
          }
        })
        stmt2.finalize()
      }
    })
    stmt.finalize()
    db.close()
  })  
}

export function addChatClient(chatId,admin,{studentId, operation}) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('INSERT INTO chatClient (studentId, chatId, operation, admin) VALUES (?,?,?,?)')
    stmt.all(studentId, chatId, operation, admin, (err, row) => {
      if (err) reject(err)
      else {
        resolve()
      }
    })
    stmt.finalize()
    db.close()
  })
}

export function addSubject(subject) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('INSERT INTO subject (name) VALUES (?)')
    stmt.all(subject, (err, row) => {
      if (err) reject(err)
      else {
        resolve()
      }
    })
    stmt.finalize()
    db.close()
  })
}

export function addInterrogation(subjectName, studentId, position) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT rowId, * FROM subject WHERE name=? LIMIT 1')
    stmt.all(subjectName, (err, row) => {
      if (err) reject(err)
      else {        
        if (row.length == 0) {
          //no student in db
          reject()
        }
        else {
          let subjectId = row[0].rowid
          let stmt2 = db.prepare('INSERT INTO interrogation (subjectId, studentId, position) VALUES (?,?,?)')
          stmt2.all(subjectId, studentId, position, (err, row) => {
            if (err) reject(err)
            else {
              resolve()
            }
          })
          stmt2.finalize()          
        }
      }
    })
    stmt.finalize()
    db.close()
  })  
}

export function changeStudentOrder(subjectName, student1, student2){
  let position1, position2
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT rowId, * FROM subject WHERE name=? LIMIT 1')
    stmt.all(subjectName, (err, row) => {
      if (err) reject(err)
      else {        
        if (row.length == 0) {
          //no student in db
          reject()
        }
        else {
          let subjectId = row[0].rowid
          //search for id1
          let stmt2 = db.prepare('SELECT position FROM interrogation WHERE subjectId=? AND studentId=? LIMIT 1')
          stmt2.all(subjectId, student1, (err, row2) => {
            if (err) reject(err)
            else {
              if (row2.length <= 0) {
                reject()
              }
              else {
                position1 = row2[0].position
                let stmt3 = db.prepare('SELECT position FROM interrogation WHERE subjectId=? AND studentId=? LIMIT 1')
                stmt3.all(subjectId, student2, (err, row3) => {
                  if (err) reject()
                  else {
                    if (row.length <= 0) {
                      reject()
                    }
                    else {
                      position2 = row3[0].position
                      let stmt4 = db.prepare('UPDATE interrogation SET position=? WHERE subjectId=? AND studentId=?')
                      stmt4.all(position2, subjectId, student1, (err, row4) => {
                        if (err) reject()
                        else {
                          let stmt5 = db.prepare('UPDATE interrogation SET position=? WHERE subjectId=? AND studentId=?')
                          stmt5.all(position1, subjectId, student2, (err, row5) => {
                            if (err) reject()
                            else resolve()
                          })
                          stmt5.finalize()
                        }
                      })
                      stmt4.finalize()
                    }
                  }
                })
                stmt3.finalize()
              }
            }
          })
          stmt2.finalize()          
        }
      }
    })
    stmt.finalize()
    db.close()
  })  
}

export function getStudents() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT * FROM student ORDER BY position ASC')
    stmt.all((err, row) => {
      if (err) reject(err)
      else {
        resolve(row)
      }
    })
    stmt.finalize()
    db.close()
  })
}

export function getStudentByChatId(chatId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT studentId FROM chatClient WHERE chatId=? LIMIT 1')
    stmt.all(chatId, (err, row) => {
      if (err) reject(err)
      else {
        let studentId = row[0].studentId
        let stmt2 = db.prepare('SELECT * FROM student WHERE position=? LIMIT 1')
        stmt2.all(studentId, (err, row) => {
          if (err) reject()
          else resolve(row[0])
        })
        stmt2.finalize()
      }
    })
    stmt.finalize()
    db.close()
  })
}

export function chatIdExists(chatId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT chatId FROM chatClient WHERE chatId=? LIMIT 1')
    stmt.all(chatId, (err, row) => {
      if (err) reject(err)
      else {
        if (row.length == 0) {
          resolve(false)
        }
        else {
          resolve(true)
        }
      }
    })
    stmt.finalize()
    db.close()
  })
}

export function logout(chatId) {  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('DELETE FROM chatClient WHERE chatId=?')
    stmt.all(chatId, (err, row) => {
      if (err) reject(err)
      else {
        resolve()
      }
    })
    stmt.finalize()
    db.close()
  })
}

export async function getSubjects() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT * FROM subject')
    stmt.all((err, row) => {
      if (err) reject(err)
      else {
        resolve(row)
      }
    })
    stmt.finalize()
    db.close()
  })
}

export async function updateChatClientStudent(chatId, studentId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('UPDATE chatClient SET studentId=? WHERE chatId=?')
    stmt.all(studentId, chatId, (err, row) => {
      if (err) reject(err)
      else {
        resolve()
      }
    })
    stmt.finalize()
    db.close()
  })
}

export async function isStudent(studentId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT * FROM student WHERE position=?')
    stmt.all(studentId, (err, row) => {
      if (err) reject(err)
      else {
        if (row.length > 0)
          resolve(true)
        else
          resolve(false) 
      }
    })
    stmt.finalize()
    db.close()
  })
} 

export async function isAdmin(chatId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT admin FROM chatClient WHERE chatId=? LIMIT 1')
    stmt.all(chatId, (err, row) => {
      if (err) reject(err)
      else {
        if (row.length > 0) {
          if (row[0].admin)
            resolve(true)
          else
            resolve(false)
        }
        else
          reject() 
      }
    })
    stmt.finalize()
    db.close()
  })
}

export async function getStudentId(chatId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT studentId FROM chatClient WHERE chatId=? LIMIT 1')
    stmt.all(chatId, (err, row) => {
      if (err) reject(err)
      else {
        if (row.length > 0)
          resolve(row[0].studentId)
        else
          reject() 
      }
    })
    stmt.finalize()
    db.close()
  })
}

export async function getState(chatId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT * FROM chatClient WHERE chatId=? LIMIT 1')
    stmt.all(chatId, (err, row) => {
      if (err) reject(err)
      else {
        if (row.length > 0)
          resolve(row[0])
        else
          reject() 
      }
    })
    stmt.finalize()
    db.close()
  })
}

export async function updateState(state) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('UPDATE chatClient SET studentId=?, operation=?, admin=? WHERE chatId=?')
    stmt.all(state.studentId, state.operation, state.admin, state.chatId, (err, row) => {
      if (err) reject(err)
      else {
        resolve()
      }
    })
    stmt.finalize()
    db.close()
  })
}

export async function getSubjectList(subject) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath)
    let stmt = db.prepare('SELECT rowId FROM subject WHERE name=? LIMIT 1')
    stmt.all(subject, (err, row) => {
      if (err) reject(err)
      else {
        let studentId = row[0].rowId
        let stmt2 = db.prepare('SELECT * FROM student WHERE position=? LIMIT 1')
        stmt2.all(studentId, (err, row) => {
          if (err) reject()
          else resolve(row[0])
        })
        stmt2.finalize()
      }
    })
    stmt.finalize()
    db.close()
  })
}