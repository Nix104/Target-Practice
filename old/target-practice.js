<!DOCTYPE html>
<html>
<head>
    <title>Target Practice</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
        }
        
        #gameInfo {
            background-color: #fff;
            padding: 15px;
            border-radius: 8px;
            margin: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        #gameCanvas {
            border: 3px solid #333;
            border-radius: 8px;
            cursor: crosshair;
            background-color: #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div id="gameInfo">
        Lives: <span id="lives">3</span> | 
        Ammo: <span id="ammo">5</span>/5 |
        Score: <span id="score">0</span>
        <button id="reloadBtn">Reload [R]</button>
    </div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        class Game {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.displays = {
                    lives: document.getElementById('lives'),
                    ammo: document.getElementById('ammo'),
                    score: document.getElementById('score'),
                    reloadBtn: document.getElementById('reloadBtn')
                };
                
                this.state = {
                    lives: 3,
                    ammo: 5,
                    score: 0,
                    targets: [],
                    isGameOver: false
                };
                
                this.settings = {
                    targetTimeout: 3000,    // Time to hit target (ms)
                    targetInterval: 2000,   // Time between targets (ms)
                    maxTargets: 5,         // Maximum targets on screen
                    magazineSize: 5        // Rounds per magazine
                };
                
                this.setupEventListeners();
                this.spawnTargetInterval = setInterval(() => this.spawnTarget(), this.settings.targetInterval);
                requestAnimationFrame(() => this.gameLoop());
            }
            
            setupEventListeners() {
                // Shooting mechanic
                this.canvas.addEventListener('click', (event) => this.handleShot(event));
                
                // Reload mechanics
                this.displays.reloadBtn.addEventListener('click', () => this.reload());
                document.addEventListener('keydown', (event) => {
                    if (event.key.toLowerCase() === 'r') this.reload();
                });
            }
            
            handleShot(event) {
                if (this.state.isGameOver || this.state.ammo <= 0) return;
                
                this.state.ammo--;
                this.displays.ammo.textContent = this.state.ammo;
                this.displays.reloadBtn.disabled = false;
                
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                // Check for hits
                this.state.targets.forEach(target => {
                    if (target.active && target.checkHit(x, y)) {
                        target.active = false;
                        this.state.score += 100;
                        this.displays.score.textContent = this.state.score;
                    }
                });
            }
            
            reload() {
                this.state.ammo = this.settings.magazineSize;
                this.displays.ammo.textContent = this.state.ammo;
                this.displays.reloadBtn.disabled = true;
            }
            
            spawnTarget() {
                if (this.state.isGameOver) return;
                if (this.state.targets.filter(t => t.active).length >= this.settings.maxTargets) return;
                
                this.state.targets.push(new Target(this.canvas, this.settings.targetTimeout));
            }
            
            updateTargets() {
                const now = Date.now();
                this.state.targets = this.state.targets.filter(target => {
                    if (target.active && now - target.timeCreated > this.settings.targetTimeout) {
                        this.state.lives--;
                        this.displays.lives.textContent = this.state.lives;
                        return false;
                    }
                    return target.active || now - target.timeCreated < this.settings.targetTimeout + 500; // Keep expired targets briefly
                });
            }
            
            draw() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.state.targets.forEach(target => target.draw(this.ctx));
            }
            
            gameLoop() {
                if (this.state.lives <= 0 && !this.state.isGameOver) {
                    this.endGame();
                    return;
                }
                
                this.updateTargets();
                this.draw();
                
                if (!this.state.isGameOver) {
                    requestAnimationFrame(() => this.gameLoop());
                }
            }
            
            endGame() {
                this.state.isGameOver = true;
                clearInterval(this.spawnTargetInterval);
                
                // Draw game over screen
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = '48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.canvas.width/2, this.canvas.height/2);
                
                this.ctx.font = '24px Arial';
                this.ctx.fillText(`Final Score: ${this.state.score}`, this.canvas.width/2, this.canvas.height/2 + 40);
            }
        }

        class Target {
            constructor(canvas, timeout) {
                this.size = 40;
                this.x = Math.random() * (canvas.width - this.size);
                this.y = Math.random() * (canvas.height - this.size);
                this.timeCreated = Date.now();
                this.timeout = timeout;
                this.active = true;
            }
            
            draw(ctx) {
                const timeElapsed = Date.now() - this.timeCreated;
                const timeRatio = Math.min(timeElapsed / this.timeout, 1);
                
                // Draw target
                ctx.beginPath();
                ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
                
                if (this.active) {
                    // Active target - changes from green to red as time runs out
                    const red = Math.floor(255 * timeRatio);
                    const green = Math.floor(255 * (1 - timeRatio));
                    ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
                } else {
                    // Explosion effect when hit
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                }
                
                ctx.fill();
                ctx.closePath();
            }
            
            checkHit(x, y) {
                const dx = x - (this.x + this.size/2);
                const dy = y - (this.y + this.size/2);
                return dx * dx + dy * dy <= (this.size/2) * (this.size/2);
            }
        }

        // Start the game
        const game = new Game();
    </script>
</body>
</html>
