// =====================================================
// Combat - Real-time Battle System
// =====================================================

const Combat = {
    // ========== Config ==========
    config: {
        intentGaugeSpeed: 0.02,    // Gauge fill speed per frame (0-1)
        baseGaugeTime: 3000,       // Base time to fill gauge (ms)
        tickRate: 16,              // Update every 16ms (~60fps)
    },
    
    // ========== State ==========
    state: {
        initialized: false,
        running: false,
        paused: false,
        tickId: null,
        lastTick: 0
    },
    
    // ========== Enemy Intents ==========
    intents: new Map(),  // enemyId -> { type, target, damage, gauge, maxGauge }
    
    // Intent types
    INTENT_TYPES: {
        ATTACK: {
            name: 'Attack',
            icon: 'sword',
            color: 0xef4444,
            execute: (enemy, target, data) => Combat.executeAttack(enemy, target, data)
        },
        HEAVY_ATTACK: {
            name: 'Heavy Attack',
            icon: 'hammer',
            color: 0xff6600,
            execute: (enemy, target, data) => Combat.executeHeavyAttack(enemy, target, data)
        },
        MOVE: {
            name: 'Move',
            icon: 'arrow',
            color: 0x3b82f6,
            execute: (enemy, target, data) => Combat.executeMove(enemy, target, data)
        },
        DEFEND: {
            name: 'Defend',
            icon: 'shield',
            color: 0x22c55e,
            execute: (enemy, target, data) => Combat.executeDefend(enemy, target, data)
        },
        BUFF: {
            name: 'Buff',
            icon: 'star',
            color: 0xa855f7,
            execute: (enemy, target, data) => Combat.executeBuff(enemy, target, data)
        }
    },
    
    // ========== Initialize ==========
    init() {
        if (this.state.initialized) return this;
        
        this.state.initialized = true;
        console.log('[Combat] Initialized');
        return this;
    },
    
    // ========== Start Battle ==========
    start() {
        if (this.state.running) return;
        
        this.state.running = true;
        this.state.paused = false;
        this.state.lastTick = performance.now();
        
        // Initialize enemy intents
        this.initializeEnemyIntents();
        
        // Start tick loop
        this.tick();
        
        console.log('[Combat] Battle started');
    },
    
    // ========== Stop Battle ==========
    stop() {
        this.state.running = false;
        if (this.state.tickId) {
            cancelAnimationFrame(this.state.tickId);
            this.state.tickId = null;
        }
        console.log('[Combat] Battle stopped');
    },
    
    // ========== Pause/Resume ==========
    pause() {
        this.state.paused = true;
        console.log('[Combat] Paused');
    },
    
    resume() {
        this.state.paused = false;
        this.state.lastTick = performance.now();
        console.log('[Combat] Resumed');
    },
    
    // ========== Main Tick Loop ==========
    tick() {
        if (!this.state.running) return;
        
        const now = performance.now();
        const delta = now - this.state.lastTick;
        
        if (!this.state.paused && delta >= this.config.tickRate) {
            this.update(delta);
            this.state.lastTick = now;
        }
        
        this.state.tickId = requestAnimationFrame(() => this.tick());
    },
    
    // ========== Update (called every tick) ==========
    update(delta) {
        // Update all enemy intents
        this.intents.forEach((intent, enemyId) => {
            if (intent.gauge < intent.maxGauge) {
                // Fill gauge
                intent.gauge += delta;
                
                // Update UI
                this.updateIntentUI(enemyId, intent);
                
                // Check if gauge is full
                if (intent.gauge >= intent.maxGauge) {
                    this.executeIntent(enemyId, intent);
                }
            }
        });
    },
    
    // ========== Initialize Enemy Intents ==========
    initializeEnemyIntents() {
        this.intents.clear();
        
        // Get enemies from Game
        if (typeof Game !== 'undefined' && Game.state.enemies) {
            Game.state.enemies.forEach((enemy, index) => {
                this.setEnemyIntent(index, this.generateRandomIntent());
            });
        }
    },
    
    // ========== Set Enemy Intent ==========
    setEnemyIntent(enemyId, intentData) {
        const intent = {
            type: intentData.type || 'ATTACK',
            target: intentData.target || 'player',
            damage: intentData.damage || 0,
            gauge: 0,
            maxGauge: intentData.chargeTime || this.config.baseGaugeTime,
            data: intentData.data || {}
        };
        
        this.intents.set(enemyId, intent);
        this.createIntentUI(enemyId, intent);
        
        return intent;
    },
    
    // ========== Generate Random Intent ==========
    generateRandomIntent() {
        const types = ['ATTACK', 'ATTACK', 'HEAVY_ATTACK', 'MOVE', 'DEFEND'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let damage = 0;
        let chargeTime = this.config.baseGaugeTime;
        
        switch (type) {
            case 'ATTACK':
                damage = 5 + Math.floor(Math.random() * 5);
                chargeTime = 2500 + Math.random() * 1000;
                break;
            case 'HEAVY_ATTACK':
                damage = 12 + Math.floor(Math.random() * 8);
                chargeTime = 4000 + Math.random() * 1500;
                break;
            case 'MOVE':
                chargeTime = 2000 + Math.random() * 1000;
                break;
            case 'DEFEND':
                chargeTime = 3000 + Math.random() * 1000;
                break;
        }
        
        return { type, damage, chargeTime };
    },
    
    // ========== Execute Intent ==========
    executeIntent(enemyId, intent) {
        const intentType = this.INTENT_TYPES[intent.type];
        if (!intentType) return;
        
        console.log(`[Combat] Enemy ${enemyId} executes ${intent.type}`);
        
        // Execute the intent action
        intentType.execute(enemyId, intent.target, intent);
        
        // Set new intent after delay
        setTimeout(() => {
            if (this.state.running) {
                this.setEnemyIntent(enemyId, this.generateRandomIntent());
            }
        }, 500);
    },
    
    // ========== Intent Executions ==========
    executeAttack(enemyId, target, intent) {
        if (typeof Game !== 'undefined') {
            Game.enemyAttacksPlayer(enemyId, intent.damage);
        }
    },
    
    executeHeavyAttack(enemyId, target, intent) {
        if (typeof Game !== 'undefined') {
            Game.enemyAttacksPlayer(enemyId, intent.damage, { heavy: true });
        }
    },
    
    executeMove(enemyId, target, intent) {
        if (typeof Game !== 'undefined') {
            // Move enemy closer to player
            const enemy = Game.worldPositions.enemies[enemyId];
            if (enemy) {
                const newX = Math.max(5.5, enemy.x - 1);  // Move left but stay in enemy zone
                Game.moveCharacter('enemy', enemyId, newX, enemy.z);
            }
        }
    },
    
    executeDefend(enemyId, target, intent) {
        if (typeof Game !== 'undefined') {
            Game.addEnemyBlock(enemyId, 5 + Math.floor(Math.random() * 5));
        }
    },
    
    executeBuff(enemyId, target, intent) {
        // Add strength or other buff
        console.log(`[Combat] Enemy ${enemyId} buffs self`);
    },
    
    // ========== UI Functions ==========
    
    // Get icon symbol for intent type
    getIntentSymbol(type) {
        switch(type) {
            case 'ATTACK': return '8';       // Damage
            case 'HEAVY_ATTACK': return '15'; // Heavy damage
            case 'MOVE': return '>';         // Arrow
            case 'DEFEND': return 'D';       // Defense
            case 'BUFF': return '+';         // Plus
            default: return '?';
        }
    },
    
    // Get intent class for styling
    getIntentClass(type) {
        switch(type) {
            case 'ATTACK': return 'attack';
            case 'HEAVY_ATTACK': return 'heavy';
            case 'MOVE': return 'move';
            case 'DEFEND': return 'defend';
            case 'BUFF': return 'buff';
            default: return '';
        }
    },
    
    // Create intent UI above enemy
    createIntentUI(enemyId, intent) {
        const container = document.getElementById('intent-container');
        if (!container) return;
        
        // Remove existing
        const existing = document.getElementById(`intent-${enemyId}`);
        if (existing) existing.remove();
        
        const intentClass = this.getIntentClass(intent.type);
        const symbol = intent.damage > 0 ? intent.damage : this.getIntentSymbol(intent.type);
        
        const div = document.createElement('div');
        div.id = `intent-${enemyId}`;
        div.className = 'char-intent';
        div.innerHTML = `
            <div class="intent-icon ${intentClass}">${symbol}</div>
            <div class="intent-bar">
                <div class="intent-bar-fill" id="gauge-${enemyId}"></div>
            </div>
        `;
        
        container.appendChild(div);
        
        // Position above enemy
        this.positionIntentUI(enemyId);
    },
    
    // Position intent UI above enemy's head
    positionIntentUI(enemyId) {
        const intentDiv = document.getElementById(`intent-${enemyId}`);
        if (!intentDiv) return;
        
        // Get enemy screen position from DDOOBackground
        if (typeof DDOOBackground !== 'undefined' && typeof Game !== 'undefined') {
            const worldPos = Game.worldPositions.enemies[enemyId];
            if (worldPos) {
                // Project 3D to screen (add Y offset for head position)
                const screenPos = DDOOBackground.project3DToScreen(worldPos.x, worldPos.y + 1.5, worldPos.z);
                if (screenPos) {
                    intentDiv.style.left = `${screenPos.x}px`;
                    intentDiv.style.top = `${screenPos.y - 30}px`;  // Above head
                }
            }
        }
    },
    
    updateIntentUI(enemyId, intent) {
        const gauge = document.getElementById(`gauge-${enemyId}`);
        if (gauge) {
            const percent = Math.min(100, (intent.gauge / intent.maxGauge) * 100);
            gauge.style.width = `${percent}%`;
            
            // Color change when almost full
            if (percent > 80) {
                gauge.classList.add('danger');
            } else {
                gauge.classList.remove('danger');
            }
        }
        
        // Update position (enemies might have moved)
        this.positionIntentUI(enemyId);
    },
    
    // Update all intent positions (call this when camera/resize changes)
    updateAllIntentPositions() {
        this.intents.forEach((intent, enemyId) => {
            this.positionIntentUI(enemyId);
        });
    },
    
    removeIntentUI(enemyId) {
        const div = document.getElementById(`intent-${enemyId}`);
        if (div) div.remove();
    },
    
    // ========== Card Actions ==========
    
    // Called when player uses a card at a grid position
    useCard(cardData, gridX, gridZ) {
        console.log(`[Combat] Card used: ${cardData.name} at (${gridX}, ${gridZ})`);
        
        // Execute card effect based on type
        switch (cardData.type) {
            case 'attack':
                this.cardAttack(cardData, gridX, gridZ);
                break;
            case 'move':
                this.cardMove(cardData, gridX, gridZ);
                break;
            case 'skill':
                this.cardSkill(cardData, gridX, gridZ);
                break;
            default:
                this.cardAttack(cardData, gridX, gridZ);
        }
        
        return true;
    },
    
    cardAttack(cardData, gridX, gridZ) {
        // Find enemies at or near the target position
        if (typeof Game !== 'undefined') {
            Game.worldPositions.enemies.forEach((pos, i) => {
                const dist = Math.abs(pos.x - gridX) + Math.abs(pos.z - gridZ);
                if (dist <= (cardData.range || 2)) {
                    Game.attackEnemy(i);
                }
            });
        }
    },
    
    cardMove(cardData, gridX, gridZ) {
        if (typeof Game !== 'undefined') {
            // Move player to target position (clamped to player zone)
            const clampedX = Math.min(4.5, Math.max(0.5, gridX));
            Game.moveCharacter('player', 0, clampedX, gridZ);
        }
    },
    
    cardSkill(cardData, gridX, gridZ) {
        // Skill effects (buffs, debuffs, etc)
        console.log(`[Combat] Skill: ${cardData.name}`);
    },
    
    // ========== Interrupt Enemy ==========
    interruptEnemy(enemyId, amount = 500) {
        const intent = this.intents.get(enemyId);
        if (intent) {
            intent.gauge = Math.max(0, intent.gauge - amount);
            this.updateIntentUI(enemyId, intent);
        }
    },
    
    // ========== Cleanup ==========
    dispose() {
        this.stop();
        this.intents.clear();
        
        // Remove UI
        const container = document.getElementById('intent-container');
        if (container) container.innerHTML = '';
        
        this.state.initialized = false;
        console.log('[Combat] Disposed');
    }
};

// Global
window.Combat = Combat;

console.log('[Combat] Module loaded');
