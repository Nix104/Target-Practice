class Target {
    constructor(canvas, timeout) {
        this.size = 100;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = Math.random() * (canvas.height - this.size);
        this.timeCreated = Date.now();
        this.timeout = timeout;
        this.active = true;
        this.pieces = [];
        this.destroyed = false;
        this.canvas = canvas;

        // Create offscreen cavas for target pieces
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.size;
        this.offscreenCanvas.height = this.size;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    createPieces() {
        // Create four separate canvases for the pieces
        const pieceSize = this.size / 2;
        const positions = [
            [0, 0],
            [pieceSize, 0],
            [0, pieceSize],
            [pieceSize, pieceSize]
        ];

        positions.forEach(([offsetX, offsetY]) => {
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceSize;
            pieceCanvas.height = pieceSize;
            const pieceCtx = pieceCanvas.getContext('2d');

            // Draw portion of target on this piece
            pieceCtx.save();
            pieceCtx.translate(-offsetX, -offsetY);
            this.drawTarget(pieceCtx, pieceSize * 2);
            pieceCtx.restore();

            // Create piece with physics
            const piece = new TargetPiece(
                this.x + offsetX + pieceSize/2,
                this.y + offsetY + pieceSize/2,
                Math.random() * Math.PI * 2,
                pieceSize,
                pieceCanvas
            );
            piece.canvas = this.canvas;
            this.pieces.push(piece);
        });

        this.destroyed = true;
    }

    drawTarget(ctx, size = this.size) {
        const centerX = size / 2;
        const centerY = size / 2;
        const scale = size / 100;

        const rings = [
            { radius: 50 * scale, color: 'rgb(255, 255, 51)' },
            { radius: 42.5 * scale, color: 'rgb(253, 23, 0)' },
            { radius: 35 * scale, color: 'white' },
            { radius:27.5 * scale, color: 'black' },
            { radius:20 * scale, color: 'white' },
            { radius: 12.5 * scale, color: 'black' }, 
            { radius: 5 * scale, color: 'rgb(64, 171, 191)' }
        ];

        rings.forEach(ring => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
            ctx.fillStyle = ring.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.stroke();
        });
    }
    
    draw(ctx) {
        if (this.destroyed) {
            // Update and draw pieces
            this.pieces.forEach(piece => {
                piece.update();
                piece.draw(ctx);
            });

            // Remove pieces that have fallen off screen
            this.pieces = this.pieces.filter(piece =>
                piece.y < this.canvas.height + this.size);

            return;
        }

        if (!this.active) {
            this.createPieces();
            return;
        }

        // Draw normal target
        ctx.save();
        ctx.translate(this.x, this.y);
        this.drawTarget(ctx);

        // Time indicator 
        const timeElapsed = Date.now() - this.timeCreated;
        const timeRatio = Math.min(timeElapsed / this.timeout, 1);
        const fadeRadius = this.size/2 + 5;

        ctx.beginPath();
        ctx.arc(this.size/2, this.size/2, fadeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 0, ${timeRatio})`;
        ctx.stroke();

        ctx.restore();
    }
    
    checkHit(x, y) {
        if (this.destroyed) return false;
        const dx = x - (this.x + this.size/2);
        const dy = y - (this.y + this.size/2);
        return dx * dx + dy * dy <= (this.size/2) * (this.size/2);
    }
}