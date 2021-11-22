export function pushMessageToDelete(messageId) {
  //enqueue message
}

export function deleteMessageQueue(ctx) {
  //delete messages enqueued
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