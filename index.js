import { Telegraf } from "telegraf";
import * as Database from './utils/database.js'
import * as Utility from './utils/utility.js'
const deleteMessageQueue = Utility.deleteMessageQueue
const pushMessageToDelete = Utility.pushMessageToDelete

import dotenv from 'dotenv'
dotenv.config()

const bot = new Telegraf(process.env.TOKEN_BOT_TELEGRAM)

bot.start(realStart)

bot.command('logout', logout)
bot.command('exit', exit)

bot.action('addStudent', addStudent)
bot.action('addSubject', addSubject)
bot.action('normalUser', visualizzatore)
bot.action('seeSubject', onSeeSubject)
bot.action(/subject.+/, onSubject)
bot.action('modifyList', onModifyList)
bot.action(/modify.+/, onModifySubject)
bot.action(/randomList.+/,onRandomList)
bot.action(/addStudent.+/, onAddStudentInList)
bot.action(/changePostion.+/, onChangePostion)

bot.on('message', message)

async function realStart(ctx) {
  await deleteMessageQueue(ctx)
  await pushMessageToDelete(ctx, ctx.update.message.message_id)
  let isUserLogged = await Database.chatIdExists(ctx.chat.id)
  if (!isUserLogged) {
    start(ctx)
  }
  else {
    let state = await getState(ctx)
    if (state.admin)
    {
      state.operation = "none"
    }
    await updateState(state)
    start(ctx)
  }
  
}

async function start(ctx) { 
  let isUserLogged = await Database.chatIdExists(ctx.chat.id)
  if (!isUserLogged) {
    let m = await ctx.reply('Benvenuto, inserisci la password per utilizzare il bot')
    await pushMessageToDelete(ctx, m.message_id)
  }
  else {
    action(ctx)
  }
}

async function action(ctx) {
  let state = await Database.getState(ctx.chat.id)
  if (state.admin == true && state.operation != 'normal') {
    adminPannel(ctx)
  }
  else {
    if (state.studentId == null) {
      askLogStudent(ctx)
    }
    else{
      userPannel(ctx)  
    }
    
  }
  
}

async function message(ctx) {
  let isUserLogged = await Database.chatIdExists(ctx.chat.id)
  if(!isUserLogged){
    onPassword(ctx) 
  } 
  else {
    let state = await getState(ctx)  

    if (state.admin && state.operation != 'normal') {
      //admin options
      if (state.operation == "addStudent") {
        onAddStudent(ctx)
      }
      if (state.operation == "addSubject") {
        onAddSubject(ctx)
      }
      if (state.operation.includes('AddStudentInList')) {
        onAddStudentInListGetStudent(ctx)
      }
      if (state.operation.includes('ChangePostionOff')) {
        onChangePostionOff(ctx)
      }
    }
    else {
      //normal user option
      if (state.student == null) {
        onLogStudent(ctx)
      }  
    }
  }
}

async function onPassword(ctx) {
  await pushMessageToDelete(ctx, ctx.update.message.message_id)
  if (ctx.update.message.text == process.env.PASSWORD) {
    //password OK
    let operation = 'none'
    await Database.addChatClient(ctx.chat.id, false,{ operation: operation })
    await start(ctx)
  }
  else if (ctx.update.message.text == process.env.PASSWORD_ADMIN) {
    //password OK
    let operation = 'none'
    await Database.addChatClient(ctx.chat.id, true,{ operation: operation })
    await start(ctx)
  }
  else {
    ctx.reply('password sbagliata, riprovare')
  }
}

async function askLogStudent(ctx) {  
  await ctx.reply((await makeStudentList()) || "non ci sono studenti ancora")
  await ctx.reply("inserisci il numero di fianco al tuo nome per eseguire il login")
}

async function onLogStudent(ctx) {
  let state = await getState(ctx)
  let sId = Number(ctx.update.message.text)
  let isStudent = await Database.isStudent(sId)
  if (isStudent) {
    ctx.reply('login eseguito correttamente')
    state.admin ? state.operation = 'normal' : state.operation = 'none'
    state.studentId = sId
    await updateState(state)
    await start(ctx)
  }
  else {
    ctx.reply('attenzione, id studente non valido, riprova')
  }
}

async function userPannel(ctx) {
  let m = await ctx.telegram.sendMessage(
    ctx.chat.id,
    "Ciao, cosa vuoi fare?",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Visualizza materie",
              callback_data: 'seeSubject'
            }
          ]
        ]
      }
    }
  )
  await pushMessageToDelete(ctx, m.message_id)
}

async function onSeeSubject(ctx) {
  await deleteMessageQueue(ctx)
  let subject = await Database.getSubjects()
  let buttons = {
      reply_markup: {
        inline_keyboard: subject.map(el => {
          return [
              {
                text: el.name,
                callback_data: 'subject$' + el.name
              }
            
          ]
        })
      }
  }  
  let m = await ctx.telegram.sendMessage(
    ctx.chat.id,
    "Seleziona la materia",
    buttons
  )
  await pushMessageToDelete(ctx, m.message_id)
}

async function onSubject(ctx) {
  let subject = ctx.match[0].split('$')[1]
  let m = await ctx.reply((await getSubjectList(subject)) || "nessun alunno presente"); await pushMessageToDelete(ctx, m.message_id)
  start(ctx)
}

async function adminPannel(ctx) {
  let m = await ctx.telegram.sendMessage(
    ctx.chat.id,
    "Ciao admin, cosa vuoi fare?",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Visualizzatore',
              callback_data: 'normalUser'
            },
          ],
          [
            {
              text: 'Aggiungi studente',
              callback_data: 'addStudent'
            },
          ],
          [
            {
              text: 'Aggingi materia',
              callback_data: 'addSubject'
            },
          ],
          [
            {
              text: 'Modifica lista',
              callback_data: 'modifyList'
            },
          ]
        ]
      }
    }
  )
  await pushMessageToDelete(ctx, m.message_id)
}

async function addStudent(ctx) {
  await deleteMessageQueue(ctx)
  let state = await getState(ctx)
  if (state.admin) {
    let m = await ctx.reply("inserisci il cognome ed il nome dello studente nel seguente formato 'cognome nome'")
    await pushMessageToDelete(ctx, m.message_id)
    state.operation = 'addStudent'
    updateState(state)
  }
}

async function onAddStudent(ctx) {
  let state = await getState(ctx)
  await pushMessageToDelete(ctx, ctx.update.message.message_id)
  try {    
    let message = ctx.update.message.text.split(' ')
    let name = message[1]
    let surname = message[0]
    if (name == "" || surname == "") {
      throw new Error()
    }
    await Database.addStudent(name, surname)
  } catch (e) {
    let m = await ctx.reply('nome alunno non valido')
    await pushMessageToDelete(ctx, m.message_id)
  }
  state.operation = "none"
  updateState(state)
  await printStudentList(ctx)
  start(ctx)
}

async function addSubject(ctx) {
  await deleteMessageQueue(ctx)
  let state = await getState(ctx)
  if (state.admin) {
    let m = await ctx.reply('inserisci il nome della materia \'materia\'')
    await pushMessageToDelete(ctx, m.message_id)
    state.operation = "addSubject"
    updateState(state)
  }
}

async function onAddSubject(ctx) {
  let state = await getState(ctx)
  await pushMessageToDelete(ctx, ctx.update.message.message_id)
  try {
    let subject = ctx.update.message.text.split(' ')
    if (subject == "" || subject.includes('$')) {
      throw new Error()
    }
    await Database.addSubject(subject)
  } catch (e) {
    let m = await ctx.reply('nome materia non valido')
    await pushMessageToDelete(ctx, m.message_id)
  }
  state.operation = "none"
  updateState(state)
  await printSubjectList(ctx)
  start(ctx)
}

async function onModifyList(ctx) {
  await deleteMessageQueue(ctx)
  let state = await getState(ctx)
  let subjects = await Database.getSubjects()
  if(state.admin) {
    let m = await ctx.telegram.sendMessage(
      ctx.chat.id,
      "Seleziona la materia da modificare",
      {
        reply_markup: {
          inline_keyboard: subjects.map(el => {
            return [
              {
                text: el.name,
                callback_data: "modify$" + el.name
              }
            ]
          })
        }
      }
    )


    await pushMessageToDelete(ctx, m.message_id)

    state.operation = 'modifyList'
    await updateState(state)
  }
}

async function onModifySubject(ctx) {
  await deleteMessageQueue(ctx)
  let subject = ctx.match[0].split('$')[1]
  let m = await ctx.reply("Lista \n" + ((await getSubjectList(subject)) || "la lista è vuota"))
  await pushMessageToDelete(ctx, m.message_id)
  m = await ctx.telegram.sendMessage(
    ctx.chat.id,
    "Cosa vuoi fare nella lista di " + subject,
    {reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'genera lista casualmente',
            callback_data: "randomList$"+subject
          }
        ],
        [
          {
            text: "aggiungi uno studente",
            callback_data: "addStudent$" + subject
          }
        ],
        [
          {
            text: "scambia posizione studenti",
            callback_data: "changePostion$" + subject
          }
        ]
      ]
    }}
  )

  await pushMessageToDelete(ctx, m.message_id)
}

async function onRandomList(ctx) {
  let subject = ctx.match[0].split('$')[1]
  let student = await Database.getStudents()
  student = Utility.randomList(student)
  let m = await ctx.reply('Lista generata \n' + ((student.map(el => el.position + ". " + el.student.name + " " + el.student.surname + "\n").join('')))); await pushMessageToDelete(ctx, m.message_id)
  await Database.deleteList(subject)
  await Database.insertListStudent(subject, student)
  start(ctx)
}

export async function onAddStudentInList(ctx) {
  let subject = ctx.match[0].split('$')[1]
  let state = await getState(ctx)
  state.operation = "AddStudentInList$"+subject
  await updateState(state)
  let m = await ctx.reply((await makeStudentList()) || "Nessun studente nella lista"); await pushMessageToDelete(ctx, m.message_id)
  m = await ctx.reply('inserisci il numero dello studente che vuoi aggiungere (se vuoi tornare indietro clicca su /start)'); await pushMessageToDelete(ctx, m.message_id)
}

export async function onChangePostion(ctx) {  
  let subject = ctx.match[0].split('$')[1]
  let state = await getState(ctx)
  state.operation = "ChangePostionOff$" + subject
  await updateState(state)
  let m = await ctx.reply((await getSubjectList(subject)) || "Nessuno studente nella lista"); await pushMessageToDelete(ctx, m.message_id)
  m = await ctx.reply('inserisci i numeri degli studenti da scambiare nel seguente formato "1 2"(scambio il primo della lista col secondo) \n(se vuoi tornare indietro clicca su /start)'); await pushMessageToDelete(ctx, m.message_id)
}

export async function onChangePostionOff(ctx) {
  try
  {
    await pushMessageToDelete(ctx, ctx.update.message.message_id)
    let state = await getState(ctx)
    let subject = state.operation.split('$')[1]
    state.operation = 'none'
    await updateState(state)
    let message = ctx.update.message.text.split(' ')
    let s1 = message[0]
    let s2 = message[1]
    await Database.changeStudentOrder(subject, s1, s2)
    let m = await ctx.reply('scambio avvenuto con successo'); await pushMessageToDelete(ctx, m.message_id)
    start(ctx)
  } catch (ex) {
    console.log(ex)
    let m = await ctx.reply('id studente non valido'); await pushMessageToDelete(ctx, m.message_id)
    start(ctx)
  }
    
  
}

export async function onAddStudentInListGetStudent(ctx) {
  await pushMessageToDelete(ctx, ctx.update.message.message_id)
  let state = await getState(ctx)
  let subject = state.operation.split('$')[1]
  state.operation = 'none'
  await updateState(state)
  let message = ctx.update.message.text
  if ((await Database.isStudent(message))) {
    let nextPosition = await Database.getNextListPostion(subject)
    await Database.addInterrogation(subject, message, nextPosition)
    let m = await ctx.reply('interrogazione aggiunta con successo'); await pushMessageToDelete(ctx, m.message_id)
    start(ctx)
  }
  else {
    let m = await ctx.reply('id studente non valido'); await pushMessageToDelete(ctx, m.message_id)
    start(ctx)
  }
  
}

async function getSubjectList(subject) {
  let list = await Database.getInterrogationList(subject)
  return list.map(el => {
    return el.position + ". " + el.student.name + " " + el.student.surname + "\n"
  }).join('')
}

async function visualizzatore(ctx) {
  await deleteMessageQueue(ctx)
  let state = await getState(ctx)
  let m = await ctx.reply('sei entrato in modalità visualizzatore, per uscire scrivi /exit'); await pushMessageToDelete(ctx, m.message_id)
  state.operation = 'normal'
  await updateState(state)
  start(ctx)
}

async function updateState(state) {
  await Database.updateState(state)
}

async function getState(ctx) {
  let state = await Database.getState(ctx.chat.id)
  return state
}

async function logout(ctx) {  
  await pushMessageToDelete(ctx, ctx.update.message.message_id)
  await Database.logout(ctx.chat.id)
  start(ctx)
}

async function exit(ctx) {
  await pushMessageToDelete(ctx, ctx.update.message.message_id)
  let state = await getState(ctx)
  state.operation = 'none'
  await updateState(state)
  start(ctx)
}

async function printSubjectList(ctx) {
  let subjects = (await Database.getSubjects()).map(el => el.name)
  let m = await ctx.reply(subjects.join("\n") || "non ci sono materie"); await pushMessageToDelete(ctx, m.message_id)
}

async function printStudentList(ctx) {
  let m = await ctx.reply((await makeStudentList()) || 'nessun alunno trovato'); await pushMessageToDelete(ctx, m.message_id)
}

async function makeStudentList(){
  let students = await Database.getStudents()
  let arr = students.map(el => {
    return el.position + '. ' + el.name + " " + el.surname
  })
  return arr.join('\n')
}

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))