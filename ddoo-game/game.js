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
        // melee: true = 근접 (라인 이동 후 공격), melee: false/없음 = 원거리 (제자리 공격)
        strike: { name: 'Strike', cost: 1, type: 'attack', damage: 6, target: 'enemy', melee: true, desc: 'Deal 6 damage' },
        defend: { name: 'Defend', cost: 1, type: 'skill', block: 5, target: 'self', desc: 'Gain 5 Block' },
        bash: { name: 'Bash', cost: 2, type: 'attack', damage: 8, vulnerable: 2, target: 'enemy', melee: true, desc: 'Deal 8 damage. Apply 2 Vulnerable' },
        cleave: { name: 'Cleave', cost: 1, type: 'attack', damage: 8, target: 'all', melee: true, desc: 'Deal 8 damage to ALL enemies' },
        ironWave: { name: 'Iron Wave', cost: 1, type: 'attack', damage: 5, block: 5, target: 'enemy', melee: true, desc: 'Gain 5 Block. Deal 5 damage' },
        fireBolt: { name: 'Fire Bolt', cost: 1, type: 'attack', damage: 5, target: 'enemy', melee: false, desc: 'Ranged. Deal 5 damage' },
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
        
        // Generate initial enemies (await to ensure enemies exist before rolling intents)
        await this.generateEnemyUnits();
        
        // Start prepare phase
        this.startPreparePhase();
    },
    
    initDeck() {
        // Create deck with multiple copies of each card
        const cardCounts = {
            strike: 3,
            defend: 3,
            bash: 2,
            cleave: 1,
            ironWave: 2,
            fireBolt: 2,  // Ranged attack
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
        this.updateHPUI();
    },
    
    // Convert number to Roman numeral
    toRoman(num) {
        const romanNumerals = [
            ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
        ];
        let result = '';
        for (const [letter, value] of romanNumerals) {
            while (num >= value) {
                result += letter;
                num -= value;
            }
        }
        return result || 'I';
    },
    
    updateTurnUI() {
        const turnEl = document.getElementById('turn-display');
        if (turnEl) {
            turnEl.textContent = this.toRoman(this.state.turn);
        }
        const turnEl2 = document.getElementById('turn-display-2');
        if (turnEl2) {
            turnEl2.textContent = this.state.turn;
        }
    },
    
    updateCostUI() {
        const costEl = document.getElementById('cost-display');
        if (costEl) {
            costEl.textContent = this.state.cost;
        }
    },
    
    updatePhaseUI() {
        const phaseEl = document.getElementById('phase-display');
        if (phaseEl) {
            const phaseNames = {
                prepare: 'PREPARE',
                battle: 'BATTLE',
                result: 'VICTORY'
            };
            phaseEl.textContent = phaseNames[this.state.phase] || this.state.phase;
        }
    },
    
    updateHPUI() {
        const hero = this.state.hero;
        if (!hero) return;
        
        const hpBar = document.getElementById('player-hp-bar');
        const hpText = document.getElementById('player-hp-text');
        
        if (hpBar) {
            const percent = Math.max(0, (hero.hp / hero.maxHp) * 100);
            hpBar.style.width = percent + '%';
        }
        if (hpText) {
            hpText.textContent = `${Math.max(0, hero.hp)}/${hero.maxHp}`;
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
        
        // Render HP bars
        this.renderAllHPBars();
        
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
            intentEl.className = `enemy-intent ${enemy.intent.type}`;
            
            let icon = '';
            let value = '';
            switch (enemy.intent.type) {
                case 'attack':
                    icon = '⚔'; // Crossed swords
                    value = enemy.intent.damage;
                    break;
                case 'defend':
                    icon = '🛡'; // Shield
                    value = '';
                    break;
                case 'buff':
                    icon = '⬆'; // Up arrow
                    value = '';
                    break;
            }
            
            intentEl.innerHTML = `
                <div class="intent-container">
                    <span class="intent-icon">${icon}</span>
                    ${value ? `<span class="intent-value">${value}</span>` : ''}
                </div>
            `;
            
            // Position above enemy sprite
            const rect = document.getElementById('battle-area').getBoundingClientRect();
            const spriteHeight = enemy.sprite.height || 80;
            intentEl.style.left = (enemy.sprite.x + rect.left) + 'px';
            intentEl.style.top = (enemy.sprite.y + rect.top - spriteHeight * 0.5 - 50) + 'px';
            
            document.body.appendChild(intentEl);
        });
    },
    
    // ==================== CHARACTER HP BARS ====================
    renderAllHPBars() {
        // Clear existing HP bars
        document.querySelectorAll('.char-hp-bar').forEach(el => el.remove());
        
        // Render HP bars for all units
        [...this.state.playerUnits, ...this.state.enemyUnits].forEach(unit => {
            if (unit.hp > 0 && unit.sprite) {
                this.renderUnitHPBar(unit);
            }
        });
    },
    
    renderUnitHPBar(unit) {
        if (!unit.sprite) return;
        
        // Remove existing HP bar for this unit
        if (unit.hpBarEl) {
            unit.hpBarEl.remove();
        }
        
        const hpPercent = Math.max(0, (unit.hp / unit.maxHp) * 100);
        const isLow = hpPercent < 30;
        
        let hpClass = 'enemy';
        if (unit.isHero) hpClass = 'player';
        else if (unit.team === 'player') hpClass = 'summon';
        
        const hpBarEl = document.createElement('div');
        hpBarEl.className = `char-hp-bar ${hpClass}${isLow ? ' low' : ''}`;
        hpBarEl.innerHTML = `
            <div class="char-hp-container">
                <div class="char-hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <span class="char-hp-text">${unit.hp}/${unit.maxHp}</span>
        `;
        
        // Position below unit sprite
        const rect = document.getElementById('battle-area').getBoundingClientRect();
        const spriteHeight = unit.sprite.height || 60;
        hpBarEl.style.position = 'absolute';
        hpBarEl.style.left = (unit.sprite.x + rect.left) + 'px';
        hpBarEl.style.top = (unit.sprite.y + rect.top + spriteHeight * 0.3) + 'px';
        hpBarEl.style.zIndex = '500';
        
        document.body.appendChild(hpBarEl);
        unit.hpBarEl = hpBarEl;
    },
    
    updateUnitHPBar(unit) {
        if (!unit.hpBarEl || !unit.sprite) {
            this.renderUnitHPBar(unit);
            return;
        }
        
        const hpPercent = Math.max(0, (unit.hp / unit.maxHp) * 100);
        const isLow = hpPercent < 30;
        
        const fillEl = unit.hpBarEl.querySelector('.char-hp-fill');
        const textEl = unit.hpBarEl.querySelector('.char-hp-text');
        
        if (fillEl) fillEl.style.width = `${hpPercent}%`;
        if (textEl) textEl.textContent = `${Math.max(0, unit.hp)}/${unit.maxHp}`;
        
        unit.hpBarEl.classList.toggle('low', isLow);
        
        // Update position
        const rect = document.getElementById('battle-area').getBoundingClientRect();
        const spriteHeight = unit.sprite.height || 60;
        unit.hpBarEl.style.left = (unit.sprite.x + rect.left) + 'px';
        unit.hpBarEl.style.top = (unit.sprite.y + rect.top + spriteHeight * 0.3) + 'px';
    },
    
    updateAllHPBars() {
        [...this.state.playerUnits, ...this.state.enemyUnits].forEach(unit => {
            if (unit.hp > 0 && unit.sprite) {
                this.updateUnitHPBar(unit);
            } else if (unit.hpBarEl) {
                unit.hpBarEl.remove();
                unit.hpBarEl = null;
            }
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
            cardEl.className = `card ${cardDef.type}`;
            cardEl.dataset.cardId = cardId;
            cardEl.dataset.index = index;
            
            // Type label
            const typeLabels = {
                attack: 'STRIKE',
                skill: 'MIRACLE',
                summon: 'SUMMON'
            };
            
            cardEl.innerHTML = `
                <div class="card-cost">${cardDef.cost}</div>
                <div class="card-name">${cardDef.name}</div>
                <div class="card-type">${typeLabels[cardDef.type] || cardDef.type}</div>
                <div class="card-desc">${cardDef.desc}</div>
            `;
            
            // Drag to play
            cardEl.addEventListener('mousedown', (e) => this.startCardDrag(e, cardEl, cardId, index));
            cardEl.addEventListener('touchstart', (e) => this.startCardDrag(e, cardEl, cardId, index), { passive: false });
            
            handEl.appendChild(cardEl);
        });
    },
    
    async playAttackCard(cardDef) {
        const hero = this.state.hero;
        if (!hero || !hero.sprite) return;
        
        // Find target(s)
        const targets = cardDef.target === 'all' 
            ? this.state.enemyUnits.filter(e => e.hp > 0)
            : [this.state.enemyUnits.find(e => e.hp > 0)].filter(Boolean);
        
        if (targets.length === 0) return;
        
        const isMelee = cardDef.melee === true;
        
        // For single target attacks
        if (cardDef.target === 'enemy' && targets[0]) {
            const target = targets[0];
            
            if (isMelee) {
                // Melee: Move hero to same Z line as target, then dash attack
                if (hero.gridZ !== target.gridZ) {
                    await this.moveHeroToLine(target.gridZ);
                }
                await this.heroAttackAnimation(hero, target, cardDef.damage);
            } else {
                // Ranged: Attack from current position
                await this.heroRangedAnimation(hero, target, cardDef.damage);
            }
        } else if (cardDef.target === 'all') {
            // Cleave - melee AoE
            if (isMelee) {
                // Dash to center and attack all
                await this.heroAoeAnimation(hero, targets, cardDef.damage);
            } else {
                // Ranged AoE
                for (const target of targets) {
                    await this.dealDamage(target, cardDef.damage);
                }
            }
        }
        
        // Apply block if card has it
        if (cardDef.block) {
            this.state.heroBlock += cardDef.block;
            this.updateBlockUI();
            this.showMessage(`+${cardDef.block} Block`, 500);
        }
        
        // Check collisions after attack
        await this.resolveAllCollisions();
    },
    
    async moveHeroToLine(targetZ) {
        const hero = this.state.hero;
        if (!hero || !hero.sprite) return;
        
        // Check if there's a friendly unit at the target position
        const blockingUnit = this.state.playerUnits.find(u => 
            u !== hero && u.hp > 0 && u.gridX === hero.gridX && u.gridZ === targetZ
        );
        
        if (blockingUnit) {
            // Move the blocking unit out of the way
            await this.moveUnitAside(blockingUnit, hero.gridZ);
        }
        
        // Update hero position
        hero.gridZ = targetZ;
        hero.z = targetZ + 0.5;
        
        // Get new screen position
        const newPos = this.getCellCenter(hero.gridX, hero.gridZ);
        if (!newPos) return;
        
        // Animate movement
        return new Promise(resolve => {
            gsap.to(hero.sprite, {
                x: newPos.x,
                y: newPos.y,
                duration: 0.25,
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    async moveUnitAside(unit, avoidZ) {
        if (!unit || !unit.sprite) return;
        
        // Find a free adjacent cell to move to
        const possibleZ = [];
        for (let z = 0; z < this.arena.depth; z++) {
            if (z === avoidZ) continue;
            if (z === unit.gridZ) continue;
            
            // Check if cell is free
            const occupied = this.state.playerUnits.some(u => 
                u !== unit && u.hp > 0 && u.gridX === unit.gridX && u.gridZ === z
            );
            if (!occupied) {
                possibleZ.push(z);
            }
        }
        
        if (possibleZ.length === 0) return; // No free space
        
        // Pick the closest free cell
        possibleZ.sort((a, b) => Math.abs(a - unit.gridZ) - Math.abs(b - unit.gridZ));
        const newZ = possibleZ[0];
        
        // Update unit position
        unit.gridZ = newZ;
        unit.z = newZ + 0.5;
        
        // Get new screen position
        const newPos = this.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) return;
        
        // Animate movement
        return new Promise(resolve => {
            gsap.to(unit.sprite, {
                x: newPos.x,
                y: newPos.y,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    async heroAttackAnimation(hero, target, damage) {
        if (!hero.sprite || !target.sprite) {
            await this.dealDamage(target, damage);
            return;
        }
        
        const originalX = hero.sprite.x;
        const originalY = hero.sprite.y;
        
        // Dash toward enemy
        const dashX = originalX + (target.sprite.x - originalX) * 0.6;
        const dashY = originalY + (target.sprite.y - originalY) * 0.3;
        
        return new Promise(resolve => {
            gsap.timeline()
                // Dash forward
                .to(hero.sprite, {
                    x: dashX,
                    y: dashY,
                    duration: 0.15,
                    ease: 'power2.out'
                })
                // Deal damage at peak
                .call(() => {
                    this.dealDamage(target, damage);
                })
                // Return to position
                .to(hero.sprite, {
                    x: originalX,
                    y: originalY,
                    duration: 0.25,
                    ease: 'power2.inOut',
                    onComplete: resolve
                });
        });
    },
    
    async heroRangedAnimation(hero, target, damage) {
        if (!hero.sprite || !target.sprite) {
            await this.dealDamage(target, damage);
            return;
        }
        
        // Simple ranged attack - slight recoil animation
        const originalX = hero.sprite.x;
        
        return new Promise(resolve => {
            gsap.timeline()
                // Slight backward recoil (casting)
                .to(hero.sprite, {
                    x: originalX - 10,
                    duration: 0.1,
                    ease: 'power2.out'
                })
                // Return and deal damage
                .to(hero.sprite, {
                    x: originalX,
                    duration: 0.1,
                    ease: 'power2.in'
                })
                .call(() => {
                    this.dealDamage(target, damage);
                    // TODO: Add projectile VFX here
                }, null, '-=0.05')
                .call(resolve, null, '+=0.1');
        });
    },
    
    async heroAoeAnimation(hero, targets, damage) {
        if (!hero.sprite || targets.length === 0) {
            for (const target of targets) {
                await this.dealDamage(target, damage);
            }
            return;
        }
        
        const originalX = hero.sprite.x;
        const originalY = hero.sprite.y;
        
        // Calculate center of all targets
        const centerX = targets.reduce((sum, t) => sum + t.sprite.x, 0) / targets.length;
        const centerY = targets.reduce((sum, t) => sum + t.sprite.y, 0) / targets.length;
        
        // Dash to a point between hero and targets
        const dashX = originalX + (centerX - originalX) * 0.4;
        const dashY = originalY + (centerY - originalY) * 0.2;
        
        return new Promise(resolve => {
            gsap.timeline()
                // Dash forward
                .to(hero.sprite, {
                    x: dashX,
                    y: dashY,
                    duration: 0.2,
                    ease: 'power2.out'
                })
                // Deal damage to all targets
                .call(() => {
                    targets.forEach(target => {
                        this.dealDamage(target, damage);
                    });
                })
                // Return to position
                .to(hero.sprite, {
                    x: originalX,
                    y: originalY,
                    duration: 0.3,
                    ease: 'power2.inOut',
                    onComplete: resolve
                });
        });
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
        
        // Update HP bar
        this.updateUnitHPBar(target);
        
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
        // Create drag elements
        this.createDragGhost();
        this.createGridHighlight();
        
        // Global move/end handlers for card dragging
        document.addEventListener('mousemove', (e) => this.onCardDrag(e));
        document.addEventListener('mouseup', (e) => this.endCardDrag(e));
        document.addEventListener('touchmove', (e) => this.onCardDrag(e), { passive: false });
        document.addEventListener('touchend', (e) => this.endCardDrag(e));
        
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
            transform: scale(1.1) rotate(-3deg);
            transition: transform 0.1s ease-out;
        `;
        document.body.appendChild(ghost);
        this.dragState.ghost = ghost;
    },
    
    createGridHighlight() {
        // PixiJS grid highlight graphics
        this.gridHighlight = new PIXI.Graphics();
        this.gridHighlight.zIndex = 5;
        this.containers.grid.addChild(this.gridHighlight);
    },
    
    startCardDrag(e, cardEl, cardId, handIndex) {
        if (this.state.phase !== 'prepare') return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const cardDef = this.cards[cardId];
        if (!cardDef) return;
        
        // Check if this is a summon card
        const isSummon = cardDef.type === 'summon';
        
        const touch = e.touches ? e.touches[0] : e;
        
        this.dragState.isDragging = true;
        this.dragState.cardId = cardId;
        this.dragState.handIndex = handIndex;
        this.dragState.isSummon = isSummon;
        this.dragState.startX = touch.clientX;
        this.dragState.startY = touch.clientY;
        this.dragState.cardEl = cardEl;
        
        // Create ghost
        const ghost = this.dragState.ghost;
        ghost.innerHTML = `
            <div class="card drag-card" style="margin:0; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                <div class="card-cost">${cardDef.cost}</div>
                <div class="card-name">${cardDef.name}</div>
                <div class="card-desc">${cardDef.desc}</div>
            </div>
        `;
        ghost.style.left = (touch.clientX - 45) + 'px';
        ghost.style.top = (touch.clientY - 60) + 'px';
        ghost.style.opacity = '1';
        ghost.style.transform = 'scale(1.15) rotate(-3deg)';
        
        cardEl.style.opacity = '0.3';
        cardEl.style.transform = 'scale(0.9)';
        
        // Vibrate
        if (navigator.vibrate) navigator.vibrate(20);
        
        // Show grid highlight for summons
        if (isSummon) {
            this.showSummonZones();
        }
    },
    
    onCardDrag(e) {
        if (!this.dragState.isDragging) return;
        
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        
        // Move ghost smoothly
        const ghost = this.dragState.ghost;
        ghost.style.left = (touch.clientX - 45) + 'px';
        ghost.style.top = (touch.clientY - 60) + 'px';
        
        const cardDef = this.cards[this.dragState.cardId];
        
        if (this.dragState.isSummon) {
            // Check grid position for summons
            const gridPos = this.screenToGrid(touch.clientX, touch.clientY);
            const isValid = gridPos && gridPos.x < this.arena.playerZoneX && !this.isCellOccupied(gridPos.x, gridPos.z);
            
            if (isValid) {
                this.highlightCell(gridPos.x, gridPos.z, true);
                ghost.style.transform = 'scale(1.2) rotate(0deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#44ff44';
            } else {
                this.highlightCell(-1, -1, false);
                ghost.style.transform = 'scale(1.15) rotate(-3deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#666';
            }
            this.clearEnemyHighlights();
        } else if (cardDef && cardDef.type === 'attack') {
            // Attack cards - check if hovering over enemy
            const targetEnemy = this.getEnemyAtScreen(touch.clientX, touch.clientY);
            this.dragState.targetEnemy = targetEnemy;
            
            if (targetEnemy) {
                // Hovering over enemy - highlight them
                this.highlightEnemy(targetEnemy, true);
                ghost.style.transform = 'scale(1.2) rotate(0deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#ff4444';
            } else {
                // Check if dragged up (to play on first enemy)
                const dragDist = this.dragState.startY - touch.clientY;
                this.clearEnemyHighlights();
                if (dragDist > 100) {
                    ghost.style.transform = 'scale(1.2) rotate(0deg)';
                    ghost.querySelector('.drag-card').style.borderColor = '#44ff44';
                } else {
                    ghost.style.transform = 'scale(1.15) rotate(-3deg)';
                    ghost.querySelector('.drag-card').style.borderColor = '#666';
                }
            }
        } else {
            // Skill cards - check if dragged up
            const dragDist = this.dragState.startY - touch.clientY;
            if (dragDist > 100) {
                ghost.style.transform = 'scale(1.2) rotate(0deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#44ff44';
            } else {
                ghost.style.transform = 'scale(1.15) rotate(-3deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#666';
            }
        }
    },
    
    getEnemyAtScreen(screenX, screenY) {
        // Get canvas bounds
        const canvas = this.app.canvas;
        const rect = canvas.getBoundingClientRect();
        const localX = screenX - rect.left;
        const localY = screenY - rect.top;
        
        // Check each enemy sprite
        for (const enemy of this.state.enemyUnits) {
            if (enemy.hp <= 0 || !enemy.sprite) continue;
            
            const sprite = enemy.sprite;
            const bounds = sprite.getBounds();
            
            // Expand hitbox for easier targeting
            const padding = 30;
            if (localX >= bounds.x - padding && 
                localX <= bounds.x + bounds.width + padding &&
                localY >= bounds.y - padding && 
                localY <= bounds.y + bounds.height + padding) {
                return enemy;
            }
        }
        return null;
    },
    
    highlightEnemy(enemy, highlight) {
        this.clearEnemyHighlights();
        if (highlight && enemy && enemy.sprite) {
            enemy.sprite.tint = 0xff6666;
            this._highlightedEnemy = enemy;
        }
    },
    
    clearEnemyHighlights() {
        if (this._highlightedEnemy && this._highlightedEnemy.sprite) {
            this._highlightedEnemy.sprite.tint = 0xffffff;
        }
        this._highlightedEnemy = null;
        
        // Clear all enemy tints
        for (const enemy of this.state.enemyUnits) {
            if (enemy.sprite) enemy.sprite.tint = 0xffffff;
        }
    },
    
    endCardDrag(e) {
        if (!this.dragState.isDragging) return;
        
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const cardId = this.dragState.cardId;
        const handIndex = this.dragState.handIndex;
        const cardDef = this.cards[cardId];
        
        let success = false;
        
        if (this.dragState.isSummon) {
            // Summon card - check grid position
            const gridPos = this.screenToGrid(touch.clientX, touch.clientY);
            const isValid = gridPos && gridPos.x < this.arena.playerZoneX && !this.isCellOccupied(gridPos.x, gridPos.z);
            
            if (isValid && this.state.cost >= cardDef.cost) {
                // Place summon
                this.placeUnit(cardDef.unit, gridPos.x, gridPos.z, 'player');
                this.state.cost -= cardDef.cost;
                this.state.hand.splice(handIndex, 1);
                this.state.discard.push(cardId);
                this.updateCostUI();
                success = true;
                if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
            }
        } else if (cardDef && cardDef.type === 'attack') {
            // Attack card - check if dropped on enemy OR dragged up
            const targetEnemy = this.dragState.targetEnemy || this.getEnemyAtScreen(touch.clientX, touch.clientY);
            const dragDist = this.dragState.startY - touch.clientY;
            
            if (this.state.cost >= cardDef.cost) {
                if (targetEnemy) {
                    // Dropped on specific enemy
                    this.executeCardOnTarget(cardId, handIndex, targetEnemy);
                    success = true;
                } else if (dragDist > 100) {
                    // Dragged up - auto-target first enemy
                    this.executeCard(cardId, handIndex);
                    success = true;
                }
            }
        } else {
            // Skill card - check if dragged up
            const dragDist = this.dragState.startY - touch.clientY;
            if (dragDist > 100 && this.state.cost >= cardDef.cost) {
                // Play the card
                this.executeCard(cardId, handIndex);
                success = true;
            }
        }
        
        // Reset visual state
        this.dragState.isDragging = false;
        this.dragState.ghost.style.opacity = '0';
        this.dragState.targetEnemy = null;
        this.clearHighlight();
        this.clearEnemyHighlights();
        this.hideSummonZones();
        
        if (this.dragState.cardEl) {
            this.dragState.cardEl.style.opacity = '1';
            this.dragState.cardEl.style.transform = '';
        }
        
        // Re-render hand
        if (success) {
            this.renderHand();
        }
    },
    
    async executeCardOnTarget(cardId, handIndex, targetEnemy) {
        const cardDef = this.cards[cardId];
        if (!cardDef || this.state.cost < cardDef.cost) return;
        
        // Deduct cost
        this.state.cost -= cardDef.cost;
        this.state.hand.splice(handIndex, 1);
        this.state.discard.push(cardId);
        this.updateCostUI();
        
        // Execute attack on specific target
        await this.playAttackCardOnTarget(cardDef, targetEnemy);
        
        this.renderHand();
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    },
    
    async playAttackCardOnTarget(cardDef, targetEnemy) {
        const hero = this.state.hero;
        if (!hero || !hero.sprite) return;
        
        const isMelee = cardDef.melee === true;
        
        if (isMelee) {
            // Melee: Move hero to same Z line as target, then dash attack
            if (hero.gridZ !== targetEnemy.gridZ) {
                await this.moveHeroToLine(targetEnemy.gridZ);
            }
            await this.heroAttackAnimation(hero, targetEnemy, cardDef.damage);
        } else {
            // Ranged: Attack from current position
            await this.heroRangedAnimation(hero, targetEnemy, cardDef.damage);
        }
        
        // Apply block if card has it
        if (cardDef.block) {
            this.state.heroBlock += cardDef.block;
            this.updateBlockUI();
            this.showMessage(`+${cardDef.block} Block`, 500);
        }
        
        // Check collisions after attack
        await this.resolveAllCollisions();
    },
    
    async executeCard(cardId, handIndex) {
        const cardDef = this.cards[cardId];
        if (!cardDef || this.state.cost < cardDef.cost) return;
        
        // Deduct cost
        this.state.cost -= cardDef.cost;
        this.state.hand.splice(handIndex, 1);
        this.state.discard.push(cardId);
        this.updateCostUI();
        
        // Execute based on type
        if (cardDef.type === 'attack') {
            await this.playAttackCard(cardDef);
        } else if (cardDef.type === 'skill') {
            await this.playSkillCard(cardDef);
        }
        
        this.renderHand();
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    },
    
    showSummonZones() {
        const graphics = this.gridHighlight;
        graphics.clear();
        
        // Highlight all valid player zone cells
        for (let x = 0; x < this.arena.playerZoneX; x++) {
            for (let z = 0; z < this.arena.depth; z++) {
                if (this.isCellOccupied(x, z)) continue;
                
                const corners = this.getCellCorners(x, z);
                if (!corners) continue;
                
                graphics.moveTo(corners[0].x, corners[0].y);
                graphics.lineTo(corners[1].x, corners[1].y);
                graphics.lineTo(corners[2].x, corners[2].y);
                graphics.lineTo(corners[3].x, corners[3].y);
                graphics.closePath();
                graphics.fill({ color: 0x44ff44, alpha: 0.15 });
                graphics.stroke({ color: 0x44ff44, width: 2, alpha: 0.5 });
            }
        }
    },
    
    hideSummonZones() {
        if (this.gridHighlight) {
            this.gridHighlight.clear();
        }
    },
    
    isCellOccupied(x, z) {
        return [...this.state.playerUnits, ...this.state.enemyUnits]
            .some(u => u.gridX === x && u.gridZ === z && u.hp > 0);
    },
    
    // ==================== GLOBAL COLLISION CHECK ====================
    async resolveAllCollisions() {
        const allUnits = [...this.state.playerUnits, ...this.state.enemyUnits].filter(u => u.hp > 0);
        
        // Group units by cell
        const cellMap = new Map();
        for (const unit of allUnits) {
            const key = `${unit.gridX},${unit.gridZ}`;
            if (!cellMap.has(key)) {
                cellMap.set(key, []);
            }
            cellMap.get(key).push(unit);
        }
        
        // Resolve collisions where multiple units share a cell
        for (const [key, units] of cellMap) {
            if (units.length <= 1) continue;
            
            console.log(`[Collision] ${units.length} units at ${key}`);
            
            // Keep the first unit (or hero), move others
            const sorted = units.sort((a, b) => {
                // Hero has highest priority
                if (a.isHero) return -1;
                if (b.isHero) return 1;
                // Then by team (player > enemy)
                if (a.team === 'player' && b.team === 'enemy') return -1;
                if (a.team === 'enemy' && b.team === 'player') return 1;
                return 0;
            });
            
            const stayUnit = sorted[0];
            const moveUnits = sorted.slice(1);
            
            for (const unit of moveUnits) {
                await this.relocateUnit(unit, stayUnit.gridX, stayUnit.gridZ);
            }
        }
    },
    
    async relocateUnit(unit, avoidX, avoidZ) {
        if (!unit || !unit.sprite) return;
        
        // Find the nearest free cell
        const isPlayerSide = unit.team === 'player';
        const minX = isPlayerSide ? 0 : this.arena.playerZoneX;
        const maxX = isPlayerSide ? this.arena.playerZoneX : this.arena.width;
        
        let bestCell = null;
        let bestDist = Infinity;
        
        for (let x = minX; x < maxX; x++) {
            for (let z = 0; z < this.arena.depth; z++) {
                if (x === avoidX && z === avoidZ) continue;
                if (this.isCellOccupied(x, z)) continue;
                
                const dist = Math.abs(x - unit.gridX) + Math.abs(z - unit.gridZ);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestCell = { x, z };
                }
            }
        }
        
        if (!bestCell) {
            console.log(`[Collision] No free cell found for ${unit.type}`);
            return;
        }
        
        console.log(`[Collision] Moving ${unit.type} from (${unit.gridX},${unit.gridZ}) to (${bestCell.x},${bestCell.z})`);
        
        // Update position
        unit.gridX = bestCell.x;
        unit.gridZ = bestCell.z;
        unit.x = bestCell.x + 0.5;
        unit.z = bestCell.z + 0.5;
        
        // Animate
        const newPos = this.getCellCenter(unit.gridX, unit.gridZ);
        if (newPos) {
            return new Promise(resolve => {
                gsap.to(unit.sprite, {
                    x: newPos.x,
                    y: newPos.y,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: resolve
                });
            });
        }
    },
    
    // Quick check and fix collisions (call after any movement)
    checkAndFixCollisions() {
        const allUnits = [...this.state.playerUnits, ...this.state.enemyUnits].filter(u => u.hp > 0);
        
        for (let i = 0; i < allUnits.length; i++) {
            for (let j = i + 1; j < allUnits.length; j++) {
                const a = allUnits[i];
                const b = allUnits[j];
                
                if (a.gridX === b.gridX && a.gridZ === b.gridZ) {
                    // Collision detected - queue resolution
                    this.resolveAllCollisions();
                    return true;
                }
            }
        }
        return false;
    },
    
    highlightCell(x, z, valid) {
        const graphics = this.gridHighlight;
        graphics.clear();
        
        if (x < 0) return;
        
        // Re-draw summon zones
        this.showSummonZones();
        
        // Highlight specific cell
        const corners = this.getCellCorners(x, z);
        if (!corners) return;
        
        const color = valid ? 0x44ff44 : 0xff4444;
        
        graphics.moveTo(corners[0].x, corners[0].y);
        graphics.lineTo(corners[1].x, corners[1].y);
        graphics.lineTo(corners[2].x, corners[2].y);
        graphics.lineTo(corners[3].x, corners[3].y);
        graphics.closePath();
        graphics.fill({ color: color, alpha: 0.4 });
        graphics.stroke({ color: color, width: 3, alpha: 1 });
    },
    
    clearHighlight() {
        if (this.gridHighlight) {
            this.gridHighlight.clear();
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
        
        // Render HP bar
        this.renderUnitHPBar(unit);
        
        console.log(`[Game] Placed ${unitType} at (${gridX}, ${gridZ}) for ${team}`);
    },
    
    async generateEnemyUnits() {
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
                await this.placeUnit(type, x, z, 'enemy');
            }
        }
        
        console.log(`[Game] Generated ${this.state.enemyUnits.length} enemies`);
    },
    
    // ==================== BATTLE PHASE (Turn-Based) ====================
    // ==================== BATTLE PHASE (Slay the Spire style) ====================
    async startBattlePhase() {
        this.state.phase = 'battle';
        this.updatePhaseUI();
        
        // Resolve any collisions before battle
        await this.resolveAllCollisions();
        
        console.log('[Game] Enemy turn - executing intents');
        
        // 1. Player summons attack (if any)
        const summons = this.state.playerUnits.filter(u => u.hp > 0 && !u.isHero && u.damage > 0);
        for (const summon of summons) {
            const target = this.state.enemyUnits.find(e => e.hp > 0);
            if (target) {
                await this.summonAttack(summon, target);
                await this.resolveAllCollisions(); // Check after each attack
            }
        }
        
        // 2. Enemies execute their intents (attack hero)
        for (const enemy of this.state.enemyUnits) {
            if (enemy.hp <= 0 || !enemy.intent) continue;
            
            await this.executeEnemyIntent(enemy);
            await this.resolveAllCollisions(); // Check after each enemy action
            
            // Check if hero died
            if (this.state.hero && this.state.hero.hp <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // Final collision check
        await this.resolveAllCollisions();
        
        // 3. Go to next turn
        setTimeout(() => this.nextTurn(), 500);
    },
    
    async summonAttack(summon, target) {
        if (!summon.sprite || !target.sprite) {
            this.dealDamage(target, summon.damage);
            return;
        }
        
        const isMelee = (summon.range || 1) <= 1;
        
        if (isMelee) {
            // Melee: Move to same line as target, then dash attack
            if (summon.gridZ !== target.gridZ) {
                await this.moveSummonToLine(summon, target.gridZ);
            }
            await this.summonMeleeAttack(summon, target);
        } else {
            // Ranged: Attack from current position
            await this.summonRangedAttack(summon, target);
        }
    },
    
    async moveSummonToLine(unit, targetZ) {
        if (!unit || !unit.sprite) return;
        
        // Check if there's a friendly unit at the target position
        const blockingUnit = this.state.playerUnits.find(u => 
            u !== unit && !u.isHero && u.hp > 0 && u.gridX === unit.gridX && u.gridZ === targetZ
        );
        
        if (blockingUnit) {
            await this.moveUnitAside(blockingUnit, targetZ);
        }
        
        // Update unit position
        unit.gridZ = targetZ;
        unit.z = targetZ + 0.5;
        
        // Get new screen position
        const newPos = this.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) return;
        
        // Animate movement
        return new Promise(resolve => {
            gsap.to(unit.sprite, {
                x: newPos.x,
                y: newPos.y,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    async summonMeleeAttack(summon, target) {
        const originalX = summon.sprite.x;
        const originalY = summon.sprite.y;
        
        // Dash toward enemy
        const dashX = originalX + (target.sprite.x - originalX) * 0.5;
        const dashY = originalY + (target.sprite.y - originalY) * 0.2;
        
        return new Promise(resolve => {
            gsap.timeline()
                // Dash forward
                .to(summon.sprite, {
                    x: dashX,
                    y: dashY,
                    duration: 0.12,
                    ease: 'power2.out'
                })
                // Deal damage at peak
                .call(() => {
                    this.dealDamage(target, summon.damage);
                })
                // Return to position
                .to(summon.sprite, {
                    x: originalX,
                    y: originalY,
                    duration: 0.2,
                    ease: 'power2.inOut',
                    onComplete: resolve
                });
        });
    },
    
    async summonRangedAttack(summon, target) {
        const originalX = summon.sprite.x;
        
        return new Promise(resolve => {
            gsap.timeline()
                // Slight backward recoil (shooting)
                .to(summon.sprite, {
                    x: originalX - 8,
                    duration: 0.08,
                    ease: 'power2.out'
                })
                // Return and deal damage
                .to(summon.sprite, {
                    x: originalX,
                    duration: 0.08,
                    ease: 'power2.in'
                })
                .call(() => {
                    this.dealDamage(target, summon.damage);
                }, null, '-=0.04')
                .call(resolve, null, '+=0.1');
        });
    },
    
    async executeEnemyIntent(enemy) {
        const intent = enemy.intent;
        const hero = this.state.hero;
        
        if (!hero || hero.hp <= 0) return;
        
        switch (intent.type) {
            case 'attack':
                const isMelee = (enemy.range || 1) <= 1;
                
                if (isMelee) {
                    // Melee: Move to same line as hero, then dash attack
                    if (enemy.gridZ !== hero.gridZ) {
                        await this.moveEnemyToLine(enemy, hero.gridZ);
                    }
                    await this.enemyMeleeAttack(enemy, hero, intent.damage);
                } else {
                    // Ranged: Attack from current position
                    await this.enemyRangedAttack(enemy, hero, intent.damage);
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
    
    async moveEnemyToLine(enemy, targetZ) {
        if (!enemy || !enemy.sprite) return;
        
        // Check if there's another enemy at the target position
        const blockingEnemy = this.state.enemyUnits.find(u => 
            u !== enemy && u.hp > 0 && u.gridX === enemy.gridX && u.gridZ === targetZ
        );
        
        if (blockingEnemy) {
            // Find alternative Z position
            for (let z = 0; z < this.arena.depth; z++) {
                if (z === targetZ) continue;
                const occupied = this.state.enemyUnits.some(u => 
                    u !== blockingEnemy && u.hp > 0 && u.gridX === blockingEnemy.gridX && u.gridZ === z
                );
                if (!occupied) {
                    blockingEnemy.gridZ = z;
                    blockingEnemy.z = z + 0.5;
                    const newPos = this.getCellCenter(blockingEnemy.gridX, blockingEnemy.gridZ);
                    if (newPos) {
                        gsap.to(blockingEnemy.sprite, {
                            x: newPos.x,
                            y: newPos.y,
                            duration: 0.15
                        });
                    }
                    break;
                }
            }
        }
        
        // Update enemy position
        enemy.gridZ = targetZ;
        enemy.z = targetZ + 0.5;
        
        const newPos = this.getCellCenter(enemy.gridX, enemy.gridZ);
        if (!newPos) return;
        
        return new Promise(resolve => {
            gsap.to(enemy.sprite, {
                x: newPos.x,
                y: newPos.y,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    async enemyMeleeAttack(enemy, target, intentDamage) {
        if (!enemy.sprite || !target.sprite) {
            this.dealDamageToHero(target, intentDamage);
            return;
        }
        
        const originalX = enemy.sprite.x;
        const originalY = enemy.sprite.y;
        
        // Dash toward hero
        const dashX = originalX + (target.sprite.x - originalX) * 0.5;
        const dashY = originalY + (target.sprite.y - originalY) * 0.2;
        
        return new Promise(resolve => {
            gsap.timeline()
                .to(enemy.sprite, {
                    x: dashX,
                    y: dashY,
                    duration: 0.15,
                    ease: 'power2.out'
                })
                .call(() => {
                    this.dealDamageToHero(target, intentDamage);
                })
                .to(enemy.sprite, {
                    x: originalX,
                    y: originalY,
                    duration: 0.2,
                    ease: 'power2.inOut',
                    onComplete: resolve
                });
        });
    },
    
    async enemyRangedAttack(enemy, target, intentDamage) {
        if (!enemy.sprite) {
            this.dealDamageToHero(target, intentDamage);
            return;
        }
        
        const originalX = enemy.sprite.x;
        
        return new Promise(resolve => {
            gsap.timeline()
                .to(enemy.sprite, {
                    x: originalX + 8,
                    duration: 0.08,
                    ease: 'power2.out'
                })
                .to(enemy.sprite, {
                    x: originalX,
                    duration: 0.08,
                    ease: 'power2.in'
                })
                .call(() => {
                    this.dealDamageToHero(target, intentDamage);
                }, null, '-=0.04')
                .call(resolve, null, '+=0.1');
        });
    },
    
    dealDamageToHero(hero, damage) {
        // Damage goes through block first
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
            
            // Update HP bar
            this.updateUnitHPBar(hero);
            
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
        
        this.updateHPUI();
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
        
        // Remove HP bar
        if (unit.hpBarEl) {
            unit.hpBarEl.remove();
            unit.hpBarEl = null;
        }
        
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
            setTimeout(async () => {
                await this.generateEnemyUnits();
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
        
        // Update UI positions
        this.updateAllHPBars();
        this.renderEnemyIntents();
    }
};

// Start game
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
