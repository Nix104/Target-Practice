class ScorePopup {
    constructor(x, y, score) {
        this.x = x;
        this.y = y;
        this.value = `+${score}`;
        this.life = 1.0; // Fade out
        this.velocity = -4; // Move up
        this.fontSize = 36;
    }

    update() {
        this.life -= 0.02;
        this.y += this.velocity;
        this.fontSize *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return false;

        ctx.save();
        ctx.fillStyle = `rgba(255, 0, 0, ${this.life})`;
        ctx.font = `${this.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.value, this.x, this.y);
        ctx.restore();

        return true;
    }
}