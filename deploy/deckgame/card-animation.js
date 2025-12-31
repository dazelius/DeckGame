// ==========================================
// Shadow Deck - 카드 이동 애니메이션 시스템
// Canvas (PIXI.js) 기반 렌더링
// ==========================================

const CardAnimation = {
    // PIXI 앱 및 컨테이너
    app: null,
    container: null,
    initialized: false,
    
    // 카드 텍스처 캐시
    cardTextureCache: new Map(),
    
    // 활성 애니메이션 목록
    activeAnimations: [],
    
    // ==========================================
    // 사운드 재생
    // ==========================================
    playDrawSound() {
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.playCardDraw();
        } else {
            try {
                const sound = new Audio('sound/card_draw.mp3');
                sound.volume = 0.5;
                sound.play().catch(() => {});
            } catch (e) {}
        }
    },
    
    // ==========================================
    // 초기화 (PIXI.js 셋업)
    // ==========================================
    async init() {
        if (this.initialized) return;
        
        try {
            // PIXI.js 사용 가능 여부 확인
            if (typeof PIXI === 'undefined') {
                console.warn('[CardAnimation] PIXI.js not found, using DOM fallback');
                this.useDOMFallback = true;
                this.initialized = true;
                return;
            }
            
            // PIXI 앱 생성
            this.app = new PIXI.Application();
            
            await this.app.init({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundAlpha: 0,
                antialias: true,
                resolution: Math.min(window.devicePixelRatio || 1, 2),
                autoDensity: true,
            });
            
            // 캔버스 스타일 설정
            this.app.canvas.id = 'card-animation-canvas';
            this.app.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10000;
            `;
            document.body.appendChild(this.app.canvas);
            
            // 메인 컨테이너
            this.container = new PIXI.Container();
            this.app.stage.addChild(this.container);
            
            // 리사이즈 핸들러
            window.addEventListener('resize', () => this.resize());
            
            // 애니메이션 루프
            this.app.ticker.add(() => this.update());
            
            this.initialized = true;
            console.log('[CardAnimation] Canvas 시스템 초기화 완료');
        } catch (e) {
            console.error('[CardAnimation] Canvas 초기화 실패, DOM 폴백 사용:', e);
            this.useDOMFallback = true;
            this.initialized = true;
        }
    },
    
    // 리사이즈
    resize() {
        if (!this.app) return;
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    },
    
    // 애니메이션 업데이트 루프
    update() {
        const now = performance.now();
        
        for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
            const anim = this.activeAnimations[i];
            const elapsed = now - anim.startTime;
            const progress = Math.min(elapsed / anim.duration, 1);
            
            // 이징 함수 적용
            const easedProgress = this.easeOutCubic(progress);
            
            // 위치 보간
            anim.sprite.x = anim.startX + (anim.endX - anim.startX) * easedProgress;
            anim.sprite.y = anim.startY + (anim.endY - anim.startY) * easedProgress;
            
            // 스케일 보간
            const scale = anim.startScale + (anim.endScale - anim.startScale) * easedProgress;
            anim.sprite.scale.set(scale);
            
            // 회전 보간
            anim.sprite.rotation = anim.startRotation + (anim.endRotation - anim.startRotation) * easedProgress;
            
            // 알파 보간
            anim.sprite.alpha = anim.startAlpha + (anim.endAlpha - anim.startAlpha) * easedProgress;
            
            // 완료 체크
            if (progress >= 1) {
                // 다음 단계가 있으면 실행
                if (anim.nextPhase) {
                    const next = anim.nextPhase;
                    anim.startTime = now;
                    anim.duration = next.duration;
                    anim.startX = anim.sprite.x;
                    anim.startY = anim.sprite.y;
                    anim.endX = next.endX;
                    anim.endY = next.endY;
                    anim.startScale = anim.sprite.scale.x;
                    anim.endScale = next.endScale;
                    anim.startRotation = anim.sprite.rotation;
                    anim.endRotation = next.endRotation;
                    anim.startAlpha = anim.sprite.alpha;
                    anim.endAlpha = next.endAlpha;
                    anim.nextPhase = next.nextPhase;
                } else {
                    // 애니메이션 완료
                    this.container.removeChild(anim.sprite);
                    anim.sprite.destroy();
                    this.activeAnimations.splice(i, 1);
                    
                    // 콜백 실행
                    if (anim.onComplete) anim.onComplete();
                    
                    // 플래시 효과
                    if (anim.flashTarget) {
                        this.flashElement(anim.flashTarget, anim.cardType);
                    }
                }
            }
        }
    },
    
    // 이징 함수
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    // ==========================================
    // 카드 타입별 색상
    // ==========================================
    getCardColors(cardType) {
        const colors = {
            attack: { bg: 0x8B0000, border: 0xc0392b, glow: 0xff4444 },
            skill: { bg: 0x1a4a6e, border: 0x2980b9, glow: 0x44aaff },
            power: { bg: 0x4a1a6e, border: 0x8e44ad, glow: 0xaa44ff },
            status: { bg: 0x3a3a4a, border: 0x6b7280, glow: 0x888888 },
            curse: { bg: 0x2a0a2a, border: 0x6b21a8, glow: 0x9944ff }
        };
        return colors[cardType] || colors.attack;
    },
    
    // ==========================================
    // 카드 스프라이트 생성 (Canvas 렌더링)
    // ==========================================
    createCardSprite(options = {}) {
        const {
            cost = 0,
            cardType = 'attack',
            icon = '🃏',
            name = '카드',
            width = 120,
            height = 170
        } = options;
        
        // 캐시 키
        const cacheKey = `${cardType}_${cost}_${name}_${icon}`;
        
        // 캐시된 텍스처가 있으면 사용
        if (this.cardTextureCache.has(cacheKey)) {
            const sprite = new PIXI.Sprite(this.cardTextureCache.get(cacheKey));
            sprite.anchor.set(0.5);
            return sprite;
        }
        
        // 오프스크린 캔버스에 카드 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;  // 고해상도
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        
        const colors = this.getCardColors(cardType);
        const borderRadius = 10;
        
        // 카드 배경
        ctx.beginPath();
        this.roundRect(ctx, 2, 2, width - 4, height - 4, borderRadius);
        
        // 그라데이션 배경
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, this.hexToRgba(colors.bg, 1));
        bgGradient.addColorStop(1, this.hexToRgba(colors.bg, 0.8));
        ctx.fillStyle = bgGradient;
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = this.hexToRgba(colors.border, 1);
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 글로우 효과
        ctx.shadowColor = this.hexToRgba(colors.glow, 0.6);
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // 코스트 원
        ctx.beginPath();
        ctx.arc(20, 20, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = colors.border === 0xc0392b ? '#ff6b6b' : '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 코스트 텍스트
        ctx.font = 'bold 18px Cinzel, serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cost.toString(), 20, 21);
        
        // 카드 이름
        ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 8), width / 2, 45);
        
        // 아이콘 (이모지 또는 텍스트)
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 이모지 추출 (HTML 태그 제거)
        let displayIcon = icon;
        if (icon.includes('<img')) {
            displayIcon = '⚔️';  // 이미지 태그면 기본 아이콘 사용
        }
        ctx.fillText(displayIcon, width / 2, height / 2);
        
        // 카드 타입 라벨
        const typeNames = {
            attack: '공격', skill: '스킬', power: '파워', 
            status: '상태', curse: '저주'
        };
        ctx.font = '10px "Noto Sans KR", sans-serif';
        ctx.fillStyle = this.hexToRgba(colors.border, 1);
        ctx.fillText(typeNames[cardType] || cardType, width / 2, height - 20);
        
        // 텍스처 생성 및 캐시
        const texture = PIXI.Texture.from(canvas);
        this.cardTextureCache.set(cacheKey, texture);
        
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        
        return sprite;
    },
    
    // 둥근 사각형 그리기
    roundRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },
    
    // Hex to RGBA
    hexToRgba(hex, alpha) {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    // ==========================================
    // 파티클 이펙트 생성
    // ==========================================
    createParticles(x, y, cardType, count = 10) {
        // PIXI가 없거나 컨테이너가 없으면 DOM 폴백
        if (!this.container || this.useDOMFallback || typeof PIXI === 'undefined') {
            this.createParticlesDOM(x, y, cardType, count);
            return;
        }
        
        const colors = this.getCardColors(cardType);
        
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            const size = 3 + Math.random() * 5;
            
            particle.circle(0, 0, size);
            particle.fill({ color: colors.glow, alpha: 0.8 });
            
            particle.x = x;
            particle.y = y;
            
            this.container.addChild(particle);
            
            // 파티클 애니메이션
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            const lifetime = 400 + Math.random() * 300;
            
            const startTime = performance.now();
            const animate = () => {
                const elapsed = performance.now() - startTime;
                const progress = elapsed / lifetime;
                
                if (progress >= 1) {
                    this.container.removeChild(particle);
                    particle.destroy();
                    return;
                }
                
                particle.x = x + Math.cos(angle) * speed * progress;
                particle.y = y + Math.sin(angle) * speed * progress - 50 * progress;
                particle.alpha = 1 - progress;
                particle.scale.set(1 - progress * 0.5);
                
                requestAnimationFrame(animate);
            };
            
            requestAnimationFrame(animate);
        }
    },
    
    // ==========================================
    // 플래시 효과 (DOM 요소에)
    // ==========================================
    flashElement(el, cardType = 'attack') {
        if (!el) return;
        
        const colors = {
            attack: 'rgba(192, 57, 43, 1)',
            skill: 'rgba(41, 128, 185, 1)',
            power: 'rgba(142, 68, 173, 1)',
            status: 'rgba(107, 114, 128, 1)',
            curse: 'rgba(107, 33, 168, 1)'
        };
        
        const color = colors[cardType] || colors.attack;
        
        el.style.transition = 'box-shadow 0.15s ease';
        el.style.boxShadow = `0 0 50px ${color}, 0 0 100px ${color.replace('1)', '0.5)')}`;
        
        setTimeout(() => {
            el.style.boxShadow = '';
        }, 400);
        
        // Canvas 파티클도 추가
        const rect = el.getBoundingClientRect();
        this.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            cardType,
            15
        );
    },
    
    // ==========================================
    // 카드 → Draw 덱 연출 (DOM 기반 + 파티클)
    // ==========================================
    async cardToDraw(options = {}) {
        await this.init();
        
        const {
            startEl = null,
            startX = null,
            startY = null,
            cost = 0,
            cardType = 'attack',
            icon = '🃏',
            name = '카드',
            onComplete = null
        } = options;
        
        const drawPileEl = document.getElementById('draw-pile');
        if (!drawPileEl) {
            if (onComplete) onComplete();
            return;
        }
        
        const drawRect = drawPileEl.getBoundingClientRect();
        
        // 시작 위치
        let sx = startX ?? window.innerWidth / 2;
        let sy = startY ?? window.innerHeight / 2;
        if (startEl && !startX) {
            const rect = startEl.getBoundingClientRect();
            sx = rect.left + rect.width / 2;
            sy = rect.top + rect.height / 2;
        }
        
        // DOM 기반 카드 생성
        const cardEl = this.createDOMCard({ cost, cardType, icon, name });
        cardEl.style.cssText = `
            position: fixed;
            left: ${sx}px;
            top: ${sy}px;
            transform: translate(-50%, -50%) scale(0.1) rotate(0deg);
            opacity: 0;
            z-index: 10001;
            pointer-events: none;
            transition: none;
        `;
        document.body.appendChild(cardEl);
        
        this.playDrawSound();
        
        // 나타나기 애니메이션
        requestAnimationFrame(() => {
            cardEl.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            cardEl.style.transform = 'translate(-50%, -50%) scale(0.7) rotate(0deg)';
            cardEl.style.opacity = '1';
        });
        
        // 덱으로 이동
        setTimeout(() => {
            cardEl.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            cardEl.style.left = `${drawRect.left + drawRect.width / 2}px`;
            cardEl.style.top = `${drawRect.top + drawRect.height / 2}px`;
            cardEl.style.transform = 'translate(-50%, -50%) scale(0.2) rotate(360deg)';
            cardEl.style.opacity = '0.5';
        }, 400);
        
        // 플래시 및 정리
        setTimeout(() => {
            this.flashElement(drawPileEl, cardType);
            this.createParticles(drawRect.left + drawRect.width / 2, drawRect.top + drawRect.height / 2, cardType, 10);
            cardEl.remove();
            if (onComplete) onComplete();
        }, 900);
    },
    
    // ==========================================
    // Discard → 손패 연출 (DOM 기반 + 파티클)
    // ==========================================
    async discardToHand(options = {}) {
        await this.init();
        
        const {
            cost = 0,
            cardType = 'attack',
            icon = '🃏',
            name = '카드',
            onComplete = null
        } = options;
        
        const discardPileEl = document.getElementById('discard-pile');
        const handEl = document.getElementById('hand');
        
        if (!discardPileEl || !handEl) {
            if (onComplete) onComplete();
            return;
        }
        
        const discardRect = discardPileEl.getBoundingClientRect();
        const handRect = handEl.getBoundingClientRect();
        
        // 버린 카드 더미 플래시
        this.flashElement(discardPileEl, cardType);
        
        // DOM 기반 카드 생성
        const cardEl = this.createDOMCard({ cost, cardType, icon, name });
        cardEl.style.cssText = `
            position: fixed;
            left: ${discardRect.left + discardRect.width / 2}px;
            top: ${discardRect.top + discardRect.height / 2}px;
            transform: translate(-50%, -50%) scale(0.2) rotate(180deg);
            opacity: 0;
            z-index: 10001;
            pointer-events: none;
            transition: none;
        `;
        document.body.appendChild(cardEl);
        
        // 파티클 효과
        this.createParticles(discardRect.left + discardRect.width / 2, discardRect.top + discardRect.height / 2, cardType, 10);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            cardEl.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
            cardEl.style.left = `${handRect.left + handRect.width / 2}px`;
            cardEl.style.top = `${handRect.top + handRect.height / 2}px`;
            cardEl.style.transform = 'translate(-50%, -50%) scale(0.85) rotate(0deg)';
            cardEl.style.opacity = '1';
        });
        
        // 페이드 아웃 및 정리
        setTimeout(() => {
            cardEl.style.transition = 'opacity 0.2s ease-out';
            cardEl.style.opacity = '0';
            
            setTimeout(() => {
                cardEl.remove();
                if (onComplete) onComplete();
            }, 200);
        }, 600);
    },
    
    // ==========================================
    // Draw → 손패 연출 (DOM 기반 + 파티클)
    // ==========================================
    async drawToHand(options = {}) {
        await this.init();
        
        const {
            cost = 0,
            cardType = 'skill',
            icon = '🃏',
            name = '카드',
            onComplete = null
        } = options;
        
        const drawPileEl = document.getElementById('draw-pile');
        const handEl = document.getElementById('hand');
        
        if (!drawPileEl || !handEl) {
            if (onComplete) onComplete();
            return;
        }
        
        const drawRect = drawPileEl.getBoundingClientRect();
        const handRect = handEl.getBoundingClientRect();
        
        // DOM 기반 카드 생성 (실제 카드 디자인 사용)
        const cardEl = this.createDOMCard({ cost, cardType, icon, name });
        cardEl.style.cssText = `
            position: fixed;
            left: ${drawRect.left + drawRect.width / 2}px;
            top: ${drawRect.top + drawRect.height / 2}px;
            transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
            opacity: 0;
            z-index: 10001;
            pointer-events: none;
            transition: none;
        `;
        document.body.appendChild(cardEl);
        
        // 파티클 효과
        this.createParticles(drawRect.left + drawRect.width / 2, drawRect.top + drawRect.height / 2, cardType, 8);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            cardEl.style.transition = 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
            cardEl.style.left = `${handRect.left + handRect.width / 2}px`;
            cardEl.style.top = `${handRect.top + handRect.height / 2}px`;
            cardEl.style.transform = 'translate(-50%, -50%) scale(0.8) rotate(0deg)';
            cardEl.style.opacity = '1';
        });
        
        // 페이드 아웃 및 정리
        setTimeout(() => {
            cardEl.style.transition = 'opacity 0.2s ease-out';
            cardEl.style.opacity = '0';
            
            setTimeout(() => {
                cardEl.remove();
                if (onComplete) onComplete();
            }, 200);
        }, 500);
    },
    
    // DOM 기반 카드 요소 생성 (실제 게임 카드와 동일한 디자인)
    createDOMCard(options = {}) {
        const { cost = 0, cardType = 'attack', icon = '🃏', name = '카드' } = options;
        
        const cardEl = document.createElement('div');
        cardEl.className = `card ${cardType}`;
        
        // 카드 HTML 구조 (실제 게임과 동일)
        cardEl.innerHTML = `
            <div class="card-cost">${cost}</div>
            <div class="card-header">
                <div class="card-name">${name}</div>
                <div class="card-type">${this.getTypeName(cardType)}</div>
            </div>
            <div class="card-image">${icon}</div>
            <div class="card-description"></div>
        `;
        
        return cardEl;
    },
    
    getTypeName(type) {
        const names = { attack: '공격', skill: '스킬', power: '파워', status: '상태', curse: '저주' };
        return names[type] || type;
    },
    
    // ==========================================
    // 손패 → Discard 연출 (DOM 기반 + 파티클)
    // ==========================================
    async handToDiscard(options = {}) {
        await this.init();
        
        const {
            startEl = null,
            cost = 0,
            cardType = 'status',
            icon = '🃏',
            name = '카드',
            onComplete = null
        } = options;
        
        const discardPileEl = document.getElementById('discard-pile');
        if (!discardPileEl) {
            if (onComplete) onComplete();
            return;
        }
        
        const discardRect = discardPileEl.getBoundingClientRect();
        
        let sx = window.innerWidth / 2;
        let sy = window.innerHeight * 0.7;
        if (startEl) {
            const rect = startEl.getBoundingClientRect();
            sx = rect.left + rect.width / 2;
            sy = rect.top + rect.height / 2;
        }
        
        // DOM 기반 카드 생성
        const cardEl = this.createDOMCard({ cost, cardType, icon, name });
        cardEl.style.cssText = `
            position: fixed;
            left: ${sx}px;
            top: ${sy}px;
            transform: translate(-50%, -50%) scale(0.7) rotate(0deg);
            opacity: 1;
            z-index: 10001;
            pointer-events: none;
            transition: none;
        `;
        document.body.appendChild(cardEl);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            cardEl.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            cardEl.style.left = `${discardRect.left + discardRect.width / 2}px`;
            cardEl.style.top = `${discardRect.top + discardRect.height / 2}px`;
            cardEl.style.transform = 'translate(-50%, -50%) scale(0.25) rotate(180deg)';
            cardEl.style.opacity = '0.5';
        });
        
        // 플래시 및 정리
        setTimeout(() => {
            this.flashElement(discardPileEl, cardType);
            this.createParticles(discardRect.left + discardRect.width / 2, discardRect.top + discardRect.height / 2, cardType, 8);
            cardEl.remove();
            if (onComplete) onComplete();
        }, 500);
    },
    
    // ==========================================
    // 카드 강화 연출
    // ==========================================
    async cardUpgrade(options = {}) {
        await this.init();
        
        if (this.useDOMFallback) {
            return this.cardUpgradeDOM(options);
        }
        
        const {
            cost = 0,
            cardType = 'attack',
            icon = '⚔️',
            name = '카드',
            onComplete = null
        } = options;
        
        // 배경 오버레이
        const overlay = new PIXI.Graphics();
        overlay.rect(0, 0, window.innerWidth, window.innerHeight);
        overlay.fill({ color: 0x000000, alpha: 0 });
        this.container.addChild(overlay);
        
        // 페이드 인
        const fadeIn = () => {
            let alpha = 0;
            const animate = () => {
                alpha += 0.05;
                overlay.clear();
                overlay.rect(0, 0, window.innerWidth, window.innerHeight);
                overlay.fill({ color: 0x000000, alpha: Math.min(alpha, 0.7) });
                if (alpha < 0.7) requestAnimationFrame(animate);
            };
            animate();
        };
        fadeIn();
        
        // 카드 스프라이트
        const sprite = this.createCardSprite({ cost, cardType, icon, name, width: 150, height: 210 });
        sprite.x = window.innerWidth / 2;
        sprite.y = window.innerHeight / 2;
        sprite.scale.set(0);
        sprite.alpha = 0;
        
        this.container.addChild(sprite);
        
        // 나타나기 애니메이션
        setTimeout(() => {
            this.activeAnimations.push({
                sprite,
                startTime: performance.now(),
                duration: 500,
                startX: sprite.x,
                startY: sprite.y,
                endX: sprite.x,
                endY: sprite.y,
                startScale: 0,
                endScale: 1.2,
                startRotation: -0.3,
                endRotation: 0,
                startAlpha: 0,
                endAlpha: 1,
                cardType
            });
        }, 100);
        
        // 강화 이펙트
        setTimeout(() => {
            // 글로우 파티클
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    this.createParticles(sprite.x, sprite.y, cardType, 3);
                }, i * 30);
            }
        }, 700);
        
        // 완료 및 정리
        setTimeout(() => {
            // 페이드 아웃
            let alpha = 0.7;
            const fadeOut = () => {
                alpha -= 0.05;
                overlay.clear();
                overlay.rect(0, 0, window.innerWidth, window.innerHeight);
                overlay.fill({ color: 0x000000, alpha: Math.max(alpha, 0) });
                sprite.alpha = Math.max(alpha / 0.7, 0);
                
                if (alpha > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    this.container.removeChild(overlay);
                    this.container.removeChild(sprite);
                    overlay.destroy();
                    sprite.destroy();
                    if (onComplete) onComplete();
                }
            };
            fadeOut();
        }, 1800);
    },
    
    // ==========================================
    // 카드 소멸 연출
    // ==========================================
    async cardExhaust(options = {}) {
        await this.init();
        
        if (this.useDOMFallback) {
            return this.cardExhaustDOM(options);
        }
        
        const {
            cost = 0,
            cardType = 'attack',
            icon = '⚔️',
            name = '카드',
            onComplete = null
        } = options;
        
        // 배경 오버레이
        const overlay = new PIXI.Graphics();
        overlay.rect(0, 0, window.innerWidth, window.innerHeight);
        overlay.fill({ color: 0x100000, alpha: 0 });
        this.container.addChild(overlay);
        
        // 페이드 인
        let overlayAlpha = 0;
        const fadeIn = setInterval(() => {
            overlayAlpha += 0.05;
            overlay.clear();
            overlay.rect(0, 0, window.innerWidth, window.innerHeight);
            overlay.fill({ color: 0x100000, alpha: Math.min(overlayAlpha, 0.75) });
            if (overlayAlpha >= 0.75) clearInterval(fadeIn);
        }, 16);
        
        // 카드 스프라이트
        const sprite = this.createCardSprite({ cost, cardType, icon, name, width: 150, height: 210 });
        sprite.x = window.innerWidth / 2;
        sprite.y = window.innerHeight / 2;
        sprite.scale.set(0);
        
        this.container.addChild(sprite);
        
        // 나타나기
        this.activeAnimations.push({
            sprite,
            startTime: performance.now(),
            duration: 500,
            startX: sprite.x,
            startY: sprite.y,
            endX: sprite.x,
            endY: sprite.y,
            startScale: 0,
            endScale: 1.2,
            startRotation: 0.2,
            endRotation: 0,
            startAlpha: 0,
            endAlpha: 1,
            cardType
        });
        
        // 깨지기 효과
        setTimeout(() => {
            // 파편 생성
            for (let i = 0; i < 20; i++) {
                const shard = new PIXI.Graphics();
                const size = 8 + Math.random() * 12;
                const colors = this.getCardColors(cardType);
                
                shard.rect(-size/2, -size/2, size, size);
                shard.fill({ color: colors.border });
                
                shard.x = sprite.x + (Math.random() - 0.5) * 80;
                shard.y = sprite.y + (Math.random() - 0.5) * 100;
                
                this.container.addChild(shard);
                
                // 파편 애니메이션
                const startTime = performance.now();
                const tx = (Math.random() - 0.5) * 300;
                const ty = 100 + Math.random() * 200;
                const rot = (Math.random() - 0.5) * 10;
                
                const animateShard = () => {
                    const elapsed = performance.now() - startTime;
                    const progress = elapsed / 800;
                    
                    if (progress >= 1) {
                        this.container.removeChild(shard);
                        shard.destroy();
                        return;
                    }
                    
                    shard.x = sprite.x + tx * progress;
                    shard.y = sprite.y + ty * progress;
                    shard.rotation = rot * progress;
                    shard.alpha = 1 - progress;
                    
                    requestAnimationFrame(animateShard);
                };
                
                setTimeout(() => requestAnimationFrame(animateShard), Math.random() * 200);
            }
            
            // 카드 사라지기
            sprite.scale.set(0);
            sprite.alpha = 0;
        }, 700);
        
        // 완료 및 정리
        setTimeout(() => {
            overlayAlpha = 0.75;
            const fadeOut = setInterval(() => {
                overlayAlpha -= 0.05;
                overlay.clear();
                overlay.rect(0, 0, window.innerWidth, window.innerHeight);
                overlay.fill({ color: 0x100000, alpha: Math.max(overlayAlpha, 0) });
                
                if (overlayAlpha <= 0) {
                    clearInterval(fadeOut);
                    this.container.removeChild(overlay);
                    this.container.removeChild(sprite);
                    overlay.destroy();
                    sprite.destroy();
                    if (onComplete) onComplete();
                }
            }, 16);
        }, 1500);
    },
    
    // ==========================================
    // 저주 카드 획득 연출
    // ==========================================
    async curseCardToDeck(options = {}) {
        await this.init();
        
        if (this.useDOMFallback) {
            return this.curseCardToDeckDOM(options);
        }
        
        const {
            cost = -1,
            icon = '⛓',
            name = '속박',
            onComplete = null
        } = options;
        
        const drawPileEl = document.getElementById('draw-pile');
        
        let deckX = window.innerWidth / 2;
        let deckY = window.innerHeight - 100;
        
        if (drawPileEl) {
            const rect = drawPileEl.getBoundingClientRect();
            deckX = rect.left + rect.width / 2;
            deckY = rect.top + rect.height / 2;
        }
        
        // 배경 오버레이
        const overlay = new PIXI.Graphics();
        overlay.rect(0, 0, window.innerWidth, window.innerHeight);
        overlay.fill({ color: 0x100010, alpha: 0 });
        this.container.addChild(overlay);
        
        // 페이드 인
        let overlayAlpha = 0;
        const fadeIn = setInterval(() => {
            overlayAlpha += 0.05;
            overlay.clear();
            overlay.rect(0, 0, window.innerWidth, window.innerHeight);
            overlay.fill({ color: 0x100010, alpha: Math.min(overlayAlpha, 0.75) });
            if (overlayAlpha >= 0.75) clearInterval(fadeIn);
        }, 16);
        
        // 저주 카드 스프라이트
        const sprite = this.createCardSprite({ cost, cardType: 'curse', icon, name, width: 150, height: 210 });
        sprite.x = window.innerWidth / 2;
        sprite.y = window.innerHeight / 2;
        sprite.scale.set(0);
        
        this.container.addChild(sprite);
        
        // 나타나기
        this.activeAnimations.push({
            sprite,
            startTime: performance.now(),
            duration: 600,
            startX: sprite.x,
            startY: sprite.y,
            endX: sprite.x,
            endY: sprite.y,
            startScale: 0,
            endScale: 1.2,
            startRotation: -0.5,
            endRotation: 0,
            startAlpha: 0,
            endAlpha: 1,
            cardType: 'curse',
            nextPhase: {
                duration: 800,
                endX: deckX,
                endY: deckY,
                endScale: 0.2,
                endRotation: Math.PI * 4,
                endAlpha: 0.3,
                nextPhase: null
            }
        });
        
        // 완료 및 정리
        setTimeout(() => {
            if (drawPileEl) {
                this.flashElement(drawPileEl, 'curse');
            }
            
            overlayAlpha = 0.75;
            const fadeOut = setInterval(() => {
                overlayAlpha -= 0.05;
                overlay.clear();
                overlay.rect(0, 0, window.innerWidth, window.innerHeight);
                overlay.fill({ color: 0x100010, alpha: Math.max(overlayAlpha, 0) });
                
                if (overlayAlpha <= 0) {
                    clearInterval(fadeOut);
                    this.container.removeChild(overlay);
                    overlay.destroy();
                    if (onComplete) onComplete();
                }
            }, 16);
        }, 1600);
    },
    
    // ==========================================
    // 핸드 셔플 연출
    // ==========================================
    async handShuffle(options = {}) {
        await this.init();
        
        if (this.useDOMFallback) {
            return this.handShuffleDOM(options);
        }
        
        const {
            cardCount = 4,
            onScatterComplete = null,
            onDrawComplete = null
        } = options;
        
        const handEl = document.getElementById('hand');
        const discardPileEl = document.getElementById('discard-pile');
        const drawPileEl = document.getElementById('draw-pile');
        
        if (!handEl) {
            if (onScatterComplete) onScatterComplete();
            return;
        }
        
        const handRect = handEl.getBoundingClientRect();
        const discardRect = discardPileEl?.getBoundingClientRect();
        const drawRect = drawPileEl?.getBoundingClientRect();
        
        // 카드 뒷면 스프라이트 생성
        const cards = [];
        for (let i = 0; i < cardCount; i++) {
            const card = this.createCardBackSprite();
            const startX = handRect.left + (handRect.width * (i + 0.5) / cardCount);
            const startY = handRect.top + handRect.height / 2;
            
            card.x = startX;
            card.y = startY;
            card.scale.set(0.5);
            
            this.container.addChild(card);
            cards.push({ sprite: card, startX, startY });
        }
        
        // Discard로 날아가기
        cards.forEach((card, idx) => {
            setTimeout(() => {
                if (discardRect) {
                    this.activeAnimations.push({
                        sprite: card.sprite,
                        startTime: performance.now(),
                        duration: 300,
                        startX: card.startX,
                        startY: card.startY,
                        endX: discardRect.left + discardRect.width / 2,
                        endY: discardRect.top + discardRect.height / 2,
                        startScale: 0.5,
                        endScale: 0.2,
                        startRotation: 0,
                        endRotation: (Math.random() - 0.5) * 2 + Math.PI,
                        startAlpha: 1,
                        endAlpha: 0.4,
                        cardType: 'skill'
                    });
                }
            }, idx * 40);
        });
        
        // Discard 반짝임
        if (discardPileEl) {
            setTimeout(() => {
                this.flashElement(discardPileEl, 'skill');
            }, cardCount * 40 + 200);
        }
        
        // 콜백
        setTimeout(() => {
            if (onScatterComplete) onScatterComplete();
        }, cardCount * 40 + 100);
        
        // 드로우 연출
        setTimeout(() => {
            if (drawRect && cardCount > 0) {
                this.drawMultipleCards({
                    count: cardCount,
                    drawRect,
                    handRect,
                    onComplete: onDrawComplete
                });
            } else if (onDrawComplete) {
                onDrawComplete();
            }
        }, cardCount * 40 + 350);
    },
    
    // 카드 뒷면 스프라이트 생성
    createCardBackSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 140;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // 배경
        ctx.fillStyle = '#1a1a2e';
        this.roundRect(ctx, 2, 2, 66, 96, 8);
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 패턴
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(10 + i * 10, 10);
            ctx.lineTo(60 - i * 5, 90);
            ctx.stroke();
        }
        
        const texture = PIXI.Texture.from(canvas);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        
        return sprite;
    },
    
    // 여러 카드 드로우 연출
    drawMultipleCards(options = {}) {
        const { count = 1, drawRect, handRect, onComplete } = options;
        
        const drawPileEl = document.getElementById('draw-pile');
        if (drawPileEl) {
            this.flashElement(drawPileEl, 'skill');
        }
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const card = this.createCardBackSprite();
                card.x = drawRect.left + drawRect.width / 2;
                card.y = drawRect.top + drawRect.height / 2;
                card.scale.set(0.2);
                card.alpha = 0;
                
                this.container.addChild(card);
                
                const targetX = handRect.left + (handRect.width * (i + 0.5) / count);
                const targetY = handRect.top + handRect.height / 2;
                
                this.activeAnimations.push({
                    sprite: card,
                    startTime: performance.now(),
                    duration: 350,
                    startX: card.x,
                    startY: card.y,
                    endX: targetX,
                    endY: targetY,
                    startScale: 0.2,
                    endScale: 0.5,
                    startRotation: 0,
                    endRotation: 0,
                    startAlpha: 0,
                    endAlpha: 0,
                    cardType: 'skill',
                    onComplete: i === count - 1 ? onComplete : null
                });
            }, i * 60);
        }
    },
    
    // ==========================================
    // 덱 리셔플 연출 (Discard → Draw Pile) - 카드 뒷면
    // ==========================================
    async deckReshuffle(options = {}) {
        const {
            cardCount = 5,
            onComplete = null
        } = options;
        
        const discardPileEl = document.getElementById('discard-pile');
        const drawPileEl = document.getElementById('draw-pile');
        
        if (!discardPileEl || !drawPileEl) {
            if (onComplete) onComplete();
            return;
        }
        
        const discardRect = discardPileEl.getBoundingClientRect();
        const drawRect = drawPileEl.getBoundingClientRect();
        
        // 리셔플 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('card_draw', { volume: 0.5 });
        }
        
        // 표시할 카드 수 (최대 5장)
        const displayCount = Math.min(cardCount, 5);
        
        // 카드 뒷면들 생성 및 애니메이션
        for (let i = 0; i < displayCount; i++) {
            setTimeout(() => {
                // 카드 뒷면 생성
                const cardBack = document.createElement('div');
                cardBack.className = 'reshuffle-card-back';
                
                const startX = discardRect.left + discardRect.width / 2;
                const startY = discardRect.top + discardRect.height / 2;
                const endX = drawRect.left + drawRect.width / 2;
                const endY = drawRect.top + drawRect.height / 2;
                
                // 약간의 랜덤 오프셋
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetY = (Math.random() - 0.5) * 10;
                
                cardBack.style.cssText = `
                    position: fixed;
                    width: 50px;
                    height: 70px;
                    left: ${startX}px;
                    top: ${startY}px;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%);
                    border: 2px solid #c9a55c;
                    border-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5), inset 0 0 20px rgba(201,165,92,0.1);
                    z-index: ${50 + i};
                    pointer-events: none;
                    opacity: 1;
                    transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                `;
                
                // 카드 뒷면 패턴
                const pattern = document.createElement('div');
                pattern.style.cssText = `
                    position: absolute;
                    inset: 4px;
                    border: 1px solid rgba(201,165,92,0.3);
                    border-radius: 3px;
                    background: repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 5px,
                        rgba(201,165,92,0.05) 5px,
                        rgba(201,165,92,0.05) 10px
                    );
                `;
                
                // 중앙 심볼
                const symbol = document.createElement('div');
                symbol.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.2rem;
                    color: #c9a55c;
                    opacity: 0.6;
                `;
                symbol.textContent = '✦';
                
                cardBack.appendChild(pattern);
                cardBack.appendChild(symbol);
                document.body.appendChild(cardBack);
                
                // 애니메이션 시작 (다음 프레임에서)
                requestAnimationFrame(() => {
                    cardBack.style.left = `${endX + offsetX}px`;
                    cardBack.style.top = `${endY + offsetY}px`;
                    cardBack.style.opacity = '0.8';
                    cardBack.style.transform = 'translate(-50%, -50%) scale(0.8)';
                });
                
                // 애니메이션 완료 후 제거
                setTimeout(() => {
                    cardBack.style.opacity = '0';
                    cardBack.style.transform = 'translate(-50%, -50%) scale(0.5)';
                    setTimeout(() => cardBack.remove(), 200);
                    
                    // 마지막 카드일 때 효과
                    if (i === displayCount - 1) {
                        this.flashElement(drawPileEl, 'skill');
                    }
                }, 350);
                
            }, i * 60); // 60ms 간격
        }
        
        // 완료 콜백
        const totalDuration = displayCount * 60 + 600;
        setTimeout(() => {
            if (onComplete) onComplete();
        }, totalDuration);
    },
    
    // ==========================================
    // 베지어 곡선 애니메이션
    // ==========================================
    animateBezier(element, options) {
        const {
            startX, startY,
            controlX, controlY,
            endX, endY,
            duration = 500,
            startScale = 1,
            endScale = 1,
            startRotation = 0,
            endRotation = 0,
            onComplete = null
        } = options;
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 이징 함수 (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            
            // 2차 베지어 곡선 계산
            const t = eased;
            const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
            const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;
            
            // 스케일 & 회전 보간
            const scale = startScale + (endScale - startScale) * eased;
            const rotation = startRotation + (endRotation - startRotation) * eased;
            
            // 페이드 아웃 (마지막 30%에서)
            const opacity = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 * 0.7 : 0.9;
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            element.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
            element.style.opacity = opacity;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // DOM 폴백 메서드들 (PIXI 사용 불가 시)
    // ==========================================
    cardToDrawDOM(options) { this.legacyCardToDraw(options); },
    discardToHandDOM(options) { this.legacyDiscardToHand(options); },
    drawToHandDOM(options) { this.legacyDrawToHand(options); },
    handToDiscardDOM(options) { this.legacyHandToDiscard(options); },
    cardUpgradeDOM(options) { if (options.onComplete) setTimeout(options.onComplete, 1000); },
    cardExhaustDOM(options) { if (options.onComplete) setTimeout(options.onComplete, 1000); },
    curseCardToDeckDOM(options) { if (options.onComplete) setTimeout(options.onComplete, 1000); },
    handShuffleDOM(options) { 
        if (options.onScatterComplete) setTimeout(options.onScatterComplete, 500);
        if (options.onDrawComplete) setTimeout(options.onDrawComplete, 1000);
    },
    deckReshuffleDOM(options) {
        if (options.onComplete) setTimeout(options.onComplete, 800);
    },
    
    // 레거시 DOM 메서드 (간단한 구현)
    legacyCardToDraw(options) {
        const el = document.createElement('div');
        el.style.cssText = `
            position: fixed;
            left: ${options.startX || window.innerWidth/2}px;
            top: ${options.startY || window.innerHeight/2}px;
            transform: translate(-50%, -50%);
            background: #333;
            padding: 10px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            transition: all 0.5s;
        `;
        el.textContent = options.name || '카드';
        document.body.appendChild(el);
        
        setTimeout(() => {
            const draw = document.getElementById('draw-pile');
            if (draw) {
                const rect = draw.getBoundingClientRect();
                el.style.left = rect.left + rect.width/2 + 'px';
                el.style.top = rect.top + rect.height/2 + 'px';
                el.style.transform = 'translate(-50%, -50%) scale(0.3)';
                el.style.opacity = '0';
            }
        }, 100);
        
        setTimeout(() => {
            el.remove();
            if (options.onComplete) options.onComplete();
        }, 600);
    },
    
    legacyDiscardToHand(options) {
        if (options.onComplete) setTimeout(options.onComplete, 500);
    },
    
    legacyDrawToHand(options) {
        if (options.onComplete) setTimeout(options.onComplete, 500);
    },
    
    legacyHandToDiscard(options) {
        if (options.onComplete) setTimeout(options.onComplete, 500);
    },
    
    // DOM 기반 파티클 폴백
    createParticlesDOM(x, y, cardType, count = 10) {
        const colors = {
            attack: '#ef4444',
            skill: '#3b82f6',
            power: '#a855f7',
            status: '#6b7280',
            curse: '#6b21a8'
        };
        const color = colors[cardType] || colors.attack;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = 4 + Math.random() * 6;
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const duration = 400 + Math.random() * 300;
            
            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance - 30;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10001;
                box-shadow: 0 0 ${size}px ${color};
                transition: all ${duration}ms ease-out;
                opacity: 1;
            `;
            
            document.body.appendChild(particle);
            
            // 애니메이션 시작
            requestAnimationFrame(() => {
                particle.style.left = `${endX}px`;
                particle.style.top = `${endY}px`;
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0.3)';
            });
            
            // 제거
            setTimeout(() => particle.remove(), duration);
        }
    },
    
    // ==========================================
    // 카드 진화 연출 (몰아치기 → 폭풍의 일격)
    // ==========================================
    async cardEvolution(options = {}) {
        await this.init();
        
        const {
            oldCard = { name: '몰아치기', icon: '🌊⚔️', cost: 1, type: 'attack' },
            newCard = { name: '폭풍의 일격', icon: '⛈️⚔️', cost: 1, type: 'attack' },
            onComplete = null
        } = options;
        
        // 오버레이 생성
        const overlay = document.createElement('div');
        overlay.id = 'evolution-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.4s ease;
            display: flex;
            justify-content: center;
            align-items: center;
            perspective: 1000px;
        `;
        document.body.appendChild(overlay);
        
        // 페이드 인
        requestAnimationFrame(() => overlay.style.opacity = '1');
        
        // 컨테이너
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 80px;
            transform-style: preserve-3d;
        `;
        overlay.appendChild(container);
        
        // 구 카드 생성
        const oldCardEl = this.createEvolutionCard(oldCard, 'old');
        container.appendChild(oldCardEl);
        
        // 화살표
        const arrow = document.createElement('div');
        arrow.innerHTML = '⚡';
        arrow.style.cssText = `
            font-size: 4rem;
            color: #fbbf24;
            text-shadow: 0 0 30px #f59e0b, 0 0 60px #d97706;
            opacity: 0;
            transform: scale(0);
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        container.appendChild(arrow);
        
        // 신 카드 생성
        const newCardEl = this.createEvolutionCard(newCard, 'new');
        newCardEl.style.opacity = '0';
        newCardEl.style.transform = 'scale(0.5) rotateY(90deg)';
        container.appendChild(newCardEl);
        
        // 타이틀
        const title = document.createElement('div');
        title.textContent = 'EVOLUTION';
        title.style.cssText = `
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%) scale(0);
            font-size: 3.5rem;
            font-weight: bold;
            font-family: 'Cinzel', serif;
            color: #fbbf24;
            text-shadow: 0 0 20px #f59e0b, 0 0 40px #d97706, 0 0 60px #b45309;
            letter-spacing: 15px;
            opacity: 0;
            transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        overlay.appendChild(title);
        
        // 파티클 컨테이너
        const particleContainer = document.createElement('div');
        particleContainer.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        overlay.appendChild(particleContainer);
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('powerup');
        }
        
        // 애니메이션 시퀀스
        // 1. 구 카드 등장
        setTimeout(() => {
            oldCardEl.style.transform = 'scale(1) rotateY(0deg)';
            oldCardEl.style.opacity = '1';
        }, 200);
        
        // 2. 구 카드 빛나기 + 흔들림
        setTimeout(() => {
            oldCardEl.style.boxShadow = '0 0 50px #fbbf24, 0 0 100px #f59e0b';
            oldCardEl.style.animation = 'evolutionShake 0.1s infinite';
            this.createEvolutionParticles(particleContainer, oldCardEl);
        }, 800);
        
        // 3. 타이틀 등장
        setTimeout(() => {
            title.style.transform = 'translateX(-50%) scale(1)';
            title.style.opacity = '1';
        }, 1000);
        
        // 4. 화살표 등장
        setTimeout(() => {
            arrow.style.transform = 'scale(1)';
            arrow.style.opacity = '1';
        }, 1200);
        
        // 5. 구 카드 사라지기 + 신 카드 등장
        setTimeout(() => {
            oldCardEl.style.transform = 'scale(0.8) rotateY(-90deg)';
            oldCardEl.style.opacity = '0';
            
            // 폭발 파티클
            this.createExplosionParticles(particleContainer);
        }, 1500);
        
        setTimeout(() => {
            newCardEl.style.transform = 'scale(1.1) rotateY(0deg)';
            newCardEl.style.opacity = '1';
            newCardEl.style.boxShadow = '0 0 60px #60a5fa, 0 0 120px #3b82f6';
        }, 1700);
        
        // 6. 카드 안정화
        setTimeout(() => {
            newCardEl.style.transform = 'scale(1) rotateY(0deg)';
            newCardEl.style.boxShadow = '0 0 30px rgba(96, 165, 250, 0.5)';
        }, 2200);
        
        // 7. 종료
        setTimeout(() => {
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                overlay.remove();
                if (onComplete) onComplete();
            }, 400);
        }, 2800);
    },
    
    // 진화 카드 요소 생성
    createEvolutionCard(cardData, type) {
        const card = document.createElement('div');
        const isOld = type === 'old';
        const bgColor = isOld ? 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' : 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #312e81 100%)';
        const borderColor = isOld ? '#3b82f6' : '#fbbf24';
        
        card.style.cssText = `
            width: 180px;
            height: 250px;
            background: ${bgColor};
            border: 3px solid ${borderColor};
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 15px;
            box-shadow: 0 0 20px rgba(${isOld ? '59, 130, 246' : '251, 191, 36'}, 0.5);
            transform: scale(0.8) rotateY(${isOld ? '-30deg' : '30deg'});
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        `;
        
        // 코스트
        const cost = document.createElement('div');
        cost.textContent = cardData.cost;
        cost.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            width: 35px;
            height: 35px;
            background: #1a1a2e;
            border: 2px solid ${borderColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
            font-weight: bold;
            color: white;
        `;
        card.appendChild(cost);
        
        // 이름
        const name = document.createElement('div');
        name.textContent = cardData.name;
        name.style.cssText = `
            font-size: 1.1rem;
            font-weight: bold;
            color: white;
            text-align: center;
            margin-top: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        `;
        card.appendChild(name);
        
        // 아이콘
        const icon = document.createElement('div');
        icon.innerHTML = cardData.icon.includes('<img') ? cardData.icon : cardData.icon;
        icon.style.cssText = `
            font-size: 4rem;
            margin: 20px 0;
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
        `;
        card.appendChild(icon);
        
        // 타입 라벨
        const typeLabel = document.createElement('div');
        typeLabel.textContent = isOld ? '공격' : '공격 ★';
        typeLabel.style.cssText = `
            position: absolute;
            bottom: 15px;
            font-size: 0.9rem;
            color: ${borderColor};
            font-weight: bold;
        `;
        card.appendChild(typeLabel);
        
        // 빛나는 효과
        const shine = document.createElement('div');
        shine.style.cssText = `
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
            animation: ${isOld ? '' : 'cardShine 2s infinite'};
        `;
        card.appendChild(shine);
        
        return card;
    },
    
    // 진화 파티클 생성
    createEvolutionParticles(container, sourceEl) {
        const rect = sourceEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const size = 4 + Math.random() * 8;
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 100;
                const duration = 600 + Math.random() * 400;
                
                particle.style.cssText = `
                    position: fixed;
                    left: ${centerX}px;
                    top: ${centerY}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: #fbbf24;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10002;
                    box-shadow: 0 0 ${size * 2}px #f59e0b;
                    transition: all ${duration}ms ease-out;
                `;
                container.appendChild(particle);
                
                requestAnimationFrame(() => {
                    particle.style.left = `${centerX + Math.cos(angle) * distance}px`;
                    particle.style.top = `${centerY + Math.sin(angle) * distance}px`;
                    particle.style.opacity = '0';
                    particle.style.transform = 'scale(0)';
                });
                
                setTimeout(() => particle.remove(), duration);
            }, i * 30);
        }
    },
    
    // 폭발 파티클
    createExplosionParticles(container) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            const size = 3 + Math.random() * 10;
            const angle = (i / 50) * Math.PI * 2;
            const distance = 150 + Math.random() * 200;
            const duration = 500 + Math.random() * 300;
            const color = Math.random() > 0.5 ? '#fbbf24' : '#60a5fa';
            
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10002;
                box-shadow: 0 0 ${size * 2}px ${color};
                transition: all ${duration}ms cubic-bezier(0, 0.5, 0.5, 1);
            `;
            container.appendChild(particle);
            
            requestAnimationFrame(() => {
                particle.style.left = `${centerX + Math.cos(angle) * distance}px`;
                particle.style.top = `${centerY + Math.sin(angle) * distance - 50}px`;
                particle.style.opacity = '0';
            });
            
            setTimeout(() => particle.remove(), duration);
        }
    }
};

// ==========================================
// 전역 헬퍼 함수
// ==========================================

function getCardDataFromDatabase(cardId) {
    if (typeof cardDatabase !== 'undefined' && cardDatabase[cardId]) {
        const card = cardDatabase[cardId];
        return {
            cost: card.cost,
            cardType: card.type,
            icon: card.icon,
            name: card.name,
            description: card.description
        };
    }
    return null;
}

function showChakramCardToDraw(enemyEl) {
    let startX, startY;
    if (enemyEl) {
        const rect = enemyEl.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
    }
    
    const cardData = getCardDataFromDatabase('chakramReturn');
    if (!cardData) return;
    
    CardAnimation.cardToDraw({
        startX,
        startY,
        ...cardData
    });
}

function showChakramCardFromDiscard(onComplete) {
    const cardData = getCardDataFromDatabase('chakramThrow');
    if (!cardData) return;
    
    CardAnimation.discardToHand({
        ...cardData,
        onComplete
    });
}

function showWebCardToDraw(enemyEl, count = 1) {
    let startX, startY;
    if (enemyEl) {
        const rect = enemyEl.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
    }
    
    const cardData = getCardDataFromDatabase('webTangle');
    if (!cardData) return;
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            CardAnimation.cardToDraw({
                startX: startX ? startX + (Math.random() - 0.5) * 50 : undefined,
                startY: startY ? startY + (Math.random() - 0.5) * 50 : undefined,
                ...cardData
            });
        }, i * 200);
    }
}

// 진화 애니메이션 CSS 추가
if (!document.getElementById('evolution-animation-style')) {
    const style = document.createElement('style');
    style.id = 'evolution-animation-style';
    style.textContent = `
        @keyframes evolutionShake {
            0%, 100% { transform: scale(1) translateX(0); }
            25% { transform: scale(1) translateX(-3px) rotate(-1deg); }
            75% { transform: scale(1) translateX(3px) rotate(1deg); }
        }
        @keyframes cardShine {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
        }
    `;
    document.head.appendChild(style);
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    CardAnimation.init();
});

if (document.readyState !== 'loading') {
    CardAnimation.init();
}

// 전역 등록
window.CardAnimation = CardAnimation;

console.log('[CardAnimation] Canvas 기반 카드 애니메이션 시스템 로드됨');
