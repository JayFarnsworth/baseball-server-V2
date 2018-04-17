
const http = require('http')
const bodyParser = require('body-parser')
const tabletojson = require('tabletojson')
const morgan = require('morgan')
const cors = require('cors')
const port = parseInt(process.env.PORT || 4000)
const devMode = process.env.NODE_ENV !== 'production'
const id_list = require('./results/id_list.json')
const teamColors = require('./teamColors.json');
const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const schedule = require('node-schedule');
const mongo = require('./mongoBaseball.js');


// MySportsFeeds fetch Options
const MSFCredentials = { Authorization: 'Basic a3Vicmlja2FuOkgzbHRvbjE3MTcu' };
var MSFHeaders = {
  credentials: 'same-origin',
  headers: MSFCredentials,
  method: 'GET',
  mode: 'cors',
}

function getDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return yyyy + mm + dd;
}


function getTomorrow() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  dd = Number(dd) + 1;
  dd.toString();
  return yyyy + mm + dd;
}


function getDailyGames(){
  var date = getDate()
  let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/2018-regular/daily_game_schedule.json?fordate=${date}`;
  return cacheFetch(url, MSFHeaders, 1000)
    // .then(data => ({ ...data, url }))
    .then(data => {
      var games = data.dailygameschedule.gameentry
      return games.map(game => {
        var gameObj = {
          id: game.id,
          date: game.date,
          time: game.time,
          awayTeam: game.awayTeam.Abbreviation,
          homeTeam: game.homeTeam.Abbreviation,
          location: game.location
        }
        return gameObj
      })
    })
    .then(allGames => {
      console.log(typeof allGames)
      return cache.set('dailyGames' + date, allGames)
    })
}


function fetchDailyLineups(date){
  return cache.get('dailyGames' + date)
    .then(games => {
      return games.map(game => {
        var url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/current/game_startinglineup.json?gameid=${game.id}`;
        return url
        // return cacheFetch(url, MSFHeaders, 4000)
      })
    })
    .then(urls => {
      cache.set('lineupUrls' + date, urls)
      return urls
    })
    .then(urls => {
      return urls.map(url => cacheFetch(url, MSFHeaders, 4000).catch(err=>{console.log(err)}))
    })
}

function setLineups(date) {
  return cache.get('lineupUrls' + date)
    .then(urls => {
      return urls.map(url => {
        return cache.get(url)
          .then(lineup => {
            return formatLineup(lineup)
          })
          .then(formatted => {
            return addPlayersToLineups(formatted)
              mongo.createGame(formatted)
              cache.set(formatted.id + 'gameLineup', formatted)
          })
      })
    })
}

function formatLineup(lineupObj){
  if (lineupObj === null) return null;
  if (lineupObj === undefined) return null;
  var game = lineupObj.gamestartinglineup;
  var gameObj = {
    id: game.game.id,
    date: game.game.date,
    time: game.game.time,
    location: game.game.location,
    homeTeam: {
      city: game.game.homeTeam.City,
      name: game.game.homeTeam.Name,
      abbr: game.game.homeTeam.Abbreviation,
    },
    awayTeam: {
      city: game.game.awayTeam.City,
      name: game.game.awayTeam.Name,
      abbr: game.game.awayTeam.Abbreviation,
    }
  };
  homeActual = game.teamLineup[1].actual;
  homeExpected = game.teamLineup[1].expected;
  awayActual = game.teamLineup[1].actual;
  awayExpected = game.teamLineup[1].expected;
  if (homeActual !== null) {
    var homeBO = getBO(homeActual);
    var homePositions = getPositions(homeActual)
  } else if (homeExpected !== null) {
    var homeBO = getBO(homeExpected)
    var awayPositions = getPositions(awayExpected)
  } else {
    console.log('expected lineups not set')
    var homeBO = null;
    var homePositions = null;
  } 
  if (awayActual !== null) {
    var awayBO = getBO(awayActual);
    var awayPositions = getPositions(awayActual)
  } else if (awayExpected !== null) {
    var awayBO = getBO(awayExpected)
    var awayPositions = getPositions(awayExpected)
  } else {
    var awayBO = null;
    var awayPositions = null;
  }  
  gameObj.homeLineup = {
    positions: homePositions,
    BO: homeBO
  };
  gameObj.awayLineup = {
    positions: awayPositions,
    BO: awayBO
  }
  return gameObj
}

function getBO(lineup){
  var starters = lineup.starter;
  var BO = starters.filter(item => {
    return (item.position.includes('BO') && item.player !== null)
  })
  if (BO.length === 0) return null
  BO.sort((a,b)=>{
    if (a.position > b.position) return 1
    if (a.position < b.position) return -1
  })
  return BO;
}

function getPositions(lineup){
  var starters = lineup.starter;
  var positions = starters.filter(item => {
    return (!item.position.includes('BO') && item.player !== null)
  })
  return positions;
}

function addPlayersToLineups(lineupObj){
  var homeLineup = lineupObj.homeLineup.positions;
  var awayLineup = lineupObj.awayLineup.positions;
  if (awayLineup !== null) {
    return awayLineup.map(player => {
      let id = player.player.ID;
      return mongo.findBatter(id)
        .then(batter => {
          return player.fullPlayer = batter;
        })
    })
  } else return null
}


const todayGames = () => {
  const date = getDate()
  return Promise.all([
    getDailyGames(),
    fetchDailyLineups(date),
    setLineups(date),
    formatLineup(),
  ])
}

todayGames()
  .then(process.exit)



// const tomorrowGames = async () => {
//   const date = await getTomorrow()
//   const gamesFetch = await getDailyGames(date)
//   const dailyLineups = await fetchDailyLineups(date)
//   const sLine = await setLineups(date)
//   // const formatted = await formatLineup()
// }
// const todayGames = async () => {
//   // const date = await getDate()
//   const gamesFetch = await getDailyGames()
//   // const dailyLineups = await fetchDailyLineups(date)
//   // const sLine = await setLineups(date)
//   // const formatted = await formatLineup()
// }
// todayGames()
// schedule.scheduleJob('1 * * * *', () => {
//   tomorrowGames()
// })
// schedule.scheduleJob('1 * * * *', () => {
//   var d = new Date();
//   if (d.getHours() < 9) {
//     todayGames()
//   }
// })
// todayGames()
// getDailyGames()

