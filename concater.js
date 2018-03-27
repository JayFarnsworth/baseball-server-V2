var file = require('file-system');
var fs = require('fs');
var players;

fs.open('results/players.json', 'r', function (err, data) {
  if (!err) {
    fs.open('results/id_list.json', 'r', function (err, data1) {
      if (!err) {
        console.log(data)
        let a = data.map(player=>{
          return player;
        })
        console.log(a)
      } else {
        console.log(err);
      }
    })
  } else {
    console.log(err);
  }
});

var file = require('file-system');
var fs = require('fs');
var players;
fs.readFile('results/players.json', { encoding: 'utf-8' }, function (err, data) {
  if (!err) {
    players = data;
    console.log(players)
    fs.readFile('results/player_ids.1.json', { encoding: 'utf-8' }, function (err, data) {
      if (!err) {
        players.map(player => {
          console.log(player)
          let name = player.player.FirstName + ' ' + player.player.LastName;
          let normalized = name.normalize('NFD');
          return player.fg_id = data.filter(id_set => {
            if (normalized == item.espn_name) return item.fg_id
          })
        })
      } else {
        console.log(err);
      }
    })
    res.send(players);
  } else {
    console.log(err);
  }
});
