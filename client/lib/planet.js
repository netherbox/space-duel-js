function Planet(x, y, radius, gravity, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.gravity = gravity;
    this.color = color;
    return this;
}

Planet.prototype.COLLISION_MUL = 0.8;

Planet.prototype.draw = function(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
}

Planet.prototype.applyGravity = function(object, mass) {
    var gravityVector = new Vector(object.x, object.y, this.x, this.y),
        distance = gravityVector.mod(),
        direction = gravityVector.normalize(),
        force = this.gravity * mass / (distance * distance);

    object.move.add(direction.scale(force));
}

Planet.prototype.doCollision = function(object, radius) {
    var crossX = object.x + object.move.x,
        crossY = object.y + object.move.y;

    var distance = (new Vector(crossX, crossY, this.x, this.y)).mod();

    if (distance < this.radius + radius) {
        var objectVector = new Vector(object.x, object.y, crossX, crossY),
            normalVector = (new Vector(this.x, this.y, crossX, crossY)).normalize();

        var reflectionVector = objectVector.getReflectionVector(normalVector);

        object.move = reflectionVector.scale(this.COLLISION_MUL);

        if (object.type === Game.prototype.OBJECT_TYPE_PLAYER) {
            object.addEnergy(-reflectionVector.mod() * 2);
        }
    }
}