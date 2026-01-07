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
        characters: null,
        effects: null,
        ui: null
    },
    
    // 캐릭터 참조
    player: null,
    enemySprites: [],
    
    // ==================== 초기화 ====================
    
    async init() {
        console.log('🎮 게임 초기화 중...');
        
        // PixiJS 앱 생성
        this.app = new PIXI.Application();
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1a1a2e,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        // 캔버스 추가
        document.getElementById('game-container').appendChild(this.app.canvas);
        
        // 컨테이너 생성
        this.createContainers();
        
        // 배경 생성
        this.createBackground();
        
        // 테스트용 캐릭터 생성
        await this.createTestCharacters();
        
        // UI 업데이트
        this.updateUI();
        
        // 이벤트 바인딩
        this.bindEvents();
        
        // 리사이즈 핸들러
        window.addEventListener('resize', () => this.onResize());
        
        console.log('✅ 게임 초기화 완료!');
        
        // 시작 메시지
        this.showMessage('⚔️ 전투 시작!', 2000);
    },
    
    // ==================== 컨테이너 ====================
    
    createContainers() {
        // 배경 레이어
        this.containers.background = new PIXI.Container();
        this.containers.background.zIndex = 0;
        this.app.stage.addChild(this.containers.background);
        
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
    
    // ==================== 배경 ====================
    
    createBackground() {
        const { width, height } = this.app.screen;
        
        // 바닥
        const floor = new PIXI.Graphics();
        const floorY = height * 0.75;
        
        // 바닥 그라데이션 (여러 줄로)
        for (let i = 0; i < 10; i++) {
            const alpha = 0.3 - (i * 0.02);
            floor.rect(0, floorY + i * 20, width, 20);
            floor.fill({ color: 0x2a2a4a, alpha });
        }
        
        // 바닥선
        floor.moveTo(0, floorY);
        floor.lineTo(width, floorY);
        floor.stroke({ color: 0x4a4a6a, width: 2 });
        
        this.containers.background.addChild(floor);
    },
    
    // ==================== 캐릭터 ====================
    
    async createTestCharacters() {
        const { width, height } = this.app.screen;
        const floorY = height * 0.75;
        
        // 플레이어 생성
        this.player = await DDOORenderer.createSprite('hero.png', {
            scale: 1.5,
            outline: { enabled: true, color: 0x222244, thickness: 2 },
            shadow: { enabled: true, alpha: 0.6 },
            breathing: { enabled: true, scaleAmount: 0.015 }
        });
        
        if (this.player) {
            this.player.x = width * 0.2;
            this.player.y = floorY;
            this.containers.characters.addChild(this.player);
            
            // 등장 연출
            await DDOORenderer.playSpawn(this.player, 'left', 0.5);
        }
        
        // 적 생성
        const enemyTypes = ['goblin.png', 'slime.png'];
        
        for (let i = 0; i < 2; i++) {
            const enemy = await DDOORenderer.createSprite(enemyTypes[i], {
                scale: 1.3,
                outline: { enabled: true, color: 0x000000, thickness: 3 },
                shadow: { enabled: true, alpha: 0.7 },
                breathing: { enabled: true, scaleAmount: 0.02 }
            });
            
            if (enemy) {
                enemy.x = width * (0.6 + i * 0.15);
                enemy.y = floorY;
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
                
                // 등장 연출
                await DDOORenderer.playSpawn(enemy, 'right', 0.4);
            }
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
            
            // 승리 체크
            if (this.state.enemies.length === 0) {
                this.showMessage('🎉 승리!', 3000);
            }
        }
        
        this.state.phase = 'player';
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
    
    endTurn() {
        if (this.state.phase !== 'player') return;
        
        this.state.turn++;
        this.showMessage(`턴 ${this.state.turn + 1}`, 1000);
        
        // 에너지 회복
        this.state.player.energy = this.state.player.maxEnergy;
        this.updateUI();
    },
    
    // ==================== 유틸리티 ====================
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    onResize() {
        const { innerWidth, innerHeight } = window;
        this.app.renderer.resize(innerWidth, innerHeight);
        
        // 배경 재생성
        this.containers.background.removeChildren();
        this.createBackground();
    }
};

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    Game.init().catch(console.error);
});
