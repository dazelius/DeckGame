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
        // CSS는 css/break.css로 분리됨
        console.log('[BreakSystem] 브레이크 시스템 초기화 완료');
    },
    
    // ==========================================
    // 현재 인텐트가 브레이크 가능한지 확인
    // ==========================================
    hasBreakableIntent(enemy) {
        if (!enemy || !enemy.currentBreakRecipe) return false;
        // ★ currentBreakRecipe는 { count, weaknesses } 객체!
        return enemy.currentBreakRecipe.count > 0;
    },
    
    // ==========================================
    // 인텐트 선택 시 브레이크 상태 초기화
    // ==========================================
    onIntentSelected(enemy, intentData) {
        // 이전 브레이크 상태 초기화
        enemy.currentBreakRecipe = null;
        enemy.breakProgress = 0;
        enemy.isBroken = false;
        
        // breakRecipe는 이제 숫자 (횟수)
        if (intentData && intentData.breakRecipe) {
            const recipe = intentData.breakRecipe;
            
            // 새 형식: 숫자 (약점 아무거나 N회)
            if (typeof recipe === 'number' && recipe > 0) {
                // 몬스터 패턴에서 약점 목록 가져오기
                const weaknesses = this.getMonsterWeaknesses(enemy);
                
                enemy.currentBreakRecipe = {
                    count: recipe,
                    weaknesses: weaknesses  // 약점 목록 저장
                };
                enemy.breakProgress = 0;
                enemy.breakShield = recipe;
                enemy.maxBreakShield = recipe;
                
                const icons = weaknesses.map(w => this.ElementIcons[w] || '?').join(' ');
                console.log(`[BreakSystem] ${enemy.name || enemy.type}: 브레이크 가능! 약점(${icons}) x${recipe}`);
            }
            // 레거시 형식 (객체 { element, count }) 지원
            else if (typeof recipe === 'object' && recipe.count) {
                const weaknesses = recipe.element ? [recipe.element] : this.getMonsterWeaknesses(enemy);
                
                enemy.currentBreakRecipe = {
                    count: recipe.count,
                    weaknesses: weaknesses
                };
                enemy.breakProgress = 0;
                enemy.breakShield = recipe.count;
                enemy.maxBreakShield = recipe.count;
                
                console.log(`[BreakSystem] ${enemy.name || enemy.type}: 브레이크 가능! (레거시) x${recipe.count}`);
            }
        }
    },
    
    // ==========================================
    // 몬스터 약점 목록 가져오기
    // ==========================================
    getMonsterWeaknesses(enemy) {
        if (typeof MonsterPatterns !== 'undefined') {
            const pattern = MonsterPatterns.getPattern(enemy.type);
            if (pattern && pattern.weaknesses) {
                return pattern.weaknesses;
            }
        }
        // 기본값: 물리
        return ['physical'];
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
    // ★ 브레이크 시 스프라이트 변경
    // ==========================================
    async changeBreakSprite(enemy) {
        if (!enemy || !enemy.sprite) return;
        
        // MonsterPatterns에서 breakSprite 확인
        const pattern = typeof MonsterPatterns !== 'undefined' 
            ? MonsterPatterns.getPattern(enemy.type) 
            : null;
        
        const breakSprite = pattern?.stats?.breakSprite;
        if (!breakSprite) return;
        
        console.log(`[BreakSystem] 🔄 스프라이트 변경: ${enemy.type} → ${breakSprite}`);
        
        // 메인 스프라이트 찾기 (DDOORenderer 구조)
        const spriteContainer = enemy.sprite;
        const mainSprite = spriteContainer.children?.find(c => c.label === 'main');
        
        if (!mainSprite) {
            console.warn('[BreakSystem] 메인 스프라이트를 찾을 수 없음');
            return;
        }
        
        try {
            // 새 텍스처 로드
            const newTexture = await PIXI.Assets.load(`image/${breakSprite}`);
            
            // 텍스처 변경
            mainSprite.texture = newTexture;
            
            // 아웃라인 스프라이트들도 텍스처 변경
            spriteContainer.children.forEach(child => {
                if (child.isOutline && child.texture) {
                    child.texture = newTexture;
                }
            });
            
            console.log(`[BreakSystem] ✅ 스프라이트 변경 완료!`);
        } catch (e) {
            console.error(`[BreakSystem] 스프라이트 변경 실패:`, e);
        }
    },
    
    // ==========================================
    // 공격 시 브레이크 진행
    // ==========================================
    onAttack(enemy, cardDef, hitCount = 1, hitNum = 0) {
        if (!this.hasBreakableIntent(enemy)) return { hit: false, broken: false };
        if (enemy.isBroken) return { hit: false, broken: false };
        
        const element = this.getCardElement(cardDef);
        const recipe = enemy.currentBreakRecipe;
        
        const weaknesses = recipe.weaknesses || ['physical'];
        const requiredCount = recipe.count;
        const currentProgress = enemy.breakProgress || 0;
        
        // 약점 목록에 포함되는지 확인
        if (!weaknesses.includes(element)) {
            console.log(`[BreakSystem] ${enemy.name || enemy.type}: ${element} 실패! (약점: ${weaknesses.join(', ')})`);
            return { hit: false, broken: false };
        }
        
        // 약점 적중!
        enemy.breakProgress = currentProgress + 1;
        
        console.log(`[BreakSystem] ${enemy.name || enemy.type}: ${element} 성공! [${enemy.breakProgress}/${requiredCount}]`);
        
        // 레시피 완성 체크
        if (enemy.breakProgress >= requiredCount) {
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
    showRecipeResult(enemy, element, isHit, requiredElement = null, hitNum = 0, currentProgress = 0, totalRecipe = 0) {
        if (!enemy.sprite) return;
        
        const popup = document.createElement('div');
        popup.className = `break-popup ${isHit ? 'hit' : 'miss'}`;
        
        const icon = this.ElementIcons[element] || '⚔️';
        const color = this.ElementColors[element] || '#f59e0b';
        
        if (isHit) {
            // 진행 상황 표시: "⚔️ ✓ 2/3"
            popup.innerHTML = `
                <span style="color: ${color}; font-size: 1.8rem">${icon}</span>
                <span style="color: #22c55e; font-size: 1.5rem">✓</span>
                <span style="color: #ffdd00; font-size: 1.2rem; margin-left: 4px">${currentProgress}/${totalRecipe}</span>
            `;
        } else {
            popup.innerHTML = `<span style="color: #666">${icon}</span> <span style="color: #ef4444">✗</span>`;
        }
        
        // 위치 계산 - hitNum에 따라 X 오프셋 적용 (겹치지 않게)
        const globalPos = enemy.sprite.getGlobalPosition();
        const xOffset = (hitNum - 1) * 30; // 히트마다 X 위치 다르게
        const yOffset = hitNum * 15; // 히트마다 Y 위치도 살짝 다르게
        
        popup.style.cssText = `
            position: fixed;
            left: ${globalPos.x + xOffset}px;
            top: ${globalPos.y - 80 - yOffset}px;
            transform: translate(-50%, -50%);
            font-size: 1.5rem;
            font-weight: bold;
            z-index: ${10000 + hitNum};
            pointer-events: none;
            animation: breakPopup 0.8s ease-out forwards;
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0,0,0,0.6);
            padding: 4px 10px;
            border-radius: 6px;
            border: 2px solid ${isHit ? '#22c55e' : '#ef4444'};
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 800);
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
        
        // ★ 브레이크 대사!
        if (typeof MonsterDialogue !== 'undefined') {
            MonsterDialogue.onBreak(enemy);
        }
        
        // ★ 브레이크 시 스프라이트 변경 (breakSprite가 있으면)
        this.changeBreakSprite(enemy);
        
        // 브레이크 이펙트
        this.showBreakEffect(enemy);
        
        // 인텐트 초기화 (행동 캔슬)
        enemy.intent = null;
        enemy.currentBreakRecipe = null;
        
        // 인텐트 UI 업데이트
        if (enemy.intentContainer) {
            enemy.intentContainer.visible = false;
        }
        
        // 🔥 브레이크 상태 애니메이션 (무기력 + 빨간 깜빡임)
        const sprite = enemy.sprite;
        if (sprite && !sprite.destroyed && typeof gsap !== 'undefined') {
            // 원래 상태 저장
            sprite.originalX = sprite.x;
            sprite.originalScaleY = sprite.scale.y;
            
            // 1. 초기 충격 - 흰색 번쩍 후 빨갛게
            gsap.timeline()
                .set(sprite, { tint: 0xffffff })
                .to({}, { duration: 0.1 }) // 히트스톱
                .to(sprite, { tint: 0xff4444, duration: 0.15 });
            
            // 2. 축 늘어진 느낌 (Y 스케일 줄이기)
            gsap.to(sprite.scale, {
                y: sprite.originalScaleY * 0.85,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            // 3. 빨간색 깜빡깜빡 (무기력한 위험 상태) - 안전 체크 포함
            enemy.breakBlinkTween = gsap.to({ progress: 0 }, {
                progress: 1,
                duration: 0.4,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
                onUpdate: function() {
                    if (!sprite || sprite.destroyed) {
                        this.kill();
                        return;
                    }
                    const p = this.targets()[0].progress;
                    const r = Math.floor(255 - p * 150);
                    const g = Math.floor(68 - p * 68);
                    const b = Math.floor(68 - p * 68);
                    sprite.tint = (r << 16) | (g << 8) | b;
                }
            });
            
            // 4. 미세한 떨림 (힘없이) - 안전 체크 포함
            const baseX = sprite.originalX || sprite.x || 0;
            enemy.stunShakeTween = gsap.to({ shake: 0 }, {
                shake: Math.PI * 2,
                duration: 0.16,
                repeat: -1,
                ease: 'none',
                onUpdate: function() {
                    if (!sprite || sprite.destroyed) {
                        this.kill();
                        return;
                    }
                    const s = this.targets()[0].shake;
                    sprite.x = baseX + Math.sin(s * 10) * 2;
                    sprite.rotation = (Math.random() - 0.5) * 0.02;
                }
            });
        }
    },
    
    // ==========================================
    // 브레이크 이펙트 (적 개인 위치에서!)
    // ==========================================
    showBreakEffect(enemy) {
        // ★ 적 위치 기준
        let enemyX = window.innerWidth / 2;
        let enemyY = window.innerHeight / 2;
        
        if (enemy && enemy.sprite) {
            const globalPos = enemy.sprite.getGlobalPosition();
            enemyX = globalPos.x;
            enemyY = globalPos.y;
        }
        
        // 텍스트 위치 (적 머리 위)
        const textY = enemyY - 100;
        
        // ★★★ 0. 화면 전체 플래시! ★★★
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffffff', 150, 0.15);
            setTimeout(() => CombatEffects.screenFlash('#ff6600', 100, 0.2), 100);
        }
        
        // 1. 국소적 플래시 (적 주변 - 더 크게!)
        this.createLocalBreakFlash(enemyX, enemyY);
        
        // 2. 히트스톱 (더 길게!)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitStop(200);
        }
        
        // 3. 화면 흔들림 (더 강하게!)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenShake(30, 500);
        }
        
        // 4. 스턴 별 VFX (적 머리 위 - 3D 타원 궤도)
        this.createStunStars(enemy);
        
        // 5. 충격파 (적 위치에서 - 여러 겹!)
        this.createLocalShockwave(enemyX, enemyY);
        setTimeout(() => this.createLocalShockwave(enemyX, enemyY), 80);
        
        // 6. 유리 파편 (적 위치 - 더 많이!)
        this.createGlassShards(enemyX, enemyY);
        this.createGlassShards(enemyX, enemyY);
        
        // ★★★ 7. PIXI 파티클 폭발! ★★★
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.burstParticles(enemyX, enemyY, 0xffaa00, 25);
            CombatEffects.burstParticles(enemyX, enemyY, 0xff4400, 15);
            CombatEffects.impactEffect(enemyX, enemyY, 0xffcc00, 2.0);
        }
        
        // 8. ★★★ 개인 BREAK 텍스트 (더 크고 화려하게!) ★★★
        const breakPopup = document.createElement('div');
        breakPopup.className = 'break-popup-personal';
        breakPopup.innerHTML = `
            <div class="break-crack-bg"></div>
            <div class="break-text-personal">BREAK!</div>
            <div class="break-sub-personal">💔 취약 +${enemy?.vulnerable || 1}</div>
        `;
        breakPopup.style.cssText = `
            position: fixed;
            left: ${enemyX}px;
            top: ${textY}px;
            transform: translate(-50%, -50%);
            z-index: 10001;
            pointer-events: none;
            text-align: center;
        `;
        
        // 스타일 주입
        const style = document.createElement('style');
        style.textContent = `
            .break-text-personal {
                font-family: 'Cinzel', serif;
                font-size: 4rem;
                font-weight: 900;
                color: #fff;
                text-shadow: 
                    0 0 10px #ff6600,
                    0 0 20px #ff4400,
                    0 0 40px #ff2200,
                    0 0 60px #ff0000,
                    3px 3px 0 #000,
                    -3px -3px 0 #000,
                    3px -3px 0 #000,
                    -3px 3px 0 #000;
                letter-spacing: 8px;
                filter: drop-shadow(0 5px 15px rgba(255, 100, 0, 0.8));
            }
            .break-sub-personal {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                font-weight: 700;
                color: #ffcc00;
                text-shadow: 
                    0 0 10px #ff6600,
                    2px 2px 0 #000;
                margin-top: 8px;
            }
            .break-crack-bg {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 300px;
                height: 150px;
                background: radial-gradient(ellipse, 
                    rgba(255, 100, 0, 0.6) 0%,
                    rgba(255, 50, 0, 0.3) 40%,
                    transparent 70%);
                filter: blur(10px);
                z-index: -1;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(breakPopup);
        
        // ★★★ 강화된 애니메이션 ★★★
        if (typeof gsap !== 'undefined') {
            const mainText = breakPopup.querySelector('.break-text-personal');
            const subText = breakPopup.querySelector('.break-sub-personal');
            const bg = breakPopup.querySelector('.break-crack-bg');
            
            const tl = gsap.timeline();
            
            // 배경 펄스
            tl.fromTo(bg,
                { scale: 0, opacity: 0 },
                { scale: 1.5, opacity: 1, duration: 0.2, ease: 'power2.out' }
            )
            // 메인 텍스트 - 폭발적 등장!
            .fromTo(mainText, 
                { scale: 4, opacity: 0, y: 30, rotation: -10 },
                { scale: 1, opacity: 1, y: 0, rotation: 0, duration: 0.15, ease: 'back.out(3)' },
                '-=0.1'
            )
            // 강한 흔들림
            .to(mainText, {
                x: -8,
                duration: 0.02,
                yoyo: true,
                repeat: 5
            })
            // 배경 펄스
            .to(bg, {
                scale: 2,
                opacity: 0,
                duration: 0.4
            }, '-=0.1')
            // 서브 텍스트
            .fromTo(subText,
                { opacity: 0, y: 15, scale: 0.5 },
                { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(2)' },
                '-=0.3'
            )
            // 페이드 아웃 + 위로 떠오름
            .to(breakPopup, {
                opacity: 0,
                y: -50,
                scale: 1.2,
                duration: 0.6,
                delay: 1.0,
                ease: 'power2.in',
                onComplete: () => {
                    breakPopup.remove();
                    style.remove();
                }
            });
        } else {
            setTimeout(() => {
                breakPopup.remove();
                style.remove();
            }, 2000);
        }
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('break', { volume: 0.8 });
        }
    },
    
    // ==========================================
    // 로컬 브레이크 플래시 (적 주변 - 강화!)
    // ==========================================
    createLocalBreakFlash(x, y) {
        // 메인 플래시 (더 크게!)
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 400px;
            height: 400px;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, 
                rgba(255, 255, 255, 1) 0%, 
                rgba(255, 220, 100, 0.9) 20%,
                rgba(255, 150, 50, 0.6) 40%,
                rgba(255, 80, 0, 0.3) 60%,
                transparent 75%);
            z-index: 9999;
            pointer-events: none;
            border-radius: 50%;
        `;
        document.body.appendChild(flash);
        
        // 내부 코어 플래시 (더 밝게!)
        const core = document.createElement('div');
        core.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 150px;
            height: 150px;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, 
                rgba(255, 255, 255, 1) 0%, 
                rgba(255, 255, 200, 0.9) 40%,
                transparent 70%);
            z-index: 10000;
            pointer-events: none;
            border-radius: 50%;
        `;
        document.body.appendChild(core);
        
        if (typeof gsap !== 'undefined') {
            // 메인 플래시 애니메이션
            gsap.fromTo(flash, 
                { scale: 0.3, opacity: 1 },
                { 
                    scale: 3, 
                    opacity: 0, 
                    duration: 0.5, 
                    ease: 'power2.out',
                    onComplete: () => flash.remove()
                }
            );
            // 코어 플래시 애니메이션 (빠르게 사라짐)
            gsap.fromTo(core, 
                { scale: 0.5, opacity: 1 },
                { 
                    scale: 2, 
                    opacity: 0, 
                    duration: 0.25, 
                    ease: 'power3.out',
                    onComplete: () => core.remove()
                }
            );
        } else {
            setTimeout(() => {
                flash.remove();
                core.remove();
            }, 500);
        }
    },
    
    // ==========================================
    // 로컬 충격파 (적 위치에서 - 강화!)
    // ==========================================
    createLocalShockwave(x, y) {
        // 3겹 충격파!
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            const colors = ['rgba(255, 220, 100, 0.9)', 'rgba(255, 150, 50, 0.7)', 'rgba(255, 80, 0, 0.5)'];
            ring.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 60px;
                height: 60px;
                transform: translate(-50%, -50%);
                border: ${4 - i}px solid ${colors[i]};
                border-radius: 50%;
                z-index: 9998;
                pointer-events: none;
                box-shadow: 0 0 ${15 - i * 3}px ${colors[i]};
            `;
            document.body.appendChild(ring);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(ring, {
                    width: 250 + i * 80,
                    height: 250 + i * 80,
                    opacity: 0,
                    duration: 0.5,
                    delay: i * 0.06,
                    ease: 'power2.out',
                    onComplete: () => ring.remove()
                });
            } else {
                setTimeout(() => ring.remove(), 600);
            }
        }
    },
    
    // ==========================================
    // 시네마틱 브레이크 플래시 (사용 안함 - 백업)
    // ==========================================
    createCinematicBreakFlash() {
        // 어두운 배경 + 밝은 플래시 순차
        const darkOverlay = document.createElement('div');
        darkOverlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            pointer-events: none;
        `;
        document.body.appendChild(darkOverlay);
        
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, 
                rgba(255, 255, 255, 1) 0%, 
                rgba(255, 200, 50, 0.8) 30%,
                rgba(255, 150, 0, 0.4) 60%,
                transparent 80%);
            z-index: 9999;
            pointer-events: none;
            opacity: 1;
        `;
        document.body.appendChild(flash);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(flash, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => flash.remove()
            });
            gsap.to(darkOverlay, {
                opacity: 0,
                duration: 0.8,
                delay: 0.3,
                onComplete: () => darkOverlay.remove()
            });
        } else {
            setTimeout(() => { flash.remove(); darkOverlay.remove(); }, 800);
        }
    },
    
    // ==========================================
    // 중앙 충격파 (사용 안함 - 백업)
    // ==========================================
    createCenterShockwave(x, y) {
        for (let i = 0; i < 4; i++) {
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 30px;
                height: 30px;
                border: ${6 - i}px solid rgba(255, 200, 50, ${1 - i * 0.15});
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                z-index: 10000;
                pointer-events: none;
                box-shadow: 
                    0 0 30px rgba(255, 200, 50, 0.8),
                    inset 0 0 30px rgba(255, 200, 50, 0.4);
            `;
            document.body.appendChild(ring);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(ring, {
                    scale: 15 + i * 5,
                    opacity: 0,
                    duration: 0.6 + i * 0.1,
                    delay: i * 0.05,
                    ease: 'power2.out',
                    onComplete: () => ring.remove()
                });
            }
        }
    },
    
    // ==========================================
    // 화면 가장자리 파티클
    // ==========================================
    createScreenEdgeParticles() {
        const colors = ['#ffd700', '#ff8c00', '#ffffff', '#ffcc00', '#ff6600'];
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            const side = Math.floor(Math.random() * 4);
            let startX, startY, endX, endY;
            
            // 화면 가장자리에서 중앙으로
            switch(side) {
                case 0: startX = Math.random() * w; startY = 0; break;
                case 1: startX = w; startY = Math.random() * h; break;
                case 2: startX = Math.random() * w; startY = h; break;
                case 3: startX = 0; startY = Math.random() * h; break;
            }
            endX = w/2 + (Math.random() - 0.5) * 200;
            endY = h/2 + (Math.random() - 0.5) * 200;
            
            const size = 4 + Math.random() * 8;
            particle.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: ${size}px;
                height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 0 ${size * 2}px currentColor;
            `;
            document.body.appendChild(particle);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(particle, {
                    x: endX - startX,
                    y: endY - startY,
                    opacity: 0,
                    duration: 0.3 + Math.random() * 0.2,
                    ease: 'power2.in',
                    onComplete: () => particle.remove()
                });
            }
        }
    },
    
    // ==========================================
    // 스턴 별 VFX (3D 타원 궤도 - 머리 위에서 도는 별)
    // ==========================================
    createStunStars(enemy) {
        if (!enemy || !enemy.sprite || !this.game?.app) return;
        
        const sprite = enemy.sprite;
        const spriteHeight = sprite.height || 80;
        
        // 별 컨테이너 생성 (스프라이트의 자식으로)
        const starsContainer = new PIXI.Container();
        starsContainer.y = -spriteHeight - 15;  // 인텐트 위쪽
        starsContainer.zIndex = 200;
        starsContainer.isStunStars = true;
        
        // 3D 타원 궤도 파라미터
        const orbitRadiusX = 35;  // 가로 반지름
        const orbitRadiusY = 12;  // 세로 반지름 (3D 납작하게)
        const starCount = 3;
        const baseScale = 0.8;
        
        const stars = [];
        
        // 별 생성
        for (let i = 0; i < starCount; i++) {
            const star = new PIXI.Container();
            
            // 별 모양 그리기
            const starGraphic = new PIXI.Graphics();
            this.drawStar(starGraphic, 0, 0, 5, 12, 6, 0xffd700);
            star.addChild(starGraphic);
            
            // 글로우 효과
            const glow = new PIXI.Graphics();
            glow.circle(0, 0, 8);
            glow.fill({ color: 0xffd700, alpha: 0.3 });
            star.addChildAt(glow, 0);
            
            // 초기 각도
            star.orbitAngle = (i / starCount) * Math.PI * 2;
            star.baseScale = baseScale;
            
            stars.push(star);
            starsContainer.addChild(star);
        }
        
        sprite.addChild(starsContainer);
        
        // 애니메이션 Ticker
        const animateStar = (delta) => {
            if (!starsContainer.parent || starsContainer.destroyed) {
                this.game.app.ticker.remove(animateStar);
                return;
            }
            
            const time = performance.now() * 0.003;  // 회전 속도
            
            stars.forEach((star, i) => {
                const angle = time + (i / starCount) * Math.PI * 2;
                
                // 3D 타원 좌표
                star.x = Math.cos(angle) * orbitRadiusX;
                star.y = Math.sin(angle) * orbitRadiusY;
                
                // 3D 깊이감: 뒤에 있을 때 작고 흐리게
                const depth = (Math.sin(angle) + 1) / 2;  // 0~1
                const scale = baseScale * (0.6 + depth * 0.5);
                star.scale.set(scale);
                star.alpha = 0.5 + depth * 0.5;
                
                // 뒤에 있는 별은 아래로 (zIndex 대신 sortChildren 사용)
                star.zIndex = Math.floor(depth * 10);
                
                // 별 자체 회전
                star.children[1].rotation += 0.05 * delta;
            });
            
            starsContainer.sortChildren();
        };
        
        this.game.app.ticker.add(animateStar);
        
        // 지속 시간 후 제거 (브레이크 해제 시까지 유지)
        enemy.stunStarsContainer = starsContainer;
        enemy.stunStarsAnimator = animateStar;
    },
    
    // 별 모양 그리기 헬퍼
    drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        graphics.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            graphics.lineTo(
                cx + Math.cos(rot) * outerRadius,
                cy + Math.sin(rot) * outerRadius
            );
            rot += step;
            
            graphics.lineTo(
                cx + Math.cos(rot) * innerRadius,
                cy + Math.sin(rot) * innerRadius
            );
            rot += step;
        }
        
        graphics.lineTo(cx, cy - outerRadius);
        graphics.closePath();
        graphics.fill({ color: color });
        graphics.stroke({ width: 1, color: 0xffee88 });
    },
    
    // 스턴 별 제거
    removeStunStars(enemy) {
        if (enemy.stunStarsContainer) {
            if (enemy.stunStarsAnimator && this.game?.app?.ticker) {
                this.game.app.ticker.remove(enemy.stunStarsAnimator);
            }
            try {
                if (!enemy.stunStarsContainer.destroyed) {
                    enemy.stunStarsContainer.destroy();
                }
            } catch(e) {}
            enemy.stunStarsContainer = null;
            enemy.stunStarsAnimator = null;
        }
    },
    
    // ★★★ 유닛 사망 시 모든 브레이크 관련 정리 ★★★
    cleanupUnit(enemy) {
        if (!enemy) return;
        
        // 1. 트윈 정리 (가장 먼저!)
        try {
            if (enemy.stunShakeTween) {
                enemy.stunShakeTween.kill();
                enemy.stunShakeTween = null;
            }
            if (enemy.breakBlinkTween) {
                enemy.breakBlinkTween.kill();
                enemy.breakBlinkTween = null;
            }
            // 스프라이트 관련 모든 트윈 정리
            if (enemy.sprite && !enemy.sprite.destroyed) {
                gsap.killTweensOf(enemy.sprite);
                if (enemy.sprite.scale) gsap.killTweensOf(enemy.sprite.scale);
            }
        } catch(e) {}
        
        // 2. 스턴 별 제거
        this.removeStunStars(enemy);
        
        // 3. 브레이크 상태 초기화
        enemy.isBroken = false;
        enemy.breakProgress = [];
        enemy.currentBreakRecipe = null;
        enemy.breakTurns = 0;
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
    // 유리 파편 VFX (강화!)
    // ==========================================
    createGlassShards(x, y) {
        const colors = ['#ffd700', '#ffffff', '#ffcc00', '#ff8800', '#ff4400', '#ffee88'];
        
        // ★ 파편 개수 증가! (20 → 35)
        for (let i = 0; i < 35; i++) {
            const shard = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 150; // 더 멀리!
            const size = 10 + Math.random() * 18; // 더 크게!
            const rotation = Math.random() * 1080; // 더 빠르게 회전!
            
            // 다양한 모양
            const shapes = [
                'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)', // 육각형
                'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // 다이아몬드
                'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)', // 사다리꼴
                'polygon(30% 0%, 70% 0%, 100% 70%, 0% 70%)' // 삼각 사다리
            ];
            
            shard.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size * 0.6}px;
                background: linear-gradient(135deg, ${colors[i % colors.length]}, white);
                clip-path: ${shapes[i % shapes.length]};
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 0 ${size}px ${colors[i % colors.length]};
                filter: brightness(1.2);
            `;
            document.body.appendChild(shard);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(shard, {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance + 60 + Math.random() * 40, // 더 많은 중력
                    rotation: rotation,
                    opacity: 0,
                    scale: 0,
                    duration: 0.6 + Math.random() * 0.4,
                    ease: 'power2.out',
                    onComplete: () => shard.remove()
                });
            } else {
                setTimeout(() => shard.remove(), 1000);
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
    // 브레이크 게이지 업데이트 (LOL 스타일 토막 게이지)
    // ==========================================
    updateBreakGauge(enemy) {
        if (!enemy.intentContainer || !enemy.currentBreakRecipe) return;
        
        // 기존 게이지 제거
        const existingGauge = enemy.intentContainer.children.find(c => c.isBreakGauge);
        if (existingGauge) {
            enemy.intentContainer.removeChild(existingGauge);
        }
        
        this.createBreakGauge(enemy);
    },
    
    // ==========================================
    // 브레이크 게이지 생성 (인텐트와 일체화!)
    // ==========================================
    createBreakGauge(enemy) {
        if (!enemy.intentContainer || !enemy.currentBreakRecipe) return;
        
        const recipe = enemy.currentBreakRecipe;  // { count, weaknesses }
        const progress = enemy.breakProgress || 0;
        
        const weaknesses = recipe.weaknesses || ['physical'];
        const count = recipe.count;
        // 첫 번째 약점 색상 사용
        const elementColor = parseInt(this.ElementColors[weaknesses[0]].replace('#', ''), 16);
        
        // 게이지 컨테이너
        const gauge = new PIXI.Container();
        gauge.isBreakGauge = true;
        gauge.y = 17;  // ★ 인텐트 박스 바로 아래에 붙임!
        
        // ★ 인텐트 박스 너비에 맞춤 (더 넓게!)
        const barWidth = 70;
        const barHeight = 6;
        
        // ========================================
        // ★ 일체화된 게이지 바 (인텐트 하단에 딱 붙음!)
        // ========================================
        const barX = -barWidth / 2;
        
        // 게이지 배경 (인텐트와 연결되는 느낌)
        const barBg = new PIXI.Graphics();
        // 상단은 직각, 하단만 둥글게 (인텐트와 연결!)
        barBg.moveTo(barX, -barHeight/2);
        barBg.lineTo(barX + barWidth, -barHeight/2);
        barBg.lineTo(barX + barWidth, barHeight/2 - 2);
        barBg.quadraticCurveTo(barX + barWidth, barHeight/2, barX + barWidth - 2, barHeight/2);
        barBg.lineTo(barX + 2, barHeight/2);
        barBg.quadraticCurveTo(barX, barHeight/2, barX, barHeight/2 - 2);
        barBg.closePath();
        barBg.fill({ color: 0x1a1a1a, alpha: 0.9 });
        barBg.stroke({ width: 1, color: 0x8b0000, alpha: 0.6 });
        gauge.addChild(barBg);
        
        // 진행률 계산
        const progressRatio = progress / count;
        const fillWidth = barWidth * progressRatio;
        
        // ★ 토막 게이지 스타일 (LOL처럼!)
        const segmentWidth = barWidth / count;
        const segmentGap = 2;
        
        for (let i = 0; i < count; i++) {
            const segX = barX + i * segmentWidth + 1;
            const segW = segmentWidth - segmentGap;
            const isFilled = i < progress;
            
            const segment = new PIXI.Graphics();
            segment.roundRect(segX, -barHeight/2 + 1, segW, barHeight - 2, 1);
            
            if (isFilled) {
                // 채워진 칸: 밝은 초록 + 글로우
                segment.fill({ color: 0x22c55e });
            } else if (i === progress) {
                // 다음 채울 칸: 점멸 효과
                segment.fill({ color: elementColor, alpha: 0.25 });
                
                // 점멸 애니메이션
                gsap.to({ val: 0 }, {
                    val: Math.PI * 2,
                    duration: 0.6,
                    repeat: -1,
                    ease: 'none',
                    onUpdate: function() {
                        if (!segment || segment.destroyed) {
                            this.kill();
                            return;
                        }
                        segment.alpha = 0.3 + Math.sin(this.targets()[0].val) * 0.4;
                    }
                });
            } else {
                // 빈 칸: 어두운 배경
                segment.fill({ color: 0x2a2a2a, alpha: 0.5 });
            }
            
            gauge.addChild(segment);
        }
        
        // ★ 약점 아이콘 (작게, 게이지 왼쪽에)
        const weakIcon = new PIXI.Text({
            text: this.ElementIcons[weaknesses[0]] || '⚔',
            style: { fontSize: 9, fill: this.ElementColors[weaknesses[0]] || '#ffffff' }
        });
        weakIcon.anchor.set(1, 0.5);
        weakIcon.x = barX - 3;
        weakIcon.y = 0;
        gauge.addChild(weakIcon);
        
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
            
            // ★ 빨간 깜빡임 애니메이션 중지
            if (enemy.breakBlinkTween) {
                enemy.breakBlinkTween.kill();
                enemy.breakBlinkTween = null;
            }
            
            // ★ 3D 스턴 별 제거
            this.removeStunStars(enemy);
            
            // 스프라이트 복구
            if (enemy.sprite && !enemy.sprite.destroyed) {
                // 틴트 복구
                enemy.sprite.tint = 0xffffff;
                
                // 위치 복구
                if (enemy.sprite.originalX !== undefined) {
                    enemy.sprite.x = enemy.sprite.originalX;
                }
                
                // ★ 스케일 복구 (축 늘어진 상태에서 원래대로)
                if (enemy.sprite.originalScaleY !== undefined) {
                    gsap.to(enemy.sprite.scale, {
                        y: enemy.sprite.originalScaleY,
                        duration: 0.3,
                        ease: 'back.out(1.5)'
                    });
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
    }
};

console.log('[BreakSystem] 브레이크 시스템 로드 완료');
