function Vector(ax, ay, bx, by) {
    if (bx && by) {
        this.x = bx - ax;
        this.y = by - ay;
    } else {
        this.x = ax;
        this.y = ay;
    }
    return this;
}

Vector.prototype.clone = function() {
    return new Vector(this.x, this.y);
}

Vector.prototype.mod = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

Vector.prototype.scalar = function(vector) {
    return this.x * vector.x + this.y * vector.y;
}

Vector.prototype.add = function(vector) {
    this.x = this.x + vector.x;
    this.y = this.y + vector.y;
    return this;
}

Vector.prototype.sub = function(vector) {
    this.x = this.x - vector.x;
    this.y = this.y - vector.y;
    return this;
}

Vector.prototype.scale = function(value) {
    this.x = this.x * value;
    this.y = this.y * value;
    return this;
}

Vector.prototype.normalize = function() {
    var length = this.mod();
    this.x = this.x / length;
    this.y = this.y / length;
    return this;
}

Vector.prototype.getNormalVector = function() {
    return new Vector(-this.y, this.x);
}

Vector.prototype.getReflectionVector = function(normalVector) {
    var result = this.clone();
    return result.sub(normalVector.scale(2 * result.scalar(normalVector)));
}