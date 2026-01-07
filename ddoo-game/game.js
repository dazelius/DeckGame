// =====================================================
// 🎮 DDOO Game - 메인 게임 코드
// 📱 모바일 최적화 버전
// =====================================================

const Game = {
    // PixiJS 앱 (배틀 영역)
    app: null,
    
    // PixiJS 앱 (카드 영역)
    cardApp: null,
    
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
        // === ATTACKS ===
        slash: { 
            name: 'Slash', cost: 1, type: 'attack', damage: 6, 
            color: 0xef4444, desc: '6 DMG'
        },
        heavySlash: { 
            name: 'Heavy', cost: 2, type: 'attack', damage: 12, 
            color: 0xff6b35, desc: '12 DMG'
        },
        thrust: { 
            name: 'Thrust', cost: 1, type: 'attack', damage: 8, 
            color: 0xef4444, desc: '8 DMG, Pierce'
        },
        backstab: { 
            name: 'Backstab', cost: 2, type: 'attack', damage: 20, 
            color: 0x8b0000, desc: '20 DMG'
        },
        
        // === DEFENSE ===
        block: { 
            name: 'Block', cost: 1, type: 'skill', block: 5, 
            color: 0x3b82f6, desc: '+5 Block'
        },
        ironFlesh: { 
            name: 'Iron', cost: 2, type: 'skill', block: 12, 
            color: 0x6b7280, desc: '+12 Block'
        },
        parry: { 
            name: 'Parry', cost: 1, type: 'skill', block: 8, interrupt: 800,
            color: 0xfbbf24, desc: '+8 Block, Interrupt'
        },
        
        // === MOVEMENT ===
        roll: { 
            name: 'Roll', cost: 1, type: 'move', dodge: 2, 
            color: 0x22c55e, desc: 'Dodge Back'
        },
        quickstep: { 
            name: 'Step', cost: 0, type: 'move', dodge: 1, 
            color: 0x10b981, desc: 'Free Move'
        },
        
        // === SPECIAL ===
        estus: { 
            name: 'Estus', cost: 2, type: 'skill', heal: 15, 
            color: 0xf59e0b, desc: 'Heal 15 HP'
        },
        riposte: { 
            name: 'Riposte', cost: 1, type: 'attack', damage: 15, 
            color: 0xdc2626, desc: '15 DMG (After Parry)'
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
    cards: {
        hand: [],           // Current hand (card data)
        sprites: [],        // Card sprites in hand
        dragging: null,     // Currently dragging card sprite
        dragData: null,     // Drag data (offset, original position)
        hoveredTarget: null // Enemy/player being hovered
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
        
        // ==================== Card App ====================
        console.log('[Game] Creating card app...');
        this.cardApp = new PIXI.Application();
        await this.cardApp.init({
            width: Math.max(this.cardAreaSize.width, 400),
            height: Math.max(this.cardAreaSize.height, 100),
            background: 0x0d0d1a,
            antialias: true,
            resolution: pixelRatio,
            autoDensity: true
        });
        
        const cardContainer = document.getElementById('card-canvas-container');
        if (!cardContainer) {
            console.error('[Game] Card container not found!');
        } else {
            cardContainer.appendChild(this.cardApp.canvas);
            this.cardApp.canvas.style.cssText = 'width:100%;height:100%;touch-action:none;display:block;';
            console.log('[Game] Card canvas appended');
        }
        
        // Create containers
        this.createContainers();
        
        // Create characters
        await this.createCharacters3D();
        
        // Create card system
        console.log('[Game] Initializing card system...');
        this.initCardSystem();
        
        // Draw initial hand (5 cards)
        console.log('[Game] Drawing initial hand...');
        this.drawHand(['slash', 'slash', 'thrust', 'block', 'roll']);
        console.log('[Game] Cards drawn:', this.cards.sprites.length);
        
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
    
    // ==================== Card System (Canvas-based) ====================
    
    initCardSystem() {
        if (!this.cardApp || !this.cardApp.stage) {
            console.error('[Game] Card app not ready!');
            return;
        }
        
        console.log('[Game] Card app stage ready');
        
        // UI container (background, energy, button) - bottom layer
        this.cards.uiContainer = new PIXI.Container();
        this.cards.uiContainer.zIndex = 0;
        this.cardApp.stage.addChild(this.cards.uiContainer);
        
        // Card container - middle layer
        this.cards.container = new PIXI.Container();
        this.cards.container.sortableChildren = true;
        this.cards.container.zIndex = 10;
        this.cardApp.stage.addChild(this.cards.container);
        
        // Drag layer - top layer
        this.cards.dragLayer = new PIXI.Container();
        this.cards.dragLayer.zIndex = 100;
        this.cardApp.stage.addChild(this.cards.dragLayer);
        
        // Enable sorting
        this.cardApp.stage.sortableChildren = true;
        
        // Draw card UI (background, energy, button)
        this.drawCardUI();
        
        console.log('[Game] Card system initialized');
    },
    
    drawCardUI() {
        // Get actual renderer size
        const width = this.cardApp.renderer.width / this.cardApp.renderer.resolution;
        const height = this.cardApp.renderer.height / this.cardApp.renderer.resolution;
        
        console.log(`[Game] Drawing card UI: ${width}x${height}`);
        
        // Clear existing
        this.cards.uiContainer.removeChildren();
        
        // Background
        const bg = new PIXI.Graphics();
        bg.rect(0, 0, width, height);
        bg.fill({ color: 0x0d0d1a });
        bg.moveTo(0, 2);
        bg.lineTo(width, 2);
        bg.stroke({ color: 0x4a4a6a, width: 3 });
        this.cards.uiContainer.addChild(bg);
        
        const centerY = height / 2;
        
        // Energy orb (left)
        const energyBg = new PIXI.Graphics();
        energyBg.circle(35, centerY, 22);
        energyBg.fill({ color: 0x1a1a2e });
        energyBg.stroke({ color: 0xfbbf24, width: 3 });
        this.cards.uiContainer.addChild(energyBg);
        
        this.cards.energyText = new PIXI.Text({
            text: `${this.state.player.energy}`,
            style: {
                fontFamily: 'Arial',
                fontSize: 22,
                fontWeight: 'bold',
                fill: 0xfbbf24
            }
        });
        this.cards.energyText.anchor.set(0.5);
        this.cards.energyText.x = 35;
        this.cards.energyText.y = centerY;
        this.cards.uiContainer.addChild(this.cards.energyText);
        
        // End turn button (right)
        const btnX = width - 75;
        const btn = new PIXI.Graphics();
        btn.roundRect(btnX, centerY - 16, 60, 32, 6);
        btn.fill({ color: 0x3d3d5c });
        btn.stroke({ color: 0x5a5a7a, width: 2 });
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => {
            this.hapticFeedback('medium');
            this.endTurn();
        });
        btn.on('pointerover', () => btn.tint = 0xcccccc);
        btn.on('pointerout', () => btn.tint = 0xffffff);
        this.cards.uiContainer.addChild(btn);
        
        const btnText = new PIXI.Text({
            text: 'END',
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: 0xffffff }
        });
        btnText.anchor.set(0.5);
        btnText.x = btnX + 30;
        btnText.y = centerY;
        this.cards.uiContainer.addChild(btnText);
        
        console.log('[Game] Card UI drawn');
    },
    
    // Draw cards in hand
    drawHand(cardIds) {
        console.log(`[Game] Drawing hand: ${cardIds.join(', ')}`);
        
        // Clear existing
        this.cards.sprites.forEach(s => {
            if (s.parent) s.parent.removeChild(s);
            s.destroy({ children: true });
        });
        this.cards.sprites = [];
        this.cards.hand = cardIds.map(id => ({ id, ...this.cardDatabase[id] }));
        
        if (!this.cardApp || !this.cardApp.renderer) {
            console.warn('[Game] Card app not ready');
            return;
        }
        
        // Get actual renderer size
        const width = this.cardApp.renderer.width / this.cardApp.renderer.resolution;
        const height = this.cardApp.renderer.height / this.cardApp.renderer.resolution;
        const { width: cardW, height: cardH, spacing } = this.cardConfig;
        
        console.log(`[Game] Card area size: ${width}x${height}`);
        
        if (width < 100 || height < 50) {
            console.warn('[Game] Card area too small');
            return;
        }
        
        const totalWidth = cardIds.length * (cardW + spacing) - spacing;
        const startX = Math.max(75, (width - totalWidth) / 2);  // Leave space for energy orb
        const baseY = height / 2;
        
        cardIds.forEach((cardId, i) => {
            const cardData = this.cardDatabase[cardId];
            if (!cardData) {
                console.warn(`[Game] Card not found: ${cardId}`);
                return;
            }
            
            try {
                const card = this.createCardSprite(cardData, i);
                card.x = startX + i * (cardW + spacing) + cardW / 2;
                card.y = baseY;
                card.baseX = card.x;
                card.baseY = card.y;
                card.cardIndex = i;
                card.cardId = cardId;
                card.zIndex = i;
                
                this.cards.container.addChild(card);
                this.cards.sprites.push(card);
                console.log(`[Game] Card ${cardId} created at (${card.x.toFixed(0)}, ${card.y.toFixed(0)})`);
            } catch (e) {
                console.error(`[Game] Failed to create card ${cardId}:`, e);
            }
        });
        
        console.log(`[Game] Drew ${this.cards.sprites.length} cards`);
    },
    
    // Create a card sprite
    createCardSprite(cardData, index) {
        const { width: w, height: h } = this.cardConfig;
        
        const container = new PIXI.Container();
        container.pivot.set(w / 2, h / 2);
        
        // Card background with gradient effect
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, w, h, 6);
        bg.fill({ color: 0x1a1a2e });
        bg.roundRect(0, 0, w, h, 6);
        bg.stroke({ color: cardData.color || 0x666666, width: 2 });
        container.addChild(bg);
        
        // Inner highlight
        const inner = new PIXI.Graphics();
        inner.roundRect(3, 3, w - 6, h - 6, 4);
        inner.stroke({ color: 0x2a2a4e, width: 1 });
        container.addChild(inner);
        
        // Cost circle (top-left)
        const costCircle = new PIXI.Graphics();
        costCircle.circle(0, 0, 12);
        costCircle.fill({ color: 0xfbbf24 });
        costCircle.stroke({ color: 0x000000, width: 2 });
        costCircle.x = 12;
        costCircle.y = 12;
        container.addChild(costCircle);
        
        const costText = new PIXI.Text({
            text: `${cardData.cost}`,
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: 0x000000 }
        });
        costText.anchor.set(0.5);
        costText.x = 12;
        costText.y = 12;
        container.addChild(costText);
        
        // Card name (top)
        const nameText = new PIXI.Text({
            text: cardData.name,
            style: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: 0xffffff }
        });
        nameText.anchor.set(0.5, 0);
        nameText.x = w / 2;
        nameText.y = 6;
        container.addChild(nameText);
        
        // Center value (damage/block/etc)
        let valueStr = '';
        if (cardData.damage) valueStr = `${cardData.damage}`;
        else if (cardData.block) valueStr = `${cardData.block}`;
        else if (cardData.heal) valueStr = `+${cardData.heal}`;
        
        if (valueStr) {
            const valText = new PIXI.Text({
                text: valueStr,
                style: { fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: cardData.color || 0xffffff }
            });
            valText.anchor.set(0.5);
            valText.x = w / 2;
            valText.y = h / 2 - 5;
            container.addChild(valText);
        }
        
        // Description (bottom)
        if (cardData.desc) {
            const descText = new PIXI.Text({
                text: cardData.desc,
                style: { fontFamily: 'Arial', fontSize: 8, fill: 0xaaaaaa }
            });
            descText.anchor.set(0.5, 1);
            descText.x = w / 2;
            descText.y = h - 5;
            container.addChild(descText);
        }
        
        // Type indicator line at bottom
        const typeLine = new PIXI.Graphics();
        typeLine.roundRect(5, h - 3, w - 10, 2, 1);
        typeLine.fill({ color: cardData.color || 0x666666 });
        container.addChild(typeLine);
        
        // Make interactive
        container.eventMode = 'static';
        container.cursor = 'pointer';
        container.hitArea = new PIXI.Rectangle(0, 0, w, h);
        
        // Hover events
        container.on('pointerover', () => this.onCardHover(container, true));
        container.on('pointerout', () => this.onCardHover(container, false));
        
        // Drag events
        container.on('pointerdown', (e) => this.onCardDragStart(e, container));
        
        return container;
    },
    
    onCardHover(card, isHover) {
        if (this.cards.dragging) return;
        
        const { hoverScale, hoverY } = this.cardConfig;
        
        gsap.to(card, {
            y: isHover ? card.baseY + hoverY : card.baseY,
            duration: 0.15,
            ease: 'power2.out'
        });
        gsap.to(card.scale, {
            x: isHover ? hoverScale : 1,
            y: isHover ? hoverScale : 1,
            duration: 0.15,
            ease: 'power2.out'
        });
        
        card.zIndex = isHover ? 50 : card.cardIndex;
    },
    
    onCardDragStart(event, card) {
        if (this.state.phase !== 'player') return;
        if (this.cards.dragging) return;  // Already dragging
        
        const cardData = this.cardDatabase[card.cardId];
        if (!cardData) return;
        
        if (this.state.player.energy < cardData.cost) {
            this.showMessage('Energy!', 600);
            this.hapticFeedback('error');
            // Shake the card
            gsap.to(card, { x: card.x - 5, duration: 0.05, yoyo: true, repeat: 3 });
            return;
        }
        
        this.cards.dragging = card;
        this.cards.dragData = {
            startX: card.baseX,
            startY: card.baseY,
            cardData: cardData,
            cardIndex: card.cardIndex
        };
        
        // Visual feedback
        card.zIndex = 200;
        gsap.to(card.scale, { x: this.cardConfig.dragScale, y: this.cardConfig.dragScale, duration: 0.1 });
        
        this.hapticFeedback('light');
        
        // Show valid targets
        this.showDragTargets(cardData.type);
        
        // Global events (window level for better tracking)
        this._onDragMove = (e) => this.onCardDragMove(e);
        this._onDragEnd = (e) => this.onCardDragEnd(e);
        window.addEventListener('mousemove', this._onDragMove);
        window.addEventListener('mouseup', this._onDragEnd);
        window.addEventListener('touchmove', this._onDragMove, { passive: false });
        window.addEventListener('touchend', this._onDragEnd);
    },
    
    onCardDragMove(event) {
        if (!this.cards.dragging) return;
        
        event.preventDefault?.();
        
        const card = this.cards.dragging;
        const data = this.cards.dragData;
        
        // Get mouse/touch position
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        // Get card area bounds
        const cardAreaRect = document.getElementById('card-area').getBoundingClientRect();
        const battleRect = document.getElementById('battle-area').getBoundingClientRect();
        
        // Convert to card area local coordinates
        const localX = clientX - cardAreaRect.left;
        const localY = clientY - cardAreaRect.top;
        
        // Move card
        card.x = localX;
        card.y = localY;
        
        // Check if over battle area
        const isOverBattle = clientY < cardAreaRect.top;
        
        if (isOverBattle) {
            // Scale up when over battle area
            gsap.to(card.scale, { x: 1.3, y: 1.3, duration: 0.1 });
            card.alpha = 0.8;
            
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
                    this.hapticFeedback('light');
                }
            }
        } else {
            // Normal scale in card area
            gsap.to(card.scale, { x: this.cardConfig.dragScale, y: this.cardConfig.dragScale, duration: 0.1 });
            card.alpha = 1;
            
            if (this.cards.hoveredTarget) {
                this.clearTargetHighlight(this.cards.hoveredTarget);
                this.cards.hoveredTarget = null;
            }
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
        
        // Execute card if dropped on valid target
        const usedCard = this.cards.hoveredTarget !== null;
        
        if (usedCard) {
            // Use the card
            this.executeCardOnTarget(card.cardId, data.cardIndex, this.cards.hoveredTarget);
            this.clearTargetHighlight(this.cards.hoveredTarget);
            this.cards.hoveredTarget = null;
        } else {
            // Return card to hand position
            gsap.to(card, {
                x: data.startX,
                y: data.startY,
                duration: 0.2,
                ease: 'back.out(1.5)'
            });
        }
        
        // Reset card visual
        card.alpha = 1;
        gsap.to(card.scale, { x: 1, y: 1, duration: 0.15 });
        card.zIndex = data.cardIndex;
        
        // Hide targets
        this.hideDragTargets();
        
        this.cards.dragging = null;
        this.cards.dragData = null;
    },
    
    // Find target at battle area position
    findTargetAt(screenX, screenY, cardType) {
        const hitRadius = 70;
        
        if (cardType === 'attack') {
            for (let i = 0; i < this.enemySprites.length; i++) {
                const enemy = this.enemySprites[i];
                if (!enemy) continue;
                
                const dx = enemy.x - screenX;
                const dy = enemy.y - screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < hitRadius) {
                    return { type: 'enemy', index: i, sprite: enemy };
                }
            }
        }
        
        if (cardType === 'skill' || cardType === 'move') {
            if (this.player) {
                const dx = this.player.x - screenX;
                const dy = this.player.y - screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < hitRadius) {
                    return { type: 'player', index: 0, sprite: this.player };
                }
            }
        }
        
        return null;
    },
    
    showDragTargets(cardType) {
        if (cardType === 'attack') {
            this.enemySprites.forEach(enemy => {
                if (enemy) DDOORenderer.setTargeted(enemy, true, 0xff4444, 0.3);
            });
        } else if (cardType === 'skill' || cardType === 'move') {
            if (this.player) DDOORenderer.setTargeted(this.player, true, 0x44ff44, 0.3);
        }
    },
    
    hideDragTargets() {
        this.enemySprites.forEach(enemy => {
            if (enemy) DDOORenderer.setTargeted(enemy, false);
        });
        if (this.player) DDOORenderer.setTargeted(this.player, false);
    },
    
    applyTargetHighlight(target, cardType) {
        const color = cardType === 'attack' ? 0xff0000 : 0x00ff00;
        DDOORenderer.setTargeted(target.sprite, true, color, 1.0);
        
        const s = target.sprite.scale.x;
        gsap.to(target.sprite.scale, { x: s * 1.15, y: s * 1.15, duration: 0.15, ease: 'back.out' });
    },
    
    clearTargetHighlight(target) {
        DDOORenderer.setTargeted(target.sprite, false);
        
        const s = target.sprite.scale.x;
        gsap.to(target.sprite.scale, { x: s / 1.15, y: s / 1.15, duration: 0.15, ease: 'power2.out' });
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
    
    // Remove card and rearrange remaining cards
    removeCardFromHand(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.cards.sprites.length) return;
        
        const card = this.cards.sprites[cardIndex];
        
        // Animate card disappearing
        gsap.to(card, {
            y: card.y - 50,
            alpha: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                // Remove from arrays
                card.destroy({ children: true });
                this.cards.sprites.splice(cardIndex, 1);
                this.cards.hand.splice(cardIndex, 1);
                
                // Rearrange remaining cards
                this.rearrangeCards();
            }
        });
    },
    
    // Rearrange cards after one is removed
    rearrangeCards() {
        const { width: cardW, spacing } = this.cardConfig;
        const width = this.cardApp.renderer.width / this.cardApp.renderer.resolution;
        const height = this.cardApp.renderer.height / this.cardApp.renderer.resolution;
        
        const count = this.cards.sprites.length;
        if (count === 0) return;
        
        const totalWidth = count * (cardW + spacing) - spacing;
        const startX = Math.max(75, (width - totalWidth) / 2);
        const baseY = height / 2;
        
        this.cards.sprites.forEach((card, i) => {
            const newX = startX + i * (cardW + spacing) + cardW / 2;
            card.cardIndex = i;
            card.zIndex = i;
            
            gsap.to(card, {
                x: newX,
                duration: 0.25,
                ease: 'power2.out'
            });
            
            card.baseX = newX;
            card.baseY = baseY;
        });
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
        
        // Dash to enemy
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
        
        enemyData.hp = Math.max(0, enemyData.hp - finalDamage);
        
        if (typeof Combat !== 'undefined') {
            Combat.interruptEnemy(enemyIndex, 400);
        }
        
        await this.delay(200);
        DDOORenderer.setTargeted(enemy, false);
        
        // Return
        await this.dashTo(originalPos.x, originalPos.z, 0.25);
        
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
        
        // HP Bar
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
        
        // Energy (card area)
        if (this.cards?.energyText) {
            this.cards.energyText.text = `${player.energy}/${player.maxEnergy}`;
        }
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
        
        // Card app touch events
        this.cardApp.stage.eventMode = 'static';
        this.cardApp.stage.hitArea = new PIXI.Rectangle(0, 0, this.cardAreaSize.width, this.cardAreaSize.height);
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
        
        // Resize card app
        this.cardApp.renderer.resize(this.cardAreaSize.width, this.cardAreaSize.height);
        
        // Resize 3D background
        DDOOBackground.handleResize();
        
        // Update positions
        this.updateAllCharacterPositions();
        
        // Update hit areas
        if (this.app.stage.hitArea) {
            this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.battleAreaSize.width, this.battleAreaSize.height);
        }
        if (this.cardApp.stage.hitArea) {
            this.cardApp.stage.hitArea = new PIXI.Rectangle(0, 0, this.cardAreaSize.width, this.cardAreaSize.height);
        }
        
        // Redraw cards
        if (this.cards?.hand?.length > 0) {
            const cardIds = this.cards.hand.map(c => c.id);
            this.drawHand(cardIds);
        }
        
        // Redraw card UI
        if (this.cards?.uiContainer) {
            this.cards.uiContainer.removeChildren();
            this.drawCardUI();
        }
    }
};

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    Game.init().catch(console.error);
});
