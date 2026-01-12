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
            scale: 0.45,
            retreatBeforeAttack: true,  // ★ 뒤로 후퇴 후 쏘기
            retreatDistance: 1
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
        
        // Shield VFX
        if (typeof ShieldVFX !== 'undefined') {
            ShieldVFX.init(this.app, this.app.stage);
        }
        
        // ★ Skill System 초기화 (JSON 기반 스킬 로드)
        if (typeof SkillSystem !== 'undefined') {
            await SkillSystem.init(this);
        }
        
        // Knockback System
        if (typeof KnockbackSystem !== 'undefined') {
            KnockbackSystem.init(this);
        }
        
        // Grid AOE System
        if (typeof GridAOE !== 'undefined') {
            GridAOE.init(this, this.app);
        }
        
        // Card System (JSON 로드)
        if (typeof CardSystem !== 'undefined') {
            await CardSystem.init(this);
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
        
        // Monster Patterns (JSON 로드)
        if (typeof MonsterPatterns !== 'undefined') {
            await MonsterPatterns.init(this);
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
        
        // ★ 치트 시스템 초기화
        if (typeof CheatSystem !== 'undefined') {
            CheatSystem.init(this);
        }
        
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
        
        // ★ 스폰 애니메이션 완료 후 위치 재계산 (600ms = 스폰 애니메이션 시간)
        setTimeout(() => {
            this.state.enemyUnits.forEach(enemy => {
                if (enemy.hp > 0) {
                    this.createEnemyIntent(enemy);
                }
            });
        }, 700);
    },
    
    createEnemyIntent(enemy) {
        if (!enemy.sprite || !enemy.intent) return;
        
        // ★ 기존 인텐트 관련 gsap 애니메이션 모두 정리
        if (enemy.intentContainer && !enemy.intentContainer.destroyed) {
            // 인텐트 컨테이너와 모든 자식의 트윈 정리
            try {
                gsap.killTweensOf(enemy.intentContainer);
                enemy.intentContainer.children?.forEach(child => {
                    if (child && !child.destroyed) {
                        gsap.killTweensOf(child);
                        if (child.scale) gsap.killTweensOf(child.scale);
                    }
                });
            } catch(e) {}
            enemy.intentContainer.destroy();
        }
        
        const container = new PIXI.Container();
        container.zIndex = 100;
        
        // ========================================
        // ★ 컴팩트 1열 인텐트 UI (다크소울 스타일)
        // ========================================
        const intent = enemy.intent;
        // ★ breakRecipe가 숫자(2, 3 등)이거나 객체/배열인 경우 모두 처리
        const hasBreakRecipe = !!(intent.breakRecipe && (
            typeof intent.breakRecipe === 'number' ||  // 숫자인 경우 (예: breakRecipe: 3)
            intent.breakRecipe.count > 0 || 
            (Array.isArray(intent.breakRecipe) && intent.breakRecipe.length > 0)
        ));
        
        // 색상 팔레트
        const COLORS = {
            attack: { primary: 0xc41e3a, glow: 0x8b0000, icon: '⚔' },
            defend: { primary: 0x2563eb, glow: 0x1e3a8a, icon: '🛡' },
            buff: { primary: 0xd97706, glow: 0x92400e, icon: '⬆' },
            debuff: { primary: 0x7c3aed, glow: 0x4c1d95, icon: '⬇' },
            summon: { primary: 0x059669, glow: 0x064e3b, icon: '👥' }
        };
        
        const colors = COLORS[intent.type] || COLORS.attack;
        
        // ★ 1열 컴팩트 디자인: [아이콘] [데미지] (브레이크 게이지는 하단에!)
        const iconSize = 28;
        const dmgBoxWidth = intent.damage ? 36 : 0;
        // ★ 느낌표 제거! 게이지가 경고 역할
        const frameWidth = iconSize + dmgBoxWidth + 12;
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
            
            // 펄스 애니메이션 (안전 체크 포함)
            if (typeof gsap !== 'undefined') {
                gsap.to({ val: 0 }, {
                    val: 1,
                    duration: 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut',
                    onUpdate: function() {
                        if (!dangerGlow || dangerGlow.destroyed) {
                            this.kill();
                            return;
                        }
                        dangerGlow.alpha = 0.3 - this.targets()[0].val * 0.2;
                    }
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
        
        // ★ 느낌표 아이콘 제거됨! (브레이크 게이지가 하단에서 경고 역할)
        
        // ★ 브레이크 게이지는 BreakSystem.createBreakGauge()에서 하단에 일체화됨!
        
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
        // ★ 위치 자동 피팅 (스프라이트 머리 바로 위)
        // ========================================
        const sprite = enemy.sprite;
        let spriteTopY = -80; // 기본값 (스프라이트 맨 위)
        
        if (sprite) {
            // ★ baseScale 사용 (스폰 애니메이션 중에도 정확한 값)
            const baseScale = enemy.baseScale || sprite.scale?.y || 1;
            
            // 스프라이트 내부의 실제 이미지 bounds 가져오기
            let bounds = sprite.getLocalBounds();
            
            // bounds가 너무 작으면 (스폰 중일 수 있음) 기본값 사용
            // 일반적인 캐릭터 스프라이트 높이: 약 100-150px
            const minExpectedHeight = 80;
            if (Math.abs(bounds.height) < minExpectedHeight) {
                bounds = { height: -150, y: -150 }; // 기본 추정값
            }
            
            // baseScale로 최종 높이 계산
            const actualHeight = Math.abs(bounds.height) * baseScale;
            
            // anchor.y가 1이면 발밑이 (0,0), 머리가 -height
            const anchorY = sprite.anchor?.y ?? 1;
            spriteTopY = -actualHeight * anchorY;
            
            // 최소 높이 보장 (너무 낮으면 스프라이트와 겹침)
            spriteTopY = Math.min(spriteTopY, -70);
        }
        
        // 인텐트를 스프라이트 머리 바로 위에 배치
        const margin = 10;
        container.y = spriteTopY - margin;
        
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
        
        // ========================================
        // ★ 브레이크 게이지 생성 (intentContainer 이후!)
        // ========================================
        if (hasBreakRecipe && typeof BreakSystem !== 'undefined' && enemy.currentBreakRecipe) {
            console.log(`[Game] 브레이크 게이지 생성: ${enemy.name || enemy.type}`);
            BreakSystem.createBreakGauge(enemy);
        }
    },
    
    // ========================================
    // ★ 강력한 공격 준비 연출 (다크소울 스타일 - 절제된 위협감)
    // ========================================
    playChargingEffect(enemy) {
        if (!enemy.sprite || !this.app) return;
        
        // 기존 차징 이펙트 정리
        this.clearChargingEffect(enemy);
        
        const parent = enemy.container || enemy.sprite;
        const sprite = enemy.sprite;
        
        // 이펙트 컨테이너
        const effectContainer = new PIXI.Container();
        effectContainer.zIndex = -10;
        parent.addChild(effectContainer);
        enemy.chargingContainer = effectContainer;
        
        // ========================================
        // 1. 은은한 붉은 오라 (바닥에서 올라오는 느낌)
        // ========================================
        const aura = new PIXI.Graphics();
        aura.ellipse(0, 0, 35, 8);
        aura.fill({ color: 0xaa2200, alpha: 0.3 });
        aura.y = 5;
        effectContainer.addChild(aura);
        enemy.chargingGlowAura = aura;
        
        // 오라 천천히 숨쉬기
        enemy.chargingGlowTween = gsap.to({ val: 0 }, {
            val: Math.PI * 2,
            duration: 2.5,
            repeat: -1,
            ease: 'none',
            onUpdate: function() {
                if (!aura || aura.destroyed) return;
                const v = this.targets()[0].val;
                const s = 1 + Math.sin(v) * 0.15;
                aura.scale.set(s, 1 + Math.sin(v) * 0.3);
                aura.alpha = 0.25 + Math.sin(v) * 0.1;
            }
        });
        
        // ========================================
        // 2. 가끔씩 바닥에서 먼지 (절제된 파티클)
        // ========================================
        enemy.chargingDustInterval = setInterval(() => {
            try {
                if (!enemy.sprite || enemy.sprite.destroyed || 
                    !effectContainer || effectContainer.destroyed) {
                    clearInterval(enemy.chargingDustInterval);
                    return;
                }
                
                // 50% 확률로만 생성 (절제)
                if (Math.random() > 0.5) return;
                
                const dust = new PIXI.Graphics();
                dust.circle(0, 0, 2);
                dust.fill(0x664433);
                
                const startX = (Math.random() - 0.5) * 40;
                dust.x = startX;
                dust.y = 5;
                dust.alpha = 0.4;
                effectContainer.addChild(dust);
                
                gsap.to({ progress: 0 }, {
                    progress: 1,
                    duration: 0.8,
                    ease: 'power2.out',
                    onUpdate: function() {
                        if (!dust || dust.destroyed) return;
                        const p = this.targets()[0].progress;
                        dust.y = 5 - p * 15;
                        dust.alpha = 0.4 * (1 - p);
                    },
                    onComplete: () => {
                        if (dust && !dust.destroyed) dust.destroy();
                    }
                });
            } catch (e) {
                clearInterval(enemy.chargingDustInterval);
            }
        }, 300);
        
        // ========================================
        // 3. 캐릭터 미세한 떨림 + 붉은 틴트
        // ========================================
        if (sprite && !sprite.destroyed) {
            const baseX = sprite.x;
            
            enemy.chargingTween = gsap.to({ shake: 0, tint: 0 }, {
                shake: Math.PI * 2,
                tint: Math.PI * 2,
                duration: 2,
                repeat: -1,
                ease: 'none',
                onUpdate: function() {
                    if (!sprite || sprite.destroyed) return;
                    try {
                        const t = this.targets()[0];
                        // 아주 미세한 떨림 (0.5픽셀)
                        sprite.x = baseX + Math.sin(t.shake * 8) * 0.5;
                        // 은은한 붉은 틴트 (0xffcccc ~ 0xffaaaa)
                        const tintVal = (Math.sin(t.tint) + 1) / 2;
                        const r = 0xff;
                        const g = Math.floor(0xaa + tintVal * 0x22);
                        const b = Math.floor(0xaa + tintVal * 0x22);
                        sprite.tint = (r << 16) | (g << 8) | b;
                    } catch(e) {}
                }
            });
        }
    },
    
    // ========================================
    // ★ 차징 이펙트 정리
    // ========================================
    clearChargingEffect(enemy) {
        // 트윈 정리 (모든 트윈들)
        const tweens = [
            'chargingTween',
            'chargingTintTween',
            'chargingGlowTween'
        ];
        tweens.forEach(key => {
            if (enemy[key]) {
                try { enemy[key].kill(); } catch(e) {}
                enemy[key] = null;
            }
        });
        
        // 인터벌 정리 (모든 파티클 인터벌)
        const intervals = [
            'chargingFlameInterval',
            'chargingDustInterval', 
            'chargingSparkInterval',
            'chargingParticleInterval',
            'chargingLightningInterval'
        ];
        intervals.forEach(key => {
            if (enemy[key]) {
                try { clearInterval(enemy[key]); } catch(e) {}
                enemy[key] = null;
            }
        });
        
        // 글로우 오라 정리
        enemy.chargingGlowAura = null;
        
        // 이펙트 컨테이너 정리
        if (enemy.chargingContainer) {
            try {
                if (!enemy.chargingContainer.destroyed) {
                    enemy.chargingContainer.destroy({ children: true });
                }
            } catch(e) {}
        }
        enemy.chargingContainer = null;
        
        // 레거시: 오라 정리
        if (enemy.chargingAura) {
            try {
                if (!enemy.chargingAura.destroyed) {
                    enemy.chargingAura.destroy();
                }
            } catch(e) {}
        }
        enemy.chargingAura = null;
        
        // 스프라이트 원상복귀
        if (enemy.sprite && !enemy.sprite.destroyed) {
            try {
                enemy.sprite.tint = 0xffffff;
                gsap.killTweensOf(enemy.sprite);
            } catch(e) {}
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
    // ★ HPBarSystem 모듈 사용 (체계적 관리)
    // ==================== PIXI-based HP Bars ====================
    renderAllHPBars() {
        if (typeof HPBarSystem !== 'undefined') {
            HPBarSystem.renderAll(this.state.playerUnits, this.state.enemyUnits);
        } else {
            [...this.state.playerUnits, ...this.state.enemyUnits].forEach(unit => {
                if (unit.hp > 0 && unit.sprite) {
                    this.createUnitHPBar(unit);
                }
            });
        }
    },
    
    createUnitHPBar(unit) {
        // ★ HPBarSystem 모듈 사용 (우선)
        if (typeof HPBarSystem !== 'undefined') {
            HPBarSystem.create(unit);
            return;
        }
        
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
        // ★ HP 바 설정 (가독성 향상)
        // ========================================
        const barWidth = 80;
        const barHeight = 12;
        const padding = 4;
        
        // 색상 설정 (더 선명한 색상)
        let hpColor = 0xe63333; // Enemy - 선명한 빨강
        let hpColorBright = 0xff6666;
        let hpColorDark = 0x330000;
        if (unit.isHero) {
            hpColor = 0xf0c020; // Hero - 밝은 금색
            hpColorBright = 0xffdd55;
            hpColorDark = 0x332200;
        } else if (unit.team === 'player') {
            hpColor = 0x44cc44; // Summon - 밝은 초록
            hpColorBright = 0x66ff66;
            hpColorDark = 0x003300;
        }
        
        // ========================================
        // 쉴드 프레임 (HP 바를 감싸는 보호막)
        // ========================================
        const shieldFrame = new PIXI.Graphics();
        shieldFrame.visible = false;
        hpBar.addChild(shieldFrame);
        unit.shieldFrame = shieldFrame;
        
        // 배경 프레임 (더 굵은 테두리)
        const frame = new PIXI.Graphics()
            .rect(-barWidth/2 - padding, -padding, barWidth + padding*2, barHeight + padding*2)
            .fill(0x000000)
            .stroke({ width: 3, color: 0x444444 });
        hpBar.addChild(frame);
        unit.hpFrame = frame;
        
        // HP 배경 (빈 부분 - 더 어두운 색)
        const bgFill = new PIXI.Graphics()
            .rect(-barWidth/2, 0, barWidth, barHeight)
            .fill(hpColorDark);
        hpBar.addChild(bgFill);
        unit.hpBgFill = bgFill;
        
        // ★ 지연 HP 게이지 (잔상 - 천천히 따라오는 효과)
        const hpDelayedFill = new PIXI.Graphics();
        hpBar.addChild(hpDelayedFill);
        unit.hpDelayedFill = hpDelayedFill;
        unit.displayedHp = unit.hp; // 현재 표시 중인 HP
        
        // HP 게이지 (실제 HP - 즉시 반영)
        const hpFill = new PIXI.Graphics();
        hpBar.addChild(hpFill);
        unit.hpFill = hpFill;
        
        // HP 하이라이트 (상단 빛)
        const highlight = new PIXI.Graphics();
        hpBar.addChild(highlight);
        unit.hpHighlight = highlight;
        
        // HP 텍스트 (더 큰 폰트, 더 굵은 외곽선)
        const hpText = new PIXI.Text({
            text: `${unit.hp}`,
            style: {
                fontSize: 13,
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: { color: '#000000', width: 4 }
            }
        });
        hpText.anchor.set(0.5);
        hpText.y = barHeight / 2;
        hpBar.addChild(hpText);
        unit.hpText = hpText;
        
        // 쉴드 배지 (HP 바 오른쪽 - 더 크게)
        const shieldBadge = new PIXI.Container();
        shieldBadge.visible = false;
        shieldBadge.x = barWidth / 2 + 12;
        shieldBadge.y = barHeight / 2;
        hpBar.addChild(shieldBadge);
        unit.shieldBadge = shieldBadge;
        
        // 쉴드 아이콘 배경 (더 크게)
        const shieldIcon = new PIXI.Graphics()
            .circle(0, 0, 13)
            .fill(0x2266cc)
            .stroke({ width: 3, color: 0x88ccff });
        shieldBadge.addChild(shieldIcon);
        unit.shieldIcon = shieldIcon;
        
        // 쉴드 숫자 (더 큰 폰트)
        const shieldText = new PIXI.Text({
            text: '0',
            style: {
                fontSize: 12,
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: { color: '#000000', width: 3 }
            }
        });
        shieldText.anchor.set(0.5);
        shieldBadge.addChild(shieldText);
        unit.shieldText = shieldText;
        
        // 단위 저장
        unit.hpBarWidth = barWidth;
        unit.hpBarHeight = barHeight;
        unit.hpBarPadding = padding;
        unit.hpColor = hpColor;
        unit.hpColorBright = hpColorBright;
        unit.hpColorDark = hpColorDark;
        
        // 초기 그리기
        this.updateHPFill(unit);
        
        // Position at sprite's feet (bottom) with small margin
        hpBar.y = 8;
        hpBar.zIndex = 50;
        
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
    // HP 게이지 업데이트 (잔상 애니메이션 포함)
    // ========================================
    updateHPFill(unit) {
        // ★ HPBarSystem 모듈 사용 (우선)
        if (typeof HPBarSystem !== 'undefined' && unit.hpBarData) {
            HPBarSystem.update(unit);
            return;
        }
        
        if (!unit.hpFill) return;
        
        const { hpBarWidth, hpBarHeight, hpBarPadding, hpColor, hpColorBright, hpColorDark } = unit;
        const hpRatio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
        const shield = unit.block || 0;
        
        // ★ 지연 HP 잔상 (쭈욱 빠지는 효과)
        if (unit.hpDelayedFill && !unit.hpDelayedFill.destroyed) {
            const previousDisplayedHp = unit.displayedHp ?? unit.hp;
            const delayedRatio = Math.max(0, Math.min(1, previousDisplayedHp / unit.maxHp));
            
            // 잔상은 흰색/노란색으로 표시
            unit.hpDelayedFill.clear();
            if (delayedRatio > hpRatio) {
                // 빠진 부분을 밝은 색으로 표시
                unit.hpDelayedFill
                    .rect(-hpBarWidth/2 + hpBarWidth * hpRatio, 0, 
                          hpBarWidth * (delayedRatio - hpRatio), hpBarHeight)
                    .fill(0xffeeaa); // 밝은 노란색 잔상
            }
            
            // ★ gsap으로 displayedHp를 실제 hp로 천천히 감소
            if (previousDisplayedHp > unit.hp && typeof gsap !== 'undefined') {
                // 기존 애니메이션 취소
                if (unit.hpTween) {
                    unit.hpTween.kill();
                }
                
                // 잔상이 천천히 따라오는 애니메이션
                unit.hpTween = gsap.to(unit, {
                    displayedHp: unit.hp,
                    duration: 0.6,
                    ease: 'power2.out',
                    onUpdate: () => {
                        // 잔상 업데이트 (destroyed 체크 필수)
                        if (unit.hpDelayedFill && !unit.hpDelayedFill.destroyed) {
                            const currentDelayedRatio = Math.max(0, Math.min(1, unit.displayedHp / unit.maxHp));
                            unit.hpDelayedFill.clear();
                            if (currentDelayedRatio > hpRatio) {
                                unit.hpDelayedFill
                                    .rect(-hpBarWidth/2 + hpBarWidth * hpRatio, 0,
                                          hpBarWidth * (currentDelayedRatio - hpRatio), hpBarHeight)
                                    .fill(0xffeeaa);
                            }
                        }
                    }
                });
            } else if (previousDisplayedHp < unit.hp) {
                // HP 회복 시 즉시 반영
                unit.displayedHp = unit.hp;
            }
        }
        
        // HP 게이지 (실제 HP - 즉시 반영) - destroyed 체크
        if (!unit.hpFill || unit.hpFill.destroyed) return;
        unit.hpFill.clear();
        if (hpRatio > 0) {
            unit.hpFill
                .rect(-hpBarWidth/2, 0, hpBarWidth * hpRatio, hpBarHeight)
                .fill(hpColor);
        }
        
        // HP 하이라이트 (상단 빛 효과)
        if (unit.hpHighlight && !unit.hpHighlight.destroyed) {
            unit.hpHighlight.clear();
            if (hpRatio > 0) {
                unit.hpHighlight
                    .rect(-hpBarWidth/2, 1, hpBarWidth * hpRatio, 3)
                    .fill({ color: hpColorBright, alpha: 0.5 });
            }
        }
        
        // ========================================
        // 쉴드 프레임 (HP 바를 감싸는 보호막)
        // ========================================
        if (unit.shieldFrame && !unit.shieldFrame.destroyed) {
            unit.shieldFrame.clear();
            if (shield > 0) {
                unit.shieldFrame.visible = true;
                const p = hpBarPadding + 2;
                // 외곽 글로우 (파란색)
                unit.shieldFrame
                    .rect(-hpBarWidth/2 - p - 2, -p - 2, hpBarWidth + (p+2)*2, hpBarHeight + (p+2)*2)
                    .fill({ color: 0x3388ff, alpha: 0.3 });
                // 보호막 테두리
                unit.shieldFrame
                    .rect(-hpBarWidth/2 - p, -p, hpBarWidth + p*2, hpBarHeight + p*2)
                    .stroke({ width: 3, color: 0x66aaff });
            } else {
                unit.shieldFrame.visible = false;
            }
        }
        
        // 프레임 색상 변경 (쉴드 있을 때)
        if (unit.hpFrame && !unit.hpFrame.destroyed) {
            unit.hpFrame.clear();
            const frameColor = shield > 0 ? 0x4488cc : 0x333333;
            unit.hpFrame
                .rect(-hpBarWidth/2 - hpBarPadding, -hpBarPadding, hpBarWidth + hpBarPadding*2, hpBarHeight + hpBarPadding*2)
                .fill(0x111111)
                .stroke({ width: 2, color: frameColor });
        }
        
        // 쉴드 배지 표시
        if (unit.shieldBadge) {
            if (shield > 0) {
                unit.shieldBadge.visible = true;
                if (unit.shieldText) {
                    unit.shieldText.text = `${shield}`;
                }
                // 쉴드 아이콘 펄스 애니메이션 (안전 체크 포함)
                if (unit.shieldIcon && !unit.shieldPulse) {
                    unit.shieldPulse = true;
                    const icon = unit.shieldIcon;
                    gsap.to({ val: 0 }, {
                        val: Math.PI * 2,
                        duration: 1,
                        repeat: -1,
                        ease: 'none',
                        onUpdate: function() {
                            if (!icon || icon.destroyed) {
                                this.kill();
                                return;
                            }
                            icon.alpha = 0.85 + Math.sin(this.targets()[0].val) * 0.15;
                        }
                    });
                }
            } else {
                unit.shieldBadge.visible = false;
                if (unit.shieldPulse) {
                    gsap.killTweensOf(unit.shieldIcon);
                    unit.shieldIcon.alpha = 1;
                    unit.shieldPulse = false;
                }
            }
        }
        
        // HP 텍스트 업데이트
        if (unit.hpText) {
            unit.hpText.text = `${unit.hp}`;
        }
    },
    
    updateUnitHPBar(unit) {
        // ★ HPBarSystem 모듈 사용 (우선)
        if (typeof HPBarSystem !== 'undefined') {
            if (!unit.hpBarData && !unit.hpBar) {
                HPBarSystem.create(unit);
            } else {
                HPBarSystem.update(unit);
            }
            return;
        }
        
        if (!unit.hpBar || !unit.hpFill) {
            this.createUnitHPBar(unit);
            return;
        }
        
        this.updateHPFill(unit);
    },
    
    updateAllHPBars() {
        // ★ HPBarSystem 모듈 사용 (우선)
        if (typeof HPBarSystem !== 'undefined') {
            HPBarSystem.updateAll(this.state.playerUnits, this.state.enemyUnits);
            return;
        }
        
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
            // ★ 플로터로 변경 (중앙 토스트 대신)
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.showBlockGain(this.state.hero, cardDef.block);
            }
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
                isEnemy: false,
                // ★ 타격 시 콜백 (브레이크 시스템용)
                onHit: options.onHit || null
            });
        } else {
            // 폴백: onHit 콜백 먼저 실행 후 대미지
            if (typeof options.onHit === 'function') {
                options.onHit(target);
            }
            this.dealDamage(target, damage);
        }
    },
    
    // ★★★ 갈고리 애니메이션 (베지어 곡선으로 던지고 당기기!) ★★★
    async heroHookAnimation(hero, target, damage, crashDamage = 2, options = {}) {
        console.log(`[Hook Animation] 갈고리! 대미지: ${damage}, 충돌 대미지: ${crashDamage}`);
        
        const heroPos = this.getCellCenter(hero.gridX, hero.gridZ);
        const targetPos = this.getCellCenter(target.gridX, target.gridZ);
        
        if (!heroPos || !targetPos) {
            // 폴백: onHit 먼저 실행 후 대미지
            if (typeof options.onHit === 'function') {
                options.onHit(target);
            }
            this.dealDamage(target, damage);
            return;
        }
        
        // ★ CombatEffects로 갈고리 VFX 실행 (onHit 콜백 전달)
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.hookEffect(heroPos, targetPos, target, damage, crashDamage, this, options.onHit);
        } else {
            // 폴백: onHit 먼저 실행 후 대미지
            if (typeof options.onHit === 'function') {
                options.onHit(target);
            }
            this.dealDamage(target, damage);
            if (typeof KnockbackSystem !== 'undefined') {
                await KnockbackSystem.hookPull(target, crashDamage);
            }
        }
    },
    
    // ★ 스피어 투척 애니메이션 (그리드 거리 기반 파워업!)
    async heroSpearThrowAnimation(hero, target, baseDamage, distanceBonus = 0, options = {}) {
        // 그리드 거리 계산
        const gridDistance = Math.abs(target.gridX - hero.gridX);
        const totalDamage = baseDamage + distanceBonus;
        console.log(`[Spear Animation] 그리드 거리: ${gridDistance}, 기본: ${baseDamage}, 보너스: ${distanceBonus}, 총: ${totalDamage}`);
        console.log(`[Spear Animation] 타겟 HP: ${target.hp} → ${target.hp - totalDamage}`);
        
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.spearThrowEffect(hero, target, baseDamage, distanceBonus, this, options.onHit);
        } else {
            // 폴백: onHit 먼저 실행 후 대미지
            if (typeof options.onHit === 'function') {
                options.onHit(target);
            }
            this.dealDamage(target, totalDamage);
        }
    },
    
    // ★★★ Flurry: 연속찌르기 애니메이션 ★★★
    async heroFlurryAnimation(hero, target, cardDef) {
        const posTarget = hero.container || hero.sprite;
        const scaleTarget = hero.sprite;
        if (!posTarget || !scaleTarget || !target.sprite) {
            // 애니메이션 없이 대미지만 처리
            for (let i = 0; i < 3; i++) {
                if (target.hp <= 0) break;
                if (typeof BreakSystem !== 'undefined') {
                    BreakSystem.onAttack(target, cardDef, 1, i);
                    this.createEnemyIntent(target);
                }
                this.dealDamage(target, cardDef.damage);
            }
            return;
        }
        
        const heroPos = this.getCellCenter(hero.gridX, hero.gridZ);
        const targetPos = this.getCellCenter(target.gridX, target.gridZ);
        
        // ★ 안전 체크: 좌표가 유효한지 확인
        if (!heroPos || !targetPos || isNaN(heroPos.x) || isNaN(targetPos.x)) {
            console.warn('[Flurry] 좌표 오류, 대미지만 처리');
            for (let i = 0; i < 3; i++) {
                if (target.hp <= 0) break;
                if (typeof BreakSystem !== 'undefined') {
                    BreakSystem.onAttack(target, cardDef, 1, i);
                    this.createEnemyIntent(target);
                }
                this.dealDamage(target, cardDef.damage);
            }
            return;
        }
        
        const baseScale = scaleTarget.scale?.x || hero.baseScale || 1;
        
        // 적 앞 위치 계산 (약간의 여백)
        const attackX = targetPos.x - 60;
        
        return new Promise(async (resolve) => {
            // ========================================
            // 1. 대쉬로 적 앞으로 이동
            // ========================================
            const dashTl = gsap.timeline();
            
            // 웅크리기
            dashTl.to(posTarget, { x: heroPos.x - 15, duration: 0.08, ease: 'power2.in' });
            dashTl.to(scaleTarget.scale, { x: baseScale * 0.85, y: baseScale * 1.15, duration: 0.08 }, '<');
            
            // 대쉬!
            dashTl.to(posTarget, { x: attackX, y: targetPos.y, duration: 0.12, ease: 'power4.out' });
            dashTl.to(scaleTarget.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.12 }, '<');
            
            // 착지
            dashTl.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.08, ease: 'power2.out' });
            
            await dashTl;
            
            // ========================================
            // 2. 3연속 찌르기
            // ========================================
            const stabOffsets = [
                { x: 20, rotation: 0.05 },   // 1번: 중앙
                { x: 25, rotation: -0.03 },  // 2번: 살짝 위
                { x: 30, rotation: 0.08 }    // 3번: 강하게
            ];
            
            for (let hitNum = 0; hitNum < 3; hitNum++) {
                if (target.hp <= 0) {
                    console.log(`[Flurry] 적 사망으로 중단 (${hitNum}/3)`);
                    break;
                }
                
                const stab = stabOffsets[hitNum];
                const stabTl = gsap.timeline();
                
                // 찌르기 동작
                stabTl.to(posTarget, { x: attackX + stab.x, duration: 0.04, ease: 'power2.out' });
                stabTl.to(scaleTarget, { rotation: stab.rotation, duration: 0.04 }, '<');
                stabTl.to(scaleTarget.scale, { x: baseScale * 1.05, y: baseScale * 0.95, duration: 0.04 }, '<');
                
                await stabTl;
                
                // 브레이크 시스템 연동
                if (typeof BreakSystem !== 'undefined') {
                    const breakResult = BreakSystem.onAttack(target, cardDef, 1, hitNum);
                    if (breakResult.broken) {
                        console.log(`[Flurry] 🔥 ${target.name || target.type} BROKEN!`);
                    }
                    this.createEnemyIntent(target);
                }
                
                // 대미지 적용
                console.log(`[Flurry] Hit ${hitNum + 1}/3 - damage: ${cardDef.damage}`);
                this.dealDamage(target, cardDef.damage);
                
                // 히트 이펙트
                if (typeof CombatEffects !== 'undefined' && target.sprite && !target.sprite.destroyed) {
                    CombatEffects.hitEffect(target.sprite);  // sprite 전달!
                    CombatEffects.screenShake(3 + hitNum * 2, 50);
                }
                
                // 복귀 동작 (마지막 제외)
                if (hitNum < 2) {
                    const returnTl = gsap.timeline();
                    returnTl.to(posTarget, { x: attackX - 5, duration: 0.05, ease: 'power2.in' });
                    returnTl.to(scaleTarget, { rotation: 0, duration: 0.05 }, '<');
                    returnTl.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.05 }, '<');
                    await returnTl;
                    
                    // 다음 찌르기 전 짧은 대기
                    await new Promise(r => setTimeout(r, 30));
                }
            }
            
            // ========================================
            // 3. 원위치 복귀
            // ========================================
            const returnTl = gsap.timeline();
            
            // 뒤로 살짝 물러남
            returnTl.to(posTarget, { x: attackX - 30, duration: 0.08, ease: 'power2.in' });
            returnTl.to(scaleTarget.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.08 }, '<');
            returnTl.to(scaleTarget, { rotation: 0, duration: 0.08 }, '<');
            
            // 원위치로 대쉬백
            returnTl.to(posTarget, { x: heroPos.x, y: heroPos.y, duration: 0.15, ease: 'power2.out' });
            returnTl.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.15 }, '<');
            
            await returnTl;
            
            console.log(`[Flurry] 완료!`);
            resolve();
        });
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
    
    async playSkillCard(cardId, cardDef) {
        const hero = this.state.hero;
        console.log(`[Skill] playSkillCard 호출, cardId: ${cardId}, moveBack: ${cardDef.moveBack}, hero: ${!!hero}`);
        
        // ★ 뒤로 이동 (Dodge 등) - heroMoveBack 함수로 자연스러운 애니메이션
        if (cardDef.moveBack && hero) {
            console.log(`[Skill] heroMoveBack 호출! distance: ${cardDef.moveBack}`);
            await this.heroMoveBack(cardDef.moveBack);
        }
        
        // ★ 블록 처리
        if (cardDef.block) {
            this.state.heroBlock += cardDef.block;
            hero.block = this.state.heroBlock;
            this.updateBlockUI();
            this.updateUnitHPBar(hero);
            
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.showBlockGain(hero, cardDef.block);
            }
        }
        
        // ★ 힐 처리
        if (cardDef.heal && hero) {
            hero.hp = Math.min(hero.hp + cardDef.heal, hero.maxHp);
            this.updateUnitHPBar(hero);
            this.updateHPUI();
            
            const heroPos = this.getUnitPosition(hero);
            if (typeof CombatEffects !== 'undefined' && heroPos) {
                CombatEffects.healEffect(heroPos.x, heroPos.y - 40, cardDef.heal);
            } else {
                this.showMessage(`+${cardDef.heal} HP`, 500);
            }
        }
    },
    
    // ★ 히어로 레인 이동 (스피어 투척 등) - meleeAttack 스타일 돌진!
    async heroLaneShift(hero, targetZ) {
        if (!hero || !hero.sprite) return;
        
        const currentZ = hero.gridZ;
        if (currentZ === targetZ) return;
        
        // 레인 이동 가능 여부 체크 (아군이 없어야 함)
        const isOccupied = this.state.playerUnits.some(u => 
            u !== hero && u.hp > 0 && u.gridX === hero.gridX && u.gridZ === targetZ
        );
        
        if (isOccupied) {
            this.showMessage('해당 위치에 아군이 있습니다!', 1000);
            return;
        }
        
        const startX = hero.container?.x || hero.sprite.x;
        const startY = hero.container?.y || hero.sprite.y;
        hero.gridZ = targetZ;
        const newPos = this.getCellCenter(hero.gridX, targetZ);
        const posTarget = hero.container || hero.sprite;
        const scaleTarget = hero.sprite;
        const baseScale = hero.baseScale || scaleTarget.scale.x;
        
        // 이동 방향 (위/아래)
        const moveDirection = targetZ > currentZ ? 1 : -1;
        
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            
            // ★ 산데비스탄 잔상: 윈드업 시작
            if (typeof SkillSystem !== 'undefined') {
                SkillSystem.createGhost(hero, 0.5, SkillSystem.GHOST_COLORS.BLUE);
            }
            
            // 1. 윈드업 - 뒤로 약간 빠지면서 웅크림
            tl.to(posTarget, { 
                x: startX - 10, 
                y: startY - moveDirection * 5,
                duration: 0.08 
            });
            tl.to(scaleTarget.scale, {
                x: baseScale * 0.85,
                y: baseScale * 1.15,
                duration: 0.08
            }, '<');
            
            // 2. 대시! (산데비스탄 트레일!) - ★ 더 강하게!
            let trailTimer = null;
            tl.call(() => {
                if (typeof SkillSystem !== 'undefined') {
                    trailTimer = SkillSystem.startSandevistanTrail(hero, 6, SkillSystem.GHOST_COLORS.BLUE, 18);
                }
            });
            tl.to(posTarget, {
                x: newPos.x,
                y: newPos.y,
                duration: 0.12,
                ease: 'power2.in'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale * 1.15,
                y: baseScale * 0.85,
                duration: 0.1
            }, '<');
            tl.call(() => {
                if (trailTimer && typeof SkillSystem !== 'undefined') {
                    SkillSystem.stopSandevistanTrail(trailTimer);
                }
            });
            
            // 3. 착지 - 약간의 바운스
            tl.to(scaleTarget.scale, {
                x: baseScale * 0.95,
                y: baseScale * 1.05,
                duration: 0.06,
                ease: 'power1.out'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.08,
                ease: 'elastic.out(1, 0.5)'
            });
        });
    },
    
    // ★ 히어로 뒤로 이동 (닷지) - 백점프 애니메이션
    async heroMoveBack(distance = 1) {
        console.log(`[Dodge] heroMoveBack 시작, distance: ${distance}`);
        const hero = this.state.hero;
        if (!hero || !hero.sprite) {
            console.log(`[Dodge] hero 또는 sprite 없음!`);
            return;
        }
        
        const newX = hero.gridX - distance;
        if (newX < 0) {
            // 뒤로 못가도 회피 모션은 보여줌
            await this.playDodgeAnimation(hero, false);
            this.showMessage('더 이상 뒤로 갈 수 없습니다!', 1000);
            return;
        }
        
        // 해당 위치에 아군이 있는지 체크
        const isOccupied = this.state.playerUnits.some(u => 
            u !== hero && u.hp > 0 && u.gridX === newX && u.gridZ === hero.gridZ
        );
        
        if (isOccupied) {
            await this.playDodgeAnimation(hero, false);
            this.showMessage('뒤에 아군이 있습니다!', 1000);
            return;
        }
        
        const oldX = hero.gridX;
        hero.gridX = newX;
        
        const newPos = this.getCellCenter(newX, hero.gridZ);
        await this.playDodgeAnimation(hero, true, newPos);
        
        console.log(`[Game] 히어로 백스텝: ${oldX} -> ${newX}`);
    },
    
    // ★ 닷지 애니메이션 (이동 여부와 관계없이 재생)
    async playDodgeAnimation(hero, moveBack = true, newPos = null) {
        console.log(`[Dodge] playDodgeAnimation 시작, moveBack: ${moveBack}, newPos:`, newPos);
        const posTarget = hero.container || hero.sprite;
        const scaleTarget = hero.sprite;
        if (!posTarget || !scaleTarget) {
            console.log(`[Dodge] posTarget 또는 scaleTarget 없음!`);
            return;
        }
        console.log(`[Dodge] 애니메이션 실행 중... posTarget:`, posTarget.x, posTarget.y);
        
        const baseScale = hero.baseScale || scaleTarget.scale.x;
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = moveBack && newPos ? newPos.x : startX - 30;  // 이동 안해도 살짝 뒤로
        const targetY = moveBack && newPos ? newPos.y : startY;
        
        // ★ 산데비스탄 잔상: 준비 자세
        if (typeof SkillSystem !== 'undefined') {
            SkillSystem.createGhost(hero, 0.5, SkillSystem.GHOST_COLORS.BLUE);
        }
        
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            
            // 1. 준비 자세 (앞으로 살짝 + 움츠림)
            tl.to(posTarget, {
                x: startX + 15,
                duration: 0.06,
                ease: 'power2.in'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale * 1.1,
                y: baseScale * 0.9,
                duration: 0.06
            }, '<');
            
            // 2. 백점프! (산데비스탄 트레일!) - ★ 더 강하게!
            let trailTimer = null;
            tl.call(() => {
                if (typeof SkillSystem !== 'undefined') {
                    trailTimer = SkillSystem.startSandevistanTrail(hero, 7, SkillSystem.GHOST_COLORS.BLUE, 20);
                }
            });
            tl.to(posTarget, {
                x: targetX,
                y: startY - 50,  // 높이 점프
                duration: 0.2,
                ease: 'power2.out'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale * 0.9,
                y: baseScale * 1.15,  // 늘어남
                duration: 0.2
            }, '<');
            
            // 점프 중 회전 효과
            tl.to(scaleTarget, {
                rotation: -0.15,  // 살짝 뒤로 젖힘
                duration: 0.15
            }, '<');
            
            // 3. 착지
            tl.call(() => {
                if (trailTimer && typeof SkillSystem !== 'undefined') {
                    SkillSystem.stopSandevistanTrail(trailTimer);
                }
                // 착지 잔상
                if (typeof SkillSystem !== 'undefined') {
                    SkillSystem.createGhost(hero, 0.4, SkillSystem.GHOST_COLORS.BLUE);
                }
            });
            tl.to(posTarget, {
                y: targetY,
                duration: 0.15,
                ease: 'bounce.out'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale * 1.05,
                y: baseScale * 0.95,
                duration: 0.08
            }, '<');
            tl.to(scaleTarget, {
                rotation: 0,
                duration: 0.1
            }, '<');
            
            // 4. 복귀
            tl.to(scaleTarget.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.12,
                ease: 'elastic.out(1, 0.5)'
            });
            
            // 착지 먼지
            tl.call(() => {
                this.createLandingDust(targetX, targetY);
            }, null, '-=0.15');
            
            // 이동 안한 경우 원위치
            if (!moveBack) {
                tl.to(posTarget, {
                    x: startX,
                    duration: 0.1,
                    ease: 'power2.out'
                }, '-=0.1');
            }
        });
    },
    
    // 닷지 잔상 이펙트
    createDodgeAfterimage(hero) {
        if (!this.app || !hero.sprite) return;
        
        const pos = hero.sprite.getGlobalPosition();
        
        // 3개의 잔상
        for (let i = 0; i < 3; i++) {
            const afterimage = new PIXI.Graphics();
            afterimage.rect(-20, -60, 40, 60);
            afterimage.fill({ color: 0x44aaff, alpha: 0.4 - i * 0.1 });
            afterimage.x = pos.x + i * 15;
            afterimage.y = pos.y;
            afterimage.zIndex = 90;
            this.containers.effects.addChild(afterimage);
            
            gsap.to(afterimage, {
                x: afterimage.x - 40,
                alpha: 0,
                duration: 0.3,
                delay: i * 0.03,
                ease: 'power2.out',
                onComplete: () => {
                    if (!afterimage.destroyed) afterimage.destroy();
                }
            });
        }
        
        // 스피드 라인
        for (let i = 0; i < 5; i++) {
            const line = new PIXI.Graphics();
            const lineY = pos.y - 50 + Math.random() * 40;
            line.moveTo(pos.x - 10, lineY);
            line.lineTo(pos.x + 60 + Math.random() * 30, lineY);
            line.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
            line.zIndex = 95;
            this.containers.effects.addChild(line);
            
            gsap.to(line, {
                x: -80,
                alpha: 0,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    if (!line.destroyed) line.destroy();
                }
            });
        }
    },
    
    // ★ 헬퍼: 유닛 화면 위치 가져오기 (container 우선)
    getUnitPosition(unit) {
        if (!unit) return null;
        const target = unit.container || unit.sprite;
        return target ? { x: target.x, y: target.y } : null;
    },
    
    // ★ 대미지 계산 (쉴드 고려, HP 변경 없이)
    calculateDamage(target, amount) {
        if (!target) return 0;
        const block = target.block || 0;
        // 쉴드를 넘어서 실제 HP에 가해지는 대미지
        return Math.max(0, amount - block);
    },
    
    // ★ 플로터 없이 대미지 적용 (스피어 등 분리 플로터용)
    async applyDamageWithoutFloater(target, amount) {
        if (!target || target.hp <= 0) return;
        
        // 쉴드(block) 먼저 감소
        let remainingDamage = amount;
        const block = target.block || 0;
        let absorbedByShield = 0;
        
        if (block > 0) {
            if (block >= remainingDamage) {
                absorbedByShield = remainingDamage;
                target.block -= remainingDamage;
                remainingDamage = 0;
            } else {
                absorbedByShield = block;
                remainingDamage -= block;
                target.block = 0;
                
                // ★ 실드 완전 파괴 연출!
                if (typeof ShieldVFX !== 'undefined') {
                    ShieldVFX.breakAtUnit(target, block);
                }
            }
            
            if (typeof HPBarSystem !== 'undefined') {
                HPBarSystem.showShieldHit(target, absorbedByShield);
            }
        }
        
        // HP 감소
        if (remainingDamage > 0) {
            target.hp -= remainingDamage;
        }
        
        // HP bar 업데이트
        this.updateUnitHPBar(target);
        
        // 피격 이펙트
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
    },
    
    async dealDamage(target, amount) {
        if (!target || target.hp <= 0) return;
        
        // ★ 쉴드(block)가 있으면 쉴드 먼저 감소
        let remainingDamage = amount;
        const block = target.block || 0;
        let absorbedByShield = 0;
        
        if (block > 0) {
            if (block >= remainingDamage) {
                absorbedByShield = remainingDamage;
                target.block -= remainingDamage;
                remainingDamage = 0;
            } else {
                absorbedByShield = block;
                remainingDamage -= block;
                target.block = 0;
                
                // ★ 실드 완전 파괴 연출!
                if (typeof ShieldVFX !== 'undefined') {
                    ShieldVFX.breakAtUnit(target, block);
                }
            }
            
            // ★ 쉴드 피격 연출
            if (typeof HPBarSystem !== 'undefined') {
                HPBarSystem.showShieldHit(target, absorbedByShield);
            }
        }
        
        // ★ 사망 전 HP 기록 (오버킬 계산용)
        const hpBeforeDamage = target.hp;
        
        // 남은 대미지로 HP 감소 (마이너스 가능!)
        if (remainingDamage > 0) {
            target.hp -= remainingDamage;
        }
        
        // 실제 HP 피해가 있을 때만 데미지 표시
        if (remainingDamage > 0) {
            this.showDamage(target, remainingDamage);
        }
        
        // Update HP bar (쉴드 변화도 반영)
        this.updateUnitHPBar(target);
        
        // Hit effect (스프라이트 알파만 변경, 위치는 건드리지 않음)
        if (target.sprite && !target.sprite.destroyed) {
            gsap.to(target.sprite, {
                alpha: 0.5,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onUpdate: function() {
                    // ★ 애니메이션 중 파괴 체크
                    if (!target.sprite || target.sprite.destroyed) {
                        this.kill();
                    }
                }
            });
        }
        
        if (target.hp <= 0) {
            // ★★★ 오버킬 체크! HP가 maxHp의 10% 이상 마이너스면 고어 사망!
            const maxHp = target.maxHp || target.originalHp || 10;
            const overkillDamage = Math.abs(target.hp); // 마이너스 HP = 오버킬 대미지
            const overkillThreshold = maxHp * 0.1; // 10% 기준
            
            if (overkillDamage >= overkillThreshold) {
                target._goreDeath = true;
                target._overkillDamage = overkillDamage;
                console.log(`[Overkill] 💀 ${target.type}: ${overkillDamage.toFixed(1)} 오버킬! (기준: ${overkillThreshold.toFixed(1)})`);
            }
            
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
            
            // ★★★ 스킬 실행 (폴백 없음! 무조건 카드에 맞는 스킬 실행!) ★★★
            console.log(`[Game] 스킬 실행: ${cardId}, hits=${hits}`);
            
            // 1순위: SkillSystem (JSON 기반)
            const skillData = typeof SkillSystem !== 'undefined' && SkillSystem.getSkill(cardId);
            
            if (skillData) {
                console.log(`[Game] SkillSystem.execute: ${cardId}`);
                await SkillSystem.execute(cardId, hero, targetEnemy, {
                    cardDef,
                    damage: cardDef.damage,
                    knockback: cardDef.knockback || 0,
                    isEnemy: false
                });
            } 
            // 2순위: UnitCombat 직접 매핑 (폴백 아님! 카드별 전용 함수!)
            else if (typeof UnitCombat !== 'undefined') {
                console.log(`[Game] UnitCombat 직접 실행: ${cardId}`);
                
                // ★ 카드 ID에 맞는 공격 함수 직접 호출!
                switch (cardId) {
                    case 'flurry':
                        // 연속찌르기: flurryAttack × hits
                        for (let hitNum = 0; hitNum < hits; hitNum++) {
                            if (targetEnemy.hp <= 0) break;
                            if (typeof BreakSystem !== 'undefined') {
                                BreakSystem.onAttack(targetEnemy, cardDef, 1, hitNum);
                            }
                            await UnitCombat.flurryAttack(hero, targetEnemy, cardDef.damage, { isEnemy: false });
                            if (hitNum < hits - 1) await new Promise(r => setTimeout(r, 50));
                        }
                        break;
                    
                    case 'rush':
                        // ★ 돌진: 밀어붙이기 × hits (매 히트마다 넉백!)
                        for (let hitNum = 0; hitNum < hits; hitNum++) {
                            if (targetEnemy.hp <= 0) break;
                            if (typeof BreakSystem !== 'undefined') {
                                BreakSystem.onAttack(targetEnemy, cardDef, 1, hitNum);
                            }
                            // 짧은 타격
                            await UnitCombat.bashAttack(hero, targetEnemy, cardDef.damage, { 
                                isEnemy: false,
                                knockback: cardDef.knockbackPerHit || 1
                            });
                            // 각 히트 후 대기
                            if (hitNum < hits - 1) await new Promise(r => setTimeout(r, 150));
                        }
                        break;
                        
                    case 'bash':
                        // 강타: bashAttack
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(targetEnemy, cardDef, 1, 0);
                        }
                        await UnitCombat.bashAttack(hero, targetEnemy, cardDef.damage, { isEnemy: false });
                        break;
                        
                    case 'cleave':
                        // 휘두르기: 강한 일격 (bash 스타일)
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(targetEnemy, cardDef, 1, 0);
                        }
                        await UnitCombat.bashAttack(hero, targetEnemy, cardDef.damage, { isEnemy: false });
                        break;
                        
                    case 'strike':
                    default:
                        // 기본 타격: meleeAttack
                        for (let hitNum = 0; hitNum < hits; hitNum++) {
                            if (targetEnemy.hp <= 0) break;
                            if (typeof BreakSystem !== 'undefined') {
                                BreakSystem.onAttack(targetEnemy, cardDef, 1, hitNum);
                            }
                            await UnitCombat.meleeAttack(hero, targetEnemy, cardDef.damage, { isEnemy: false });
                            if (hitNum < hits - 1) await new Promise(r => setTimeout(r, 100));
                        }
                        break;
                }
            }
            // 3순위: 최소 대미지 처리 (안전망)
            else {
                console.error(`[Game] 스킬 시스템 없음! 대미지만 처리: ${cardId}`);
                for (let hitNum = 0; hitNum < hits; hitNum++) {
                    if (targetEnemy.hp <= 0) break;
                    this.dealDamage(targetEnemy, cardDef.damage);
                }
            }
            
            // 넉백 처리
            if (cardDef.knockback && targetEnemy.hp > 0 && typeof KnockbackSystem !== 'undefined') {
                KnockbackSystem.knockback(targetEnemy, 1, cardDef.knockback);
            }
            
            console.log(`[Game] 스킬 완료: ${cardId}`);
            
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
            
            // ★ 스피어 투척 (거리 보너스가 있는 원거리 공격, 다른 레인 타겟 가능!)
            if (cardDef.distanceBonus) {
                // 다른 레인의 적이면 먼저 레인 이동
                if (targetEnemy.gridZ !== hero.gridZ) {
                    console.log(`[Game] 스피어 - 레인 이동: Z ${hero.gridZ} → ${targetEnemy.gridZ}`);
                    await this.heroLaneShift(hero, targetEnemy.gridZ);
                }
                
                // 거리 계산 (X축 거리 기반)
                const distance = Math.abs(targetEnemy.gridX - hero.gridX);
                const distanceBonus = cardDef.distanceBonus * distance;
                const baseDamage = cardDef.damage;
                
                console.log(`[Game] 스피어 투척! 거리: ${distance}, 기본 대미지: ${baseDamage}, 거리 보너스: ${distanceBonus}`);
                
                // 스피어 발사 애니메이션 (★ 브레이크는 타격 시점에 처리!)
                const gameRef = this;
                await this.heroSpearThrowAnimation(hero, targetEnemy, baseDamage, distanceBonus, {
                    onHit: (hitTarget) => {
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(hitTarget, cardDef, 1, 0);
                            gameRef.createEnemyIntent(hitTarget);
                        }
                    }
                });
            }
            // ★★★ 갈고리 (Hook) - 적을 앞으로 당김! ★★★
            else if (cardDef.pull) {
                console.log(`[Game] 갈고리! 대상: ${targetEnemy.type}, 위치: ${targetEnemy.gridX}`);
                
                // 다른 레인의 적이면 먼저 레인 이동
                if (targetEnemy.gridZ !== hero.gridZ) {
                    console.log(`[Game] 갈고리 - 레인 이동: Z ${hero.gridZ} → ${targetEnemy.gridZ}`);
                    await this.heroLaneShift(hero, targetEnemy.gridZ);
                }
                
                // ★ 갈고리 애니메이션 실행! (브레이크는 타격 시점에 처리)
                const gameRef = this;
                await this.heroHookAnimation(hero, targetEnemy, cardDef.damage, cardDef.crashDamage || 2, {
                    onHit: (hitTarget) => {
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(hitTarget, cardDef, 1, 0);
                            gameRef.createEnemyIntent(hitTarget);
                        }
                    }
                });
            }
            // 십자가 패턴 처리 (Fireball 등)
            else if (cardDef.aoePattern === 'cross') {
                const crossTargets = this.getEnemiesInCrossAoe(targetEnemy.gridX, targetEnemy.gridZ, 1);
                const gameRef = this;
                
                // 파이어볼 발사 (★ 브레이크는 타격 시점에 처리!)
                await this.heroRangedAnimation(hero, targetEnemy, cardDef.damage, {
                    createZone: cardDef.createZone || null,
                    // ★ 타격 시점에 브레이크 시스템 호출!
                    onHit: (hitTarget) => {
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(hitTarget, cardDef, 1, 0);
                            gameRef.createEnemyIntent(hitTarget);
                        }
                    }
                });
                
                // 모든 십자가 영역의 적에게 대미지
                for (let i = 0; i < crossTargets.length; i++) {
                    const target = crossTargets[i];
                    if (target !== targetEnemy && target.hp > 0) {
                        // ★ 추가 타겟도 대미지 시점에 브레이크 처리
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(target, cardDef, 1, i + 1);
                            this.createEnemyIntent(target);
                        }
                        this.dealDamage(target, cardDef.damage);
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
                const gameRef = this;
                
                // 원거리 발사 (★ 브레이크는 타격 시점에 처리!)
                await this.heroRangedAnimation(hero, targetEnemy, cardDef.damage, {
                    createZone: cardDef.createZone || null,
                    // ★ 타격 시점에 브레이크 시스템 호출!
                    onHit: (hitTarget) => {
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(hitTarget, cardDef, 1, 0);
                            gameRef.createEnemyIntent(hitTarget);
                        }
                    }
                });
                
                // Deal damage to additional targets in AOE
                for (let i = 0; i < targetsInAoe.length; i++) {
                    const target = targetsInAoe[i];
                    if (target !== targetEnemy && target.hp > 0) {
                        // ★ 추가 타겟도 대미지 시점에 브레이크 처리
                        if (typeof BreakSystem !== 'undefined') {
                            BreakSystem.onAttack(target, cardDef, 1, i + 1);
                            this.createEnemyIntent(target);
                        }
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
            // ★ 플로터로 변경 (중앙 토스트 대신)
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.showBlockGain(this.state.hero, cardDef.block);
            }
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
            await this.playSkillCard(cardId, cardDef);
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
            state: 'idle',
            // ★ 고어 연출용 텍스처 경로 저장
            textureUrl: unitDef.sprite ? (typeof DDOOConfig !== 'undefined' ? DDOOConfig.getImagePath(unitDef.sprite) : `image/${unitDef.sprite}`) : null,
            spriteWidth: 80,
            spriteHeight: 120
        };
        
        if (team === 'player') {
            this.state.playerUnits.push(unit);
        } else {
            this.state.enemyUnits.push(unit);
            
            // ★ 적 클릭 시 약점 정보 표시
            if (sprite) {
                sprite.eventMode = 'static';
                sprite.cursor = 'pointer';
                sprite.on('pointerdown', () => {
                    if (typeof MonsterPatterns !== 'undefined') {
                        MonsterPatterns.showWeaknessPopup(unit);
                    }
                });
            }
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
        // ★ 유닛 정의에서 retreatBeforeAttack 체크
        const unitDef = this.unitTypes[summon.type] || {};
        if (unitDef.retreatBeforeAttack) {
            await this.summonRetreatBeforeAttack(summon, unitDef.retreatDistance || 1);
        }
        
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
    
    // ★ 소환수 후퇴 후 공격 (닷지 스타일)
    async summonRetreatBeforeAttack(summon, distance = 1) {
        console.log(`[Summon Retreat] summonRetreatBeforeAttack 호출`, {
            type: summon?.type,
            hasSprite: !!summon?.sprite,
            hasContainer: !!summon?.container,
            gridX: summon?.gridX,
            gridZ: summon?.gridZ
        });
        
        if (!summon || !summon.sprite) {
            console.log(`[Summon Retreat] summon 또는 sprite 없음!`);
            return;
        }
        
        const newX = summon.gridX - distance;
        
        // 뒤로 갈 수 있는지 체크 (그리드 범위 & 아군 충돌)
        if (newX < 0) {
            // 뒤로 못가도 후퇴 모션은 보여줌
            await this.playSummonRetreatAnimation(summon, false);
            return;
        }
        
        const isOccupied = this.state.playerUnits.some(u => 
            u !== summon && u.hp > 0 && u.gridX === newX && u.gridZ === summon.gridZ
        );
        
        if (isOccupied) {
            await this.playSummonRetreatAnimation(summon, false);
            return;
        }
        
        // 실제 이동
        const oldX = summon.gridX;
        summon.gridX = newX;
        const newPos = this.getCellCenter(newX, summon.gridZ);
        await this.playSummonRetreatAnimation(summon, true, newPos);
        
        console.log(`[Summon] ${summon.type} 후퇴: ${oldX} → ${newX}`);
    },
    
    // ★ 소환수 후퇴 애니메이션 (부드러운 이동)
    async playSummonRetreatAnimation(summon, actualMove = true, newPos = null) {
        const posTarget = summon.container || summon.sprite;
        if (!posTarget) return;
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = actualMove && newPos ? newPos.x : startX - 50;
        const targetY = actualMove && newPos ? newPos.y : startY;
        
        return new Promise(resolve => {
            // 부드럽게 뒤로 이동
            gsap.to(posTarget, {
                x: targetX,
                y: targetY,
                duration: 0.25,
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    // ★ (레거시) 소환수 후퇴 애니메이션 - 점프 스타일
    async playSummonRetreatAnimationJump(summon, actualMove = true, newPos = null) {
        const posTarget = summon.container || summon.sprite;
        const scaleTarget = summon.sprite;
        
        if (!posTarget || !scaleTarget || !scaleTarget.scale) return;
        
        const baseScale = summon.baseScale || scaleTarget.scale.x || 1;
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = actualMove && newPos ? newPos.x : startX - 40;
        const targetY = actualMove && newPos ? newPos.y : startY;
        
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            
            tl.to(posTarget, {
                x: startX + 15,
                duration: 0.1
            });
            tl.to(scaleTarget.scale, {
                x: baseScale * 0.8,
                y: baseScale * 1.2,
                duration: 0.1
            }, '<');
            
            tl.to(posTarget, {
                x: targetX,
                y: targetY - 40,
                duration: 0.2,
                ease: 'power2.out'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale * 1.15,
                y: baseScale * 0.8,
                duration: 0.15
            }, '<');
            
            tl.to(posTarget, {
                y: targetY,
                duration: 0.12,
                ease: 'bounce.out'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.1,
                ease: 'elastic.out(1, 0.5)'
            }, '<');
        });
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
        // ★ AI 설정에 따른 후퇴 처리
        const ai = this.getEnemyAI(enemy);
        if (ai.retreatBeforeAttack) {
            await this.enemyRetreatBeforeAttack(enemy, ai.retreatDistance || 1);
        }
        
        if (typeof UnitCombat !== 'undefined') {
            // 궁수 타입이면 화살 VFX 사용
            const isArcher = ai.attackType === 'ranged';
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
    
    // ★ 적 AI 설정 가져오기
    getEnemyAI(enemy) {
        if (typeof MonsterPatterns !== 'undefined' && MonsterPatterns.loaded) {
            return MonsterPatterns.getAI(enemy.type);
        }
        // 폴백 기본값
        return {
            attackType: enemy.range > 1 ? 'ranged' : 'melee',
            preferredDistance: 1,
            retreatBeforeAttack: false
        };
    },
    
    // ★ 적 후퇴 로직 (AI 기반) - 점프 애니메이션 포함
    async enemyRetreatBeforeAttack(enemy, distance = 1) {
        if (!enemy || !enemy.sprite) return;
        
        // 뒤로 이동할 수 있는지 확인 (gridX + distance)
        const newX = enemy.gridX + distance;
        const maxX = this.arena.width - 1;
        
        // 맵 범위 체크 & 해당 위치에 다른 유닛이 없는지 체크
        const isOccupied = this.state.enemyUnits.some(e => 
            e !== enemy && e.hp > 0 && e.gridX === newX && e.gridZ === enemy.gridZ
        );
        
        if (newX <= maxX && !isOccupied) {
            const oldX = enemy.gridX;
            enemy.gridX = newX;
            
            const newPos = this.getCellCenter(newX, enemy.gridZ);
            const posTarget = enemy.container || enemy.sprite;
            const scaleTarget = enemy.sprite;
            const baseScale = enemy.baseScale || scaleTarget.scale.x;
            const startY = posTarget.y;
            
            await new Promise(resolve => {
                const tl = gsap.timeline({ onComplete: resolve });
                
                // 1. 준비 자세 (살짝 움츠림)
                tl.to(scaleTarget.scale, {
                    x: baseScale * 0.9,
                    y: baseScale * 1.1,
                    duration: 0.08,
                    ease: 'power1.in'
                });
                
                // 2. 점프하면서 뒤로 이동
                tl.to(posTarget, {
                    x: newPos.x,
                    y: startY - 40,  // 위로 점프
                    duration: 0.15,
                    ease: 'power2.out'
                }, '<0.05');
                
                tl.to(scaleTarget.scale, {
                    x: baseScale * 1.05,
                    y: baseScale * 0.95,
                    duration: 0.15
                }, '<');
                
                // 3. 착지
                tl.to(posTarget, {
                    y: newPos.y,
                    duration: 0.12,
                    ease: 'bounce.out'
                });
                
                tl.to(scaleTarget.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.1,
                    ease: 'power2.out'
                }, '<0.05');
                
                // 4. 먼지 이펙트 (착지 시)
                tl.call(() => {
                    this.createLandingDust(newPos.x, newPos.y);
                }, null, '-=0.05');
            });
            
            console.log(`[AI] ${enemy.type} 백스텝: ${oldX} -> ${newX}`);
        }
    },
    
    // 착지 먼지 이펙트
    createLandingDust(x, y) {
        if (!this.app) return;
        
        for (let i = 0; i < 5; i++) {
            const dust = new PIXI.Graphics();
            dust.circle(0, 0, 3 + Math.random() * 3);
            dust.fill({ color: 0xccbbaa, alpha: 0.6 });
            dust.x = x + (Math.random() - 0.5) * 30;
            dust.y = y;
            dust.zIndex = 50;
            this.containers.effects.addChild(dust);
            
            gsap.to(dust, {
                x: dust.x + (Math.random() - 0.5) * 40,
                y: y - 20 - Math.random() * 20,
                alpha: 0,
                duration: 0.4 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    if (!dust.destroyed) dust.destroy();
                }
            });
        }
    },
    
    // Deal damage to any target (hero or summon)
    dealDamageToTarget(target, damage) {
        // ★ 이미 죽은 타겟이면 무시
        if (!target || target.hp <= 0) return;
        
        // ★ 쉴드(block) 처리
        let blocked = 0;
        
        if (target.isHero && this.state.heroBlock > 0) {
            // 히어로는 state.heroBlock 사용
            const prevBlock = this.state.heroBlock;
            blocked = Math.min(this.state.heroBlock, damage);
            this.state.heroBlock -= blocked;
            target.block = this.state.heroBlock; // 동기화
            damage -= blocked;
            this.updateBlockUI();
            
            // ★ 히어로 실드 완전 파괴 연출
            if (prevBlock > 0 && this.state.heroBlock === 0 && typeof ShieldVFX !== 'undefined') {
                ShieldVFX.breakAtUnit(target, prevBlock);
            }
        } else if (target.block && target.block > 0) {
            // 일반 유닛은 target.block 사용
            const prevBlock = target.block;
            blocked = Math.min(target.block, damage);
            target.block -= blocked;
            damage -= blocked;
            
            // ★ 유닛 실드 완전 파괴 연출
            if (prevBlock > 0 && target.block === 0 && typeof ShieldVFX !== 'undefined') {
                ShieldVFX.breakAtUnit(target, prevBlock);
            }
        }
        
        if (blocked > 0) {
            // ★ 쉴드 피격 연출
            if (typeof HPBarSystem !== 'undefined') {
                HPBarSystem.showShieldHit(target, blocked);
            }
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
        // ★ CombatEffects.showDamageNumber 로 통합 (시인성 좋은 폰트 하나만 사용)
        const pos = this.getUnitPosition(unit);
        if (typeof CombatEffects !== 'undefined' && pos) {
            CombatEffects.showDamageNumber(pos.x, pos.y - 40, damage, 'normal');
        }
    },
    
    killUnit(unit) {
        console.log(`[Game] ${unit.type} died!`);
        
        // ★ 플로터는 딜레이 후 정리 (사망 대미지 표시 시간 확보)
        const unitPos = this.getUnitPosition(unit);
        if (unitPos && typeof CombatEffects !== 'undefined') {
            setTimeout(() => {
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.cleanupFloatersInArea(unitPos.x, unitPos.y, 150);
                }
            }, 800);  // 0.8초 후 정리 (플로터 애니메이션 끝난 후)
        }
        
        // ★★★ 모든 gsap 애니메이션 먼저 정리 ★★★
        try {
            // 스프라이트 관련 애니메이션 정리
            if (unit.sprite && !unit.sprite.destroyed) {
                gsap.killTweensOf(unit.sprite);
                if (unit.sprite.scale) gsap.killTweensOf(unit.sprite.scale);
            }
            // 컨테이너 관련 애니메이션 정리
            if (unit.container && !unit.container.destroyed) {
                gsap.killTweensOf(unit.container);
                if (unit.container.scale) gsap.killTweensOf(unit.container.scale);
            }
            // 브리딩 애니메이션 정리
            if (unit.breathingTween) {
                unit.breathingTween.kill();
                unit.breathingTween = null;
            }
        } catch(e) {}
        
        // ★ 차징 이펙트 정리
        this.clearChargingEffect(unit);
        
        // ★ 브레이크 시스템 정리 (통합 정리 함수 사용)
        if (typeof BreakSystem !== 'undefined' && typeof BreakSystem.cleanupUnit === 'function') {
            BreakSystem.cleanupUnit(unit);
        }
        
        // ★ HP 바 삭제 연출 (페이드아웃 + 축소)
        if (unit.hpBar && !unit.hpBar.destroyed) {
            const hpBar = unit.hpBar;
            // 기존 HP 바 애니메이션 정리
            try {
                gsap.killTweensOf(hpBar);
                if (hpBar.scale) gsap.killTweensOf(hpBar.scale);
            } catch(e) {}
            
            gsap.to(hpBar, {
                alpha: 0,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    try {
                        if (hpBar && !hpBar.destroyed) {
                            hpBar.destroy({ children: true });
                        }
                    } catch(e) {}
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
            // 기존 인텐트 애니메이션 정리
            try {
                gsap.killTweensOf(intent);
                if (intent.scale) gsap.killTweensOf(intent.scale);
            } catch(e) {}
            
            gsap.to(intent, {
                alpha: 0,
                y: intent.y - 20,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    try {
                        if (intent && !intent.destroyed) {
                            intent.destroy({ children: true });
                        }
                    } catch(e) {}
                }
            });
            unit.intentContainer = null;
        }
        
        // ★ 사망 연출
        // 새 구조: container가 최상위, sprite는 container의 자식
        const posTarget = unit.container || unit.sprite;
        const scaleTarget = unit.sprite;
        
        if (posTarget && !posTarget.destroyed) {
            const isEnemy = unit.team === 'enemy';
            
            // 글로벌 좌표로 사망 위치 계산
            const globalPos = posTarget.getGlobalPosition ? posTarget.getGlobalPosition() : { x: posTarget.x, y: posTarget.y };
            const deathX = globalPos.x;
            const deathY = globalPos.y;
            
            // ★★★ 오버킬 시 고어 연출! ★★★
            const isGoreDeath = unit._goreDeath && typeof GoreVFX !== 'undefined';
            
            if (isGoreDeath) {
                console.log(`[Gore] 🩸 ${unit.type} 고어 사망 연출!`);
                
                // ★★★ 모든 GSAP 트윈 철저히 정리! (에러 방지) ★★★
                try {
                    // 컨테이너 & 스프라이트 & 스케일 모든 트윈 정리
                    if (unit.container) {
                        gsap.killTweensOf(unit.container);
                        if (unit.container.scale) gsap.killTweensOf(unit.container.scale);
                    }
                    if (unit.sprite) {
                        gsap.killTweensOf(unit.sprite);
                        if (unit.sprite.scale) gsap.killTweensOf(unit.sprite.scale);
                    }
                    if (posTarget) gsap.killTweensOf(posTarget);
                    if (scaleTarget) gsap.killTweensOf(scaleTarget);
                    if (scaleTarget?.scale) gsap.killTweensOf(scaleTarget.scale);
                    
                    // HP바, 인텐트 트윈도 정리
                    if (unit.hpBar) gsap.killTweensOf(unit.hpBar);
                    if (unit.intentContainer) gsap.killTweensOf(unit.intentContainer);
                    
                    // 브리딩 애니메이션 정리
                    if (unit.breathingTween) {
                        unit.breathingTween.kill();
                        unit.breathingTween = null;
                    }
                } catch(e) {
                    console.log('[Gore] GSAP cleanup error:', e);
                }
                
                // 스프라이트 크기 계산
                const spriteWidth = unit.spriteWidth || (scaleTarget?.width) || 80;
                const spriteHeight = unit.spriteHeight || (scaleTarget?.height) || 120;
                
                // 스프라이트 이미지 경로
                let imgSrc = unit.textureUrl || null;
                
                // 스프라이트 즉시 숨김 (고어 VFX가 대신함)
                if (posTarget && !posTarget.destroyed) {
                    posTarget.alpha = 0;
                    posTarget.visible = false;
                }
                
                // ★★★ 산산조각(shatter) 연출! + meat.png 조각도 함께! ★★★
                GoreVFX.shatterDismember(deathX, deathY - spriteHeight / 3, {
                    width: spriteWidth,
                    height: spriteHeight,
                    duration: 2000,
                    imgSrc: imgSrc
                });
                
                // meat.png 조각도 추가!
                GoreVFX.addMeatChunks(deathX, deathY - spriteHeight / 3, {
                    width: spriteWidth,
                    height: spriteHeight
                });
                
                // 강한 화면 흔들림!
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.screenShake(15, 250);
                    CombatEffects.screenFlash('#ff0000', 200, 0.6);
                }
                
                // 피 분출!
                GoreVFX.bloodSplatter(deathX, deathY, {
                    count: 50,
                    speed: 400,
                    size: 10,
                    duration: 1500
                });
                
                // ★ 컨테이너를 null로 먼저 설정 (다른 곳에서 참조 방지)
                const containerToDestroy = unit.container;
                const spriteToDestroy = unit.sprite;
                unit.container = null;
                unit.sprite = null;
                
                // ★ 딜레이 후 실제 파괴 (진행 중인 트윈 완료 대기)
                setTimeout(() => {
                    try {
                        if (containerToDestroy && !containerToDestroy.destroyed) {
                            gsap.killTweensOf(containerToDestroy);
                            if (containerToDestroy.scale) gsap.killTweensOf(containerToDestroy.scale);
                            containerToDestroy.destroy({ children: true });
                        }
                        if (spriteToDestroy && !spriteToDestroy.destroyed) {
                            gsap.killTweensOf(spriteToDestroy);
                            if (spriteToDestroy.scale) gsap.killTweensOf(spriteToDestroy.scale);
                        }
                    } catch(e) {
                        console.log('[Gore] Destroy error:', e);
                    }
                }, 100);
                
                // 플래그 정리
                delete unit._goreDeath;
                delete unit._overkillDamage;
                
            } else {
                // ★ 일반 사망 연출 (기존 로직)
                
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
                
                // 사망 플래그 설정 (중복 애니메이션 방지)
                unit.isDying = true;
                
                gsap.timeline()
                    // 피격 경직 (스프라이트 틴트)
                    .call(() => {
                        if (scaleTarget && !scaleTarget.destroyed) scaleTarget.tint = 0xffffff;
                    })
                    .to({}, { duration: 0.05 })
                    // 빨갛게 변하면서 (스프라이트 틴트)
                    .call(() => {
                        if (scaleTarget && !scaleTarget.destroyed) scaleTarget.tint = isEnemy ? 0xff0000 : 0x888888;
                    })
                    // 위로 살짝 튀어오름 (컨테이너 위치)
                    .to(posTarget, { y: startY - 20, duration: 0.1, ease: 'power2.out' })
                    .call(() => {
                        if (scaleTarget && !scaleTarget.destroyed && scaleTarget.scale) {
                            gsap.to(scaleTarget.scale, { x: baseScale * 1.2, y: baseScale * 0.8, duration: 0.1 });
                        }
                    }, null, '<')
                    // 아래로 쓰러짐 (컨테이너 위치)
                    .to(posTarget, { 
                        y: startY + 30,
                        duration: 0.25, 
                        ease: 'power3.in' 
                    })
                    .call(() => {
                        if (scaleTarget && !scaleTarget.destroyed) {
                            if (scaleTarget.scale) gsap.to(scaleTarget.scale, { x: baseScale * 0.6, y: baseScale * 1.3, duration: 0.2 });
                            gsap.to(scaleTarget, { rotation: isEnemy ? 0.3 : -0.3, duration: 0.2 });
                        }
                    }, null, '<')
                    // 페이드 아웃 (전체 컨테이너)
                    .to(posTarget, { 
                        alpha: 0, 
                        duration: 0.3,
                        onComplete: () => {
                            try {
                                // 컨테이너 전체 삭제 (sprite, hpBar, intentContainer 포함)
                                if (posTarget && !posTarget.destroyed) {
                                    gsap.killTweensOf(posTarget);
                                    posTarget.destroy({ children: true });
                                }
                            } catch(e) {}
                            unit.container = null;
                            unit.sprite = null;
                        }
                    });
            } // else 블록 닫기
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
            
            // ★★★ 모든 플로터 정리 ★★★
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.cleanupAllFloaters();
            }
            
            // ★★★ 모든 진행 중인 GSAP 애니메이션 정리 ★★★
            try {
                // 모든 적 유닛의 애니메이션 정리
                this.state.enemyUnits.forEach(enemy => {
                    if (enemy.sprite && !enemy.sprite.destroyed) {
                        gsap.killTweensOf(enemy.sprite);
                        if (enemy.sprite.scale) gsap.killTweensOf(enemy.sprite.scale);
                    }
                    if (enemy.container && !enemy.container.destroyed) {
                        gsap.killTweensOf(enemy.container);
                    }
                });
                // CombatEffects 컨테이너의 모든 자식 애니메이션 정리
                if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
                    CombatEffects.container.children.forEach(child => {
                        if (child && !child.destroyed) {
                            gsap.killTweensOf(child);
                        }
                    });
                }
            } catch(e) {
                console.log('[Victory] GSAP cleanup error:', e);
            }
            
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
