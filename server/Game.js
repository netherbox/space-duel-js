var Guid = require('guid'); 

function Game(maxPlayers) {
    this.id = Guid.raw();
    this.maxPlayers = maxPlayers || 2;
    this.players = [];
    this.state = this.CONNECTING;

    console.log('Game ' + this.id + ': created.');
}

module.exports = Game;

Game.prototype.CONNECTING = 0;
Game.prototype.OPEN = 1;
Game.prototype.CLOSING = 2;
Game.prototype.CLOSED = 3;

Game.prototype.addPlayer = function(connection) {
    var game = this,
        player = {
            idx: this.players.length,
            connection: connection
        };

    console.log('Game ' + this.id + ': player #' + player.idx + ' connected from ' + connection.socket.remoteAddress);

    connection.on('text', function(text) {
        game.onText(player, text);
    });

    connection.on('close', function(code, reason) {
        game.onClose(player, code, reason);
    }); 

    var length = this.players.push(player);

    if (length == this.maxPlayers) {
        this.state = this.OPEN;
        this.onOpen();
    }

    return player;
}

Game.prototype.onText = function(sender, text) {
    this.players.forEach(function(player, i) {
        if (player !== sender) {
            if (player.connection) {
                player.connection.sendText(text);
            }
        }
    });
}

Game.prototype.onOpen = function() {
    console.log('Game ' + this.id + ': started.');
    this.players.forEach(function(player, i) {
        if (player.connection && player.connection.readyState === player.connection.OPEN) {
            player.connection.sendText(JSON.stringify({
                type: 'connected',
                idx: i
            }));
        }
    });
}

Game.prototype.onClose = function(player, code, reason) {
    console.log('Game ' + this.id + ': player #' + player.idx + ' disconnected.');
    if (this.state !== this.CLOSING) {
        this.close();
    }
}

Game.prototype.close = function() {
    this.state = this.CLOSING;
    this.players.forEach(function(player, i) {
        if (player.connection && player.connection.readyState === player.connection.OPEN) {
            player.connection.close();
        }
    });
    this.state = this.CLOSED;
    console.log('Game ' + this.id + ': closed.');
}