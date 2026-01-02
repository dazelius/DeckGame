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
    
    getSlotScale(slotIndex, enemy = null) {
        // 뒤로 갈수록 작아짐 (원근감)
        let scale = this.config.baseScale - (slotIndex * 0.05);
        
        // ✅ 보스/엘리트는 더 크게!
        if (enemy) {
            if (enemy.isBoss) {
                scale *= 1.4;  // 보스는 40% 크게
            } else if (enemy.isElite) {
                scale *= 1.2;  // 엘리트는 20% 크게
            }
        }
        
        return scale;
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
        console.log(`[EnemyRenderer] createEnemySprite: ${enemy.name}, slot ${slotIndex}`);
        
        // 적 컨테이너 (스프라이트 + 이펙트용)
        const enemyContainer = new PIXI.Container();
        enemyContainer.sortableChildren = true;
        enemyContainer.label = enemy.name;  // 디버깅용
        
        // 스프라이트 이미지 경로
        const spritePath = enemy.sprite || enemy.image || 'goblin.png';
        console.log(`[EnemyRenderer] 스프라이트 경로: ${spritePath}`);
        
        // 스프라이트 생성
        let sprite;
        try {
            sprite = PIXI.Sprite.from(spritePath);
            sprite.label = `${enemy.name}_sprite`;
            
            // 로드 완료 확인
            if (sprite.texture) {
                console.log(`[EnemyRenderer] ✅ 스프라이트 로드됨: ${spritePath}`);
            }
        } catch (e) {
            console.error(`[EnemyRenderer] ❌ 스프라이트 로드 실패: ${spritePath}`, e);
            // 폴백: 플레이스홀더 (PixiJS v8 Graphics API)
            const graphics = new PIXI.Graphics();
            graphics.rect(-50, -150, 100, 150);  // v8: rect() 사용
            graphics.fill(0x666666);
            sprite = graphics;
        }
        
        // 앵커 설정 (하단 중앙)
        if (sprite.anchor) {
            sprite.anchor.set(0.5, 1);
        }
        
        // 위치 및 스케일 (화면 높이 기준)
        const x = this.getSlotX(slotIndex);
        const appHeight = this.app?.renderer?.height || 600;
        const y = appHeight * 0.75;  // 화면 높이의 75% 위치
        const scale = this.getSlotScale(slotIndex, enemy);
        
        enemyContainer.x = x;
        enemyContainer.y = y;
        enemyContainer.scale.set(scale);
        enemyContainer.zIndex = this.getSlotZIndex(slotIndex);
        
        console.log(`[EnemyRenderer] 위치: x=${x}, y=${y}, scale=${scale}`);
        
        // ✅ 디버그: 빨간 박스로 위치 확인
        const debugBox = new PIXI.Graphics();
        debugBox.rect(-30, -100, 60, 100);
        debugBox.fill({ color: 0xff0000, alpha: 0.5 });
        enemyContainer.addChild(debugBox);
        console.log(`[EnemyRenderer] 디버그 박스 추가됨`);
        
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
    // UI 오버레이 (HP바, 인텐트, 브레이크 게이지 등)
    // ==========================================
    createEnemyUI(enemyId, enemy, slotIndex) {
        if (!this.uiOverlay) return;
        
        const uiEl = document.createElement('div');
        uiEl.className = 'enemy-ui-element';
        uiEl.dataset.enemyId = enemyId;
        uiEl.dataset.enemyIndex = slotIndex;
        uiEl.style.cssText = `
            position: absolute;
            pointer-events: auto;
            transform: translate(-50%, 0);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        `;
        
        // 인텐트 (맨 위)
        const intentEl = document.createElement('div');
        intentEl.className = 'enemy-intent pixi-intent';
        intentEl.innerHTML = this.getIntentHTML(enemy);
        uiEl.appendChild(intentEl);
        
        // 브레이크 게이지 (인텐트 아래)
        const breakGauge = document.createElement('div');
        breakGauge.className = 'break-gauge-container pixi-break';
        breakGauge.innerHTML = this.getBreakGaugeHTML(enemy);
        uiEl.appendChild(breakGauge);
        
        // HP 바
        const hpBar = document.createElement('div');
        hpBar.className = 'enemy-hp-bar pixi-hp';
        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
        hpBar.innerHTML = `
            <div class="hp-fill" style="width: ${hpPercent}%"></div>
            <span class="hp-text">${enemy.hp}/${enemy.maxHp}</span>
        `;
        uiEl.appendChild(hpBar);
        
        // 쉴드 표시
        if (enemy.shield && enemy.shield > 0) {
            const shieldEl = document.createElement('div');
            shieldEl.className = 'enemy-shield pixi-shield';
            shieldEl.innerHTML = `🛡️ ${enemy.shield}`;
            uiEl.appendChild(shieldEl);
        }
        
        // 상태 효과
        const statusEl = document.createElement('div');
        statusEl.className = 'enemy-status-effects pixi-status';
        statusEl.innerHTML = this.getStatusEffectsHTML(enemy);
        uiEl.appendChild(statusEl);
        
        this.uiOverlay.appendChild(uiEl);
        
        // 위치 동기화
        const data = this.sprites.get(enemyId);
        if (data) {
            data.uiElement = uiEl;
            this.syncEnemyUI(enemyId);
        }
    },
    
    // 인텐트 HTML 생성
    getIntentHTML(enemy) {
        if (!enemy.currentIntent) return '';
        
        const intent = enemy.currentIntent;
        let icon = '❓';
        let value = '';
        let className = 'intent-unknown';
        
        switch (intent.type) {
            case 'attack':
                icon = '⚔️';
                value = intent.value || '';
                className = 'intent-attack';
                break;
            case 'defend':
                icon = '🛡️';
                value = intent.value || '';
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
                value = intent.value || '';
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
        
        return `<span class="${className}">${icon}${value}</span>`;
    },
    
    // 브레이크 게이지 HTML
    getBreakGaugeHTML(enemy) {
        if (!enemy.breakGauge && enemy.breakGauge !== 0) return '';
        
        const maxBreak = enemy.maxBreakGauge || 100;
        const current = enemy.breakGauge || 0;
        const percent = Math.min(100, (current / maxBreak) * 100);
        
        return `
            <div class="break-gauge">
                <div class="break-fill" style="width: ${percent}%"></div>
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
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data && data.uiElement) {
            const intentEl = data.uiElement.querySelector('.pixi-intent');
            if (intentEl) {
                intentEl.innerHTML = this.getIntentHTML(enemy);
            }
        }
    },
    
    // 브레이크 게이지 업데이트
    updateEnemyBreak(enemy) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data && data.uiElement) {
            const breakEl = data.uiElement.querySelector('.pixi-break');
            if (breakEl) {
                breakEl.innerHTML = this.getBreakGaugeHTML(enemy);
            }
        }
    },
    
    // 쉴드 업데이트
    updateEnemyShield(enemy) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data && data.uiElement) {
            let shieldEl = data.uiElement.querySelector('.pixi-shield');
            
            if (enemy.shield && enemy.shield > 0) {
                if (!shieldEl) {
                    shieldEl = document.createElement('div');
                    shieldEl.className = 'enemy-shield pixi-shield';
                    data.uiElement.appendChild(shieldEl);
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
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (data && data.uiElement) {
            const statusEl = data.uiElement.querySelector('.pixi-status');
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
    
    // 선택 표시
    setEnemySelected(enemy, isSelected) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) return;
        
        if (isSelected) {
            // 선택 효과 - 네온 아웃라인 (PixiJS filter)
            if (PIXI.filters && PIXI.filters.GlowFilter) {
                data.container.filters = [new PIXI.filters.GlowFilter({
                    distance: 15,
                    outerStrength: 2,
                    innerStrength: 0,
                    color: 0x00ffff,
                    quality: 0.5
                })];
            } else {
                // 폴백: 스케일 업
                gsap.to(data.container.scale, {
                    x: this.getSlotScale(data.slotIndex) * 1.1,
                    y: this.getSlotScale(data.slotIndex) * 1.1,
                    duration: 0.15
                });
            }
        } else {
            data.container.filters = [];
            gsap.to(data.container.scale, {
                x: this.getSlotScale(data.slotIndex),
                y: this.getSlotScale(data.slotIndex),
                duration: 0.15
            });
        }
    },
    
    // 타겟 하이라이트 (카드 드래그 시)
    highlightAsTarget(enemy, isHighlighted) {
        const enemyId = enemy.id || enemy.name;
        const data = this.sprites.get(enemyId);
        
        if (!data || !data.container) return;
        
        if (isHighlighted) {
            // 붉은 네온 효과
            gsap.to(data.container, {
                pixi: { tint: 0xff6666 },
                duration: 0.2
            });
            gsap.to(data.container.scale, {
                x: this.getSlotScale(data.slotIndex) * 1.15,
                y: this.getSlotScale(data.slotIndex) * 1.15,
                duration: 0.2
            });
        } else {
            gsap.to(data.container, {
                pixi: { tint: 0xffffff },
                duration: 0.2
            });
            gsap.to(data.container.scale, {
                x: this.getSlotScale(data.slotIndex),
                y: this.getSlotScale(data.slotIndex),
                duration: 0.2
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
    
    .enemy-ui-element {
        text-align: center;
        min-width: 120px;
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
        font-size: 20px;
        margin-bottom: 4px;
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.8));
    }
    
    .pixi-intent .intent-attack { color: #ff6b6b; }
    .pixi-intent .intent-defend { color: #4299e1; }
    .pixi-intent .intent-buff { color: #48bb78; }
    .pixi-intent .intent-debuff { color: #9f7aea; }
    .pixi-intent .intent-heal { color: #68d391; }
    .pixi-intent .intent-retreat { color: #ed8936; }
    .pixi-intent .intent-advance { color: #f6e05e; }
    .pixi-intent .intent-special { color: #ffd700; }
    
    /* 브레이크 게이지 */
    .pixi-break .break-gauge {
        width: 80px;
        height: 6px;
        background: #2d3748;
        border-radius: 3px;
        overflow: hidden;
        border: 1px solid #4a5568;
    }
    
    .pixi-break .break-fill {
        height: 100%;
        background: linear-gradient(to right, #f6ad55, #ed8936);
        transition: width 0.2s ease;
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
