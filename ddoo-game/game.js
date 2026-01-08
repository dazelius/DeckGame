// =====================================================
// DDOO Auto Battle - TFT + Clash Royale Style
// =====================================================

const Game = {
    // PixiJS
    app: null,
    
    // ==================== GAME STATE ====================
    state: {
        phase: 'prepare',    // 'prepare' | 'battle' | 'result'
        turn: 1,             // Current turn number
        cost: 3,             // Current cost points (starts at 3, increases each turn)
        maxCost: 10,         // Max cost points
        battleTurn: 0,       // Battle sub-turn
        
        // Units on board
        playerUnits: [],     // Includes hero + summons
        enemyUnits: [],
        
        // Hero stats
        heroBlock: 0,        // Current block (resets each turn)
        
        // Hero reference
        hero: null,
        
        // Hand of cards
        hand: [],
        deck: [],
        discard: []
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
    // 5x3 per side (total 10x3)
    arena: {
        width: 10,      // X: 0-9 (5 per side)
        depth: 3,       // Z: 0-2 (3 rows)
        playerZoneX: 5, // Player zone: X 0-4
        enemyZoneX: 5   // Enemy zone: X 5-9
    },
    
    battleAreaSize: { width: 0, height: 0 },
    
    // ==================== UNIT DEFINITIONS ====================
    unitTypes: {
        // Hero (player's main character)
        hero: {
            name: 'Hero',
            cost: 0,
            hp: 80,
            damage: 0,  // Hero doesn't auto-attack, uses cards
            range: 0,
            sprite: 'hero.png',
            scale: 0.5,
            isHero: true
        },
        // Summons
        knight: {
            name: 'Knight',
            cost: 3,
            hp: 40,
            damage: 12,
            range: 1,
            sprite: 'hero.png',
            scale: 0.4
        },
        archer: {
            name: 'Archer',
            cost: 2,
            hp: 25,
            damage: 8,
            range: 4,
            sprite: 'goblinarcher.png',
            scale: 0.35
        },
        // Enemies
        goblin: {
            name: 'Goblin',
            cost: 0,
            hp: 25,
            damage: 8,
            range: 1,
            sprite: 'goblin.png',
            scale: 0.4,
            intents: ['attack', 'attack', 'defend']
        },
        goblinArcher: {
            name: 'Goblin Archer',
            cost: 0,
            hp: 18,
            damage: 6,
            range: 4,
            sprite: 'goblinarcher.png',
            scale: 0.35,
            intents: ['attack', 'attack', 'buff']
        }
    },
    
    // ==================== CARD DEFINITIONS ====================
    cards: {
        strike: { name: 'Strike', cost: 1, type: 'attack', damage: 6, target: 'enemy', desc: 'Deal 6 damage' },
        defend: { name: 'Defend', cost: 1, type: 'skill', block: 5, target: 'self', desc: 'Gain 5 Block' },
        bash: { name: 'Bash', cost: 2, type: 'attack', damage: 8, vulnerable: 2, target: 'enemy', desc: 'Deal 8 damage. Apply 2 Vulnerable' },
        cleave: { name: 'Cleave', cost: 1, type: 'attack', damage: 8, target: 'all', desc: 'Deal 8 damage to ALL enemies' },
        ironWave: { name: 'Iron Wave', cost: 1, type: 'attack', damage: 5, block: 5, target: 'enemy', desc: 'Gain 5 Block. Deal 5 damage' },
        summonKnight: { name: 'Summon Knight', cost: 3, type: 'summon', unit: 'knight', target: 'grid', desc: 'Summon a Knight (40 HP, 12 DMG)' },
        summonArcher: { name: 'Summon Archer', cost: 2, type: 'summon', unit: 'archer', target: 'grid', desc: 'Summon an Archer (25 HP, 8 DMG, Range 4)' },
        heal: { name: 'Heal', cost: 2, type: 'skill', heal: 10, target: 'self', desc: 'Heal 10 HP' }
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
        
        // Start game
        await this.startGame();
        
        console.log('[Game] Ready!');
    },
    
    async startGame() {
        // Place hero at starting position
        await this.placeUnit('hero', 2, 1, 'player');
        this.state.hero = this.state.playerUnits[0];
        
        // Initialize deck (2 of each card)
        this.initDeck();
        
        // Generate initial enemies
        this.generateEnemyUnits();
        
        // Start prepare phase
        this.startPreparePhase();
    },
    
    initDeck() {
        // Create deck with multiple copies of each card
        const cardCounts = {
            strike: 4,
            defend: 4,
            bash: 2,
            cleave: 1,
            ironWave: 2,
            summonKnight: 2,
            summonArcher: 2,
            heal: 1
        };
        
        this.state.deck = [];
        for (const [cardId, count] of Object.entries(cardCounts)) {
            for (let i = 0; i < count; i++) {
                this.state.deck.push(cardId);
            }
        }
        
        // Shuffle deck
        this.shuffleDeck();
    },
    
    shuffleDeck() {
        const deck = this.state.deck;
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    },
    
    drawCards(count = 5) {
        for (let i = 0; i < count; i++) {
            if (this.state.deck.length === 0) {
                // Shuffle discard into deck
                this.state.deck = [...this.state.discard];
                this.state.discard = [];
                this.shuffleDeck();
            }
            
            if (this.state.deck.length > 0) {
                const cardId = this.state.deck.pop();
                this.state.hand.push(cardId);
            }
        }
        
        this.renderHand();
    },
    
    discardHand() {
        this.state.discard.push(...this.state.hand);
        this.state.hand = [];
        this.renderHand();
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
        this.updateTurnUI();
        this.updateCostUI();
        this.updatePhaseUI();
    },
    
    updateTurnUI() {
        const turnEl = document.getElementById('turn-display');
        if (turnEl) {
            turnEl.textContent = this.state.turn;
        }
    },
    
    updateCostUI() {
        const costEl = document.getElementById('cost-display');
        if (costEl) {
            costEl.textContent = this.state.cost;
        }
        // Update cost bar
        const costBar = document.getElementById('cost-bar-fill');
        if (costBar) {
            costBar.style.width = (this.state.cost / this.state.maxCost * 100) + '%';
        }
    },
    
    updatePhaseUI() {
        const phaseEl = document.getElementById('phase-display');
        if (phaseEl) {
            const phaseNames = {
                prepare: 'YOUR TURN',
                battle: 'BATTLE',
                result: 'RESULT'
            };
            phaseEl.textContent = phaseNames[this.state.phase] || this.state.phase;
        }
    },
    
    // ==================== PREPARE PHASE ====================
    startPreparePhase() {
        this.state.phase = 'prepare';
        
        // Reset block at start of turn
        this.state.heroBlock = 0;
        
        // Draw 5 cards
        this.drawCards(5);
        
        // Roll enemy intents
        this.rollEnemyIntents();
        
        this.updatePhaseUI();
        this.updateTurnUI();
        this.updateCostUI();
        this.updateBlockUI();
        
        console.log(`[Game] Turn ${this.state.turn} - Prepare phase`);
    },
    
    rollEnemyIntents() {
        this.state.enemyUnits.forEach(enemy => {
            const unitDef = this.unitTypes[enemy.type];
            if (unitDef.intents && unitDef.intents.length > 0) {
                const intentType = unitDef.intents[Math.floor(Math.random() * unitDef.intents.length)];
                enemy.intent = {
                    type: intentType,
                    damage: intentType === 'attack' ? unitDef.damage : 0
                };
            } else {
                enemy.intent = { type: 'attack', damage: enemy.damage };
            }
        });
        
        this.renderEnemyIntents();
    },
    
    renderEnemyIntents() {
        // Clear existing intent UI
        document.querySelectorAll('.enemy-intent').forEach(el => el.remove());
        
        this.state.enemyUnits.forEach(enemy => {
            if (!enemy.sprite || !enemy.intent) return;
            
            const intentEl = document.createElement('div');
            intentEl.className = 'enemy-intent';
            
            let icon = '';
            let text = '';
            switch (enemy.intent.type) {
                case 'attack':
                    icon = '&#9876;'; // Sword
                    text = enemy.intent.damage;
                    intentEl.style.color = '#ff4444';
                    break;
                case 'defend':
                    icon = '&#128737;'; // Shield
                    text = '';
                    intentEl.style.color = '#44aaff';
                    break;
                case 'buff':
                    icon = '&#10024;'; // Sparkle
                    text = '';
                    intentEl.style.color = '#ffaa44';
                    break;
            }
            
            intentEl.innerHTML = `<span class="intent-icon">${icon}</span><span class="intent-value">${text}</span>`;
            
            // Position above enemy
            const rect = document.getElementById('battle-area').getBoundingClientRect();
            intentEl.style.position = 'absolute';
            intentEl.style.left = (enemy.sprite.x + rect.left) + 'px';
            intentEl.style.top = (enemy.sprite.y + rect.top - 60) + 'px';
            intentEl.style.transform = 'translateX(-50%)';
            intentEl.style.zIndex = '1000';
            intentEl.style.fontSize = '20px';
            intentEl.style.fontWeight = 'bold';
            intentEl.style.textShadow = '0 0 5px black';
            
            document.body.appendChild(intentEl);
        });
    },
    
    updateBlockUI() {
        const blockEl = document.getElementById('block-display');
        if (blockEl) {
            blockEl.textContent = this.state.heroBlock;
            blockEl.style.display = this.state.heroBlock > 0 ? 'block' : 'none';
        }
    },
    
    endTurn() {
        if (this.state.phase !== 'prepare') return;
        
        // Discard remaining hand
        this.discardHand();
        
        // Clear intent UI
        document.querySelectorAll('.enemy-intent').forEach(el => el.remove());
        
        console.log('[Game] End turn - starting battle');
        this.startBattlePhase();
    },
    
    renderHand() {
        const handEl = document.getElementById('card-hand');
        if (!handEl) return;
        
        handEl.innerHTML = '';
        
        this.state.hand.forEach((cardId, index) => {
            const cardDef = this.cards[cardId];
            if (!cardDef) return;
            
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.dataset.cardId = cardId;
            cardEl.dataset.index = index;
            
            cardEl.innerHTML = `
                <div class="card-cost">${cardDef.cost}</div>
                <div class="card-name">${cardDef.name}</div>
                <div class="card-desc">${cardDef.desc}</div>
            `;
            
            // Click to play card
            cardEl.addEventListener('click', () => this.playCard(index));
            
            handEl.appendChild(cardEl);
        });
    },
    
    async playCard(handIndex) {
        if (this.state.phase !== 'prepare') return;
        
        const cardId = this.state.hand[handIndex];
        const cardDef = this.cards[cardId];
        
        if (!cardDef) return;
        
        // Check cost
        if (this.state.cost < cardDef.cost) {
            this.showMessage('Not enough cost!', 1000);
            return;
        }
        
        // Handle different card types
        switch (cardDef.type) {
            case 'attack':
                await this.playAttackCard(cardDef);
                break;
            case 'skill':
                await this.playSkillCard(cardDef);
                break;
            case 'summon':
                // Need to select grid position - for now just show message
                this.showMessage('Drag summon card to grid', 1000);
                return;
        }
        
        // Deduct cost and discard card
        this.state.cost -= cardDef.cost;
        this.state.hand.splice(handIndex, 1);
        this.state.discard.push(cardId);
        
        this.updateCostUI();
        this.renderHand();
    },
    
    async playAttackCard(cardDef) {
        // Deal damage to first enemy (or all for cleave)
        const targets = cardDef.target === 'all' 
            ? this.state.enemyUnits.filter(e => e.hp > 0)
            : [this.state.enemyUnits.find(e => e.hp > 0)].filter(Boolean);
        
        for (const target of targets) {
            await this.dealDamage(target, cardDef.damage);
        }
        
        // Apply block if card has it
        if (cardDef.block) {
            this.state.heroBlock += cardDef.block;
            this.updateBlockUI();
        }
    },
    
    async playSkillCard(cardDef) {
        if (cardDef.block) {
            this.state.heroBlock += cardDef.block;
            this.updateBlockUI();
            this.showMessage(`+${cardDef.block} Block`, 500);
        }
        
        if (cardDef.heal && this.state.hero) {
            this.state.hero.hp = Math.min(this.state.hero.hp + cardDef.heal, this.state.hero.maxHp);
            this.showMessage(`+${cardDef.heal} HP`, 500);
        }
    },
    
    async dealDamage(target, amount) {
        if (!target || target.hp <= 0) return;
        
        target.hp -= amount;
        this.showDamage(target, amount);
        
        // Hit effect
        if (target.sprite) {
            gsap.to(target.sprite, {
                alpha: 0.5,
                x: target.sprite.x + 10,
                duration: 0.1,
                yoyo: true,
                repeat: 1
            });
        }
        
        if (target.hp <= 0) {
            this.killUnit(target);
        }
        
        await new Promise(r => setTimeout(r, 200));
    },
    
    // ==================== UNIT PLACEMENT (DOM Drag) ====================
    dragState: {
        isDragging: false,
        unitType: null,
        ghost: null,
        startX: 0,
        startY: 0
    },
    
    setupUnitPlacement() {
        const cards = document.querySelectorAll('.unit-card');
        
        // Create ghost element for drag shadow
        this.createDragGhost();
        
        cards.forEach(card => {
            // Mouse drag
            card.addEventListener('mousedown', (e) => this.startDrag(e, card));
            
            // Touch drag
            card.addEventListener('touchstart', (e) => this.startDrag(e, card), { passive: false });
        });
        
        // Global move/end handlers
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));
        document.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
        document.addEventListener('touchend', (e) => this.endDrag(e));
        
        // End Turn button
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => this.endTurn());
        }
    },
    
    createDragGhost() {
        const ghost = document.createElement('div');
        ghost.id = 'drag-ghost';
        ghost.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.15s, transform 0.1s;
            transform: scale(1.1) rotate(-5deg);
            filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
        `;
        document.body.appendChild(ghost);
        this.dragState.ghost = ghost;
    },
    
    startDrag(e, card) {
        if (this.state.phase !== 'prepare') return;
        
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        
        this.dragState.isDragging = true;
        this.dragState.unitType = card.dataset.unit;
        this.dragState.startX = touch.clientX;
        this.dragState.startY = touch.clientY;
        
        // Clone card as ghost
        const ghost = this.dragState.ghost;
        ghost.innerHTML = card.outerHTML;
        ghost.firstChild.style.margin = '0';
        ghost.firstChild.classList.add('dragging');
        ghost.style.left = (touch.clientX - 50) + 'px';
        ghost.style.top = (touch.clientY - 65) + 'px';
        ghost.style.opacity = '0.9';
        
        card.classList.add('dragging');
        
        // Vibrate on mobile
        if (navigator.vibrate) navigator.vibrate(30);
    },
    
    onDrag(e) {
        if (!this.dragState.isDragging) return;
        
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        
        // Move ghost
        const ghost = this.dragState.ghost;
        ghost.style.left = (touch.clientX - 50) + 'px';
        ghost.style.top = (touch.clientY - 65) + 'px';
        
        // Highlight valid cell
        const gridPos = this.screenToGrid(touch.clientX, touch.clientY);
        if (gridPos && gridPos.x < this.arena.playerZoneX) {
            this.highlightCell(gridPos.x, gridPos.z);
            ghost.style.transform = 'scale(1.15) rotate(0deg)';
        } else {
            this.clearHighlight();
            ghost.style.transform = 'scale(1.1) rotate(-5deg)';
        }
    },
    
    endDrag(e) {
        if (!this.dragState.isDragging) return;
        
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const gridPos = this.screenToGrid(touch.clientX, touch.clientY);
        
        // Place unit if valid position
        if (gridPos && gridPos.x < this.arena.playerZoneX) {
            this.placeUnit(this.dragState.unitType, gridPos.x, gridPos.z, 'player');
            if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
        }
        
        // Reset
        this.dragState.isDragging = false;
        this.dragState.ghost.style.opacity = '0';
        this.clearHighlight();
        
        // Remove dragging class from all cards
        document.querySelectorAll('.unit-card').forEach(c => c.classList.remove('dragging'));
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
        if (team === 'player' && this.state.cost < unitDef.cost) {
            this.showMessage('Not enough cost!', 1000);
            return;
        }
        
        // Check if cell is occupied
        const occupied = [...this.state.playerUnits, ...this.state.enemyUnits]
            .some(u => u.gridX === gridX && u.gridZ === gridZ);
        if (occupied) {
            this.showMessage('Cell occupied!', 1000);
            return;
        }
        
        // Deduct cost
        if (team === 'player') {
            this.state.cost -= unitDef.cost;
            this.updateCostUI();
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
        
        // No team tint - use natural sprite colors
        sprite.tint = 0xffffff;
        
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
            damage: unitDef.damage,
            range: unitDef.range,
            sprite,
            isHero: unitDef.isHero || false,
            state: 'idle'
        };
        
        if (team === 'player') {
            this.state.playerUnits.push(unit);
        } else {
            this.state.enemyUnits.push(unit);
        }
        
        console.log(`[Game] Placed ${unitType} at (${gridX}, ${gridZ}) for ${team}`);
    },
    
    generateEnemyUnits() {
        // Generate enemies based on turn
        const turn = this.state.turn;
        const enemyCount = Math.min(1 + Math.floor(turn / 2), 6);
        const types = ['goblin', 'goblinArcher'];
        
        for (let i = 0; i < enemyCount; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            // Spawn on RIGHT side (X: 5-9)
            const x = this.arena.playerZoneX + Math.floor(Math.random() * this.arena.enemyZoneX);
            const z = Math.floor(Math.random() * this.arena.depth);
            
            // Check if cell is occupied
            const occupied = this.state.enemyUnits.some(u => u.gridX === x && u.gridZ === z);
            if (!occupied) {
                this.placeUnit(type, x, z, 'enemy');
            }
        }
    },
    
    // ==================== BATTLE PHASE (Turn-Based) ====================
    // ==================== BATTLE PHASE (Slay the Spire style) ====================
    async startBattlePhase() {
        this.state.phase = 'battle';
        this.updatePhaseUI();
        
        console.log('[Game] Enemy turn - executing intents');
        
        // 1. Player summons attack (if any)
        const summons = this.state.playerUnits.filter(u => u.hp > 0 && !u.isHero && u.damage > 0);
        for (const summon of summons) {
            const target = this.state.enemyUnits.find(e => e.hp > 0);
            if (target) {
                await this.summonAttack(summon, target);
            }
        }
        
        // 2. Enemies execute their intents (attack hero)
        for (const enemy of this.state.enemyUnits) {
            if (enemy.hp <= 0 || !enemy.intent) continue;
            
            await this.executeEnemyIntent(enemy);
            
            // Check if hero died
            if (this.state.hero && this.state.hero.hp <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // 3. Go to next turn
        setTimeout(() => this.nextTurn(), 500);
    },
    
    async summonAttack(summon, target) {
        // Simple attack animation
        if (summon.sprite && target.sprite) {
            const originalX = summon.sprite.x;
            
            await new Promise(resolve => {
                gsap.timeline()
                    .to(summon.sprite, { x: originalX + 20, duration: 0.15 })
                    .call(() => {
                        this.dealDamage(target, summon.damage);
                    })
                    .to(summon.sprite, { x: originalX, duration: 0.2, onComplete: resolve });
            });
        }
    },
    
    async executeEnemyIntent(enemy) {
        const intent = enemy.intent;
        const hero = this.state.hero;
        
        if (!hero || hero.hp <= 0) return;
        
        switch (intent.type) {
            case 'attack':
                // Attack animation
                if (enemy.sprite) {
                    const originalX = enemy.sprite.x;
                    await new Promise(resolve => {
                        gsap.timeline()
                            .to(enemy.sprite, { x: originalX - 30, duration: 0.2 })
                            .call(() => {
                                // Damage goes through block first
                                let damage = intent.damage;
                                if (this.state.heroBlock > 0) {
                                    const blocked = Math.min(this.state.heroBlock, damage);
                                    this.state.heroBlock -= blocked;
                                    damage -= blocked;
                                    if (blocked > 0) {
                                        this.showMessage(`Blocked ${blocked}!`, 500);
                                    }
                                    this.updateBlockUI();
                                }
                                
                                if (damage > 0) {
                                    hero.hp -= damage;
                                    this.showDamage(hero, damage);
                                    
                                    // Hero hit effect
                                    if (hero.sprite) {
                                        gsap.to(hero.sprite, {
                                            alpha: 0.5,
                                            duration: 0.1,
                                            yoyo: true,
                                            repeat: 1
                                        });
                                    }
                                }
                            })
                            .to(enemy.sprite, { x: originalX, duration: 0.2, onComplete: resolve });
                    });
                }
                break;
                
            case 'defend':
                // Enemy gains block (visual only for now)
                this.showMessage(`${enemy.type} defends!`, 500);
                await new Promise(r => setTimeout(r, 300));
                break;
                
            case 'buff':
                // Enemy buffs (increase damage for next turn)
                enemy.damage = Math.floor(enemy.damage * 1.25);
                this.showMessage(`${enemy.type} powers up!`, 500);
                await new Promise(r => setTimeout(r, 300));
                break;
        }
    },
    
    async attackUnit(attacker, target) {
        const damage = attacker.damage;
        
        // Attack animation: lunge toward target
        return new Promise(resolve => {
            const originalX = attacker.sprite?.x || 0;
            const originalY = attacker.sprite?.y || 0;
            const targetX = target.sprite?.x || originalX;
            
            // Lunge animation
            if (attacker.sprite) {
                const lungeX = originalX + (targetX - originalX) * 0.3;
                
                gsap.timeline()
                    .to(attacker.sprite, {
                        x: lungeX,
                        duration: 0.15,
                        ease: 'power2.out'
                    })
                    .call(() => {
                        // Deal damage at peak of lunge
                        target.hp -= damage;
                        this.showDamage(target, damage);
                        
                        // Hit flash on target
                        if (target.sprite) {
                            gsap.to(target.sprite, {
                                alpha: 0.3,
                                duration: 0.08,
                                yoyo: true,
                                repeat: 1
                            });
                        }
                        
                        // Check death
                        if (target.hp <= 0) {
                            this.killUnit(target);
                        }
                    })
                    .to(attacker.sprite, {
                        x: originalX,
                        duration: 0.2,
                        ease: 'power2.in',
                        onComplete: resolve
                    });
            } else {
                target.hp -= damage;
                if (target.hp <= 0) this.killUnit(target);
                resolve();
            }
        });
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
    
    nextTurn() {
        this.state.turn++;
        
        // Increase cost (like Hearthstone mana)
        this.state.cost = Math.min(this.state.turn + 2, this.state.maxCost);
        
        // Clear dead units
        this.state.playerUnits = this.state.playerUnits.filter(u => {
            if (u.hp <= 0 && !u.isHero) {
                if (u.sprite) u.sprite.destroy();
                return false;
            }
            return true;
        });
        
        this.state.enemyUnits = this.state.enemyUnits.filter(u => {
            if (u.hp <= 0) {
                if (u.sprite) u.sprite.destroy();
                return false;
            }
            return true;
        });
        
        // Check victory - all enemies dead
        if (this.state.enemyUnits.length === 0) {
            this.showMessage('VICTORY!', 2000);
            // Generate new wave of enemies for next combat
            setTimeout(() => {
                this.generateEnemyUnits();
                this.startPreparePhase();
            }, 2000);
            return;
        }
        
        // Start prepare phase
        this.startPreparePhase();
        
        console.log(`[Game] Turn ${this.state.turn} started (Cost: ${this.state.cost})`);
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
