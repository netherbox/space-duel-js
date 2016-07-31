function Player(x, y, angle, move, action, color, hudX, hudY, hudTextAlign) {
    this.type = Game.prototype.OBJECT_TYPE_PLAYER;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.move = move;
    this.thrust = false;
    this.fireLock = false;
    this.action = action;
    this.color = color;
    this.hudX = hudX;
    this.hudY = hudY;
    this.hudTextAlign = hudTextAlign;
    this.energy = 100;
    this.bullets = [];
    this.isDead = false;
    this.name = '';
    this.controlChanged = true;
    this.isDirty = true;
    return this;
}

Player.prototype.RADIUS = 5;
Player.prototype.MASS = 20;
Player.prototype.ROTATE_ANGLE = deg2rad(2);
Player.prototype.TRUST = 0.05;
Player.prototype.BULLET_SPEED = 1.5;
Player.prototype.PLAYER_COLLISION_MUL = 1.5;

Player.prototype.ACTION_STILL = 0;
Player.prototype.ACTION_ROTATE_RIGHT = 1;
Player.prototype.ACTION_ROTATE_LEFT = 2;

Player.prototype.initKeyboard = function() {
    var me = this;

    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'ArrowLeft':
                me.action = me.ACTION_ROTATE_LEFT;
                break;

            case 'ArrowRight':
                me.action = me.ACTION_ROTATE_RIGHT;
                break;

            case 'ArrowUp':
                me.thrust = true;
                break;

            case ' ':
                if (!me.fireLock) {
                    me.fireBullet();
                    me.fireLock = true;
                }
                break;
        }
    });

    document.addEventListener('keyup', function(event) {
        switch (event.key) {
            case 'ArrowLeft':
                if (me.action == me.ACTION_ROTATE_LEFT) {
                    me.action = me.ACTION_STILL;
                }
                break;

            case 'ArrowRight':
                if (me.action == me.ACTION_ROTATE_RIGHT) {
                    me.action = me.ACTION_STILL;
                }
                break;

            case 'ArrowUp':
                me.thrust = false;
                break;

            case ' ':
                me.fireLock = false;
                break;
        }
    });
}

Player.prototype.draw = function(ctx) {
    if (!this.isDead) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-10, -7);
        ctx.lineTo(-10, 7);
        ctx.lineTo(10, 0);
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.fill();

        if (this.thrust) {
            ctx.translate(-10, 0);
            ctx.strokeStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-7, -3);
            ctx.lineTo(-7, 3);
            ctx.lineTo(0, 0);
            ctx.stroke();
            //ctx.fillStyle = 'orange';
            //ctx.fill();
        }

        ctx.restore();
    }

    for (var i = 0; i < this.bullets.length; i++) {
        this.bullets[i].draw(ctx);
    }
}

Player.prototype.drawHud = function(ctx) {
    var energyBarHeight = 56 / 100 * this.energy;

    ctx.save();
    ctx.translate(this.hudX, this.hudY);
    ctx.translate(-5, -30);
    ctx.strokeStyle = this.color;
    ctx.strokeRect(0, 0, 10, 60);
    ctx.fillStyle = this.color;
    ctx.fillRect(2, 58 - energyBarHeight, 6, energyBarHeight);

    ctx.font = '20px "Fredoka One", cursive';
    var text = this.name,
        metrics = ctx.measureText(text);

    if (this.hudTextAlign === 'right') {
        ctx.fillText(text, 25, 55);
    } else if (this.hudTextAlign === 'left') {
        ctx.fillText(text, -metrics.width - 15, 20);
    }

    ctx.restore();
}

Player.prototype.live = function(game) {
    if (!this.isDead) {
        if ((this.prevAction !== this.action) || (this.prevThrust !== this.thrust)) {
            this.prevAction = this.action;
            this.prevThrust = this.thrust;
            this.isDirty = true;
        }

        if (this.action === this.ACTION_ROTATE_LEFT) {
            this.isDirty = true;
            this.angle -= this.ROTATE_ANGLE;
            if (this.angle < 0) {
                this.angle = 2 * Math.PI;
            }
        } else if (this.action == this.ACTION_ROTATE_RIGHT) {
            this.isDirty = true;
            this.angle += this.ROTATE_ANGLE;
            if (this.angle >= 2 * Math.PI) {
                this.angle = 0;
            }
        }

        if (this.thrust) {
            this.isDirty = true;
            var trust = new Vector(
                Math.cos(this.angle) * this.TRUST,
                Math.sin(this.angle) * this.TRUST
            );
            this.move.add(trust);
            this.addEnergy(-0.2);
        }

        game.applyPlanetsGravity(this, this.MASS);
        game.doPlanetsCollision(this, this.RADIUS);
        game.checkPlayersCollision(this);

        this.x += this.move.x;
        this.y += this.move.y;

        game.wrapCoords(this);

        this.addEnergy(0.1);
    }

    this.bullets = this.bullets.filter(function (bullet) {
        bullet.live(game);
        return !bullet.isDead;
    });
}

Player.prototype.fireBullet = function() {
    if (this.energy > 20) {
        this.isDirty = true;
        this.bullets.push(new Bullet(
            this.x + this.RADIUS * Math.cos(this.angle) * 2,
            this.y + this.RADIUS * Math.sin(this.angle) * 2,
            new Vector(
                this.move.x + Math.cos(this.angle) * this.BULLET_SPEED,
                this.move.y + Math.sin(this.angle) * this.BULLET_SPEED
            )
        ));
        this.addEnergy(-5);
    }
}

Player.prototype.addEnergy = function(value) {
    if (!this.isDead) {
        this.energy += value;
        if (this.energy > 100) {
            this.energy = 100;
        } else if (this.energy < 0) {
            this.energy = 0;
            this.isDead = true;
        }
    }
}

Player.prototype.checkHit = function(bullet) {
    if (!this.isDead) {
        var distance = new Vector(bullet.x, bullet.y, this.x, this.y).mod();
        if (distance <= bullet.RADIUS + this.RADIUS) {
            bullet.life = 0;
            this.addEnergy(-25);
        }
    }
}

Player.prototype.checkPlayerCollision = function(player) {
    var crossX = player.x + player.move.x,
        crossY = player.y + player.move.y;

    var distance = (new Vector(crossX, crossY, this.x, this.y)).mod();

    if (distance < this.RADIUS * 2) {
        var objectVector = new Vector(player.x, player.y, crossX, crossY),
            normalVector = (new Vector(this.x, this.y, crossX, crossY)).normalize();

        var resultDirection = objectVector.getReflectionVector(normalVector).normalize();
        var resultSpeed = player.move.clone().add(this.move).mod() / this.PLAYER_COLLISION_MUL;

        player.move = resultDirection.clone().scale(resultSpeed);
        this.move = resultDirection.clone().scale(-resultSpeed);

        player.addEnergy(-resultSpeed * 10);
        this.addEnergy(-resultSpeed * 10);
    }
}

Player.prototype.getNetworkPacket = function() {
    return {
        id: this.id,
        name: this.name,
        x: this.x,
        y: this.y,
        angle: this.angle,
        move: {
            x: this.move.x,
            y: this.move.y
        },
        thrust: this.thrust,
        fireLock: this.fireLock,
        energy: this.energy,
        bullets: this.bullets,
        isDead: this.isDead
    }
}

Player.prototype.setNetworkPacket = function(message) {
    this.name = message.name;
    this.x = message.x;
    this.y = message.y;
    this.angle = message.angle;
    this.move = new Vector(message.move.x, message.move.y);
    this.thrust = message.thrust;
    this.fireLock = message.fireLock;
    this.energy = message.energy;
    this.isDead = message.isDead;

    this.bullets = [];
    for (var i = 0; i < message.bullets.length; i++) {
        var bullet = message.bullets[i];
        this.bullets.push(new Bullet(bullet.x, bullet.y, new Vector(bullet.move.x, bullet.move.y), bullet.life));
    }
}