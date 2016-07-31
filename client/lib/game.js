function Game(width, height, players, planets) {
    this.width = width;
    this.height = height;
    this.players = [];
    for (var i = 0; i < players.length; i++) {
        players[i].id = i;
        this.players.push(players[i]);
    }
    this.planets = planets;
    this.isFinished = false;
    this.initCanvas();
    return this;
}

Game.prototype.DRAW_FPS = 60;
Game.prototype.LIVE_FPS = 60;
Game.prototype.NETWORK_FPS = 60;

Game.prototype.OBJECT_TYPE_PLAYER = 1;
Game.prototype.OBJECT_TYPE_BULLET = 2;

Game.prototype.startSinglePlayer = function() {
    this.localPlayer = this.players[0];
    this.localPlayer.initKeyboard();
    drawInterval = setInterval(this.draw.bind(this), 1000 / this.DRAW_FPS);
    liveInterval = setInterval(this.live.bind(this), 1000 / this.LIVE_FPS);
}

Game.prototype.initCanvas = function() {
    var onResizeCanvas = function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        var scaleX = this.canvas.width / this.width;
        var scaleY = this.canvas.height / this.height;

        this.scale = scaleX > scaleY ? scaleY : scaleX;

        this.offsetX = (this.canvas.width - this.width * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.height * this.scale) / 2;

        this.draw(this.ctx);
    }

    this.canvas = document.createElement('canvas');
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    window.addEventListener('resize', onResizeCanvas.bind(this), false);
    onResizeCanvas.bind(this)();
}

Game.prototype.draw = function() {
    if (this.isFinished) {
        return;
    }

    this.ctx.globalCompositeOperation = 'source-over';

    this.ctx.save();

    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (var i = 0; i < this.players.length; i++) {
        this.players[i].drawHud(this.ctx);
    }

    for (var i = 0; i < this.planets.length; i++) {
        this.planets[i].draw(this.ctx);
    }

    for (var i = 0; i < this.players.length; i++) {
        this.players[i].draw(this.ctx);
    }

    this.ctx.restore();

    this.ctx.save();

    this.ctx.fillStyle = 'rgba(50, 50, 50, 1)';

    if (this.offsetY) {
        this.ctx.fillRect(0, 0, this.canvas.width, this.offsetY);
        this.ctx.fillRect(0, this.canvas.height - this.offsetY, this.canvas.width, this.offsetY);
    }

    if (this.offsetX) {
        this.ctx.fillRect(0, 0, this.offsetX, this.canvas.height);
        this.ctx.fillRect(this.canvas.width - this.offsetX, 0, this.offsetX, this.canvas.height);
    }

    this.ctx.restore();
}

Game.prototype.live = function() {
    var me = this;

    if (!this.isFinished) {
        var livePlayersCount = 0;
        for (var i = 0; i < this.players.length; i++) {
            this.players[i].live(this);
            if (!this.players[i].isDead) {
                livePlayersCount ++;
            }
        }

        if (livePlayersCount <= 1) {
            this.draw();
            this.isFinished = true;
            this.showMessage(this.localPlayer.isDead ? 'Sorry, you lose...' : 'Congratulation! You win!', function () {
                me.hideMessage();
                location.reload(); 
            });
        }
    } 
}

Game.prototype.applyPlanetsGravity = function(object, mass) {
    for (var i = 0; i < this.planets.length; i++) {
        this.planets[i].applyGravity(object, mass);
    }
}

Game.prototype.doPlanetsCollision = function(object, mass) {
    for (var i = 0; i < this.planets.length; i++) {
        this.planets[i].doCollision(object, mass);
    }
}

Game.prototype.checkPlayersHits = function(bullet) {
    for (var i = 0; i < this.players.length; i++) {
        this.players[i].checkHit(bullet);
    }
}

Game.prototype.checkPlayersCollision = function(player) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i] !== player) {
            this.players[i].checkPlayerCollision(player);
        }
    }
}

Game.prototype.wrapCoords = function(object) {
    if (object.x > this.width) {
        object.x -= this.width;
    } else if (object.x < 0) {
        object.x += this.width;
    }

    if (object.y > this.height) {
        object.y -= this.height;
    } else if (object.y < 0) {
        object.y += this.height;
    }
}

Game.prototype.startMultiPlayer = function(url, playerName) {
    this.playerName = playerName;
    this.network = new Network(this, url, this.onNetworkConnected.bind(this), this.onNetworkMessage.bind(this));
    this.network.open(url);
}

Game.prototype.onNetworkConnected = function(message) {
    this.localPlayer = this.players[message.idx];
    this.localPlayer.name = this.playerName;
    this.localPlayer.initKeyboard();
    drawInterval = setInterval(this.draw.bind(this), 1000 / this.DRAW_FPS);
    liveInterval = setInterval(this.live.bind(this), 1000 / this.LIVE_FPS);
    networkInterval = setInterval(this.processNetwork.bind(this), 1000 / this.NETWORK_FPS);
}

Game.prototype.onNetworkMessage = function(message) {
    if (message.type === 'world') {
        for (var i = 0; i < message.data.length; i++) {
            var data = message.data[i];
            this.players[data.id].setNetworkPacket(data);
        }
    }
}

Game.prototype.processNetwork = function() {
    var data = [];

    if (this.localPlayer.isDirty) {
        data.push(this.localPlayer.getNetworkPacket());
        this.localPlayer.isDirty = false;
    }

    if (data.length) {
        this.network.send({
            type: 'world',
            data: data
        });
    }
}

Game.prototype.showMessage = function(message, callback) {
    var messageWindow = document.getElementById('messageWindow'),
        mask = document.getElementById('mask');

    if (callback) {
        messageWindow.innerHTML = '<p>' + message + '<input class="button" type="submit" value="Ok" /></p>';
        var button = messageWindow.getElementsByTagName('input')[0];
        button.addEventListener('click', function () {
            callback();
        });
    } else {
        messageWindow.innerHTML = '<p>' + message + '</p>';     
    }

    mask.style.visibility = 'visible';
    messageWindow.style.visibility = 'visible';
}

Game.prototype.hideMessage = function() {
    var messageWindow = document.getElementById('messageWindow'),
        mask = document.getElementById('mask');

    mask.style.visibility = 'hidden';
    messageWindow.style.visibility = 'hidden';
}

Game.prototype.onClose = function() {
    var me = this;
    this.draw();
    this.isFinished = true;
    this.showMessage('Other player left the game. ', function () {
        me.hideMessage();
        location.reload(); 
    });
}