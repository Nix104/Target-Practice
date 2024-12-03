class TargetPiece {
    constructor(x, y, angle, size, imageData) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.velocityX = (Math.random() - 0.5) * 10;
        this.velocityY = -5 - Math.random() * 5;
        this.gravity = 0.5;
        this.size = size;
        this.imageData = imageData;
        this.bounced = false;
        this.bounceDamping = 0.6;
        this.canvas = this.canvas;
    }

    update() {
        // Apply physics
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.angle += this.rotationSpeed;

        // Check for bounce at bottom of canvas
        if (this.y + this.size/2 > this.canvas.height && !this.bounced) {
            this.velocityY = -Math.abs(this.velocityY) * this.bounceDamping;
            this.velocityX *= this.bounceDamping;
            this.rotationSpeed *= this.bounceDamping;
            this.bounced = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this.imageData,
            -this.size/2,
            -this.size/2,
            this.size,
            this.size
        );
        ctx.restore();
    }
}