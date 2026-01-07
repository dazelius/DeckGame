// =====================================================
// DDOO Auto Battle - TFT + Clash Royale Style
// =====================================================

const Game = {
    // PixiJS
    app: null,
    
    // ==================== GAME STATE ====================
    state: {
        phase: 'placement',  // 'placement' | 'battle' | 'result'
        round: 1,
        timer: 30,           // Placement phase timer (seconds)
        gold: 10,
        maxGold: 10,
        
        // Player units on board
        playerUnits: [],
        // Enemy units (AI)
        enemyUnits: [],
        
        // Battle result
        playerHP: 100,
        enemyHP: 100
    },
    
    // ==================== CONTAINERS ====================
    containers: {
        background: null,
        grid: null,
        units: null,
        effects: null,
        ui: null
    },
    
    // ==================== ARENA ====================
    // Hearthstone style: LEFT = player, RIGHT = enemy
    arena: {
        width: 8,       // X: 0-7 (horizontal - left to right)
        depth: 3,       // Z: 0-2 (vertical rows)
        playerZoneX: 4, // Player can place in X: 0-3 (left half)
        enemyZoneX: 4   // Enemy spawns in X: 4-7 (right half)
    },
    
    battleAreaSize: { width: 0, height: 0 },
    
    // ==================== UNIT DEFINITIONS ====================
    unitTypes: {
        warrior: {
            name: 'Warrior',
            cost: 3,
            hp: 100,
            damage: 15,
            attackSpeed: 1.0,   // attacks per second
            range: 1,           // melee
            moveSpeed: 2,       // cells per second
            sprite: 'hero.png',
            scale: 0.5
        },
        archer: {
            name: 'Archer',
            cost: 2,
            hp: 50,
            damage: 12,
            attackSpeed: 1.2,
            range: 4,           // ranged
            moveSpeed: 2.5,
            sprite: 'goblin.png',  // placeholder
            scale: 0.4
        },
        tank: {
            name: 'Tank',
            cost: 4,
            hp: 200,
            damage: 8,
            attackSpeed: 0.6,
            range: 1,
            moveSpeed: 1,
            sprite: 'hero.png',
            scale: 0.6
        }
    },
    
    // ==================== TIMERS ====================
    timerInterval: null,
    battleLoopId: null,
    lastBattleTime: 0,
    
    // ==================== INIT ====================
    async init() {
        console.log('[Game] Initializing Auto Battle...');
        
        const battleArea = document.getElementById('battle-area');
        const rect = battleArea.getBoundingClientRect();
        this.battleAreaSize = { width: rect.width, height: rect.height };
        
        // 3D Background
        await DDOOBackground.init(battleArea);
        
        // PixiJS
        this.app = new PIXI.Application();
        await this.app.init({
            width: this.battleAreaSize.width,
            height: this.battleAreaSize.height,
            backgroundAlpha: 0,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            autoDensity: true
        });
        
        document.getElementById('game-container').appendChild(this.app.canvas);
        this.app.canvas.style.cssText = 'position:absolute;top:0;left:0;z-index:1;';
        
        // Containers
        this.setupContainers();
        
        // Draw grid
        this.drawGrid();
        
        // Setup UI
        this.setupUI();
        
        // Setup card drag
        this.setupUnitPlacement();
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Start placement phase
        this.startPlacementPhase();
        
        console.log('[Game] Ready!');
    },
    
    setupContainers() {
        this.containers.grid = new PIXI.Container();
        this.containers.grid.zIndex = 1;
        this.app.stage.addChild(this.containers.grid);
        
        this.containers.units = new PIXI.Container();
        this.containers.units.zIndex = 10;
        this.containers.units.sortableChildren = true;
        this.app.stage.addChild(this.containers.units);
        
        this.containers.effects = new PIXI.Container();
        this.containers.effects.zIndex = 20;
        this.app.stage.addChild(this.containers.effects);
        
        this.containers.ui = new PIXI.Container();
        this.containers.ui.zIndex = 100;
        this.app.stage.addChild(this.containers.ui);
        
        this.app.stage.sortableChildren = true;
    },
    
    // ==================== GRID ====================
    drawGrid() {
        const grid = this.containers.grid;
        grid.removeChildren();
        
        const graphics = new PIXI.Graphics();
        
        for (let x = 0; x < this.arena.width; x++) {
            for (let z = 0; z < this.arena.depth; z++) {
                const corners = this.getCellCorners(x, z);
                if (!corners) continue;
                
                // Hearthstone style: LEFT = player (blue), RIGHT = enemy (red)
                const isPlayerZone = x < this.arena.playerZoneX;
                const fillColor = isPlayerZone ? 0x2244aa : 0xaa2244;
                const fillAlpha = 0.2;
                
                // Draw cell
                graphics.moveTo(corners[0].x, corners[0].y);
                graphics.lineTo(corners[1].x, corners[1].y);
                graphics.lineTo(corners[2].x, corners[2].y);
                graphics.lineTo(corners[3].x, corners[3].y);
                graphics.closePath();
                graphics.fill({ color: fillColor, alpha: fillAlpha });
                graphics.stroke({ color: 0x555577, width: 1, alpha: 0.6 });
            }
        }
        
        // Center dividing line (vertical - between player and enemy zones)
        const centerX = this.arena.playerZoneX;
        const topCenter = DDOOBackground.project3DToScreen(centerX, 0, 0);
        const bottomCenter = DDOOBackground.project3DToScreen(centerX, 0, this.arena.depth);
        if (topCenter && bottomCenter) {
            graphics.moveTo(topCenter.screenX, topCenter.screenY);
            graphics.lineTo(bottomCenter.screenX, bottomCenter.screenY);
            graphics.stroke({ color: 0xffcc00, width: 3, alpha: 0.8 });
        }
        
        grid.addChild(graphics);
    },
    
    getCellCorners(x, z) {
        const tl = DDOOBackground.project3DToScreen(x, 0, z);
        const tr = DDOOBackground.project3DToScreen(x + 1, 0, z);
        const br = DDOOBackground.project3DToScreen(x + 1, 0, z + 1);
        const bl = DDOOBackground.project3DToScreen(x, 0, z + 1);
        
        if (!tl || !tr || !br || !bl) return null;
        
        return [
            { x: tl.screenX, y: tl.screenY },
            { x: tr.screenX, y: tr.screenY },
            { x: br.screenX, y: br.screenY },
            { x: bl.screenX, y: bl.screenY }
        ];
    },
    
    getCellCenter(x, z) {
        const corners = this.getCellCorners(x, z);
        if (!corners) return null;
        
        return {
            x: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
            y: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4
        };
    },
    
    // ==================== UI ====================
    setupUI() {
        this.updateTimerUI();
        this.updateGoldUI();
        this.updatePhaseUI();
    },
    
    updateTimerUI() {
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            timerEl.textContent = Math.ceil(this.state.timer);
            timerEl.style.color = this.state.timer <= 5 ? '#ff4444' : '#ffffff';
        }
    },
    
    updateGoldUI() {
        const goldEl = document.getElementById('gold-display');
        if (goldEl) {
            goldEl.textContent = this.state.gold;
        }
    },
    
    updatePhaseUI() {
        const phaseEl = document.getElementById('phase-display');
        if (phaseEl) {
            const phaseNames = {
                placement: 'PLACEMENT',
                battle: 'BATTLE',
                result: 'RESULT'
            };
            phaseEl.textContent = phaseNames[this.state.phase] || this.state.phase;
        }
    },
    
    // ==================== PLACEMENT PHASE ====================
    startPlacementPhase() {
        this.state.phase = 'placement';
        this.state.timer = 30;
        this.updatePhaseUI();
        
        // Generate enemy units for this round
        this.generateEnemyUnits();
        
        // Start timer
        this.timerInterval = setInterval(() => {
            this.state.timer -= 1;
            this.updateTimerUI();
            
            if (this.state.timer <= 0) {
                this.endPlacementPhase();
            }
        }, 1000);
        
        console.log('[Game] Placement phase started');
    },
    
    endPlacementPhase() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.startBattlePhase();
    },
    
    // ==================== UNIT PLACEMENT ====================
    setupUnitPlacement() {
        const cards = document.querySelectorAll('.unit-card');
        
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('unitType', card.dataset.unit);
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });
        
        // Drop zone (battle area)
        const battleArea = document.getElementById('battle-area');
        
        battleArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.state.phase !== 'placement') return;
            
            // Highlight valid cell (LEFT side = player zone)
            const gridPos = this.screenToGrid(e.clientX, e.clientY);
            if (gridPos && gridPos.x < this.arena.playerZoneX) {
                this.highlightCell(gridPos.x, gridPos.z);
            }
        });
        
        battleArea.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.state.phase !== 'placement') return;
            
            const unitType = e.dataTransfer.getData('unitType');
            const gridPos = this.screenToGrid(e.clientX, e.clientY);
            
            // Only allow placement on LEFT side (player zone)
            if (gridPos && gridPos.x < this.arena.playerZoneX) {
                this.placeUnit(unitType, gridPos.x, gridPos.z, 'player');
            }
            
            this.clearHighlight();
        });
        
        battleArea.addEventListener('dragleave', () => {
            this.clearHighlight();
        });
        
        // Start Battle button
        const startBtn = document.getElementById('btn-start-battle');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.state.phase === 'placement') {
                    this.endPlacementPhase();
                }
            });
        }
        
        // Reroll button (placeholder)
        const rerollBtn = document.getElementById('btn-reroll');
        if (rerollBtn) {
            rerollBtn.addEventListener('click', () => {
                if (this.state.gold >= 2) {
                    this.state.gold -= 2;
                    this.updateGoldUI();
                    this.showMessage('Reroll!', 500);
                }
            });
        }
    },
    
    screenToGrid(screenX, screenY) {
        const battleArea = document.getElementById('battle-area');
        const rect = battleArea.getBoundingClientRect();
        const localX = screenX - rect.left;
        const localY = screenY - rect.top;
        
        // Find which cell contains this point
        for (let x = 0; x < this.arena.width; x++) {
            for (let z = 0; z < this.arena.depth; z++) {
                const corners = this.getCellCorners(x, z);
                if (corners && this.pointInPolygon(localX, localY, corners)) {
                    return { x, z };
                }
            }
        }
        return null;
    },
    
    pointInPolygon(px, py, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    },
    
    highlightCell(x, z) {
        // TODO: Visual highlight
    },
    
    clearHighlight() {
        // TODO: Clear highlight
    },
    
    async placeUnit(unitType, gridX, gridZ, team) {
        const unitDef = this.unitTypes[unitType];
        if (!unitDef) return;
        
        // Check cost
        if (team === 'player' && this.state.gold < unitDef.cost) {
            this.showMessage('Not enough gold!', 1000);
            return;
        }
        
        // Check if cell is occupied
        const occupied = [...this.state.playerUnits, ...this.state.enemyUnits]
            .some(u => u.gridX === gridX && u.gridZ === gridZ);
        if (occupied) {
            this.showMessage('Cell occupied!', 1000);
            return;
        }
        
        // Deduct gold
        if (team === 'player') {
            this.state.gold -= unitDef.cost;
            this.updateGoldUI();
        }
        
        // Create sprite
        const sprite = await DDOORenderer.createSprite(unitDef.sprite, {
            scale: unitDef.scale,
            outline: { enabled: false },
            shadow: { enabled: false },
            breathing: { enabled: true, scaleAmount: 0.01 }
        });
        
        // Position
        const center = this.getCellCenter(gridX, gridZ);
        if (center) {
            sprite.x = center.x;
            sprite.y = center.y;
        }
        
        // Team color tint
        sprite.tint = team === 'player' ? 0x8888ff : 0xff8888;
        
        this.containers.units.addChild(sprite);
        
        // Create unit object
        const unit = {
            id: Date.now() + Math.random(),
            type: unitType,
            team,
            gridX,
            gridZ,
            x: gridX + 0.5,  // World position (center of cell)
            z: gridZ + 0.5,
            hp: unitDef.hp,
            maxHp: unitDef.hp,
            sprite,
            attackCooldown: 0,
            target: null,
            state: 'idle'  // 'idle' | 'moving' | 'attacking'
        };
        
        if (team === 'player') {
            this.state.playerUnits.push(unit);
        } else {
            this.state.enemyUnits.push(unit);
        }
        
        console.log(`[Game] Placed ${unitType} at (${gridX}, ${gridZ}) for ${team}`);
    },
    
    generateEnemyUnits() {
        // Simple enemy generation based on round
        const enemyCount = Math.min(1 + Math.floor(this.state.round / 2), 5);
        const types = ['warrior', 'archer', 'tank'];
        
        for (let i = 0; i < enemyCount; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            // Spawn on RIGHT side (enemy zone: X >= playerZoneX)
            const x = this.arena.playerZoneX + Math.floor(Math.random() * this.arena.enemyZoneX);
            const z = Math.floor(Math.random() * this.arena.depth);
            
            this.placeUnit(type, x, z, 'enemy');
        }
    },
    
    // ==================== BATTLE PHASE ====================
    startBattlePhase() {
        this.state.phase = 'battle';
        this.updatePhaseUI();
        this.lastBattleTime = performance.now();
        
        // Start battle loop
        this.battleLoop();
        
        console.log('[Game] Battle phase started!');
    },
    
    battleLoop() {
        if (this.state.phase !== 'battle') return;
        
        const now = performance.now();
        const delta = (now - this.lastBattleTime) / 1000;  // seconds
        this.lastBattleTime = now;
        
        // Update all units
        this.updateUnits(delta);
        
        // Check battle end
        if (this.checkBattleEnd()) {
            this.endBattlePhase();
            return;
        }
        
        this.battleLoopId = requestAnimationFrame(() => this.battleLoop());
    },
    
    updateUnits(delta) {
        const allUnits = [...this.state.playerUnits, ...this.state.enemyUnits];
        
        allUnits.forEach(unit => {
            if (unit.hp <= 0) return;
            
            const unitDef = this.unitTypes[unit.type];
            
            // Find target
            const enemies = unit.team === 'player' ? this.state.enemyUnits : this.state.playerUnits;
            const aliveEnemies = enemies.filter(e => e.hp > 0);
            
            if (aliveEnemies.length === 0) return;
            
            // Find nearest enemy
            let nearest = null;
            let nearestDist = Infinity;
            
            aliveEnemies.forEach(enemy => {
                const dist = Math.abs(unit.x - enemy.x) + Math.abs(unit.z - enemy.z);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            });
            
            unit.target = nearest;
            
            // Attack or move
            if (nearestDist <= unitDef.range) {
                // In range - attack
                unit.attackCooldown -= delta;
                
                if (unit.attackCooldown <= 0) {
                    this.attackUnit(unit, nearest);
                    unit.attackCooldown = 1 / unitDef.attackSpeed;
                }
                unit.state = 'attacking';
            } else {
                // Move towards target
                const dx = nearest.x - unit.x;
                const dz = nearest.z - unit.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                if (dist > 0) {
                    const moveAmount = unitDef.moveSpeed * delta;
                    unit.x += (dx / dist) * moveAmount;
                    unit.z += (dz / dist) * moveAmount;
                    
                    // Update grid position
                    unit.gridX = Math.floor(unit.x);
                    unit.gridZ = Math.floor(unit.z);
                    
                    // Update sprite position
                    this.updateUnitSprite(unit);
                }
                unit.state = 'moving';
            }
        });
    },
    
    attackUnit(attacker, target) {
        const unitDef = this.unitTypes[attacker.type];
        const damage = unitDef.damage;
        
        target.hp -= damage;
        
        // Visual feedback
        if (target.sprite) {
            gsap.to(target.sprite, {
                alpha: 0.5,
                duration: 0.1,
                yoyo: true,
                repeat: 1
            });
        }
        
        // Damage number
        this.showDamage(target, damage);
        
        // Check death
        if (target.hp <= 0) {
            this.killUnit(target);
        }
    },
    
    showDamage(unit, damage) {
        const text = new PIXI.Text({
            text: `-${damage}`,
            style: { fontSize: 20, fill: 0xff4444, fontWeight: 'bold' }
        });
        
        text.x = unit.sprite.x;
        text.y = unit.sprite.y - 30;
        text.anchor.set(0.5);
        
        this.containers.effects.addChild(text);
        
        gsap.to(text, {
            y: text.y - 40,
            alpha: 0,
            duration: 0.8,
            onComplete: () => text.destroy()
        });
    },
    
    killUnit(unit) {
        console.log(`[Game] ${unit.type} died!`);
        
        // Death animation
        if (unit.sprite) {
            gsap.to(unit.sprite, {
                alpha: 0,
                scale: 0.5,
                duration: 0.3,
                onComplete: () => {
                    unit.sprite.destroy();
                    unit.sprite = null;
                }
            });
        }
        
        // Remove from arrays
        const arr = unit.team === 'player' ? this.state.playerUnits : this.state.enemyUnits;
        const idx = arr.indexOf(unit);
        if (idx >= 0) arr.splice(idx, 1);
    },
    
    updateUnitSprite(unit) {
        const screenPos = DDOOBackground.project3DToScreen(unit.x, 0, unit.z);
        if (screenPos && unit.sprite) {
            unit.sprite.x = screenPos.screenX;
            unit.sprite.y = screenPos.screenY;
            unit.sprite.zIndex = Math.floor(1000 - unit.z * 100);
        }
    },
    
    checkBattleEnd() {
        const playerAlive = this.state.playerUnits.filter(u => u.hp > 0).length;
        const enemyAlive = this.state.enemyUnits.filter(u => u.hp > 0).length;
        
        return playerAlive === 0 || enemyAlive === 0;
    },
    
    endBattlePhase() {
        if (this.battleLoopId) {
            cancelAnimationFrame(this.battleLoopId);
            this.battleLoopId = null;
        }
        
        const playerAlive = this.state.playerUnits.filter(u => u.hp > 0).length;
        const enemyAlive = this.state.enemyUnits.filter(u => u.hp > 0).length;
        
        if (playerAlive > 0 && enemyAlive === 0) {
            this.showMessage('VICTORY!', 2000);
            this.state.gold += 5 + this.state.round;  // Bonus gold
        } else {
            this.showMessage('DEFEAT!', 2000);
            this.state.playerHP -= 10 * enemyAlive;  // Damage based on survivors
        }
        
        this.state.phase = 'result';
        this.updatePhaseUI();
        
        // Next round after delay
        setTimeout(() => {
            if (this.state.playerHP > 0) {
                this.nextRound();
            } else {
                this.gameOver();
            }
        }, 3000);
    },
    
    nextRound() {
        this.state.round++;
        this.state.gold = Math.min(this.state.gold + 5, this.state.maxGold + this.state.round);
        
        // Clear units
        this.clearAllUnits();
        
        // Update UI
        this.updateGoldUI();
        
        // Start new placement phase
        this.startPlacementPhase();
        
        console.log(`[Game] Round ${this.state.round} started`);
    },
    
    clearAllUnits() {
        [...this.state.playerUnits, ...this.state.enemyUnits].forEach(unit => {
            if (unit.sprite) unit.sprite.destroy();
        });
        this.state.playerUnits = [];
        this.state.enemyUnits = [];
    },
    
    gameOver() {
        this.showMessage('GAME OVER', 5000);
        console.log('[Game] Game Over');
    },
    
    // ==================== UTILS ====================
    showMessage(text, duration = 2000) {
        const msgEl = document.getElementById('center-message');
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.style.opacity = '1';
            setTimeout(() => {
                msgEl.style.opacity = '0';
            }, duration);
        }
    },
    
    onResize() {
        const battleArea = document.getElementById('battle-area');
        const rect = battleArea.getBoundingClientRect();
        this.battleAreaSize = { width: rect.width, height: rect.height };
        
        if (this.app?.renderer) {
            this.app.renderer.resize(rect.width, rect.height);
        }
        
        DDOOBackground.handleResize();
        this.drawGrid();
    }
};

// Start game
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
