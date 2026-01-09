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
        cost: 3,             // Current cost points
        maxCost: 3,          // Fixed max cost (3 per turn)
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
        discard: [],
        exhaust: []  // 소멸된 카드 (전투 끝날 때까지 복귀 안함)
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
            sprite: 'ally_knight.png',
            scale: 0.35
        },
        archer: {
            name: 'Archer',
            cost: 2,
            hp: 25,
            damage: 8,
            range: 4,
            sprite: 'ally_archer.png',
            scale: 0.45  // 30% bigger
        },
        // Enemies
        goblin: {
            name: 'Goblin',
            cost: 0,
            hp: 25,
            damage: 8,
            range: 1,
            sprite: 'goblin.png',
            scale: 0.35,
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
    // aoe: { width: X방향, depth: Z방향 } - 공격 범위 (기본 1x1)
    // 카드 정의는 CardSystem 에서 관리
    // CardSystem.cards 참조
    
    // 헬퍼: 카드 정보 가져오기
    getCard(cardId) {
        if (typeof CardSystem !== 'undefined') {
            return CardSystem.getCard(cardId);
        }
        return null;
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
        
        // Combat Effects
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.init(this.app);
        }
        
        // Knockback System
        if (typeof KnockbackSystem !== 'undefined') {
            KnockbackSystem.init(this);
        }
        
        // Grid AOE System
        if (typeof GridAOE !== 'undefined') {
            GridAOE.init(this, this.app);
        }
        
        // Card System
        if (typeof CardSystem !== 'undefined') {
            CardSystem.init(this);
        }
        
        // Unit Combat System
        if (typeof UnitCombat !== 'undefined') {
            UnitCombat.init(this, this.app);
        }
        
        // Card Drag System
        if (typeof CardDrag !== 'undefined') {
            CardDrag.init(this, this.app);
        }
        
        // Draw grid
        this.drawGrid();
        
        // Setup UI
        this.setupUI();
        
        // Setup card drag (delegates to CardDrag or fallback)
        this.setupUnitPlacement();
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Frame update - keep grid and characters synced with 3D camera
        this.app.ticker.add(() => {
            this.drawGrid();
            this.updateAllUnitPositions();
        });
        
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
        
        // Battle Start effect
        if (typeof TurnEffects !== 'undefined') {
            TurnEffects.showBattleStart('ENEMY FORCES');
            await new Promise(r => setTimeout(r, 1500));
        }
        
        // Start prepare phase
        this.startPreparePhase();
    },
    
    initDeck() {
        // CardSystem을 통해 덱 생성
        if (typeof CardSystem !== 'undefined') {
            this.state.deck = CardSystem.createDeck();
        } else {
            // Fallback
            this.state.deck = ['strike', 'strike', 'defend', 'defend', 'bash'];
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
        if (typeof CardSystem !== 'undefined') {
            CardSystem.drawCards(this.state, count);
        } else {
            // Fallback
            for (let i = 0; i < count; i++) {
                if (this.state.deck.length === 0) {
                    this.state.deck = [...this.state.discard];
                    this.state.discard = [];
                    this.shuffleDeck();
                }
                if (this.state.deck.length > 0) {
                    this.state.hand.push(this.state.deck.pop());
                }
            }
        }
        this.renderHand();
    },
    
    discardHand() {
        if (typeof CardSystem !== 'undefined') {
            CardSystem.discardHand(this.state);
        } else {
            this.state.discard.push(...this.state.hand);
            this.state.hand = [];
        }
        this.renderHand(false);
    },
    
    setupContainers() {
        this.containers.grid = new PIXI.Container();
        this.containers.grid.zIndex = 1;
        this.app.stage.addChild(this.containers.grid);
        
        // 바닥 이펙트 (불길 등) - 유닛보다 아래
        this.containers.ground = new PIXI.Container();
        this.containers.ground.zIndex = 5;
        this.app.stage.addChild(this.containers.ground);
        
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
    
    getCellCenter(gridX, gridZ) {
        // Project the actual center point of the cell (x + 0.5, z + 0.5)
        const centerWorld = DDOOBackground.project3DToScreen(gridX + 0.5, 0, gridZ + 0.5);
        if (!centerWorld) return null;
        
        return {
            x: centerWorld.screenX,
            y: centerWorld.screenY
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
        const currentCost = this.state.cost;
        
        // Update top bar cost orbs
        const topOrbs = document.querySelectorAll('#top-cost-orbs .top-cost-orb');
        topOrbs.forEach((orb, index) => {
            orb.classList.toggle('active', index < currentCost);
        });
        
        // Update bottom panel cost orbs
        const bottomOrbs = document.querySelectorAll('#cost-orbs .cost-orb');
        bottomOrbs.forEach((orb, index) => {
            if (index < currentCost) {
                orb.classList.add('active');
                orb.classList.remove('spent');
            } else {
                orb.classList.remove('active');
                orb.classList.add('spent');
            }
        });
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
        
        // Show turn banner
        if (typeof TurnEffects !== 'undefined') {
            TurnEffects.showPlayerTurn(this.state.turn);
        }
        
        // Process grid AOE effects (damage over time to enemies)
        if (typeof GridAOE !== 'undefined') {
            GridAOE.processTurnStart('enemy');
        }
        
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
        // MonsterPatterns 시스템 사용
        if (typeof MonsterPatterns !== 'undefined') {
            MonsterPatterns.rollAllIntents(this.state.enemyUnits);
        } else {
            // 폴백: 기존 방식
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
        }
        
        this.renderEnemyIntents();
    },
    
    // ==================== PIXI-based Enemy Intents ====================
    renderEnemyIntents() {
        this.state.enemyUnits.forEach(enemy => {
            this.createEnemyIntent(enemy);
        });
    },
    
    createEnemyIntent(enemy) {
        if (!enemy.sprite || !enemy.intent) return;
        
        // Remove existing intent
        if (enemy.intentContainer) {
            enemy.intentContainer.destroy();
        }
        
        const container = new PIXI.Container();
        container.zIndex = 100;
        
        // 브레이크 가능한 인텐트인지 확인
        const hasBreakRecipe = enemy.intent.breakRecipe && enemy.intent.breakRecipe.length > 0;
        const bgWidth = hasBreakRecipe ? 90 : 70;
        const bgHeight = hasBreakRecipe ? 70 : 52;
        
        // Intent background (크게!)
        const bg = new PIXI.Graphics();
        bg.roundRect(-bgWidth/2, -bgHeight + 10, bgWidth, bgHeight, 6);
        bg.fill({ color: 0x0a0806, alpha: 0.95 });
        
        // Border color based on type
        let borderColor = 0x8b2020; // Attack - red
        let textColor = 0xff4444;
        if (enemy.intent.type === 'defend') {
            borderColor = 0x1a4a7a;
            textColor = 0x4488ff;
        } else if (enemy.intent.type === 'buff') {
            borderColor = 0x6a4a0a;
            textColor = 0xffaa44;
        }
        
        // 브레이크 가능하면 금색 테두리 + 글로우
        if (hasBreakRecipe) {
            borderColor = 0xfbbf24;
            // 글로우 효과
            const glow = new PIXI.Graphics();
            glow.roundRect(-bgWidth/2 - 3, -bgHeight + 7, bgWidth + 6, bgHeight + 6, 8);
            glow.fill({ color: 0xfbbf24, alpha: 0.2 });
            container.addChild(glow);
        }
        
        bg.stroke({ color: borderColor, width: 3 });
        container.addChild(bg);
        
        // Icon (큰 아이콘)
        let iconText = '⚔';
        if (enemy.intent.type === 'defend') iconText = '🛡';
        else if (enemy.intent.type === 'buff') iconText = '↑';
        else if (enemy.intent.type === 'debuff') iconText = '↓';
        else if (enemy.intent.type === 'summon') iconText = '👥';
        
        const icon = new PIXI.Text({
            text: iconText,
            style: { fontSize: 26, fill: textColor }
        });
        icon.anchor.set(0.5);
        icon.y = -bgHeight + 30;
        container.addChild(icon);
        
        // Damage value (for attack) - 크게!
        if (enemy.intent.type === 'attack' && enemy.intent.damage) {
            let dmgString = enemy.intent.damage.toString();
            // 다중 공격 표시
            if (enemy.intent.hits && enemy.intent.hits > 1) {
                dmgString = `${enemy.intent.damage}x${enemy.intent.hits}`;
            }
            
            const dmgText = new PIXI.Text({
                text: dmgString,
                style: { 
                    fontSize: 22, 
                    fill: textColor,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 'bold',
                    stroke: { color: '#000000', width: 3 }
                }
            });
            dmgText.anchor.set(0.5);
            dmgText.y = -bgHeight + 55;
            container.addChild(dmgText);
        }
        
        // 브레이크 레시피 표시
        if (hasBreakRecipe) {
            this.renderBreakRecipe(container, enemy, bgHeight);
        }
        
        // Arrow pointing down (크게)
        const arrow = new PIXI.Graphics();
        arrow.moveTo(0, 12);
        arrow.lineTo(-8, 4);
        arrow.lineTo(8, 4);
        arrow.closePath();
        arrow.fill({ color: borderColor });
        container.addChild(arrow);
        
        // Position at top of sprite with margin
        const spriteHeight = enemy.sprite.height || 60;
        const margin = 5;
        container.y = -spriteHeight - margin;
        
        // Add to sprite
        enemy.sprite.sortableChildren = true;
        enemy.sprite.addChild(container);
        enemy.intentContainer = container;
    },
    
    // 브레이크 레시피 렌더링 (크게!)
    renderBreakRecipe(container, enemy, bgHeight = 70) {
        const recipe = enemy.intent.breakRecipe;
        const progress = enemy.breakProgress || [];
        
        const recipeContainer = new PIXI.Container();
        recipeContainer.y = -bgHeight + 78;
        
        const circleSize = 10;
        const spacing = 24;
        const totalWidth = recipe.length * spacing;
        const ElementIcons = {
            physical: '⚔',
            fire: '🔥',
            ice: '❄',
            lightning: '⚡',
            bleed: '🩸',
            poison: '☠',
            magic: '✨',
            dark: '🌑'
        };
        
        recipe.forEach((element, i) => {
            const isCompleted = i < progress.length;
            
            // 원형 배경 (크게)
            const circle = new PIXI.Graphics();
            circle.circle(0, 0, circleSize);
            circle.fill({ color: isCompleted ? 0x22c55e : 0x333333 });
            circle.stroke({ width: 2, color: isCompleted ? 0x22c55e : 0x666666 });
            circle.x = -totalWidth / 2 + i * spacing + spacing / 2;
            recipeContainer.addChild(circle);
            
            // 속성 아이콘 (크게)
            const iconText = new PIXI.Text({
                text: ElementIcons[element] || '?',
                style: { fontSize: 12 }
            });
            iconText.anchor.set(0.5);
            iconText.x = circle.x;
            iconText.y = 0;
            recipeContainer.addChild(iconText);
        });
        
        container.addChild(recipeContainer);
    },
    
    clearEnemyIntents() {
        this.state.enemyUnits.forEach(enemy => {
            if (enemy.intentContainer) {
                enemy.intentContainer.destroy();
                enemy.intentContainer = null;
            }
        });
    },
    
    // ==================== CHARACTER HP BARS ====================
    // ==================== PIXI-based HP Bars ====================
    renderAllHPBars() {
        [...this.state.playerUnits, ...this.state.enemyUnits].forEach(unit => {
            if (unit.hp > 0 && unit.sprite) {
                this.createUnitHPBar(unit);
            }
        });
    },
    
    createUnitHPBar(unit) {
        if (!unit.sprite) return;
        
        // Remove existing HP bar
        if (unit.hpBar) {
            unit.hpBar.destroy();
        }
        
        // Create HP bar container
        const hpBar = new PIXI.Container();
        
        // HP bar dimensions
        const barWidth = 50;
        const barHeight = 6;
        
        // Background
        const bg = new PIXI.Graphics();
        bg.rect(-barWidth/2, 0, barWidth, barHeight);
        bg.fill({ color: 0x111111 });
        bg.stroke({ color: 0x333333, width: 1 });
        hpBar.addChild(bg);
        
        // HP fill
        const hpPercent = Math.max(0, unit.hp / unit.maxHp);
        const fill = new PIXI.Graphics();
        
        // Color based on team
        let fillColor = 0xaa3333; // Enemy - red
        if (unit.isHero) fillColor = 0xc9a227; // Hero - gold
        else if (unit.team === 'player') fillColor = 0x888888; // Summon - gray
        
        fill.rect(-barWidth/2 + 1, 1, (barWidth - 2) * hpPercent, barHeight - 2);
        fill.fill({ color: fillColor });
        hpBar.addChild(fill);
        unit.hpFill = fill;
        unit.hpFillColor = fillColor;
        unit.hpBarWidth = barWidth;
        unit.hpBarHeight = barHeight;
        
        // Position at sprite's feet (bottom) with small margin
        // Sprite anchor is at bottom center (0.5, 1), so y=0 is at feet
        // Add small margin below feet
        const margin = 5;
        hpBar.y = margin;
        hpBar.zIndex = 50;
        
        // Add to sprite (so it moves together, enable sortChildren for zIndex)
        unit.sprite.sortableChildren = true;
        unit.sprite.addChild(hpBar);
        unit.hpBar = hpBar;
    },
    
    updateUnitHPBar(unit) {
        if (!unit.hpBar || !unit.hpFill) {
            this.createUnitHPBar(unit);
            return;
        }
        
        const hpPercent = Math.max(0, unit.hp / unit.maxHp);
        const barWidth = unit.hpBarWidth || 50;
        const barHeight = unit.hpBarHeight || 6;
        
        // Redraw fill
        unit.hpFill.clear();
        unit.hpFill.rect(-barWidth/2 + 1, 1, (barWidth - 2) * hpPercent, barHeight - 2);
        unit.hpFill.fill({ color: unit.hpFillColor || 0xaa3333 });
    },
    
    updateAllHPBars() {
        [...this.state.playerUnits, ...this.state.enemyUnits].forEach(unit => {
            if (unit.hp > 0 && unit.sprite) {
                this.updateUnitHPBar(unit);
            } else if (unit.hpBar) {
                unit.hpBar.destroy();
                unit.hpBar = null;
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
        this.clearEnemyIntents();
        
        console.log('[Game] End turn - starting battle');
        this.startBattlePhase();
    },
    
    renderHand(animate = true) {
        const handEl = document.getElementById('card-hand');
        if (!handEl) return;
        
        handEl.innerHTML = '';
        
        this.state.hand.forEach((cardId, index) => {
            const cardDef = this.getCard(cardId);
            if (!cardDef) return;
            
            // 코스트 부족 체크
            const canAfford = this.state.cost >= cardDef.cost;
            const isExhaust = cardDef.exhaust === true;
            
            const cardEl = document.createElement('div');
            cardEl.className = `card ${cardDef.type}${canAfford ? '' : ' disabled'}${isExhaust ? ' exhaust-card' : ''}`;
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
            
            // Drag to play (only if can afford)
            if (canAfford) {
                cardEl.addEventListener('mousedown', (e) => this.startCardDrag(e, cardEl, cardId, index));
                cardEl.addEventListener('touchstart', (e) => this.startCardDrag(e, cardEl, cardId, index), { passive: false });
            } else {
                // 코스트 부족 시 클릭하면 메시지
                cardEl.addEventListener('click', () => {
                    this.showMessage(`코스트 부족! (${cardDef.cost} 필요)`, 800);
                    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                });
            }
            
            handEl.appendChild(cardEl);
            
            // 딜링 애니메이션
            if (animate) {
                setTimeout(() => {
                    cardEl.classList.add('dealt');
                    // 카드 딜링 사운드 (옵션)
                    if (navigator.vibrate) navigator.vibrate(10);
                }, index * 80); // 카드마다 80ms 간격
            } else {
                cardEl.classList.add('dealt');
            }
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
                // Ranged: Attack from current position (with createZone for fire, etc.)
                await this.heroRangedAnimation(hero, target, cardDef.damage, {
                    createZone: cardDef.createZone || null
                });
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
    
    // ==========================================
    // 이동/공격 함수 - UnitCombat 위임
    // ==========================================
    async moveHeroToLine(targetZ) {
        const hero = this.state.hero;
        if (!hero) return;
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.moveToLine(hero, targetZ, { team: 'player' });
        }
    },
    
    async moveUnitAside(unit, avoidZ) {
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.moveUnitAside(unit, avoidZ, 'player');
        }
    },
    
    async heroAttackAnimation(hero, target, damage, cardType = 'strike', knockback = 0) {
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.meleeAttack(hero, target, damage, {
                effectType: cardType,
                knockback: knockback,
                isEnemy: false
            });
        } else {
            this.dealDamage(target, damage);
        }
    },
    
    async heroRangedAnimation(hero, target, damage, options = {}) {
        console.log('[Game] heroRangedAnimation - options:', options, '| createZone:', options.createZone);
        
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.rangedAttack(hero, target, damage, {
                projectileColor: options.projectileColor || 0xffaa00,
                createZone: options.createZone || null,
                isEnemy: false
            });
        } else {
            this.dealDamage(target, damage);
        }
    },
    
    async heroAoeAnimation(hero, targets, damage) {
        if (!hero.sprite || targets.length === 0) {
            for (const target of targets) {
                await this.dealDamage(target, damage);
            }
            return;
        }
        
        // Use CombatEffects for AOE attack
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.aoeAttackEffect(hero, targets, damage);
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
        const hero = this.state.hero;
        
        if (cardDef.block) {
            this.state.heroBlock += cardDef.block;
            this.updateBlockUI();
            
            // Block effect
            if (typeof CombatEffects !== 'undefined' && hero?.sprite) {
                CombatEffects.gainBlockEffect(hero.sprite.x, hero.sprite.y - 40, cardDef.block);
            } else {
                this.showMessage(`+${cardDef.block} Block`, 500);
            }
        }
        
        if (cardDef.heal && hero) {
            hero.hp = Math.min(hero.hp + cardDef.heal, hero.maxHp);
            this.updateUnitHPBar(hero);
            this.updateHPUI();
            
            // Heal effect
            if (typeof CombatEffects !== 'undefined' && hero.sprite) {
                CombatEffects.healEffect(hero.sprite.x, hero.sprite.y - 40, cardDef.heal);
            } else {
                this.showMessage(`+${cardDef.heal} HP`, 500);
            }
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
    
    // ==========================================
    // 카드 드래그 - CardDrag 모듈로 위임
    // ==========================================
    setupUnitPlacement() {
        // End Turn button (keep in game.js for simplicity)
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => this.endTurn());
        }
    },
    
    startCardDrag(e, cardEl, cardId, handIndex) {
        if (typeof CardDrag !== 'undefined') {
            CardDrag.startCardDrag(e, cardEl, cardId, handIndex);
        }
    },
    
    // Delegates for highlight functions (used by other modules)
    highlightCell(x, z, valid) {
        if (typeof CardDrag !== 'undefined') {
            CardDrag.highlightCell(x, z, valid);
        }
    },
    
    clearHighlight() {
        if (typeof CardDrag !== 'undefined') {
            CardDrag.clearHighlight();
        }
    },
    
    clearEnemyHighlights() {
        if (typeof CardDrag !== 'undefined') {
            CardDrag.clearEnemyHighlights();
        }
    },
    
    clearAllyHighlights() {
        if (typeof CardDrag !== 'undefined') {
            CardDrag.clearAllyHighlights();
        }
    },
    
    getEnemyAtScreen(screenX, screenY, frontOnly = false) {
        if (typeof CardDrag !== 'undefined') {
            return CardDrag.getEnemyAtScreen(screenX, screenY, frontOnly);
        }
        return null;
    },
    
    getFrontlineEnemies() {
        if (typeof CardDrag !== 'undefined') {
            return CardDrag.getFrontlineEnemies();
        }
        return [];
    },
    
    isFrontlineEnemy(enemy) {
        if (typeof CardDrag !== 'undefined') {
            return CardDrag.isFrontlineEnemy(enemy);
        }
        return false;
    },
    
    async executeCardOnTarget(cardId, handIndex, targetEnemy) {
        const cardDef = this.getCard(cardId);
        if (!cardDef || this.state.cost < cardDef.cost) return;
        
        // Deduct cost
        this.state.cost -= cardDef.cost;
        this.state.hand.splice(handIndex, 1);
        
        // Exhaust 카드면 소멸, 아니면 버린 카드 더미로
        if (cardDef.exhaust) {
            this.state.exhaust.push(cardId);
            this.showExhaustEffect(cardDef);
        } else {
            this.state.discard.push(cardId);
        }
        this.updateCostUI();
        
        // For 'all' target cards (like Cleave), attack ALL enemies
        if (cardDef.target === 'all') {
            await this.playAttackCard(cardDef);
        } else {
            // Execute attack on specific target with AOE
            await this.playAttackCardOnTarget(cardDef, targetEnemy);
        }
        
        this.renderHand(false);
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    },
    
    async playAttackCardOnTarget(cardDef, targetEnemy) {
        const hero = this.state.hero;
        if (!hero || !hero.sprite) return;
        
        const isMelee = cardDef.melee === true;
        const aoe = cardDef.aoe || { width: 1, depth: 1 };
        const hits = cardDef.hits || 1; // 다중 공격 횟수
        
        if (isMelee) {
            // Melee: Move hero to same Z line as target, then dash attack
            if (hero.gridZ !== targetEnemy.gridZ) {
                await this.moveHeroToLine(targetEnemy.gridZ);
            }
            
            // Find all enemies in AOE range from target position
            const targetsInAoe = this.getEnemiesInAoe(targetEnemy.gridX, targetEnemy.gridZ, aoe);
            
            // 다중 공격 처리 (flurry 등)
            for (let hitNum = 0; hitNum < hits; hitNum++) {
                if (targetEnemy.hp <= 0) break;
                
                // 브레이크 시스템 연동
                if (typeof BreakSystem !== 'undefined') {
                    const breakResult = BreakSystem.onAttack(targetEnemy, cardDef, 1);
                    if (breakResult.broken) {
                        console.log(`[Game] ${targetEnemy.name || targetEnemy.type} BROKEN!`);
                    }
                }
                
                // Attack animation toward primary target
                const cardType = cardDef.name?.toLowerCase().includes('bash') ? 'bash' : 
                                 cardDef.name?.toLowerCase().includes('flurry') ? 'flurry' : 'strike';
                const knockback = (hitNum === hits - 1) ? (cardDef.knockback || 0) : 0; // 마지막 타격에만 넉백
                
                await this.heroAttackAnimation(hero, targetEnemy, cardDef.damage, cardType, knockback);
                
                // 다중 공격 시 타격 간 짧은 딜레이
                if (hits > 1 && hitNum < hits - 1) {
                    await new Promise(r => setTimeout(r, 100));
                }
            }
            
            // Deal damage to all targets in AOE (except primary which was already hit)
            for (const target of targetsInAoe) {
                if (target !== targetEnemy && target.hp > 0) {
                    this.dealDamage(target, cardDef.damage * hits);
                    // Also knockback AOE targets at same time
                    if (cardDef.knockback && target.hp > 0 && typeof KnockbackSystem !== 'undefined') {
                        KnockbackSystem.knockback(target, 1, cardDef.knockback);
                    }
                }
            }
        } else {
            // Ranged: Attack from current position
            
            // 십자가 패턴 처리 (Fireball 등)
            if (cardDef.aoePattern === 'cross') {
                const crossTargets = this.getEnemiesInCrossAoe(targetEnemy.gridX, targetEnemy.gridZ, 1);
                
                // 파이어볼 발사
                await this.heroRangedAnimation(hero, targetEnemy, cardDef.damage, {
                    createZone: cardDef.createZone || null
                });
                
                // 모든 십자가 영역의 적에게 대미지
                for (const target of crossTargets) {
                    if (target !== targetEnemy && target.hp > 0) {
                        this.dealDamage(target, cardDef.damage);
                        if (typeof CombatEffects !== 'undefined') {
                            CombatEffects.showDamageNumber(target.sprite.x, target.sprite.y - 30, cardDef.damage, 'burn');
                        }
                    }
                }
                
                // 십자가 영역에 불길 생성
                if (cardDef.createZone && typeof GridAOE !== 'undefined') {
                    const cells = this.getCrossAoeCells(targetEnemy.gridX, targetEnemy.gridZ, 1);
                    for (const cell of cells) {
                        GridAOE.createZone(cardDef.createZone, cell.x, cell.z);
                    }
                }
            } else {
                // 일반 원거리 공격
                const targetsInAoe = this.getEnemiesInAoe(targetEnemy.gridX, targetEnemy.gridZ, aoe);
                await this.heroRangedAnimation(hero, targetEnemy, cardDef.damage, {
                    createZone: cardDef.createZone || null
                });
                
                // Deal damage to additional targets in AOE
                for (const target of targetsInAoe) {
                    if (target !== targetEnemy && target.hp > 0) {
                        await this.dealDamage(target, cardDef.damage);
                    }
                }
                
                // Create zone effect for non-cross patterns
                if (cardDef.createZone && typeof GridAOE !== 'undefined') {
                    GridAOE.createZone(cardDef.createZone, targetEnemy.gridX, targetEnemy.gridZ);
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

    // Get enemies within AOE pattern from a center point
    // width = X direction (toward enemy side), depth = Z direction
    getEnemiesInAoe(centerX, centerZ, aoe) {
        const targets = [];
        const halfDepth = Math.floor(aoe.depth / 2);
        
        for (const enemy of this.state.enemyUnits) {
            if (enemy.hp <= 0) continue;
            
            // Check if enemy is within AOE range
            // X: from centerX to centerX + width - 1 (piercing toward enemy side)
            // Z: from centerZ - halfDepth to centerZ + halfDepth
            const inX = enemy.gridX >= centerX && enemy.gridX < centerX + aoe.width;
            const inZ = enemy.gridZ >= centerZ - halfDepth && enemy.gridZ <= centerZ + halfDepth;
            
            if (inX && inZ) {
                targets.push(enemy);
            }
        }
        
        return targets;
    },
    
    // 십자가 형태 AOE - 중심점에서 상하좌우로 퍼짐
    getEnemiesInCrossAoe(centerX, centerZ, range = 1) {
        const targets = [];
        const affectedCells = this.getCrossAoeCells(centerX, centerZ, range);
        
        for (const enemy of this.state.enemyUnits) {
            if (enemy.hp <= 0) continue;
            
            for (const cell of affectedCells) {
                if (enemy.gridX === cell.x && enemy.gridZ === cell.z) {
                    targets.push(enemy);
                    break;
                }
            }
        }
        
        return targets;
    },
    
    // 십자가 형태로 영향받는 셀 목록
    getCrossAoeCells(centerX, centerZ, range = 1) {
        const cells = [{ x: centerX, z: centerZ }]; // 중심
        
        // 상하좌우로 range만큼 확장
        for (let i = 1; i <= range; i++) {
            cells.push({ x: centerX - i, z: centerZ }); // 왼쪽
            cells.push({ x: centerX + i, z: centerZ }); // 오른쪽
            cells.push({ x: centerX, z: centerZ - i }); // 위
            cells.push({ x: centerX, z: centerZ + i }); // 아래
        }
        
        // 그리드 범위 내로 필터링
        return cells.filter(c => c.x >= 0 && c.x < 10 && c.z >= 0 && c.z < 3);
    },
    
    async executeCard(cardId, handIndex) {
        const cardDef = this.getCard(cardId);
        if (!cardDef || this.state.cost < cardDef.cost) return;
        
        // Deduct cost
        this.state.cost -= cardDef.cost;
        this.state.hand.splice(handIndex, 1);
        
        // Exhaust 카드면 소멸, 아니면 버린 카드 더미로
        if (cardDef.exhaust) {
            this.state.exhaust.push(cardId);
            this.showExhaustEffect(cardDef);
        } else {
            this.state.discard.push(cardId);
        }
        this.updateCostUI();
        
        // Execute based on type
        if (cardDef.type === 'attack') {
            await this.playAttackCard(cardDef);
        } else if (cardDef.type === 'skill') {
            await this.playSkillCard(cardDef);
        }
        
        this.renderHand(false);
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    },
    
    showSummonZones() {
        if (typeof CardDrag !== 'undefined') {
            CardDrag.showSummonZones();
        }
    },
    
    hideSummonZones() {
        if (typeof CardDrag !== 'undefined') {
            CardDrag.hideSummonZones();
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
            breathing: { enabled: true, scaleAmount: 0.025, speed: 2.5 }
        });
        
        // Position
        const center = this.getCellCenter(gridX, gridZ);
        if (center) {
            sprite.x = center.x;
            sprite.y = center.y;
            // Units lower on screen (higher Y) should be in front
            sprite.zIndex = Math.floor(center.y);
        }
        
        // No team tint - use natural sprite colors
        sprite.tint = 0xffffff;
        
        this.containers.units.addChild(sprite);
        
        // Summon effect (only for summon cards, not hero or enemies)
        if (team === 'player' && unitType !== 'hero' && typeof CombatEffects !== 'undefined') {
            CombatEffects.summonEffect(sprite.x, sprite.y);
        }
        
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
        this.createUnitHPBar(unit);
        
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
        
        // 1. ALLY PHASE - Player summons attack first (no banner)
        const summons = this.state.playerUnits.filter(u => u.hp > 0 && !u.isHero && u.damage > 0);
        if (summons.length > 0) {
            console.log('[Game] Ally phase - summons attacking');
            
            for (const summon of summons) {
                const target = this.findSummonTarget(summon);
                if (target) {
                    await this.summonAttack(summon, target);
                    await this.resolveAllCollisions();
                }
            }
            
            await new Promise(r => setTimeout(r, 400));
        }
        
        // Check if all enemies dead after ally attacks
        if (this.state.enemyUnits.filter(e => e.hp > 0).length === 0) {
            setTimeout(() => this.nextTurn(), 500);
            return;
        }
        
        // 2. ENEMY PHASE - Show banner then enemies attack
        if (typeof TurnEffects !== 'undefined') {
            TurnEffects.showEnemyTurn('ENEMY PHASE');
            await new Promise(r => setTimeout(r, 1200));
        }
        
        console.log('[Game] Enemy phase - executing intents');
        
        for (const enemy of this.state.enemyUnits) {
            if (enemy.hp <= 0 || !enemy.intent) continue;
            
            await this.executeEnemyIntent(enemy);
            await this.resolveAllCollisions();
            
            // Check if hero died
            if (this.state.hero && this.state.hero.hp <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // Final collision check
        await this.resolveAllCollisions();
        
        // Process grid AOE durations at end of turn
        if (typeof GridAOE !== 'undefined') {
            GridAOE.processTurnEnd();
        }
        
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
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.moveToLine(unit, targetZ, { team: 'player' });
        }
    },
    
    async summonMeleeAttack(summon, target) {
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.meleeAttack(summon, target, summon.damage, {
                effectType: 'summon',
                slashColor: 0x44ff44,
                isEnemy: false
            });
        } else {
            this.dealDamage(target, summon.damage);
        }
    },
    
    async summonRangedAttack(summon, target) {
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.rangedAttack(summon, target, summon.damage, {
                projectileColor: 0x88ff44,
                projectileSize: 8,
                isEnemy: false
            });
        } else {
            this.dealDamage(target, summon.damage);
        }
    },
    
    // Find target for summon attack
    // Rules: 1) Same lane (gridZ) first, 2) Closest X (rightmost = closest to enemy), 3) Adjacent lanes
    findSummonTarget(summon) {
        const allTargets = this.state.enemyUnits.filter(e => e.hp > 0);
        if (allTargets.length === 0) return null;
        
        // Helper: find closest target (highest X = closest to enemy side = rightmost)
        const findClosest = (targets) => {
            if (targets.length === 0) return null;
            return targets.reduce((closest, t) => 
                t.gridX > closest.gridX ? t : closest
            );
        };
        
        // 1. Same lane targets (same gridZ)
        const sameLine = allTargets.filter(t => t.gridZ === summon.gridZ);
        if (sameLine.length > 0) {
            return findClosest(sameLine);
        }
        
        // 2. Adjacent lanes (gridZ +/- 1)
        const adjacent = allTargets.filter(t => Math.abs(t.gridZ - summon.gridZ) === 1);
        if (adjacent.length > 0) {
            return findClosest(adjacent);
        }
        
        // 3. Any target (fallback)
        return findClosest(allTargets);
    },
    
    // Find target for enemy attack
    // Rules: 1) Same line first, 2) Closest X, 3) If no same line, check adjacent lines
    findEnemyTarget(enemy) {
        const allTargets = [this.state.hero, ...this.state.playerUnits]
            .filter(u => u && u.hp > 0 && u !== enemy);
        
        if (allTargets.length === 0) return null;
        
        // Helper: find closest target in a list (lowest X = closest to enemy side)
        const findClosest = (targets) => {
            if (targets.length === 0) return null;
            return targets.reduce((closest, t) => 
                (!closest || t.gridX > closest.gridX) ? t : closest, null);
        };
        
        // 1. Check same line first
        const sameLineTargets = allTargets.filter(t => t.gridZ === enemy.gridZ);
        if (sameLineTargets.length > 0) {
            return findClosest(sameLineTargets);
        }
        
        // 2. Check adjacent lines (above and below)
        const adjacentLines = [enemy.gridZ - 1, enemy.gridZ + 1]
            .filter(z => z >= 0 && z < this.arena.depth);
        
        let closestTarget = null;
        let closestX = -1;
        
        for (const z of adjacentLines) {
            const lineTargets = allTargets.filter(t => t.gridZ === z);
            const closest = findClosest(lineTargets);
            if (closest && closest.gridX > closestX) {
                closestTarget = closest;
                closestX = closest.gridX;
            }
        }
        
        if (closestTarget) return closestTarget;
        
        // 3. Fallback: any target, closest X
        return findClosest(allTargets);
    },
    
    async executeEnemyIntent(enemy) {
        const intent = enemy.intent;
        if (!intent) return;
        
        // 브레이크 상태면 행동 불가
        if (typeof BreakSystem !== 'undefined' && !BreakSystem.canAct(enemy)) {
            console.log(`[Game] ${enemy.name || enemy.type} is BROKEN - skipping action`);
            return;
        }
        
        // Find target using targeting rules
        const target = this.findEnemyTarget(enemy);
        if (!target) return;
        
        // MonsterPatterns가 있으면 위임
        if (typeof MonsterPatterns !== 'undefined') {
            await MonsterPatterns.executeIntent(enemy, target, this);
            return;
        }
        
        // 폴백: 기존 방식
        switch (intent.type) {
            case 'attack':
                const isMelee = (enemy.range || 1) <= 1;
                
                if (isMelee) {
                    // Melee: Move to same line as target, then dash attack
                    if (enemy.gridZ !== target.gridZ) {
                        await this.moveEnemyToLine(enemy, target.gridZ);
                    }
                    await this.enemyMeleeAttack(enemy, target, intent.damage);
                } else {
                    // Ranged: Attack from current position
                    await this.enemyRangedAttack(enemy, target, intent.damage);
                }
                break;
                
            case 'defend':
                // Enemy gains block
                enemy.block = (enemy.block || 0) + (intent.block || 5);
                this.showMessage(`${enemy.name || enemy.type} defends! +${intent.block || 5}`, 500);
                await new Promise(r => setTimeout(r, 300));
                break;
                
            case 'buff':
                // Enemy buffs (increase damage for next turn)
                enemy.damage = Math.floor(enemy.damage * 1.25);
                this.showMessage(`${enemy.name || enemy.type} powers up!`, 500);
                await new Promise(r => setTimeout(r, 300));
                break;
        }
    },
    
    async moveEnemyToLine(enemy, targetZ) {
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.moveToLine(enemy, targetZ, { team: 'enemy' });
        }
    },
    
    async enemyMeleeAttack(enemy, target, intentDamage) {
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.meleeAttack(enemy, target, intentDamage, {
                effectType: 'enemy',
                slashColor: 0xff4444,
                isEnemy: true
            });
        } else {
            this.dealDamageToTarget(target, intentDamage);
        }
    },
    
    async enemyRangedAttack(enemy, target, intentDamage) {
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.rangedAttack(enemy, target, intentDamage, {
                projectileColor: 0xff6600,
                projectileSize: 10,
                isEnemy: true
            });
        } else {
            this.dealDamageToTarget(target, intentDamage);
        }
    },
    
    // Deal damage to any target (hero or summon)
    dealDamageToTarget(target, damage) {
        // If target is hero, check block first
        if (target.isHero && this.state.heroBlock > 0) {
            const blocked = Math.min(this.state.heroBlock, damage);
            this.state.heroBlock -= blocked;
            damage -= blocked;
            if (blocked > 0) {
                this.showMessage(`Blocked ${blocked}!`, 500);
            }
            this.updateBlockUI();
        }
        
        if (damage > 0) {
            target.hp -= damage;
            this.showDamage(target, damage);
            
            // Update HP bar
            this.updateUnitHPBar(target);
            
            // Hit effect
            if (target.sprite) {
                gsap.to(target.sprite, {
                    alpha: 0.5,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                });
            }
            
            // Check if target died
            if (target.hp <= 0) {
                this.killUnit(target);
            }
        }
        
        // Update hero HP UI if hero
        if (target.isHero) {
            this.updateHPUI();
        }
    },
    
    // Legacy function for backward compatibility
    dealDamageToHero(hero, damage) {
        this.dealDamageToTarget(hero, damage);
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
        
        // Remove HP bar (PixiJS - child of sprite, will be destroyed with sprite)
        if (unit.hpBar) {
            unit.hpBar = null;
        }
        
        // Remove intent container (PixiJS - child of sprite)
        if (unit.intentContainer) {
            unit.intentContainer = null;
        }
        
        // Death animation
        if (unit.sprite) {
            gsap.to(unit.sprite, {
                alpha: 0,
                scale: 0.5,
                duration: 0.3,
                onComplete: () => {
                    unit.sprite.destroy({ children: true }); // Destroy children too
                    unit.sprite = null;
                }
            });
        }
        
        // Remove from arrays
        const arr = unit.team === 'player' ? this.state.playerUnits : this.state.enemyUnits;
        const idx = arr.indexOf(unit);
        if (idx >= 0) arr.splice(idx, 1);
        
        // Check for victory (all enemies dead)
        if (unit.team === 'enemy') {
            setTimeout(() => this.checkVictory(), 500);
        }
    },
    
    checkVictory() {
        const aliveEnemies = this.state.enemyUnits.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0) {
            console.log('[Game] Victory!');
            
            if (typeof TurnEffects !== 'undefined') {
                TurnEffects.showVictory(() => {
                    console.log('[Game] Victory animation complete');
                    // Could proceed to next room/rewards here
                });
            } else {
                this.showMessage('VICTORY ACHIEVED', 3000);
            }
        }
    },
    
    updateUnitSprite(unit) {
        if (!unit || !unit.sprite) return;
        const center = this.getCellCenter(unit.gridX, unit.gridZ);
        if (center) {
            unit.sprite.x = center.x;
            unit.sprite.y = center.y;
            // Units lower on screen (higher Y) should be in front
            unit.sprite.zIndex = Math.floor(unit.sprite.y);
        }
    },
    
    updateAllUnitPositions() {
        // Update all unit positions based on current 3D projection
        const allUnits = [...this.state.playerUnits, ...this.state.enemyUnits];
        for (const unit of allUnits) {
            if (unit.hp > 0 && unit.sprite && !unit.isAnimating) {
                this.updateUnitSprite(unit);
            }
        }
    },
    
    nextTurn() {
        this.state.turn++;
        
        // Reset cost to max (fixed 3 per turn)
        this.state.cost = this.state.maxCost;
        
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
        
        // 턴 종료 시 브레이크 상태 해제
        if (typeof BreakSystem !== 'undefined') {
            this.state.enemyUnits.forEach(enemy => {
                BreakSystem.onTurnEnd(enemy);
            });
        }
        
        // Check victory - all enemies dead (handled by checkVictory)
        if (this.state.enemyUnits.length === 0) {
            // Victory already shown by checkVictory, generate new wave
            setTimeout(async () => {
                await this.generateEnemyUnits();
                this.startPreparePhase();
            }, 3500); // Wait for victory animation
            return;
        }
        
        // Start prepare phase
        this.startPreparePhase();
        
        console.log(`[Game] Turn ${this.state.turn} started (Cost: ${this.state.cost})`);
    },
    
    async gameOver() {
        console.log('[Game] Game Over');
        
        // Show YOU DIED effect
        if (typeof TurnEffects !== 'undefined') {
            await TurnEffects.showDefeat();
        } else {
            this.showMessage('YOU DIED', 5000);
        }
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
    
    // ==========================================
    // 카드 소멸 이펙트
    // ==========================================
    showExhaustEffect(cardDef) {
        // 화면 중앙 하단에서 소멸 이펙트
        const x = window.innerWidth / 2;
        const y = window.innerHeight - 200;
        
        // 소멸 텍스트
        const exhaustText = document.createElement('div');
        exhaustText.innerHTML = `
            <div class="exhaust-card-name">${cardDef.name}</div>
            <div class="exhaust-label">EXHAUSTED</div>
        `;
        exhaustText.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%) scale(0);
            z-index: 10001;
            pointer-events: none;
            text-align: center;
        `;
        document.body.appendChild(exhaustText);
        
        // 소멸 파티클 (보라색 + 검은색)
        this.createExhaustParticles(x, y);
        
        // 애니메이션
        if (typeof gsap !== 'undefined') {
            gsap.timeline()
                .to(exhaustText, {
                    scale: 1.2,
                    duration: 0.15,
                    ease: 'back.out(2)'
                })
                .to(exhaustText, {
                    scale: 1,
                    duration: 0.1
                })
                .to(exhaustText, {
                    y: -60,
                    opacity: 0,
                    scale: 0.5,
                    duration: 0.5,
                    delay: 0.4,
                    ease: 'power2.in',
                    onComplete: () => exhaustText.remove()
                });
        } else {
            exhaustText.style.transform = 'translate(-50%, -50%) scale(1)';
            setTimeout(() => exhaustText.remove(), 1000);
        }
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('exhaust', { volume: 0.5 });
        }
    },
    
    // 소멸 파티클
    createExhaustParticles(x, y) {
        const colors = ['#8b5cf6', '#6366f1', '#1e1b4b', '#4c1d95', '#000000'];
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 50;
            const size = 4 + Math.random() * 6;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 0 ${size}px ${colors[0]};
            `;
            document.body.appendChild(particle);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(particle, {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance - 30, // 위로 상승
                    opacity: 0,
                    scale: 0,
                    duration: 0.5 + Math.random() * 0.3,
                    ease: 'power2.out',
                    onComplete: () => particle.remove()
                });
            } else {
                setTimeout(() => particle.remove(), 600);
            }
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
        
        // Note: HP bars and intents are now children of sprites,
        // so they move automatically - no position update needed
    }
};

// Start game
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
