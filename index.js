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

bot.on('message', message)

async function realStart(ctx) {
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
    ctx.reply('Benvenuto, inserisci la password per utilizzare il bot')
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
    else if (state.operation == 'none') {
      // ctx.reply('wow, è tutto a posto, incredibile')
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
  await ctx.telegram.sendMessage(
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
}

async function onSeeSubject(ctx) {
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
  console.log(buttons)
  ctx.telegram.sendMessage(
    ctx.chat.id,
    "Seleziona la materia",
    buttons
  )
}

async function onSubject(ctx) {
  let subject = ctx.match[0].split('$')[1]
  ctx.reply(subject)
}

async function adminPannel(ctx) {
  await ctx.telegram.sendMessage(
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
}

async function addStudent(ctx) {
  let state = await getState(ctx)
  if (state.admin) {
    await ctx.reply("isnerisci il cognome ed il nome dello studente nel seguente formato 'cognome nome'")
    state.operation = 'addStudent'
    updateState(state)
  }
}

async function onAddStudent(ctx) {
  let state = await getState(ctx)
  try {    
    let message = ctx.update.message.text.split(' ')
    let name = message[1]
    let surname = message[0]
    if (name == "" || surname == "") {
      throw new Error()
    }
    await Database.addStudent(name, surname)
  } catch (e) {
    await ctx.reply('nome alunno non valido')
  }
  state.operation = "none"
  updateState(state)
  await printStudentList(ctx)
  start(ctx)
}

async function addSubject(ctx) {
  let state = await getState(ctx)
  if (state.admin) {
    await ctx.reply('inserisci il nome della materia \'materia\'')
    state.operation = "addSubject"
    updateState(state)
  }
}

async function onAddSubject(ctx) {
  let state = await getState(ctx)
  try {
    let subject = ctx.update.message.text.split(' ')
    if (subject == "" || subject.includes('$')) {
      throw new Error()
    }
    await Database.addSubject(subject)
  } catch (e) {
    await ctx.reply('nome materia non valido')
  }
  state.operation = "none"
  updateState(state)
  await printSubjectList(ctx)
  start(ctx)
}

async function onModifyList(ctx) {
  let state = await getState(ctx)
  let subjects = await Database.getSubjects()
  if(state.admin) {
    ctx.telegram.sendMessage(
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

    state.operation = 'modifyList'
    await updateState(state)
  }
}

async function onModifySubject(ctx) {
  let subject = ctx.match[0].split('$')[1]
  
}

async function visualizzatore(ctx) {
  let state = await getState(ctx)
  await ctx.reply('sei entrato in modalità visualizzatore, per uscire scrivi /exit')
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
  await Database.logout(ctx.chat.id)
  start(ctx)
}

async function exit(ctx) {
  let state = await getState(ctx)
  state.operation = 'none'
  await updateState(state)
  start(ctx)
}

async function printSubjectList(ctx) {
  let subjects = (await Database.getSubjects()).map(el => el.name)
  ctx.reply(subjects.join("\n") || "non ci sono materie")
}

async function printStudentList(ctx) {
  await ctx.reply((await makeStudentList()) || 'nessun alunno trovato' )
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