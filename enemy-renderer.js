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
        baseY: 100,            // 기본 Y 위치
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
                z-index: 9999;
                overflow: visible;
            `;
            
            const battleArena = document.querySelector('.battle-arena');
            if (battleArena) {
                // battle-arena가 position relative여야 함
                if (getComputedStyle(battleArena).position === 'static') {
                    battleArena.style.position = 'relative';
                }
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
        // 화면 중앙 기준으로 슬롯 배치 (오른쪽에 배치)
        const centerX = this.app ? this.app.renderer.width / 2 : 600;
        const totalSlots = Math.max(gameState?.enemies?.filter(e => e.hp > 0).length || 1, 1);
        const totalWidth = (totalSlots - 1) * this.config.slotSpacing;
        const startX = centerX - totalWidth / 2 + 220;  // 오른쪽으로 더 이동
        
        return startX + (slotIndex * this.config.slotSpacing);
    },
    
    getSlotY(slotIndex) {
        // ✅ 모든 적 같은 Y 위치
        const appHeight = this.app?.renderer?.height || 600;
        return appHeight * 0.58;  // 화면 높이의 58% 위치 (5% 위로)
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
        
        // 🌑 바닥 그림자 추가 (배경과 블렌딩)
        const shadow = this.createGroundShadow(sprite);
        if (shadow) {
            shadow.zIndex = -10;
            enemyContainer.addChild(shadow);
        }
        
        // 스프라이트를 컨테이너에 추가
        enemyContainer.addChild(sprite);
        
        // 인터랙션 설정
        enemyContainer.interactive = true;
        enemyContainer.buttonMode = true;
        enemyContainer.cursor = 'pointer';
        
        // 클릭 이벤트만 연결
        const enemyRef = enemy;
        enemyContainer.on('pointerdown', () => this.onEnemyClick(enemyRef));
        
        // ✅ 아웃라인 효과 (스프라이트 복제 방식)
        this.applyOutlineEffect(sprite, enemyContainer);
        
        // 🎨 환경광 블렌딩 (스프라이트 색조 보정)
        this.applyEnvironmentBlending(sprite);
        
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
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            z-index: 10000;
        `;
        
        // 인텐트 (핵심!)
        const intentEl = document.createElement('div');
        intentEl.className = 'enemy-intent pixi-intent';
        intentEl.innerHTML = this.getIntentHTML(enemy);
        topUI.appendChild(intentEl);
        
        // 브레이크 게이지 (인텐트 하단에 붙음)
        const breakGauge = document.createElement('div');
        breakGauge.className = 'break-gauge-container pixi-break';
        breakGauge.innerHTML = this.getBreakGaugeHTML(enemy);
        
        // 브레이크 가능한 인텐트가 있는지 확인
        const hasBreakable = typeof BreakSystem !== 'undefined' && 
                            BreakSystem.hasBreakableIntent && 
                            BreakSystem.hasBreakableIntent(enemy);
        if (!hasBreakable) {
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
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            z-index: 10000;
        `;
        
        // HP 바 (폴리싱된 디자인)
        const hpBar = document.createElement('div');
        hpBar.className = 'enemy-hp-bar pixi-hp';
        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
        hpBar.innerHTML = `
            <div class="hp-bg"></div>
            <div class="hp-fill" style="width: ${hpPercent}%;"></div>
            <span class="hp-text">${enemy.hp}/${enemy.maxHp}</span>
        `;
        bottomUI.appendChild(hpBar);
        
        // 쉴드 표시
        if (enemy.shield && enemy.shield > 0) {
            const shieldEl = document.createElement('div');
            shieldEl.className = 'enemy-shield pixi-shield';
            shieldEl.innerHTML = `🛡️ ${enemy.shield}`;
            bottomUI.appendChild(shieldEl);
        }
        
        // 상태 효과
        const statusEl = document.createElement('div');
        statusEl.className = 'enemy-status-effects pixi-status';
        statusEl.innerHTML = this.getStatusEffectsHTML(enemy);
        if (this.getStatusEffectsHTML(enemy)) {
            bottomUI.appendChild(statusEl);
        }
        
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
        
        // 위험 인텐트면 danger 클래스 추가
        const isDanger = dangerClass !== '';
        
        return `
            <div class="intent-inner ${className} ${isDanger ? 'danger' : ''}">
                <span class="intent-icon">${icon}</span>
                <span class="intent-value">${value}</span>
                ${hitsDisplay}
            </div>
        `;
    },
    
    // 브레이크 게이지 HTML (풍부한 UI 복원!)
    getBreakGaugeHTML(enemy) {
        // 브레이크 가능한 인텐트가 있는지 확인
        const hasBreakable = typeof BreakSystem !== 'undefined' && 
                            BreakSystem.hasBreakableIntent && 
                            BreakSystem.hasBreakableIntent(enemy);
        
        if (!hasBreakable) {
            return '';
        }
        
        // 레시피 진행 상황
        const recipe = enemy.currentBreakRecipe || [];
        const progress = enemy.breakProgress || [];
        const total = recipe.length;
        const current = progress.length;
        const percent = total > 0 ? (current / total) * 100 : 0;
        
        // 속성 아이콘 매핑
        const ElementIcons = {
            physical: '⚔️',
            fire: '🔥',
            ice: '❄️',
            lightning: '⚡',
            bleed: '🩸',
            poison: '☠️',
            magic: '✨',
            dark: '🌑'
        };
        
        // 레시피 아이콘 생성
        const recipeIcons = recipe.map((element, i) => {
            const icon = ElementIcons[element] || '❓';
            const isHit = i < current;
            const isCurrent = i === current;
            return `<span class="recipe-slot ${isHit ? 'hit' : ''} ${isCurrent ? 'current' : ''}">${icon}</span>`;
        }).join('');
        
        return `
            <div class="break-recipe-row">${recipeIcons}</div>
            <div class="break-gauge-bar">
                <div class="break-gauge-fill" style="width: ${percent}%"></div>
            </div>
        `;
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
        
        // ========================================
        // 캔버스 DOM 위치 보정 (PixiJS 좌표 → HTML 좌표)
        // ========================================
        let canvasOffsetX = 0;
        let canvasOffsetY = 0;
        
        // 캔버스의 실제 DOM 위치 가져오기
        const canvas = this.app?.canvas || this.app?.view;
        const overlay = this.uiOverlay;
        
        if (canvas && overlay) {
            const canvasRect = canvas.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            canvasOffsetX = canvasRect.left - overlayRect.left;
            canvasOffsetY = canvasRect.top - overlayRect.top;
        }
        
        // 스프라이트의 PixiJS 내부 좌표
        const pixiPos = data.container.getGlobalPosition();
        
        // HTML 오버레이 좌표로 변환
        const screenX = pixiPos.x + canvasOffsetX;
        const screenY = pixiPos.y + canvasOffsetY;
        
        // 스프라이트 실제 높이 계산 (컨테이너 스케일 적용)
        let spriteHeight = 150;
        if (data.sprite && data.sprite.texture && data.sprite.texture.valid) {
            // texture의 원본 높이 × 컨테이너 스케일
            const textureHeight = data.sprite.texture.height || 150;
            const containerScale = data.container.scale?.y || 1;
            spriteHeight = textureHeight * containerScale;
        }
        
        // ========================================
        // 인텐트: 스프라이트 머리 바로 위 (5px 간격)
        // ========================================
        if (data.topUI) {
            // 머리 위치 = 발 위치 - 스프라이트 높이
            const headY = screenY - spriteHeight;
            
            data.topUI.style.left = screenX + 'px';
            data.topUI.style.top = (headY - 5) + 'px';
            data.topUI.style.transform = 'translate(-50%, -100%)';
            data.topUI.style.display = 'flex';
            data.topUI.style.visibility = 'visible';
            data.topUI.style.opacity = '1';
        }
        
        // ========================================
        // HP바: 스프라이트 발 바로 아래 (5px 간격)
        // ========================================
        if (data.bottomUI) {
            data.bottomUI.style.left = screenX + 'px';
            data.bottomUI.style.top = (screenY + 5) + 'px';
            data.bottomUI.style.transform = 'translateX(-50%)';
            data.bottomUI.style.display = 'flex';
            data.bottomUI.style.visibility = 'visible';
            data.bottomUI.style.opacity = '1';
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
    // 스턴 이펙트 저장소
    stunEffects: new Map(),
    
    setEnemyBrokenState(enemy, isBroken) {
        if (!enemy) return;
        
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) return;
        
        const container = data.container;
        const sprite = data.sprite;
        const baseScale = container.breathingBaseScale || this.getSlotScale(data.slotIndex);
        
        try {
            if (isBroken) {
                // 브레이크 상태: 스턴 효과
                if (sprite && sprite.tint !== undefined) {
                    sprite.tint = 0x8888ff;  // 파란 빛 (더 강하게)
                }
                
                // ✅ 모든 숨쉬기 애니메이션 완전 정지
                if (container.breathingTween) {
                    container.breathingTween.pause();
                }
                if (container.breathingTimelines) {
                    container.breathingTimelines.forEach(tl => {
                        if (tl && tl.pause) tl.pause();
                    });
                }
                if (container.breathingInterval) {
                    clearInterval(container.breathingInterval);
                }
                
                // 기존 GSAP 트윈 정리
                gsap.killTweensOf(container);
                gsap.killTweensOf(container.scale);
                
                // ✅ 부들부들 떨림 애니메이션 (더 강하게!)
                if (typeof gsap !== 'undefined') {
                    // X축 떨림
                    container._stunTweenX = gsap.to(container, {
                        x: container.x + 3,
                        duration: 0.04,
                        yoyo: true,
                        repeat: -1,
                        ease: 'none'
                    });
                    
                    // 회전 떨림
                    container._stunTweenRot = gsap.to(container, {
                        rotation: 0.03,
                        duration: 0.06,
                        yoyo: true,
                        repeat: -1,
                        ease: 'sine.inOut'
                    });
                    
                    // 스케일 떨림 (찌그러짐)
                    container._stunTweenScale = gsap.to(container.scale, {
                        x: baseScale * 0.97,
                        y: baseScale * 1.03,
                        duration: 0.08,
                        yoyo: true,
                        repeat: -1,
                        ease: 'sine.inOut'
                    });
                }
                
                // 🌟 스턴 별 이펙트 시작!
                this.startStunEffect(enemy);
                
                console.log('[EnemyRenderer] 🔥 브레이크 상태 설정:', enemyId);
            } else {
                // 브레이크 해제
                if (sprite && sprite.tint !== undefined) {
                    sprite.tint = 0xffffff;  // 원래 색상
                }
                
                // ✅ 떨림 트윈 정지
                if (container._stunTweenX) {
                    container._stunTweenX.kill();
                    container._stunTweenX = null;
                }
                if (container._stunTweenRot) {
                    container._stunTweenRot.kill();
                    container._stunTweenRot = null;
                }
                if (container._stunTweenScale) {
                    container._stunTweenScale.kill();
                    container._stunTweenScale = null;
                }
                
                // 원래 상태 복원
                if (container.breathingBaseRotation !== undefined) {
                    container.rotation = container.breathingBaseRotation;
                } else {
                    container.rotation = 0;
                }
                if (container.breathingBaseX !== undefined) {
                    container.x = container.breathingBaseX;
                }
                if (container.scale && baseScale) {
                    container.scale.set(baseScale);
                }
                
                // ✅ 숨쉬기 애니메이션 재개
                if (container.breathingTween) {
                    container.breathingTween.resume();
                }
                if (container.breathingTimelines) {
                    container.breathingTimelines.forEach(tl => {
                        if (tl && tl.resume) tl.resume();
                    });
                }
                
                // 🌟 스턴 별 이펙트 중지
                this.stopStunEffect(enemy);
                
                console.log('[EnemyRenderer] ✅ 브레이크 해제:', enemyId);
            }
        } catch (e) {
            console.warn('[EnemyRenderer] setEnemyBrokenState error:', e);
        }
    },
    
    // ==========================================
    // 🌟 스턴 별 이펙트 (PixiJS) - 더 화려하게!
    // ==========================================
    startStunEffect(enemy) {
        if (!this.app || !this.container) return;
        
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        if (!data || !data.container) return;
        
        // 이미 있으면 제거
        this.stopStunEffect(enemy);
        
        // 스턴 이펙트 컨테이너
        const stunContainer = new PIXI.Container();
        stunContainer.label = 'StunEffect';
        stunContainer.zIndex = 1000;  // 맨 위에
        data.container.addChild(stunContainer);
        
        // 스프라이트 높이 계산
        let spriteHeight = 150;
        if (data.sprite && data.sprite.texture && data.sprite.texture.valid) {
            spriteHeight = data.sprite.texture.height;
        }
        
        // 별 위치 (머리 위) - 더 위로
        stunContainer.y = -spriteHeight - 40;
        
        // 별 6개 생성 (더 크고 화려하게!)
        const starCount = 6;
        const stars = [];
        const radius = 35;  // 더 넓게
        
        for (let i = 0; i < starCount; i++) {
            const star = new PIXI.Graphics();
            
            // 별 모양 그리기 (더 크게!)
            const points = [];
            const outerR = 12;  // 바깥 반지름
            const innerR = 5;   // 안쪽 반지름
            for (let j = 0; j < 10; j++) {
                const r = j % 2 === 0 ? outerR : innerR;
                const a = (Math.PI * 2 / 10) * j - Math.PI / 2;
                points.push(Math.cos(a) * r, Math.sin(a) * r);
            }
            star.poly(points);
            star.fill({ color: 0xffdd00 });  // 더 밝은 노랑
            star.stroke({ width: 2, color: 0xffffff });
            
            const angle = (Math.PI * 2 / starCount) * i;
            star.x = Math.cos(angle) * radius;
            star.y = Math.sin(angle) * radius;
            star._baseAngle = angle;
            star._pulseOffset = Math.random() * Math.PI * 2;  // 각각 다른 펄스
            
            stunContainer.addChild(star);
            stars.push(star);
        }
        
        // 중앙 글로우 효과
        const glow = new PIXI.Graphics();
        glow.circle(0, 0, 20);
        glow.fill({ color: 0xffff00, alpha: 0.3 });
        stunContainer.addChildAt(glow, 0);
        
        // 회전 애니메이션 (더 빠르게!)
        let time = 0;
        const animate = () => {
            if (!stunContainer.parent) return; // 제거됨
            
            time += 0.05;  // 더 빠르게
            
            // 전체 회전
            stunContainer.rotation = time * 0.8;
            
            // 각 별 위치 + 펄스 효과
            stars.forEach((star, i) => {
                const newAngle = star._baseAngle + time;
                // 반지름도 펄스
                const pulseRadius = radius + Math.sin(time * 3 + star._pulseOffset) * 5;
                star.x = Math.cos(newAngle) * pulseRadius;
                star.y = Math.sin(newAngle) * pulseRadius;
                star.rotation = -time * 2;
                
                // 스케일 펄스 (반짝반짝)
                const scalePulse = 0.8 + Math.sin(time * 4 + star._pulseOffset) * 0.3;
                star.scale.set(scalePulse);
                
                // 알파 펄스
                star.alpha = 0.7 + Math.sin(time * 5 + star._pulseOffset) * 0.3;
            });
            
            // 중앙 글로우 펄스
            const glowScale = 0.8 + Math.sin(time * 3) * 0.4;
            glow.scale.set(glowScale);
            glow.alpha = 0.2 + Math.sin(time * 4) * 0.2;
            
            stunContainer._animFrame = requestAnimationFrame(animate);
        };
        
        stunContainer._animFrame = requestAnimationFrame(animate);
        
        // 저장
        this.stunEffects.set(enemyId, stunContainer);
        
        console.log('[EnemyRenderer] 🌟 스턴 별 이펙트 시작:', enemyId);
    },
    
    stopStunEffect(enemy) {
        if (!enemy) return;
        
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const stunContainer = this.stunEffects.get(enemyId);
        
        if (stunContainer) {
            // 애니메이션 중지
            if (stunContainer._animFrame) {
                cancelAnimationFrame(stunContainer._animFrame);
            }
            
            // 컨테이너 제거
            if (stunContainer.parent) {
                stunContainer.parent.removeChild(stunContainer);
            }
            stunContainer.destroy({ children: true });
            
            this.stunEffects.delete(enemyId);
            console.log('[EnemyRenderer] 스턴 별 이펙트 중지:', enemyId);
        }
    },
    
    // ==========================================
    // 💥 브레이크 폭발 이펙트
    // ==========================================
    playBreakEffect(enemy) {
        if (!this.app || !this.container) return;
        
        const enemyId = enemy.pixiId || enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        if (!data || !data.container) return;
        
        const globalPos = data.container.getGlobalPosition();
        
        // 스프라이트 높이
        let spriteHeight = 150;
        if (data.sprite && data.sprite.texture && data.sprite.texture.valid) {
            spriteHeight = data.sprite.texture.height * (data.container.scale?.y || 1);
        }
        
        const centerX = globalPos.x;
        const centerY = globalPos.y - spriteHeight / 2;
        
        // PixiRenderer의 이펙트 사용
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            // 스턴 폭발 이펙트
            if (PixiRenderer.createStunEffect) {
                PixiRenderer.createStunEffect(centerX, centerY - 20);
            }
            
            // 충격파
            if (PixiRenderer.createShockwave) {
                PixiRenderer.createShockwave(centerX, centerY, '#ffcc00');
            }
            
            // 스파크
            if (typeof VFX !== 'undefined' && VFX.sparks) {
                VFX.sparks(centerX, centerY, { color: '#ffcc00', count: 30, speed: 15 });
                VFX.sparks(centerX, centerY, { color: '#ffffff', count: 20, speed: 10 });
            }
        }
        
        // 화면 플래시
        this.createBreakFlash();
        
        console.log('[EnemyRenderer] 브레이크 폭발 이펙트:', enemyId);
    },
    
    createBreakFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, rgba(255, 200, 50, 0.5), transparent 70%);
            z-index: 99999;
            pointer-events: none;
        `;
        document.body.appendChild(flash);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(flash, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => flash.remove()
            });
        } else {
            setTimeout(() => flash.remove(), 300);
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
    
    // ==========================================
    // 🌑 바닥 그림자 생성 (3D 배경과 블렌딩)
    // ==========================================
    createGroundShadow(sprite) {
        if (!sprite || !sprite.texture) return null;
        
        try {
            const shadowGraphics = new PIXI.Graphics();
            
            // 스프라이트 크기에 맞는 타원형 그림자
            const spriteWidth = sprite.texture.width || 100;
            const shadowWidth = spriteWidth * 0.8;
            const shadowHeight = shadowWidth * 0.25;  // 납작한 타원
            
            // 그라데이션 효과를 위해 여러 겹 그리기
            const layers = 5;
            for (let i = layers; i >= 0; i--) {
                const ratio = i / layers;
                const alpha = 0.15 * (1 - ratio * 0.7);
                const w = shadowWidth * (1 + ratio * 0.3);
                const h = shadowHeight * (1 + ratio * 0.3);
                
                shadowGraphics.ellipse(0, 0, w, h);
                shadowGraphics.fill({ 
                    color: 0x000000, 
                    alpha: alpha 
                });
            }
            
            // 그림자 위치 (스프라이트 발 아래)
            shadowGraphics.y = -5;  // 발 바로 아래
            shadowGraphics.alpha = 0.6;
            
            return shadowGraphics;
        } catch (e) {
            console.warn('[EnemyRenderer] 그림자 생성 실패:', e);
            return null;
        }
    },
    
    // ==========================================
    // 🎨 환경광 블렌딩 (스프라이트 색조 보정)
    // ==========================================
    applyEnvironmentBlending(sprite) {
        if (!sprite) return;
        
        try {
            // ColorMatrixFilter로 색조 보정
            if (typeof PIXI !== 'undefined' && PIXI.ColorMatrixFilter) {
                const colorMatrix = new PIXI.ColorMatrixFilter();
                
                // 던전 분위기에 맞게 약간 어둡고 푸른 빛
                colorMatrix.brightness(0.95, false);    // 약간 어둡게
                colorMatrix.saturate(-0.08, false);     // 채도 약간 낮춤
                
                // 기존 필터에 추가
                sprite.filters = sprite.filters || [];
                sprite.filters.push(colorMatrix);
                
                // 환경광 색조 저장 (나중에 변경 가능)
                sprite._envFilter = colorMatrix;
            }
        } catch (e) {
            // 필터 지원 안되면 패스
            console.log('[EnemyRenderer] 환경광 필터 미지원');
        }
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
    
    // ✅ 자연스러운 숨쉬기 애니메이션 (심플하고 우아하게)
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
        const baseY = container.y;
        const baseX = container.x;
        const baseRotation = container.rotation || 0;
        
        // 호흡 주기 (각 적마다 약간 다르게)
        const breathDuration = 1.3 + Math.random() * 0.3;  // 1.3~1.6초
        
        // ========================================
        // 단일 호흡 애니메이션 (심플하게!)
        // ========================================
        const breathTl = gsap.timeline({ 
            repeat: -1, 
            yoyo: true,
            delay: delay,
            defaults: { ease: "sine.inOut" }
        });
        
        // 들숨: 살짝 늘어나면서 위로 (미세하게!)
        breathTl.to(container.scale, {
            y: baseScale * 1.02,    // Y 2% 늘어남
            x: baseScale * 0.99,    // X 1% 줄어듦
            duration: breathDuration
        }, 0);
        
        breathTl.to(container, {
            y: baseY - 3,           // 위로 3px만
            duration: breathDuration
        }, 0);
        
        // 참조 저장 (심플하게)
        container.breathingTween = breathTl;
        container.breathingTimelines = [breathTl];
        container.breathingInterval = null;
        container.breathingBaseScale = baseScale;
        container.breathingBaseY = baseY;
        container.breathingBaseX = baseX;
        container.breathingBaseRotation = baseRotation;
    },
    
    // 숨쉬기 애니메이션 중지
    stopBreathingAnimation(container) {
        if (!container) return;
        
        // 마스터 타임라인 중지
        if (container.breathingTween) {
            container.breathingTween.kill();
            container.breathingTween = null;
        }
        
        // 개별 타임라인 중지
        if (container.breathingTimelines) {
            container.breathingTimelines.forEach(tl => {
                if (tl) tl.kill();
            });
            container.breathingTimelines = null;
        }
        
        // 인터벌 중지
        if (container.breathingInterval) {
            clearInterval(container.breathingInterval);
            container.breathingInterval = null;
        }
        
        // 원래 상태로 복원
        try {
            if (container.scale && container.breathingBaseScale) {
                container.scale.set(container.breathingBaseScale);
            }
            if (container.breathingBaseY !== undefined) {
                container.y = container.breathingBaseY;
            }
            if (container.breathingBaseRotation !== undefined) {
                container.rotation = container.breathingBaseRotation;
            }
            if (container.breathingBaseX !== undefined) {
                container.x = container.breathingBaseX;
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
                
                // 🩸 모탈컴뱃 스타일 피 튀김! (데미지 비례)
                this.spawnBloodEffect(effectX, effectY, damage, isCritical, knockbackX);
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
    // 🩸 모탈컴뱃 스타일 피 튀김 효과
    // ==========================================
    spawnBloodEffect(x, y, damage, isCritical = false, knockbackDir = 1) {
        // GoreVFX 사용 가능하면
        if (typeof GoreVFX !== 'undefined') {
            // 기본 피 튀김 (데미지 비례)
            const bloodCount = Math.min(15 + damage * 2, 60);
            const bloodSpeed = 200 + damage * 15;
            const bloodSize = 4 + damage * 0.3;
            
            // 메인 피 튀김 (공격 방향으로)
            GoreVFX.bloodSplatter(x, y, {
                count: bloodCount,
                speed: bloodSpeed,
                size: bloodSize,
                duration: 800 + damage * 30,
                color: '#8b0000'
            });
            
            // 크리티컬이면 더 많이!
            if (isCritical) {
                // 큰 피 방울
                GoreVFX.bloodSplatter(x, y, {
                    count: 40,
                    speed: 500,
                    size: 12,
                    duration: 1200,
                    color: '#dc143c'
                });
                
                // 피 슬래시 이펙트
                GoreVFX.bloodSlash(x, y, {
                    angle: -30 + Math.random() * 60,
                    length: 120 + damage * 3,
                    width: 15,
                    duration: 300
                });
                
                // 피 충격파
                GoreVFX.bloodImpact(x, y, {
                    size: 80 + damage * 2,
                    duration: 350
                });
            } else if (damage >= 10) {
                // 강한 공격이면 추가 이펙트
                GoreVFX.bloodSplatter(x + knockbackDir * 20, y - 20, {
                    count: 20,
                    speed: 300,
                    size: 6,
                    duration: 600,
                    color: '#b22222'
                });
            }
            
            return;
        }
        
        // GoreVFX 없으면 VFX 사용
        if (typeof VFX !== 'undefined' && VFX.sparks) {
            const count = Math.min(10 + damage, 40);
            VFX.sparks(x, y, { 
                color: '#cc0000', 
                count: count,
                speed: 8 + damage * 0.5
            });
            
            if (isCritical || damage >= 12) {
                VFX.sparks(x, y, { color: '#ff4444', count: 20, speed: 12 });
            }
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
    
    /* ========================================
       HP 바 (폴리싱된 디자인)
       ======================================== */
    .enemy-hp-bar.pixi-hp {
        width: 90px;
        height: 12px;
        position: relative;
        border-radius: 6px;
        overflow: hidden;
        background: transparent;
    }
    
    .enemy-hp-bar .hp-bg {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%);
        border: 1px solid #333;
        border-radius: 6px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.5);
    }
    
    .enemy-hp-bar .hp-fill {
        position: absolute;
        top: 1px; left: 1px; bottom: 1px;
        background: linear-gradient(to bottom, #ef4444 0%, #b91c1c 50%, #991b1b 100%);
        border-radius: 5px;
        transition: width 0.3s ease;
        box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
    }
    
    .enemy-hp-bar .hp-text {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.5);
        z-index: 2;
        letter-spacing: 0.5px;
        text-shadow: 1px 1px 2px #000;
    }
    
    /* ========================================
       🔥 다크소울 스타일 인텐트
       ======================================== */
    .pixi-intent {
        filter: drop-shadow(0 3px 8px rgba(0,0,0,1));
    }
    
    /* 일반 인텐트 박스 - 다크소울 스타일 */
    .pixi-intent .intent-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 14px;
        background: linear-gradient(180deg, 
            rgba(35, 30, 25, 0.97) 0%, 
            rgba(20, 18, 15, 0.99) 50%,
            rgba(10, 8, 5, 1) 100%);
        border: 2px solid;
        border-image: linear-gradient(180deg, 
            rgba(180, 150, 100, 0.9) 0%, 
            rgba(120, 90, 50, 0.7) 50%,
            rgba(60, 45, 25, 0.5) 100%) 1;
        font-family: 'Cinzel', 'Times New Roman', serif;
        font-size: 1rem;
        color: #d4c4a8;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 1);
        box-shadow: 
            0 4px 12px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(180, 150, 100, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.5);
        position: relative;
    }
    
    /* 인텐트 코너 장식 */
    .pixi-intent .intent-inner::before,
    .pixi-intent .intent-inner::after {
        content: '◆';
        position: absolute;
        font-size: 6px;
        color: rgba(180, 150, 100, 0.6);
        text-shadow: 0 0 4px rgba(180, 150, 100, 0.4);
    }
    .pixi-intent .intent-inner::before { top: -1px; left: 4px; }
    .pixi-intent .intent-inner::after { top: -1px; right: 4px; }
    
    .pixi-intent .intent-icon {
        font-size: 1.3rem;
        filter: drop-shadow(0 0 3px currentColor);
    }
    
    .pixi-intent .intent-value {
        font-size: 1.2rem;
        font-weight: bold;
        color: #e8dcc8;
        font-family: 'Cinzel', serif;
        letter-spacing: 1px;
    }
    
    .pixi-intent .intent-hits {
        font-size: 0.8rem;
        color: #c9a227;
        font-weight: bold;
        text-shadow: 0 0 6px rgba(201, 162, 39, 0.5);
    }
    
    /* 🔥 위험 인텐트 (브레이크 가능) - 어둠의 화염 */
    .pixi-intent .intent-inner.danger {
        background: linear-gradient(180deg, 
            rgba(80, 20, 15, 0.98) 0%, 
            rgba(50, 10, 5, 0.99) 50%,
            rgba(25, 5, 0, 1) 100%);
        border: 2px solid;
        border-image: linear-gradient(180deg, 
            rgba(255, 100, 50, 0.9) 0%, 
            rgba(180, 50, 20, 0.8) 50%,
            rgba(100, 30, 10, 0.6) 100%) 1;
        color: #ffccaa;
        animation: darkSoulsDanger 2s ease-in-out infinite;
    }
    
    .pixi-intent .intent-inner.danger::before,
    .pixi-intent .intent-inner.danger::after {
        color: rgba(255, 100, 50, 0.8);
        animation: emberGlow 1.5s ease-in-out infinite;
    }
    
    @keyframes darkSoulsDanger {
        0%, 100% { 
            box-shadow: 
                0 4px 12px rgba(0,0,0,0.9),
                0 0 15px rgba(180, 50, 20, 0.4),
                inset 0 0 20px rgba(100, 30, 10, 0.3);
        }
        50% { 
            box-shadow: 
                0 4px 12px rgba(0,0,0,0.9),
                0 0 25px rgba(255, 80, 30, 0.6),
                inset 0 0 30px rgba(150, 50, 20, 0.4);
        }
    }
    
    @keyframes emberGlow {
        0%, 100% { opacity: 0.6; text-shadow: 0 0 4px rgba(255, 100, 50, 0.4); }
        50% { opacity: 1; text-shadow: 0 0 8px rgba(255, 100, 50, 0.8); }
    }
    
    /* 인텐트 타입별 아이콘 색상 - 다크소울 팔레트 */
    .pixi-intent .intent-attack .intent-icon { color: #cc4444; }
    .pixi-intent .intent-defend .intent-icon { color: #7799bb; }
    .pixi-intent .intent-buff .intent-icon { color: #88aa66; }
    .pixi-intent .intent-debuff .intent-icon { color: #9966aa; }
    .pixi-intent .intent-heal .intent-icon { color: #66aa88; }
    .pixi-intent .intent-retreat .intent-icon { color: #aa7744; }
    .pixi-intent .intent-advance .intent-icon { color: #bbaa44; }
    .pixi-intent .intent-special .intent-icon { color: #c9a227; }
    
    /* ⚡ 브레이크 상태 표시 - 다크소울 스턴 */
    .pixi-intent .intent-broken {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        background: linear-gradient(180deg, 
            rgba(60, 50, 35, 0.98) 0%, 
            rgba(35, 30, 20, 0.99) 50%,
            rgba(15, 12, 8, 1) 100%);
        border: 2px solid;
        border-image: linear-gradient(180deg, 
            rgba(200, 170, 80, 0.9) 0%, 
            rgba(150, 120, 50, 0.7) 50%,
            rgba(80, 60, 30, 0.5) 100%) 1;
        animation: soulsBroken 1.5s ease-in-out infinite;
        box-shadow: 
            0 4px 12px rgba(0,0,0,0.9),
            0 0 20px rgba(200, 170, 80, 0.3);
        font-family: 'Cinzel', serif;
    }
    
    .pixi-intent .broken-icon {
        font-size: 1.4rem;
        color: #c9a227;
        animation: brokenSpin 3s linear infinite;
        filter: drop-shadow(0 0 6px rgba(200, 170, 80, 0.6));
    }
    
    @keyframes brokenSpin {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(10deg); }
        50% { transform: rotate(0deg); }
        75% { transform: rotate(-10deg); }
        100% { transform: rotate(0deg); }
    }
    
    .pixi-intent .broken-text {
        font-size: 1.1rem;
        font-weight: bold;
        color: #c9a227;
        text-shadow: 
            0 0 10px rgba(200, 170, 80, 0.8),
            0 2px 4px rgba(0, 0, 0, 1);
        letter-spacing: 3px;
        text-transform: uppercase;
    }
    
    @keyframes soulsBroken {
        0%, 100% { 
            box-shadow: 
                0 4px 12px rgba(0,0,0,0.9),
                0 0 15px rgba(200, 170, 80, 0.2);
        }
        50% { 
            box-shadow: 
                0 4px 12px rgba(0,0,0,0.9),
                0 0 30px rgba(200, 170, 80, 0.5),
                0 0 50px rgba(200, 170, 80, 0.2);
        }
    }
    
    /* ========================================
       브레이크 게이지 (인텐트 하단에 붙음)
       ======================================== */
    /* ========================================
       🔥 다크소울 스타일 브레이크 게이지
       ======================================== */
    .pixi-break {
        width: 100%;
        margin-top: 3px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
    }
    
    /* 레시피 아이콘 행 - 고대 룬 스타일 */
    .pixi-break .break-recipe-row {
        display: flex;
        gap: 4px;
        justify-content: center;
        padding: 4px 8px;
        background: linear-gradient(180deg, 
            rgba(30, 25, 18, 0.97) 0%, 
            rgba(18, 15, 10, 0.99) 100%);
        border: 1px solid rgba(150, 120, 70, 0.5);
        box-shadow: 
            0 3px 10px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(150, 120, 70, 0.15);
    }
    
    .pixi-break .recipe-slot {
        font-size: 14px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 8, 5, 0.9);
        border: 1px solid rgba(80, 65, 40, 0.6);
        opacity: 0.4;
        filter: grayscale(0.9) brightness(0.6);
        transition: all 0.3s ease;
        position: relative;
    }
    
    /* 슬롯 장식 */
    .pixi-break .recipe-slot::before {
        content: '';
        position: absolute;
        inset: 2px;
        border: 1px solid rgba(150, 120, 70, 0.2);
    }
    
    .pixi-break .recipe-slot.hit {
        opacity: 1;
        filter: grayscale(0) brightness(1.3);
        border-color: rgba(200, 170, 80, 0.9);
        background: rgba(40, 35, 20, 0.9);
        box-shadow: 
            0 0 12px rgba(200, 170, 80, 0.6),
            inset 0 0 8px rgba(200, 170, 80, 0.3);
        animation: runeActivate 0.4s ease-out;
    }
    
    .pixi-break .recipe-slot.current {
        opacity: 0.9;
        filter: grayscale(0) brightness(1.1);
        border-color: rgba(180, 140, 60, 0.8);
        animation: runePulse 1.5s ease-in-out infinite;
    }
    
    @keyframes runeActivate {
        0% { transform: scale(1.3); box-shadow: 0 0 25px rgba(200, 170, 80, 1); }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); }
    }
    
    @keyframes runePulse {
        0%, 100% { 
            box-shadow: 0 0 5px rgba(180, 140, 60, 0.3);
            border-color: rgba(180, 140, 60, 0.5);
        }
        50% { 
            box-shadow: 0 0 15px rgba(180, 140, 60, 0.6);
            border-color: rgba(200, 170, 80, 0.8);
        }
    }
    
    /* 브레이크 게이지 바 - 에스투스 스타일 */
    .pixi-break .break-gauge-bar {
        position: relative;
        width: 100%;
        height: 5px;
        background: rgba(10, 8, 5, 0.95);
        overflow: hidden;
        border: 1px solid rgba(100, 80, 50, 0.5);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
    }
    
    .pixi-break .break-gauge-fill {
        height: 100%;
        background: linear-gradient(90deg, 
            rgba(180, 100, 20, 0.9) 0%, 
            rgba(220, 150, 50, 1) 50%, 
            rgba(180, 100, 20, 0.9) 100%);
        transition: width 0.3s ease;
        box-shadow: 0 0 8px rgba(200, 130, 40, 0.8);
        animation: estusGlow 2s ease-in-out infinite;
    }
    
    @keyframes estusGlow {
        0%, 100% { 
            box-shadow: 0 0 5px rgba(200, 130, 40, 0.6);
            filter: brightness(1);
        }
        50% { 
            box-shadow: 0 0 12px rgba(220, 150, 50, 0.9);
            filter: brightness(1.2);
        }
    }
    
    /* ========================================
       🛡️ 다크소울 스타일 쉴드
       ======================================== */
    .pixi-shield {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        font-weight: bold;
        font-family: 'Cinzel', serif;
        color: #8bb8d0;
        text-shadow: 0 1px 3px rgba(0,0,0,0.9);
        padding: 3px 8px;
        background: linear-gradient(180deg, 
            rgba(40, 50, 60, 0.9) 0%, 
            rgba(25, 35, 45, 0.95) 100%);
        border: 1px solid rgba(100, 130, 160, 0.5);
        box-shadow: 
            0 2px 6px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(150, 180, 200, 0.15);
    }
    
    /* ========================================
       ☠️ 다크소울 스타일 상태 효과
       ======================================== */
    .pixi-status {
        display: flex;
        gap: 4px;
        justify-content: center;
        flex-wrap: wrap;
        max-width: 110px;
    }
    
    .pixi-status .status-icon {
        font-size: 11px;
        background: linear-gradient(180deg, 
            rgba(30, 25, 20, 0.95) 0%, 
            rgba(15, 12, 8, 0.98) 100%);
        padding: 3px 5px;
        border: 1px solid rgba(100, 80, 50, 0.5);
        box-shadow: 0 2px 4px rgba(0,0,0,0.6);
        transition: all 0.2s ease;
    }
    
    .pixi-status .status-icon:hover {
        border-color: rgba(150, 120, 70, 0.7);
        box-shadow: 0 0 8px rgba(150, 120, 70, 0.4);
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
    
    /* ========================================
       🎬 CRT/레트로 블렌딩 효과
       ======================================== */
    
    /* 스캔라인 오버레이 */
    #enemy-canvas-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
        );
        z-index: 10;
        mix-blend-mode: multiply;
    }
    
    /* 비네팅 효과 (가장자리 어둡게) */
    #enemy-canvas-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        background: radial-gradient(
            ellipse at center,
            transparent 40%,
            rgba(0, 0, 0, 0.15) 100%
        );
        z-index: 9;
    }
    
    /* 스프라이트 부드러운 블렌딩을 위한 필터 */
    #enemy-canvas-container canvas {
        filter: 
            contrast(1.05)
            saturate(0.95)
            drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5));
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
