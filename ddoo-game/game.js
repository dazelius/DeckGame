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
            energy: 5,           // Current energy (float for smooth regen)
            maxEnergy: 10,       // Max energy (Clash Royale style)
            energyRegen: 0.5,    // Energy per second (2 seconds per 1 energy)
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
    gridAlwaysShow: true,  // Grid always visible (no debug toggle needed)
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
    
    // 3D world coordinates (10x3 grid arena) - cell centers at x.5, z.5
    worldPositions: {
        player: { x: 2.5, y: 0, z: 1.5 },   // Cell (2,1) center
        enemies: [
            { x: 7.5, y: 0, z: 0.5 },   // Cell (7,0) center
            { x: 7.5, y: 0, z: 2.5 }    // Cell (7,2) center
        ]
    },
    
    // Arena settings (10x3 grid)
    arena: {
        width: 10,
        height: 3,   // Z-axis (depth) - 3 rows only
        depth: 3,    // Alias for height
        gridSize: 1,
        playerZone: { minX: 0, maxX: 4 },  // Player can be in X: 0-4
        enemyZone: { minX: 5, maxX: 9 }    // Enemies can be in X: 5-9
    },
    
    // Battle/Card area sizes
    battleAreaSize: { width: 0, height: 0 },
    cardAreaSize: { width: 0, height: 0 },
    
    // Position update loop ID
    positionLoopId: null,
    
    // ==================== Card System (Canvas-based) ====================
    
    // Card Database - Dark Souls Style
    cardDatabase: {
        // === ATTACKS (with range info) ===
        slash: { 
            name: 'Slash', cost: 1, type: 'attack', damage: 6, 
            range: 2,  // Melee range
            color: 0xef4444, desc: '6 DMG (2칸)',
            anim: 'card.strike',
            playerAnim: 'player.attack',
            enemyAnim: 'enemy.hit'
        },
        heavySlash: { 
            name: 'Heavy', cost: 2, type: 'attack', damage: 12, 
            range: 2,  // Melee range
            knockback: 2,
            color: 0xff6b35, desc: '12 DMG (2칸)',
            anim: 'card.bash',
            playerAnim: 'player.heavy_slash',
            enemyAnim: 'enemy.hit'
        },
        thrust: { 
            name: 'Thrust', cost: 1, type: 'attack', damage: 8, 
            range: 3,  // Longer reach
            knockback: 0,
            color: 0xef4444, desc: '8 DMG (3칸)',
            playerAnim: 'player.stab',
            enemyAnim: 'enemy.hit'
        },
        backstab: { 
            name: 'Backstab', cost: 2, type: 'attack', damage: 20, 
            range: 1,  // Must be adjacent
            color: 0x8b0000, desc: '20 DMG (1칸)',
            playerAnim: 'player.backstab_strike',
            enemyAnim: 'enemy.hit'
        },
        riposte: { 
            name: 'Riposte', cost: 1, type: 'attack', damage: 15, 
            range: 2,
            color: 0xdc2626, desc: '15 DMG (2칸)',
            playerAnim: 'player.attack',
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
        
        // === MOVEMENT (all target grid) ===
        dash: {
            name: 'Dash', cost: 1, type: 'move', moveTo: true,
            color: 0x8b5cf6, desc: 'Move Anywhere',
            playerAnim: 'player.dodge',
            targetType: 'grid'
        },
        
        // === COMBO ATTACKS ===
        battleOpening: {
            name: 'Tackle', cost: 3, type: 'attack', damage: 8,
            range: 5,  // Can charge from far away
            knockback: 2,
            color: 0xff4500, desc: '8 DMG Charge (5칸)',
            anim: 'card.battleopening',
            playerAnim: 'player.power_windup',
            enemyAnim: 'enemy.power_impact',
            slow: true  // Dark Souls slow feel
        },
        flurry: {
            name: 'Flurry', cost: 2, type: 'attack', damage: 3,
            range: 2,  // Melee range
            hits: 3,   // Multi-hit
            color: 0xdc143c, desc: '3x3 DMG (2칸)',
            anim: 'card.flurry',
            playerAnim: 'player.stab',
            enemyAnim: 'enemy.hit',
            slow: true  // Dark Souls slow feel
        },
        
        // === SPECIAL ===
        estus: { 
            name: 'Estus', cost: 2, type: 'skill', heal: 15, 
            color: 0xf59e0b, desc: 'Heal 15 HP'
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
    
    // Card state (Clash Royale style - infinite cycle)
    cards: {
        hand: [],           // Current hand (card IDs)
        deck: [],           // Remaining deck (card IDs)
        elements: [],       // Card DOM elements
        selectedIndex: -1,  // Currently selected card index (-1 = none)
        selectedCard: null, // Selected card data
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
        this.drawHand(['slash', 'thrust', 'dash', 'block', 'flurry']);
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
        
        // 디버그 레이어 (그리드 항상 표시)
        this.containers.debug = new PIXI.Container();
        this.containers.debug.zIndex = 5;
        this.containers.debug.visible = this.gridAlwaysShow;  // Grid always visible
        this.app.stage.addChild(this.containers.debug);
        
        // 하이라이트 레이어 (카드 타겟 표시용 - 캐릭터 위에)
        this.containers.highlights = new PIXI.Container();
        this.containers.highlights.zIndex = 15;  // Above characters
        this.containers.highlights.visible = false;
        this.app.stage.addChild(this.containers.highlights);
        
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
        // Vertical lines (X direction)
        for (let x = 0; x <= width; x++) {
            const start = DDOOBackground.project3DToScreen(x, 0, 0);
            const end = DDOOBackground.project3DToScreen(x, 0, depth);
            
            if (start && end && start.visible && end.visible) {
                const isCenter = (x === 5);  // Battle line
                grid.moveTo(start.screenX, start.screenY);
                grid.lineTo(end.screenX, end.screenY);
                grid.stroke({ 
                    color: isCenter ? 0xffcc00 : 0x66ff66, 
                    alpha: isCenter ? 0.8 : 0.5, 
                    width: isCenter ? 3 : 1 
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
                    color: 0x66ff66, 
                    alpha: 0.5, 
                    width: 1 
                });
            }
        }
        
        // Grid cell numbers (every 2 cells for readability)
        for (let x = 0; x <= width; x += 2) {
            for (let z = 0; z <= depth; z += 2) {
                const pos = DDOOBackground.project3DToScreen(x + 0.5, 0, z + 0.5);
                if (pos && pos.visible) {
                    const label = new PIXI.Text({
                        text: `${x},${z}`,
                        style: { fontSize: 9, fill: 0xaaffaa, alpha: 0.6 }
                    });
                    label.x = pos.screenX - 10;
                    label.y = pos.screenY - 5;
                    label.alpha = 0.5;
                    this.containers.debug.addChild(label);
                }
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
            scale: 0.6,  // Smaller player
            outline: { enabled: false },
            shadow: { enabled: false },
            breathing: { enabled: true, scaleAmount: 0.006 }
        });
        
        if (this.player) {
            this.player.defaultFacing = 'right';  // Player faces right (toward enemies)
            this.placeCharacter3D(this.player, this.worldPositions.player);
            this.containers.characters.addChild(this.player);
            
            // Create HP bar for player
            this.createHPBar(this.player, this.state.player);
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
        
        // 적 생성 (고블린 전사만)
        for (let i = 0; i < this.worldPositions.enemies.length; i++) {
            const enemy = await DDOORenderer.createSprite('goblin.png', {
                scale: 0.4,  // Smaller goblins
                outline: { enabled: false },
                shadow: { enabled: false },
                breathing: { enabled: true, scaleAmount: 0.005 }
            });
            
            if (enemy) {
                enemy.defaultFacing = 'left';  // Enemy faces left (toward player)
                this.placeCharacter3D(enemy, this.worldPositions.enemies[i]);
                enemy.enemyIndex = i;
                this.containers.characters.addChild(enemy);
                this.enemySprites.push(enemy);
                
                // 적 데이터
                const enemyData = {
                    hp: 30 + i * 10,
                    maxHp: 30 + i * 10,
                    block: 0,
                    intent: 'attack'
                };
                this.state.enemies.push(enemyData);
                
                // Create HP bar for enemy
                this.createHPBar(enemy, enemyData);
                
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
            
            // Determine flip based on defaultFacing
            // Sprites are drawn facing LEFT by default
            // To face RIGHT, we flip (flipX = -1)
            let flipX = 1;  // Default: face left (no flip)
            if (sprite.defaultFacing === 'right') {
                flipX = -1;  // Flip to face right
            }
            if (sprite.currentFacing === 'right') {
                flipX = -1;  // Temporarily facing right
            } else if (sprite.currentFacing === 'left') {
                flipX = 1;   // Temporarily facing left
            }
            
            sprite.scale.set(flipX * baseScale * depthScale, baseScale * depthScale);
            
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
            this.updateHPBar(this.player, this.state.player);
        }
        
        this.enemySprites.forEach((enemy, i) => {
            if (this.worldPositions.enemies[i]) {
                this.placeCharacter3D(enemy, this.worldPositions.enemies[i]);
                this.updateHPBar(enemy, this.state.enemies[i]);
            }
        });
        
        // Update battle grid
        if (this.gridVisible) {
            this.drawBattleGrid();
        }
        
        // Update grid (always visible)
        if (this.gridAlwaysShow || this.debug.enabled) {
            this.drawDebugGrid();
        }
    },
    
    // Create HP bar above character
    createHPBar(sprite, data) {
        if (!sprite) return;
        
        const hpBar = new PIXI.Container();
        hpBar.zIndex = 100;
        
        // Background
        const bg = new PIXI.Graphics();
        bg.roundRect(-25, 0, 50, 6, 2);
        bg.fill({ color: 0x222222, alpha: 0.8 });
        bg.stroke({ color: 0x444444, width: 1 });
        hpBar.addChild(bg);
        
        // Fill
        const fill = new PIXI.Graphics();
        hpBar.addChild(fill);
        hpBar.fill = fill;
        
        // Store reference
        sprite.hpBar = hpBar;
        sprite.hpBarData = data;
        
        this.containers.characters.addChild(hpBar);
    },
    
    // Update HP bar position and fill
    updateHPBar(sprite, data) {
        if (!sprite || !sprite.hpBar || !data) return;
        
        const hpBar = sprite.hpBar;
        const hpPercent = Math.max(0, data.hp / data.maxHp);
        
        // Position above character
        hpBar.x = sprite.x;
        hpBar.y = sprite.y - (sprite.height || 50) - 15;
        hpBar.zIndex = sprite.zIndex + 1;
        
        // Update fill
        const fill = hpBar.fill;
        fill.clear();
        
        // Color based on HP
        let color = 0x22c55e;  // Green
        if (hpPercent < 0.6) color = 0xfbbf24;  // Yellow
        if (hpPercent < 0.3) color = 0xef4444;  // Red
        
        fill.roundRect(-24, 1, 48 * hpPercent, 4, 1);
        fill.fill({ color });
        
        // Hide if dead
        hpBar.visible = data.hp > 0;
    },
    
    // Face target direction (flip sprite)
    faceTarget(sprite, targetX) {
        if (!sprite) return;
        
        const currentX = sprite.x;
        const shouldFaceRight = targetX > currentX;
        sprite.currentFacing = shouldFaceRight ? 'right' : 'left';
    },
    
    // Face target by world position
    faceTargetWorld(sprite, myWorldPos, targetWorldPos) {
        if (!sprite || !myWorldPos || !targetWorldPos) return;
        
        const shouldFaceRight = targetWorldPos.x > myWorldPos.x;
        sprite.currentFacing = shouldFaceRight ? 'right' : 'left';
    },
    
    // Reset character facing to default
    resetFacing(sprite) {
        if (!sprite) return;
        sprite.currentFacing = null;  // Use defaultFacing
    },
    
    // Restore character visibility after DDOOAction animations
    restoreCharacterVisibility() {
        // Restore player
        if (this.player) {
            this.player.visible = true;
            this.player.alpha = 1;
            // Restore scale if needed
            const baseScale = this.player.baseScale || 1.0;
            const screenPos = DDOOBackground.project3DToScreen(
                this.worldPositions.player.x, 
                this.worldPositions.player.y, 
                this.worldPositions.player.z
            );
            if (screenPos) {
                const depthScale = screenPos.scale * 0.5;
                const flipX = this.player.defaultFacing === 'right' ? -1 : 1;
                this.player.scale.set(flipX * baseScale * depthScale, baseScale * depthScale);
            }
        }
        
        // Restore enemies
        this.enemySprites.forEach((enemy, i) => {
            if (enemy) {
                enemy.visible = true;
                enemy.alpha = 1;
                // Restore scale if needed
                const baseScale = enemy.baseScale || 1.0;
                const enemyPos = this.worldPositions.enemies[i];
                if (enemyPos) {
                    const screenPos = DDOOBackground.project3DToScreen(
                        enemyPos.x, enemyPos.y, enemyPos.z
                    );
                    if (screenPos) {
                        const depthScale = screenPos.scale * 0.5;
                        const flipX = enemy.defaultFacing === 'right' ? -1 : 1;
                        enemy.scale.set(flipX * baseScale * depthScale, baseScale * depthScale);
                    }
                }
            }
        });
        
        console.log('[Game] Character visibility restored');
    },
    
    // Start position update loop (sync with 3D camera)
    startPositionLoop() {
        let lastTime = performance.now();
        
        const update = () => {
            const now = performance.now();
            const delta = (now - lastTime) / 1000;  // Convert to seconds
            lastTime = now;
            
            // Update character positions
            this.updateAllCharacterPositions();
            
            // Update intent positions (above enemy heads)
            if (typeof Combat !== 'undefined') {
                Combat.updateAllIntentPositions();
            }
            
            // Energy regeneration (Clash Royale style)
            this.updateEnergyRegen(delta);
            
            this.positionLoopId = requestAnimationFrame(update);
        };
        update();
    },
    
    // Energy regeneration over time
    updateEnergyRegen(delta) {
        const player = this.state.player;
        if (player.energy < player.maxEnergy) {
            player.energy = Math.min(player.maxEnergy, player.energy + player.energyRegen * delta);
            this.updateEnergyBar();
            this.updateCardPlayability();
        }
    },
    
    // Update energy bar UI (Clash Royale style)
    updateEnergyBar() {
        const player = this.state.player;
        const percent = (player.energy / player.maxEnergy) * 100;
        
        // Update fill
        const fill = document.getElementById('energy-bar-fill');
        if (fill) {
            fill.style.width = `${percent}%`;
        }
        
        // Update number (floor to show whole energy)
        const number = document.getElementById('energy-number');
        if (number) {
            number.textContent = Math.floor(player.energy);
        }
        
        // Full bar glow effect
        const bar = document.getElementById('energy-bar');
        if (bar) {
            bar.classList.toggle('full', player.energy >= player.maxEnergy);
        }
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
        
        // Face the player before attacking
        const enemyWorldPos = this.worldPositions.enemies[enemyIndex];
        this.faceTargetWorld(enemy, enemyWorldPos, this.worldPositions.player);
        
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
        
        // Reset enemy facing to default (face player)
        this.resetFacing(enemy);
        
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
        // Update card playability based on current energy
        this.updateCardPlayability();
        
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
    
    // Draw cards in hand (DOM) - Clash Royale style with deck
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
        
        // Initialize deck with remaining cards (infinite cycle pool)
        const allCards = [
            'slash', 'slash', 'thrust', 'heavySlash',
            'block', 'block', 'ironFlesh', 'parry',
            'dash', 'dash', 'battleOpening', 'flurry',
            'estus', 'backstab', 'riposte'
        ];
        
        // Filter out cards in hand, rest goes to deck
        this.cards.deck = allCards.filter(c => !cardIds.includes(c));
        this.shuffleDeck();
        
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
        console.log(`[Game] Drew ${this.cards.elements.length} cards, Deck: ${this.cards.deck.length}`);
    },
    
    // Create a single card DOM element
    createCardElement(cardId, cardData, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.cardId = cardId;
        card.dataset.type = cardData.type;
        card.dataset.index = index;
        card.dataset.shortcut = index + 1;  // Shortcut key (1-5)
        
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
        // Click to select card
        const selectCard = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.state.phase !== 'player') return;
            
            const index = parseInt(card.dataset.index);
            this.selectCard(index);
        };
        
        card.addEventListener('click', selectCard);
        card.addEventListener('touchend', selectCard);
    },
    
    // Select a card by index (0-4)
    selectCard(index) {
        if (this.state.phase !== 'player') return;
        if (index < 0 || index >= this.cards.elements.length) return;
        
        const cardEl = this.cards.elements[index];
        const cardId = cardEl?.dataset.cardId;
        const cardData = this.cardDatabase[cardId];
        
        if (!cardEl || !cardData) return;
        
        // Check energy
        if (this.state.player.energy < cardData.cost) {
            this.showMessage('Energy!', 600);
            this.hapticFeedback('error');
            cardEl.classList.add('shake');
            setTimeout(() => cardEl.classList.remove('shake'), 300);
            return;
        }
        
        // Toggle selection if same card
        if (this.cards.selectedIndex === index) {
            this.deselectCard();
            return;
        }
        
        // Deselect previous
        this.deselectCard();
        
        // Select new card
        this.cards.selectedIndex = index;
        this.cards.selectedCard = { cardId, cardData, index };
        cardEl.classList.add('selected');
        
        this.hapticFeedback('light');
        
        // SLOW MOTION EFFECT
        this.startTargetingMode();
        
        // Show valid targets based on card type
        this.showCardTargets(cardData);
        
        console.log(`[Game] Card selected: ${cardData.name} (${index + 1})`);
    },
    
    // Deselect current card
    deselectCard() {
        if (this.cards.selectedIndex >= 0) {
            const prevCard = this.cards.elements[this.cards.selectedIndex];
            if (prevCard) prevCard.classList.remove('selected');
        }
        
        this.cards.selectedIndex = -1;
        this.cards.selectedCard = null;
        
        // END SLOW MOTION
        this.endTargetingMode();
        
        // Hide targets
        this.hideCardTargets();
    },
    
    // Start targeting mode with slow-motion effect
    startTargetingMode() {
        // Slow down combat
        if (typeof Combat !== 'undefined' && typeof Combat.setTimeScale === 'function') {
            Combat.setTimeScale(0.2);  // 20% speed
        } else if (typeof Combat !== 'undefined' && Combat.state) {
            Combat.state.timeScale = 0.2;  // Direct state access fallback
        }
        
        // Screen effect - vignette + desaturate
        this.createTargetingOverlay();
        
        // Slow down animations
        if (typeof DDOOAction !== 'undefined' && DDOOAction.config) {
            this._originalSpeed = DDOOAction.config.speed;
            DDOOAction.config.speed = 0.3;
        }
        
        console.log('[Game] Targeting mode started');
    },
    
    // End targeting mode
    endTargetingMode() {
        // Restore combat speed
        if (typeof Combat !== 'undefined' && typeof Combat.setTimeScale === 'function') {
            Combat.setTimeScale(1.0);
        } else if (typeof Combat !== 'undefined' && Combat.state) {
            Combat.state.timeScale = 1.0;  // Direct state access fallback
        }
        
        // Remove overlay
        this.removeTargetingOverlay();
        
        // Restore animation speed
        if (typeof DDOOAction !== 'undefined' && DDOOAction.config && this._originalSpeed) {
            DDOOAction.config.speed = this._originalSpeed;
        }
        
        console.log('[Game] Targeting mode ended');
    },
    
    // Create targeting overlay (vignette + tint)
    createTargetingOverlay() {
        // Remove existing
        this.removeTargetingOverlay();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'targeting-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%);
            animation: targeting-pulse 1s ease-in-out infinite;
        `;
        document.body.appendChild(overlay);
        
        // Add style for animation
        if (!document.getElementById('targeting-style')) {
            const style = document.createElement('style');
            style.id = 'targeting-style';
            style.textContent = `
                @keyframes targeting-pulse {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 1; }
                }
                .enemy-target-highlight {
                    position: absolute;
                    border: 3px solid #ff4444;
                    border-radius: 50%;
                    background: rgba(255, 68, 68, 0.2);
                    pointer-events: auto;
                    cursor: crosshair;
                    animation: target-pulse 0.5s ease-in-out infinite;
                    z-index: 60;
                }
                @keyframes target-pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 20px rgba(255,68,68,0.5); }
                    50% { transform: translate(-50%, -50%) scale(1.1); box-shadow: 0 0 40px rgba(255,68,68,0.8); }
                }
                .grid-target-highlight {
                    position: absolute;
                    border: 2px solid #22c55e;
                    background: rgba(34, 197, 94, 0.3);
                    pointer-events: auto;
                    cursor: pointer;
                    z-index: 60;
                }
                .grid-target-highlight:hover {
                    background: rgba(34, 197, 94, 0.5);
                    border-color: #4ade80;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // Remove targeting overlay
    removeTargetingOverlay() {
        document.getElementById('targeting-overlay')?.remove();
        document.querySelectorAll('.enemy-target-highlight').forEach(el => el.remove());
        document.querySelectorAll('.grid-target-highlight').forEach(el => el.remove());
    },
    
    // Show valid targets for selected card
    showCardTargets(cardData) {
        // Highlight valid targets based on card type
        if (cardData.type === 'attack') {
            // Show attack range on grid + highlight enemies
            this.highlightAttackRange(cardData.range || 2);
            this.highlightEnemiesInRange(cardData.range || 2);
        } else if (cardData.type === 'move' && cardData.targetType === 'grid') {
            // Highlight grid cells
            this.highlightGridCells(cardData.maxDistance);
        } else if (cardData.type === 'skill') {
            // Skills are self-cast - execute immediately
            this.executeCard(this.cards.selectedIndex, { type: 'self' });
        }
    },
    
    // Highlight attack range on grid (PixiJS - Pixel Style)
    highlightAttackRange(range) {
        const playerPos = this.worldPositions.player;
        
        // Use dedicated highlights container
        if (!this.containers?.highlights) return;
        
        const hlContainer = this.containers.highlights;
        hlContainer.visible = true;
        hlContainer.removeChildren();  // Clear all previous highlights
        
        console.log(`[Game] Drawing attack range: ${range} from (${playerPos.x}, ${playerPos.z})`);
        
        // Highlight cells within range
        let count = 0;
        for (let x = 0; x < this.arena.width; x++) {
            for (let z = 0; z < this.arena.depth; z++) {
                // Calculate distance from player
                const dist = Math.abs(x - Math.floor(playerPos.x)) + Math.abs(z - Math.floor(playerPos.z));
                if (dist === 0 || dist > range) continue;
                
                const screenPos = DDOOBackground.project3DToScreen(x + 0.5, 0, z + 0.5);
                if (!screenPos || !screenPos.visible) continue;
                
                // Check if enemy is in this cell
                const hasEnemy = this.worldPositions.enemies.some(
                    ep => Math.floor(ep.x) === x && Math.floor(ep.z) === z
                );
                
                // Create highlight
                const highlight = new PIXI.Graphics();
                
                const w = 50, h = 30;  // Cell size
                const px = 3;  // Pixel border thickness
                
                if (hasEnemy) {
                    // Bright red for enemy cells - pixel style
                    highlight.beginFill(0xff0000, 0.6);
                    highlight.drawRect(-w/2, -h/2, w, h);
                    highlight.endFill();
                    
                    // Pixel border (yellow)
                    highlight.beginFill(0xffff00, 1);
                    highlight.drawRect(-w/2, -h/2, w, px);           // Top
                    highlight.drawRect(-w/2, h/2 - px, w, px);       // Bottom
                    highlight.drawRect(-w/2, -h/2, px, h);           // Left
                    highlight.drawRect(w/2 - px, -h/2, px, h);       // Right
                    highlight.endFill();
                    
                    // Corner accents (white)
                    highlight.beginFill(0xffffff, 1);
                    highlight.drawRect(-w/2, -h/2, px*2, px);
                    highlight.drawRect(-w/2, -h/2, px, px*2);
                    highlight.drawRect(w/2 - px*2, -h/2, px*2, px);
                    highlight.drawRect(w/2 - px, -h/2, px, px*2);
                    highlight.endFill();
                } else {
                    // Dim red for empty cells in range
                    highlight.beginFill(0xff4444, 0.3);
                    highlight.drawRect(-w/2, -h/2, w, h);
                    highlight.endFill();
                    
                    // Pixel border (red)
                    highlight.beginFill(0xff6666, 0.8);
                    highlight.drawRect(-w/2, -h/2, w, px);
                    highlight.drawRect(-w/2, h/2 - px, w, px);
                    highlight.drawRect(-w/2, -h/2, px, h);
                    highlight.drawRect(w/2 - px, -h/2, px, h);
                    highlight.endFill();
                }
                
                highlight.position.set(screenPos.screenX, screenPos.screenY);
                hlContainer.addChild(highlight);
                count++;
            }
        }
        
        console.log(`[Game] Created ${count} attack range highlights`);
    },
    
    // Hide all target indicators
    hideCardTargets() {
        // Remove DOM highlights
        document.querySelectorAll('.enemy-target-highlight').forEach(el => el.remove());
        document.querySelectorAll('.grid-target-highlight').forEach(el => el.remove());
        
        // Remove PixiJS highlights
        this.enemySprites.forEach(enemy => {
            if (enemy.targetHighlight) {
                enemy.targetHighlight.visible = false;
            }
        });
        
        // Hide highlights container
        if (this.containers?.highlights) {
            this.containers.highlights.visible = false;
            this.containers.highlights.removeChildren();
        }
        
        console.log('[Game] Hiding card targets');
    },
    
    // Highlight enemies within attack range (DOM-based for better interaction)
    highlightEnemiesInRange(range) {
        const playerPos = this.worldPositions.player;
        const battleArea = document.getElementById('battle-area');
        const rect = battleArea?.getBoundingClientRect() || { left: 0, top: 0 };
        
        this.enemySprites.forEach((enemy, index) => {
            const enemyPos = this.worldPositions.enemies[index];
            if (!enemyPos) return;
            
            // Calculate distance (Manhattan distance for grid)
            const dist = Math.abs(enemyPos.x - playerPos.x) + Math.abs(enemyPos.z - playerPos.z);
            const inRange = dist <= range;
            
            if (inRange) {
                // Get screen position
                const screenPos = DDOOBackground.project3DToScreen(
                    enemyPos.x + 0.5, enemyPos.y, enemyPos.z + 0.5
                );
                
                // Create DOM highlight
                const highlight = document.createElement('div');
                highlight.className = 'enemy-target-highlight';
                highlight.dataset.enemyIndex = index;
                highlight.style.left = (rect.left + screenPos.screenX) + 'px';
                highlight.style.top = (rect.top + screenPos.screenY - 40) + 'px';
                highlight.style.width = '80px';
                highlight.style.height = '80px';
                
                // Click handler
                highlight.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.executeCard(this.cards.selectedIndex, { type: 'enemy', index });
                });
                
                document.body.appendChild(highlight);
            }
        });
    },
    
    // Highlight valid grid cells for movement (PixiJS Pixel Style + DOM click handlers)
    highlightGridCells(maxDistance) {
        const playerPos = this.worldPositions.player;
        const battleArea = document.getElementById('battle-area');
        const rect = battleArea?.getBoundingClientRect() || { left: 0, top: 0 };
        
        // Use dedicated highlights container
        if (!this.containers?.highlights) return;
        
        const hlContainer = this.containers.highlights;
        hlContainer.visible = true;
        hlContainer.removeChildren();  // Clear all previous highlights
        
        console.log(`[Game] Drawing movement grid, maxDistance: ${maxDistance}`);
        
        // Highlight valid cells
        let count = 0;
        for (let x = 0; x < this.arena.width; x++) {
            for (let z = 0; z < this.arena.depth; z++) {
                // Check distance
                const dist = Math.abs(x - Math.floor(playerPos.x)) + Math.abs(z - Math.floor(playerPos.z));
                if (maxDistance && dist > maxDistance) continue;
                if (dist === 0) continue;  // Skip current position
                
                // Check if occupied by enemy
                const isOccupied = this.worldPositions.enemies.some(
                    ep => Math.floor(ep.x) === x && Math.floor(ep.z) === z
                );
                if (isOccupied) continue;
                
                // Get screen position
                const screenPos = DDOOBackground.project3DToScreen(x + 0.5, 0, z + 0.5);
                if (!screenPos || !screenPos.visible) continue;
                
                // PixiJS highlight (Pixel Style)
                const highlight = new PIXI.Graphics();
                
                const w = 50, h = 30;  // Cell size
                const px = 3;  // Pixel border thickness
                
                // Green fill for movement
                highlight.beginFill(0x00ff00, 0.4);
                highlight.drawRect(-w/2, -h/2, w, h);
                highlight.endFill();
                
                // Pixel border (cyan/green)
                highlight.beginFill(0x00ffaa, 1);
                highlight.drawRect(-w/2, -h/2, w, px);           // Top
                highlight.drawRect(-w/2, h/2 - px, w, px);       // Bottom
                highlight.drawRect(-w/2, -h/2, px, h);           // Left
                highlight.drawRect(w/2 - px, -h/2, px, h);       // Right
                highlight.endFill();
                
                // Corner accents (white)
                highlight.beginFill(0xffffff, 1);
                highlight.drawRect(-w/2, -h/2, px*2, px);
                highlight.drawRect(-w/2, -h/2, px, px*2);
                highlight.drawRect(w/2 - px*2, -h/2, px*2, px);
                highlight.drawRect(w/2 - px, -h/2, px, px*2);
                highlight.endFill();
                
                highlight.position.set(screenPos.screenX, screenPos.screenY);
                hlContainer.addChild(highlight);
                count++;
                
                // DOM click handler (invisible, for interaction)
                const clickTarget = document.createElement('div');
                clickTarget.className = 'grid-target-highlight';
                clickTarget.dataset.gridX = x;
                clickTarget.dataset.gridZ = z;
                clickTarget.style.cssText = `
                    position: fixed;
                    left: ${rect.left + screenPos.screenX - 30}px;
                    top: ${rect.top + screenPos.screenY - 18}px;
                    width: 60px;
                    height: 36px;
                    cursor: pointer;
                    z-index: 60;
                    background: transparent;
                    border: none;
                `;
                
                const gridX = x;
                const gridZ = z;
                clickTarget.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.executeCard(this.cards.selectedIndex, { type: 'grid', x: gridX, z: gridZ });
                });
                
                document.body.appendChild(clickTarget);
            }
        }
        
        console.log(`[Game] Created ${count} movement highlights`);
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
            
            // Find target (pass cardData for grid targeting)
            const newTarget = this.findTargetAt(battleX, battleY, data.cardData.type, data.cardData);
            
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
    findTargetAt(screenX, screenY, cardType, cardData = null) {
        // Larger hit radius for easier targeting
        const hitRadius = 120;
        const hitRadiusPlayer = 100;
        
        // Move card - target grid cell
        if (cardData?.targetType === 'grid' || cardData?.moveTo) {
            const gridPos = this.screenToGrid(screenX, screenY);
            if (gridPos) {
                // Check if cell is empty (not occupied)
                if (!this.isGridCellOccupied(gridPos.gridX, gridPos.gridZ)) {
                    // Check max distance for roll/step
                    const maxDist = cardData?.maxDistance || 999;
                    const playerPos = this.worldPositions.player;
                    const dist = Math.abs(gridPos.gridX - playerPos.x) + Math.abs(gridPos.gridZ - playerPos.z);
                    
                    if (dist <= maxDist) {
                        return { 
                            type: 'grid', 
                            gridX: gridPos.gridX, 
                            gridZ: gridPos.gridZ,
                            screenX: gridPos.screenX,
                            screenY: gridPos.screenY,
                            distance: dist
                        };
                    }
                }
            }
            return null;
        }
        
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
    
    // Convert screen position to grid cell
    screenToGrid(screenX, screenY) {
        // Use DDOOBackground's raycaster
        if (typeof DDOOBackground !== 'undefined' && DDOOBackground.screenToGrid) {
            const worldPos = DDOOBackground.screenToGrid(screenX, screenY);
            if (worldPos) {
                // Snap to grid center
                const gridX = Math.floor(worldPos.x) + 0.5;
                const gridZ = Math.floor(worldPos.z) + 0.5;
                
                // Check bounds (within arena)
                if (gridX >= 0.5 && gridX < this.arena.width + 0.5 &&
                    gridZ >= 0.5 && gridZ < this.arena.height + 0.5) {
                    
                    // Get screen position for this grid cell center
                    const screenPos = DDOOBackground.project3DToScreen(gridX, 0, gridZ);
                    
                    return {
                        gridX,
                        gridZ,
                        screenX: screenPos?.screenX || screenX,
                        screenY: screenPos?.screenY || screenY
                    };
                }
            }
        }
        return null;
    },
    
    showDragTargets(cardType, cardData = null) {
        // Create DOM markers for valid targets
        const overlay = document.getElementById('drag-overlay');
        const battleRect = document.getElementById('battle-area').getBoundingClientRect();
        
        // For move cards with grid targeting, show all valid grid cells
        if (cardData?.targetType === 'grid' || cardData?.moveTo) {
            this.showValidGridCells(cardData);
        }
        
        // For attack cards, show range indicator
        if (cardType === 'attack' && cardData?.range) {
            this.showAttackRange(cardData.range);
        }
        
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
        
        // Hide grid cell highlights
        this.hideValidGridCells();
        
        // Hide attack range
        this.hideAttackRange();
        
        // Make sure targeting mode is off
        this.exitTargetingMode();
    },
    
    // Show valid grid cells for move cards (PixiJS overlay)
    showValidGridCells(cardData = null) {
        if (!this.gridHighlight) {
            this.gridHighlight = new PIXI.Graphics();
            this.gridHighlight.zIndex = 8;
            this.app.stage.addChild(this.gridHighlight);
        }
        
        this.gridHighlight.clear();
        
        const { width, height } = this.arena;
        const playerPos = this.worldPositions.player;
        const maxDist = cardData?.maxDistance || 999;  // Max movement distance
        
        // Draw all valid (empty) grid cells within range
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                const cellX = x + 0.5;
                const cellZ = z + 0.5;
                
                // Skip occupied cells
                if (this.isGridCellOccupied(cellX, cellZ)) continue;
                
                // Check distance from player
                const dist = Math.abs(cellX - playerPos.x) + Math.abs(cellZ - playerPos.z);
                if (dist > maxDist) continue;
                
                // Get screen positions for cell corners
                const tl = DDOOBackground.project3DToScreen(x, 0, z);
                const tr = DDOOBackground.project3DToScreen(x + 1, 0, z);
                const bl = DDOOBackground.project3DToScreen(x, 0, z + 1);
                const br = DDOOBackground.project3DToScreen(x + 1, 0, z + 1);
                
                if (tl?.visible && tr?.visible && bl?.visible && br?.visible) {
                    // Color based on distance
                    const isClose = dist <= 1;
                    const color = isClose ? 0x22c55e : 0x8b5cf6;
                    
                    // Draw cell quad
                    this.gridHighlight.moveTo(tl.screenX, tl.screenY);
                    this.gridHighlight.lineTo(tr.screenX, tr.screenY);
                    this.gridHighlight.lineTo(br.screenX, br.screenY);
                    this.gridHighlight.lineTo(bl.screenX, bl.screenY);
                    this.gridHighlight.closePath();
                    this.gridHighlight.fill({ color, alpha: 0.15 });
                    this.gridHighlight.stroke({ color, alpha: 0.4, width: 1 });
                }
            }
        }
        
        this.gridHighlight.visible = true;
    },
    
    // Hide grid cell highlights
    hideValidGridCells() {
        if (this.gridHighlight) {
            this.gridHighlight.visible = false;
            this.gridHighlight.clear();
        }
    },
    
    // Show attack range from player position
    showAttackRange(range) {
        if (!this.attackRangeGraphic) {
            this.attackRangeGraphic = new PIXI.Graphics();
            this.attackRangeGraphic.zIndex = 7;
            this.app.stage.addChild(this.attackRangeGraphic);
        }
        
        this.attackRangeGraphic.clear();
        
        const playerPos = this.worldPositions.player;
        const { width, height } = this.arena;
        
        // Draw cells within attack range (towards enemies - positive X direction)
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                const cellX = x + 0.5;
                const cellZ = z + 0.5;
                
                // Calculate distance (Manhattan for simplicity)
                const dist = Math.abs(cellX - playerPos.x) + Math.abs(cellZ - playerPos.z);
                
                // Only show cells in range and towards enemy side
                if (dist > range || cellX <= playerPos.x) continue;
                
                // Get screen positions
                const tl = DDOOBackground.project3DToScreen(x, 0, z);
                const tr = DDOOBackground.project3DToScreen(x + 1, 0, z);
                const bl = DDOOBackground.project3DToScreen(x, 0, z + 1);
                const br = DDOOBackground.project3DToScreen(x + 1, 0, z + 1);
                
                if (tl?.visible && tr?.visible && bl?.visible && br?.visible) {
                    this.attackRangeGraphic.moveTo(tl.screenX, tl.screenY);
                    this.attackRangeGraphic.lineTo(tr.screenX, tr.screenY);
                    this.attackRangeGraphic.lineTo(br.screenX, br.screenY);
                    this.attackRangeGraphic.lineTo(bl.screenX, bl.screenY);
                    this.attackRangeGraphic.closePath();
                    this.attackRangeGraphic.fill({ color: 0xef4444, alpha: 0.1 });
                    this.attackRangeGraphic.stroke({ color: 0xef4444, alpha: 0.3, width: 1 });
                }
            }
        }
        
        this.attackRangeGraphic.visible = true;
    },
    
    // Hide attack range
    hideAttackRange() {
        if (this.attackRangeGraphic) {
            this.attackRangeGraphic.visible = false;
            this.attackRangeGraphic.clear();
        }
    },
    
    // Highlight a specific grid cell (when hovering)
    highlightGridCell(gridX, gridZ) {
        if (!this.gridCellHighlight) {
            this.gridCellHighlight = new PIXI.Graphics();
            this.gridCellHighlight.zIndex = 9;
            this.app.stage.addChild(this.gridCellHighlight);
        }
        
        this.gridCellHighlight.clear();
        
        const x = Math.floor(gridX);
        const z = Math.floor(gridZ);
        
        // Get screen positions for cell corners
        const tl = DDOOBackground.project3DToScreen(x, 0, z);
        const tr = DDOOBackground.project3DToScreen(x + 1, 0, z);
        const bl = DDOOBackground.project3DToScreen(x, 0, z + 1);
        const br = DDOOBackground.project3DToScreen(x + 1, 0, z + 1);
        
        if (tl?.visible && tr?.visible && bl?.visible && br?.visible) {
            // Draw highlighted cell
            this.gridCellHighlight.moveTo(tl.screenX, tl.screenY);
            this.gridCellHighlight.lineTo(tr.screenX, tr.screenY);
            this.gridCellHighlight.lineTo(br.screenX, br.screenY);
            this.gridCellHighlight.lineTo(bl.screenX, bl.screenY);
            this.gridCellHighlight.closePath();
            this.gridCellHighlight.fill({ color: 0x8b5cf6, alpha: 0.5 });
            this.gridCellHighlight.stroke({ color: 0xffffff, alpha: 0.8, width: 3 });
        }
        
        this.gridCellHighlight.visible = true;
    },
    
    // Clear grid cell highlight
    clearGridCellHighlight() {
        if (this.gridCellHighlight) {
            this.gridCellHighlight.visible = false;
            this.gridCellHighlight.clear();
        }
    },
    
    applyTargetHighlight(target, cardType) {
        // Remove any existing ring
        this.removeTargetRing();
        
        // Create DOM-based targeting ring
        const ring = document.createElement('div');
        ring.id = 'target-ring';
        
        // Grid target (Dash card) - PixiJS only
        if (target.type === 'grid') {
            // Highlight the grid cell in PixiJS (no DOM element)
            this.highlightGridCell(target.gridX, target.gridZ);
            this.enterTargetingMode();
            return;
        }
        
        // Sprite target (enemy/player)
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
        
        // Clear PixiJS grid cell highlight
        this.clearGridCellHighlight();
        
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
        console.log(`[Game] Card ${cardId} (index ${cardIndex}) -> ${target.type}${target.gridX ? ` (${target.gridX}, ${target.gridZ})` : ''}`);
        
        // Execute effect based on target type
        if (target.type === 'grid') {
            // Dash card - move to grid position
            this.useMoveCard(cardData, { gridX: target.gridX, gridZ: target.gridZ });
        } else {
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
        }
        
        // Remove the used card from hand
        this.removeCardFromHand(cardIndex);
    },
    
    // Remove card and draw new one (Clash Royale style - infinite cycle)
    removeCardFromHand(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.cards.elements.length) return;
        
        const card = this.cards.elements[cardIndex];
        const usedCardId = this.cards.hand[cardIndex];
        
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
            
            // Add used card back to deck (shuffle it in)
            this.cards.deck.push(usedCardId);
            
            // Draw a new card from deck
            if (this.cards.deck.length > 0) {
                // Shuffle deck occasionally
                if (Math.random() < 0.3) {
                    this.shuffleDeck();
                }
                
                const newCardId = this.cards.deck.shift();
                this.addCardToHand(newCardId);
            }
            
            // Update indices and shortcut keys
            this.cards.elements.forEach((el, i) => {
                el.dataset.index = i;
                el.dataset.shortcut = i + 1;
            });
            
            // Update UI
            this.updateCardUI();
        }, 200);
    },
    
    // Shuffle the deck
    shuffleDeck() {
        for (let i = this.cards.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards.deck[i], this.cards.deck[j]] = [this.cards.deck[j], this.cards.deck[i]];
        }
    },
    
    // Add a single card to hand
    addCardToHand(cardId) {
        const cardData = this.cardDatabase[cardId];
        if (!cardData) return;
        
        this.cards.hand.push(cardId);
        const index = this.cards.hand.length - 1;
        
        const cardEl = this.createCardElement(cardId, cardData, index);
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'translateY(30px) scale(0.8)';
        
        const handContainer = document.getElementById('card-hand');
        if (handContainer) {
            handContainer.appendChild(cardEl);
            this.cards.elements.push(cardEl);
            
            // Animate card appearing
            requestAnimationFrame(() => {
                cardEl.style.transition = 'transform 0.2s, opacity 0.2s';
                cardEl.style.opacity = '1';
                cardEl.style.transform = 'translateY(0) scale(1)';
            });
        }
        
        this.updateCardPlayability();
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
        const knockback = cardData.knockback ?? 1;  // Default 1 cell knockback
        const hitCount = cardData.hits || 1;  // Multi-hit support
        
        // Face the enemy before attacking
        this.faceTargetWorld(this.player, this.worldPositions.player, enemyWorldPos);
        
        // Calculate attack position (1 cell before enemy)
        const attackPosX = enemyWorldPos.x - 1;
        const attackPosZ = enemyWorldPos.z;
        
        // Dash to attack position (slower for Dark Souls feel)
        const dashSpeed = cardData.slow ? 0.35 : 0.2;
        await this.dashTo(attackPosX, attackPosZ, dashSpeed);
        
        // Try to use DDOOAction for animation
        const useDDOOAction = typeof DDOOAction !== 'undefined' && DDOOAction.initialized;
        
        // Dark Souls slow animation speed
        const originalSpeed = DDOOAction?.config?.speed || 1.0;
        if (cardData.slow && DDOOAction?.config) {
            DDOOAction.config.speed = 0.7;  // 30% slower for weight
        }
        
        // Use sequence animation if available (card.battleopening, card.flurry etc)
        if (useDDOOAction && cardData.anim) {
            console.log(`[Game] Playing sequence: ${cardData.anim}`);
            const playerChar = DDOOAction.characters?.get('player');
            const enemyChar = { container: enemy, sprite: enemy.children?.[0] || enemy };
            
            if (playerChar) {
                await DDOOAction.play(cardData.anim, {
                    container: playerChar.container,
                    sprite: playerChar.sprite,
                    targetContainer: enemyChar.container,
                    targetSprite: enemyChar.sprite
                });
            }
        }
        
        // Multi-hit attack loop for damage and effects
        let totalDamage = 0;
        for (let hit = 0; hit < hitCount; hit++) {
            const isCrit = Math.random() < 0.15;
            const hitDamage = isCrit ? baseDamage * 2 : baseDamage;
            totalDamage += hitDamage;
            
            // If no sequence anim, use individual anims
            if (useDDOOAction && !cardData.anim && cardData.playerAnim) {
                console.log(`[Game] Playing anim: ${cardData.playerAnim} (hit ${hit + 1}/${hitCount})`);
                
                // Play player attack animation
                const playerChar = DDOOAction.characters?.get('player');
                if (playerChar) {
                    await DDOOAction.play(cardData.playerAnim, {
                        container: playerChar.container,
                        sprite: playerChar.sprite
                    });
                }
                
                // Play enemy hit animation
                if (cardData.enemyAnim) {
                    const enemyChar = { container: enemy, sprite: enemy.children?.[0] || enemy };
                    await DDOOAction.play(cardData.enemyAnim, enemyChar);
                }
            }
            
            // Hit effects per hit
            this.hapticFeedback(isCrit ? 'heavy' : 'hit');
            DDOORenderer.rapidFlash?.(enemy);
            DDOORenderer.damageShake?.(enemy, isCrit ? 12 : 8, 300);
            DDOOBackground.screenFlash(isCrit ? '#ffaa00' : '#ffffff', isCrit ? 100 : 60);
            if (isCrit) DDOOBackground.shake?.(0.6, 150);
            
            // Damage number per hit
            DDOOFloater.showOnCharacter(enemy, hitDamage, isCrit ? 'critical' : 'damage');
            
            // Small delay between multi-hits (only for individual anims)
            if (!cardData.anim && hit < hitCount - 1) {
                await this.delay(cardData.slow ? 200 : 120);
            }
        }
        
        // Restore original speed
        if (cardData.slow && DDOOAction?.config) {
            DDOOAction.config.speed = originalSpeed;
        }
        
        // IMPORTANT: Restore character visibility after DDOOAction
        this.restoreCharacterVisibility();
        
        // KNOCKBACK: Push enemy back
        if (knockback > 0) {
            const newEnemyX = Math.min(this.arena.width - 1, enemyWorldPos.x + knockback);
            await this.knockbackEnemy(enemyIndex, newEnemyX, enemyWorldPos.z);
            console.log(`[Game] Enemy ${enemyIndex} knocked back: ${enemyWorldPos.x} -> ${newEnemyX}`);
        }
        
        // Player stays at attack position (formation push)
        this.worldPositions.player.x = attackPosX;
        this.worldPositions.player.z = attackPosZ;
        console.log(`[Game] Player advanced to: (${attackPosX}, ${attackPosZ})`);
        
        // Longer recovery for Dark Souls feel
        await this.delay(cardData.slow ? 200 : 100);
        
        // Apply damage (total from all hits)
        enemyData.hp = Math.max(0, enemyData.hp - totalDamage);
        
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
        
        // Reset player facing to default (face enemies)
        this.resetFacing(this.player);
        
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
    
    // Enemy knockback animation
    knockbackEnemy(enemyIndex, newX, newZ, duration = 0.15) {
        return new Promise(resolve => {
            const enemyWorldPos = this.worldPositions.enemies[enemyIndex];
            if (!enemyWorldPos) {
                resolve();
                return;
            }
            
            gsap.to(enemyWorldPos, {
                x: newX,
                z: newZ,
                duration,
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    // Enemy advance (for attack)
    advanceEnemy(enemyIndex, newX, newZ, duration = 0.3) {
        return new Promise(resolve => {
            const enemyWorldPos = this.worldPositions.enemies[enemyIndex];
            if (!enemyWorldPos) {
                resolve();
                return;
            }
            
            gsap.to(enemyWorldPos, {
                x: newX,
                z: newZ,
                duration,
                ease: 'power2.inOut',
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
        
        // Restore character visibility after skill effects
        this.restoreCharacterVisibility();
        
        this.updateUI();
    },
    
    useMoveCard(cardData, targetGridPos = null) {
        // Dash card - move to specific grid position
        if (cardData.moveTo && targetGridPos) {
            const { gridX, gridZ } = targetGridPos;
            
            // Validate target is empty (not occupied by enemy)
            if (this.isGridCellOccupied(gridX, gridZ)) {
                this.showMessage('Blocked!', 500);
                return false;
            }
            
            // Face the movement direction
            const targetWorldPos = { x: gridX, y: 0, z: gridZ };
            this.faceTargetWorld(this.player, this.worldPositions.player, targetWorldPos);
            
            // Dash animation
            gsap.to(this.worldPositions.player, {
                x: gridX,
                z: gridZ,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    // After movement, face enemies again (right side)
                    this.resetFacing(this.player, true);
                    // Restore visibility after movement
                    this.restoreCharacterVisibility();
                }
            });
            
            // Brief invincibility visual
            gsap.to(this.player, {
                alpha: 0.3,
                duration: 0.08,
                yoyo: true,
                repeat: 2
            });
            
            this.showMessage('Dash!', 400);
            console.log(`[Game] Player dashed to (${gridX}, ${gridZ})`);
            return true;
        }
        
        // Default roll/step - dodge back
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
        return true;
    },
    
    // Check if a grid cell is occupied by an enemy
    isGridCellOccupied(gridX, gridZ, tolerance = 0.8) {
        for (const enemyPos of this.worldPositions.enemies) {
            const dx = Math.abs(enemyPos.x - gridX);
            const dz = Math.abs(enemyPos.z - gridZ);
            if (dx < tolerance && dz < tolerance) {
                return true;  // Occupied
            }
        }
        return false;  // Empty
    },
    
    // Get valid grid positions for Dash
    getValidDashPositions() {
        const valid = [];
        for (let x = 0; x < this.arena.width; x++) {
            for (let z = 0; z < this.arena.height; z++) {
                if (!this.isGridCellOccupied(x + 0.5, z + 0.5)) {
                    valid.push({ x: x + 0.5, z: z + 0.5 });
                }
            }
        }
        return valid;
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
        
        // Grid always visible when gridAlwaysShow is true
        this.containers.debug.visible = this.gridAlwaysShow || this.debug.enabled;
        
        document.getElementById('debug-panel').style.display = this.debug.enabled ? 'block' : 'none';
        
        if (this.debug.enabled) {
            this.drawDebugGrid();
            console.log('[Debug] ON');
        } else {
            console.log('[Debug] OFF');
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
    
    // Show miss message when enemy attack is out of range
    showMiss(enemyIndex) {
        const enemy = this.enemySprites[enemyIndex];
        if (!enemy) return;
        
        // Show MISS floating text
        if (typeof DDOOFloater !== 'undefined') {
            DDOOFloater.showOnCharacter(enemy, 'MISS', 'miss');
        }
        
        // Visual feedback - enemy stumbles
        gsap.to(enemy, {
            x: enemy.x + 15,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power1.inOut'
        });
        
        // Brief message
        this.showMessage('DODGED!', 600);
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
        
        // Battle area click handler for card targets
        const battleArea = document.getElementById('battle-area');
        if (battleArea) {
            battleArea.addEventListener('click', (e) => this.onBattleAreaClick(e));
            battleArea.addEventListener('touchend', (e) => {
                if (e.touches && e.touches.length === 0) {
                    const touch = e.changedTouches[0];
                    this.onBattleAreaClick({ clientX: touch.clientX, clientY: touch.clientY });
                }
            });
        }
    },
    
    // Handle click on battle area (target selection for selected card)
    onBattleAreaClick(event) {
        // No card selected
        if (!this.cards.selectedCard) return;
        if (this.state.phase !== 'player') return;
        
        const { cardId, cardData, index } = this.cards.selectedCard;
        const clientX = event.clientX;
        const clientY = event.clientY;
        
        console.log(`[Game] Battle click at (${clientX}, ${clientY}) with card: ${cardData.name}`);
        
        // Find target based on card type
        if (cardData.type === 'attack') {
            // Find enemy at click position
            const target = this.findEnemyAtPosition(clientX, clientY);
            if (target !== null) {
                // Check range
                const playerPos = this.worldPositions.player;
                const enemyPos = this.worldPositions.enemies[target];
                const dist = Math.abs(enemyPos.x - playerPos.x) + Math.abs(enemyPos.z - playerPos.z);
                
                if (dist <= (cardData.range || 2)) {
                    this.executeCard(index, { type: 'enemy', index: target });
                } else {
                    this.showMessage('Out of Range!', 600);
                    this.hapticFeedback('error');
                }
            }
        } else if (cardData.type === 'move' && cardData.targetType === 'grid') {
            // Find grid cell at click position
            const gridPos = DDOOBackground.screenToGrid?.(clientX, clientY);
            if (gridPos) {
                const { x, z } = gridPos;
                
                // Check bounds
                if (x >= 0 && x < this.arena.width && z >= 0 && z < this.arena.depth) {
                    // Check distance
                    const playerPos = this.worldPositions.player;
                    const dist = Math.abs(x - playerPos.x) + Math.abs(z - playerPos.z);
                    
                    if (!cardData.maxDistance || dist <= cardData.maxDistance) {
                        // Check if occupied
                        const isOccupied = this.worldPositions.enemies.some(
                            ep => Math.floor(ep.x) === x && Math.floor(ep.z) === z
                        );
                        
                        if (!isOccupied) {
                            this.executeCard(index, { type: 'grid', x, z });
                        } else {
                            this.showMessage('Occupied!', 600);
                            this.hapticFeedback('error');
                        }
                    } else {
                        this.showMessage('Too Far!', 600);
                        this.hapticFeedback('error');
                    }
                }
            }
        } else if (cardData.type === 'skill') {
            // Skills are self-cast, execute immediately
            this.executeCard(index, { type: 'self' });
        }
    },
    
    // Find enemy sprite at screen position
    findEnemyAtPosition(clientX, clientY) {
        const hitRadius = 80;
        
        for (let i = 0; i < this.enemySprites.length; i++) {
            const enemy = this.enemySprites[i];
            if (!enemy || !enemy.visible) continue;
            
            // Get enemy screen position
            const enemyPos = this.worldPositions.enemies[i];
            if (!enemyPos) continue;
            
            const screenPos = DDOOBackground.project3DToScreen(
                enemyPos.x + 0.5, enemyPos.y, enemyPos.z + 0.5
            );
            
            // Get battle area offset
            const battleArea = document.getElementById('battle-area');
            const rect = battleArea?.getBoundingClientRect() || { left: 0, top: 0 };
            
            // Convert to screen coordinates
            const enemyScreenX = rect.left + screenPos.x;
            const enemyScreenY = rect.top + screenPos.y - (enemy.height * 0.5);
            
            // Check hit
            const dx = clientX - enemyScreenX;
            const dy = clientY - enemyScreenY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < hitRadius) {
                return i;
            }
        }
        
        return null;
    },
    
    // Execute the selected card on target
    executeCard(cardIndex, target) {
        const cardEl = this.cards.elements[cardIndex];
        const cardId = cardEl?.dataset.cardId;
        const cardData = this.cardDatabase[cardId];
        
        if (!cardData) return;
        
        // Check energy again
        if (this.state.player.energy < cardData.cost) {
            this.showMessage('Energy!', 600);
            return;
        }
        
        // Spend energy
        this.state.player.energy -= cardData.cost;
        this.updateUI();
        
        // Execute based on card type
        switch (cardData.type) {
            case 'attack':
                if (target.type === 'enemy') {
                    this.attackWithCard(target.index, cardData);
                }
                break;
            case 'skill':
                this.useSkillCard(cardData);
                break;
            case 'move':
                if (target.type === 'grid') {
                    this.useMoveCard(cardData, { gridX: target.x, gridZ: target.z });
                }
                break;
        }
        
        // Remove used card and draw new one
        this.removeCardFromHand(cardIndex);
        
        // Deselect
        this.deselectCard();
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
            
            // 1-5: 카드 선택
            if (e.key >= '1' && e.key <= '5') {
                const index = parseInt(e.key) - 1;
                this.selectCard(index);
            }
            
            // ESC: 카드 선택 해제
            if (e.key === 'Escape') {
                this.deselectCard();
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
    
    // End turn is no longer needed in Clash Royale style (real-time)
    // But we keep the button for potential "pass" functionality
    endTurn() {
        // In Clash Royale style, end turn just shows a message
        // Energy regens continuously, cards cycle infinitely
        this.showMessage('WAIT...', 500);
    },
    
    // Get random cards for new hand
    getRandomHand(count) {
        const availableCards = [
            'slash', 'slash', 'thrust', 'heavySlash',  // Attacks
            'block', 'block', 'ironFlesh', 'parry',    // Defense
            'roll', 'quickstep', 'dash', 'dash',       // Movement (including Dash)
            'estus'                                     // Special
        ];
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
