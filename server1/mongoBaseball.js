const db = require('monk')('localhost/baseballdb')


module.exports = {
  __db: db,
  createBatter,
  findBatter,
  addBatterStats,
  createGame,
  findGame,
  update,
  remove,
  getIndexes,
  findTodaysGames
}

const batters = db.get('batters')
const games = db.get('games')

function createBatter(batter) {
  return batters.insert({
    id: batter.ID,
    info: {batter}
  })
}
function findBatter(id){
  return batters.find({id: id})
}
function addBatterStats(id, stats) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      stats: stats
    }
  })
}

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