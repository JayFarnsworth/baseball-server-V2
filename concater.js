var file = require('file-system');
var fs = require('fs');
var players;
// var fs = require('fs'),
//   path = require('path'),
//   filePath = path.join(__dirname, 'start.html');

fs.readFile('results/active_players.json', { encoding: 'utf-8' }, function (err, data) {
  if (!err) {
    // console.log( data);
    players = data;
    fs.readFile('results/player_ids.json', { encoding: 'utf-8' }, function (err, data) {
      if (!err) {
        console.log(players)
        players.playerentry.map(player=>{
          let name = player.player.FirstName + ' ' + player.player.LastName;
          let normalized = name.normalize('NFD');
          return player.url_id = data.filter(id_set => {
            if (name == item.espn_name) return item.lahman_id
          })
        })
      } else {
        console.log(err);
      }
    })
    // response.write(data);
    console.log(players)
  } else {
    console.log(err);
  }
});
