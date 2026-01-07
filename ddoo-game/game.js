// =====================================================
// 🎮 DDOO Game - 메인 게임 코드
// 📱 모바일 최적화 버전
// =====================================================

const Game = {
    // PixiJS 앱
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
    
    // 📱 모바일 설정
    mobile: {
        isMobile: false,
        isTouch: false,
        isLandscape: false,
        pixelRatio: 1,
        maxPixelRatio: 2,  // 성능을 위해 제한
        hapticEnabled: true,
        lastTapTime: 0,
        doubleTapDelay: 300
    },
    
    // 3D world coordinates
    worldPositions: {
        player: { x: -6, y: 0, z: 2 },
        enemies: [
            { x: 4, y: 0, z: 2 },
            { x: 10, y: 0, z: 1 }
        ]
    },
    
    // Battle area size
    battleAreaSize: { width: 0, height: 0 },
    
    // Selected card
    selectedCard: null,
    
    // ==================== 초기화 ====================
    
    async init() {
        console.log('[Game] Initializing...');
        
        // Mobile detection
        this.detectMobile();
        
        // Mobile environment setup
        this.setupMobileEnvironment();
        
        // Get battle area dimensions
        const battleArea = document.getElementById('battle-area');
        const battleRect = battleArea.getBoundingClientRect();
        this.battleAreaSize = {
            width: battleRect.width,
            height: battleRect.height
        };
        
        // Initialize 3D background (in battle area only)
        await DDOOBackground.init(battleArea);
        
        // Resolution calculation (mobile optimization)
        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            this.mobile.isMobile ? this.mobile.maxPixelRatio : 3
        );
        this.mobile.pixelRatio = pixelRatio;
        
        // PixiJS app (transparent - 3D background visible)
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
        
        // Add canvas to game container (inside battle area)
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.app.canvas);
        
        // Canvas styling
        this.app.canvas.style.position = 'absolute';
        this.app.canvas.style.top = '0';
        this.app.canvas.style.left = '0';
        this.app.canvas.style.zIndex = '1';
        this.app.canvas.style.touchAction = 'none';
        
        // Create containers
        this.createContainers();
        
        // Create characters (3D coordinate based)
        await this.createCharacters3D();
        
        // Update UI
        this.updateUI();
        
        // Bind events
        this.bindEvents();
        
        // Mobile events
        this.bindMobileEvents();
        
        // Keyboard events (debug)
        this.bindKeyboard();
        
        // Resize & orientation handlers
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('orientationchange', () => this.onOrientationChange());
        
        // Visibility change (tab switch, background)
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());
        
        // Debug UI
        this.createDebugUI();
        
        // Fullscreen button
        this.createFullscreenButton();
        
        console.log('[Game] Initialized');
        console.log(`[Game] Battle area: ${this.battleAreaSize.width}x${this.battleAreaSize.height}`);
        console.log(`[Game] Mobile: ${this.mobile.isMobile ? 'YES' : 'NO'}`);
        console.log('[Game] Press Ctrl+D for debug menu');
        
        // Start message
        this.showMessage('BATTLE START!', 2000);
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
    },
    
    // ==================== 3D 그리드 ====================
    
    drawDebugGrid() {
        // 기존 그리드 제거
        this.containers.debug.removeChildren();
        
        const grid = new PIXI.Graphics();
        
        // 3D 그리드 그리기 (Z축 라인)
        for (let x = -15; x <= 20; x += 5) {
            const start = DDOOBackground.project3DToScreen(x, 0, -10);
            const end = DDOOBackground.project3DToScreen(x, 0, 15);
            
            if (start && end && start.visible && end.visible) {
                grid.moveTo(start.screenX, start.screenY);
                grid.lineTo(end.screenX, end.screenY);
                grid.stroke({ color: 0x44ff44, alpha: 0.3, width: 1 });
            }
        }
        
        // X축 라인
        for (let z = -10; z <= 15; z += 5) {
            const start = DDOOBackground.project3DToScreen(-15, 0, z);
            const end = DDOOBackground.project3DToScreen(20, 0, z);
            
            if (start && end && start.visible && end.visible) {
                grid.moveTo(start.screenX, start.screenY);
                grid.lineTo(end.screenX, end.screenY);
                grid.stroke({ color: 0x44ff44, alpha: 0.3, width: 1 });
            }
        }
        
        // 원점 표시
        const origin = DDOOBackground.project3DToScreen(0, 0, 0);
        if (origin && origin.visible) {
            grid.circle(origin.screenX, origin.screenY, 8);
            grid.fill({ color: 0xff0000, alpha: 0.8 });
        }
        
        // 캐릭터 위치 표시
        if (this.debug.showPositions) {
            // 플레이어 위치
            const playerPos = DDOOBackground.project3DToScreen(
                this.worldPositions.player.x,
                this.worldPositions.player.y,
                this.worldPositions.player.z
            );
            if (playerPos && playerPos.visible) {
                grid.circle(playerPos.screenX, playerPos.screenY, 12);
                grid.stroke({ color: 0x3b82f6, width: 3 });
                
                // 좌표 텍스트
                const text = new PIXI.Text({
                    text: `P(${this.worldPositions.player.x}, ${this.worldPositions.player.z})`,
                    style: { fontSize: 12, fill: 0x3b82f6 }
                });
                text.x = playerPos.screenX + 15;
                text.y = playerPos.screenY - 10;
                this.containers.debug.addChild(text);
            }
            
            // 적 위치
            this.worldPositions.enemies.forEach((pos, i) => {
                const enemyPos = DDOOBackground.project3DToScreen(pos.x, pos.y, pos.z);
                if (enemyPos && enemyPos.visible) {
                    grid.circle(enemyPos.screenX, enemyPos.screenY, 10);
                    grid.stroke({ color: 0xef4444, width: 3 });
                    
                    const text = new PIXI.Text({
                        text: `E${i}(${pos.x}, ${pos.z})`,
                        style: { fontSize: 12, fill: 0xef4444 }
                    });
                    text.x = enemyPos.screenX + 15;
                    text.y = enemyPos.screenY - 10;
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
    
    // 3D 좌표로 캐릭터 배치
    placeCharacter3D(sprite, worldPos) {
        const screenPos = DDOOBackground.project3DToScreen(worldPos.x, worldPos.y, worldPos.z);
        
        if (screenPos && screenPos.visible) {
            sprite.x = screenPos.screenX;
            sprite.y = screenPos.screenY;
            
            // 거리에 따른 스케일 조정
            const baseScale = sprite.baseScale || 1.0;
            sprite.scale.set(baseScale * screenPos.scale * 0.6);
            
            // 깊이 정렬용 zIndex
            sprite.zIndex = 1000 - screenPos.depth * 10;
        }
    },
    
    // 모든 캐릭터 위치 갱신
    updateAllCharacterPositions() {
        if (this.player) {
            this.placeCharacter3D(this.player, this.worldPositions.player);
        }
        
        this.enemySprites.forEach((enemy, i) => {
            if (this.worldPositions.enemies[i]) {
                this.placeCharacter3D(enemy, this.worldPositions.enemies[i]);
            }
        });
        
        // 디버그 그리드 갱신
        if (this.debug.enabled) {
            this.drawDebugGrid();
        }
    },
    
    // ==================== 전투 ====================
    
    async attackEnemy(enemyIndex) {
        if (this.state.phase !== 'player') return;
        if (enemyIndex >= this.enemySprites.length) return;
        
        this.state.phase = 'animation';
        
        const enemy = this.enemySprites[enemyIndex];
        const enemyData = this.state.enemies[enemyIndex];
        
        // 피해량 계산
        const damage = 10 + Math.floor(Math.random() * 5);
        const isCrit = Math.random() < 0.2;
        const finalDamage = isCrit ? damage * 2 : damage;
        
        // 타겟 하이라이트
        DDOORenderer.setTargeted(enemy, true, 0xff4444);
        
        await this.delay(200);
        
        // 📱 히트 햅틱 피드백
        this.hapticFeedback(isCrit ? 'heavy' : 'hit');
        
        // 히트 이펙트
        DDOORenderer.rapidFlash(enemy);
        DDOORenderer.damageShake(enemy, 8, 300);
        
        // 🔥 3D 배경 히트 이펙트
        const enemyWorldPos = this.worldPositions.enemies[enemyIndex];
        DDOOBackground.screenFlash(isCrit ? '#ffaa00' : '#ffffff', isCrit ? 120 : 60);
        DDOOBackground.hitFlash(enemyWorldPos.x, 3, enemyWorldPos.z, isCrit ? 0xffaa00 : 0xffffff, isCrit ? 12 : 6, 200);
        if (isCrit) {
            DDOOBackground.shake(0.8, 200);
        }
        
        // 데미지 표시
        DDOOFloater.showOnCharacter(enemy, finalDamage, isCrit ? 'critical' : 'damage');
        
        // HP 감소
        enemyData.hp = Math.max(0, enemyData.hp - finalDamage);
        
        await this.delay(300);
        
        // 타겟 해제
        DDOORenderer.setTargeted(enemy, false);
        
        // 사망 체크
        if (enemyData.hp <= 0) {
            // 📱 사망 햅틱 피드백
            this.hapticFeedback('success');
            
            await DDOORenderer.playDeath(enemy, this.app);
            this.enemySprites.splice(enemyIndex, 1);
            this.state.enemies.splice(enemyIndex, 1);
            this.worldPositions.enemies.splice(enemyIndex, 1);
            
            // 승리 체크
            if (this.state.enemies.length === 0) {
                this.hapticFeedback('success');
                this.showMessage('🎉 승리!', 3000);
            }
        }
        
        this.state.phase = 'player';
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
    
    updateUI() {
        const { player } = this.state;
        
        // HP 바
        const hpPercent = (player.hp / player.maxHp) * 100;
        document.getElementById('player-hp').style.width = `${hpPercent}%`;
        document.getElementById('player-hp-text').textContent = `${player.hp}/${player.maxHp}`;
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
        // 적 클릭/터치
        this.enemySprites.forEach((enemy, i) => {
            enemy.eventMode = 'static';
            enemy.cursor = 'pointer';
            
            // 📱 통합 이벤트 (pointerdown은 터치와 마우스 모두 처리)
            enemy.on('pointerdown', (e) => {
                // 📱 햅틱 피드백
                this.hapticFeedback('light');
                this.attackEnemy(i);
            });
            
            // 📱 터치 타겟 크기 증가
            if (this.mobile.isMobile) {
                enemy.hitArea = new PIXI.Circle(0, -enemy.height * 0.5, Math.max(enemy.width, enemy.height) * 0.7);
            }
        });
        
        // 턴 종료 버튼
        const endTurnBtn = document.getElementById('btn-end-turn');
        endTurnBtn.addEventListener('click', () => {
            this.hapticFeedback('medium');
            this.endTurn();
        });
        
        // 📱 버튼 터치 피드백
        this.addTouchFeedback(endTurnBtn);
    },
    
    // Mobile event binding
    bindMobileEvents() {
        if (!this.mobile.isTouch) return;
        
        // Stage touch events
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.battleAreaSize.width, this.battleAreaSize.height);
        
        // Empty space touch (for future expansion)
        this.app.stage.on('pointertap', (e) => {
            // Handle touch on empty space
        });
        
        // Card touch events
        this.bindCardEvents();
    },
    
    // Card event binding
    bindCardEvents() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                this.hapticFeedback('light');
                this.selectCard(card);
            });
            
            this.addTouchFeedback(card);
        });
    },
    
    // Card selection
    selectCard(cardElement) {
        const cards = document.querySelectorAll('.card');
        
        // Toggle selection
        if (cardElement.classList.contains('selected')) {
            cardElement.classList.remove('selected');
            this.selectedCard = null;
        } else {
            cards.forEach(c => c.classList.remove('selected'));
            cardElement.classList.add('selected');
            this.selectedCard = cardElement.dataset.card;
        }
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
        this.showMessage(`턴 ${this.state.turn + 1}`, 1000);
        
        // 에너지 회복
        this.state.player.energy = this.state.player.maxEnergy;
        this.updateUI();
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
        // Get new battle area dimensions
        const battleArea = document.getElementById('battle-area');
        const battleRect = battleArea.getBoundingClientRect();
        this.battleAreaSize = {
            width: battleRect.width,
            height: battleRect.height
        };
        
        // Resize PixiJS renderer
        this.app.renderer.resize(this.battleAreaSize.width, this.battleAreaSize.height);
        
        // Resize 3D background
        DDOOBackground.handleResize();
        
        // Update character positions
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
