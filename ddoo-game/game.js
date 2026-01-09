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
        
        // Break System
        if (typeof BreakSystem !== 'undefined') {
            BreakSystem.init(this);
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
        
        // ========================================
        // ★ 컴팩트 1열 인텐트 UI (다크소울 스타일)
        // ========================================
        const intent = enemy.intent;
        const hasBreakRecipe = intent.breakRecipe && intent.breakRecipe.length > 0;
        
        // 색상 팔레트
        const COLORS = {
            attack: { primary: 0xc41e3a, glow: 0x8b0000, icon: '⚔' },
            defend: { primary: 0x2563eb, glow: 0x1e3a8a, icon: '🛡' },
            buff: { primary: 0xd97706, glow: 0x92400e, icon: '⬆' },
            debuff: { primary: 0x7c3aed, glow: 0x4c1d95, icon: '⬇' },
            summon: { primary: 0x059669, glow: 0x064e3b, icon: '👥' }
        };
        
        const colors = COLORS[intent.type] || COLORS.attack;
        
        // ★ 1열 컴팩트 디자인: [아이콘] [데미지] + 강공격 시 [!]
        const iconSize = 28;
        const dmgBoxWidth = intent.damage ? 36 : 0;
        const warningWidth = hasBreakRecipe ? 20 : 0;
        const frameWidth = iconSize + dmgBoxWidth + warningWidth + 12;
        const frameHeight = 32;
        
        // ========================================
        // ★ 브레이크 레시피: 강력한 공격 준비 연출
        // ========================================
        if (hasBreakRecipe) {
            // 외부 위험 글로우
            const dangerGlow = new PIXI.Graphics();
            dangerGlow.roundRect(-frameWidth/2 - 6, -frameHeight - 6, frameWidth + 12, frameHeight + 12, 6);
            dangerGlow.fill({ color: 0xff0000, alpha: 0.3 });
            container.addChild(dangerGlow);
            
            // 펄스 애니메이션
            if (typeof gsap !== 'undefined') {
                gsap.to(dangerGlow, {
                    alpha: 0.1,
                    duration: 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
            }
        }
        
        // 메인 배경
        const bg = new PIXI.Graphics();
        bg.roundRect(-frameWidth/2, -frameHeight, frameWidth, frameHeight, 4);
        bg.fill({ color: hasBreakRecipe ? 0x1a0808 : 0x0c0a08, alpha: 0.95 });
        bg.stroke({ color: 0x1a1612, width: 2 });
        bg.roundRect(-frameWidth/2 + 1, -frameHeight + 1, frameWidth - 2, frameHeight - 2, 3);
        bg.stroke({ color: hasBreakRecipe ? 0xff4444 : colors.primary, width: hasBreakRecipe ? 2 : 1.5 });
        container.addChild(bg);
        
        // ★ 가로 배치 시작 위치
        let xOffset = -frameWidth/2 + 6;
        
        // ========================================
        // 아이콘 (다이아몬드)
        // ========================================
        const iconBg = new PIXI.Graphics();
        const iconCenterX = xOffset + iconSize/2;
        const iconCenterY = -frameHeight/2;
        iconBg.moveTo(iconCenterX, iconCenterY - 10);
        iconBg.lineTo(iconCenterX + 10, iconCenterY);
        iconBg.lineTo(iconCenterX, iconCenterY + 10);
        iconBg.lineTo(iconCenterX - 10, iconCenterY);
        iconBg.closePath();
        iconBg.fill({ color: colors.glow, alpha: 0.8 });
        iconBg.stroke({ color: colors.primary, width: 1 });
        container.addChild(iconBg);
        
        const icon = new PIXI.Text({ text: colors.icon, style: { fontSize: 14 } });
        icon.anchor.set(0.5);
        icon.x = iconCenterX;
        icon.y = iconCenterY;
        container.addChild(icon);
        
        xOffset += iconSize + 4;
        
        // ========================================
        // 데미지 숫자 (공격 타입)
        // ========================================
        if (intent.type === 'attack' && intent.damage) {
            let dmgString = intent.damage.toString();
            if (intent.hits && intent.hits > 1) {
                dmgString = `${intent.damage}×${intent.hits}`;
            }
            
            const dmgText = new PIXI.Text({
                text: dmgString,
                style: { 
                    fontSize: 16, 
                    fill: '#ffffff',
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 'bold'
                }
            });
            dmgText.anchor.set(0, 0.5);
            dmgText.x = xOffset;
            dmgText.y = -frameHeight/2;
            container.addChild(dmgText);
            
            xOffset += dmgBoxWidth;
        }
        
        // ========================================
        // 방어/버프 표시
        // ========================================
        if (intent.type === 'defend' || intent.type === 'buff') {
            const valueText = new PIXI.Text({
                text: intent.type === 'defend' ? 'DEF' : 'BUFF',
                style: { 
                    fontSize: 11, 
                    fill: colors.primary,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 'bold'
                }
            });
            valueText.anchor.set(0, 0.5);
            valueText.x = xOffset;
            valueText.y = -frameHeight/2;
            container.addChild(valueText);
        }
        
        // ========================================
        // ★ 강력한 공격 경고 표시 (브레이크 레시피)
        // ========================================
        if (hasBreakRecipe) {
            // 느낌표 경고 아이콘
            const warningIcon = new PIXI.Text({
                text: '❗',
                style: { fontSize: 16 }
            });
            warningIcon.anchor.set(0.5);
            warningIcon.x = frameWidth/2 - 10;
            warningIcon.y = -frameHeight/2;
            container.addChild(warningIcon);
            
            // 느낌표 흔들림 애니메이션
            if (typeof gsap !== 'undefined') {
                gsap.to(warningIcon, {
                    x: warningIcon.x + 2,
                    duration: 0.1,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
                gsap.to(warningIcon.scale, {
                    x: 1.2, y: 1.2,
                    duration: 0.3,
                    yoyo: true,
                    repeat: -1,
                    ease: 'power2.inOut'
                });
            }
        }
        
        // ========================================
        // 하단 화살표
        // ========================================
        const arrow = new PIXI.Graphics();
        arrow.moveTo(0, 6);
        arrow.lineTo(-6, 0);
        arrow.lineTo(6, 0);
        arrow.closePath();
        arrow.fill({ color: colors.primary });
        container.addChild(arrow);
        
        // ========================================
        // ★ 위치 자동 피팅 (스프라이트 실제 높이 기반)
        // ========================================
        // 스프라이트의 실제 렌더링 높이 계산
        const sprite = enemy.sprite;
        let spriteHeight = 60; // 기본값
        
        if (sprite) {
            // 스프라이트 바운드 사용
            const bounds = sprite.getLocalBounds();
            spriteHeight = Math.abs(bounds.height) * (sprite.scale?.y || 1);
            
            // anchor가 (0.5, 1)이면 스프라이트 맨 위가 -height 위치
            // anchor 보정
            const anchorY = sprite.anchor?.y ?? 1;
            spriteHeight = spriteHeight * anchorY;
        }
        
        const margin = 8;
        container.y = -spriteHeight - margin;
        
        // ★ 새 구조: enemy.container에 추가
        const parent = enemy.container || enemy.sprite;
        if (!parent) return;
        
        if (enemy.container) {
            enemy.container.sortableChildren = true;
            enemy.container.addChild(container);
        } else {
            const containerScale = enemy.sprite.scale?.x || enemy.baseScale || 1;
            if (containerScale !== 0) {
                container.scale.set(1 / containerScale);
            }
            enemy.sprite.sortableChildren = true;
            enemy.sprite.addChild(container);
        }
        
        enemy.intentContainer = container;
        
        // ========================================
        // 등장 애니메이션
        // ========================================
        if (typeof gsap !== 'undefined') {
            container.alpha = 0;
            container.y -= 10;
            gsap.to(container, {
                alpha: 1,
                y: container.y + 10,
                duration: 0.3,
                ease: 'back.out(1.5)'
            });
        }
        
        // ========================================
        // ★ 브레이크 레시피: 캐릭터 힘 모으기 연출
        // ========================================
        if (hasBreakRecipe && enemy.sprite && typeof gsap !== 'undefined') {
            this.playChargingEffect(enemy);
        }
    },
    
    // ========================================
    // ★ 강력한 공격 준비 연출 (힘 모으기)
    // ========================================
    playChargingEffect(enemy) {
        if (!enemy.sprite || !this.app) return;
        
        // 기존 차징 이펙트 정리
        if (enemy.chargingTween) {
            enemy.chargingTween.kill();
        }
        if (enemy.chargingAura) {
            enemy.chargingAura.destroy();
        }
        
        const posTarget = enemy.container || enemy.sprite;
        const globalPos = posTarget.getGlobalPosition ? posTarget.getGlobalPosition() : { x: posTarget.x, y: posTarget.y };
        
        // 오라 이펙트 생성
        const aura = new PIXI.Graphics();
        aura.circle(0, 0, 40);
        aura.fill({ color: 0xff0000, alpha: 0.2 });
        aura.x = globalPos.x;
        aura.y = globalPos.y - 40;
        aura.zIndex = posTarget.zIndex - 1;
        
        this.containers.effects.addChild(aura);
        enemy.chargingAura = aura;
        
        // 오라 펄스 애니메이션
        gsap.to(aura.scale, {
            x: 1.5, y: 1.5,
            duration: 0.8,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
        gsap.to(aura, {
            alpha: 0.05,
            duration: 0.4,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
        
        // 캐릭터 스프라이트 떨림
        const sprite = enemy.sprite;
        const baseX = sprite.x;
        
        enemy.chargingTween = gsap.to(sprite, {
            x: baseX + 2,
            duration: 0.05,
            yoyo: true,
            repeat: -1,
            ease: 'none'
        });
        
        // 틴트 변화 (붉은 기운)
        gsap.to({ tint: 0 }, {
            tint: 1,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            onUpdate: function() {
                if (sprite && !sprite.destroyed) {
                    const t = this.targets()[0].tint;
                    sprite.tint = t > 0.5 ? 0xff8888 : 0xffffff;
                }
            }
        });
    },
    
    // ========================================
    // ★ 차징 이펙트 정리
    // ========================================
    clearChargingEffect(enemy) {
        if (enemy.chargingTween) {
            enemy.chargingTween.kill();
            enemy.chargingTween = null;
        }
        if (enemy.chargingAura) {
            enemy.chargingAura.destroy();
            enemy.chargingAura = null;
        }
        // 스프라이트 원상복귀
        if (enemy.sprite && !enemy.sprite.destroyed) {
            enemy.sprite.tint = 0xffffff;
        }
    },
    
    // ========================================
    // 브레이크 레시피 렌더링 (다크소울 스타일 게이지)
    // ========================================
    renderBreakRecipe(container, enemy, frameHeight = 75) {
        const recipe = enemy.intent.breakRecipe;
        const progress = enemy.breakProgress || [];
        
        const recipeContainer = new PIXI.Container();
        recipeContainer.y = 18; // 프레임 바로 아래
        recipeContainer.isBreakGauge = true;
        
        // 속성 색상 (다크소울 테마)
        const ElementColors = {
            physical: { main: 0xd97706, light: 0xfbbf24, dark: 0x92400e },
            fire: { main: 0xdc2626, light: 0xf87171, dark: 0x991b1b },
            ice: { main: 0x2563eb, light: 0x60a5fa, dark: 0x1e40af },
            lightning: { main: 0xca8a04, light: 0xfde047, dark: 0xa16207 },
            bleed: { main: 0xbe123c, light: 0xfb7185, dark: 0x881337 },
            poison: { main: 0x16a34a, light: 0x4ade80, dark: 0x15803d },
            magic: { main: 0x7c3aed, light: 0xa78bfa, dark: 0x5b21b6 },
            dark: { main: 0x4f46e5, light: 0x818cf8, dark: 0x3730a3 }
        };
        
        // 게이지 설정
        const segmentWidth = 18;
        const segmentHeight = 8;
        const gap = 3;
        const totalWidth = recipe.length * segmentWidth + (recipe.length - 1) * gap;
        
        // 게이지 배경 프레임
        const gaugeBg = new PIXI.Graphics();
        gaugeBg.roundRect(-totalWidth/2 - 5, -segmentHeight/2 - 4, totalWidth + 10, segmentHeight + 8, 3);
        gaugeBg.fill({ color: 0x0a0806, alpha: 0.95 });
        gaugeBg.stroke({ width: 1.5, color: 0x3d3429 });
        recipeContainer.addChild(gaugeBg);
        
        // 각 세그먼트 그리기
        recipe.forEach((element, i) => {
            const isCompleted = i < progress.length;
            const elementColorSet = ElementColors[element] || ElementColors.physical;
            
            const x = -totalWidth/2 + i * (segmentWidth + gap);
            
            // 세그먼트 배경
            const segBg = new PIXI.Graphics();
            segBg.roundRect(x, -segmentHeight/2, segmentWidth, segmentHeight, 2);
            segBg.fill({ color: 0x151210 });
            recipeContainer.addChild(segBg);
            
            if (isCompleted) {
                // ★ 완료된 세그먼트: 밝은 초록 + 광택
                const fill = new PIXI.Graphics();
                fill.roundRect(x, -segmentHeight/2, segmentWidth, segmentHeight, 2);
                fill.fill({ color: 0x22c55e });
                recipeContainer.addChild(fill);
                
                // 상단 광택
                const shine = new PIXI.Graphics();
                shine.roundRect(x + 1, -segmentHeight/2 + 1, segmentWidth - 2, 3, 1);
                shine.fill({ color: 0xffffff, alpha: 0.4 });
                recipeContainer.addChild(shine);
                
                // 체크마크
                const check = new PIXI.Text({
                    text: '✓',
                    style: { fontSize: 8, fill: '#ffffff', fontWeight: 'bold' }
                });
                check.anchor.set(0.5);
                check.x = x + segmentWidth / 2;
                recipeContainer.addChild(check);
            } else {
                // ★ 미완료 세그먼트: 속성 색상 힌트
                const dim = new PIXI.Graphics();
                dim.roundRect(x + 1, -segmentHeight/2 + 1, segmentWidth - 2, segmentHeight - 2, 1);
                dim.fill({ color: elementColorSet.main, alpha: 0.2 });
                recipeContainer.addChild(dim);
                
                // 속성 테두리 힌트
                const hint = new PIXI.Graphics();
                hint.roundRect(x, -segmentHeight/2, segmentWidth, segmentHeight, 2);
                hint.stroke({ width: 1, color: elementColorSet.main, alpha: 0.5 });
                recipeContainer.addChild(hint);
            }
        });
        
        // 진행도 표시 (현재/총)
        const progressText = new PIXI.Text({
            text: `${progress.length}/${recipe.length}`,
            style: {
                fontSize: 9,
                fontFamily: 'Cinzel, serif',
                fill: progress.length > 0 ? '#22c55e' : '#555555',
                fontWeight: 'bold',
                letterSpacing: 1
            }
        });
        progressText.anchor.set(0.5);
        progressText.y = segmentHeight / 2 + 8;
        recipeContainer.addChild(progressText);
        
        container.addChild(recipeContainer);
    },
    
    // ========================================
    // ★ 인라인 브레이크 게이지 (1열 컴팩트용)
    // ========================================
    renderBreakRecipeInline(container, enemy, startX, centerY) {
        const recipe = enemy.intent.breakRecipe;
        const progress = enemy.breakProgress || [];
        
        const ElementColors = {
            physical: { main: 0xd97706 },
            fire: { main: 0xdc2626 },
            ice: { main: 0x2563eb },
            lightning: { main: 0xca8a04 },
            bleed: { main: 0xbe123c },
            poison: { main: 0x16a34a },
            magic: { main: 0x7c3aed },
            dark: { main: 0x4f46e5 }
        };
        
        const segSize = 10;
        const gap = 2;
        
        recipe.forEach((element, i) => {
            const isCompleted = i < progress.length;
            const elementColor = ElementColors[element]?.main || 0xd97706;
            const x = startX + i * (segSize + gap);
            
            const seg = new PIXI.Graphics();
            seg.roundRect(x, centerY - segSize/2, segSize, segSize, 2);
            
            if (isCompleted) {
                seg.fill({ color: 0x22c55e });
                // 체크마크
                const check = new PIXI.Text({ text: '✓', style: { fontSize: 7, fill: '#ffffff' } });
                check.anchor.set(0.5);
                check.x = x + segSize/2;
                check.y = centerY;
                container.addChild(check);
            } else {
                seg.fill({ color: 0x151210 });
                seg.stroke({ width: 1, color: elementColor, alpha: 0.6 });
            }
            container.addChild(seg);
        });
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
        // ★ 새 구조: container 사용 (레거시: sprite 사용)
        const parent = unit.container || unit.sprite;
        if (!parent) return;
        
        // Remove existing HP bar
        if (unit.hpBar) {
            unit.hpBar.destroy();
        }
        
        // Create HP bar container
        const hpBar = new PIXI.Container();
        
        // ========================================
        // ★ LOL 스타일 HP 바 설정
        // ========================================
        const hpPerSegment = 10; // 10 HP당 1칸
        const segmentCount = Math.ceil(unit.maxHp / hpPerSegment);
        const segmentWidth = 5;
        const segmentGap = 1;
        const barWidth = segmentCount * segmentWidth + (segmentCount - 1) * segmentGap;
        const barHeight = 7;
        
        // 색상 설정
        let hpColor = 0xcc3333; // Enemy - 빨강
        let hpColorDark = 0x881111;
        if (unit.isHero) {
            hpColor = 0xc9a227; // Hero - 금색
            hpColorDark = 0x8a6b1a;
        } else if (unit.team === 'player') {
            hpColor = 0x33aa33; // Summon - 초록
            hpColorDark = 0x116611;
        }
        
        // 배경 (검은색)
        const bg = new PIXI.Graphics();
        bg.roundRect(-barWidth/2 - 2, -1, barWidth + 4, barHeight + 2, 2);
        bg.fill({ color: 0x000000, alpha: 0.8 });
        bg.stroke({ color: 0x222222, width: 1 });
        hpBar.addChild(bg);
        
        // HP 세그먼트 그리기
        const hpSegments = new PIXI.Graphics();
        hpBar.addChild(hpSegments);
        unit.hpSegments = hpSegments;
        
        // 쉴드 게이지 (HP 위에 표시)
        const shieldBar = new PIXI.Graphics();
        shieldBar.zIndex = 10;
        hpBar.addChild(shieldBar);
        unit.shieldBar = shieldBar;
        
        // 단위 저장
        unit.hpBarWidth = barWidth;
        unit.hpBarHeight = barHeight;
        unit.hpPerSegment = hpPerSegment;
        unit.segmentCount = segmentCount;
        unit.segmentWidth = segmentWidth;
        unit.segmentGap = segmentGap;
        unit.hpColor = hpColor;
        unit.hpColorDark = hpColorDark;
        
        // 초기 그리기
        this.drawHPSegments(unit);
        this.drawShieldBar(unit);
        
        // Position at sprite's feet (bottom) with small margin
        const margin = 5;
        hpBar.y = margin;
        hpBar.zIndex = 50;
        hpBar.sortableChildren = true;
        
        // ★ 새 구조: container에 추가
        if (unit.container) {
            unit.container.sortableChildren = true;
            unit.container.addChild(hpBar);
        } else {
            const containerScale = unit.sprite.scale?.x || unit.baseScale || 1;
            if (containerScale !== 0) {
                hpBar.scale.set(1 / containerScale);
            }
            unit.sprite.sortableChildren = true;
            unit.sprite.addChild(hpBar);
        }
        
        unit.hpBar = hpBar;
    },
    
    // ========================================
    // HP 세그먼트 그리기 (LOL 스타일)
    // ========================================
    drawHPSegments(unit) {
        if (!unit.hpSegments) return;
        
        const g = unit.hpSegments;
        g.clear();
        
        const { hpPerSegment, segmentCount, segmentWidth, segmentGap, barWidth, barHeight, hpColor, hpColorDark } = unit;
        const currentHp = Math.max(0, unit.hp);
        
        for (let i = 0; i < segmentCount; i++) {
            const segmentStartHp = i * hpPerSegment;
            const segmentEndHp = (i + 1) * hpPerSegment;
            const x = -barWidth/2 + i * (segmentWidth + segmentGap);
            
            if (currentHp >= segmentEndHp) {
                // 완전히 채워진 세그먼트
                g.roundRect(x, 0, segmentWidth, barHeight, 1);
                g.fill({ color: hpColor });
                // 상단 하이라이트
                g.rect(x + 1, 1, segmentWidth - 2, 2);
                g.fill({ color: 0xffffff, alpha: 0.3 });
            } else if (currentHp > segmentStartHp) {
                // 부분적으로 채워진 세그먼트
                const fillRatio = (currentHp - segmentStartHp) / hpPerSegment;
                // 어두운 배경
                g.roundRect(x, 0, segmentWidth, barHeight, 1);
                g.fill({ color: hpColorDark });
                // 채워진 부분
                g.rect(x, 0, segmentWidth * fillRatio, barHeight);
                g.fill({ color: hpColor });
            } else {
                // 빈 세그먼트
                g.roundRect(x, 0, segmentWidth, barHeight, 1);
                g.fill({ color: hpColorDark, alpha: 0.3 });
            }
        }
    },
    
    // ========================================
    // 쉴드 바 그리기 (HP 위 흰색 오버레이)
    // ========================================
    drawShieldBar(unit) {
        if (!unit.shieldBar) return;
        
        const g = unit.shieldBar;
        g.clear();
        
        const shield = unit.block || 0;
        if (shield <= 0) return;
        
        const { barWidth, barHeight, hpPerSegment, segmentWidth, segmentGap, segmentCount } = unit;
        
        // 쉴드 양에 따른 세그먼트 수 계산
        const shieldSegments = Math.ceil(shield / hpPerSegment);
        const currentHp = Math.max(0, unit.hp);
        const hpFilledSegments = Math.ceil(currentHp / hpPerSegment);
        
        // 쉴드는 HP 바 위에 흰색/은색으로 그리기
        for (let i = 0; i < Math.min(shieldSegments, segmentCount); i++) {
            const segmentIndex = Math.min(hpFilledSegments + i, segmentCount - 1);
            const x = -barWidth/2 + segmentIndex * (segmentWidth + segmentGap);
            
            // 쉴드 세그먼트 (은색/흰색 글로우)
            g.roundRect(x - 1, -2, segmentWidth + 2, barHeight + 4, 2);
            g.fill({ color: 0xaaccff, alpha: 0.3 });
            
            g.roundRect(x, 0, segmentWidth, barHeight, 1);
            g.fill({ color: 0xccddff });
            
            // 빛나는 효과
            g.rect(x + 1, 1, segmentWidth - 2, 2);
            g.fill({ color: 0xffffff, alpha: 0.6 });
        }
        
        // 쉴드 숫자 표시
        if (shield > 0) {
            // 기존 쉴드 텍스트 제거
            if (unit.shieldText) {
                unit.shieldText.destroy();
            }
            
            const shieldText = new PIXI.Text({
                text: `🛡${shield}`,
                style: {
                    fontSize: 9,
                    fill: '#aaccff',
                    fontWeight: 'bold',
                    stroke: { color: '#000000', width: 2 }
                }
            });
            shieldText.anchor.set(0.5);
            shieldText.x = barWidth/2 + 15;
            shieldText.y = barHeight/2;
            unit.hpBar.addChild(shieldText);
            unit.shieldText = shieldText;
        }
    },
    
    updateUnitHPBar(unit) {
        if (!unit.hpBar || !unit.hpSegments) {
            this.createUnitHPBar(unit);
            return;
        }
        
        // HP 세그먼트 다시 그리기
        this.drawHPSegments(unit);
        // 쉴드 바 다시 그리기
        this.drawShieldBar(unit);
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
            
            // 로컬라이징된 카드 텍스트
            const localCard = typeof Localization !== 'undefined' 
                ? Localization.getCard(cardId) 
                : null;
            const cardName = localCard?.name || cardDef.name;
            const cardDesc = localCard?.desc || cardDef.desc;
            
            // Type label (로컬라이징)
            const typeLabels = typeof Localization !== 'undefined' ? {
                attack: Localization.get('strike'),
                skill: Localization.get('miracle'),
                summon: Localization.get('summon')
            } : {
                attack: 'STRIKE',
                skill: 'MIRACLE',
                summon: 'SUMMON'
            };
            
            cardEl.innerHTML = `
                <div class="card-cost">${cardDef.cost}</div>
                <div class="card-name">${cardName}</div>
                <div class="card-type">${typeLabels[cardDef.type] || cardDef.type}</div>
                <div class="card-desc">${cardDesc}</div>
            `;
            
            // Drag to play (only if can afford)
            if (canAfford) {
                cardEl.addEventListener('mousedown', (e) => this.startCardDrag(e, cardEl, cardId, index));
                cardEl.addEventListener('touchstart', (e) => this.startCardDrag(e, cardEl, cardId, index), { passive: false });
            } else {
                // 코스트 부족 시 클릭하면 메시지
                cardEl.addEventListener('click', () => {
                    const msg = typeof Localization !== 'undefined' 
                        ? `${Localization.get('notEnoughCost')} (${cardDef.cost})` 
                        : `코스트 부족! (${cardDef.cost} 필요)`;
                    this.showMessage(msg, 800);
                    this.vibrate([50, 30, 50]);
                });
            }
            
            handEl.appendChild(cardEl);
            
            // 딜링 애니메이션
            if (animate) {
                setTimeout(() => {
                    cardEl.classList.add('dealt');
                    // 카드 딜링 사운드 (옵션)
                    Game.vibrate(10);
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
        
        // ★ 새 구조: container 우선 사용
        const heroPos = this.getUnitPosition(hero);
        const originalX = heroPos.x;
        const originalY = heroPos.y;
        
        // Calculate center of all targets
        const centerX = targets.reduce((sum, t) => sum + this.getUnitPosition(t).x, 0) / targets.length;
        const centerY = targets.reduce((sum, t) => sum + this.getUnitPosition(t).y, 0) / targets.length;
        
        // Dash to a point between hero and targets
        const dashX = originalX + (centerX - originalX) * 0.4;
        const dashY = originalY + (centerY - originalY) * 0.2;
        const posTarget = hero.container || hero.sprite;
        
        return new Promise(resolve => {
            gsap.timeline()
                // Dash forward
                .to(posTarget, {
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
                .to(posTarget, {
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
            hero.block = this.state.heroBlock; // ★ 유닛 객체에도 동기화
            this.updateBlockUI();
            this.updateUnitHPBar(hero); // ★ HP 바에 쉴드 반영
            
            // Block effect
            const heroPos = this.getUnitPosition(hero);
            if (typeof CombatEffects !== 'undefined' && heroPos) {
                CombatEffects.gainBlockEffect(heroPos.x, heroPos.y - 40, cardDef.block);
            } else {
                this.showMessage(`+${cardDef.block} Block`, 500);
            }
        }
        
        if (cardDef.heal && hero) {
            hero.hp = Math.min(hero.hp + cardDef.heal, hero.maxHp);
            this.updateUnitHPBar(hero);
            this.updateHPUI();
            
            // Heal effect
            const heroPos = this.getUnitPosition(hero);
            if (typeof CombatEffects !== 'undefined' && heroPos) {
                CombatEffects.healEffect(heroPos.x, heroPos.y - 40, cardDef.heal);
            } else {
                this.showMessage(`+${cardDef.heal} HP`, 500);
            }
        }
    },
    
    // ★ 헬퍼: 유닛 화면 위치 가져오기 (container 우선)
    getUnitPosition(unit) {
        if (!unit) return null;
        const target = unit.container || unit.sprite;
        return target ? { x: target.x, y: target.y } : null;
    },
    
    async dealDamage(target, amount) {
        if (!target || target.hp <= 0) return;
        
        // ★ 쉴드(block)가 있으면 쉴드 먼저 감소
        let remainingDamage = amount;
        const block = target.block || 0;
        
        if (block > 0) {
            if (block >= remainingDamage) {
                target.block -= remainingDamage;
                remainingDamage = 0;
            } else {
                remainingDamage -= block;
                target.block = 0;
            }
        }
        
        // 남은 대미지로 HP 감소
        if (remainingDamage > 0) {
            target.hp -= remainingDamage;
        }
        
        this.showDamage(target, amount);
        
        // Update HP bar (쉴드 변화도 반영)
        this.updateUnitHPBar(target);
        
        // Hit effect (스프라이트 알파만 변경, 위치는 건드리지 않음)
        if (target.sprite) {
            gsap.to(target.sprite, {
                alpha: 0.5,
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
            this.showExhaustEffect(cardId, cardDef);
        } else {
            this.state.discard.push(cardId);
        }
        this.updateCostUI();
        
        // For 'all' target cards (like Cleave), attack ALL enemies
        if (cardDef.target === 'all') {
            await this.playAttackCard(cardDef);
        } else {
            // Execute attack on specific target with AOE
            await this.playAttackCardOnTarget(cardId, cardDef, targetEnemy);
        }
        
        this.renderHand(false);
        this.vibrate([20, 30, 20]);
    },
    
    async playAttackCardOnTarget(cardId, cardDef, targetEnemy) {
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
                // ★ cardId로 타입 판단 (로컬라이제이션 영향 없음)
                const cardType = cardId === 'bash' ? 'bash' : 
                                 cardId === 'flurry' ? 'flurry' : 'strike';
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
                        const targetPos = this.getUnitPosition(target);
                        if (typeof CombatEffects !== 'undefined' && targetPos) {
                            CombatEffects.showDamageNumber(targetPos.x, targetPos.y - 30, cardDef.damage, 'burn');
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
            this.showExhaustEffect(cardId, cardDef);
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
        this.vibrate([20, 30, 20]);
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
        
        // ★ 새로운 유닛 구조로 생성
        // container: 위치 관리용 (scale=1 고정)
        // sprite: 스프라이트 래퍼 (스케일 애니메이션 적용)
        const result = await UnitSprite.createUnit(unitDef.sprite, unitDef.scale);
        if (!result) {
            console.error(`[Game] Failed to create unit for ${unitType}`);
            return;
        }
        
        const { container, sprite, baseScale } = result;
        
        // Position 계산
        const center = this.getCellCenter(gridX, gridZ);
        const targetX = center?.x || 0;
        const targetY = center?.y || 0;
        
        // 컨테이너를 게임 유닛 컨테이너에 추가
        this.containers.units.addChild(container);
        
        // ★ 스폰 애니메이션 재생
        const isEnemy = team === 'enemy';
        const showEffect = team === 'player' && unitType !== 'hero';
        
        UnitSprite.playSpawnAnimation({ container, sprite }, {
            targetX,
            targetY,
            direction: isEnemy ? 'right' : 'left',
            showEffect
        });
        
        // Create unit object
        // ★ 새 구조: container는 위치, sprite는 스케일
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
            container,          // ★ 위치 관리용 (scale=1)
            sprite,             // ★ 스프라이트 래퍼 (스케일 적용)
            baseScale,          // 기본 스케일
            isHero: unitDef.isHero || false,
            state: 'idle'
        };
        
        if (team === 'player') {
            this.state.playerUnits.push(unit);
        } else {
            this.state.enemyUnits.push(unit);
        }
        
        // Render HP bar (container에 추가되므로 스케일 영향 없음!)
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
            // 아처면 화살 VFX 사용
            const isArcher = summon.type === 'archer';
            await UnitCombat.rangedAttack(summon, target, summon.damage, {
                projectileType: isArcher ? 'arrow' : 'default',
                projectileColor: 0x88ff44,
                projectileSize: 8,
                isEnemy: false
            });
        } else {
            this.dealDamage(target, summon.damage);
        }
    },
    
    // Find target for summon attack
    // Rules: 1) Same lane (gridZ) first, 2) Closest X (lowest X = closest to summon), 3) Adjacent lanes
    findSummonTarget(summon) {
        const allTargets = this.state.enemyUnits.filter(e => e.hp > 0);
        if (allTargets.length === 0) return null;
        
        // Helper: find closest target (lowest X = closest to player side)
        const findClosest = (targets) => {
            if (targets.length === 0) return null;
            return targets.reduce((closest, t) => 
                (!closest || t.gridX < closest.gridX) ? t : closest, null
            );
        };
        
        // 1. ★ 같은 라인 우선 (gridZ 일치)
        const sameLine = allTargets.filter(t => t.gridZ === summon.gridZ);
        if (sameLine.length > 0) {
            const target = findClosest(sameLine);
            console.log(`[findSummonTarget] ${summon.type}(Z=${summon.gridZ}) → 같은 라인 타겟: ${target.type}(Z=${target.gridZ})`);
            return target;
        }
        
        // 2. 인접 라인 (gridZ +/- 1)
        const adjacent = allTargets.filter(t => Math.abs(t.gridZ - summon.gridZ) === 1);
        if (adjacent.length > 0) {
            const target = findClosest(adjacent);
            console.log(`[findSummonTarget] ${summon.type}(Z=${summon.gridZ}) → 인접 라인 타겟: ${target.type}(Z=${target.gridZ})`);
            return target;
        }
        
        // 3. Fallback: 모든 타겟 중 가장 가까운 X
        const target = findClosest(allTargets);
        if (target) {
            console.log(`[findSummonTarget] ${summon.type}(Z=${summon.gridZ}) → 폴백 타겟: ${target.type}(Z=${target.gridZ})`);
        }
        return target;
    },
    
    // Find target for enemy attack
    // Rules: 1) Same line first, 2) Closest X (rightmost in player zone), 3) Adjacent lines
    findEnemyTarget(enemy) {
        const allTargets = [this.state.hero, ...this.state.playerUnits]
            .filter(u => u && u.hp > 0 && u !== enemy);
        
        if (allTargets.length === 0) return null;
        
        // Helper: find closest target in a list (highest X = closest to enemy = rightmost)
        const findClosest = (targets) => {
            if (targets.length === 0) return null;
            return targets.reduce((closest, t) => 
                (!closest || t.gridX > closest.gridX) ? t : closest, null);
        };
        
        // 1. ★ 같은 라인 우선 (gridZ 일치)
        const sameLineTargets = allTargets.filter(t => t.gridZ === enemy.gridZ);
        if (sameLineTargets.length > 0) {
            const target = findClosest(sameLineTargets);
            console.log(`[findEnemyTarget] ${enemy.type}(Z=${enemy.gridZ}) → 같은 라인 타겟: ${target.type || 'hero'}(Z=${target.gridZ})`);
            return target;
        }
        
        // 2. 인접 라인 (위/아래)
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
        
        if (closestTarget) {
            console.log(`[findEnemyTarget] ${enemy.type}(Z=${enemy.gridZ}) → 인접 라인 타겟: ${closestTarget.type || 'hero'}(Z=${closestTarget.gridZ})`);
            return closestTarget;
        }
        
        // 3. Fallback: 모든 타겟 중 가장 가까운 X
        const target = findClosest(allTargets);
        if (target) {
            console.log(`[findEnemyTarget] ${enemy.type}(Z=${enemy.gridZ}) → 폴백 타겟: ${target.type || 'hero'}(Z=${target.gridZ})`);
        }
        return target;
    },
    
    async executeEnemyIntent(enemy) {
        const intent = enemy.intent;
        if (!intent) return;
        
        // ★ 차징 이펙트 정리 (인텐트 실행 시)
        this.clearChargingEffect(enemy);
        
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
                this.updateUnitHPBar(enemy); // ★ HP 바에 쉴드 반영
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
        console.log(`[Game] moveEnemyToLine: ${enemy.name || enemy.type} from Z=${enemy.gridZ} to Z=${targetZ}`);
        if (typeof UnitCombat !== 'undefined') {
            await UnitCombat.moveToLine(enemy, targetZ, { team: 'enemy' });
            console.log(`[Game] moveEnemyToLine complete: now at Z=${enemy.gridZ}`);
        } else {
            console.warn('[Game] UnitCombat not available!');
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
            // 궁수 타입이면 화살 VFX 사용
            const isArcher = enemy.type === 'goblinArcher' || enemy.type === 'archer';
            await UnitCombat.rangedAttack(enemy, target, intentDamage, {
                projectileType: isArcher ? 'arrow' : 'default',
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
        // ★ 쉴드(block) 처리
        let blocked = 0;
        
        if (target.isHero && this.state.heroBlock > 0) {
            // 히어로는 state.heroBlock 사용
            blocked = Math.min(this.state.heroBlock, damage);
            this.state.heroBlock -= blocked;
            target.block = this.state.heroBlock; // 동기화
            damage -= blocked;
            this.updateBlockUI();
        } else if (target.block && target.block > 0) {
            // 일반 유닛은 target.block 사용
            blocked = Math.min(target.block, damage);
            target.block -= blocked;
            damage -= blocked;
        }
        
        if (blocked > 0) {
            this.showMessage(`Blocked ${blocked}!`, 500);
        }
        
        if (damage > 0) {
            target.hp -= damage;
            this.showDamage(target, damage);
            
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
        
        // Update HP bar (쉴드 변화도 반영)
        this.updateUnitHPBar(target);
        
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
        
        const pos = this.getUnitPosition(unit);
        text.x = pos?.x || 0;
        text.y = (pos?.y || 0) - 30;
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
        
        // ★ 차징 이펙트 정리
        this.clearChargingEffect(unit);
        
        // ★ 브레이크 시스템 정리
        if (typeof BreakSystem !== 'undefined') {
            BreakSystem.removeStunStars(unit);
            if (unit.stunShakeTween) {
                unit.stunShakeTween.kill();
                unit.stunShakeTween = null;
            }
            if (unit.breakBlinkTween) {
                unit.breakBlinkTween.kill();
                unit.breakBlinkTween = null;
            }
        }
        
        // ★ HP 바 삭제 연출 (페이드아웃 + 축소)
        if (unit.hpBar && !unit.hpBar.destroyed) {
            const hpBar = unit.hpBar;
            gsap.to(hpBar, {
                alpha: 0,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    if (hpBar && !hpBar.destroyed) {
                        hpBar.destroy({ children: true });
                    }
                }
            });
            gsap.to(hpBar.scale, {
                x: 0.5, y: 0.5,
                duration: 0.2
            });
            unit.hpBar = null;
        }
        
        // ★ 인텐트 삭제 연출 (페이드아웃 + 위로 사라짐)
        if (unit.intentContainer && !unit.intentContainer.destroyed) {
            const intent = unit.intentContainer;
            gsap.to(intent, {
                alpha: 0,
                y: intent.y - 20,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    if (intent && !intent.destroyed) {
                        intent.destroy({ children: true });
                    }
                }
            });
            unit.intentContainer = null;
        }
        
        // ★ 사망 연출 (화려하게!)
        // 새 구조: container가 최상위, sprite는 container의 자식
        const posTarget = unit.container || unit.sprite;
        const scaleTarget = unit.sprite;
        
        if (posTarget && !posTarget.destroyed) {
            const isEnemy = unit.team === 'enemy';
            
            // 글로벌 좌표로 사망 위치 계산
            const globalPos = posTarget.getGlobalPosition ? posTarget.getGlobalPosition() : { x: posTarget.x, y: posTarget.y };
            const deathX = globalPos.x;
            const deathY = globalPos.y;
            
            // 1. 히트스톱 + 플래시
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.hitStop(80);
                CombatEffects.screenFlash(isEnemy ? '#ff4444' : '#ffffff', 100, 0.3);
            }
            
            // 2. 사망 파티클
            this.createDeathParticles(deathX, deathY, isEnemy);
            
            // 3. 사망 애니메이션 (쓰러지면서 사라짐)
            const baseScale = unit.baseScale || scaleTarget?.baseScale || 1;
            const startY = posTarget.y;
            
            gsap.timeline()
                // 피격 경직 (스프라이트 틴트)
                .call(() => {
                    if (scaleTarget) scaleTarget.tint = 0xffffff;
                })
                .to({}, { duration: 0.05 })
                // 빨갛게 변하면서 (스프라이트 틴트)
                .call(() => {
                    if (scaleTarget) scaleTarget.tint = isEnemy ? 0xff0000 : 0x888888;
                })
                // 위로 살짝 튀어오름 (컨테이너 위치)
                .to(posTarget, { y: startY - 20, duration: 0.1, ease: 'power2.out' })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 1.2, y: baseScale * 0.8, duration: 0.1 });
                }, null, '<')
                // 아래로 쓰러짐 (컨테이너 위치)
                .to(posTarget, { 
                    y: startY + 30,
                    duration: 0.25, 
                    ease: 'power3.in' 
                })
                .call(() => {
                    if (scaleTarget) {
                        gsap.to(scaleTarget.scale, { x: baseScale * 0.6, y: baseScale * 1.3, duration: 0.2 });
                        gsap.to(scaleTarget, { rotation: isEnemy ? 0.3 : -0.3, duration: 0.2 });
                    }
                }, null, '<')
                // 페이드 아웃 (전체 컨테이너)
                .to(posTarget, { 
                    alpha: 0, 
                    duration: 0.3,
                    onComplete: () => {
                        // 컨테이너 전체 삭제 (sprite, hpBar, intentContainer 포함)
                        if (posTarget && !posTarget.destroyed) {
                            posTarget.destroy({ children: true });
                        }
                        unit.container = null;
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
    
    // ★ 사망 파티클 생성
    createDeathParticles(x, y, isEnemy) {
        if (!this.app) return;
        
        const particleCount = 15;
        const color = isEnemy ? 0xff4444 : 0x888888;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            const size = 3 + Math.random() * 5;
            
            particle.circle(0, 0, size);
            particle.fill({ color: color, alpha: 0.8 });
            particle.x = x + (Math.random() - 0.5) * 40;
            particle.y = y - 30 + (Math.random() - 0.5) * 40;
            particle.zIndex = 200;
            
            this.containers.effects.addChild(particle);
            
            // 위로 흩어지면서 사라짐
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 50;
            
            gsap.to(particle, {
                x: particle.x + Math.cos(angle) * dist,
                y: particle.y - 20 - Math.random() * 40,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => particle.destroy()
            });
            
            gsap.to(particle.scale, {
                x: 0,
                y: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.in'
            });
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
        // ★ 새 구조: container 사용, 레거시: sprite 사용
        const target = unit.container || unit.sprite;
        if (!unit || !target) return;
        
        const center = this.getCellCenter(unit.gridX, unit.gridZ);
        if (center) {
            target.x = center.x;
            target.y = center.y;
            target.zIndex = Math.floor(center.y);
        }
    },
    
    updateAllUnitPositions() {
        // Update all unit positions based on current 3D projection
        const allUnits = [...this.state.playerUnits, ...this.state.enemyUnits];
        for (const unit of allUnits) {
            // ★ 새 구조: container 또는 sprite 체크
            const target = unit.container || unit.sprite;
            if (unit.hp > 0 && target && !unit.isAnimating) {
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
    
    // ==========================================
    // UI 라벨 업데이트 (로컬라이징)
    // ==========================================
    updateUILabels() {
        if (typeof Localization === 'undefined') return;
        
        // 패널 타이틀
        const panelTitle = document.getElementById('panel-title');
        if (panelTitle) {
            panelTitle.textContent = Localization.get('spellInventory');
        }
        
        // 턴 종료 버튼
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.textContent = Localization.get('endTurnBtn');
        }
        
        // 히어로 이름
        const heroLabel = document.querySelector('.hp-box .label');
        if (heroLabel) {
            heroLabel.textContent = Localization.get('ashenOne');
        }
    },
    
    // ==================== UTILS ====================
    
    // 안전한 진동 호출 (사용자 상호작용 필요)
    hasUserInteracted: false,
    
    vibrate(pattern) {
        if (!this.hasUserInteracted) return;
        if (!navigator.vibrate) return;
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // 진동 API 차단됨 - 무시
        }
    },
    
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
    showExhaustEffect(cardId, cardDef) {
        // 화면 중앙 하단에서 소멸 이펙트
        const x = window.innerWidth / 2;
        const y = window.innerHeight - 200;
        
        // 로컬라이징된 카드 이름
        const localCard = typeof Localization !== 'undefined' 
            ? Localization.getCard(cardId) 
            : null;
        const cardName = localCard?.name || cardDef.name;
        const exhaustLabel = typeof Localization !== 'undefined' 
            ? Localization.get('exhausted') 
            : 'EXHAUSTED';
        
        // 소멸 텍스트
        const exhaustText = document.createElement('div');
        exhaustText.innerHTML = `
            <div class="exhaust-card-name">${cardName}</div>
            <div class="exhaust-label">${exhaustLabel}</div>
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
    
    // 사용자 상호작용 감지 (진동 API 활성화용)
    const enableVibrate = () => {
        Game.hasUserInteracted = true;
        document.removeEventListener('click', enableVibrate);
        document.removeEventListener('touchstart', enableVibrate);
    };
    document.addEventListener('click', enableVibrate);
    document.addEventListener('touchstart', enableVibrate);
    
    // 언어 선택 버튼 이벤트
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-btn');
            if (!btn) return;
            
            const lang = btn.dataset.lang;
            if (typeof Localization !== 'undefined' && Localization.setLanguage(lang)) {
                // 활성 버튼 업데이트
                langSelector.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 손패 다시 렌더링
                Game.renderHand(false);
            }
        });
    }
    
    // 언어 변경 이벤트 리스너
    window.addEventListener('languageChanged', () => {
        Game.renderHand(false);
        Game.updateUILabels();
    });
});
