const db = require('monk')('localhost/baseballdb')


module.exports = {
  __db: db,
  createBatter,
  findBatter,
  removeBatters,
  addBatterCurrent,
  addBatterLast,
  addBatterTenDay,
  addBatterGameLogs,
  createFangraphsData,
  getFangraphsData,
  createPitcher,
  removePitchers,
  addPitcherCurrent,
  addPitcherLast,
  addPitcherTenDay,
  addPitcherGameLogs,
  findPitcher,
  createGame,
  findGame,
  update,
  remove,
  getIndexes,
  findTodaysGames
}

const batters = db.get('batters')
const pitchers = db.get('pitchers')
const fangraphs = db.get('fangraphs')
const games = db.get('games')


// batters
function createBatter(batter) {
  return batters.insert({
    id: batter.ID,
    info: {batter}
  })
}

function findBatter(id){
  return batters.find({id: id})
}

function removeBatters(){
  return batters.remove()
}

function addBatterCurrent(id, stats) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      2018: stats
    }
  })
}

function addBatterLast(id, stats) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      2017: stats
    }
  })
}

function addBatterTenDay(id, stats) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      cumTenDay: stats
    }
  })
}
function addBatterGameLogs(id, games) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      gameLogs: games
    }
  })
}
function createFangraphsData(fanId, data) {
  return fangraphs.insert({
    fanId: fanId,
    data: {data}
  })
}
function getFangraphsData(fanId) {
  return fangraphs.find({ fanId: fanId })
}

// pitchers
function createPitcher(pitcher) {
  return pitchers.insert({
    id: pitcher.ID,
    info: { pitcher }
  })
}
function removePitchers(){
  return pitchers.remove()
}

function addPitcherCurrent(id, stats) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      2018: stats
    }
  })
}

function addPitcherLast(id, stats) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      2017: stats
    }
  })
}
function addPitcherTenDay(id, stats) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      cumTenDay: stats
    }
  })
}
function addPitcherGameLogs(id, games) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      gameLogs: games
    }
  })
}
function findPitcher(id){
  return pitchers.find({ id: id })
}


// games
function createGame(game) {
  return games.insert(game)
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