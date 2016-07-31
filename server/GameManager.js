var webSocket = require('nodejs-websocket'), 
    Game = require('./Game');

function GameManager() {
    this.games = [];
}

module.exports = GameManager;

GameManager.prototype.start = function(port) {
    this.server = webSocket.createServer(this.onConnect.bind(this)).listen(port);
    console.log('Server started at port: ' + port);
}

GameManager.prototype.getGame = function() {
    this.games = this.games.filter(function (game) {
        return game.state !== game.CLOSED;
    });

    var game = this.games.find(function (game) {
        return game.state === game.CONNECTING;
    });

    if (!game) {
        game = new Game();
        this.games.push(game);
    }

    return game;
}

GameManager.prototype.onConnect = function(connection) {
    var game = this.getGame(),
        player = game.addPlayer(connection);
}