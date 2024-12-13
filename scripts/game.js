class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.displays = {
            hearts: Array.from(document.getElementsByClassName('heart')),
            ammoIcons: Array.from(document.getElementsByClassName('ammo')),
            score: document.getElementById('score'),
            reloadBtn: document.getElementById('reloadBtn')
        };
        
        this.state = {
            lives: 3,
            ammo: 5,
            score: 0,
            targets: [],
            isGameOver: false,
            scorePopups: []
        };
        
        this.settings = {
            targetTimeout: 3000,    // Time to hit target (ms)
            targetInterval: 2500,   // Time between targets (ms)
            maxTargets: 3,          // Maximum targets on screen
            magazineSize: 5,        // Rounds per magazine

            // Difficulty progression
            difficultyInterval: 30000,
            minTargetTimeout: 2000,
            minTargetInterval: 1500,
            maxTargetsLimit: 8,
            speedIncrease: 100,
            targetIncrease: 1
        };

        // Difficulty tracking
        // this.difficultyTimer = 0;
        // this.lastUpdate = Date.now();
        this.lastDifficultyUpdate = Date.now();

        // Create video background
        this.background = document.createElement('video');
        this.background.src = 'assets/videos/green-field.mp4';
        this.background.loop = true;
        this.background.autoplay = true;
        this.background.muted = true;

        // Start game when video is ready
        this.background.addEventListener('loadeddata', () => {
            // Calculate scaling to fit canvas while maintaining aspect ratio
            this.bgScale = Math.min(
                this.canvas.width / this.background.videoWidth,
                this.canvas.height / this.background.videoHeight
            );

            // Calculate position to center the background
            this.bgX = (this.canvas.width - this.background.videoWidth * this.bgScale) / 2;
            this.bgY = (this.canvas.height - this.background.videoHeight * this.bgScale) / 2;

            // Start the game
            this.setupEventListeners();
            this.spawnTargetInterval = setInterval(() => this.spawnTarget(), this.settings.targetInterval);
            requestAnimationFrame(() => this.gameLoop());
            
            // Start playing the video
            this.background.play();
        });
    }

    updateDifficulty() {
        const currentTime = Date.now();
        // const deltaTime = currentTime - this.lastDifficultyUpdate;

        if (currentTime - this.lastDifficultyUpdate >= this.settings.difficultyInterval) {
            this.lastDifficultyUpdate = currentTime;

            // Gradual timeout decrease
            if (this.settings.targetTimeout > this.settings.minTargetTimeout) {
                this.settings.targetTimeout = Math.max(
                    this.settings.targetTimeout - this.settings.speedIncrease,
                    this.settings.minTargetTimeout
                );
            }
        }

        // this.difficultyTimer += deltaTime;

        // Gradual interval decrease
        if (this.settings.targetInterval > this.settings.minTargetInterval) {
            const newInterval = Math.max(
                this.settings.targetInterval - this.settings.speedIncrease,
                this.settings.minTargetInterval
            );

            if (newInterval != this.settings.targetInterval) {
                this.settings.targetInterval = newInterval;
                clearInterval(this.spawnTargetInterval);
                this.spawnTargetInterval = setInterval(
                    () => this.spawnTarget(),
                    this.settings.targetInterval
                );
            }
        }
            
        // Gradual target increase
        if (this.settings.maxTargets < this.settings.maxTargetsLimit) {
            this.settings.maxTargets += this.settings.targetIncrease;
        }
        
        this.showDifficultyIncrease();            
    }

    showDifficultyIncrease() {
        // Add visual feedback for difficulty increase
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Difficulty Increased!', this.canvas.width/2, 50);
        this.ctx.restore();

        // Remove notification after 2 sec
        setTimeout(() => {
            // next frame clears text
        }, 2000);
    }

    updateHearts() {
        this.displays.hearts.forEach((heart, index) => {
            if (index < this.state.lives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        });
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

    updateAmmoDisplay() {
        this.displays.ammoIcons.forEach((ammoIcon, index) => {
            if (index < this.state.ammo) {
                ammoIcon.classList.remove('used');
            } else {
                ammoIcon.classList.add('used');
            }                    
        })
    }
    
    handleShot(event) {
        if (this.state.isGameOver || this.state.ammo <= 0) return;
        
        this.state.ammo--;
        this.updateAmmoDisplay();
        this.displays.reloadBtn.disabled = false;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check for hits
        this.state.targets.forEach(target => {
            if (target.active) {
                const hitResult = target.checkHit(x, y);
                if (hitResult.hit) {
                    target.active = false;
                    this.state.score += hitResult.score;
                    this.displays.score.textContent = this.state.score;

                    // Score popup with actual score
                    this.state.scorePopups.push(new ScorePopup(
                        target.x + target.size/2,
                        target.y - 20,
                        hitResult.score
                    ));
                }
            }
        });
    }
    
    reload() {
        this.state.ammo = this.settings.magazineSize;
        this.updateAmmoDisplay();
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
                this.updateHearts();
                return false;
            }
            return target.active || now - target.timeCreated < this.settings.targetTimeout + 500; // Keep expired targets briefly
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw scaled and centered background
        const scaledWidth = this.background.videoWidth * this.bgScale;
        const scaledHeight = this.background.videoHeight * this.bgScale;

        this.ctx.drawImage(
            this.background,
            this.bgX,
            this.bgY,
            scaledWidth,
            scaledHeight
        );

        // Draw targets
        this.state.targets.forEach(target => target.draw(this.ctx));

        // Update and draw score popups
        this.state.scorePopups = this.state.scorePopups.filter(popup => {
            popup.update();
            return popup.draw(this.ctx);
        });
    }
    
    gameLoop() {
        if (this.state.lives <= 0 && !this.state.isGameOver) {
            this.endGame();
            return;
        }

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdate;
        
        this.updateDifficulty();
        this.updateTargets();
        this.draw();

        this.lastUpdate = currentTime;
        
        if (!this.state.isGameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    endGame() {
        this.state.isGameOver = true;
        clearInterval(this.spawnTargetInterval);

        // Draw background
        const scaledWidth = this.background.videoWidth * this.bgScale;
        const scaledHeight = this.background.videoHeight * this.bgScale;

        this.ctx.drawImage(
            this.background,
            this.bgX,
            this.bgY,
            scaledWidth,
            scaledHeight
        );
        
        // Darken overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width/2, this.canvas.height/2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.state.score}`, this.canvas.width/2, this.canvas.height/2 + 40);
    }
}