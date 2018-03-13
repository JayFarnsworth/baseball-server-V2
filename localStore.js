var MySportsFeeds = require("mysportsfeeds-node");

var msf = new MySportsFeeds("1.2", true);

msf.authenticate("kubrickan", "H3lton1717.");

var data = msf.getData('mlb', '2017-regular', 'active_players', 'json', { season: '2018-regular', sort: 'player.lastname' });