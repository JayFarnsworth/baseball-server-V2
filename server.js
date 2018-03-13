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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(morgan(devMode ? 'dev' : 'combined'))
app.use(cors({ origin: true }))

// authentication
var username = 'kubrickan';
var password = 'H3lton1717.';
var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
var header = { 'Host': 'www.example.com', 'Authorization': auth };

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
  var url = 'https://www.baseball-reference.com/players' + '/' + urlPitcher[0] + '/' + urlPitcher + '.shtml';
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: true },
    function (tablesAsJson) {
      res.send(tablesAsJson)
    }
  );
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
  var urlBatter = req.query.batter;
  var url = 'https://www.fangraphs.com/statss.aspx?playerid=7287&position=OF';
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: true },
    function (tablesAsJson) {
      console.log(tablesAsJson)
      res.send(tablesAsJson)
    }
  );
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