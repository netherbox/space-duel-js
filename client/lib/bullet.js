function Bullet(x, y, move, life) {
    this.type = this.OBJECT_TYPE_BULLET;
    this.x = x;
    this.y = y;
    this.move = move;
    this.life = (life !== undefined) ? life : 1;
    this.isDead = false;
    return this;
}

Bullet.prototype.RADIUS = 2;
Bullet.prototype.MASS = 50;
Bullet.prototype.MAX_LIFE = 1000;

Bullet.prototype.draw = function(ctx) {
    var color = Math.round(255 * this.life);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.arc(0, 0, this.RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(' + color + ', 0, 0, 1)';
    ctx.fill();
    ctx.restore();
}

Bullet.prototype.live = function(game) {
    this.life -= 1 / (this.MAX_LIFE * this.life * this.life);
    
    if (this.life < 0) {
        this.isDead = true;
    } else {
        game.applyPlanetsGravity(this, this.MASS);
        game.doPlanetsCollision(this, this.RADIUS - 1);
        game.checkPlayersHits(this);

        this.x += this.move.x;
        this.y += this.move.y;

        game.wrapCoords(this);
    }
}
