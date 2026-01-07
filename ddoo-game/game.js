// =====================================================
// 🎮 DDOO Game - 메인 게임 코드
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
    
    // 3D 월드 좌표
    worldPositions: {
        player: { x: -6, y: 0, z: 2 },
        enemies: [
            { x: 4, y: 0, z: 2 },
            { x: 10, y: 0, z: 1 }
        ]
    },
    
    // ==================== 초기화 ====================
    
    async init() {
        console.log('🎮 게임 초기화 중...');
        
        // 🔥 3D 배경 먼저 초기화
        await DDOOBackground.init();
        
        // PixiJS 앱 생성 (투명 배경 - 3D 배경이 보이도록)
        this.app = new PIXI.Application();
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundAlpha: 0,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        // 캔버스 추가
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.app.canvas);
        
        // 캔버스 z-index 설정
        this.app.canvas.style.position = 'relative';
        this.app.canvas.style.zIndex = '1';
        
        // 컨테이너 생성
        this.createContainers();
        
        // 테스트용 캐릭터 생성 (3D 좌표 기반)
        await this.createCharacters3D();
        
        // UI 업데이트
        this.updateUI();
        
        // 이벤트 바인딩
        this.bindEvents();
        
        // 키보드 이벤트 (디버그)
        this.bindKeyboard();
        
        // 리사이즈 핸들러
        window.addEventListener('resize', () => this.onResize());
        
        // 디버그 UI 생성
        this.createDebugUI();
        
        console.log('✅ 게임 초기화 완료!');
        console.log('💡 Ctrl+D: 디버그 메뉴');
        
        // 시작 메시지
        this.showMessage('⚔️ 전투 시작!', 2000);
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
            outline: { enabled: true, color: 0x222244, thickness: 2 },
            shadow: { enabled: true, alpha: 0.5 },
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
                outline: { enabled: true, color: 0x000000, thickness: 2 },
                shadow: { enabled: true, alpha: 0.5 },
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
            await DDOORenderer.playDeath(enemy, this.app);
            this.enemySprites.splice(enemyIndex, 1);
            this.state.enemies.splice(enemyIndex, 1);
            this.worldPositions.enemies.splice(enemyIndex, 1);
            
            // 승리 체크
            if (this.state.enemies.length === 0) {
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
        // 적 클릭
        this.enemySprites.forEach((enemy, i) => {
            enemy.eventMode = 'static';
            enemy.cursor = 'pointer';
            enemy.on('pointerdown', () => this.attackEnemy(i));
        });
        
        // 턴 종료 버튼
        document.getElementById('btn-end-turn').addEventListener('click', () => {
            this.endTurn();
        });
    },
    
    bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Ctrl + D: 디버그 토글
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDebug();
            }
        });
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
        const { innerWidth, innerHeight } = window;
        this.app.renderer.resize(innerWidth, innerHeight);
        
        // 3D 배경 리사이즈
        DDOOBackground.handleResize();
        
        // 캐릭터 위치 갱신
        this.updateAllCharacterPositions();
    }
};

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    Game.init().catch(console.error);
});
