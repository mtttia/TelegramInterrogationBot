import { addMessageToDelete, getMessageToDelete, deleteMessageToDelete } from "./database.js"

export async function pushMessageToDelete(ctx, messageId) {
  //enqueue message
  await addMessageToDelete(ctx.chat.id, messageId)
}

export async function deleteMessageQueue(ctx) {
  //delete messages enqueued
  let messages = await getMessageToDelete(ctx.chat.id)
  for(let el of messages){
    ctx.deleteMessage(el)
  }
  await deleteMessageToDelete(ctx.chat.id)
}

export function randomList(list) {
  let lista = list
  let arr =[]
  function random(min, max, esclusi){
    let n = Math.floor(Math.random()*(max-min)+min)
    return esclusi.includes(n) ? random(min, max, esclusi) : n
  }

  for(let i = 0; i < lista.length; i++){
    arr[i] = random(0, lista.length, arr)
  }

  lista = arr.map((el, id) => {
    return {student: lista[el], position: id+1}
  })
  return lista
}