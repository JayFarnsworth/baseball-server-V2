const http = require('http')
const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const tabletojson = require('tabletojson')
const morgan = require('morgan')
const cors = require('cors')
const app = module.exports = express()
const server = http.createServer(app)
const port = parseInt(process.env.PORT || 4000)
const devMode = process.env.NODE_ENV !== 'production'
const players = require('./results/players.json')
const id_list = require('./results/id_list.json')
const cheerio = require('cheerio');
const idList = require('./player_ids.json');
const teamColors = require('./teamColors.json');
const fetch = require('node-fetch');
const fs = require('fs');
const playerObject = require('./localServerFiles/playerObject.json')

var rp = require('request-promise');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
const testingDate = '20170920';
const testingYear = '2017'



app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(morgan(devMode ? 'dev' : 'combined'))
app.use(cors({ origin: true }))

// authentication
// var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
// var header = { 'Host': 'www.example.com', 'Authorization': auth };
const MSFHeaders = { Authorization: 'Basic a3Vicmlja2FuOkgzbHRvbjE3MTcu' };
var rosters;


function getDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return yyyy + mm + dd;
}
function delay(msec) {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  })
}


console.log(getDate())

app.get('/rosterplayers', function (req, res) {
  var todaysDate = 20170920;
  var url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/2017-regular/roster_players.json?fordate=' + todaysDate;
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  }).then(resp => resp.json())
    .then(body => {
      var players = body.rosterplayers.playerentry;
      var url1 = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/2017-regular/active_players.json';
      fetch(url1, {
        credentials: 'same-origin',
        headers: MSFHeaders,
        method: 'GET',
        mode: 'cors'
      }).then(resp => resp.json())
        .then(resp => {
          var teamRosters = {};
          var unassignedPlayers = [];
          var allPlayers = resp.activeplayers.playerentry;
          for (let team of teams) {
            teamRosters[team] = {}
          };
          for (let player of players) {
            if (player.team) {
              var colors = teamColors.mlbColors.filter(color => {
                if (player.team.Name === color.name) return color;
              });
              var border = {
                border: '6px solid ' + colors[0].colors.secondary,
                backgroundColor: colors[0].colors.primary,
              };
              var logo = colors[0].logo;       
            } else {
              var colors = [{colors:{}}];
              border = {};
            }
            let a = allPlayers.filter(p=>{
              if (p.player.ID == player.player.ID) return p; 
            })
            var IDs = id_list.filter(id=>{
              let name = player.player.FirstName + ' ' + player.player.LastName;
              let normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
              if (normalized === id.espn_name) return id;
            })
            if (IDs[0] !== undefined) {
              var IDSet = {
                bref_id: IDs[0].bref_id,
                mlb_id: IDs[0].mlb_id,
                fg_id: IDs[0].fg_id,
                espn_id: IDs[0].espn_id,
                rotowire_id: IDs[0].rotowire_id,
                msf_id: player.player.ID
              }
            } else var IDSet = {};
            if (a[0] !== undefined) {
              player.info = {
                ID: a[0].player.ID,
                LastName: a[0].player.LastName,
                FirstName: a[0].player.FirstName,
                JerseyNumber: a[0].player.JerseyNumber,
                Position: a[0].player.Position,
                Team: {
                  Info: player.team,
                  Colors: colors[0].colors,
                  Border: border,
                  logo: logo
                },
                Image: a[0].player.officialImageSrc,
                Handedness: a[0].player.handedness,
                Info: {
                  Age: a[0].player.Age,
                  Height: a[0].player.Height,
                  Weight: a[0].player.Weight,
                  Birthday: a[0].player.BirthDate,
                  BirthCity: a[0].player.BirthCity,
                  BirthCountry: a[0].player.BirthCountry,
                  IsRookie: a[0].player.IsRookie
                },
                IDs: IDSet
              }
              if (player.team) {
                teamRosters[player.team.Abbreviation][player.info.ID] = player.info;
                if (!('backups' in teamRosters[player.team.Abbreviation])) {
                  teamRosters[player.team.Abbreviation]['backups'] = {};
                }
                teamRosters[player.team.Abbreviation]['backups'][player.info.LastName] = player.info;
              } else {
                unassignedPlayers.push(player.player)
              }
            }
          }
          fs.writeFile('./localServerFiles/playerObject.json', JSON.stringify(teamRosters), function (err) {

            console.log('File written as playerObject.json');

          })
          res.send(teamRosters)
        })
    })
})

app.get('/games', function (req, res) {
  if (req.query.date) {
    var date = req.query.date;
  } else {
    var date = getDate();
  }
  let url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/2017-regular/daily_game_schedule.json?fordate=' + date;
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  })
  .then(resp=>resp.json())
  .then(resp=>{
    res.send(resp.dailygameschedule.gameentry)
    fs.writeFile('./localServerFiles/dailyGames.json', JSON.stringify(resp.dailygameschedule.gameentry), function (err) {
      console.log('File written as dailyGames.json');
    })
  })
})

app.get('/getallgames', function (req, res) {
  var gameList = require('./localServerFiles/dailyGames.json');
  const currentDelay = 1;
  if (req.query.date) {
    var year = '2017';
    var date = req.query.date;
    var lineUpType = 'actual';
  } else {
    var year = '2018';
    var date = getDate();
    var lineUpType = 'expected';
  };
  var idList = [];
  for (let game of gameList) {
    idList.push(game.id);
  }
  const urls = idList
    .map(id => `https://api.mysportsfeeds.com/v1.2/pull/mlb/${year}-regular/game_startinglineup.json?gameid=${id}&lineuptype=${lineUpType}`);
  function getJSON(url, index) {
    return Promise.resolve()
      .then(() => {
        return delay(index * currentDelay);
      })
      .then(() => {
        return fetch(url, {
          credentials: 'same-origin',
          headers: MSFHeaders,
          method: 'GET',
          mode: 'cors'
        })
          .then(request => request.json())
      })
  }
  const results = urls
    .map(getJSON)
  Promise.all(results)
    .then(allGames => {
      res.send(allGames);
      fs.writeFile('./localServerFiles/dailyLineups.json', JSON.stringify(allGames), function (err) {
        console.log('File written as dailyLineups.json');
      })
    })
})

app.get('/formatgameobject', function (req, res) {
  var lineups = require('./localServerFiles/dailyLineups.json');
  var players = require('./localServerFiles/playerObject.json');
  var fullGameObjects = [];
  for (let g of lineups) {
    var game = g.gamestartinglineup;
    var gameObj = {};
    gameObj.id = game.game.id;
    gameObj.date = game.game.date;
    gameObj.time = game.game.time;
    gameObj.location = game.game.location;
    gameObj.homeTeam = {
      id: game.game.homeTeam.ID,
      city: game.game.homeTeam.City,
      name: game.game.homeTeam.Name,
      abbr: game.game.homeTeam.Abbreviation,
    };
    var homeBO = [];
    var homePOS = [];
    let homeObj = game.teamLineup[1];
    for (let player of homeObj.actual.starter) {
      if (player.position.includes('BO')) {
        homeBO.push(player);
      } else {
        homePOS.push(player)
      }
    }
    homeBO.sort((a, b) => {
      if (a.position[2] > b.position[2]) return 1;
      if (a.position[2] < b.position[2]) return -1;
    });
    homeBO.map(player=>{
      player.batOrder = player.position[2];
      player.info = players[gameObj.homeTeam.abbr][player.player.ID];
      delete player.player;
      delete player.position;
      for (let position of homePOS) {
        if (position.position == 'P') {
          if (players[gameObj.homeTeam.abbr][position.player.ID] === undefined) {
            gameObj.homeTeam.pitcher = players[gameObj.homeTeam.abbr]['backups'][position.player.LastName]
          }
          gameObj.homeTeam.pitcher = players[gameObj.homeTeam.abbr][position.player.ID];
        }
        if (position.player !== null && player.info !== undefined) {
          if (position.player.ID === player.info.ID) {
            player.position = position.position;
          }
        }
      }
      if (player.position === undefined) player.position = 'DH';
    })
    gameObj.awayTeam = {
      id: game.game.awayTeam.ID,
      city: game.game.awayTeam.City,
      name: game.game.awayTeam.Name,
      abbr: game.game.awayTeam.Abbreviation,
    };
    var awayBO = [];
    var awayPOS = [];
    let awayObj = game.teamLineup[0];
    for (let player of awayObj.actual.starter) {
      if (player.position.includes('BO')) {
        awayBO.push(player);
      } else {
        awayPOS.push(player)
      }
    }
    awayBO.sort((a, b) => {
      if (a.position[2] > b.position[2]) return 1;
      if (a.position[2] < b.position[2]) return -1;
    });
    awayBO.map(player => {
      player.batOrder = player.position[2];
      player.info = players[gameObj.awayTeam.abbr][player.player.ID];
      for (let position of awayPOS) {
        if (position.position == 'P') {
          gameObj.awayTeam.pitcher = players[gameObj.awayTeam.abbr][position.player.ID]
          if (gameObj.awayTeam.pitcher === undefined || gameObj.awayTeam.pitcher === null) {
            gameObj.awayTeam.pitcher = players[gameObj.awayTeam.abbr]['backups'][position.player.LastName]
          }
        } 
        if (position.player !== null) {
          if (position.player.ID === player.info.ID) {
            player.position = position.position;
          }
        }
      }
      if (player.position === undefined) player.position = 'DH';
    })
    if (gameObj)
    gameObj.homeTeam.lineup = homeBO;
    gameObj.awayTeam.lineup = awayBO;
    fullGameObjects.push(gameObj)
  }
  // for (let game of fullGameObjects) {
  //   if (game.homeTeam.pitcher === undefined) {
  //     console.log('hi')
  //     game.homeTeam.pitcher = players[game.homeTeam.Abbreviation]['backups']
  //   }
  //   if (game.awayTeam.pitcher === undefined) {
  //     console.log('hi')
  //   }
  // }
  res.send(fullGameObjects)
  fs.writeFile('./localServerFiles/allGamesFullFormattedLineups.json', JSON.stringify(fullGameObjects), function (err) {
    console.log('File written as allGamesFullFormattedLineups.json');
  })
})

app.get('/fetchpitchercumdata', function (req, res) {
  var gameObjects = require('./localServerFiles/allGamesFullFormattedLineups.json');
  var ids = [];
  for (let game of gameObjects) {
    if (!game.homeTeam.pitcher) res.send(game)
    var homePitcherId = game.homeTeam.pitcher.ID
    var awayPitcherId = game.awayTeam.pitcher.ID
    ids.push(homePitcherId)
    ids.push(awayPitcherId)
  }
  var commaSeparated = ''
  for (let id of ids){
    console.log(id)
    commaSeparated += id + ',';
  }
  console.log(commaSeparated)
  var url = `http://localhost:4000/fetchpitchercumapi/?pitcher=${commaSeparated}&year=2017`
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  }).then(resp=>resp.json())
  .then(resp=>{
    for (let game of gameObjects) {
      for (let stat of resp) {
        let pitcher = stat.id;
        let homePitcher = game.homeTeam.pitcher.ID;
        let awayPitcher = game.awayTeam.pitcher.ID;
        if (pitcher === homePitcher) game.homeTeam.pitcher.Stats = stat.stats;
        if (pitcher === awayPitcher) game.awayTeam.pitcher.Stats = stat.stats;
      }
    }
    res.send(gameObjects)
    fs.writeFile('./localServerFiles/PitcherCumPlayerObj.json', JSON.stringify(gameObjects), function (err) {
      console.log('File written as PitcherCumPlayerObj.json');
    })
  })
})

app.get('/fetchpitchercumapi', function (req, res) {
  if (req.query.year) {
    var year = req.query.year;
  } else {
    var year = '2018';
  }
  var pitcherIds = req.query.pitcher;
  let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/${year}-regular/cumulative_player_stats.json?player=${pitcherIds}&playerstats=W,L,ERA,IP,H,2B,3B,ER,HR,BB,StrM,GroB,FlyB,LD,SO,AVG,WHIP,TBF,NP,OBP,SLG,OPS,GS`;
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  })
    .then(resp => resp.json())
    .then(resp => {
      console.log(resp)
      var statsObjects = [];
      for (let player of resp.cumulativeplayerstats.playerstatsentry){
        var s = player.stats;
        var statsObj = {
          id: player.player.ID,
          stats: {
            year: '2017',
            G: s.GamesPlayed['#text'],
            W: s.Wins['#text'],
            L: s.Losses['#text'],
            H: s.HitsAllowed['#text'],
            ERA: s.EarnedRunAvg['#text'],
            IP: s.InningsPitched['#text'],
            '2B': s.SecondBaseHitsAllowed['#text'],
            '3B': s.ThirdBaseHitsAllowed['#text'],
            ER: s.EarnedRunsAllowed['#text'],
            HR: s.HomerunsAllowed['#text'],
            BB: s.PitcherWalks['#text'],
            STRM: s.PitcherStrikesMiss['#text'],
            GROB: s.PitcherGroundBalls['#text'],
            FLYB: s.PitcherFlyBalls['#text'],
            LD: s.PitcherLineDrives['#text'],
            SO: s.PitcherStrikeouts['#text'],
            BA: s.PitchingAvg['#text'],
            WHIP: s.WalksAndHitsPerInningPitched['#text'],
            TBF: s.TotalBattersFaced['#text'],
            NP: s.PitchesThrown['#text'],
            OBP: s.PitcherOnBasePct['#text'],
            SLG: s.PitcherSluggingPct['#text'],
            OPS: s.PitcherOnBasePlusSluggingPct['#text']
          }
        }
        statsObjects.push(statsObj)
      }
      res.send(statsObjects)
    })
})


app.get('/starters', function (req, res) {
  if (req.query.year) {
    var year = req.query.year;
  } else {
    var year = '2018';
  }
  var gameId = req.query.gameid;
  let url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/' + year + '-regular/game_startinglineup.json?gameid=' + gameId;
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  })
    .then(resp => resp.json())
    .then(resp => {
      res.send(resp.gamestartinglineup)
    })
})

function getAllBatterIds (gameObj) {
  var commaSeparated = '';
  for (let game of gameObj) {
    var homeLineup = game.homeTeam.lineup;
    var awayLineup = game.awayTeam.lineup;
    var ids = [];
    for (let player of homeLineup) {
      if (player.info) {
        let id = player.info.ID;
        ids.push(id);
      }
    }
    for (let player of awayLineup) {
      if (player.info) {
        let id = player.info.ID;
        ids.push(id);
      }
    }
    for (let id of ids) {
      commaSeparated += id + ',';
    }
  }
  return commaSeparated;
}

app.get('/addbatterstats', function (req, res) {
  const gameObj = require('./localServerFiles/PitcherCumPlayerObj.json');
  var commaSeparated = getAllBatterIds(gameObj);
  var year = '2017';
  var url = `http://localhost:4000/battercumstats/?playerid=${commaSeparated}&year=${year}`;
  fetch(url).then(resp => resp.json()).then(stats => {

    let gamesNew = gameObj.map(game=>{
      var homeLineup = game.homeTeam.lineup.map(player=>{
        if (player.info) {
          var playerID = player.info.ID;
          var playerStats = stats[playerID]
          player.stats = {
            year: playerStats.year,
            stats: playerStats.stats
          }
        }
        return player
      })
      var awayLineup = game.awayTeam.lineup.map(player => {
        var playerID = player.info.ID;
        var playerStats = stats[playerID]
        player.stats = {
          year: playerStats.year,
          stats: playerStats.stats
        }
        return player
      })
      game.awayTeam.lineup = awayLineup;
      game.homeTeam.lineup = homeLineup;
      return game
    })
    res.send(gamesNew)
    fs.writeFile('./localServerFiles/allPlayersWithCumStats.json', JSON.stringify(gamesNew), function (err) {
      console.log('File written as allPlayersWithCumStats.json');
    })
  })
})

app.get('/battercumstats', function (req, res) {
  if (req.query.year) {
    var year = req.query.year;
  } else {
    var year = '2018';
  }
  var playerIds = req.query.playerid;
  let url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/' + year + '-regular/cumulative_player_stats.json?player=' + playerIds + '&playerstats=AB,R,H,2B,3B,HR,RBI,BB,SO,AVG,SLG,OPS,PA,LOB,GroB,FlyB,LD,NP,StrM,Swi';
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  })
    .then(resp => resp.json())
    .then(resp => {
      var objs = {};
      for (let player of resp.cumulativeplayerstats.playerstatsentry) {
        var s = player.stats;
        var obj = {
          id: player.player.ID,
          year: year,
          stats: {
            G: s.GamesPlayed['#text'],
            AB: s.AtBats['#text'],
            R: s.Runs['#text'],
            H: s.Hits['#text'],
            '2B': s.SecondBaseHits['#text'],
            '3B': s.ThirdBaseHits['#text'],
            HR: s.Homeruns['#text'],
            RBI: s.RunsBattedIn['#text'],
            BB: s.BatterWalks['#text'],
            SWI: s.BatterSwings['#text'],
            STRM: s.BatterStrikesMiss['#text'],
            GROB: s.BatterGroundBalls['#text'],
            FLYB: s.BatterFlyBalls['#text'],
            LD: s.BatterLineDrives['#text'],
            SO: s.BatterStrikeouts['#text'],
            BA: s.BattingAvg['#text'],
            SLG: s.BatterSluggingPct['#text'],
            OPS: s.BatterOnBasePlusSluggingPct['#text'],
            NP: s.PitchesFaced['#text'],
            PA: s.PlateAppearances['#text'],
            LOB: s.LeftOnBase['#text']
          }
        }
        objs[obj.id] = obj
      }
     res.send(objs)
    })
})

app.get('/getallbatterlogs', function (req, res) {
  var gameObj = require('./localServerFiles/allPlayersWithCumStats.json');
  var playerIds = getAllBatterIds(gameObj);
  console.log(playerIds)
  fetch(`http://localhost:4000/battergamelog/?playerid=${playerIds}&date=${20170920}`)
  .then(resp=>resp.json()).then(logs=>{
    gameObj.map(game=>{
      var homeLineup = game.homeTeam.lineup;
      var awayLineup = game.awayTeam.lineup;
      function addLogsToObj(lineup){
        lineup.map(player=>{
            playerId = player.info.ID;
            player.logs = logs[playerId];
          return player;
        })
        return lineup;
      }
      gameObj.homeLineup = addLogsToObj(homeLineup);
      gameObj.awayLineup = addLogsToObj(awayLineup);
      console.log(gameObj)
      return gameObj;
    })
    res.send(gameObj)
    fs.writeFile('./localServerFiles/allCumBatterLogs.json', JSON.stringify(gameObj), function (err) {
      console.log('File written as allCumBatterLogs.json');
    })
  })

})

app.get('/battergamelog', function (req, res) {
  if (req.query.date) {
    var year = '2017';
    var date = req.query.date;
    var dateDay = date[6] + date[7];
    var tenBeforeDay = Number(dateDay) - 10;
    var tenBefore = date[0] + date[1] + date[2] + date[3] + date[4] + date[5] + tenBeforeDay.toString();
    var dates = 'from-' + tenBefore + '-to-' + req.query.date;
  } else {
    var year = '2018';
    var dates = 'from-10-days-ago-to-today';
  }
  if (req.query.playerid) {
    var player = req.query.playerid;
  }
  let url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/' + year + '-regular/player_gamelogs.json?player=' + player + '&date=' + dates + '&playerstats=AB,R,H,2B,3B,HR,RBI,BB,SO,AVG,SLG,OPS,PA,LOB,GroB,FlyB,LD,NP,StrM,Swi,HBP,TB,SF';
  console.log(url)
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  })
    .then(resp => resp.json())
    .then(resp => {
      var sorted = sortGameLogs(resp)
      var logsObj = {};
      for (let id of sorted.ids) {
        var playerArr = sorted[id];
        var cumStats = {
          TB: 0,
          G: 0,
          AB: 0,
          R: 0,
          H: 0,
          '2B': 0,
          '3B': 0,
          HR: 0,
          RBI: 0,
          BB: 0,
          SWI: 0,
          STRM: 0,
          GROB: 0,
          FLYB: 0,
          LD: 0,
          SO: 0,
          BA: 0,
          SLG: 0,
          OPS: 0,
          NP: 0,
          PA: 0,
          LOB: 0,
          HBP: 0,
          SF: 0,
          OBP: 0
        };
        for (let game of playerArr) {
          let s = game.stats;
          cumStats.G++;
          cumStats.TB += Number(s.TotalBases['#text']);
          cumStats.AB += Number(s.AtBats['#text']);
          cumStats.R += Number(s.Runs['#text']);
          cumStats.H += Number(s.Hits['#text']);
          cumStats['2B'] += Number(s.SecondBaseHits['#text']);
          cumStats['3B'] += Number(s.ThirdBaseHits['#text']);
          cumStats.HR += Number(s.Homeruns['#text']);
          cumStats.RBI += Number(s.RunsBattedIn['#text']);
          cumStats.BB += Number(s.BatterWalks['#text']);
          cumStats.SWI += Number(s.BatterSwings['#text']);
          cumStats.STRM += Number(s.BatterStrikesMiss['#text']);
          cumStats.GROB += Number(s.BatterGroundBalls['#text']);
          cumStats.FLYB += Number(s.BatterFlyBalls['#text']);
          cumStats.LD += Number(s.BatterLineDrives['#text']);
          cumStats.SO += Number(s.BatterStrikeouts['#text']);
          cumStats.BA += Number(s.BattingAvg['#text']);
          cumStats.SLG += Number(s.BatterSluggingPct['#text']);
          cumStats.OPS += Number(s.BatterOnBasePlusSluggingPct['#text']);
          cumStats.NP += Number(s.PitchesFaced['#text']);
          cumStats.PA += Number(s.PlateAppearances['#text']);
          cumStats.LOB += Number(s.LeftOnBase['#text']);
          cumStats.HBP += Number(s.HitByPitch['#text']);
          cumStats.SF += Number(s.BatterSacrificeFlies['#text']);
        }
        cumStats.BA = Number((cumStats.H / cumStats.AB).toFixed(3));
        cumStats.OBP = Number(((cumStats.H + cumStats.BB + cumStats.HBP) / (cumStats.AB + cumStats.BB + cumStats.HBP + cumStats.SF)).toFixed(3)); 
        cumStats.SLG = Number((cumStats.TB / cumStats.AB).toFixed(3));
        cumStats.OPS = Number((cumStats.OBP / cumStats.SLG).toFixed(3));
        var gameObjects = [];
        for (let game of playerArr) {
          let s = game.stats;
          let gameObj = {
            stats: {
              AB: s.AtBats['#text'],
              R: s.Runs['#text'],
              H: s.Hits['#text'],
              '2B': s.SecondBaseHits['#text'],
              '3B': s.ThirdBaseHits['#text'],
              HR: s.Homeruns['#text'],
              RBI: s.RunsBattedIn['#text'],
              BB: s.BatterWalks['#text'],
              SO: s.BatterStrikeouts['#text'],
              BA: s.BattingAvg['#text'],
              SLG: s.BatterSluggingPct['#text'],
              OPS: s.BatterOnBasePlusSluggingPct['#text'],
              NP: s.PitchesFaced['#text'],
              PA: s.PlateAppearances['#text'],
              LOB: s.LeftOnBase['#text']
            }
          }
          gameObj.date = game.game.date;
          gameObj.id = game.game.id;
          gameObjects.push(gameObj);
      }
        var playerObj = {
          cumTenGame: cumStats,
          gameLogs: gameObjects
        }
        if (!(id in logsObj)) {
          logsObj[id] = playerObj
        }
    }
    res.send(logsObj)
  })
})

function sortGameLogs(logsObj){
  var logs = logsObj.playergamelogs.gamelogs;
  var logsObj = {
    ids: []
  };
  for (let game of logs) {
    let playerId = game.player.ID;
    if (!(playerId in logsObj)) {
      logsObj[playerId] = [];
      logsObj.ids.push(playerId)
    }
    logsObj[playerId].push(game);
  }
  return logsObj
}
app.get('/pitchergamelogs', function (req, res) {
  // if (req.query.date) {
  //   var year = '2017';
  //   var date = req.query.date;
  //   var dateDay = date[6] + date[7];
  //   var tenBeforeDay = Number(dateDay) - 10;
  //   var tenBefore = date[0] + date[1] + date[2] + date[3] + date[4] + date[5] + tenBeforeDay.toString();
  //   var dates = 'from-' + tenBefore + '-to-' + req.query.date;
  //   console.log(dates);
  // } else {
  //   var year = '2018';
  //   var dates = 'from-10-days-ago-to-today';
  // }
  var year = '2017';
  var player = req.query.playerid;
  let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/${year}-regular/player_gamelogs.json?player=${player}` ;
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  })
    .then(resp => resp.json())
    .then(resp => {
      var sorted = sortGameLogs(resp)
      var logsObj = {

      }
      for (let id of sorted.ids) {
        var gameLogs = [];
        sorted[id].sort((a,b)=>{
          var date1 = a.game.date.replace(/-/g, "")
          var date2 = b.game.date.replace(/-/g, "")
          if (Number(date1) > Number(date2)) return -1;
          if (Number(date1) < Number(date2)) return 1;
        })
        if (!(id in logsObj)) {
          logsObj[id] = []
        }
        var cumLogsObj = {
          ERA: 0,
          GROB: 0,
          W: 0,
          L: 0,
          SV: 0,
          SVO: 0,
          IP: 0,
          H: 0,
          '2B': 0,
          '3B': 0,
          ER: 0,
          HR: 0,
          BB: 0,
          SWI: 0,
          STR: 0,
          STRM: 0,
          BROB: 0,
          FLYB: 0,
          LD: 0,
          SO: 0,
          NP: 0,
          OBP: 0,
          SLG: 0,
          OPS: 0,
          TBF: 0,
          GOFO: 0,
          WHIP: 0,
          HOLD: 0,
          AVG: 0,
          KBB: 0,
          STRL: 0,
          STRSW: 0,
          STR: 0,
          SWG: 0,
          GS: 0,
          PAB: 0
        };
        for (let game of sorted[id]) {
          if (gameLogs.length < 10) {
            var s = game.stats;
            cumLogsObj.W += Number(s.Wins['#text']);
            cumLogsObj.L += Number(s.Losses['#text']);
            cumLogsObj.SV += Number(s.Saves['#text']);
            cumLogsObj.ERA += Number(s.EarnedRunAvg['#text']);
            cumLogsObj.SVO += Number(s.SaveOpportunities['#text']);
            var IP = Number(s.InningsPitched['#text']);
            if (Number.isInteger(IP)) {
              cumLogsObj.IP += Number(s.InningsPitched['#text']);
            } else {
              let decimal = IP - Math.floor(IP);
              decimal = (decimal * (1 / 3));
              IP = IP + decimal;
              cumLogsObj.IP += IP;
            }
            cumLogsObj.H += Number(s.HitsAllowed['#text']);
            cumLogsObj['2B'] += Number(s.SecondBaseHitsAllowed['#text']);
            cumLogsObj['3B'] += Number(s.ThirdBaseHitsAllowed['#text']);
            cumLogsObj.ER += Number(s.EarnedRunsAllowed['#text']);
            cumLogsObj.HR += Number(s.HomerunsAllowed['#text']);
            cumLogsObj.BB += Number(s.PitcherWalks['#text']);
            cumLogsObj.SWI += Number(s.PitcherSwings['#text']);
            cumLogsObj.STR += Number(s.PitcherStrikes['#text']);
            cumLogsObj.STRM += Number(s.PitcherStrikesMiss['#text']);
            cumLogsObj.GROB += Number(s.PitcherGroundBalls['#text']);
            cumLogsObj.FLYB += Number(s.PitcherFlyBalls['#text']);
            cumLogsObj.LD += Number(s.PitcherLineDrives['#text']);
            cumLogsObj.SO += Number(s.PitcherStrikeouts['#text']);
            cumLogsObj.NP += Number(s.PitchesThrown['#text']);
            cumLogsObj.OBP += Number(s.PitcherOnBasePct['#text']);
            cumLogsObj.SLG += Number(s.PitcherSluggingPct['#text']);
            cumLogsObj.OPS += Number(s.PitcherOnBasePlusSluggingPct['#text']);
            cumLogsObj.TBF += Number(s.TotalBattersFaced['#text']);
            cumLogsObj.GOFO += Number(s.PitcherGroundOutToFlyOutRatio['#text']);
            cumLogsObj.WHIP += Number(s.WalksAndHitsPerInningPitched['#text']);
            cumLogsObj.HOLD += Number(s.Holds['#text']);
            cumLogsObj.AVG += Number(s.PitchingAvg['#text']);
            cumLogsObj.KBB += Number(s.StrikeoutsToWalksRatio['#text']);
            cumLogsObj.STRL += Number(s.PitcherStrikesLooking['#text']);
            cumLogsObj.SWG += Number(s.PitcherSwings['#text']);
            cumLogsObj.GS += Number(s.GamesStarted['#text']);
            cumLogsObj.PAB += Number(s.PitcherAtBats['#text']);
            var logObj = {
              stats: {
                W: s.Wins['#text'],
                L: s.Losses['#text'],
                SV: s.Saves['#text'],
                ERA: s.EarnedRunAvg['#text'],
                SVO: s.SaveOpportunities['#text'],
                IP: s.InningsPitched['#text'],
                H: s.HitsAllowed['#text'],
                '2B': s.SecondBaseHitsAllowed['#text'],
                '3B': s.ThirdBaseHitsAllowed['#text'],
                ER: s.EarnedRunsAllowed['#text'],
                HR: s.HomerunsAllowed['#text'],
                BB: s.PitcherWalks['#text'],
                SWI: s.PitcherSwings['#text'],
                STR: s.PitcherStrikes['#text'],
                STRM: s.PitcherStrikesMiss['#text'],
                GROB: s.PitcherGroundBalls['#text'],
                FLYB: s.PitcherFlyBalls['#text'],
                LD: s.PitcherLineDrives['#text'],
                SO: s.PitcherStrikeouts['#text'],
                NP: s.PitchesThrown['#text'],
                OBP: s.PitcherOnBasePct['#text'],
                SLG: s.PitcherSluggingPct['#text'],
                OPS: s.PitcherOnBasePlusSluggingPct['#text'],
                TBF: s.TotalBattersFaced['#text'],
                GOFO: s.PitcherGroundOutToFlyOutRatio['#text'],
                WHIP: s.WalksAndHitsPerInningPitched['#text'],
                HOLD: s.Holds['#text'],
                AVG: s.PitchingAvg['#text'],
                KBB: s.StrikeoutsToWalksRatio['#text'],
                STRL: s.PitcherStrikesLooking['#text'],
                SWG: s.PitcherSwings['#text'],
                GS: s.GamesStarted['#text']
              },
              gameId: game.game.id,
              date: game.game.date,
              homeTeam: game.game.homeTeam.Abbreviation,
              awayTeam: game.game.awayTeam.Abbreviation
            }
            if (game.game.homeTeam.Abbreviation === game.team.Abbreviation) {
              logObj.teamFaced = game.game.awayTeam.Abbreviation;
            } else {
              logObj.teamFaced = game.game.homeTeam.Abbreviation;
            }
            gameLogs.push(logObj)
          }
        }
        cumLogsObj.SLG = Number((((cumLogsObj.HR * 4) + (cumLogsObj['3B'] * 3) + (cumLogsObj['2B'] * 2) + (cumLogsObj.H - (cumLogsObj.HR - cumLogsObj['3B'] - cumLogsObj['2B']))) / cumLogsObj.PAB)).toFixed(3);
        cumLogsObj.OBP = Number(((cumLogsObj.H + cumLogsObj.BB + cumLogsObj.HBP) / (cumLogsObj.PAB + cumLogsObj.BB + cumLogsObj.HBP + cumLogsObj.SF))).toFixed(3)
        cumLogsObj.ERA = Number(((cumLogsObj.ER / cumLogsObj.IP) * 9).toFixed(3))
        cumLogsObj.OPS = Number((cumLogsObj.OPS / gameLogs.length).toFixed(3))
        cumLogsObj.WHIP = Number((cumLogsObj.WHIP / gameLogs.length).toFixed(3))
        cumLogsObj.GOFO = Number((cumLogsObj.GOFO / gameLogs.length).toFixed(3))
        cumLogsObj.AVG = Number((cumLogsObj.AVG / gameLogs.length).toFixed(3))
        cumLogsObj.KBB = Number((cumLogsObj.KBB / gameLogs.length).toFixed(3))
        // if (!cumLogsObj.IP.isInteger) {
        //   decimal 
        // }
        var playerLogsObj = {
          cumTenGame: cumLogsObj,
          gameLogs: gameLogs
        }
        logsObj[id].push(playerLogsObj);
      }
      res.send(logsObj)
    })
})
app.get('/addpitcherlogs', function(req, res) {
  var gameObject = require('./localServerFiles/allCumBatterLogs.json');
  var commaSeparated = '';
  for (let game of gameObject){
    commaSeparated += (game.homeTeam.pitcher.ID + ',');
    commaSeparated += (game.awayTeam.pitcher.ID + ',');
  }
  fetch(`http://localhost:4000/pitchergamelogs/?playerid=${commaSeparated}`)
    .then(resp => resp.json()).then(logs => {
      console.log(logs)
      gameObject.map(game => {
        var homePitcherId = game.homeTeam.pitcher.ID;
        var awayPitcherId = game.awayTeam.pitcher.ID;
        game.homeTeam.pitcher.logs = logs[homePitcherId];
        game.awayTeam.pitcher.logs = logs[awayPitcherId];
        return gameObject;
      })
      res.send(gameObject)
      fs.writeFile('./localServerFiles/fullLogCumObject.json', JSON.stringify(gameObject), function (err) {
        console.log('File written as fullLogCumObject.json');
      })
    })
})

app.get('/getmatchups', function(req, res) {
  gameObject = require('./localServerFiles/fullLogCumObject.json');
  var urlList = [];
  var idList = [];
  for (let game of gameObject) {
    var homePitcherId = game.homeTeam.pitcher.ID;
    var homePitcherBref = game.homeTeam.pitcher.IDs.bref_id;
    var awayPitcherId = game.awayTeam.pitcher.ID;
    var awayPitcherBref = game.awayTeam.pitcher.IDs.bref_id;
    var homeLineup = game.homeTeam.lineup;
    var awayLineup = game.awayTeam.lineup;
    var homeUrls = getMatchupUrls(homeLineup, awayPitcherBref);
    var awayUrls = getMatchupUrls(awayLineup, homePitcherBref);
    for (let url of homeUrls) urlList.push(url);
    for (let url of awayUrls) urlList.push(url);
    for (let player of homeLineup) {
      if (player.info) {
        idList.push(player.info.ID);
      } else {
        idList.push('error')
      }
    } 
    for (let player of awayLineup) {
      if (player.info) {
        idList.push(player.info.ID);
      } else {
        idList.push('error')
      }
    }
  }
  var testList = [];
  for (let i=0;i<60;i++){
    testList.push(urlList[i]);
  }



  const currentDelay = 2000;

  function getJSON(url, index) {
    return Promise.resolve()
      .then(() => {
        console.log('pre-delay:', index * currentDelay);
        return delay(index * currentDelay);
      })
      .then(() => {
        console.log(`pre-fetch: ${index} of ${urlList.length} url:`, url);
        return fetch(url)
          .then(request => request.json())
      })
  }

  const results = urlList
    .map(getJSON)

  Promise.all(results)
    .then(data => {
      console.log(data)
      var filteredData = filterMatchupData(data);
      var matchupData = {}
      for (let i=0;i<data.length;i++){
        matchupData[idList[i]] = filteredData[i]
      }
      fs.writeFile('./localServerFiles/maybe.json', JSON.stringify(matchupData), function (err) {
        console.log('File written as maybe.json');
      })

      console.log('done!')
      res.send(gameObject)
    })




})
  function filterMatchupData(data) {
    var filteredData = [];
    for (let player of data) {
      if (player[0]) {
        for (let year of player[0]) {
          if (year.Year == 'RegSeason') {
            var cumYear = year;
          } else if (year.Year == '2017') {
            var cumYear = year;
          } else {
            var cumYear = ['no data']
          }
        }
      }
      filteredData.push(cumYear)
    }
    return filteredData;

  };



function getMatchupUrls(lineup, oppPitcherBref){
  if (oppPitcherBref !== undefined) {
  var id_list = require('./player_ids.json');
  var brefList = [];
  var idList = [];
  for (let player of lineup) {
    if (player.info) {
      var brefId = player.info.IDs.bref_id;
      var ID = player.info.ID;
    } 
    if (!brefId) {
      var id = id_list.filter(set=>{
        if ((player.info.FirstName + ' ' + player.info.LastName) == set.mlb_name) {
          return set;
        } else if ((player.info.FirstName + ' ' + player.info.LastName) == set.bref_name) {
          return set
        } else if ((player.info.FirstName + ' ' + player.info.LastName) == set.fg_name) {
          return set
        } 
      })
      if (id.length === 0) {
          let last = player.info.LastName.split('');
          let first = player.info.FirstName.split('');
          last.splice(5)
          first.splice(2)
          last.push(first[0])
          last.push(first[1])
          let a = last.join('')
          a = a + '01';
          brefId = a.toLowerCase()
      } else brefId = id[0].bref_id;
    }
    brefList.push(brefId)
  }
  return brefList.map(id=> `http://localhost:4000/scrape/?pitcher=${oppPitcherBref}&batter=${id}`);
}
}


app.get('/team', function (req, res) {
  team = req.query.team;
  res.send(rosters[team])
})

app.get('/gameobject', function (req, res) {
  gameObject = require('./localServerFiles/fullLogCumObject.json');
  res.send(gameObject)
})

app.get('/addmatchup', function (req, res){
  gameObject = require('./localServerFiles/fullLogCumObject.json');
  matchupObj = require('./localServerFiles/maybe.json')
  var newGame = gameObject.map(game=>{
    var homeLineup = game.homeTeam.lineup;
    var awayLineup = game.awayTeam.lineup;
    for (let player of homeLineup) {
      var playerId = player.info.ID;
      player.matchup = matchupObj[playerId];
    }
    for (let player of awayLineup) {
      var playerId = player.info.ID;
      player.matchup = matchupObj[playerId];
    }
    return game;
  })
  res.send(newGame)
  fs.writeFile('./localServerFiles/gameObjFull.json', JSON.stringify(newGame), function (err) {
    console.log('File written as maybe.json');
  })
})

app.get('/fullcycle', function (req, res) {
  var date = getDate();
  var year = '2018';
  if (req.query.date) {
    var date = req.query.date;
    var year = '2017';
  }
  fetch(`http://localhost:4000/rosterplayers/?date=${date}`)
  .then(
    fetch(`http://localhost:4000/games/?date=${date}`)
    .then(
      fetch(`http://localhost:4000/getallgames/?date=${date}`)
      .then(
        fetch(`http://localhost:4000/formatgameobject`)
        .then(
          fetch(`http://localhost:4000/fetchpitchercumdata`)
          .then(
            fetch(`http://localhost:4000/addbatterstats`)
            .then(
              fetch(`http://localhost:4000/getallbatterlogs`)
              .then(
                fetch(`http://localhost:4000/addpitcherlogs`)
              )
            )
          )
        )
      )
    )
  )
})

app.get('/getbullpen', function(req, res){

})



app.get('/seasonstats', function (req, res) {
  let player = req.query.player;
  player = player.replace(' ', '-');
  let url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/2017-regular/player_gamelogs.json?player=' + player + '&playerstats=H,AB,RBI';
  let headers = { Authorization: 'Basic a3Vicmlja2FuOkgzbHRvbjE3MTcu'}
  request.get({
    url: url,
    headers: headers,
    method: 'GET'
  },
  function(e, r, body){
    res.send(body)
  }
)

})
// var scraper = require('table-scraper');
// app.get('/scrape', function (req, res){
//   var urlPitcher = req.query.pitcher;
//   var urlBatter = req.query.batter;
//   console.log(urlBatter, urlPitcher)
//   var url = 'https://www.baseball-reference.com/play-index/batter_vs_pitcher.cgi?batter=' + urlBatter + '&pitcher=' + urlPitcher;
//   console.log(url)
//   scraper
//     .get(url)
//     .then(function (tableData) {
//       console.log(tableData)
//       res.send(tableData)
//     });
// })

app.get('/scrape', function (req, res) {
  var urlPitcher = req.query.pitcher;
  var urlBatter = req.query.batter;
  var url = 'https://www.baseball-reference.com/play-index/batter_vs_pitcher.cgi?batter=' + urlBatter + '&pitcher=' + urlPitcher;
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: true },
    function (tablesAsJson) {
      res.send(tablesAsJson)
    }
  );
})

app.get('/scrapepitcher', function (req, res) {
  var urlPitcher = req.query.pitcher;
  if (req.query.year) {
    var year = req.query.year;
  } else var year = '2017';
  var url = 'https://www.baseball-reference.com/players' + '/' + urlPitcher[0] + '/' + urlPitcher + '.shtml';
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: true },
    function (tablesAsJson) {
      res.send(tablesAsJson[0].filter(item=>{
        if (item.Year === year && (item.Lg === 'NL' || item.Lg === 'AL')) return year;
      }))
    }
  );
})

app.get('/scrapepitcher2', function (req, res) {
  var urlPitcher = req.query.pitcher;
  var url = 'https://www.baseball-reference.com/players' + '/' + urlPitcher[0] + '/' + urlPitcher + '.shtml';
  var scraperjs = require('scraperjs');
  scraperjs.DynamicScraper.create(url)
    .scrape(function ($) {
      return $('table').map(function () {
        return $(this).html();
      }).get();
    })
    .then(function (tables) {
      console.log(tables);
    })
})


app.get('/scrapepitcher1', function (req, res) {
  var urlPitcher = req.query.pitcher;
  var url = 'https://www.fangraphs.com/statss.aspx?playerid=' + urlPitcher;
  tabletojson.convertUrl(url)
    .then(function (tablesAsJson) {
      res.send(tablesAsJson)
    });
})

app.get('/scrapebatter', function (req, res) {
  var urlBatter = req.query.batter;
  var url = 'https://www.baseball-reference.com/players' + '/' + urlBatter[0] + '/' + urlBatter + '.shtml';
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: true },
    function (tablesAsJson) {
      console.log(tablesAsJson)
      res.send(tablesAsJson)
    }
  );
})

app.get('/scrapebatter1', function (req, res) {
  var fg_id = req.query.batter;
  var url = 'https://www.fangraphs.com/statsd.aspx?playerid=' + fg_id;
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: false },
    function (tablesAsJson) {
      console.log(tablesAsJson)
      res.send(tablesAsJson)
    }
  );
})




app.get('/catfiles', function (req, res) {
  let a = players.activeplayers.playerentry.map(player=>{
    let name = player.player.FirstName + ' ' + player.player.LastName;
    let normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    let newPlayer = player;
    let id = id_list.filter(item=>{
      if (normalized == item.espn_name) return item;
    })
    if (id[0]) {
      newPlayer.player.bref_id = id[0].bref_id;
      console.log(newPlayer)
      return newPlayer;
    } else return player;
    // newPlayer.player.fg_id = id[0].fg_id;
    // console.log(newPlayer)
    // return newPlayer;
  })
  res.send(a)
  console.log(a)
})





app.use(notFound)
app.use(errorHandler)

server.listen(port)
  .on('error', console.error.bind(console))
  .on('listening', console.log.bind(console, 'Listening on ' + port));

function notFound(req, res, next) {
  const url = req.originalUrl
  if (!/favicon\.ico$/.test(url) && !/robots\.txt$/.test(url)) {
    // Don't log less important auto requests
    console.error('[404: Requested file not found] ', url)
  }
  res.status(404).send({ error: 'Url not found', status: 404, url })
}

function errorHandler(err, req, res, next) {
  console.error('ERROR', err)
  const stack = devMode ? err.stack : undefined
  res.status(500).send({ error: err.message, stack, url: req.originalUrl })
}