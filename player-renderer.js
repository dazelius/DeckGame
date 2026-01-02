// ==========================================
// PixiJS 기반 플레이어 렌더링 시스템
// enemy-renderer.js와 동일한 좌표 시스템 사용
// ==========================================

const PlayerRenderer = {
    // PixiJS 컨테이너
    app: null,
    container: null,
    
    // 스프라이트 데이터
    sprite: null,
    playerContainer: null,
    
    // UI 오버레이
    uiOverlay: null,
    topUI: null,
    bottomUI: null,
    
    // 설정
    config: {
        baseY: 100,
        baseScale: 1.0,        // 플레이어는 적보다 크게! (적: 0.7)
        positionX: 0.25,       // 화면 왼쪽 25% 위치
        
        // ✅ 3D 바닥면 연동 설정
        floor3D: {
            enabled: true,           // 3D 연동 활성화
            parallaxStrength: 15,    // 패럴랙스 강도 (플레이어는 앞에 있으므로 약하게)
            floorY: 0.62,            // 3D 바닥면 Y 위치 (적과 동일)
        }
    },
    
    // 3D 패럴랙스 상태
    parallax: {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
    },
    
    // 상태
    initialized: false,
    enabled: true,
    
    // ==========================================
    // 초기화
    // ==========================================
    async init() {
        if (this.initialized) return true;
        
        // PixiJS 확인
        if (typeof PIXI === 'undefined') {
            console.warn('[PlayerRenderer] PixiJS not found');
            return false;
        }
        
        console.log('[PlayerRenderer] 초기화 시작...');
        
        // EnemyRenderer의 앱 공유 (권장)
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.app) {
            this.app = EnemyRenderer.app;
            console.log('[PlayerRenderer] ✅ EnemyRenderer.app 공유');
        } else if (typeof PixiRenderer !== 'undefined' && PixiRenderer.app) {
            this.app = PixiRenderer.app;
            console.log('[PlayerRenderer] ✅ PixiRenderer.app 공유');
        } else {
            // 새 앱 생성
            await this.createApp();
        }
        
        if (!this.app) {
            console.error('[PlayerRenderer] ❌ Failed to create PixiJS app');
            return false;
        }
        
        // 플레이어 전용 컨테이너 생성
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.container.label = 'PlayerRenderer';
        this.app.stage.addChild(this.container);
        
        // UI 오버레이 생성
        this.createUIOverlay();
        
        // ✅ 3D 패럴랙스 업데이트 루프
        this.app.ticker.add(this.update3DParallax.bind(this));
        
        this.initialized = true;
        
        console.log('[PlayerRenderer] ✅ 초기화 완료!');
        return true;
    },
    
    async createApp() {
        const battleArena = document.querySelector('.battle-arena');
        if (!battleArena) {
            console.error('[PlayerRenderer] battle-arena not found');
            return;
        }
        
        console.log('[PlayerRenderer] 새 PixiJS 앱 생성 중...');
        
        // 캔버스 컨테이너 생성
        let canvasContainer = document.getElementById('player-canvas-container');
        if (!canvasContainer) {
            canvasContainer = document.createElement('div');
            canvasContainer.id = 'player-canvas-container';
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
        }
        
        // PixiJS v8 방식
        this.app = new PIXI.Application();
        
        await this.app.init({
            width: battleArena.offsetWidth || 1200,
            height: battleArena.offsetHeight || 600,
            backgroundAlpha: 0,
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
        
        console.log('[PlayerRenderer] ✅ PixiJS 앱 생성 완료');
        
        // 리사이즈 핸들러
        window.addEventListener('resize', () => this.handleResize());
    },
    
    createUIOverlay() {
        let overlay = document.getElementById('player-ui-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'player-ui-overlay';
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
            
            // 🎯 딜레이 후 위치 갱신 (DOM 레이아웃 완료 후)
            requestAnimationFrame(() => {
                this.updatePosition();
                this.syncPlayerUI();
            });
        }
    },
    
    // ==========================================
    // 🎯 실제 3D 좌표 기반 위치 계산
    // Background3D의 3D 월드 좌표를 화면 좌표로 투영
    // ==========================================
    
    // 캐시된 3D 투영 결과
    cachedScreenPos: null,
    lastCameraUpdate: 0,
    
    /**
     * 3D 좌표에서 화면 좌표 가져오기 (캐시 사용)
     * @returns {object} { arenaX, arenaY, screenX, screenY, scale, visible }
     */
    getScreenPositionFrom3D() {
        // Background3D가 초기화되지 않았으면 폴백
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            return this.getFallbackPosition();
        }
        
        // 화면 좌표 계산 (매 프레임 업데이트)
        const screenPos = Background3D.getPlayerScreenPosition();
        if (!screenPos || !screenPos.visible) {
            return this.getFallbackPosition();
        }
        
        this.cachedScreenPos = screenPos;
        return screenPos;
    },
    
    /**
     * 3D 사용 불가시 폴백 위치 (battle-arena 로컬 좌표)
     */
    getFallbackPosition() {
        const appWidth = this.app?.renderer?.width || 1200;
        const appHeight = this.app?.renderer?.height || 600;
        const x = appWidth * this.config.positionX;
        const y = appHeight * (this.config.floor3D?.floorY || 0.62);
        return {
            arenaX: x,           // battle-arena 로컬 좌표
            arenaY: y,
            screenX: x,          // 절대 화면 좌표 (폴백에선 동일)
            screenY: y,
            scale: 1.0,
            visible: true
        };
    },
    
    /**
     * 플레이어 X 좌표 (battle-arena 로컬)
     */
    getPlayerX() {
        const pos = this.getScreenPositionFrom3D();
        // arenaX가 있으면 사용, 없으면 screenX 폴백
        return pos.arenaX !== undefined ? pos.arenaX : pos.screenX;
    },
    
    /**
     * 플레이어 Y 좌표 (battle-arena 로컬)
     */
    getPlayerY() {
        const pos = this.getScreenPositionFrom3D();
        return pos.arenaY !== undefined ? pos.arenaY : pos.screenY;
    },
    
    getPlayerScale() {
        const pos = this.getScreenPositionFrom3D();
        // 3D 투영 스케일과 기본 스케일 조합
        return this.config.baseScale * (pos.scale || 1.0);
    },
    
    // 애니메이션 실행 중 플래그
    isAnimating: false,
    
    // 🔧 현재 진행 중인 애니메이션 트윈 저장 (중복 방지 / 정리용)
    currentAttackTween: null,
    currentHitTween: null,
    
    /**
     * 3D 좌표 변경 시 호출되는 업데이트
     */
    updatePositionFrom3D() {
        if (!this.playerContainer) return;
        
        const pos = this.getScreenPositionFrom3D();
        // 🎯 arenaX/arenaY 사용 (battle-arena 로컬 좌표)
        this.playerContainer.x = pos.arenaX !== undefined ? pos.arenaX : pos.screenX;
        this.playerContainer.y = pos.arenaY !== undefined ? pos.arenaY : pos.screenY;
        
        const scale = this.config.baseScale * (pos.scale || 1.0);
        // 숨쉬기 애니메이션 중이면 그 스케일 유지
        if (!this.playerContainer.breathingTween) {
            this.playerContainer.scale.set(scale);
        }
        this.playerContainer.breathingBaseScale = scale;
    },
    
    // ==========================================
    // 플레이어 생성
    // ==========================================
    async createPlayer() {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.app || !this.container) {
            console.error('[PlayerRenderer] Not initialized');
            return null;
        }
        
        // 이미 있으면 제거
        if (this.playerContainer) {
            this.removePlayer();
        }
        
        console.log('[PlayerRenderer] 플레이어 생성 시작...');
        
        // 플레이어 컨테이너
        this.playerContainer = new PIXI.Container();
        this.playerContainer.sortableChildren = true;
        this.playerContainer.label = 'Player';
        
        // 스프라이트 이미지 경로 (JobSystem에서 가져오기)
        let spritePath = 'hero.png';
        if (typeof JobSystem !== 'undefined' && JobSystem.getCurrentSprite) {
            spritePath = JobSystem.getCurrentSprite() || 'hero.png';
        } else if (typeof localStorage !== 'undefined') {
            spritePath = localStorage.getItem('lordofnight_player_sprite') || 'hero.png';
        }
        
        console.log('[PlayerRenderer] 스프라이트 경로:', spritePath);
        
        // 스프라이트 생성
        try {
            const texture = await PIXI.Assets.load(spritePath).catch(() => null);
            
            if (texture) {
                this.sprite = new PIXI.Sprite(texture);
                this.sprite.label = 'player_sprite';
                
                // 픽셀 아트 선명하게
                this.sprite.texture.source.scaleMode = 'nearest';
                
                console.log(`[PlayerRenderer] ✅ 스프라이트 로드됨: ${spritePath}, 크기: ${this.sprite.width}x${this.sprite.height}`);
            } else {
                throw new Error('텍스처 로드 실패');
            }
        } catch (e) {
            console.error(`[PlayerRenderer] ❌ 스프라이트 로드 실패: ${spritePath}`, e);
            // 폴백: 플레이스홀더
            const graphics = new PIXI.Graphics();
            graphics.rect(-50, -200, 100, 200);
            graphics.fill({ color: 0x3498db });
            this.sprite = graphics;
        }
        
        // 앵커 설정 (하단 중앙)
        if (this.sprite.anchor) {
            this.sprite.anchor.set(0.5, 1);
        }
        
        // 위치 및 스케일
        const x = this.getPlayerX();
        const y = this.getPlayerY();
        const scale = this.getPlayerScale();
        
        this.playerContainer.x = x;
        this.playerContainer.y = y;
        this.playerContainer.scale.set(scale);
        this.playerContainer.zIndex = 50;  // 적보다 앞에
        
        console.log(`[PlayerRenderer] 위치: x=${x}, y=${y}, scale=${scale}`);
        
        // 바닥 그림자 추가
        const shadow = this.createGroundShadow(this.sprite);
        if (shadow) {
            shadow.zIndex = -10;
            this.playerContainer.addChild(shadow);
        }
        
        // 아웃라인 효과 적용
        this.applyOutlineEffect(this.sprite, this.playerContainer);
        
        // 스프라이트 추가
        this.playerContainer.addChild(this.sprite);
        
        // 환경광 블렌딩
        this.applyEnvironmentBlending(this.sprite);
        
        // 메인 컨테이너에 추가
        this.container.addChild(this.playerContainer);
        
        // 등장 애니메이션
        this.playEntranceAnimation();
        
        // 숨쉬기 애니메이션 시작
        this.startBreathingAnimation();
        
        // UI 오버레이 생성
        this.createPlayerUI();
        
        // 기존 DOM 플레이어 숨기기
        this.hideDOMPlayer();
        
        console.log('[PlayerRenderer] ✅ 플레이어 생성 완료!');
        
        return { sprite: this.sprite, container: this.playerContainer };
    },
    
    removePlayer() {
        // GSAP 애니메이션 정리
        if (this.playerContainer) {
            this.stopBreathingAnimation();
            gsap.killTweensOf(this.playerContainer);
            if (this.playerContainer.scale) {
                gsap.killTweensOf(this.playerContainer.scale);
            }
            
            if (this.playerContainer.parent) {
                this.playerContainer.parent.removeChild(this.playerContainer);
                this.playerContainer.destroy({ children: true });
            }
        }
        
        // UI 제거
        if (this.topUI && this.topUI.parentNode) {
            this.topUI.parentNode.removeChild(this.topUI);
        }
        if (this.bottomUI && this.bottomUI.parentNode) {
            this.bottomUI.parentNode.removeChild(this.bottomUI);
        }
        
        this.sprite = null;
        this.playerContainer = null;
        this.topUI = null;
        this.bottomUI = null;
        
        console.log('[PlayerRenderer] 플레이어 제거됨');
    },
    
    // ==========================================
    // UI 오버레이 (HP바, 쉴드, 상태효과)
    // ==========================================
    createPlayerUI() {
        if (!this.uiOverlay) return;
        
        // 기존 UI 제거
        if (this.topUI) this.topUI.remove();
        if (this.bottomUI) this.bottomUI.remove();
        
        // ==========================================
        // 하단 UI (HP바 + 쉴드 + 상태효과) - 발 밑
        // ==========================================
        this.bottomUI = document.createElement('div');
        this.bottomUI.className = 'player-ui-bottom';
        this.bottomUI.style.cssText = `
            position: absolute;
            pointer-events: none;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            z-index: 10000;
        `;
        
        // HP 바
        const hpBar = document.createElement('div');
        hpBar.className = 'player-hp-bar pixi-player-hp';
        const hp = gameState?.player?.hp || 80;
        const maxHp = gameState?.player?.maxHp || 80;
        const hpPercent = Math.max(0, (hp / maxHp) * 100);
        hpBar.innerHTML = `
            <div class="hp-bg"></div>
            <div class="hp-fill" style="width: ${hpPercent}%;"></div>
            <span class="hp-text">${hp}/${maxHp}</span>
        `;
        this.bottomUI.appendChild(hpBar);
        
        // 쉴드 표시
        const block = gameState?.player?.block || 0;
        if (block > 0) {
            const shieldEl = document.createElement('div');
            shieldEl.className = 'player-shield pixi-player-shield';
            shieldEl.innerHTML = `🛡️ ${block}`;
            this.bottomUI.appendChild(shieldEl);
        }
        
        // 상태 효과
        const statusEl = document.createElement('div');
        statusEl.className = 'player-status-effects pixi-player-status';
        statusEl.innerHTML = this.getStatusEffectsHTML();
        this.bottomUI.appendChild(statusEl);
        
        this.uiOverlay.appendChild(this.bottomUI);
        
        // 위치 동기화
        this.syncPlayerUI();
    },
    
    getStatusEffectsHTML() {
        const effects = [];
        const player = gameState?.player;
        if (!player) return '';
        
        if (player.poison && player.poison > 0) effects.push(`☠️${player.poison}`);
        if (player.bleed && player.bleed > 0) effects.push(`🩸${player.bleed}`);
        if (player.burn && player.burn > 0) effects.push(`🔥${player.burn}`);
        if (player.weak && player.weak > 0) effects.push(`😵${player.weak}`);
        if (player.vulnerable && player.vulnerable > 0) effects.push(`💔${player.vulnerable}`);
        if (player.strength && player.strength > 0) effects.push(`💪${player.strength}`);
        if (player.dexterity && player.dexterity > 0) effects.push(`🎯${player.dexterity}`);
        
        return effects.map(e => `<span class="status-icon">${e}</span>`).join('');
    },
    
    syncPlayerUI() {
        if (!this.playerContainer || !this.bottomUI) return;
        
        // 캔버스 DOM 위치 보정
        let canvasOffsetX = 0;
        let canvasOffsetY = 0;
        
        const canvas = this.app?.canvas || this.app?.view;
        const overlay = this.uiOverlay;
        
        if (canvas && overlay) {
            const canvasRect = canvas.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            canvasOffsetX = canvasRect.left - overlayRect.left;
            canvasOffsetY = canvasRect.top - overlayRect.top;
        }
        
        // 스프라이트의 PixiJS 내부 좌표
        const pixiPos = this.playerContainer.getGlobalPosition();
        
        // HTML 오버레이 좌표로 변환
        const screenX = pixiPos.x + canvasOffsetX;
        const screenY = pixiPos.y + canvasOffsetY;
        
        // HP바: 스프라이트 발 바로 아래 (8px 간격)
        this.bottomUI.style.left = screenX + 'px';
        this.bottomUI.style.top = (screenY + 8) + 'px';
        this.bottomUI.style.transform = 'translateX(-50%) scale(1.3)';  // 1.3배 크기
        this.bottomUI.style.display = 'flex';
        this.bottomUI.style.visibility = 'visible';
        this.bottomUI.style.opacity = '1';
    },
    
    // HP 업데이트
    updatePlayerHP() {
        if (!this.bottomUI) return;
        
        const hpFill = this.bottomUI.querySelector('.hp-fill');
        const hpText = this.bottomUI.querySelector('.hp-text');
        
        const hp = gameState?.player?.hp || 0;
        const maxHp = gameState?.player?.maxHp || 80;
        
        if (hpFill) {
            const percent = Math.max(0, (hp / maxHp) * 100);
            hpFill.style.width = `${percent}%`;
        }
        if (hpText) {
            hpText.textContent = `${hp}/${maxHp}`;
        }
    },
    
    // 쉴드 업데이트
    updatePlayerShield() {
        if (!this.bottomUI) return;
        
        let shieldEl = this.bottomUI.querySelector('.pixi-player-shield');
        const block = gameState?.player?.block || 0;
        
        if (block > 0) {
            if (!shieldEl) {
                shieldEl = document.createElement('div');
                shieldEl.className = 'player-shield pixi-player-shield';
                // HP바 다음에 삽입
                const hpBar = this.bottomUI.querySelector('.pixi-player-hp');
                if (hpBar && hpBar.nextSibling) {
                    this.bottomUI.insertBefore(shieldEl, hpBar.nextSibling);
                } else {
                    this.bottomUI.appendChild(shieldEl);
                }
            }
            shieldEl.innerHTML = `🛡️ ${block}`;
            shieldEl.style.display = '';
            
            // 🛡️ 플레이어 컨테이너에 has-block 효과
            this.setBlockEffect(true);
        } else {
            if (shieldEl) {
                shieldEl.style.display = 'none';
            }
            this.setBlockEffect(false);
        }
    },
    
    // 상태효과 업데이트
    updatePlayerStatus() {
        if (!this.bottomUI) return;
        
        const statusEl = this.bottomUI.querySelector('.pixi-player-status');
        if (statusEl) {
            statusEl.innerHTML = this.getStatusEffectsHTML();
        }
    },
    
    // 전체 UI 업데이트
    updatePlayerUI() {
        this.updatePlayerHP();
        this.updatePlayerShield();
        this.updatePlayerStatus();
    },
    
    // ==========================================
    // 그래픽 효과
    // ==========================================
    createGroundShadow(sprite) {
        if (!sprite || !sprite.texture) return null;
        
        try {
            const shadowGraphics = new PIXI.Graphics();
            
            const spriteWidth = sprite.texture.width || 100;
            const shadowWidth = spriteWidth * 0.8;
            const shadowHeight = shadowWidth * 0.25;
            
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
            
            shadowGraphics.y = -5;
            shadowGraphics.alpha = 0.6;
            
            return shadowGraphics;
        } catch (e) {
            console.warn('[PlayerRenderer] 그림자 생성 실패:', e);
            return null;
        }
    },
    
    applyEnvironmentBlending(sprite) {
        if (!sprite) return;
        
        try {
            if (typeof PIXI !== 'undefined' && PIXI.ColorMatrixFilter) {
                const colorMatrix = new PIXI.ColorMatrixFilter();
                colorMatrix.brightness(0.95, false);
                colorMatrix.saturate(-0.08, false);
                
                sprite.filters = sprite.filters || [];
                sprite.filters.push(colorMatrix);
                sprite._envFilter = colorMatrix;
            }
        } catch (e) {
            console.log('[PlayerRenderer] 환경광 필터 미지원');
        }
    },
    
    // 픽셀 스타일 하얀 외곽선 (선명하게, 블러 없음!)
    applyOutlineEffect(sprite, container, hasBlock = false) {
        if (!sprite || !container) return;
        
        try {
            // 기존 아웃라인 제거
            const existingOutlines = container.children.filter(c => c.isOutline);
            existingOutlines.forEach(o => {
                container.removeChild(o);
                o.destroy();
            });
            
            if (!sprite.texture) return;
            
            // 🎮 픽셀 게임 스타일: 1~2픽셀 선명한 외곽선!
            const outlineDistance = 2;  // 픽셀 단위
            const outlineColor = hasBlock ? 0x3c96ff : 0xffffff;  // 방어막: 파랑 / 기본: 흰색
            
            // 4방향 (상하좌우) - 픽셀 게임 스타일
            const directions = [
                { x: outlineDistance, y: 0 },
                { x: -outlineDistance, y: 0 },
                { x: 0, y: outlineDistance },
                { x: 0, y: -outlineDistance },
            ];
            
            directions.forEach(dir => {
                const outline = new PIXI.Sprite(sprite.texture);
                outline.anchor.set(sprite.anchor.x, sprite.anchor.y);
                outline.x = dir.x;
                outline.y = dir.y;
                outline.tint = outlineColor;
                outline.alpha = 1.0;  // 완전 불투명
                outline.zIndex = -1;
                outline.isOutline = true;
                container.addChild(outline);
            });
            
            // 메인 스프라이트가 맨 위
            sprite.zIndex = 10;
            container.sortChildren();
            
            console.log(`[PlayerRenderer] ✅ 픽셀 외곽선 적용됨 (${hasBlock ? '파랑' : '흰색'})`);
        } catch (e) {
            console.log('[PlayerRenderer] 아웃라인 에러:', e);
        }
    },
    
    // 방어막 효과 (파란색 외곽선)
    setBlockEffect(hasBlock) {
        if (!this.sprite || !this.playerContainer) return;
        
        // 외곽선 색상 변경
        this.applyOutlineEffect(this.sprite, this.playerContainer, hasBlock);
        
        // 플래시 효과
        if (hasBlock && this.sprite) {
            const originalTint = this.sprite.tint;
            this.sprite.tint = 0x88ccff;
            gsap.delayedCall(0.15, () => {
                if (this.sprite) this.sprite.tint = originalTint || 0xffffff;
            });
        }
    },
    
    // ==========================================
    // 애니메이션
    // ==========================================
    playEntranceAnimation() {
        if (!this.playerContainer) return;
        
        this.playerContainer.alpha = 0;
        const targetScale = this.playerContainer.scale.x;
        this.playerContainer.scale.set(targetScale * 0.5);
        
        let progress = 0;
        const animate = () => {
            progress += 0.05;
            if (progress >= 1) {
                this.playerContainer.alpha = 1;
                this.playerContainer.scale.set(targetScale);
                return;
            }
            
            const eased = 1 - Math.pow(1 - progress, 3);
            this.playerContainer.alpha = eased;
            this.playerContainer.scale.set(targetScale * (0.5 + 0.5 * eased));
            
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },
    
    startBreathingAnimation() {
        if (!this.playerContainer || !this.playerContainer.scale || typeof gsap === 'undefined') return;
        
        this.stopBreathingAnimation();
        
        const delay = Math.random() * 0.5;
        const baseY = this.playerContainer.y;
        const baseScale = this.playerContainer.scale.x;
        const breathDuration = 1.8 + Math.random() * 0.3;  // 더 느리게
        
        const isContainerValid = () => {
            return this.playerContainer && this.playerContainer.scale && 
                   this.playerContainer.parent !== null && !this.playerContainer.destroyed;
        };
        
        const breathTl = gsap.timeline({ 
            repeat: -1, 
            yoyo: true,
            delay: delay,
            defaults: { ease: "sine.inOut" },
            onUpdate: function() {
                if (!isContainerValid()) {
                    this.kill();
                }
            }
        });
        
        // ✅ 더 미세한 숨쉬기 (1% 변화만)
        breathTl.to(this.playerContainer.scale, {
            y: baseScale * 1.01,    // 1%만 늘어남 (기존 2%)
            x: baseScale * 0.995,   // 0.5%만 줄어듦 (기존 1%)
            duration: breathDuration
        }, 0);
        
        breathTl.to(this.playerContainer, {
            y: baseY - 2,           // 2px만 위로 (기존 3px)
            duration: breathDuration
        }, 0);
        
        this.playerContainer.breathingTween = breathTl;
        this.playerContainer.breathingBaseScale = baseScale;
        this.playerContainer.breathingBaseY = baseY;
    },
    
    stopBreathingAnimation() {
        if (!this.playerContainer) return;
        
        if (this.playerContainer.breathingTween) {
            this.playerContainer.breathingTween.kill();
            this.playerContainer.breathingTween = null;
        }
        
        try {
            if (this.playerContainer.scale && this.playerContainer.breathingBaseScale) {
                this.playerContainer.scale.set(this.playerContainer.breathingBaseScale);
            }
            if (this.playerContainer.breathingBaseY !== undefined) {
                this.playerContainer.y = this.playerContainer.breathingBaseY;
            }
        } catch (e) {
            console.warn('[PlayerRenderer] stopBreathingAnimation error:', e);
        }
    },
    
    // ==========================================
    // 공격 애니메이션 (적 방향으로 돌진 + 3D 대시!)
    // ==========================================
    playAttackAnimation(attackType = 'melee', onHit, onComplete, targetEnemyIndex = -1) {
        if (!this.playerContainer || !this.sprite) return;
        
        const container = this.playerContainer;
        const baseScale = container.breathingBaseScale || this.getPlayerScale();
        
        // 🔧 이전 애니메이션이 있으면 정리! (isAnimating 누락 방지)
        if (this.currentAttackTween) {
            this.currentAttackTween.kill();
            this.currentAttackTween = null;
        }
        
        // 🎬 애니메이션 시작
        this.isAnimating = true;
        
        // 숨쉬기 일시 중지
        if (container.breathingTween) {
            container.breathingTween.pause();
        }
        
        if (typeof gsap === 'undefined') {
            this.isAnimating = false;
            return;
        }
        
        console.log('[PlayerRenderer] 공격 애니메이션:', attackType, '타겟:', targetEnemyIndex);
        
        // 🏃 3D 월드 대시! (근접 공격 시)
        if (attackType === 'melee' && typeof Background3D !== 'undefined' && Background3D.dashPlayer) {
            Background3D.dashPlayer(targetEnemyIndex, onHit);
        }
        
        const self = this;
        const tl = gsap.timeline({
            onComplete: () => {
                // 🎬 애니메이션 종료
                self.isAnimating = false;
                self.currentAttackTween = null;
                setTimeout(() => {
                    if (container.breathingTween) {
                        container.breathingTween.resume();
                    }
                }, 100);
                if (onComplete) onComplete();
            }
        });
        
        // 🔧 현재 timeline 저장 (나중에 정리용)
        this.currentAttackTween = tl;
        
        if (attackType === 'melee') {
            // 스케일/회전 애니메이션만 (x 이동은 3D 대시에 맡김!)
            
            // 준비 (웅크림)
            tl.to(container.scale, {
                x: baseScale * 0.85,
                y: baseScale * 1.15,
                duration: 0.08,
                ease: 'power2.in'
            });
            
            tl.to(container, {
                rotation: -0.1,
                duration: 0.08,
                ease: 'power2.in'
            }, '<');
            
            // 돌진! (스케일 변화)
            tl.to(container.scale, {
                x: baseScale * 1.2,
                y: baseScale * 0.9,
                duration: 0.1,
                ease: 'power4.out'
            })
            .to(container.scale, {
                x: baseScale * 1.3,
                y: baseScale * 0.8,
                duration: 0.12,
                ease: 'power4.in'
            }, '<');
            
            // 히트스탑
            tl.to(container, { duration: 0.08 });
            
            // 복귀 (스케일/회전만 - 위치는 3D 대시가 처리)
            tl.to(container.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.3,
                ease: 'elastic.out(1, 0.5)'
            });
            tl.to(container, {
                rotation: 0,
                duration: 0.2,
                ease: 'power2.out'
            }, '<');
            
            // Tint 플래시
            if (this.sprite && this.sprite.tint !== undefined) {
                gsap.to(this.sprite, {
                    duration: 0.1,
                    onStart: () => { this.sprite.tint = 0xffffcc; },
                    onComplete: () => { this.sprite.tint = 0xffffff; }
                });
            }
            
        } else if (attackType === 'magic') {
            // 마법 공격 (3D 대시에서는 히트 콜백 호출 없음)
            if (onHit) {
                tl.add(onHit, 0.3);
            }
            tl.to(container.scale, {
                x: baseScale * 1.15,
                y: baseScale * 1.15,
                duration: 0.3,
                ease: 'power2.out'
            })
            .to(container.scale, {
                x: baseScale * 1.15,
                y: baseScale * 1.15,
                duration: 0.3,
                ease: 'power2.out'
            }, '<');
            
            tl.add(() => { if (onHit) onHit(); });
            
            tl.to(container.scale, {
                x: baseScale * 0.95,
                y: baseScale * 0.95,
                duration: 0.1,
                ease: 'power4.in'
            });
            
            tl.to(container, {
                y: originalY,
                duration: 0.3,
                ease: 'power2.out'
            })
            .to(container.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.3,
                ease: 'power2.out'
            }, '<');
            
            if (this.sprite && this.sprite.tint !== undefined) {
                gsap.to(this.sprite, {
                    duration: 0.3,
                    onStart: () => { this.sprite.tint = 0xaa88ff; },
                    onComplete: () => { this.sprite.tint = 0xffffff; }
                });
            }
        }
        
        return tl;
    },
    
    // 피격 애니메이션
    playHitAnimation(damage = 10, isCritical = false) {
        if (!this.playerContainer || !this.sprite) return;
        
        const container = this.playerContainer;
        const baseScale = container.breathingBaseScale || this.getPlayerScale();
        
        // 🔧 이전 피격 애니메이션이 있으면 정리! (isAnimating 누락 방지)
        if (this.currentHitTween) {
            this.currentHitTween.kill();
            this.currentHitTween = null;
        }
        
        // 🎬 애니메이션 시작
        this.isAnimating = true;
        
        // 🎯 3D 월드 넉백 비활성화 (시각적 효과 단순화)
        // 넉백 제거됨 - 피격 애니메이션만 유지
        
        // 숨쉬기 일시 중지
        if (container.breathingTween) {
            container.breathingTween.pause();
        }
        
        if (typeof gsap === 'undefined') {
            this.isAnimating = false;
            return;
        }
        
        const intensity = Math.min(damage / 5, 6);
        const knockbackX = -(15 + intensity * 5);  // 왼쪽으로 밀림
        const freezeTime = Math.min(0.04 + damage * 0.003, 0.1);
        const originalX = container.x;
        
        // 화면 흔들림
        if (typeof SpriteAnimation !== 'undefined') {
            SpriteAnimation.screenShake(intensity * 2, 0.1);
        }
        
        const self = this;
        const tl = gsap.timeline({
            onComplete: () => {
                // 🎬 애니메이션 종료
                self.isAnimating = false;
                self.currentHitTween = null;
                if (container.breathingTween) {
                    container.breathingTween.resume();
                }
            }
        });
        
        // 🔧 현재 timeline 저장 (나중에 정리용)
        this.currentHitTween = tl;
        
        // 순간 넉백 + 스쿼시
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
        
        // 히트스탑
        tl.to({}, { duration: freezeTime });
        
        // 복귀
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
        
        // 빨간 플래시
        if (this.sprite && this.sprite.tint !== undefined) {
            const flashTint = isCritical ? 0xff0000 : 0xff6666;
            this.sprite.tint = 0xffffff;
            gsap.delayedCall(0.02, () => {
                if (this.sprite) this.sprite.tint = flashTint;
            });
            gsap.delayedCall(0.1, () => {
                if (this.sprite) this.sprite.tint = 0xffffff;
            });
        }
        
        return tl;
    },
    
    // 방어 애니메이션
    playDefendAnimation(blockAmount = 5) {
        if (!this.playerContainer || !this.sprite) return;
        
        const container = this.playerContainer;
        const baseScale = container.breathingBaseScale || this.getPlayerScale();
        
        if (container.breathingTween) {
            container.breathingTween.pause();
        }
        
        if (typeof gsap === 'undefined') return;
        
        const intensity = Math.min(blockAmount / 10, 1.5);
        
        const tl = gsap.timeline({
            onComplete: () => {
                if (container.breathingTween) {
                    container.breathingTween.resume();
                }
            }
        });
        
        // 방어 자세
        tl.to(container.scale, {
            x: baseScale * (1 + 0.1 * intensity),
            y: baseScale * (1 - 0.05 * intensity),
            duration: 0.1,
            ease: 'power2.out'
        });
        
        // 복귀
        tl.to(container.scale, {
            x: baseScale,
            y: baseScale,
            duration: 0.25,
            ease: 'elastic.out(1, 0.5)'
        });
        
        // 파란 플래시
        if (this.sprite && this.sprite.tint !== undefined) {
            this.sprite.tint = 0x88ccff;
            gsap.delayedCall(0.15, () => {
                if (this.sprite) this.sprite.tint = 0xffffff;
            });
        }
        
        return tl;
    },
    
    // 힐 애니메이션
    playHealAnimation() {
        if (!this.playerContainer || !this.sprite) return;
        
        const container = this.playerContainer;
        const baseY = container.breathingBaseY || container.y;
        
        if (typeof gsap === 'undefined') return;
        
        gsap.timeline()
            .to(container, {
                y: baseY - 8,
                duration: 0.3,
                ease: 'sine.out'
            })
            .to(container, {
                y: baseY,
                duration: 0.4,
                ease: 'sine.inOut'
            });
        
        // 초록 플래시
        if (this.sprite && this.sprite.tint !== undefined) {
            this.sprite.tint = 0x88ff88;
            gsap.delayedCall(0.3, () => {
                if (this.sprite) this.sprite.tint = 0xffffff;
            });
        }
    },
    
    // ==========================================
    // 스프라이트 변경 (직업 변경 시)
    // ==========================================
    async changeSprite(newSpritePath) {
        if (!this.playerContainer || !this.sprite) return;
        
        console.log('[PlayerRenderer] 스프라이트 변경:', newSpritePath);
        
        try {
            const texture = await PIXI.Assets.load(newSpritePath).catch(() => null);
            
            if (texture) {
                this.sprite.texture = texture;
                this.sprite.texture.source.scaleMode = 'nearest';
                
                // 아웃라인 재적용
                this.applyOutlineEffect(this.sprite, this.playerContainer);
                
                console.log('[PlayerRenderer] ✅ 스프라이트 변경 완료');
            }
        } catch (e) {
            console.error('[PlayerRenderer] 스프라이트 변경 실패:', e);
        }
    },
    
    // ==========================================
    // 위치 업데이트
    // ==========================================
    updatePosition() {
        if (!this.playerContainer) return;
        
        const x = this.getPlayerX();
        const y = this.getPlayerY();
        
        this.playerContainer.x = x;
        this.playerContainer.y = y;
        
        // 숨쉬기 기준점 업데이트
        this.playerContainer.breathingBaseY = y;
        
        this.syncPlayerUI();
    },
    
    // ==========================================
    // 플레이어 좌표 반환 (이펙트용 - 전체 화면 절대 좌표)
    // ==========================================
    getPlayerPosition() {
        if (!this.playerContainer) return null;
        
        // PixiJS 캔버스 내 글로벌 좌표
        const globalPos = this.playerContainer.getGlobalPosition();
        
        // 🎯 battle-arena 오프셋 추가 (화면 절대 좌표로 변환)
        const arena = document.querySelector('.battle-arena');
        let offsetX = 0, offsetY = 0;
        if (arena) {
            const arenaRect = arena.getBoundingClientRect();
            offsetX = arenaRect.left;
            offsetY = arenaRect.top;
        }
        
        const screenX = globalPos.x + offsetX;
        const screenY = globalPos.y + offsetY;
        
        let width = 100, height = 200;
        if (this.sprite) {
            width = (this.sprite.width || 100) * this.playerContainer.scale.x;
            height = (this.sprite.height || 200) * this.playerContainer.scale.y;
        }
        
        return {
            centerX: screenX,
            centerY: screenY - height / 2,
            left: screenX - width / 2,
            right: screenX + width / 2,
            top: screenY - height,
            bottom: screenY,
            width: width,
            height: height
        };
    },
    
    // ==========================================
    // 타겟 하이라이트 (카드 드래그 시)
    // ==========================================
    highlightAsTarget(isHighlighted) {
        if (!this.playerContainer || !this.sprite) return;
        
        const baseScale = this.playerContainer.breathingBaseScale || this.config.baseScale;
        
        if (isHighlighted) {
            // 🔵 파란색/하늘색 네온 효과 (플레이어용)
            if (this.sprite && this.sprite.tint !== undefined) {
                this.sprite.tint = 0x88ccff;  // 밝은 파랑
            }
            
            // 확대 + 펄스
            if (typeof gsap !== 'undefined') {
                gsap.to(this.playerContainer.scale, {
                    x: baseScale * 1.12,
                    y: baseScale * 1.12,
                    duration: 0.15,
                    ease: "back.out(2)"
                });
            }
            
            // 글로우 필터 추가 (가능하면)
            if (typeof PIXI !== 'undefined' && typeof PIXI.DropShadowFilter !== 'undefined') {
                const glowFilters = [];
                const glowColor = 0x4488ff;
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
                this.playerContainer.filters = glowFilters;
            }
        } else {
            // 원래 상태로 복원
            if (this.sprite && this.sprite.tint !== undefined) {
                this.sprite.tint = 0xffffff;
            }
            this.playerContainer.filters = [];
            
            // 스케일 복원
            if (typeof gsap !== 'undefined') {
                gsap.to(this.playerContainer.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.15,
                    ease: "power2.out"
                });
            }
        }
    },
    
    // ==========================================
    // DOM 플레이어 숨기기/표시
    // ==========================================
    hideDOMPlayer() {
        const domPlayer = document.getElementById('player');
        if (domPlayer) {
            domPlayer.style.opacity = '0';
            domPlayer.style.pointerEvents = 'none';
        }
        
        const playerSide = document.querySelector('.player-side');
        if (playerSide) {
            // stat-bars만 남기고 캐릭터 숨기기
            const playerChar = playerSide.querySelector('.player-character');
            if (playerChar) {
                playerChar.style.opacity = '0';
                playerChar.style.pointerEvents = 'none';
            }
        }
        
        console.log('[PlayerRenderer] DOM 플레이어 숨김');
    },
    
    showDOMPlayer() {
        const domPlayer = document.getElementById('player');
        if (domPlayer) {
            domPlayer.style.opacity = '1';
            domPlayer.style.pointerEvents = 'auto';
        }
        
        const playerSide = document.querySelector('.player-side');
        if (playerSide) {
            const playerChar = playerSide.querySelector('.player-character');
            if (playerChar) {
                playerChar.style.opacity = '1';
                playerChar.style.pointerEvents = 'auto';
            }
        }
        
        console.log('[PlayerRenderer] DOM 플레이어 표시');
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
        
        // 플레이어 생성
        await this.createPlayer();
        
        console.log('[PlayerRenderer] ✅ Enabled - PixiJS 플레이어 렌더링 활성화');
    },
    
    disable() {
        this.enabled = false;
        
        if (this.container) {
            this.container.visible = false;
        }
        if (this.uiOverlay) {
            this.uiOverlay.style.display = 'none';
        }
        
        // DOM 플레이어 복원
        this.showDOMPlayer();
        
        // 플레이어 제거
        this.removePlayer();
        
        console.log('[PlayerRenderer] ❌ Disabled - DOM 플레이어로 복귀');
    },
    
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    },
    
    // ==========================================
    // ✅ 3D 좌표 기반 위치 업데이트 (매 프레임)
    // Background3D의 카메라 투영을 사용하여 위치 계산
    // ==========================================
    update3DParallax() {
        if (!this.playerContainer) return;
        
        // 🎬 애니메이션 실행 중이면 위치/스케일 업데이트 스킵!
        if (this.isAnimating) {
            this.syncPlayerUI();  // UI는 동기화
            return;
        }
        
        // 3D 좌표에서 투영된 화면 좌표 가져오기
        const pos = this.getScreenPositionFrom3D();
        
        // ✅ 플레이어 위치 업데이트 (숨쉬기 애니메이션만 체크)
        const breathingActive = this.playerContainer.breathingTween?.isActive?.();
        
        if (!breathingActive) {
            // 🎯 arenaX/arenaY 사용 (battle-arena 로컬 좌표)
            this.playerContainer.x = pos.arenaX !== undefined ? pos.arenaX : pos.screenX;
            this.playerContainer.y = pos.arenaY !== undefined ? pos.arenaY : pos.screenY;
        }
        
        // 스케일 업데이트 (3D 거리 기반)
        const scale = this.config.baseScale * (pos.scale || 1.0);
        this.playerContainer.breathingBaseScale = scale;
        
        if (!breathingActive) {
            this.playerContainer.scale.set(scale);
        }
        
        // UI 동기화
        this.syncPlayerUI();
    }
};

// 전역 등록
window.PlayerRenderer = PlayerRenderer;

// 스타일 추가
const playerRendererStyles = document.createElement('style');
playerRendererStyles.textContent = `
    /* 플레이어 UI 오버레이 */
    #player-ui-overlay {
        font-family: 'DungGeunMo', monospace;
    }
    
    /* HP 바 (적과 동일한 스타일) */
    .player-hp-bar.pixi-player-hp {
        width: 90px;
        height: 12px;
        position: relative;
        border-radius: 6px;
        overflow: hidden;
        background: transparent;
    }
    
    .player-hp-bar .hp-bg {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%);
        border: 1px solid #333;
        border-radius: 6px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.5);
    }
    
    .player-hp-bar .hp-fill {
        position: absolute;
        top: 1px; left: 1px; bottom: 1px;
        background: linear-gradient(to bottom, #22c55e 0%, #16a34a 50%, #15803d 100%);
        border-radius: 5px;
        transition: width 0.3s ease;
        box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    }
    
    .player-hp-bar .hp-text {
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
    }
    
    /* 쉴드 표시 */
    .player-shield.pixi-player-shield {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        font-weight: bold;
        font-family: 'Cinzel', serif;
        color: #60a5fa;
        text-shadow: 0 0 5px #60a5fa, 0 1px 3px rgba(0,0,0,0.9);
        padding: 3px 8px;
        background: linear-gradient(180deg, 
            rgba(40, 50, 80, 0.9) 0%, 
            rgba(25, 35, 60, 0.95) 100%);
        border: 1px solid rgba(100, 165, 250, 0.5);
        border-radius: 4px;
        box-shadow: 
            0 2px 6px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(150, 200, 255, 0.15);
    }
    
    /* 상태 효과 */
    .player-status-effects.pixi-player-status {
        display: flex;
        gap: 4px;
        justify-content: center;
        flex-wrap: wrap;
        max-width: 110px;
    }
    
    .pixi-player-status .status-icon {
        font-size: 11px;
        background: linear-gradient(180deg, 
            rgba(30, 25, 20, 0.95) 0%, 
            rgba(15, 12, 8, 0.98) 100%);
        padding: 3px 5px;
        border: 1px solid rgba(100, 80, 50, 0.5);
        border-radius: 3px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.6);
    }
    
    /* 캔버스 컨테이너 */
    #player-canvas-container {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }
`;
document.head.appendChild(playerRendererStyles);

// 자동 초기화 (EnemyRenderer와 함께)
document.addEventListener('DOMContentLoaded', () => {
    console.log('[PlayerRenderer] DOMContentLoaded - 대기 중...');
    
    // 전투 시작 시 초기화
    setTimeout(() => {
        if (PlayerRenderer.enabled && !PlayerRenderer.initialized) {
            PlayerRenderer.init();
        }
    }, 600);  // EnemyRenderer보다 약간 늦게
});

console.log('[PlayerRenderer] ✅ Script loaded');

