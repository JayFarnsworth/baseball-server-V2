const db = require('monk')('localhost/baseballdb')


module.exports = {
  __db: db,
  createGame,
  findGame,
  update,
  remove,
  getIndexes,
  findTodaysGames
}

const games = db.get('games')


function createGame(user) {
  return games.insert(user)
}
function findGame(id) {
  return games.find({ id: id })
}
function findTodaysGames(date){
  return games.find({date: date})
}

function update(_id, user) {
  return games.update(_id, user)
}
function remove(query) {
  return games.remove(query)
}
function remove(_id) {
  return games.remove({ _id: _id })
}
function getIndexes() {
  return games.getIndexes()
}