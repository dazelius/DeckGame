// ==========================================
// PixiJS 기반 적 렌더링 시스템
// DOM 순서 의존성 완전 제거 - 순수 좌표 기반
// ==========================================

const EnemyRenderer = {
    // PixiJS 컨테이너
    app: null,
    container: null,
    
    // 스프라이트 맵 (enemy.id -> sprite data)
    sprites: new Map(),
    
    // 슬롯 설정
    config: {
        slotSpacing: 160,      // 슬롯 간격
        baseY: 200,            // 기본 Y 위치
        baseScale: 1.0,        // 기본 스케일
        depthScale: 0.85,      // 깊이에 따른 스케일 감소
        maxSlots: 5            // 최대 슬롯 수
    },
    
    // 상태
    initialized: false,
    enabled: false,  // 기본 비활성화, 콘솔에서 EnemyRenderer.enable() 호출하여 테스트
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        if (this.initialized) return true;
        
        // PixiJS 확인
        if (typeof PIXI === 'undefined') {
            console.warn('[EnemyRenderer] PixiJS not found');
            return false;
        }
        
        // 기존 PixiRenderer 활용 또는 새로 생성
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.app) {
            this.app = PixiRenderer.app;
            console.log('[EnemyRenderer] Using existing PixiRenderer');
        } else {
            // 새 앱 생성
            this.createApp();
        }
        
        if (!this.app) {
            console.error('[EnemyRenderer] Failed to create PixiJS app');
            return false;
        }
        
        // 적 전용 컨테이너 생성
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;  // zIndex 정렬 활성화
        this.app.stage.addChild(this.container);
        
        // UI 오버레이 컨테이너 (HTML)
        this.createUIOverlay();
        
        this.initialized = true;
        this.enabled = true;
        
        console.log('[EnemyRenderer] Initialized');
        return true;
    },
    
    createApp() {
        const battleArena = document.querySelector('.battle-arena');
        if (!battleArena) return;
        
        // 캔버스 컨테이너 생성
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'enemy-canvas-container';
        canvasContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        battleArena.appendChild(canvasContainer);
        
        // PixiJS 앱 생성
        this.app = new PIXI.Application({
            width: battleArena.offsetWidth,
            height: battleArena.offsetHeight,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        this.app.view.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: auto;
        `;
        
        canvasContainer.appendChild(this.app.view);
        
        // 리사이즈 핸들러
        window.addEventListener('resize', () => this.handleResize());
    },
    
    createUIOverlay() {
        // HP바, 인텐트 등을 위한 HTML 오버레이 컨테이너
        let overlay = document.getElementById('enemy-ui-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'enemy-ui-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 15;
            `;
            
            const battleArena = document.querySelector('.battle-arena');
            if (battleArena) {
                battleArena.appendChild(overlay);
            }
        }
        this.uiOverlay = overlay;
    },
    
    handleResize() {
        if (!this.app) return;
        
        const battleArena = document.querySelector('.battle-arena');
        if (battleArena) {
            this.app.renderer.resize(
                battleArena.offsetWidth,
                battleArena.offsetHeight
            );
            this.updateAllPositions();
        }
    },
    
    // ==========================================
    // 슬롯 위치 계산
    // ==========================================
    getSlotX(slotIndex) {
        // 화면 중앙 기준으로 슬롯 배치
        const centerX = this.app ? this.app.renderer.width / 2 : 600;
        const totalWidth = (this.config.maxSlots - 1) * this.config.slotSpacing;
        const startX = centerX - totalWidth / 2 + 200;  // 오른쪽으로 오프셋
        
        return startX + (slotIndex * this.config.slotSpacing);
    },
    
    getSlotY(slotIndex) {
        // 뒤로 갈수록 약간 위로
        return this.config.baseY - (slotIndex * 10);
    },
    
    getSlotScale(slotIndex) {
        // 뒤로 갈수록 작아짐 (원근감)
        return this.config.baseScale - (slotIndex * 0.05);
    },
    
    getSlotZIndex(slotIndex) {
        // 앞에 있을수록 위에 그려짐
        return 100 - slotIndex;
    },
    
    // ==========================================
    // 적 추가/제거
    // ==========================================
    addEnemy(enemy, slotIndex) {
        if (!this.initialized || !enemy) return null;
        
        // 이미 존재하면 스킵
        if (this.sprites.has(enemy.id || enemy.name)) {
            return this.sprites.get(enemy.id || enemy.name);
        }
        
        const enemyId = enemy.id || enemy.name || `enemy_${Date.now()}`;
        
        // 스프라이트 생성
        const spriteData = this.createEnemySprite(enemy, slotIndex);
        if (!spriteData) return null;
        
        // 맵에 저장
        this.sprites.set(enemyId, {
            sprite: spriteData.sprite,
            container: spriteData.container,
            enemy: enemy,
            slotIndex: slotIndex,
            uiElement: null
        });
        
        // UI 오버레이 생성
        this.createEnemyUI(enemyId, enemy, slotIndex);
        
        console.log(`[EnemyRenderer] Added enemy: ${enemy.name} at slot ${slotIndex}`);
        
        return spriteData;
    },
    
    createEnemySprite(enemy, slotIndex) {
        // 적 컨테이너 (스프라이트 + 이펙트용)
        const enemyContainer = new PIXI.Container();
        enemyContainer.sortableChildren = true;
        
        // 스프라이트 이미지 경로
        const spritePath = enemy.sprite || enemy.image || 'goblin.png';
        
        // 스프라이트 생성
        let sprite;
        try {
            sprite = PIXI.Sprite.from(spritePath);
        } catch (e) {
            // 폴백: 플레이스홀더
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x666666);
            graphics.drawRect(-50, -75, 100, 150);
            graphics.endFill();
            sprite = graphics;
        }
        
        // 앵커 설정 (하단 중앙)
        if (sprite.anchor) {
            sprite.anchor.set(0.5, 1);
        }
        
        // 위치 및 스케일
        const x = this.getSlotX(slotIndex);
        const y = this.getSlotY(slotIndex);
        const scale = this.getSlotScale(slotIndex);
        
        enemyContainer.x = x;
        enemyContainer.y = y;
        enemyContainer.scale.set(scale);
        enemyContainer.zIndex = this.getSlotZIndex(slotIndex);
        
        // 스프라이트를 컨테이너에 추가
        enemyContainer.addChild(sprite);
        
        // 인터랙션 설정
        enemyContainer.interactive = true;
        enemyContainer.buttonMode = true;
        enemyContainer.cursor = 'pointer';
        
        // 이벤트 연결
        const enemyRef = enemy;
        enemyContainer.on('pointerdown', () => this.onEnemyClick(enemyRef));
        enemyContainer.on('pointerover', () => this.onEnemyHover(enemyRef, true));
        enemyContainer.on('pointerout', () => this.onEnemyHover(enemyRef, false));
        
        // 메인 컨테이너에 추가
        this.container.addChild(enemyContainer);
        
        // 등장 애니메이션
        this.playEntranceAnimation(enemyContainer);
        
        return { sprite, container: enemyContainer };
    },
    
    removeEnemy(enemy) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data) {
            // 스프라이트 제거
            if (data.container && data.container.parent) {
                data.container.parent.removeChild(data.container);
                data.container.destroy({ children: true });
            }
            
            // UI 제거
            if (data.uiElement && data.uiElement.parentNode) {
                data.uiElement.parentNode.removeChild(data.uiElement);
            }
            
            this.sprites.delete(enemyId);
            console.log(`[EnemyRenderer] Removed enemy: ${enemy.name}`);
        }
    },
    
    clearAllEnemies() {
        this.sprites.forEach((data, id) => {
            if (data.container && data.container.parent) {
                data.container.parent.removeChild(data.container);
                data.container.destroy({ children: true });
            }
            if (data.uiElement && data.uiElement.parentNode) {
                data.uiElement.parentNode.removeChild(data.uiElement);
            }
        });
        this.sprites.clear();
        console.log('[EnemyRenderer] Cleared all enemies');
    },
    
    // ==========================================
    // 슬롯 이동 (핵심!)
    // ==========================================
    moveToSlot(enemy, newSlot, duration = 0.3) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data) return Promise.resolve();
        
        return new Promise((resolve) => {
            const targetX = this.getSlotX(newSlot);
            const targetY = this.getSlotY(newSlot);
            const targetScale = this.getSlotScale(newSlot);
            const targetZIndex = this.getSlotZIndex(newSlot);
            
            // 슬롯 인덱스 업데이트
            data.slotIndex = newSlot;
            
            // GSAP 애니메이션
            gsap.to(data.container, {
                x: targetX,
                y: targetY,
                duration: duration,
                ease: 'power2.out',
                onUpdate: () => {
                    // UI 동기화
                    this.syncEnemyUI(enemyId);
                },
                onComplete: () => {
                    data.container.zIndex = targetZIndex;
                    this.container.sortChildren();
                    resolve();
                }
            });
            
            gsap.to(data.container.scale, {
                x: targetScale,
                y: targetScale,
                duration: duration,
                ease: 'power2.out'
            });
        });
    },
    
    // 두 적의 슬롯 교환
    swapSlots(enemyA, enemyB, duration = 0.3) {
        const idA = enemyA.id || enemyA.name;
        const idB = enemyB.id || enemyB.name;
        const dataA = this.sprites.get(idA);
        const dataB = this.sprites.get(idB);
        
        if (!dataA || !dataB) return Promise.resolve();
        
        const slotA = dataA.slotIndex;
        const slotB = dataB.slotIndex;
        
        return Promise.all([
            this.moveToSlot(enemyA, slotB, duration),
            this.moveToSlot(enemyB, slotA, duration)
        ]);
    },
    
    // 사슬낫 스타일: 타겟을 슬롯 0으로, 나머지 밀림
    pullToSlotZero(targetEnemy, allEnemies, duration = 0.25) {
        const targetId = targetEnemy.id || targetEnemy.name;
        const targetData = this.sprites.get(targetId);
        
        if (!targetData) return Promise.resolve();
        
        const targetCurrentSlot = targetData.slotIndex;
        if (targetCurrentSlot === 0) return Promise.resolve();
        
        const promises = [];
        
        allEnemies.forEach(enemy => {
            const id = enemy.id || enemy.name;
            const data = this.sprites.get(id);
            if (!data) return;
            
            let newSlot;
            
            if (enemy === targetEnemy) {
                newSlot = 0;
            } else if (data.slotIndex < targetCurrentSlot) {
                newSlot = data.slotIndex + 1;
            } else {
                return; // 그대로
            }
            
            promises.push(this.moveToSlot(enemy, newSlot, duration));
        });
        
        return Promise.all(promises);
    },
    
    // ==========================================
    // 이벤트 핸들러
    // ==========================================
    onEnemyClick(enemy) {
        console.log(`[EnemyRenderer] Clicked: ${enemy.name}`);
        
        // 기존 게임 시스템과 연결
        if (typeof selectEnemy === 'function') {
            const index = gameState.enemies.indexOf(enemy);
            if (index !== -1) {
                selectEnemy(index);
            }
        }
    },
    
    onEnemyHover(enemy, isOver) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data) return;
        
        if (isOver) {
            // 호버 효과
            gsap.to(data.container.scale, {
                x: data.container.scale.x * 1.05,
                y: data.container.scale.y * 1.05,
                duration: 0.1
            });
        } else {
            // 원래 스케일로
            const targetScale = this.getSlotScale(data.slotIndex);
            gsap.to(data.container.scale, {
                x: targetScale,
                y: targetScale,
                duration: 0.1
            });
        }
    },
    
    // ==========================================
    // UI 오버레이 (HP바, 인텐트)
    // ==========================================
    createEnemyUI(enemyId, enemy, slotIndex) {
        if (!this.uiOverlay) return;
        
        const uiEl = document.createElement('div');
        uiEl.className = 'enemy-ui-element';
        uiEl.dataset.enemyId = enemyId;
        uiEl.style.cssText = `
            position: absolute;
            pointer-events: auto;
            transform: translate(-50%, 0);
        `;
        
        // HP 바
        const hpBar = document.createElement('div');
        hpBar.className = 'enemy-hp-bar';
        hpBar.innerHTML = `
            <div class="hp-fill" style="width: ${(enemy.hp / enemy.maxHp) * 100}%"></div>
            <span class="hp-text">${enemy.hp}/${enemy.maxHp}</span>
        `;
        uiEl.appendChild(hpBar);
        
        // 인텐트 (나중에 업데이트)
        const intentEl = document.createElement('div');
        intentEl.className = 'enemy-intent';
        uiEl.appendChild(intentEl);
        
        this.uiOverlay.appendChild(uiEl);
        
        // 위치 동기화
        const data = this.sprites.get(enemyId);
        if (data) {
            data.uiElement = uiEl;
            this.syncEnemyUI(enemyId);
        }
    },
    
    syncEnemyUI(enemyId) {
        const data = this.sprites.get(enemyId);
        if (!data || !data.uiElement || !data.container) return;
        
        // 스프라이트 글로벌 위치
        const globalPos = data.container.getGlobalPosition();
        
        // UI 위치 업데이트 (스프라이트 위에)
        data.uiElement.style.left = globalPos.x + 'px';
        data.uiElement.style.top = (globalPos.y - 150) + 'px';  // 스프라이트 위
    },
    
    syncAllUI() {
        this.sprites.forEach((data, id) => {
            this.syncEnemyUI(id);
        });
    },
    
    updateEnemyHP(enemy) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data && data.uiElement) {
            const hpFill = data.uiElement.querySelector('.hp-fill');
            const hpText = data.uiElement.querySelector('.hp-text');
            
            if (hpFill) {
                hpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
            }
            if (hpText) {
                hpText.textContent = `${enemy.hp}/${enemy.maxHp}`;
            }
        }
    },
    
    // ==========================================
    // 애니메이션
    // ==========================================
    playEntranceAnimation(container) {
        container.alpha = 0;
        container.scale.set(0.5);
        
        gsap.to(container, {
            alpha: 1,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        gsap.to(container.scale, {
            x: this.getSlotScale(0),
            y: this.getSlotScale(0),
            duration: 0.4,
            ease: 'back.out(1.5)'
        });
    },
    
    playDeathAnimation(enemy) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data) return Promise.resolve();
        
        return new Promise((resolve) => {
            gsap.to(data.container, {
                alpha: 0,
                y: data.container.y + 50,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    this.removeEnemy(enemy);
                    resolve();
                }
            });
        });
    },
    
    playHitAnimation(enemy) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data) return;
        
        // 흔들림 + 플래시
        gsap.to(data.container, {
            x: data.container.x + 10,
            duration: 0.05,
            yoyo: true,
            repeat: 3
        });
        
        // 틴트 플래시
        if (data.sprite && data.sprite.tint !== undefined) {
            const originalTint = data.sprite.tint;
            data.sprite.tint = 0xff6666;
            setTimeout(() => {
                data.sprite.tint = originalTint;
            }, 100);
        }
    },
    
    // ==========================================
    // 전체 업데이트
    // ==========================================
    updateAllPositions() {
        this.sprites.forEach((data, id) => {
            const x = this.getSlotX(data.slotIndex);
            const y = this.getSlotY(data.slotIndex);
            data.container.x = x;
            data.container.y = y;
            this.syncEnemyUI(id);
        });
    },
    
    // gameState와 동기화
    syncWithGameState() {
        if (!gameState || !gameState.enemies) return;
        
        // 죽은 적 제거
        this.sprites.forEach((data, id) => {
            const enemy = gameState.enemies.find(e => (e.id || e.name) === id);
            if (!enemy || enemy.hp <= 0) {
                this.removeEnemy(data.enemy);
            }
        });
        
        // 새 적 추가 및 위치 동기화
        gameState.enemies.forEach((enemy, index) => {
            if (enemy.hp <= 0) return;
            
            const enemyId = enemy.id || enemy.name;
            if (!this.sprites.has(enemyId)) {
                this.addEnemy(enemy, index);
            } else {
                // 슬롯 위치 업데이트
                const data = this.sprites.get(enemyId);
                if (data.slotIndex !== index) {
                    this.moveToSlot(enemy, index, 0.2);
                }
            }
        });
    },
    
    // ==========================================
    // 활성화/비활성화
    // ==========================================
    enable() {
        if (!this.initialized) {
            this.init();
        }
        this.enabled = true;
        if (this.container) {
            this.container.visible = true;
        }
        if (this.uiOverlay) {
            this.uiOverlay.style.display = '';
        }
        
        // DOM 적 숨기기
        const existingContainer = document.getElementById('enemies-container');
        if (existingContainer) {
            existingContainer.style.opacity = '0';
            existingContainer.style.pointerEvents = 'none';
        }
        
        // 현재 적 렌더링
        if (typeof gameState !== 'undefined' && gameState.enemies) {
            this.syncWithGameState();
        }
        
        console.log('[EnemyRenderer] ✅ Enabled - PixiJS 적 렌더링 활성화');
    },
    
    disable() {
        this.enabled = false;
        if (this.container) {
            this.container.visible = false;
        }
        if (this.uiOverlay) {
            this.uiOverlay.style.display = 'none';
        }
        
        // DOM 적 복원
        const existingContainer = document.getElementById('enemies-container');
        if (existingContainer) {
            existingContainer.style.opacity = '1';
            existingContainer.style.pointerEvents = 'auto';
        }
        
        this.clearAllEnemies();
        
        console.log('[EnemyRenderer] ❌ Disabled - DOM 적 렌더링으로 복귀');
    },
    
    // 테스트용 토글
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
};

// 전역 등록
window.EnemyRenderer = EnemyRenderer;

// 스타일 추가
const enemyRendererStyles = document.createElement('style');
enemyRendererStyles.textContent = `
    .enemy-ui-element {
        text-align: center;
    }
    
    .enemy-hp-bar {
        width: 100px;
        height: 12px;
        background: #333;
        border: 2px solid #666;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
    }
    
    .enemy-hp-bar .hp-fill {
        height: 100%;
        background: linear-gradient(to bottom, #ff6b6b, #c92a2a);
        transition: width 0.3s ease;
    }
    
    .enemy-hp-bar .hp-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 1px #000;
    }
    
    .enemy-intent {
        margin-top: 5px;
        font-size: 14px;
    }
    
    #enemy-canvas-container {
        image-rendering: pixelated;
    }
`;
document.head.appendChild(enemyRendererStyles);

console.log('[EnemyRenderer] Script loaded');
