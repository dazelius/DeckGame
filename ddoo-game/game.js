// =====================================================
// DDOO Game - Main Game Code
// Mobile Optimized + DOM Card System
// =====================================================

const Game = {
    // PixiJS app (battle area only)
    app: null,
    
    // 게임 상태
    state: {
        player: {
            hp: 100,
            maxHp: 100,
            energy: 3,
            maxEnergy: 3,
            block: 0
        },
        enemies: [],
        turn: 0,
        phase: 'player' // 'player' | 'enemy' | 'animation'
    },
    
    // 스프라이트 컨테이너
    containers: {
        background: null,
        debug: null,
        characters: null,
        effects: null,
        ui: null
    },
    
    // 캐릭터 참조
    player: null,
    enemySprites: [],
    
    // 디버그 설정
    debug: {
        enabled: false,
        showGrid: true,
        showPositions: true,
        gridGraphics: null
    },
    
    // 그리드 설정 (항상 표시)
    gridVisible: true,
    gridContainer: null,
    
    // 모바일 설정
    mobile: {
        isMobile: false,
        isTouch: false,
        isLandscape: false,
        pixelRatio: 1,
        maxPixelRatio: 2,
        hapticEnabled: true,
        lastTapTime: 0,
        doubleTapDelay: 300
    },
    
    // 3D world coordinates (10x10 grid arena)
    worldPositions: {
        player: { x: 2, y: 0, z: 5 },
        enemies: [
            { x: 7, y: 0, z: 4 },
            { x: 8, y: 0, z: 6 }
        ]
    },
    
    // Arena settings
    arena: {
        width: 10,
        depth: 10,
        gridSize: 1
    },
    
    // Battle/Card area sizes
    battleAreaSize: { width: 0, height: 0 },
    cardAreaSize: { width: 0, height: 0 },
    
    // Position update loop ID
    positionLoopId: null,
    
    // ==================== Card System (Canvas-based) ====================
    
    // Card Database - Dark Souls Style
    cardDatabase: {
        // === ATTACKS (with DDOOAction animations) ===
        slash: { 
            name: 'Slash', cost: 1, type: 'attack', damage: 6, 
            color: 0xef4444, desc: '6 DMG',
            anim: 'card.strike',      // Sequence animation
            playerAnim: 'player.attack',
            enemyAnim: 'enemy.hit'
        },
        heavySlash: { 
            name: 'Heavy', cost: 2, type: 'attack', damage: 12, 
            color: 0xff6b35, desc: '12 DMG',
            anim: 'card.bash',
            playerAnim: 'player.heavy_slash',
            enemyAnim: 'enemy.hit'
        },
        thrust: { 
            name: 'Thrust', cost: 1, type: 'attack', damage: 8, 
            color: 0xef4444, desc: '8 DMG, Pierce',
            playerAnim: 'player.stab',
            enemyAnim: 'enemy.hit'
        },
        backstab: { 
            name: 'Backstab', cost: 2, type: 'attack', damage: 20, 
            color: 0x8b0000, desc: '20 DMG',
            playerAnim: 'player.backstab_strike',
            enemyAnim: 'enemy.hit'
        },
        
        // === DEFENSE ===
        block: { 
            name: 'Block', cost: 1, type: 'skill', block: 5, 
            color: 0x3b82f6, desc: '+5 Block',
            playerAnim: 'player.defend'
        },
        ironFlesh: { 
            name: 'Iron', cost: 2, type: 'skill', block: 12, 
            color: 0x6b7280, desc: '+12 Block',
            playerAnim: 'player.defend'
        },
        parry: { 
            name: 'Parry', cost: 1, type: 'skill', block: 8, interrupt: 800,
            color: 0xfbbf24, desc: '+8 Block, Interrupt',
            playerAnim: 'player.defend'
        },
        
        // === MOVEMENT ===
        roll: { 
            name: 'Roll', cost: 1, type: 'move', dodge: 2, 
            color: 0x22c55e, desc: 'Dodge Back',
            playerAnim: 'player.dodge'
        },
        quickstep: { 
            name: 'Step', cost: 0, type: 'move', dodge: 1, 
            color: 0x10b981, desc: 'Free Move',
            playerAnim: 'player.dodge'
        },
        
        // === SPECIAL ===
        estus: { 
            name: 'Estus', cost: 2, type: 'skill', heal: 15, 
            color: 0xf59e0b, desc: 'Heal 15 HP'
        },
        riposte: { 
            name: 'Riposte', cost: 1, type: 'attack', damage: 15, 
            color: 0xdc2626, desc: '15 DMG (After Parry)',
            playerAnim: 'player.attack',
            enemyAnim: 'enemy.hit'
        }
    },
    
    // Card visual settings
    cardConfig: {
        width: 70,
        height: 95,
        spacing: 8,
        hoverScale: 1.2,
        hoverY: -20,
        dragScale: 1.15
    },
    
    // Card state
    // DOM Card System
    cards: {
        hand: [],           // Current hand (card IDs)
        elements: [],       // Card DOM elements
        dragging: null,     // Currently dragging card element
        dragData: null,     // Drag data
        hoveredTarget: null // Target being hovered
    },
    
    // ==================== 초기화 ====================
    
    async init() {
        console.log('[Game] Initializing...');
        
        // Mobile detection
        this.detectMobile();
        this.setupMobileEnvironment();
        
        // Get area dimensions (with fallback)
        const battleArea = document.getElementById('battle-area');
        const cardArea = document.getElementById('card-area');
        const battleRect = battleArea.getBoundingClientRect();
        const cardRect = cardArea.getBoundingClientRect();
        
        // Fallback dimensions if DOM not ready
        this.battleAreaSize = { 
            width: battleRect.width || window.innerWidth, 
            height: battleRect.height || window.innerHeight * 0.7 
        };
        this.cardAreaSize = { 
            width: cardRect.width || window.innerWidth, 
            height: cardRect.height || 140 
        };
        
        console.log('[Game] Battle area:', this.battleAreaSize);
        console.log('[Game] Card area:', this.cardAreaSize);
        
        // Initialize 3D background
        await DDOOBackground.init(battleArea);
        
        // Resolution
        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            this.mobile.isMobile ? this.mobile.maxPixelRatio : 3
        );
        this.mobile.pixelRatio = pixelRatio;
        
        // ==================== Battle App ====================
        this.app = new PIXI.Application();
        await this.app.init({
            width: this.battleAreaSize.width,
            height: this.battleAreaSize.height,
            backgroundAlpha: 0,
            antialias: !this.mobile.isMobile,
            resolution: pixelRatio,
            autoDensity: true,
            powerPreference: this.mobile.isMobile ? 'low-power' : 'high-performance'
        });
        
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.app.canvas);
        this.app.canvas.style.cssText = 'position:absolute;top:0;left:0;z-index:1;touch-action:none;';
        
        // Create containers
        this.createContainers();
        
        // Initialize DDOOAction engine
        if (typeof DDOOAction !== 'undefined') {
            try {
                await DDOOAction.init(this.app, this.app.stage);
                console.log('[Game] DDOOAction engine initialized');
            } catch (e) {
                console.warn('[Game] DDOOAction init failed:', e);
            }
        }
        
        // Create characters
        await this.createCharacters3D();
        
        // Create card system
        console.log('[Game] Initializing card system...');
        this.initCardSystem();
        
        // Draw initial hand (5 cards)
        console.log('[Game] Drawing initial hand...');
        this.drawHand(['slash', 'slash', 'thrust', 'block', 'roll']);
        console.log('[Game] Cards drawn:', this.cards.elements.length);
        
        // UI
        this.createBattleUI();
        this.updateUI();
        
        // Events
        this.bindEvents();
        this.bindMobileEvents();
        this.bindKeyboard();
        
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('orientationchange', () => this.onOrientationChange());
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());
        
        // Debug
        this.createDebugUI();
        this.createFullscreenButton();
        
        // Start loops
        this.startPositionLoop();
        
        // Combat system
        if (typeof Combat !== 'undefined') {
            Combat.init();
        }
        
        console.log('[Game] Initialized');
        console.log(`[Game] Battle: ${this.battleAreaSize.width}x${this.battleAreaSize.height}`);
        console.log(`[Game] Cards: ${this.cardAreaSize.width}x${this.cardAreaSize.height}`);
        
        this.showMessage('BATTLE START!', 2000);
        
        // Start combat
        setTimeout(() => {
            if (typeof Combat !== 'undefined') {
                Combat.start();
            }
        }, 2500);
    },
    
    // 📱 모바일 감지
    detectMobile() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        
        // 터치 지원 확인
        this.mobile.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // 모바일 디바이스 확인
        this.mobile.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
            || (this.mobile.isTouch && window.innerWidth < 1024);
        
        // 화면 방향 확인
        this.mobile.isLandscape = window.innerWidth > window.innerHeight;
        
        // iOS 감지
        this.mobile.isIOS = /iPad|iPhone|iPod/.test(ua);
        
        // Android 감지
        this.mobile.isAndroid = /Android/.test(ua);
    },
    
    // 📱 모바일 환경 설정
    setupMobileEnvironment() {
        if (!this.mobile.isMobile) return;
        
        // iOS 스크롤 방지
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // iOS 더블탭 줌 방지
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // 컨텍스트 메뉴 방지 (롱프레스)
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        console.log('📱 모바일 환경 설정 완료');
    },
    
    // ==================== 컨테이너 ====================
    
    createContainers() {
        // 배경 레이어
        this.containers.background = new PIXI.Container();
        this.containers.background.zIndex = 0;
        this.app.stage.addChild(this.containers.background);
        
        // 그리드 레이어 (항상 표시)
        this.gridContainer = new PIXI.Container();
        this.gridContainer.zIndex = 2;
        this.gridContainer.alpha = 0.4;
        this.app.stage.addChild(this.gridContainer);
        
        // 디버그 레이어
        this.containers.debug = new PIXI.Container();
        this.containers.debug.zIndex = 5;
        this.containers.debug.visible = false;
        this.app.stage.addChild(this.containers.debug);
        
        // 캐릭터 레이어
        this.containers.characters = new PIXI.Container();
        this.containers.characters.zIndex = 10;
        this.containers.characters.sortableChildren = true;
        this.app.stage.addChild(this.containers.characters);
        
        // 이펙트 레이어
        this.containers.effects = new PIXI.Container();
        this.containers.effects.zIndex = 20;
        this.app.stage.addChild(this.containers.effects);
        
        // UI 레이어
        this.containers.ui = new PIXI.Container();
        this.containers.ui.zIndex = 30;
        this.app.stage.addChild(this.containers.ui);
        
        this.app.stage.sortableChildren = true;
        
        // 기본 그리드 그리기
        this.drawBattleGrid();
    },
    
    // ==================== Battle Grid (Always Visible) ====================
    
    drawBattleGrid() {
        if (!this.gridContainer) return;
        this.gridContainer.removeChildren();
        
        const grid = new PIXI.Graphics();
        const { width, depth } = this.arena;
        
        // Draw subtle grid lines
        for (let x = 0; x <= width; x++) {
            const start = DDOOBackground.project3DToScreen(x, 0, 0);
            const end = DDOOBackground.project3DToScreen(x, 0, depth);
            
            if (start && end && start.visible && end.visible) {
                const isBattleLine = (x === 5);
                grid.moveTo(start.screenX, start.screenY);
                grid.lineTo(end.screenX, end.screenY);
                grid.stroke({ 
                    color: isBattleLine ? 0xffcc00 : 0x4488ff, 
                    alpha: isBattleLine ? 0.6 : 0.25, 
                    width: isBattleLine ? 2 : 1 
                });
            }
        }
        
        for (let z = 0; z <= depth; z++) {
            const start = DDOOBackground.project3DToScreen(0, 0, z);
            const end = DDOOBackground.project3DToScreen(width, 0, z);
            
            if (start && end && start.visible && end.visible) {
                grid.moveTo(start.screenX, start.screenY);
                grid.lineTo(end.screenX, end.screenY);
                grid.stroke({ color: 0x4488ff, alpha: 0.25, width: 1 });
            }
        }
        
        this.gridContainer.addChild(grid);
    },
    
    // ==================== 10x10 Arena Grid (Debug) ====================
    
    drawDebugGrid() {
        // Remove existing grid
        this.containers.debug.removeChildren();
        
        const grid = new PIXI.Graphics();
        const { width, depth } = this.arena;
        
        // Draw 10x10 arena grid (Y=0 plane)
        // Vertical lines (Z direction)
        for (let x = 0; x <= width; x++) {
            const start = DDOOBackground.project3DToScreen(x, 0, 0);
            const end = DDOOBackground.project3DToScreen(x, 0, depth);
            
            if (start && end && start.visible && end.visible) {
                const isCenter = (x === 5);
                grid.moveTo(start.screenX, start.screenY);
                grid.lineTo(end.screenX, end.screenY);
                grid.stroke({ 
                    color: isCenter ? 0xffff00 : 0x44ff44, 
                    alpha: isCenter ? 0.5 : 0.3, 
                    width: isCenter ? 2 : 1 
                });
            }
        }
        
        // Horizontal lines (Z direction - depth)
        for (let z = 0; z <= depth; z++) {
            const start = DDOOBackground.project3DToScreen(0, 0, z);
            const end = DDOOBackground.project3DToScreen(width, 0, z);
            
            if (start && end && start.visible && end.visible) {
                grid.moveTo(start.screenX, start.screenY);
                grid.lineTo(end.screenX, end.screenY);
                grid.stroke({ 
                    color: 0x44ff44, 
                    alpha: 0.3, 
                    width: 1 
                });
            }
        }
        
        // Corner markers
        const corners = [
            { x: 0, z: 0, label: '(0,0)' },
            { x: width, z: 0, label: `(${width},0)` },
            { x: 0, z: depth, label: `(0,${depth})` },
            { x: width, z: depth, label: `(${width},${depth})` }
        ];
        
        corners.forEach(corner => {
            const pos = DDOOBackground.project3DToScreen(corner.x, 0, corner.z);
            if (pos && pos.visible) {
                grid.circle(pos.screenX, pos.screenY, 4);
                grid.fill({ color: 0xffffff, alpha: 0.6 });
            }
        });
        
        // Player zone indicator (X: 0-4, left side)
        const playerZonePos = DDOOBackground.project3DToScreen(2, 0, 5);
        if (playerZonePos && playerZonePos.visible) {
            const zoneText = new PIXI.Text({
                text: 'PLAYER',
                style: { fontSize: 10, fill: 0x3b82f6, alpha: 0.6 }
            });
            zoneText.x = playerZonePos.screenX - 20;
            zoneText.y = playerZonePos.screenY + 50;
            this.containers.debug.addChild(zoneText);
        }
        
        // Enemy zone indicator (X: 6-10, right side)
        const enemyZonePos = DDOOBackground.project3DToScreen(8, 0, 5);
        if (enemyZonePos && enemyZonePos.visible) {
            const zoneText = new PIXI.Text({
                text: 'ENEMY',
                style: { fontSize: 10, fill: 0xef4444, alpha: 0.6 }
            });
            zoneText.x = enemyZonePos.screenX - 18;
            zoneText.y = enemyZonePos.screenY + 50;
            this.containers.debug.addChild(zoneText);
        }
        
        // Character position markers
        if (this.debug.showPositions) {
            // Player position
            const playerPos = DDOOBackground.project3DToScreen(
                this.worldPositions.player.x,
                this.worldPositions.player.y,
                this.worldPositions.player.z
            );
            if (playerPos && playerPos.visible) {
                grid.circle(playerPos.screenX, playerPos.screenY, 12);
                grid.stroke({ color: 0x3b82f6, width: 3 });
                
                const text = new PIXI.Text({
                    text: `P(${this.worldPositions.player.x},${this.worldPositions.player.z})`,
                    style: { fontSize: 11, fill: 0x3b82f6, fontWeight: 'bold' }
                });
                text.x = playerPos.screenX + 15;
                text.y = playerPos.screenY - 8;
                this.containers.debug.addChild(text);
            }
            
            // Enemy positions
            this.worldPositions.enemies.forEach((pos, i) => {
                const enemyPos = DDOOBackground.project3DToScreen(pos.x, pos.y, pos.z);
                if (enemyPos && enemyPos.visible) {
                    grid.circle(enemyPos.screenX, enemyPos.screenY, 10);
                    grid.stroke({ color: 0xef4444, width: 3 });
                    
                    const text = new PIXI.Text({
                        text: `E${i}(${pos.x},${pos.z})`,
                        style: { fontSize: 11, fill: 0xef4444, fontWeight: 'bold' }
                    });
                    text.x = enemyPos.screenX + 12;
                    text.y = enemyPos.screenY - 8;
                    this.containers.debug.addChild(text);
                }
            });
        }
        
        this.containers.debug.addChild(grid);
        this.debug.gridGraphics = grid;
    },
    
    // ==================== 캐릭터 (3D 배치) ====================
    
    async createCharacters3D() {
        // 플레이어 생성
        this.player = await DDOORenderer.createSprite('hero.png', {
            scale: 1.0,
            outline: { enabled: true, color: 0x222244, thickness: 6 },
            shadow: { enabled: false },
            breathing: { enabled: true, scaleAmount: 0.01 }
        });
        
        if (this.player) {
            this.placeCharacter3D(this.player, this.worldPositions.player);
            this.containers.characters.addChild(this.player);
            await DDOORenderer.playSpawn(this.player, 'left', 0.5);
            
            // Register with DDOOAction for animations
            if (typeof DDOOAction !== 'undefined' && DDOOAction.initialized) {
                const screenPos = DDOOBackground.project3DToScreen(
                    this.worldPositions.player.x, 
                    this.worldPositions.player.y, 
                    this.worldPositions.player.z
                );
                DDOOAction.characters.set('player', {
                    container: this.player,
                    sprite: this.player.children?.[0] || this.player,
                    baseX: screenPos?.screenX || this.player.x,
                    baseY: screenPos?.screenY || this.player.y,
                    baseScale: 1.0,
                    team: 'player',
                    state: 'idle'
                });
                console.log('[Game] Player registered with DDOOAction');
            }
        }
        
        // 적 생성
        const enemyTypes = ['goblin.png', 'slime.png'];
        
        for (let i = 0; i < this.worldPositions.enemies.length; i++) {
            const enemy = await DDOORenderer.createSprite(enemyTypes[i % enemyTypes.length], {
                scale: 1.0,
                outline: { enabled: true, color: 0x000000, thickness: 6 },
                shadow: { enabled: false },
                breathing: { enabled: true, scaleAmount: 0.015 }
            });
            
            if (enemy) {
                this.placeCharacter3D(enemy, this.worldPositions.enemies[i]);
                enemy.enemyIndex = i;
                this.containers.characters.addChild(enemy);
                this.enemySprites.push(enemy);
                
                // 적 데이터
                this.state.enemies.push({
                    hp: 30 + i * 10,
                    maxHp: 30 + i * 10,
                    block: 0,
                    intent: 'attack'
                });
                
                await DDOORenderer.playSpawn(enemy, 'right', 0.4);
                
                // Register first enemy with DDOOAction as default target
                if (i === 0 && typeof DDOOAction !== 'undefined' && DDOOAction.initialized) {
                    const screenPos = DDOOBackground.project3DToScreen(
                        this.worldPositions.enemies[i].x, 
                        this.worldPositions.enemies[i].y, 
                        this.worldPositions.enemies[i].z
                    );
                    DDOOAction.characters.set('enemy', {
                        container: enemy,
                        sprite: enemy.children?.[0] || enemy,
                        baseX: screenPos?.screenX || enemy.x,
                        baseY: screenPos?.screenY || enemy.y,
                        baseScale: 1.0,
                        team: 'enemy',
                        state: 'idle'
                    });
                    console.log('[Game] Enemy registered with DDOOAction');
                }
            }
        }
    },
    
    // 3D coordinate to screen position
    placeCharacter3D(sprite, worldPos) {
        const screenPos = DDOOBackground.project3DToScreen(worldPos.x, worldPos.y, worldPos.z);
        
        if (screenPos && screenPos.visible) {
            sprite.x = screenPos.screenX;
            sprite.y = screenPos.screenY;
            
            // Distance-based scale (adjusted for better visibility)
            const baseScale = sprite.baseScale || 1.0;
            const depthScale = screenPos.scale * 0.5;  // Scale factor
            sprite.scale.set(baseScale * depthScale);
            
            // Depth sorting
            sprite.zIndex = Math.floor(1000 - screenPos.depth * 10);
            
            // Store current screen position for effects
            sprite.screenPos = screenPos;
        }
    },
    
    // Update all character positions (called every frame)
    updateAllCharacterPositions() {
        if (this.player) {
            this.placeCharacter3D(this.player, this.worldPositions.player);
        }
        
        this.enemySprites.forEach((enemy, i) => {
            if (this.worldPositions.enemies[i]) {
                this.placeCharacter3D(enemy, this.worldPositions.enemies[i]);
            }
        });
        
        // Update battle grid
        if (this.gridVisible) {
            this.drawBattleGrid();
        }
        
        // Update debug grid
        if (this.debug.enabled) {
            this.drawDebugGrid();
        }
    },
    
    // Start position update loop (sync with 3D camera)
    startPositionLoop() {
        const update = () => {
            this.updateAllCharacterPositions();
            
            // Update intent positions (above enemy heads)
            if (typeof Combat !== 'undefined') {
                Combat.updateAllIntentPositions();
            }
            
            this.positionLoopId = requestAnimationFrame(update);
        };
        update();
    },
    
    // Stop position loop
    stopPositionLoop() {
        if (this.positionLoopId) {
            cancelAnimationFrame(this.positionLoopId);
            this.positionLoopId = null;
        }
    },
    
    // ==================== Enemy Actions ====================
    
    // Enemy attacks player
    async enemyAttacksPlayer(enemyIndex, damage, options = {}) {
        const enemy = this.enemySprites[enemyIndex];
        if (!enemy) return;
        
        this.state.phase = 'animation';
        
        const { heavy = false } = options;
        const finalDamage = damage - this.state.player.block;
        
        // Block absorption
        if (this.state.player.block > 0) {
            const blockedAmount = Math.min(this.state.player.block, damage);
            this.state.player.block -= blockedAmount;
            
            if (blockedAmount > 0) {
                DDOOFloater.showOnCharacter(this.player, blockedAmount, 'block');
            }
        }
        
        // Apply damage
        if (finalDamage > 0) {
            this.state.player.hp = Math.max(0, this.state.player.hp - finalDamage);
            
            // Hit effects
            this.hapticFeedback(heavy ? 'heavy' : 'hit');
            DDOORenderer.rapidFlash(this.player);
            DDOORenderer.damageShake(this.player, heavy ? 12 : 6, 300);
            DDOOBackground.screenFlash(heavy ? '#ff0000' : '#ff4444', heavy ? 150 : 80);
            DDOOBackground.shake(heavy ? 1.0 : 0.5, heavy ? 300 : 150);
            
            DDOOFloater.showOnCharacter(this.player, finalDamage, 'damage');
            
            this.updateUI();
            
            // Death check
            if (this.state.player.hp <= 0) {
                await DDOORenderer.playDeath(this.player, this.app);
                this.showMessage('GAME OVER', 5000);
                Combat.stop();
            }
        }
        
        this.state.phase = 'player';
    },
    
    // Add enemy block
    addEnemyBlock(enemyIndex, amount) {
        const enemyData = this.state.enemies[enemyIndex];
        if (!enemyData) return;
        
        enemyData.block = (enemyData.block || 0) + amount;
        DDOOFloater.showOnCharacter(this.enemySprites[enemyIndex], `+${amount}`, 'block');
    },
    
    // Move character in 3D space
    moveCharacter(type, index, targetX, targetZ) {
        const worldPos = type === 'player' 
            ? this.worldPositions.player 
            : this.worldPositions.enemies[index];
        
        if (!worldPos) return;
        
        // Animate movement
        gsap.to(worldPos, {
            x: targetX,
            z: targetZ,
            duration: 0.4,
            ease: 'power2.out',
            onUpdate: () => this.updateAllCharacterPositions()
        });
    },
    
    // ==================== Card System (DOM-based) ====================
    
    initCardSystem() {
        console.log('[Game] Initializing DOM card system...');
        
        // Bind end turn button
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => {
                this.hapticFeedback('medium');
                this.endTurn();
            });
        }
        
        // Update energy display
        this.updateCardUI();
        
        console.log('[Game] DOM card system initialized');
    },
    
    updateCardUI() {
        // Update energy embers (Clash Royale style)
        const energyDisplay = document.getElementById('energy-display');
        if (energyDisplay) {
            energyDisplay.innerHTML = '';
            const current = this.state.player.energy;
            const max = this.state.player.maxEnergy;
            
            for (let i = 0; i < max; i++) {
                const ember = document.createElement('div');
                ember.className = 'energy-ember' + (i >= current ? ' empty' : '');
                energyDisplay.appendChild(ember);
            }
        }
        
        // Update deck info
        const drawCount = document.getElementById('draw-count');
        const discardCount = document.getElementById('discard-count');
        if (drawCount) drawCount.textContent = this.state.deck?.draw || 5;
        if (discardCount) discardCount.textContent = this.state.deck?.discard || 0;
        
        // Update card playability
        this.updateCardPlayability();
    },
    
    updateCardPlayability() {
        this.cards.elements.forEach(cardEl => {
            const cardId = cardEl.dataset.cardId;
            const cardData = this.cardDatabase[cardId];
            if (cardData) {
                const canPlay = this.state.player.energy >= cardData.cost;
                cardEl.classList.toggle('disabled', !canPlay);
                cardEl.classList.toggle('playable', canPlay);
            }
        });
    },
    
    // Draw cards in hand (DOM)
    drawHand(cardIds) {
        console.log(`[Game] Drawing hand: ${cardIds.join(', ')}`);
        
        const handContainer = document.getElementById('card-hand');
        if (!handContainer) {
            console.error('[Game] Card hand container not found!');
            return;
        }
        
        // Clear existing cards
        handContainer.innerHTML = '';
        this.cards.elements = [];
        this.cards.hand = [...cardIds];
        
        // Create card elements
        cardIds.forEach((cardId, index) => {
            const cardData = this.cardDatabase[cardId];
            if (!cardData) {
                console.warn(`[Game] Card not found: ${cardId}`);
                return;
            }
            
            const cardEl = this.createCardElement(cardId, cardData, index);
            handContainer.appendChild(cardEl);
            this.cards.elements.push(cardEl);
        });
        
        this.updateCardPlayability();
        console.log(`[Game] Drew ${this.cards.elements.length} cards`);
    },
    
    // Create a single card DOM element
    createCardElement(cardId, cardData, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.cardId = cardId;
        card.dataset.type = cardData.type;
        card.dataset.index = index;
        
        // Get display value
        let valueStr = '';
        if (cardData.damage) valueStr = cardData.damage;
        else if (cardData.block) valueStr = cardData.block;
        else if (cardData.heal) valueStr = `+${cardData.heal}`;
        
        card.innerHTML = `
            <div class="card-cost">${cardData.cost}</div>
            <div class="card-name">${cardData.name}</div>
            ${valueStr ? `<div class="card-value">${valueStr}</div>` : ''}
            <div class="card-desc">${cardData.desc || ''}</div>
        `;
        
        // Bind events
        this.bindCardEvents(card, cardId, cardData);
        
        return card;
    },
    
    bindCardEvents(card, cardId, cardData) {
        // Touch/mouse down - start drag
        const startDrag = (e) => {
            e.preventDefault();
            
            if (this.state.phase !== 'player') return;
            if (this.cards.dragging) return;
            
            // Check energy
            if (this.state.player.energy < cardData.cost) {
                this.showMessage('Energy!', 600);
                this.hapticFeedback('error');
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 300);
                return;
            }
            
            // Get position
            const touch = e.touches ? e.touches[0] : e;
            const startX = touch.clientX;
            const startY = touch.clientY;
            
            // Start dragging
            this.cards.dragging = card;
            this.cards.dragData = {
                cardId,
                cardData,
                startX,
                startY,
                index: parseInt(card.dataset.index)
            };
            
            // Visual feedback
            card.classList.add('dragging');
            
            // Create ghost
            this.createDragGhost(cardData, startX, startY);
            
            this.hapticFeedback('light');
            
            // Show targets
            this.showDragTargets(cardData.type);
            
            // Global events
            this._onDragMove = (e) => this.onCardDragMove(e);
            this._onDragEnd = (e) => this.onCardDragEnd(e);
            window.addEventListener('mousemove', this._onDragMove);
            window.addEventListener('mouseup', this._onDragEnd);
            window.addEventListener('touchmove', this._onDragMove, { passive: false });
            window.addEventListener('touchend', this._onDragEnd);
        };
        
        card.addEventListener('mousedown', startDrag);
        card.addEventListener('touchstart', startDrag, { passive: false });
    },
    
    // Create DOM-based drag ghost
    createDragGhost(cardData, x, y) {
        const ghost = document.createElement('div');
        ghost.className = 'drag-card';
        ghost.innerHTML = `
            <div style="
                width: 80px;
                height: 100px;
                background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
                border: 3px solid ${this.colorToCSS(cardData.color)};
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${this.colorToCSS(cardData.color)}40;
                transform: rotate(5deg);
            ">
                <div style="
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    width: 24px;
                    height: 24px;
                    background: #fbbf24;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    color: #000;
                ">${cardData.cost}</div>
                <div style="color: #fff; font-weight: bold; font-size: 12px; margin-bottom: 5px;">${cardData.name}</div>
                <div style="color: ${this.colorToCSS(cardData.color)}; font-size: 22px; font-weight: bold;">
                    ${cardData.damage || cardData.block || cardData.heal || ''}
                </div>
            </div>
        `;
        ghost.style.left = `${x}px`;
        ghost.style.top = `${y}px`;
        
        document.getElementById('drag-overlay').appendChild(ghost);
        this.cards.dragGhost = ghost;
    },
    
    colorToCSS(color) {
        if (!color) return '#666666';
        return '#' + color.toString(16).padStart(6, '0');
    },
    
    onCardDragMove(event) {
        if (!this.cards.dragging || !this.cards.dragGhost) return;
        
        event.preventDefault?.();
        
        const data = this.cards.dragData;
        const ghost = this.cards.dragGhost;
        
        // Get mouse/touch position
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        // Move ghost
        ghost.style.left = `${clientX}px`;
        ghost.style.top = `${clientY}px`;
        
        // Get areas
        const cardAreaRect = document.getElementById('card-area').getBoundingClientRect();
        const battleRect = document.getElementById('battle-area').getBoundingClientRect();
        
        // Check if over battle area
        const isOverBattle = clientY < cardAreaRect.top;
        
        if (isOverBattle) {
            // Scale up ghost
            ghost.style.transform = 'translate(-50%, -50%) scale(1.2)';
            
            // Convert to battle area local coordinates
            const battleX = clientX - battleRect.left;
            const battleY = clientY - battleRect.top;
            
            // Find target
            const newTarget = this.findTargetAt(battleX, battleY, data.cardData.type);
            
            if (newTarget !== this.cards.hoveredTarget) {
                if (this.cards.hoveredTarget) {
                    this.clearTargetHighlight(this.cards.hoveredTarget);
                }
                this.cards.hoveredTarget = newTarget;
                if (newTarget) {
                    this.applyTargetHighlight(newTarget, data.cardData.type);
                    this.hapticFeedback('medium');
                    
                    // Extra glow on ghost
                    ghost.style.filter = 'brightness(1.5) drop-shadow(0 0 15px gold)';
                    ghost.style.transform = 'translate(-50%, -50%) scale(1.3) rotate(0deg)';
                    
                    // Show target indicator
                    this.showTargetIndicator(newTarget, data.cardData);
                } else {
                    ghost.style.filter = '';
                    ghost.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    this.hideTargetIndicator();
                }
            }
        } else {
            // Normal scale
            ghost.style.transform = 'translate(-50%, -50%) scale(1) rotate(5deg)';
            ghost.style.filter = '';
            
            if (this.cards.hoveredTarget) {
                this.clearTargetHighlight(this.cards.hoveredTarget);
                this.cards.hoveredTarget = null;
            }
        }
        
        // Update positions (targets might be animating)
        this.updateTargetRingPosition();
        if (this.cards.hoveredTarget) {
            this.updateTargetIndicatorPosition(this.cards.hoveredTarget);
        }
    },
    
    onCardDragEnd(event) {
        if (!this.cards.dragging) return;
        
        const card = this.cards.dragging;
        const data = this.cards.dragData;
        
        // Remove event listeners
        window.removeEventListener('mousemove', this._onDragMove);
        window.removeEventListener('mouseup', this._onDragEnd);
        window.removeEventListener('touchmove', this._onDragMove);
        window.removeEventListener('touchend', this._onDragEnd);
        
        // Remove ghost
        if (this.cards.dragGhost) {
            this.cards.dragGhost.remove();
            this.cards.dragGhost = null;
        }
        
        // Hide target indicator
        this.hideTargetIndicator();
        
        // Execute card if dropped on valid target
        const usedCard = this.cards.hoveredTarget !== null;
        
        if (usedCard) {
            this.executeCardOnTarget(data.cardId, data.index, this.cards.hoveredTarget);
            this.clearTargetHighlight(this.cards.hoveredTarget);
            this.cards.hoveredTarget = null;
        } else {
            // Show card again (DOM)
            card.classList.remove('dragging');
        }
        
        // Hide targets
        this.hideDragTargets();
        
        this.cards.dragging = null;
        this.cards.dragData = null;
    },
    
    // Find target at battle area position
    findTargetAt(screenX, screenY, cardType) {
        // Larger hit radius for easier targeting
        const hitRadius = 120;
        const hitRadiusPlayer = 100;
        
        if (cardType === 'attack') {
            // Find closest enemy within range
            let closest = null;
            let closestDist = Infinity;
            
            for (let i = 0; i < this.enemySprites.length; i++) {
                const enemy = this.enemySprites[i];
                if (!enemy || !this.state.enemies[i] || this.state.enemies[i].hp <= 0) continue;
                
                // Use sprite bounds for better hit detection
                const bounds = enemy.getBounds();
                const centerX = bounds.x + bounds.width / 2;
                const centerY = bounds.y + bounds.height / 2;
                
                const dx = centerX - screenX;
                const dy = centerY - screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Expand hitbox based on sprite size
                const effectiveRadius = Math.max(hitRadius, bounds.width * 0.8, bounds.height * 0.6);
                
                if (dist < effectiveRadius && dist < closestDist) {
                    closest = { type: 'enemy', index: i, sprite: enemy };
                    closestDist = dist;
                }
            }
            
            return closest;
        }
        
        if (cardType === 'skill' || cardType === 'move') {
            if (this.player) {
                const bounds = this.player.getBounds();
                const centerX = bounds.x + bounds.width / 2;
                const centerY = bounds.y + bounds.height / 2;
                
                const dx = centerX - screenX;
                const dy = centerY - screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const effectiveRadius = Math.max(hitRadiusPlayer, bounds.width * 0.8);
                
                if (dist < effectiveRadius) {
                    return { type: 'player', index: 0, sprite: this.player };
                }
            }
        }
        
        return null;
    },
    
    showDragTargets(cardType) {
        // Create DOM markers for valid targets
        const overlay = document.getElementById('drag-overlay');
        const battleRect = document.getElementById('battle-area').getBoundingClientRect();
        
        if (cardType === 'attack') {
            this.enemySprites.forEach((enemy, i) => {
                if (!enemy || !this.state.enemies[i] || this.state.enemies[i].hp <= 0) return;
                
                // Create valid target marker (dashed circle)
                const marker = document.createElement('div');
                marker.className = 'valid-target-marker';
                marker.id = `valid-target-${i}`;
                
                const bounds = enemy.getBounds();
                const size = Math.max(bounds.width, bounds.height) * 1.2;
                marker.style.width = `${size}px`;
                marker.style.height = `${size}px`;
                marker.style.left = `${battleRect.left + bounds.x + bounds.width / 2}px`;
                marker.style.top = `${battleRect.top + bounds.y + bounds.height / 2}px`;
                
                overlay.appendChild(marker);
            });
        } else if (cardType === 'skill' || cardType === 'move') {
            if (this.player) {
                const marker = document.createElement('div');
                marker.className = 'valid-target-marker';
                marker.id = 'valid-target-player';
                marker.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                
                const bounds = this.player.getBounds();
                const size = Math.max(bounds.width, bounds.height) * 1.2;
                marker.style.width = `${size}px`;
                marker.style.height = `${size}px`;
                marker.style.left = `${battleRect.left + bounds.x + bounds.width / 2}px`;
                marker.style.top = `${battleRect.top + bounds.y + bounds.height / 2}px`;
                
                overlay.appendChild(marker);
            }
        }
    },
    
    hideDragTargets() {
        // Remove all valid target markers
        document.querySelectorAll('.valid-target-marker').forEach(el => el.remove());
        
        // Remove target ring if any
        this.removeTargetRing();
        
        // Hide target indicator
        this.hideTargetIndicator();
        
        // Make sure targeting mode is off
        this.exitTargetingMode();
    },
    
    applyTargetHighlight(target, cardType) {
        // Remove any existing ring
        this.removeTargetRing();
        
        // Create DOM-based targeting ring
        const ring = document.createElement('div');
        ring.id = 'target-ring';
        ring.className = `target-ring ${cardType}`;
        
        // Get sprite bounds for sizing
        const bounds = target.sprite.getBounds();
        const size = Math.max(bounds.width, bounds.height) * 1.3;
        
        ring.innerHTML = `
            <div class="target-ring-inner" style="width: ${size}px; height: ${size}px;"></div>
            <div class="target-corner tl"></div>
            <div class="target-corner tr"></div>
            <div class="target-corner bl"></div>
            <div class="target-corner br"></div>
        `;
        
        // Size the ring container
        ring.style.width = `${size}px`;
        ring.style.height = `${size}px`;
        
        document.getElementById('drag-overlay').appendChild(ring);
        
        // Store target for position updates
        this._targetRingTarget = target;
        this.updateTargetRingPosition();
        
        // Slowdown time (Combat pause)
        this.enterTargetingMode();
    },
    
    updateTargetRingPosition() {
        const ring = document.getElementById('target-ring');
        if (!ring || !this._targetRingTarget) return;
        
        const target = this._targetRingTarget;
        const battleRect = document.getElementById('battle-area').getBoundingClientRect();
        const bounds = target.sprite.getBounds();
        
        const centerX = battleRect.left + bounds.x + bounds.width / 2;
        const centerY = battleRect.top + bounds.y + bounds.height / 2;
        
        ring.style.left = `${centerX}px`;
        ring.style.top = `${centerY}px`;
    },
    
    removeTargetRing() {
        const ring = document.getElementById('target-ring');
        if (ring) ring.remove();
        this._targetRingTarget = null;
    },
    
    clearTargetHighlight(target) {
        // Remove DOM ring
        this.removeTargetRing();
        
        // Resume time
        this.exitTargetingMode();
    },
    
    // Enter slow-motion targeting mode
    enterTargetingMode() {
        if (this._targetingMode) return;
        this._targetingMode = true;
        
        // Pause combat gauge
        if (typeof Combat !== 'undefined') {
            Combat.pause();
        }
        
        // Darken non-target elements
        gsap.to(this.player, { alpha: 0.5, duration: 0.2 });
        
        // Add vignette effect (optional)
        if (DDOOBackground.setDarkOverlay) {
            DDOOBackground.setDarkOverlay(0.3);
        }
    },
    
    // Exit targeting mode
    exitTargetingMode() {
        if (!this._targetingMode) return;
        this._targetingMode = false;
        
        // Resume combat
        if (typeof Combat !== 'undefined') {
            Combat.resume();
        }
        
        // Restore brightness
        gsap.to(this.player, { alpha: 1, duration: 0.2 });
        
        if (DDOOBackground.setDarkOverlay) {
            DDOOBackground.setDarkOverlay(0);
        }
    },
    
    // Show targeting indicator above target
    showTargetIndicator(target, cardData) {
        this.hideTargetIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'target-indicator';
        indicator.className = 'target-indicator';
        
        const damage = cardData.damage || cardData.block || '';
        const action = cardData.type === 'attack' ? 'ATK' : (cardData.type === 'skill' ? 'BUFF' : 'MOVE');
        
        indicator.innerHTML = `
            <div class="target-action">${action}</div>
            ${damage ? `<div class="target-damage">${damage}</div>` : ''}
        `;
        
        document.getElementById('drag-overlay').appendChild(indicator);
        
        // Position above target
        this.updateTargetIndicatorPosition(target);
    },
    
    updateTargetIndicatorPosition(target) {
        const indicator = document.getElementById('target-indicator');
        if (!indicator || !target) return;
        
        const battleRect = document.getElementById('battle-area').getBoundingClientRect();
        const bounds = target.sprite.getBounds();
        
        indicator.style.left = `${battleRect.left + bounds.x + bounds.width / 2}px`;
        indicator.style.top = `${battleRect.top + bounds.y - 50}px`;
    },
    
    hideTargetIndicator() {
        const indicator = document.getElementById('target-indicator');
        if (indicator) indicator.remove();
    },
    
    // Execute card effect
    executeCardOnTarget(cardId, cardIndex, target) {
        const cardData = this.cardDatabase[cardId];
        if (!cardData) return;
        
        // Spend energy
        this.state.player.energy -= cardData.cost;
        this.updateUI();
        
        this.hapticFeedback('medium');
        console.log(`[Game] Card ${cardId} (index ${cardIndex}) -> ${target.type}`);
        
        // Execute effect
        switch (cardData.type) {
            case 'attack':
                this.attackWithCard(target.index, cardData);
                break;
            case 'skill':
                this.useSkillCard(cardData);
                break;
            case 'move':
                this.useMoveCard(cardData);
                break;
        }
        
        // Remove the used card from hand
        this.removeCardFromHand(cardIndex);
    },
    
    // Remove card and rearrange remaining cards (DOM)
    removeCardFromHand(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.cards.elements.length) return;
        
        const card = this.cards.elements[cardIndex];
        
        // Animate card disappearing
        card.style.transition = 'transform 0.2s, opacity 0.2s';
        card.style.transform = 'translateY(-50px) scale(0.8)';
        card.style.opacity = '0';
        
        setTimeout(() => {
            // Remove from DOM
            card.remove();
            
            // Remove from arrays
            this.cards.elements.splice(cardIndex, 1);
            this.cards.hand.splice(cardIndex, 1);
            
            // Update indices
            this.cards.elements.forEach((el, i) => {
                el.dataset.index = i;
            });
            
            // Update UI
            this.updateCardUI();
        }, 200);
    },
    
    // ==================== Combat Actions ====================
    
    async attackWithCard(enemyIndex, cardData) {
        if (this.state.phase !== 'player') return;
        this.state.phase = 'animation';
        
        const enemy = this.enemySprites[enemyIndex];
        const enemyData = this.state.enemies[enemyIndex];
        const enemyWorldPos = this.worldPositions.enemies[enemyIndex];
        
        if (!enemy || !enemyData) {
            this.state.phase = 'player';
            return;
        }
        
        const baseDamage = cardData.damage || 6;
        const isCrit = Math.random() < 0.15;
        const finalDamage = isCrit ? baseDamage * 2 : baseDamage;
        
        // Try to use DDOOAction for animation
        const useDDOOAction = typeof DDOOAction !== 'undefined' && DDOOAction.initialized;
        
        if (useDDOOAction && cardData.anim) {
            // Use sequence animation (dash + attack + enemy hit)
            console.log(`[Game] Playing sequence: ${cardData.anim}`);
            
            try {
                await DDOOAction.playSequence(cardData.anim, {
                    targetContainer: enemy,
                    targetSprite: enemy.children?.[0] || enemy,
                    damage: finalDamage
                });
            } catch (e) {
                console.warn('[Game] Sequence failed, using fallback:', e);
            }
            
        } else if (useDDOOAction && cardData.playerAnim) {
            // Use individual animations
            console.log(`[Game] Playing anim: ${cardData.playerAnim}`);
            
            const originalPos = { ...this.worldPositions.player };
            
            // Dash to enemy
            await this.dashTo(enemyWorldPos.x - 1.5, enemyWorldPos.z, 0.2);
            
            // Play player attack animation
            const playerChar = DDOOAction.characters?.get('player');
            if (playerChar) {
                await DDOOAction.play(cardData.playerAnim, {
                    container: playerChar.container,
                    sprite: playerChar.sprite
                });
            }
            
            // Hit effects
            this.hapticFeedback(isCrit ? 'heavy' : 'hit');
            DDOOBackground.screenFlash(isCrit ? '#ffaa00' : '#ffffff', isCrit ? 100 : 60);
            
            // Play enemy hit animation
            if (cardData.enemyAnim) {
                const enemyChar = { container: enemy, sprite: enemy.children?.[0] || enemy };
                await DDOOAction.play(cardData.enemyAnim, enemyChar);
            }
            
            // Damage number
            DDOOFloater.showOnCharacter(enemy, finalDamage, isCrit ? 'critical' : 'damage');
            
            // Return
            await this.dashTo(originalPos.x, originalPos.z, 0.25);
            
        } else {
            // Fallback: basic effects (no DDOOAction)
            console.log('[Game] Using fallback attack (no DDOOAction)');
            
            const originalPos = { ...this.worldPositions.player };
            await this.dashTo(enemyWorldPos.x - 1.5, enemyWorldPos.z, 0.2);
            
            // Hit effects
            this.hapticFeedback(isCrit ? 'heavy' : 'hit');
            DDOORenderer.setTargeted(enemy, true, 0xff0000);
            DDOORenderer.rapidFlash(enemy);
            DDOORenderer.damageShake(enemy, isCrit ? 12 : 8, 300);
            
            DDOOBackground.screenFlash(isCrit ? '#ffaa00' : '#ffffff', isCrit ? 100 : 60);
            DDOOBackground.hitFlash(enemyWorldPos.x, 3, enemyWorldPos.z, isCrit ? 0xffaa00 : 0xffffff, isCrit ? 10 : 6, 200);
            if (isCrit) DDOOBackground.shake(0.6, 150);
            
            DDOOFloater.showOnCharacter(enemy, finalDamage, isCrit ? 'critical' : 'damage');
            
            await this.delay(200);
            DDOORenderer.setTargeted(enemy, false);
            
            // Return
            await this.dashTo(originalPos.x, originalPos.z, 0.25);
        }
        
        // Apply damage
        enemyData.hp = Math.max(0, enemyData.hp - finalDamage);
        
        if (typeof Combat !== 'undefined') {
            Combat.interruptEnemy(enemyIndex, 400);
        }
        
        // Death check
        if (enemyData.hp <= 0) {
            this.hapticFeedback('success');
            await DDOORenderer.playDeath(enemy, this.app);
            this.enemySprites.splice(enemyIndex, 1);
            this.state.enemies.splice(enemyIndex, 1);
            this.worldPositions.enemies.splice(enemyIndex, 1);
            
            if (typeof Combat !== 'undefined') {
                Combat.removeIntentUI(enemyIndex);
            }
            
            if (this.state.enemies.length === 0) {
                if (typeof Combat !== 'undefined') Combat.stop();
                this.showMessage('VICTORY!', 3000);
            }
        }
        
        this.state.phase = 'player';
    },
    
    dashTo(targetX, targetZ, duration = 0.3) {
        return new Promise(resolve => {
            gsap.to(this.worldPositions.player, {
                x: targetX,
                z: targetZ,
                duration,
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    useSkillCard(cardData) {
        // Block
        if (cardData.block) {
            this.state.player.block += cardData.block;
            DDOORenderer.rapidFlash(this.player, 0x4488ff);
            DDOOFloater.showOnCharacter(this.player, `+${cardData.block}`, 'block');
        }
        
        // Heal (Estus)
        if (cardData.heal) {
            const healAmount = Math.min(cardData.heal, this.state.player.maxHp - this.state.player.hp);
            this.state.player.hp += healAmount;
            DDOORenderer.rapidFlash(this.player, 0x22c55e);
            DDOOFloater.showOnCharacter(this.player, `+${healAmount}`, 'heal');
            DDOOBackground.screenFlash('#22c55e', 100);
        }
        
        // Interrupt (Parry)
        if (cardData.interrupt) {
            this.enemySprites.forEach((enemy, i) => {
                if (typeof Combat !== 'undefined') {
                    Combat.interruptEnemy(i, cardData.interrupt);
                }
            });
            DDOOBackground.screenFlash('#fbbf24', 80);
            this.showMessage('PARRY!', 600);
        }
        
        this.updateUI();
    },
    
    useMoveCard(cardData) {
        const dodgeAmount = cardData.dodge || 2;
        const dodgeX = Math.max(0.5, this.worldPositions.player.x - dodgeAmount);
        
        // Quick roll animation
        gsap.to(this.worldPositions.player, { 
            x: dodgeX, 
            duration: 0.15, 
            ease: 'power2.out' 
        });
        
        // Brief invincibility visual
        gsap.to(this.player, {
            alpha: 0.5,
            duration: 0.1,
            yoyo: true,
            repeat: 1
        });
        
        if (cardData.cost === 0) {
            this.showMessage('Step!', 400);
        } else {
            this.showMessage('Roll!', 500);
        }
    },
    
    // ==================== 디버그 UI ====================
    
    createDebugUI() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.innerHTML = `
            <div class="debug-header">🔧 디버그 메뉴 <span style="font-size:0.7em">(Ctrl+D)</span></div>
            <label><input type="checkbox" id="debug-grid" checked> 그리드 표시</label>
            <label><input type="checkbox" id="debug-positions" checked> 좌표 표시</label>
            <div class="debug-section">플레이어 위치</div>
            <div class="debug-row">
                <label>X: <input type="range" id="player-x" min="-15" max="0" step="0.5" value="${this.worldPositions.player.x}"></label>
                <span id="player-x-val">${this.worldPositions.player.x}</span>
            </div>
            <div class="debug-row">
                <label>Z: <input type="range" id="player-z" min="-5" max="10" step="0.5" value="${this.worldPositions.player.z}"></label>
                <span id="player-z-val">${this.worldPositions.player.z}</span>
            </div>
            <div class="debug-section">적 위치 (E0)</div>
            <div class="debug-row">
                <label>X: <input type="range" id="enemy0-x" min="0" max="20" step="0.5" value="${this.worldPositions.enemies[0]?.x || 4}"></label>
                <span id="enemy0-x-val">${this.worldPositions.enemies[0]?.x || 4}</span>
            </div>
            <div class="debug-row">
                <label>Z: <input type="range" id="enemy0-z" min="-5" max="10" step="0.5" value="${this.worldPositions.enemies[0]?.z || 2}"></label>
                <span id="enemy0-z-val">${this.worldPositions.enemies[0]?.z || 2}</span>
            </div>
        `;
        debugPanel.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: rgba(0,0,0,0.9);
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 10000;
            display: none;
            min-width: 200px;
            border: 1px solid #444;
        `;
        document.body.appendChild(debugPanel);
        
        // 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            #debug-panel label { display: block; margin: 5px 0; cursor: pointer; }
            #debug-panel input[type="checkbox"] { margin-right: 8px; }
            #debug-panel .debug-header { font-weight: bold; color: #fbbf24; margin-bottom: 10px; font-size: 14px; }
            #debug-panel .debug-section { color: #60a5fa; margin-top: 10px; margin-bottom: 5px; font-weight: bold; }
            #debug-panel .debug-row { display: flex; align-items: center; gap: 8px; margin: 3px 0; }
            #debug-panel .debug-row label { flex: 1; display: flex; align-items: center; gap: 5px; }
            #debug-panel input[type="range"] { width: 80px; }
            #debug-panel .debug-row span { min-width: 30px; color: #fbbf24; }
        `;
        document.head.appendChild(style);
        
        // 이벤트 바인딩
        document.getElementById('debug-grid').addEventListener('change', (e) => {
            this.debug.showGrid = e.target.checked;
            this.drawDebugGrid();
        });
        
        document.getElementById('debug-positions').addEventListener('change', (e) => {
            this.debug.showPositions = e.target.checked;
            this.drawDebugGrid();
        });
        
        // 위치 슬라이더 이벤트
        const bindSlider = (id, obj, key, valId) => {
            const slider = document.getElementById(id);
            const valSpan = document.getElementById(valId);
            slider.addEventListener('input', (e) => {
                obj[key] = parseFloat(e.target.value);
                valSpan.textContent = obj[key];
                this.updateAllCharacterPositions();
            });
        };
        
        bindSlider('player-x', this.worldPositions.player, 'x', 'player-x-val');
        bindSlider('player-z', this.worldPositions.player, 'z', 'player-z-val');
        if (this.worldPositions.enemies[0]) {
            bindSlider('enemy0-x', this.worldPositions.enemies[0], 'x', 'enemy0-x-val');
            bindSlider('enemy0-z', this.worldPositions.enemies[0], 'z', 'enemy0-z-val');
        }
    },
    
    toggleDebug() {
        this.debug.enabled = !this.debug.enabled;
        this.containers.debug.visible = this.debug.enabled;
        document.getElementById('debug-panel').style.display = this.debug.enabled ? 'block' : 'none';
        
        if (this.debug.enabled) {
            this.drawDebugGrid();
            console.log('🔧 디버그 모드 ON');
        } else {
            console.log('🔧 디버그 모드 OFF');
        }
    },
    
    // ==================== UI ====================
    
    createBattleUI() {
        // Battle UI container in PixiJS
        const uiContainer = new PIXI.Container();
        uiContainer.zIndex = 50;
        this.app.stage.addChild(uiContainer);
        this.containers.battleUI = uiContainer;
        
        // HP Bar background
        const hpBg = new PIXI.Graphics();
        hpBg.roundRect(15, 15, 200, 24, 4);
        hpBg.fill({ color: 0x333333 });
        hpBg.stroke({ color: 0x555555, width: 2 });
        uiContainer.addChild(hpBg);
        
        // HP Bar fill
        this.ui = this.ui || {};
        this.ui.hpFill = new PIXI.Graphics();
        uiContainer.addChild(this.ui.hpFill);
        
        // HP Text
        this.ui.hpText = new PIXI.Text({
            text: '100/100',
            style: { fontFamily: 'Arial', fontSize: 14, fill: 0xffffff }
        });
        this.ui.hpText.x = 20;
        this.ui.hpText.y = 18;
        uiContainer.addChild(this.ui.hpText);
        
        // Block display
        this.ui.blockText = new PIXI.Text({
            text: '',
            style: { fontFamily: 'Arial Black', fontSize: 16, fill: 0x3b82f6 }
        });
        this.ui.blockText.x = 220;
        this.ui.blockText.y = 17;
        uiContainer.addChild(this.ui.blockText);
    },
    
    updateUI() {
        const { player } = this.state;
        
        // HP Bar (PixiJS)
        if (this.ui?.hpFill) {
            const hpPercent = player.hp / player.maxHp;
            this.ui.hpFill.clear();
            this.ui.hpFill.roundRect(17, 17, 196 * hpPercent, 20, 3);
            this.ui.hpFill.fill({ color: hpPercent > 0.3 ? 0xef4444 : 0xff0000 });
        }
        
        if (this.ui?.hpText) {
            this.ui.hpText.text = `${player.hp}/${player.maxHp}`;
        }
        
        // Block
        if (this.ui?.blockText) {
            this.ui.blockText.text = player.block > 0 ? `[${player.block}]` : '';
        }
        
        // Card UI (DOM)
        this.updateCardUI();
    },
    
    showMessage(text, duration = 2000) {
        const el = document.getElementById('center-message');
        el.textContent = text;
        el.style.opacity = '1';
        
        setTimeout(() => {
            el.style.opacity = '0';
        }, duration);
    },
    
    // ==================== 이벤트 ====================
    
    bindEvents() {
        // Enemy click (for direct interaction, optional)
        this.enemySprites.forEach((enemy, i) => {
            enemy.eventMode = 'static';
            enemy.cursor = 'pointer';
            
            if (this.mobile.isMobile) {
                enemy.hitArea = new PIXI.Circle(0, -enemy.height * 0.5, Math.max(enemy.width, enemy.height) * 0.7);
            }
        });
    },
    
    // Mobile event binding
    bindMobileEvents() {
        if (!this.mobile.isTouch) return;
        
        // Stage touch events
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.battleAreaSize.width, this.battleAreaSize.height);
        
    },
    
    // 📱 터치 피드백 효과 추가
    addTouchFeedback(element) {
        element.addEventListener('touchstart', () => {
            element.classList.add('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
            element.classList.remove('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchcancel', () => {
            element.classList.remove('touch-active');
        }, { passive: true });
    },
    
    // 📱 햅틱 피드백 (진동)
    hapticFeedback(intensity = 'light') {
        if (!this.mobile.hapticEnabled) return;
        if (!navigator.vibrate) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 50, 10],
            error: [30, 50, 30, 50, 30],
            hit: [15, 30, 50]
        };
        
        navigator.vibrate(patterns[intensity] || patterns.light);
    },
    
    bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Ctrl + D: 디버그 토글
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDebug();
            }
            
            // F: 풀스크린 토글
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            }
        });
        
        // Grid coordinate tracking (mouse move)
        const battleArea = document.getElementById('battle-area');
        if (battleArea) {
            battleArea.addEventListener('mousemove', (e) => {
                this.updateGridCoords(e.clientX, e.clientY);
            });
            battleArea.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    this.updateGridCoords(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });
        }
    },
    
    // Update grid coordinate display
    updateGridCoords(clientX, clientY) {
        const coordsDiv = document.getElementById('grid-coords');
        if (!coordsDiv) return;
        
        const battleRect = document.getElementById('battle-area')?.getBoundingClientRect();
        if (!battleRect) return;
        
        const localX = clientX - battleRect.left;
        const localY = clientY - battleRect.top;
        
        // Convert screen to grid using DDOOBackground
        if (typeof DDOOBackground !== 'undefined' && DDOOBackground.screenToGrid) {
            const grid = DDOOBackground.screenToGrid(localX, localY);
            if (grid) {
                coordsDiv.textContent = `Grid: (${grid.x.toFixed(1)}, ${grid.z.toFixed(1)}) | Screen: (${Math.round(localX)}, ${Math.round(localY)})`;
            } else {
                coordsDiv.textContent = `Screen: (${Math.round(localX)}, ${Math.round(localY)})`;
            }
        } else {
            coordsDiv.textContent = `Screen: (${Math.round(localX)}, ${Math.round(localY)})`;
        }
    },
    
    // 📱 풀스크린 버튼 생성
    createFullscreenButton() {
        const btn = document.createElement('button');
        btn.id = 'fullscreen-btn';
        btn.innerHTML = '⛶';
        btn.title = '풀스크린';
        btn.addEventListener('click', () => {
            this.hapticFeedback('light');
            this.toggleFullscreen();
        });
        document.body.appendChild(btn);
        
        // 풀스크린 상태 변화 감지
        document.addEventListener('fullscreenchange', () => {
            btn.innerHTML = document.fullscreenElement ? '⛶' : '⛶';
            btn.style.opacity = document.fullscreenElement ? '0.3' : '1';
        });
    },
    
    // 📱 풀스크린 토글
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // 풀스크린 진입
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen(); // iOS Safari
            }
        } else {
            // 풀스크린 종료
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    },
    
    // 📱 화면 방향 변화
    onOrientationChange() {
        console.log('📱 화면 방향 변경');
        
        // 약간의 딜레이 후 리사이즈 (iOS 대응)
        setTimeout(() => {
            this.mobile.isLandscape = window.innerWidth > window.innerHeight;
            this.onResize();
        }, 100);
    },
    
    // 📱 앱 가시성 변화 (탭 전환, 백그라운드)
    onVisibilityChange() {
        if (document.hidden) {
            console.log('📱 앱 백그라운드');
            // 게임 일시정지 (필요시)
            // this.pause();
        } else {
            console.log('📱 앱 포그라운드');
            // 게임 재개 (필요시)
            // this.resume();
        }
    },
    
    endTurn() {
        if (this.state.phase !== 'player') return;
        
        this.state.turn++;
        
        // Energy restore
        this.state.player.energy = this.state.player.maxEnergy;
        
        // Block decay (Dark Souls style - block resets each turn)
        this.state.player.block = 0;
        
        // Draw new hand
        const newHand = this.getRandomHand(5);
        this.drawHand(newHand);
        
        this.updateUI();
        this.showMessage(`Turn ${this.state.turn + 1}`, 800);
    },
    
    // Get random cards for new hand
    getRandomHand(count) {
        const availableCards = ['slash', 'slash', 'thrust', 'heavySlash', 'block', 'block', 'ironFlesh', 'parry', 'roll', 'quickstep', 'estus'];
        const hand = [];
        
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * availableCards.length);
            hand.push(availableCards[idx]);
        }
        
        return hand;
    },
    
    // 테마 변경
    setTheme(name) {
        DDOOBackground.setTheme(name);
        this.showMessage(`🌙 ${name.toUpperCase()}`, 1500);
    },
    
    // ==================== 유틸리티 ====================
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    onResize() {
        // Get new dimensions
        const battleArea = document.getElementById('battle-area');
        const cardArea = document.getElementById('card-area');
        const battleRect = battleArea.getBoundingClientRect();
        const cardRect = cardArea.getBoundingClientRect();
        
        this.battleAreaSize = { width: battleRect.width, height: battleRect.height };
        this.cardAreaSize = { width: cardRect.width, height: cardRect.height };
        
        // Resize battle app
        this.app.renderer.resize(this.battleAreaSize.width, this.battleAreaSize.height);
        
        // Resize 3D background
        DDOOBackground.handleResize();
        
        // Update positions
        this.updateAllCharacterPositions();
        
        // Update hit areas
        if (this.app.stage.hitArea) {
            this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.battleAreaSize.width, this.battleAreaSize.height);
        }
    }
};

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    Game.init().catch(console.error);
});
