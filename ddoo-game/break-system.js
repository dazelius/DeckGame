// =====================================================
// Break System - 브레이크 시스템 (DDOO Game 적응)
// 인텐트 기반 약점 파괴 시스템
// =====================================================

const BreakSystem = {
    game: null,
    
    // 속성 타입 정의
    ElementType: {
        PHYSICAL: 'physical',
        FIRE: 'fire',
        ICE: 'ice',
        LIGHTNING: 'lightning',
        BLEED: 'bleed',
        POISON: 'poison',
        MAGIC: 'magic',
        DARK: 'dark'
    },
    
    // 속성 아이콘 매핑
    ElementIcons: {
        physical: '⚔️',
        fire: '🔥',
        ice: '❄️',
        lightning: '⚡',
        bleed: '🩸',
        poison: '☠️',
        magic: '✨',
        dark: '🌑'
    },
    
    // 속성 색상 매핑
    ElementColors: {
        physical: '#f59e0b',
        fire: '#ef4444',
        ice: '#3b82f6',
        lightning: '#eab308',
        bleed: '#dc2626',
        poison: '#22c55e',
        magic: '#a855f7',
        dark: '#6366f1'
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        this.injectStyles();
        console.log('[BreakSystem] 브레이크 시스템 초기화 완료');
    },
    
    // ==========================================
    // 현재 인텐트가 브레이크 가능한지 확인
    // ==========================================
    hasBreakableIntent(enemy) {
        if (!enemy || !enemy.currentBreakRecipe) return false;
        return enemy.currentBreakRecipe.length > 0;
    },
    
    // ==========================================
    // 인텐트 선택 시 브레이크 상태 초기화
    // ==========================================
    onIntentSelected(enemy, intentData) {
        // 이전 브레이크 상태 초기화
        enemy.currentBreakRecipe = null;
        enemy.breakProgress = [];
        enemy.isBroken = false;
        
        // 인텐트에 breakRecipe가 있으면 설정
        if (intentData && intentData.breakRecipe && intentData.breakRecipe.length > 0) {
            enemy.currentBreakRecipe = [...intentData.breakRecipe];
            enemy.breakProgress = [];
            enemy.breakShield = intentData.breakRecipe.length;
            enemy.maxBreakShield = intentData.breakRecipe.length;
            
            console.log(`[BreakSystem] ${enemy.name || enemy.type}: 브레이크 가능! 레시피: ${intentData.breakRecipe.join(' → ')}`);
        }
    },
    
    // ==========================================
    // 카드 속성 가져오기
    // ==========================================
    getCardElement(card) {
        if (!card) return this.ElementType.PHYSICAL;
        
        // 카드에 명시적 element가 있으면 사용
        if (card.element) return card.element;
        
        // 카드 ID 기반 추론
        const cardId = card.id || '';
        if (cardId.includes('fire') || cardId.includes('burn') || cardId.includes('flame')) {
            return this.ElementType.FIRE;
        }
        if (cardId.includes('ice') || cardId.includes('frost') || cardId.includes('freeze')) {
            return this.ElementType.ICE;
        }
        if (cardId.includes('lightning') || cardId.includes('shock') || cardId.includes('thunder')) {
            return this.ElementType.LIGHTNING;
        }
        if (cardId.includes('bleed') || cardId.includes('lacerate')) {
            return this.ElementType.BLEED;
        }
        if (cardId.includes('poison') || cardId.includes('venom') || cardId.includes('toxic')) {
            return this.ElementType.POISON;
        }
        if (cardId.includes('dark') || cardId.includes('shadow')) {
            return this.ElementType.DARK;
        }
        if (card.type === 'skill') {
            return this.ElementType.MAGIC;
        }
        
        return this.ElementType.PHYSICAL;
    },
    
    // ==========================================
    // 공격 시 브레이크 진행
    // ==========================================
    onAttack(enemy, cardDef, hitCount = 1) {
        if (!this.hasBreakableIntent(enemy)) return { hit: false, broken: false };
        if (enemy.isBroken) return { hit: false, broken: false };
        
        const element = this.getCardElement(cardDef);
        const recipe = enemy.currentBreakRecipe;
        const progress = enemy.breakProgress || [];
        
        // 다음에 필요한 속성 확인
        const nextRequired = recipe[progress.length];
        
        if (element !== nextRequired) {
            // 잘못된 속성!
            console.log(`[BreakSystem] ${enemy.name || enemy.type}: ${element} 실패! (필요: ${nextRequired})`);
            this.showRecipeResult(enemy, element, false, nextRequired);
            return { hit: false, broken: false };
        }
        
        // 올바른 속성!
        progress.push(element);
        enemy.breakProgress = progress;
        
        console.log(`[BreakSystem] ${enemy.name || enemy.type}: ${element} 성공! [${progress.length}/${recipe.length}]`);
        this.showRecipeResult(enemy, element, true);
        
        // 레시피 완성 체크
        if (progress.length >= recipe.length) {
            this.triggerBreak(enemy);
            return { hit: true, broken: true };
        }
        
        // UI 업데이트
        this.updateBreakGauge(enemy);
        return { hit: true, broken: false };
    },
    
    // ==========================================
    // 레시피 결과 표시
    // ==========================================
    showRecipeResult(enemy, element, isHit, requiredElement = null) {
        if (!enemy.sprite) return;
        
        const popup = document.createElement('div');
        popup.className = `break-popup ${isHit ? 'hit' : 'miss'}`;
        
        const icon = this.ElementIcons[element] || '⚔️';
        const color = this.ElementColors[element] || '#f59e0b';
        
        if (isHit) {
            popup.innerHTML = `<span style="color: ${color}">${icon}</span> <span style="color: #22c55e">✓</span>`;
        } else {
            const requiredIcon = this.ElementIcons[requiredElement] || '?';
            popup.innerHTML = `<span style="color: #666">${icon}</span> <span style="color: #ef4444">✗</span>`;
        }
        
        // 위치 계산
        const globalPos = enemy.sprite.getGlobalPosition();
        popup.style.cssText = `
            position: fixed;
            left: ${globalPos.x}px;
            top: ${globalPos.y - 60}px;
            transform: translate(-50%, -50%);
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
            animation: breakPopup 0.6s ease-out forwards;
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 600);
    },
    
    // ==========================================
    // 브레이크 발동!
    // ==========================================
    triggerBreak(enemy) {
        enemy.isBroken = true;
        
        // 취약 부여
        const recipeLength = enemy.currentBreakRecipe?.length || 2;
        const vulnerableTurns = Math.max(1, recipeLength - 1);
        enemy.vulnerable = (enemy.vulnerable || 0) + vulnerableTurns;
        
        console.log(`[BreakSystem] 🔥 ${enemy.name || enemy.type} BREAK!!! +취약 ${vulnerableTurns}턴`);
        
        // 브레이크 이펙트
        this.showBreakEffect(enemy);
        
        // 인텐트 초기화 (행동 캔슬)
        enemy.intent = null;
        enemy.currentBreakRecipe = null;
        
        // 인텐트 UI 업데이트
        if (enemy.intentContainer) {
            enemy.intentContainer.visible = false;
        }
        
        // 🔥 스턴 떨림 애니메이션 (지속)
        if (enemy.sprite && typeof gsap !== 'undefined') {
            // 원래 위치 저장
            enemy.sprite.originalX = enemy.sprite.x;
            
            // 히트스톱 + 흰색 번쩍
            gsap.timeline()
                .set(enemy.sprite, { tint: 0xffffff })
                .to({}, { duration: 0.15 }) // 히트스톱
                .to(enemy.sprite, { 
                    tint: 0x8888ff,
                    duration: 0.3
                });
            
            // 바들바들 떨림 (지속) - 더 강하게
            enemy.stunShakeTween = gsap.to(enemy.sprite, {
                x: enemy.sprite.originalX + 4,
                duration: 0.025,
                yoyo: true,
                repeat: -1,
                ease: 'none',
                onUpdate: () => {
                    // 랜덤 Y 떨림도 추가
                    if (enemy.sprite) {
                        enemy.sprite.rotation = (Math.random() - 0.5) * 0.03;
                    }
                }
            });
        }
    },
    
    // ==========================================
    // 브레이크 이펙트 (강력하게!)
    // ==========================================
    showBreakEffect(enemy) {
        if (!enemy.sprite) return;
        
        const globalPos = enemy.sprite.getGlobalPosition();
        const x = globalPos.x;
        const y = globalPos.y - 50;
        
        // 1. 강력한 화면 플래시
        this.createBreakFlash();
        
        // 2. 히트스톱 (게임 전체 멈춤 느낌)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitStop(120);
        }
        
        // 3. 강력한 화면 흔들림
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenShake(20, 400);
        } else if (this.game && this.game.app) {
            const stage = this.game.app.stage;
            gsap.timeline()
                .to(stage, { x: 15, duration: 0.02 })
                .to(stage, { x: -15, duration: 0.02 })
                .to(stage, { x: 12, duration: 0.02 })
                .to(stage, { x: -12, duration: 0.02 })
                .to(stage, { x: 8, duration: 0.02 })
                .to(stage, { x: -8, duration: 0.02 })
                .to(stage, { x: 5, duration: 0.02 })
                .to(stage, { x: -5, duration: 0.02 })
                .to(stage, { x: 0, duration: 0.03 });
        }
        
        // 4. 스턴 별 VFX
        this.createStunStars(x, y - 30);
        
        // 5. 충격파 VFX
        this.createShockwave(x, y);
        
        // 6. 대량 파티클 폭발
        this.createBreakParticles(x, y);
        this.createGlassShards(x, y);
        
        // 7. BREAK 텍스트 (더 크고 화려하게)
        const breakText = document.createElement('div');
        breakText.innerHTML = `
            <div class="break-main">BREAK!</div>
            <div class="break-sub">💔 취약 +${enemy.vulnerable || 1}</div>
        `;
        breakText.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%) scale(0);
            z-index: 10001;
            pointer-events: none;
            text-align: center;
        `;
        document.body.appendChild(breakText);
        
        // 애니메이션
        if (typeof gsap !== 'undefined') {
            gsap.timeline()
                .to(breakText, {
                    scale: 1.5,
                    rotation: -5,
                    duration: 0.1,
                    ease: 'back.out(4)'
                })
                .to(breakText, {
                    scale: 1.2,
                    rotation: 3,
                    duration: 0.08
                })
                .to(breakText, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.08
                })
                .to(breakText, {
                    y: -40,
                    opacity: 0,
                    duration: 0.6,
                    delay: 0.8,
                    ease: 'power2.in',
                    onComplete: () => breakText.remove()
                });
        } else {
            breakText.style.transform = 'translate(-50%, -50%) scale(1)';
            setTimeout(() => breakText.remove(), 1500);
        }
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('break', { volume: 1.0 });
        }
    },
    
    // ==========================================
    // 스턴 별 VFX (머리 위에서 도는 별)
    // ==========================================
    createStunStars(x, y) {
        const starContainer = document.createElement('div');
        starContainer.className = 'stun-stars-container';
        starContainer.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 40px;
            z-index: 10002;
            pointer-events: none;
        `;
        
        // 3개의 별 생성
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('div');
            star.textContent = '⭐';
            star.style.cssText = `
                position: absolute;
                font-size: 24px;
                animation: stunStarOrbit 0.8s linear infinite;
                animation-delay: ${i * 0.27}s;
                filter: drop-shadow(0 0 6px #ffd700);
            `;
            starContainer.appendChild(star);
        }
        
        document.body.appendChild(starContainer);
        
        // 2초 후 제거
        setTimeout(() => starContainer.remove(), 2000);
    },
    
    // ==========================================
    // 충격파 VFX
    // ==========================================
    createShockwave(x, y) {
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 20px;
                height: 20px;
                border: 4px solid rgba(255, 200, 50, ${1 - i * 0.2});
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                z-index: 9999;
                pointer-events: none;
                box-shadow: 
                    0 0 20px rgba(255, 200, 50, 0.6),
                    inset 0 0 20px rgba(255, 200, 50, 0.3);
            `;
            document.body.appendChild(ring);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(ring, {
                    scale: 8 + i * 3,
                    opacity: 0,
                    duration: 0.5 + i * 0.1,
                    delay: i * 0.05,
                    ease: 'power2.out',
                    onComplete: () => ring.remove()
                });
            } else {
                setTimeout(() => ring.remove(), 700);
            }
        }
    },
    
    // ==========================================
    // 유리 파편 VFX
    // ==========================================
    createGlassShards(x, y) {
        const colors = ['#ffd700', '#ffffff', '#ffcc00', '#ff8800'];
        
        for (let i = 0; i < 20; i++) {
            const shard = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 80;
            const size = 8 + Math.random() * 12;
            const rotation = Math.random() * 720;
            
            shard.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size * 0.6}px;
                background: linear-gradient(135deg, ${colors[i % colors.length]}, white);
                clip-path: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%);
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 0 ${size/2}px ${colors[i % colors.length]};
            `;
            document.body.appendChild(shard);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(shard, {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance + 40, // 중력
                    rotation: rotation,
                    opacity: 0,
                    scale: 0,
                    duration: 0.5 + Math.random() * 0.3,
                    ease: 'power2.out',
                    onComplete: () => shard.remove()
                });
            } else {
                setTimeout(() => shard.remove(), 800);
            }
        }
    },
    
    // ==========================================
    // 브레이크 파티클
    // ==========================================
    createBreakParticles(x, y) {
        const colors = ['#ffd700', '#ff8c00', '#ffffff', '#ffcc00'];
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 / 12) * i;
            const distance = 50 + Math.random() * 30;
            const size = 6 + Math.random() * 6;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${colors[i % colors.length]};
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 0 ${size}px ${colors[i % colors.length]};
            `;
            document.body.appendChild(particle);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(particle, {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 0,
                    duration: 0.4 + Math.random() * 0.2,
                    ease: 'power2.out',
                    onComplete: () => particle.remove()
                });
            } else {
                setTimeout(() => particle.remove(), 500);
            }
        }
    },
    
    // ==========================================
    // 화면 플래시
    // ==========================================
    createBreakFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, rgba(255, 200, 50, 0.5), transparent 70%);
            z-index: 9999;
            pointer-events: none;
            opacity: 1;
        `;
        document.body.appendChild(flash);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(flash, {
                opacity: 0,
                duration: 0.25,
                ease: 'power2.out',
                onComplete: () => flash.remove()
            });
        } else {
            setTimeout(() => flash.remove(), 250);
        }
    },
    
    // ==========================================
    // 브레이크 게이지 업데이트
    // ==========================================
    updateBreakGauge(enemy) {
        if (!enemy.intentContainer || !enemy.currentBreakRecipe) return;
        
        // 기존 게이지 제거
        const existingGauge = enemy.intentContainer.children.find(c => c.isBreakGauge);
        if (existingGauge) {
            enemy.intentContainer.removeChild(existingGauge);
        }
        
        // 새 게이지 생성
        const gauge = new PIXI.Container();
        gauge.isBreakGauge = true;
        gauge.y = 25;
        
        const recipe = enemy.currentBreakRecipe;
        const progress = enemy.breakProgress || [];
        const totalWidth = recipe.length * 18;
        
        recipe.forEach((element, i) => {
            const isCompleted = i < progress.length;
            const color = isCompleted ? 0x22c55e : parseInt(this.ElementColors[element].replace('#', ''), 16);
            
            const circle = new PIXI.Graphics();
            circle.circle(0, 0, 6);
            circle.fill({ color: isCompleted ? 0x22c55e : 0x333333 });
            circle.stroke({ width: 2, color: color });
            circle.x = -totalWidth / 2 + i * 18 + 9;
            gauge.addChild(circle);
            
            // 속성 아이콘 텍스트
            const iconText = new PIXI.Text({
                text: this.ElementIcons[element] || '?',
                style: { fontSize: 8 }
            });
            iconText.anchor.set(0.5);
            iconText.x = circle.x;
            iconText.y = 0;
            gauge.addChild(iconText);
        });
        
        enemy.intentContainer.addChild(gauge);
    },
    
    // ==========================================
    // 턴 종료 시 브레이크 해제
    // ==========================================
    onTurnEnd(enemy) {
        if (enemy.isBroken) {
            enemy.isBroken = false;
            enemy.currentBreakRecipe = null;
            enemy.breakProgress = [];
            
            // 떨림 애니메이션 중지
            if (enemy.stunShakeTween) {
                enemy.stunShakeTween.kill();
                enemy.stunShakeTween = null;
            }
            
            // 스프라이트 복구
            if (enemy.sprite) {
                enemy.sprite.tint = 0xffffff;
                if (enemy.sprite.originalX !== undefined) {
                    enemy.sprite.x = enemy.sprite.originalX;
                }
                enemy.sprite.rotation = 0;
            }
            
            // 인텐트 UI 복구
            if (enemy.intentContainer) {
                enemy.intentContainer.visible = true;
            }
            
            console.log(`[BreakSystem] ${enemy.name || enemy.type} 브레이크 해제`);
            this.showRecoveryEffect(enemy);
        }
    },
    
    // ==========================================
    // 리커버리 이펙트
    // ==========================================
    showRecoveryEffect(enemy) {
        if (!enemy.sprite) return;
        
        const globalPos = enemy.sprite.getGlobalPosition();
        
        const text = document.createElement('div');
        text.textContent = 'RECOVER';
        text.style.cssText = `
            position: fixed;
            left: ${globalPos.x}px;
            top: ${globalPos.y - 40}px;
            transform: translate(-50%, -50%);
            font-family: 'Cinzel', serif;
            font-size: 1.2rem;
            font-weight: bold;
            color: #a855f7;
            text-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(text);
        
        if (typeof gsap !== 'undefined') {
            gsap.timeline()
                .from(text, { scale: 0, duration: 0.2, ease: 'back.out(2)' })
                .to(text, { y: -30, opacity: 0, duration: 0.5, delay: 0.3, onComplete: () => text.remove() });
        } else {
            setTimeout(() => text.remove(), 800);
        }
    },
    
    // ==========================================
    // 행동 가능 여부
    // ==========================================
    canAct(enemy) {
        return !enemy.isBroken;
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('break-system-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'break-system-styles';
        style.textContent = `
            @keyframes breakPopup {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                30% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.3);
                }
                70% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -70%) scale(0.8);
                }
            }
            
            .break-popup {
                display: flex;
                gap: 6px;
                align-items: center;
                background: rgba(0, 0, 0, 0.8);
                padding: 4px 10px;
                border-radius: 4px;
                border: 2px solid;
            }
            
            .break-popup.hit {
                border-color: #22c55e;
                box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
            }
            
            .break-popup.miss {
                border-color: #ef4444;
                box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
            }
            
            .break-main {
                font-family: 'Cinzel', serif;
                font-size: 3.5rem;
                font-weight: 900;
                background: linear-gradient(180deg, #ffffff 0%, #ffd700 30%, #ff8c00 70%, #ff4500 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                filter: drop-shadow(0 0 20px rgba(255, 200, 50, 1))
                        drop-shadow(0 0 40px rgba(255, 150, 0, 0.8))
                        drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.9));
                letter-spacing: 6px;
                animation: breakTextPulse 0.3s ease-in-out;
            }
            
            @keyframes breakTextPulse {
                0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 200, 50, 1)) drop-shadow(0 0 40px rgba(255, 150, 0, 0.8)) drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.9)); }
                50% { filter: drop-shadow(0 0 40px rgba(255, 255, 255, 1)) drop-shadow(0 0 60px rgba(255, 200, 50, 1)) drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.9)); }
            }
            
            .break-sub {
                font-family: 'Cinzel', serif;
                font-size: 1.3rem;
                color: #ff6666;
                text-shadow: 0 0 12px rgba(255, 100, 100, 1), 2px 2px 0 #000;
                margin-top: 6px;
                animation: breakSubPulse 0.5s ease-out;
            }
            
            @keyframes breakSubPulse {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            /* 스턴 별 회전 애니메이션 */
            @keyframes stunStarOrbit {
                0% {
                    transform: translate(-50%, -50%) rotate(0deg) translateX(35px) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    opacity: 0.6;
                }
                100% {
                    transform: translate(-50%, -50%) rotate(360deg) translateX(35px) rotate(-360deg);
                    opacity: 1;
                }
            }
            
            .stun-stars-container {
                animation: stunStarsFloat 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes stunStarsFloat {
                0% { transform: translate(-50%, -50%) translateY(0); }
                100% { transform: translate(-50%, -50%) translateY(-5px); }
            }
            
            /* 브레이크된 유닛 스타일 */
            .unit-broken {
                filter: brightness(0.6) saturate(0.5);
            }
        `;
        document.head.appendChild(style);
    }
};

console.log('[BreakSystem] 브레이크 시스템 로드 완료');
