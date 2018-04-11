// var fetches = require('./fetches.js');
const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');

function addBatterStats() {
  cache.get('playerObject')
  .then(playerObject=>{
    cache.get('batterStatUrls')
      .then(urls => {
        urls.map(url => {
          cache.get(url)
            .then(resp => {
              var players = resp.cumulativeplayerstats.playerstatsentry;
              if (url.includes('2017-regular')) {
                var year = '2017'
              } else {
                var year = '2018'
              }
              var team = players[0].team.Abbreviation;
              let teamObj = {}
              teamObj.team = team
              teamObj.year = year
              for (let player of players) {
                let id = player.player.ID;
                var s = player.stats;
                teamObj[id] = {
                  team: team,
                  year: year,
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
              let objectName = 'cumBatterStats' + team + year;
              cache.set(objectName, teamObj)
            }).catch(err => { console.error(err) })
        })
      })
  })
}

function makeMongoBatters(){
  cache.get('playerObject')
  .then(playerObject=>{
    teams.map(team=>{
      console.log(team)
      let ids = Object.keys(playerObject[team].batters);
      ids.map(id=>{
        mongo.createBatter(playerObject[team].batters[id])
      })
    })
  })
}
makeMongoBatters()


function concat() {
  cache.get('playerObject')
  .then(playerObject=>{
    var cumCache = []
    for (let team of teams){
      for (let year of years){
        let url = 'cumBatterStats' + team + year;
        cumCache.push(url)
      }
    }
    return cumCache.map(url=>{

      return cache.get(url)
      .then(stats=>{
        var team = stats.team;
        var year = stats.year;
        var ids = Object.keys(stats);
        ids.map(id=>{
          playerObject[team].batters[id] = {
             [year]: stats
          }
        })
      }).catch(err=>{console.log(err)})
      .then(playerObj=>{
        console.log(playerObj, 'test')
      })
    })
  })
}
function getPlayerObject(){
  cache.get('testObj')
  .then(obj=>{
                  fs.writeFile('./testObj.json', JSON.stringify(obj), function (err) {
                console.log('File written as testObj.json');
              })
  })
}


const request = async () => {
  const batterStats = await addBatterStats()
  const cat = await concat()
}
// request()
// getPlayerObject()