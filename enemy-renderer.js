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
        slotSpacing: 180,      // 슬롯 간격 (넓게)
        baseY: 200,            // 기본 Y 위치
        baseScale: 0.35,       // 기본 스케일 (작게!)
        depthScale: 0.85,      // 깊이에 따른 스케일 감소
        maxSlots: 5            // 최대 슬롯 수
    },
    
    // 상태
    initialized: false,
    enabled: true,  // ✅ 기본 활성화! PixiJS 적 렌더링이 메인!
    
    // ==========================================
    // 초기화 (비동기 - PixiJS v8 호환)
    // ==========================================
    async init() {
        if (this.initialized) return true;
        
        // PixiJS 확인
        if (typeof PIXI === 'undefined') {
            console.warn('[EnemyRenderer] PixiJS not found');
            return false;
        }
        
        console.log('[EnemyRenderer] 초기화 시작...');
        
        // 기존 PixiRenderer 활용 (권장)
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.app) {
            this.app = PixiRenderer.app;
            console.log('[EnemyRenderer] ✅ 기존 PixiRenderer.app 사용');
        } else {
            // 새 앱 생성 (비동기)
            await this.createApp();
        }
        
        if (!this.app) {
            console.error('[EnemyRenderer] ❌ Failed to create PixiJS app');
            return false;
        }
        
        // 적 전용 컨테이너 생성
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;  // zIndex 정렬 활성화
        this.container.label = 'EnemyRenderer';  // 디버깅용
        this.app.stage.addChild(this.container);
        
        // UI 오버레이 컨테이너 (HTML)
        this.createUIOverlay();
        
        this.initialized = true;
        
        console.log('[EnemyRenderer] ✅ 초기화 완료!');
        return true;
    },
    
    async createApp() {
        const battleArena = document.querySelector('.battle-arena');
        if (!battleArena) {
            console.error('[EnemyRenderer] battle-arena not found');
            return;
        }
        
        console.log('[EnemyRenderer] 새 PixiJS 앱 생성 중...');
        
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
        
        // PixiJS v8 방식: 먼저 인스턴스 생성 후 init() 호출
        this.app = new PIXI.Application();
        
        await this.app.init({
            width: battleArena.offsetWidth || 1200,
            height: battleArena.offsetHeight || 600,
            backgroundAlpha: 0,  // v8: transparent 대신 backgroundAlpha
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        
        this.app.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: auto;
        `;
        
        canvasContainer.appendChild(this.app.canvas);
        
        console.log('[EnemyRenderer] ✅ PixiJS 앱 생성 완료');
        
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
                z-index: 50;
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
    // 슬롯 위치 계산 (2D 나란히 배치)
    // ==========================================
    getSlotX(slotIndex) {
        // 화면 중앙 기준으로 슬롯 배치
        const centerX = this.app ? this.app.renderer.width / 2 : 600;
        const totalSlots = Math.max(gameState?.enemies?.filter(e => e.hp > 0).length || 1, 1);
        const totalWidth = (totalSlots - 1) * this.config.slotSpacing;
        const startX = centerX - totalWidth / 2 + 150;  // 오른쪽으로 오프셋
        
        return startX + (slotIndex * this.config.slotSpacing);
    },
    
    getSlotY(slotIndex) {
        // ✅ 모든 적 같은 Y 위치 (나란히 배치)
        const appHeight = this.app?.renderer?.height || 600;
        return appHeight * 0.52;  // 화면 높이의 52% 위치 (HP HUD 공간 확보)
    },
    
    getSlotScale(slotIndex, enemy = null) {
        // ✅ 모든 적 같은 스케일 (2D 배치)
        let scale = this.config.baseScale;
        
        // 보스/엘리트는 더 크게!
        if (enemy) {
            if (enemy.isBoss) {
                scale *= 1.5;  // 보스는 50% 크게
            } else if (enemy.isElite) {
                scale *= 1.25;  // 엘리트는 25% 크게
            }
        }
        
        return scale;
    },
    
    getSlotZIndex(slotIndex) {
        // 앞에 있을수록 위에 그려짐 (왼쪽이 앞)
        return 100 - slotIndex;
    },
    
    // ==========================================
    // 적 추가/제거
    // ==========================================
    async addEnemy(enemy, slotIndex) {
        if (!this.initialized || !enemy) return null;
        
        // PixiJS용 고유 ID 사용 (매번 새로 생성됨)
        const enemyId = enemy.pixiId || enemy.id || `enemy_${slotIndex}_${Date.now()}`;
        
        // 이미 존재하면 스킵 (pixiId 기반)
        if (this.sprites.has(enemyId)) {
            console.log(`[EnemyRenderer] 이미 존재: ${enemyId}`);
            return this.sprites.get(enemyId);
        }
        
        // 스프라이트 생성 (비동기)
        const spriteData = await this.createEnemySprite(enemy, slotIndex);
        if (!spriteData) return null;
        
        // 맵에 저장
        this.sprites.set(enemyId, {
            sprite: spriteData.sprite,
            container: spriteData.container,
            enemy: enemy,
            slotIndex: slotIndex,
            topUI: null,
            bottomUI: null
        });
        
        // UI 오버레이 생성
        this.createEnemyUI(enemyId, enemy, slotIndex);
        
        console.log(`[EnemyRenderer] Added enemy: ${enemy.name} at slot ${slotIndex}`);
        
        return spriteData;
    },
    
    async createEnemySprite(enemy, slotIndex) {
        console.log(`[EnemyRenderer] createEnemySprite: ${enemy.name}, slot ${slotIndex}`);
        
        // 적 컨테이너 (스프라이트 + 이펙트용)
        const enemyContainer = new PIXI.Container();
        enemyContainer.sortableChildren = true;
        enemyContainer.label = enemy.name;  // 디버깅용
        
        // 스프라이트 이미지 경로 (img 필드 우선!)
        const spritePath = enemy.sprite || enemy.img || enemy.image || 'goblin.png';
        console.log(`[EnemyRenderer] 스프라이트 경로: ${spritePath}`);
        
        // 스프라이트 생성
        let sprite;
        try {
            // ✅ PIXI.Assets로 비동기 로드 (더 안정적)
            const texture = await PIXI.Assets.load(spritePath).catch(() => null);
            
            if (texture) {
                sprite = new PIXI.Sprite(texture);
                sprite.label = `${enemy.name}_sprite`;
                
                // 픽셀 아트 선명하게
                sprite.texture.source.scaleMode = 'nearest';
                
                console.log(`[EnemyRenderer] ✅ 스프라이트 로드됨: ${spritePath}, 크기: ${sprite.width}x${sprite.height}`);
            } else {
                throw new Error('텍스처 로드 실패');
            }
        } catch (e) {
            console.error(`[EnemyRenderer] ❌ 스프라이트 로드 실패: ${spritePath}`, e);
            // 폴백: 플레이스홀더 (PixiJS v8 Graphics API)
            const graphics = new PIXI.Graphics();
            graphics.rect(-50, -150, 100, 150);
            graphics.fill({ color: 0x666666 });
            sprite = graphics;
        }
        
        // 앵커 설정 (하단 중앙)
        if (sprite.anchor) {
            sprite.anchor.set(0.5, 1);
        }
        
        // 위치 및 스케일 (getSlot 함수 사용)
        const x = this.getSlotX(slotIndex);
        const y = this.getSlotY(slotIndex);
        const scale = this.getSlotScale(slotIndex, enemy);
        
        enemyContainer.x = x;
        enemyContainer.y = y;
        enemyContainer.scale.set(scale);
        enemyContainer.zIndex = this.getSlotZIndex(slotIndex);
        
        console.log(`[EnemyRenderer] 위치: x=${x}, y=${y}, scale=${scale}`);
        
        // ✅ 보스/엘리트 특별 효과
        if (enemy.isBoss) {
            enemyContainer.filters = enemyContainer.filters || [];
        }
        
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
        
        // ✅ 아웃라인 효과 (스프라이트 복제 방식)
        this.applyOutlineEffect(sprite, enemyContainer);
        
        // 메인 컨테이너에 추가
        this.container.addChild(enemyContainer);
        
        // 등장 애니메이션
        this.playEntranceAnimation(enemyContainer);
        
        // ✅ 숨쉬는 애니메이션 시작
        this.startBreathingAnimation(enemyContainer, scale);
        
        return { sprite, container: enemyContainer };
    },
    
    removeEnemy(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data) {
            // 스프라이트 제거
            if (data.container && data.container.parent) {
                data.container.parent.removeChild(data.container);
                data.container.destroy({ children: true });
            }
            
            // 상단 UI 제거
            if (data.topUI && data.topUI.parentNode) {
                data.topUI.parentNode.removeChild(data.topUI);
            }
            
            // 하단 UI 제거
            if (data.bottomUI && data.bottomUI.parentNode) {
                data.bottomUI.parentNode.removeChild(data.bottomUI);
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
            // 상단 UI 제거
            if (data.topUI && data.topUI.parentNode) {
                data.topUI.parentNode.removeChild(data.topUI);
            }
            // 하단 UI 제거
            if (data.bottomUI && data.bottomUI.parentNode) {
                data.bottomUI.parentNode.removeChild(data.bottomUI);
            }
        });
        this.sprites.clear();
        console.log('[EnemyRenderer] Cleared all enemies');
    },
    
    // ==========================================
    // 슬롯 이동 (핵심!)
    // ==========================================
    moveToSlot(enemy, newSlot, duration = 0.3) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
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
            const id = enemy.pixiId || enemy.id || enemy.name;
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
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
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
    // UI 오버레이 (HP바, 인텐트, 브레이크 게이지 등)
    // ==========================================
    createEnemyUI(enemyId, enemy, slotIndex) {
        if (!this.uiOverlay) return;
        
        // ==========================================
        // 상단 UI 컨테이너 (인텐트 + 브레이크) - 머리 위
        // ==========================================
        const topUI = document.createElement('div');
        topUI.className = 'enemy-ui-top';
        topUI.dataset.enemyId = enemyId;
        topUI.dataset.part = 'top';
        topUI.style.cssText = `
            position: absolute;
            pointer-events: none;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            z-index: 60;
        `;
        
        // 인텐트
        const intentEl = document.createElement('div');
        intentEl.className = 'enemy-intent pixi-intent';
        intentEl.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        intentEl.innerHTML = this.getIntentHTML(enemy);
        topUI.appendChild(intentEl);
        
        // 브레이크 게이지 (인텐트 아래)
        const breakGauge = document.createElement('div');
        breakGauge.className = 'break-gauge-container pixi-break';
        breakGauge.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
        `;
        breakGauge.innerHTML = this.getBreakGaugeHTML(enemy);
        
        // 브레이크 가능한 인텐트가 있는지 확인
        const hasBreakable = typeof BreakSystem !== 'undefined' && 
                            BreakSystem.hasBreakableIntent && 
                            BreakSystem.hasBreakableIntent(enemy);
        if (!hasBreakable && !enemy.breakGauge) {
            breakGauge.style.display = 'none';
        }
        topUI.appendChild(breakGauge);
        
        this.uiOverlay.appendChild(topUI);
        
        // ==========================================
        // 하단 UI 컨테이너 (HP 바) - 발 밑
        // ==========================================
        const bottomUI = document.createElement('div');
        bottomUI.className = 'enemy-ui-bottom';
        bottomUI.dataset.enemyId = enemyId;
        bottomUI.dataset.part = 'bottom';
        bottomUI.style.cssText = `
            position: absolute;
            pointer-events: none;
            transform: translate(-50%, 0);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            z-index: 55;
        `;
        
        // HP 바
        const hpBar = document.createElement('div');
        hpBar.className = 'enemy-hp-bar pixi-hp';
        hpBar.style.cssText = `
            width: 100px;
            height: 14px;
            background: #1a1a1a;
            border: 2px solid #444;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        `;
        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
        hpBar.innerHTML = `
            <div class="hp-fill" style="width: ${hpPercent}%; height: 100%; background: linear-gradient(to bottom, #e53e3e, #c53030); position: absolute; top: 0; left: 0; transition: width 0.3s ease;"></div>
            <span class="hp-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; font-size: 0.7rem; font-weight: bold; color: #fff; text-shadow: 1px 1px 1px #000;">${enemy.hp}/${enemy.maxHp}</span>
        `;
        bottomUI.appendChild(hpBar);
        
        // 쉴드 표시
        const shieldEl = document.createElement('div');
        shieldEl.className = 'enemy-shield pixi-shield';
        shieldEl.style.cssText = `
            font-size: 0.9rem;
            color: #60a5fa;
            text-shadow: 0 0 5px #60a5fa;
            display: ${enemy.shield && enemy.shield > 0 ? 'block' : 'none'};
        `;
        shieldEl.innerHTML = `🛡️ ${enemy.shield || 0}`;
        bottomUI.appendChild(shieldEl);
        
        // 상태 효과
        const statusEl = document.createElement('div');
        statusEl.className = 'enemy-status-effects pixi-status';
        statusEl.style.cssText = `
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 120px;
        `;
        statusEl.innerHTML = this.getStatusEffectsHTML(enemy);
        bottomUI.appendChild(statusEl);
        
        this.uiOverlay.appendChild(bottomUI);
        
        // 위치 동기화
        const data = this.sprites.get(enemyId);
        if (data) {
            data.topUI = topUI;
            data.bottomUI = bottomUI;
            this.syncEnemyUI(enemyId);
        }
    },
    
    // 인텐트 HTML 생성 (브레이크 시스템 연동)
    getIntentHTML(enemy) {
        // 브레이크 상태면 스턴 표시
        if (enemy.isBroken) {
            return `
                <div class="intent-broken">
                    <span class="broken-icon">💫</span>
                    <span class="broken-text">BREAK!</span>
                </div>
            `;
        }
        
        // ✅ currentIntent 또는 intent/intentValue 사용
        let intentType = enemy.currentIntent?.type || enemy.intent;
        let intentValue = enemy.currentIntent?.value || enemy.intentValue;
        let intentHits = enemy.currentIntent?.hits || enemy.intentHits || 1;
        
        if (!intentType) {
            return '<span style="color: #888; font-size: 1.5rem;">❓</span>';
        }
        
        let icon = '❓';
        let value = intentValue || '';
        let className = 'intent-unknown';
        let dangerClass = '';
        
        // 브레이크 가능한 위험 인텐트 체크
        const breakableTypes = ['attack', 'heavy_attack', 'multi_attack', 'special'];
        if (breakableTypes.includes(intentType) && typeof BreakSystem !== 'undefined' && BreakSystem.hasBreakableIntent && BreakSystem.hasBreakableIntent(enemy)) {
            dangerClass = 'danger-intent';
        }
        
        switch (intentType) {
            case 'attack':
                icon = '⚔️';
                className = 'intent-attack';
                break;
            case 'heavy_attack':
                icon = '💥';
                className = 'intent-attack intent-heavy';
                break;
            case 'multi_attack':
                icon = '⚔️';
                className = 'intent-attack intent-multi';
                break;
            case 'defend':
                icon = '🛡️';
                className = 'intent-defend';
                break;
            case 'buff':
                icon = '💪';
                className = 'intent-buff';
                break;
            case 'debuff':
                icon = '💀';
                className = 'intent-debuff';
                break;
            case 'heal':
                icon = '💚';
                className = 'intent-heal';
                break;
            case 'retreat':
                icon = '🏃';
                className = 'intent-retreat';
                break;
            case 'advance':
                icon = '💨';
                className = 'intent-advance';
                break;
            case 'special':
                icon = '⭐';
                className = 'intent-special';
                break;
        }
        
        // 히트 수 표시 (멀티 히트)
        let hitsDisplay = '';
        if (intentHits > 1) {
            hitsDisplay = `<span class="intent-hits">x${intentHits}</span>`;
        }
        
        // 위험 인텐트 표시 (브레이크 가능)
        let dangerIcon = '';
        if (dangerClass) {
            dangerIcon = '<span class="danger-icon">⚠️</span>';
        }
        
        return `
            <div class="intent-display ${className} ${dangerClass}">
                ${dangerIcon}
                <span class="intent-icon">${icon}</span>
                <span class="intent-value">${value}</span>
                ${hitsDisplay}
            </div>
        `;
    },
    
    // 브레이크 게이지 HTML (레시피 진행 표시 포함)
    getBreakGaugeHTML(enemy) {
        // 브레이크 가능한 인텐트가 있는지 확인
        const hasBreakable = typeof BreakSystem !== 'undefined' && 
                            BreakSystem.hasBreakableIntent && 
                            BreakSystem.hasBreakableIntent(enemy);
        
        if (!hasBreakable && !enemy.breakGauge && enemy.breakGauge !== 0) {
            return '';
        }
        
        // 레시피 진행 상황
        const recipe = enemy.currentBreakRecipe || [];
        const progress = enemy.breakProgress || [];
        const total = recipe.length;
        const current = progress.length;
        const percent = total > 0 ? (current / total) * 100 : 0;
        
        // 레시피 아이콘 표시
        let recipeIcons = '';
        if (recipe.length > 0) {
            recipeIcons = '<div class="break-recipe">';
            recipe.forEach((element, i) => {
                const completed = i < progress.length;
                const icon = this.getElementIcon(element);
                recipeIcons += `<span class="recipe-icon ${completed ? 'completed' : ''}">${icon}</span>`;
            });
            recipeIcons += '</div>';
        }
        
        return `
            ${recipeIcons}
            <div class="break-gauge">
                <div class="break-fill" style="width: ${percent}%"></div>
            </div>
        `;
    },
    
    // 속성 아이콘 가져오기
    getElementIcon(element) {
        const icons = {
            fire: '🔥',
            ice: '❄️',
            lightning: '⚡',
            physical: '👊',
            magic: '✨',
            slash: '🗡️',
            pierce: '🏹',
            blunt: '🔨'
        };
        return icons[element] || '❓';
    },
    
    // 상태 효과 HTML
    getStatusEffectsHTML(enemy) {
        const effects = [];
        
        if (enemy.poison && enemy.poison > 0) effects.push(`☠️${enemy.poison}`);
        if (enemy.bleed && enemy.bleed > 0) effects.push(`🩸${enemy.bleed}`);
        if (enemy.burn && enemy.burn > 0) effects.push(`🔥${enemy.burn}`);
        if (enemy.weak && enemy.weak > 0) effects.push(`😵${enemy.weak}`);
        if (enemy.vulnerable && enemy.vulnerable > 0) effects.push(`💔${enemy.vulnerable}`);
        if (enemy.strengthBuff && enemy.strengthBuff > 0) effects.push(`💪${enemy.strengthBuff}`);
        if (enemy.frenzyStacks && enemy.frenzyStacks > 0) effects.push(`😈${enemy.frenzyStacks}`);
        
        return effects.map(e => `<span class="status-icon">${e}</span>`).join('');
    },
    
    syncEnemyUI(enemyId) {
        const data = this.sprites.get(enemyId);
        if (!data || !data.container) return;
        
        // 스프라이트 글로벌 위치 (앵커가 하단 중앙이므로 y는 발 위치)
        const globalPos = data.container.getGlobalPosition();
        
        // 스프라이트 높이 계산 (스케일 적용)
        let spriteHeight = 200;  // 기본값
        if (data.sprite && data.sprite.height) {
            spriteHeight = data.sprite.height * data.container.scale.y;
        }
        
        // 상단 UI (인텐트 + 브레이크) - 머리 위
        if (data.topUI) {
            data.topUI.style.left = globalPos.x + 'px';
            data.topUI.style.top = (globalPos.y - spriteHeight - 10) + 'px';  // 머리 바로 위
            data.topUI.style.display = 'flex';
            data.topUI.style.visibility = 'visible';
        }
        
        // 하단 UI (이름 + HP바 + 상태) - 발 밑
        if (data.bottomUI) {
            data.bottomUI.style.left = globalPos.x + 'px';
            data.bottomUI.style.top = (globalPos.y + 10) + 'px';  // 발 바로 밑
            data.bottomUI.style.display = 'flex';
            data.bottomUI.style.visibility = 'visible';
        }
    },
    
    syncAllUI() {
        this.sprites.forEach((data, id) => {
            this.syncEnemyUI(id);
        });
    },
    
    updateEnemyHP(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        // 하단 UI에서 HP 바 찾기
        if (data && data.bottomUI) {
            const hpFill = data.bottomUI.querySelector('.hp-fill');
            const hpText = data.bottomUI.querySelector('.hp-text');
            
            if (hpFill) {
                const percent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
                hpFill.style.width = `${percent}%`;
            }
            if (hpText) {
                hpText.textContent = `${enemy.hp}/${enemy.maxHp}`;
            }
        }
    },
    
    // 인텐트 업데이트
    updateEnemyIntent(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        // 상단 UI에서 인텐트 찾기
        if (data && data.topUI) {
            const intentEl = data.topUI.querySelector('.pixi-intent');
            if (intentEl) {
                intentEl.innerHTML = this.getIntentHTML(enemy);
            }
        }
    },
    
    // 브레이크 게이지 업데이트
    updateEnemyBreak(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        // 상단 UI에서 브레이크 게이지 찾기
        if (data && data.topUI) {
            const breakEl = data.topUI.querySelector('.pixi-break');
            if (breakEl) {
                breakEl.innerHTML = this.getBreakGaugeHTML(enemy);
                
                // 브레이크 가능 상태면 표시
                if (typeof BreakSystem !== 'undefined' && 
                    BreakSystem.hasBreakableIntent && 
                    BreakSystem.hasBreakableIntent(enemy)) {
                    breakEl.style.display = '';
                } else if (!enemy.breakGauge) {
                    breakEl.style.display = 'none';
                }
            }
        }
    },
    
    // 브레이크 상태 설정 (스프라이트 효과)
    setEnemyBrokenState(enemy, isBroken) {
        if (!enemy) return;
        
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) return;
        
        const container = data.container;
        const sprite = data.sprite;
        
        try {
            if (isBroken) {
                // 브레이크 상태: 스턴 효과
                if (sprite && sprite.tint !== undefined) {
                    sprite.tint = 0xaaaaff;  // 파란 빛
                }
                
                // 숨쉬기 애니메이션 멈추기
                if (container.breathingTween) {
                    container.breathingTween.pause();
                }
                
                // 스턴 흔들림 애니메이션 (rotation 속성이 있는지 확인)
                if (typeof gsap !== 'undefined' && container.rotation !== undefined) {
                    gsap.to(container, {
                        rotation: 0.05,
                        duration: 0.1,
                        yoyo: true,
                        repeat: -1,
                        ease: 'sine.inOut'
                    });
                }
                
                console.log('[EnemyRenderer] 브레이크 상태 설정:', enemyId);
            } else {
                // 브레이크 해제
                if (sprite && sprite.tint !== undefined) {
                    sprite.tint = 0xffffff;  // 원래 색상
                }
                
                // 흔들림 멈추기
                if (typeof gsap !== 'undefined') {
                    gsap.killTweensOf(container);
                    if (container.rotation !== undefined) {
                        container.rotation = 0;
                    }
                }
                
                // 숨쉬기 애니메이션 재개
                if (container.breathingTween) {
                    container.breathingTween.resume();
                }
            }
        } catch (e) {
            console.warn('[EnemyRenderer] setEnemyBrokenState error:', e);
        }
    },
    
    // 쉴드 업데이트
    updateEnemyShield(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        // 하단 UI에서 쉴드 찾기
        if (data && data.bottomUI) {
            let shieldEl = data.bottomUI.querySelector('.pixi-shield');
            
            if (enemy.shield && enemy.shield > 0) {
                if (!shieldEl) {
                    shieldEl = document.createElement('div');
                    shieldEl.className = 'enemy-shield pixi-shield';
                    shieldEl.style.cssText = `
                        font-size: 0.9rem;
                        color: #60a5fa;
                        text-shadow: 0 0 5px #60a5fa;
                    `;
                    data.bottomUI.appendChild(shieldEl);
                }
                shieldEl.innerHTML = `🛡️ ${enemy.shield}`;
                shieldEl.style.display = '';
            } else if (shieldEl) {
                shieldEl.style.display = 'none';
            }
        }
    },
    
    // 상태 효과 업데이트
    updateEnemyStatus(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        // 하단 UI에서 상태 효과 찾기
        if (data && data.bottomUI) {
            const statusEl = data.bottomUI.querySelector('.pixi-status');
            if (statusEl) {
                statusEl.innerHTML = this.getStatusEffectsHTML(enemy);
            }
        }
    },
    
    // 전체 UI 업데이트
    updateEnemyUI(enemy) {
        this.updateEnemyHP(enemy);
        this.updateEnemyIntent(enemy);
        this.updateEnemyBreak(enemy);
        this.updateEnemyShield(enemy);
        this.updateEnemyStatus(enemy);
    },
    
    // 모든 적 UI 업데이트
    updateAllEnemyUI() {
        if (!gameState || !gameState.enemies) return;
        
        gameState.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                this.updateEnemyUI(enemy);
            }
        });
    },
    
    // 적 UI 숨기기 (사망 시)
    hideEnemyUI(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        // 상단 UI 숨기기
        if (data && data.topUI) {
            data.topUI.style.display = 'none';
            data.topUI.style.visibility = 'hidden';
            data.topUI.style.opacity = '0';
        }
        
        // 하단 UI 숨기기
        if (data && data.bottomUI) {
            data.bottomUI.style.display = 'none';
            data.bottomUI.style.visibility = 'hidden';
            data.bottomUI.style.opacity = '0';
        }
        
        console.log('[EnemyRenderer] hideEnemyUI:', enemyId);
    },
    
    // 적 스프라이트 이미지 소스 가져오기 (고어 시스템용)
    getEnemySpriteSrc(enemy) {
        if (!enemy) return null;
        
        // 먼저 enemy 객체의 이미지 경로 사용
        const imgPath = enemy.sprite || enemy.img || enemy.image;
        if (imgPath) {
            console.log('[EnemyRenderer] getEnemySpriteSrc from enemy:', imgPath);
            return imgPath;
        }
        
        // PixiJS 스프라이트에서 텍스처 소스 추출 시도
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data && data.sprite && data.sprite.texture) {
            // PixiJS 텍스처에서 이미지 소스 추출
            const texture = data.sprite.texture;
            if (texture.baseTexture && texture.baseTexture.resource) {
                const src = texture.baseTexture.resource.src;
                console.log('[EnemyRenderer] getEnemySpriteSrc from texture:', src);
                return src;
            }
        }
        
        console.log('[EnemyRenderer] getEnemySpriteSrc: 이미지 소스 없음');
        return null;
    },
    
    // 선택 표시
    setEnemySelected(enemy, isSelected) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) return;
        
        if (isSelected) {
            // 선택 효과 - 네온 아웃라인
            const baseScale = data.container.breathingBaseScale || this.getSlotScale(data.slotIndex, data.enemy);
            
            // GlowFilter 시도
            if (typeof PIXI.GlowFilter !== 'undefined') {
                data.container.filters = [new PIXI.GlowFilter({
                    distance: 15,
                    outerStrength: 2,
                    innerStrength: 0,
                    color: 0x00ffff,
                    quality: 0.5
                })];
            } else if (typeof PIXI.DropShadowFilter !== 'undefined') {
                // 폴백: 여러 DropShadow로 글로우 효과
                const glowFilters = [];
                const glowColor = 0x00ffff;
                [4, 6, 8].forEach(dist => {
                    [0, 90, 180, 270].forEach(angle => {
                        const rad = angle * Math.PI / 180;
                        glowFilters.push(new PIXI.DropShadowFilter({
                            offset: { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist },
                            color: glowColor,
                            alpha: 0.6,
                            blur: 2,
                            quality: 1
                        }));
                    });
                });
                data.container.filters = glowFilters;
            }
            
            // 스케일 업 (펄스 효과)
            gsap.to(data.container.scale, {
                x: baseScale * 1.08,
                y: baseScale * 1.08,
                duration: 0.2,
                ease: "back.out(2)"
            });
        } else {
            data.container.filters = [];
            const baseScale = data.container.breathingBaseScale || this.getSlotScale(data.slotIndex, data.enemy);
            gsap.to(data.container.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.15
            });
        }
    },
    
    // 타겟 하이라이트 (카드 드래그 시)
    highlightAsTarget(enemy, isHighlighted) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) return;
        
        const sprite = data.sprite;
        const baseScale = data.container.breathingBaseScale || this.getSlotScale(data.slotIndex, data.enemy);
        
        if (isHighlighted) {
            // 🔴 붉은 네온 효과
            if (sprite && sprite.tint !== undefined) {
                sprite.tint = 0xff8888;  // 밝은 빨강
            }
            
            // 확대 + 펄스
            gsap.to(data.container.scale, {
                x: baseScale * 1.12,
                y: baseScale * 1.12,
                duration: 0.15,
                ease: "back.out(2)"
            });
            
            // 글로우 필터 추가 (가능하면)
            if (typeof PIXI.DropShadowFilter !== 'undefined') {
                const glowFilters = [];
                const glowColor = 0xff4444;
                [3, 5].forEach(dist => {
                    [0, 90, 180, 270].forEach(angle => {
                        const rad = angle * Math.PI / 180;
                        glowFilters.push(new PIXI.DropShadowFilter({
                            offset: { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist },
                            color: glowColor,
                            alpha: 0.7,
                            blur: 2,
                            quality: 1
                        }));
                    });
                });
                data.container.filters = glowFilters;
            }
        } else {
            // 원래 상태로 복원
            if (sprite && sprite.tint !== undefined) {
                sprite.tint = 0xffffff;
            }
            data.container.filters = [];
            
            // 아웃라인 재적용
            this.applyOutlineEffect(sprite, data.container);
            
            gsap.to(data.container.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.15
            });
        }
    },
    
    // ==========================================
    // 애니메이션
    // ==========================================
    playEntranceAnimation(container) {
        // ✅ GSAP PixiPlugin 없이도 동작하도록 수동 애니메이션
        container.alpha = 0;
        const targetScale = container.scale.x;  // 이미 설정된 스케일 저장
        container.scale.set(targetScale * 0.5);
        
        // 직접 틱 애니메이션
        let progress = 0;
        const animate = () => {
            progress += 0.05;
            if (progress >= 1) {
                container.alpha = 1;
                container.scale.set(targetScale);
                return;
            }
            
            // 이징 적용
            const eased = 1 - Math.pow(1 - progress, 3);
            container.alpha = eased;
            container.scale.set(targetScale * (0.5 + 0.5 * eased));
            
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        
        console.log(`[EnemyRenderer] 등장 애니메이션 시작, targetScale: ${targetScale}`);
    },
    
    // ✅ 아웃라인 효과 적용 (검은색 두꺼운 외곽선 - 스프라이트 복제 방식)
    applyOutlineEffect(sprite, container) {
        if (!sprite || !container) return;
        
        try {
            // 기존 아웃라인 제거
            const existingOutlines = container.children.filter(c => c.isOutline);
            existingOutlines.forEach(o => {
                container.removeChild(o);
                o.destroy();
            });
            
            // 스프라이트의 텍스처가 있어야 함
            if (!sprite.texture) {
                console.log('[EnemyRenderer] 스프라이트 텍스처 없음, 아웃라인 스킵');
                return;
            }
            
            const outlineDistance = 3;  // 외곽선 두께
            const outlineColor = 0x000000;  // 검은색
            
            // 8방향으로 검은 스프라이트 복제
            const directions = [
                { x: outlineDistance, y: 0 },
                { x: -outlineDistance, y: 0 },
                { x: 0, y: outlineDistance },
                { x: 0, y: -outlineDistance },
                { x: outlineDistance * 0.7, y: outlineDistance * 0.7 },
                { x: -outlineDistance * 0.7, y: outlineDistance * 0.7 },
                { x: outlineDistance * 0.7, y: -outlineDistance * 0.7 },
                { x: -outlineDistance * 0.7, y: -outlineDistance * 0.7 },
            ];
            
            directions.forEach(dir => {
                const outline = new PIXI.Sprite(sprite.texture);
                outline.anchor.set(sprite.anchor.x, sprite.anchor.y);
                outline.x = dir.x;
                outline.y = dir.y;
                outline.tint = outlineColor;
                outline.zIndex = -1;  // 메인 스프라이트 뒤에
                outline.isOutline = true;  // 마커
                
                container.addChild(outline);
            });
            
            // 메인 스프라이트가 맨 위에 오도록
            sprite.zIndex = 10;
            container.sortChildren();
            
            console.log('[EnemyRenderer] ✅ 아웃라인 스프라이트 8개 추가됨');
        } catch (e) {
            console.log('[EnemyRenderer] 아웃라인 에러:', e);
        }
    },
    
    // ✅ 숨쉬는 애니메이션 (GSAP 기반 - DOM 버전과 동일한 느낌)
    startBreathingAnimation(container, baseScale) {
        if (!container || !container.scale || typeof gsap === 'undefined') return;
        
        // y 값이 없으면 종료
        if (container.y === null || container.y === undefined) {
            console.warn('[EnemyRenderer] startBreathingAnimation: container.y is null');
            return;
        }
        
        // 기존 애니메이션 정리
        this.stopBreathingAnimation(container);
        
        // 각 적마다 다른 딜레이로 시작 (동기화 방지)
        const delay = Math.random() * 1.5;
        const duration = 1.0 + Math.random() * 0.3;  // 1.0~1.3초 주기
        const baseY = container.y;  // 현재 y 위치 저장
        
        // GSAP 타임라인으로 숨쉬기 (반복, yoyo)
        const tl = gsap.timeline({ 
            repeat: -1, 
            yoyo: true, 
            delay: delay,
            defaults: { ease: "sine.inOut" }
        });
        
        // 숨쉬기: 스케일 Y 증가, X 감소 + 위로 살짝 이동
        tl.to(container.scale, {
            y: baseScale * 1.03,   // Y 3% 늘어남
            x: baseScale * 0.98,   // X 2% 줄어듦
            duration: duration
        }, 0);
        
        tl.to(container, {
            y: baseY - 5,    // 위로 5px (저장된 baseY 사용)
            duration: duration
        }, 0);
        
        // 참조 저장 (나중에 중지용)
        container.breathingTween = tl;
        container.breathingBaseScale = baseScale;
        container.breathingBaseY = baseY;
    },
    
    // 숨쉬기 애니메이션 중지
    stopBreathingAnimation(container) {
        if (!container) return;
        
        if (container.breathingTween) {
            container.breathingTween.kill();
            container.breathingTween = null;
        }
        
        // 원래 스케일과 위치로 복원 (안전하게)
        try {
            if (container.scale && container.breathingBaseScale) {
                container.scale.set(container.breathingBaseScale);
            }
            if (container.breathingBaseY !== undefined && container.breathingBaseY !== null) {
                container.y = container.breathingBaseY;
            }
        } catch (e) {
            console.warn('[EnemyRenderer] stopBreathingAnimation error:', e);
        }
    },
    
    // ==========================================
    // 공격 애니메이션 (PixiJS 전용)
    // ==========================================
    playAttackAnimation(enemy, attackType = 'melee', damage = 0) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) {
            console.log('[EnemyRenderer] playAttackAnimation: 스프라이트 없음', enemyId);
            return;
        }
        
        const container = data.container;
        const sprite = data.sprite;
        const originalX = container.x;
        const originalY = container.y;
        const originalScaleX = container.scale.x;
        const originalScaleY = container.scale.y;
        
        // 숨쉬기 애니메이션 일시 중지
        if (container.breathingTween) {
            container.breathingTween.pause();
        }
        
        if (typeof gsap === 'undefined') return;
        
        console.log('[EnemyRenderer] playAttackAnimation:', attackType, damage);
        
        const tl = gsap.timeline({
            onComplete: () => {
                // 복귀 후 숨쉬기 재개
                setTimeout(() => {
                    if (container.breathingTween) {
                        container.breathingTween.resume();
                    }
                }, 100);
            }
        });
        
        // 공격 타입별 애니메이션
        if (attackType === 'melee') {
            // 근접 공격: 앞으로 돌진 후 복귀
            const dashDistance = -150;  // 플레이어 방향 (왼쪽)
            
            // 1️⃣ 준비 자세 (뒤로 살짝)
            tl.to(container, {
                x: originalX + 30,
                duration: 0.1,
                ease: 'power2.in'
            })
            .to(container.scale, {
                x: originalScaleX * 0.9,
                y: originalScaleY * 1.1,
                duration: 0.1,
                ease: 'power2.in'
            }, '<');
            
            // 2️⃣ 돌진!
            tl.to(container, {
                x: originalX + dashDistance,
                duration: 0.12,
                ease: 'power4.in'
            })
            .to(container.scale, {
                x: originalScaleX * 1.3,
                y: originalScaleY * 0.8,
                duration: 0.12,
                ease: 'power4.in'
            }, '<');
            
            // 3️⃣ 히트스탑 (잠시 멈춤)
            tl.to(container, {
                duration: 0.08
            });
            
            // 4️⃣ 복귀 (탄성)
            tl.to(container, {
                x: originalX,
                duration: 0.25,
                ease: 'elastic.out(1, 0.5)'
            })
            .to(container.scale, {
                x: originalScaleX,
                y: originalScaleY,
                duration: 0.25,
                ease: 'elastic.out(1, 0.5)'
            }, '<');
            
            // Tint 플래시 (공격 강조)
            if (sprite && sprite.tint !== undefined) {
                gsap.to(sprite, {
                    duration: 0.1,
                    onStart: () => { sprite.tint = 0xffcccc; },
                    onComplete: () => { sprite.tint = 0xffffff; }
                });
            }
            
        } else if (attackType === 'ranged') {
            // 원거리 공격: 손 내밀기
            tl.to(container, {
                x: originalX - 20,
                duration: 0.15,
                ease: 'power2.out'
            })
            .to(container.scale, {
                x: originalScaleX * 1.1,
                duration: 0.15,
                ease: 'power2.out'
            }, '<');
            
            // 발사 후 복귀
            tl.to(container, {
                x: originalX,
                duration: 0.2,
                ease: 'power2.out'
            }, '+=0.1')
            .to(container.scale, {
                x: originalScaleX,
                duration: 0.2,
                ease: 'power2.out'
            }, '<');
            
        } else if (attackType === 'magic') {
            // 마법 공격: 팽창 + 글로우
            tl.to(container, {
                y: originalY - 15,
                duration: 0.3,
                ease: 'power2.out'
            })
            .to(container.scale, {
                x: originalScaleX * 1.15,
                y: originalScaleY * 1.15,
                duration: 0.3,
                ease: 'power2.out'
            }, '<');
            
            // 마법 방출
            tl.to(container.scale, {
                x: originalScaleX * 0.95,
                y: originalScaleY * 0.95,
                duration: 0.1,
                ease: 'power4.in'
            });
            
            // 복귀
            tl.to(container, {
                y: originalY,
                duration: 0.3,
                ease: 'power2.out'
            })
            .to(container.scale, {
                x: originalScaleX,
                y: originalScaleY,
                duration: 0.3,
                ease: 'power2.out'
            }, '<');
            
            // Tint 플래시 (마법 색상)
            if (sprite && sprite.tint !== undefined) {
                gsap.to(sprite, {
                    duration: 0.3,
                    onStart: () => { sprite.tint = 0xaa88ff; },
                    onComplete: () => { sprite.tint = 0xffffff; }
                });
            }
        }
    },
    
    playDeathAnimation(enemy) {
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
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
    
    playHitAnimation(enemy, damage = 10, isCritical = false) {
        if (!enemy) return;
        
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container || !data.container.scale) return;
        
        const container = data.container;
        const sprite = data.sprite;
        
        try {
            // 숨쉬기 애니메이션 일시 중지
            if (container.breathingTween) {
                container.breathingTween.pause();
            }
            
            // 🔥 데미지 기반 강도 계산
            const intensity = Math.min(damage / 5, 8);
            const knockbackX = 20 + intensity * 8;
            const isHeavy = damage >= 12;
            const baseScale = container.breathingBaseScale || this.getSlotScale(data.slotIndex);
            
            // 🎆 PixiJS 이펙트 (글로벌 좌표에서)
            if (container.getGlobalPosition) {
                const globalPos = container.getGlobalPosition();
                const effectX = globalPos.x;
                const spriteHeight = sprite && sprite.height ? sprite.height * container.scale.y : 200;
                const effectY = globalPos.y - spriteHeight / 2;
                
                if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
                    if (isCritical) {
                        PixiRenderer.createCriticalHit(effectX, effectY, damage);
                        PixiRenderer.hitFlash('#ff0000', 120);
                    } else if (isHeavy) {
                        PixiRenderer.createHitImpact(effectX, effectY, damage, '#ff4444');
                        PixiRenderer.hitFlash('#ff0000', 60);
                    } else {
                        PixiRenderer.createHitImpact(effectX, effectY, damage, '#ff6644');
                    }
                }
            }
            
            // 🌍 화면 흔들림 (데미지 비례)
            if (typeof SpriteAnimation !== 'undefined') {
                SpriteAnimation.screenShake(intensity * 3, 0.1 + intensity * 0.02);
            }
            
            // 원래 위치 저장 (null 체크)
            const originalX = container.x || 0;
            const freezeTime = Math.min(0.04 + damage * 0.003, 0.12);  // 히트스탑
            
            // 🎬 피격 애니메이션 타임라인
            const tl = gsap.timeline();
            
            // 1️⃣ 순간 넉백 + 스쿼시
            tl.to(container, {
                x: originalX + knockbackX,
                duration: 0.03,
                ease: "power4.out"
            }, 0);
            
            tl.to(container.scale, {
                x: baseScale * 0.85,
                y: baseScale * 1.15,
                duration: 0.03,
                ease: "power4.out"
            }, 0);
            
            // 2️⃣ 히트스탑 (프리즈!)
            tl.to({}, { duration: freezeTime });
            
            // 3️⃣ 복귀 (탄성있게)
            tl.to(container, {
                x: originalX,
                duration: 0.25,
                ease: "elastic.out(1, 0.4)"
            });
            
            tl.to(container.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.2,
                ease: "elastic.out(1, 0.5)"
            }, "<");
            
            // 4️⃣ 숨쉬기 재개
            tl.add(() => {
                if (container.breathingTween) {
                    container.breathingTween.resume();
                }
            });
            
            // 🔴 빨간 플래시 (틴트) - 별도 처리
            if (sprite && sprite.tint !== undefined) {
                const flashTint = isCritical ? 0xff0000 : 0xff6666;
                const flashDuration = isCritical ? 150 : 100;
                
                // 흰색 -> 빨간색 -> 원래색
                sprite.tint = 0xffffff;
                gsap.delayedCall(0.02, () => {
                    if (sprite && sprite.tint !== undefined) sprite.tint = flashTint;
                });
                gsap.delayedCall(flashDuration / 1000, () => {
                    if (sprite && sprite.tint !== undefined) sprite.tint = 0xffffff;
                });
            }
        } catch (e) {
            console.warn('[EnemyRenderer] playHitAnimation error:', e);
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
    
    // ✅ 적 화면 좌표 조회 (타겟팅 라인용)
    getEnemyScreenPositions() {
        const positions = [];
        
        this.sprites.forEach((data, id) => {
            if (!data.container || !data.enemy) return;
            if (data.enemy.hp <= 0) return;
            
            // 글로벌 위치
            const globalPos = data.container.getGlobalPosition();
            
            // 스프라이트 크기 계산
            let width = 100, height = 200;
            if (data.sprite) {
                width = (data.sprite.width || 100) * data.container.scale.x;
                height = (data.sprite.height || 200) * data.container.scale.y;
            }
            
            positions.push({
                enemy: data.enemy,
                slotIndex: data.slotIndex,
                // 중심 좌표
                centerX: globalPos.x,
                centerY: globalPos.y - height / 2,  // 스프라이트 중앙
                // 바운딩 박스
                left: globalPos.x - width / 2,
                right: globalPos.x + width / 2,
                top: globalPos.y - height,
                bottom: globalPos.y,
                width: width,
                height: height
            });
        });
        
        // 슬롯 순서대로 정렬
        positions.sort((a, b) => a.slotIndex - b.slotIndex);
        
        return positions;
    },
    
    // ✅ 좌표로 적 찾기 (타겟팅용)
    getEnemyAtPosition(x, y) {
        const positions = this.getEnemyScreenPositions();
        
        for (const pos of positions) {
            if (x >= pos.left && x <= pos.right && y >= pos.top && y <= pos.bottom) {
                return {
                    enemy: pos.enemy,
                    centerX: pos.centerX,
                    centerY: pos.centerY,
                    ...pos
                };
            }
        }
        
        return null;
    },
    
    // ✅ 특정 적의 화면 좌표 반환 (이펙트 출력용)
    getEnemyPosition(enemy) {
        if (!enemy) return null;
        
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) return null;
        
        // 글로벌 위치
        const globalPos = data.container.getGlobalPosition();
        
        // 스프라이트 크기 계산
        let width = 100, height = 200;
        if (data.sprite) {
            width = (data.sprite.width || 100) * data.container.scale.x;
            height = (data.sprite.height || 200) * data.container.scale.y;
        }
        
        return {
            // 중심 좌표 (이펙트 출력용)
            centerX: globalPos.x,
            centerY: globalPos.y - height / 2,
            // 바운딩 박스
            left: globalPos.x - width / 2,
            right: globalPos.x + width / 2,
            top: globalPos.y - height,
            bottom: globalPos.y,
            width: width,
            height: height,
            // 추가 정보
            enemy: enemy,
            slotIndex: data.slotIndex
        };
    },
    
    // ✅ 인덱스로 적 좌표 반환 (DOM index 기반)
    getEnemyPositionByIndex(index) {
        if (!gameState || !gameState.enemies) return null;
        const enemy = gameState.enemies[index];
        if (!enemy) return null;
        return this.getEnemyPosition(enemy);
    },
    
    // ✅ DOM 요소에서 적 좌표 추출 (호환성용)
    getPositionFromElement(enemyEl) {
        if (!enemyEl) return null;
        
        // data-index에서 인덱스 추출
        const index = parseInt(enemyEl.dataset?.index);
        if (!isNaN(index)) {
            const pos = this.getEnemyPositionByIndex(index);
            if (pos) return pos;
        }
        
        // 폴백: DOM rect 사용
        const rect = enemyEl.getBoundingClientRect();
        return {
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
        };
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
            
            const enemyId = enemy.pixiId || enemy.id || enemy.name;
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
    async enable() {
        if (!this.initialized) {
            await this.init();
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
    /* 적 UI 오버레이 */
    #enemy-ui-overlay {
        font-family: 'DungGeunMo', monospace;
    }
    
    /* 상단 UI (인텐트 + 브레이크) */
    .enemy-ui-top {
        text-align: center;
    }
    
    /* 하단 UI (HP + 상태) */
    .enemy-ui-bottom {
        text-align: center;
    }
    
    /* HP 바 */
    .enemy-hp-bar.pixi-hp {
        width: 100px;
        height: 14px;
        background: #1a1a1a;
        border: 2px solid #444;
        border-radius: 3px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    .enemy-hp-bar .hp-fill {
        height: 100%;
        background: linear-gradient(to bottom, #e53e3e, #c53030);
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
        text-shadow: 1px 1px 2px #000;
    }
    
    /* 인텐트 */
    .pixi-intent {
        font-size: 24px;
        margin-bottom: 6px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.9));
    }
    
    .pixi-intent .intent-display {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background: rgba(0,0,0,0.7);
        border-radius: 8px;
        border: 2px solid transparent;
    }
    
    .pixi-intent .intent-icon {
        font-size: 1.4rem;
    }
    
    .pixi-intent .intent-value {
        font-size: 1.3rem;
        font-weight: bold;
        color: #fff;
    }
    
    .pixi-intent .intent-hits {
        font-size: 0.9rem;
        color: #ffd700;
        margin-left: 2px;
    }
    
    .pixi-intent .danger-icon {
        font-size: 1.2rem;
        animation: dangerPulse 0.5s ease-in-out infinite;
    }
    
    @keyframes dangerPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.2); }
    }
    
    .pixi-intent .intent-attack { 
        color: #ff6b6b;
        border-color: #ff4444;
    }
    .pixi-intent .intent-heavy { 
        color: #ff4444;
        border-color: #cc0000;
        background: rgba(255,0,0,0.2);
    }
    .pixi-intent .intent-multi { 
        border-color: #ff8844;
    }
    .pixi-intent .intent-defend { 
        color: #4299e1; 
        border-color: #4299e1;
    }
    .pixi-intent .intent-buff { 
        color: #48bb78; 
        border-color: #48bb78;
    }
    .pixi-intent .intent-debuff { 
        color: #9f7aea; 
        border-color: #9f7aea;
    }
    .pixi-intent .intent-heal { 
        color: #68d391; 
        border-color: #68d391;
    }
    .pixi-intent .intent-retreat { 
        color: #ed8936; 
        border-color: #ed8936;
    }
    .pixi-intent .intent-advance { 
        color: #f6e05e; 
        border-color: #f6e05e;
    }
    .pixi-intent .intent-special { 
        color: #ffd700; 
        border-color: #ffd700;
    }
    
    .pixi-intent .danger-intent {
        border-color: #ff0000 !important;
        background: rgba(255,0,0,0.3) !important;
        animation: dangerBorder 0.8s ease-in-out infinite;
    }
    
    @keyframes dangerBorder {
        0%, 100% { box-shadow: 0 0 5px #ff0000; }
        50% { box-shadow: 0 0 15px #ff0000, 0 0 25px #ff4444; }
    }
    
    /* 브레이크 상태 표시 */
    .pixi-intent .intent-broken {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(100,100,255,0.3);
        border-radius: 8px;
        border: 2px solid #6666ff;
        animation: brokenPulse 1s ease-in-out infinite;
    }
    
    .pixi-intent .broken-icon {
        font-size: 1.5rem;
        animation: spin 2s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .pixi-intent .broken-text {
        font-size: 1.2rem;
        font-weight: bold;
        color: #aaaaff;
        text-shadow: 0 0 10px #6666ff;
    }
    
    @keyframes brokenPulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }
    
    /* 브레이크 게이지 */
    .pixi-break {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
    }
    
    .pixi-break .break-recipe {
        display: flex;
        gap: 4px;
    }
    
    .pixi-break .recipe-icon {
        font-size: 1rem;
        opacity: 0.4;
        filter: grayscale(1);
        transition: all 0.2s ease;
    }
    
    .pixi-break .recipe-icon.completed {
        opacity: 1;
        filter: grayscale(0);
        transform: scale(1.1);
    }
    
    .pixi-break .break-gauge {
        width: 80px;
        height: 8px;
        background: #2d3748;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid #4a5568;
    }
    
    .pixi-break .break-fill {
        height: 100%;
        background: linear-gradient(to right, #f6ad55, #ed8936);
        transition: width 0.3s ease;
        box-shadow: 0 0 5px #f6ad55;
    }
    
    /* 쉴드 */
    .pixi-shield {
        font-size: 14px;
        color: #63b3ed;
        text-shadow: 0 0 5px rgba(99, 179, 237, 0.5);
    }
    
    /* 상태 효과 */
    .pixi-status {
        display: flex;
        gap: 4px;
        justify-content: center;
        flex-wrap: wrap;
        max-width: 120px;
    }
    
    .pixi-status .status-icon {
        font-size: 12px;
        background: rgba(0,0,0,0.6);
        padding: 2px 4px;
        border-radius: 3px;
    }
    
    /* 캔버스 컨테이너 */
    #enemy-canvas-container {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }
    
    #enemy-canvas-container canvas {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }
`;
document.head.appendChild(enemyRendererStyles);

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('[EnemyRenderer] DOMContentLoaded - 대기 중...');
    
    // 게임 전투 시작 시 초기화 (약간의 딜레이)
    setTimeout(() => {
        if (EnemyRenderer.enabled && !EnemyRenderer.initialized) {
            EnemyRenderer.init();
        }
    }, 500);
});

console.log('[EnemyRenderer] ✅ Script loaded (기본 활성화)');
