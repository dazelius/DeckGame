// ==========================================
// 몬스터 애니메이션 시스템
// 패턴별 유니크 애니메이션 바인딩
// ==========================================

const MonsterAnimations = {
    // ==========================================
    // 애니메이션 레지스트리
    // ==========================================
    registry: {},
    
    // ==========================================
    // 애니메이션 등록
    // ==========================================
    register(animationKey, handler) {
        this.registry[animationKey] = handler;
        console.log(`[MonsterAnimations] 등록됨: ${animationKey}`);
    },
    
    // ==========================================
    // 애니메이션 실행
    // ==========================================
    execute(animationKey, context) {
        const {
            enemyEl,
            targetEl,
            enemy,
            damage = 0,
            onHit = null,
            onComplete = null
        } = context;
        
        // 애니메이션 키가 있고 등록되어 있으면 해당 애니메이션 실행
        if (animationKey && this.registry[animationKey]) {
            console.log(`[MonsterAnimations] 실행: ${animationKey}`);
            return this.registry[animationKey](context);
        }
        
        // 키가 없거나 등록 안 됐으면 기본 애니메이션
        console.log(`[MonsterAnimations] 기본 애니메이션 실행 (키: ${animationKey || 'none'})`);
        return this.executeDefault(context);
    },
    
    // ==========================================
    // 기본 애니메이션 (근접 공격)
    // ==========================================
    executeDefault(context) {
        const { enemyEl, targetEl, damage, onHit, onComplete } = context;
        
        if (typeof EffectSystem !== 'undefined' && enemyEl && targetEl) {
            EffectSystem.enemyAttack(enemyEl, targetEl, damage, 'melee');
        }
        
        setTimeout(() => {
            if (onHit) onHit();
        }, 300);
        
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 600);
    },
    
    // ==========================================
    // 애니메이션 존재 여부 확인
    // ==========================================
    has(animationKey) {
        return animationKey && this.registry[animationKey] !== undefined;
    }
};

// ==========================================
// 🏹 기본 제공 애니메이션들
// ==========================================

// 화살 발사 (스피디)
MonsterAnimations.register('arrow_shot', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) return;
    
    // 활 쏘기 애니메이션 시작
    enemyEl.classList.add('enemy-shooting');
    
    // 발사 타이밍 (애니메이션 50% = 0.4초 * 0.5 = 200ms)
    setTimeout(() => {
        const enemyRect = enemyEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const fromX = enemyRect.left + enemyRect.width / 2;
        const fromY = enemyRect.top + enemyRect.height * 0.4;
        const toX = targetRect.left + targetRect.width / 2;
        const toY = targetRect.top + targetRect.height / 2;
        
        // 화살 발사 (빠름)
        if (typeof VFX !== 'undefined' && VFX.arrow) {
            VFX.arrow(fromX, fromY, toX, toY, {
                speed: 40,
                onHit: () => {
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.screenShake(damage > 10 ? 12 : 8, 250);
                        EffectSystem.showDamageVignette();
                    }
                    if (onHit) onHit();
                }
            });
        } else {
            if (onHit) setTimeout(onHit, 100);
        }
    }, 200);
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-shooting');
        if (onComplete) onComplete();
    }, 400);
});

// 급소 조준 (강화된 화살 - 스피디)
MonsterAnimations.register('arrow_precision', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) return;
    
    // 강화 활 쏘기 (파워샷)
    enemyEl.classList.add('enemy-shooting', 'enemy-power-shot');
    
    // 발사 (200ms)
    setTimeout(() => {
        const enemyRect = enemyEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const fromX = enemyRect.left + enemyRect.width / 2;
        const fromY = enemyRect.top + enemyRect.height * 0.4;
        const toX = targetRect.left + targetRect.width / 2;
        const toY = targetRect.top + targetRect.height / 2;
        
        // 강화된 화살 (더 빠름)
        if (typeof VFX !== 'undefined' && VFX.arrow) {
            VFX.arrow(fromX, fromY, toX, toY, {
                speed: 50,
                color: '#dc2626',
                onHit: () => {
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.screenShake(18, 350);
                        EffectSystem.showDamageVignette();
                    }
                    // 강화 적중 이펙트
                    if (typeof VFX !== 'undefined') {
                        VFX.impact(toX, toY, { color: '#ef4444', size: 80 });
                        VFX.sparks(toX, toY, { color: '#fbbf24', count: 12, speed: 180 });
                    }
                    if (onHit) onHit();
                }
            });
        } else {
            if (onHit) setTimeout(onHit, 100);
        }
    }, 200);
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-shooting', 'enemy-power-shot');
        if (onComplete) onComplete();
    }, 450);
});

// 후퇴 (뒤로 대시) - GSAP 활용
MonsterAnimations.register('retreat_back', (context) => {
    const { enemyEl, enemy, onComplete } = context;
    
    if (!enemyEl) {
        if (onComplete) onComplete();
        return;
    }
    
    // 후퇴 사운드
    if (typeof SoundSystem !== 'undefined' && SoundSystem.play) {
        SoundSystem.play('dash');
    }
    
    const rect = enemyEl.getBoundingClientRect();
    const spriteImg = enemyEl.querySelector('.enemy-sprite-img');
    const spriteContainer = enemyEl.querySelector('.enemy-sprite-container');
    
    // ✨ GSAP 트레일 효과
    const createGSAPTrail = (delay, startOpacity) => {
        setTimeout(() => {
            if (!spriteImg || !spriteContainer) return;
            const trail = spriteImg.cloneNode(true);
            trail.className = 'dash-trail';
            trail.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: auto;
                opacity: ${startOpacity};
                filter: brightness(1.5) saturate(0.3) blur(2px);
                pointer-events: none;
                z-index: 0;
            `;
            spriteContainer.appendChild(trail);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(trail, {
                    opacity: 0,
                    x: -40,
                    scale: 0.9,
                    duration: 0.2,
                    ease: 'power1.out',
                    onComplete: () => trail.remove()
                });
            } else {
                setTimeout(() => trail.remove(), 200);
            }
        }, delay);
    };
    
    // 트레일 생성
    createGSAPTrail(20, 0.7);
    createGSAPTrail(50, 0.5);
    createGSAPTrail(80, 0.35);
    createGSAPTrail(110, 0.2);
    
    // 🌪️ VFX 이펙트
    if (typeof VFX !== 'undefined') {
        VFX.sparks(rect.left + rect.width / 2, rect.bottom - 10, { 
            color: '#94a3b8', count: 15, speed: 100, size: 4
        });
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const lineY = rect.top + rect.height * 0.3 + (Math.random() * rect.height * 0.4);
                if (typeof VFX.speedLine === 'function') {
                    VFX.speedLine(rect.left + rect.width * 0.4, lineY, { 
                        color: '#cbd5e1', length: 60 + Math.random() * 40 
                    });
                }
            }, 40 + i * 20);
        }
    }
    
    // 🏃 GSAP 대시 애니메이션
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });
        
        // 스프라이트 대시 모션
        tl.to(spriteImg, {
            scaleX: 1.15,
            skewX: 12,
            filter: 'brightness(1.3)',
            duration: 0.08,
            ease: 'power1.in'
        })
        .to(enemyEl, {
            x: 100,
            duration: 0.22,
            ease: 'power2.in'
        }, '<')
        .to(spriteImg, {
            scaleX: 1,
            skewX: 0,
            filter: 'brightness(1)',
            duration: 0.1,
            ease: 'power1.out'
        }, '-=0.1')
        .to(enemyEl, {
            opacity: 0,
            duration: 0.08,
            ease: 'power1.in'
        }, '-=0.05');
        
        // 다른 적들 이동 (동시에)
        if (typeof gameState !== 'undefined' && gameState.enemies) {
            const currentPos = enemy.battlePosition || 0;
            const container = document.getElementById('enemies-container');
            
            gameState.enemies.forEach((otherEnemy, idx) => {
                if (otherEnemy === enemy || otherEnemy.isBoss || otherEnemy.isElite) return;
                if (otherEnemy.hp <= 0) return;
                
                const otherPos = otherEnemy.battlePosition || 0;
                if (otherPos > currentPos) {
                    const otherEl = container?.querySelector(`[data-index="${idx}"]`);
                    if (otherEl) {
                        gsap.to(otherEl, {
                            x: -25,
                            duration: 0.2,
                            ease: 'power1.out',
                            delay: 0.05
                        });
                    }
                }
            });
        }
    } else {
        // GSAP 없으면 CSS 애니메이션
        enemyEl.classList.add('enemy-dashing');
        setTimeout(() => {
            enemyEl.classList.remove('enemy-dashing');
            if (onComplete) onComplete();
        }, 300);
    }
});

// 도발 (조롱)
MonsterAnimations.register('taunt_mock', (context) => {
    const { enemyEl, enemy, onComplete } = context;
    
    if (!enemyEl) return;
    
    // 도발 애니메이션
    enemyEl.classList.add('enemy-taunting');
    
    // 말풍선 효과
    const bubble = document.createElement('div');
    bubble.className = 'taunt-bubble';
    bubble.innerHTML = '😤💢';
    bubble.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #f59e0b;
        border-radius: 10px;
        padding: 5px 10px;
        font-size: 1.5rem;
        animation: tauntBubble 0.8s ease-out forwards;
        z-index: 100;
    `;
    enemyEl.appendChild(bubble);
    
    // 이펙트
    if (typeof VFX !== 'undefined') {
        const rect = enemyEl.getBoundingClientRect();
        VFX.sparks(rect.left + rect.width / 2, rect.top, { 
            color: '#f59e0b', 
            count: 8, 
            speed: 100 
        });
    }
    
    setTimeout(() => {
        bubble.remove();
        enemyEl.classList.remove('enemy-taunting');
        if (onComplete) onComplete();
    }, 800);
});

// 방어 (웅크리기)
MonsterAnimations.register('defend_crouch', (context) => {
    const { enemyEl, onComplete } = context;
    
    if (!enemyEl) return;
    
    enemyEl.classList.add('enemy-defending');
    
    // 방어막 이펙트
    if (typeof VFX !== 'undefined') {
        const rect = enemyEl.getBoundingClientRect();
        VFX.shield(rect.left + rect.width / 2, rect.top + rect.height / 2, {
            color: '#60a5fa',
            size: 80
        });
    }
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-defending');
        if (onComplete) onComplete();
    }, 500);
});

// 할퀴기 (다중 공격)
MonsterAnimations.register('claw_swipe', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) return;
    
    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    enemyEl.classList.add('enemy-attacking');
    
    setTimeout(() => {
        // 할퀴기 이펙트
        if (typeof VFX !== 'undefined') {
            VFX.slash(targetX, targetY, { 
                color: '#ef4444', 
                slashCount: 3,
                randomOffset: 30
            });
        }
        
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(15, 300);
            EffectSystem.showDamageVignette();
        }
        
        if (onHit) onHit();
    }, 300);
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-attacking');
        if (onComplete) onComplete();
    }, 600);
});

// 독 뿜기
MonsterAnimations.register('poison_spit', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) return;
    
    const enemyRect = enemyEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    
    const fromX = enemyRect.left + enemyRect.width / 2;
    const fromY = enemyRect.top + enemyRect.height * 0.3;
    const toX = targetRect.left + targetRect.width / 2;
    const toY = targetRect.top + targetRect.height / 2;
    
    enemyEl.classList.add('enemy-spitting');
    
    setTimeout(() => {
        // 독 투사체
        if (typeof VFX !== 'undefined') {
            VFX.projectile(fromX, fromY, toX, toY, {
                color: '#22c55e',
                speed: 20,
                size: 12,
                onHit: () => {
                    VFX.impact(toX, toY, { color: '#22c55e', size: 60 });
                    VFX.sparks(toX, toY, { color: '#4ade80', count: 10, speed: 80 });
                    
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.screenShake(10, 200);
                        EffectSystem.showDamageVignette();
                    }
                    if (onHit) onHit();
                }
            });
        }
    }, 200);
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-spitting');
        if (onComplete) onComplete();
    }, 700);
});

// 돌진 공격
MonsterAnimations.register('charge_attack', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) return;
    
    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    // 강화된 돌진
    enemyEl.classList.add('enemy-charging');
    
    setTimeout(() => {
        if (typeof VFX !== 'undefined') {
            VFX.impact(targetX, targetY, { color: '#ef4444', size: 120 });
            VFX.slash(targetX, targetY, { color: '#fbbf24', slashCount: 1 });
        }
        
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(25, 500);
            EffectSystem.showDamageVignette();
        }
        
        if (onHit) onHit();
    }, 400);
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-charging');
        if (onComplete) onComplete();
    }, 800);
});

// 마법 공격
MonsterAnimations.register('magic_blast', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) return;
    
    const enemyRect = enemyEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    
    const fromX = enemyRect.left + enemyRect.width / 2;
    const fromY = enemyRect.top + enemyRect.height * 0.3;
    const toX = targetRect.left + targetRect.width / 2;
    const toY = targetRect.top + targetRect.height / 2;
    
    enemyEl.classList.add('enemy-casting');
    
    // 캐스팅 이펙트
    if (typeof VFX !== 'undefined') {
        VFX.sparks(fromX, fromY, { color: '#a855f7', count: 15, speed: 50 });
    }
    
    setTimeout(() => {
        // 마법 투사체
        if (typeof VFX !== 'undefined') {
            VFX.projectile(fromX, fromY, toX, toY, {
                color: '#a855f7',
                speed: 22,
                size: 18,
                onHit: () => {
                    VFX.impact(toX, toY, { color: '#a855f7', size: 100 });
                    VFX.sparks(toX, toY, { color: '#c084fc', count: 20, speed: 150 });
                    
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.screenShake(18, 350);
                        EffectSystem.showDamageVignette();
                    }
                    if (onHit) onHit();
                }
            });
        }
    }, 400);
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-casting');
        if (onComplete) onComplete();
    }, 900);
});

// ==========================================
// CSS 스타일 주입
// ==========================================
const monsterAnimStyles = document.createElement('style');
monsterAnimStyles.id = 'monster-animation-styles';
monsterAnimStyles.textContent = `
    /* 조준선 펄스 */
    @keyframes aimPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }
    
    /* 타겟 락온 */
    @keyframes targetLock {
        0% { 
            transform: translate(-50%, -50%) scale(0) rotate(0deg); 
            opacity: 0;
        }
        50% { 
            transform: translate(-50%, -50%) scale(1.5) rotate(90deg); 
            opacity: 1;
        }
        100% { 
            transform: translate(-50%, -50%) scale(1) rotate(180deg); 
            opacity: 1;
        }
    }
    
    /* 🏃 대시 애니메이션 (후퇴) */
    .enemy-dashing {
        animation: dashMove 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards !important;
    }
    
    .enemy-dashing .enemy-sprite-img {
        animation: dashSprite 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    @keyframes dashMove {
        0% { 
            transform: translateX(0) scale(1);
            filter: blur(0);
            opacity: 1;
        }
        15% { 
            transform: translateX(-15px) scale(0.95);
            opacity: 1;
        }
        30% { 
            transform: translateX(20px) scale(1.05);
            filter: blur(1px);
            opacity: 1;
        }
        80% { 
            transform: translateX(100px) scale(1);
            opacity: 0.3;
            filter: blur(2px);
        }
        100% { 
            transform: translateX(120px) scale(0.95);
            opacity: 0;
            filter: blur(3px);
        }
    }
    
    @keyframes dashSprite {
        0% { 
            transform: scaleX(1) skewX(0deg);
            filter: brightness(1);
        }
        15% { 
            transform: scaleX(0.85) skewX(-5deg);
        }
        30% { 
            transform: scaleX(1.2) skewX(10deg);
            filter: brightness(1.3);
        }
        50% {
            transform: scaleX(1.3) skewX(15deg);
            filter: brightness(1.5) drop-shadow(-10px 0 15px rgba(148, 163, 184, 0.8));
        }
        100% { 
            transform: scaleX(1) skewX(0deg);
            filter: brightness(1);
        }
    }
    
    /* 잔상(트레일) 페이드 */
    @keyframes trailFade {
        0% {
            opacity: inherit;
            transform: translateX(0) scaleX(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-30px) scaleX(0.8);
        }
    }
    
    /* 🔄 다른 적 앞으로 이동 효과 */
    .enemy-shifting-forward {
        animation: shiftForward 0.3s ease-out forwards !important;
    }
    
    .enemy-shifting-forward .enemy-sprite-img {
        animation: shiftForwardSprite 0.3s ease-out !important;
    }
    
    @keyframes shiftForward {
        0% { 
            transform: translateX(0);
            opacity: 1;
        }
        40% {
            transform: translateX(-20px);
            opacity: 1;
        }
        100% { 
            transform: translateX(-50px);
            opacity: 0;
        }
    }
    
    @keyframes shiftForwardSprite {
        0% { 
            transform: scaleX(1);
        }
        40% { 
            transform: scaleX(1.08);
            filter: brightness(1.15);
        }
        100% { 
            transform: scaleX(1);
            filter: brightness(1);
        }
    }
    
    /* 구 후퇴 애니메이션 (호환용) */
    .enemy-retreating {
        animation: dashMove 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards !important;
    }
    
    .enemy-retreating .enemy-sprite-img {
        animation: dashSprite 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    /* 파워 샷 (강화된 활 쏘기) */
    .enemy-power-shot .enemy-sprite-img {
        filter: brightness(1.3) drop-shadow(0 0 15px #ef4444) !important;
    }
    
    /* 도발 애니메이션 */
    .enemy-taunting {
        animation: tauntJump 0.8s ease-out !important;
    }
    
    .enemy-taunting .enemy-sprite-img {
        animation: tauntShake 0.1s linear infinite !important;
    }
    
    @keyframes tauntJump {
        0%, 100% { transform: translateY(0); }
        20% { transform: translateY(-15px); }
        40% { transform: translateY(0); }
        60% { transform: translateY(-10px); }
        80% { transform: translateY(0); }
    }
    
    @keyframes tauntShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
    }
    
    /* 도발 말풍선 */
    @keyframes tauntBubble {
        0% { transform: translateX(-50%) scale(0); opacity: 0; }
        30% { transform: translateX(-50%) scale(1.2); opacity: 1; }
        50% { transform: translateX(-50%) scale(1); opacity: 1; }
        100% { transform: translateX(-50%) translateY(-20px) scale(0.8); opacity: 0; }
    }
    
    /* 방어 웅크리기 */
    .enemy-defending .enemy-sprite-img {
        animation: defendCrouch 0.5s ease-out !important;
        filter: brightness(1.1) drop-shadow(0 0 10px #60a5fa) !important;
    }
    
    @keyframes defendCrouch {
        0% { transform: scaleY(1) translateY(0); }
        30% { transform: scaleY(0.85) translateY(10px); }
        100% { transform: scaleY(1) translateY(0); }
    }
    
    /* 뱉기 (독, 불 등) */
    .enemy-spitting .enemy-sprite-img {
        animation: spitMotion 0.7s ease-out !important;
    }
    
    @keyframes spitMotion {
        0% { transform: scaleX(1) translateX(0); }
        30% { transform: scaleX(0.9) translateX(5px); }
        50% { transform: scaleX(1.15) translateX(-10px); }
        100% { transform: scaleX(1) translateX(0); }
    }
    
    /* 돌진 */
    .enemy-charging {
        animation: chargeRush 0.8s ease-out !important;
    }
    
    .enemy-charging .enemy-sprite-img {
        filter: brightness(1.2) drop-shadow(0 0 20px #ef4444) !important;
    }
    
    @keyframes chargeRush {
        0% { transform: translateX(0) scale(1); }
        20% { transform: translateX(30px) scale(0.95); }
        50% { transform: translateX(-150px) scale(1.2); }
        70% { transform: translateX(-120px) scale(1.1); }
        100% { transform: translateX(0) scale(1); }
    }
    
    /* 마법 캐스팅 */
    .enemy-casting .enemy-sprite-img {
        animation: castGlow 0.9s ease-out !important;
    }
    
    @keyframes castGlow {
        0% { 
            filter: brightness(1); 
            transform: scale(1);
        }
        30% { 
            filter: brightness(1.5) drop-shadow(0 0 20px #a855f7); 
            transform: scale(1.05);
        }
        50% { 
            filter: brightness(2) drop-shadow(0 0 30px #a855f7); 
            transform: scale(1.1);
        }
        70% { 
            filter: brightness(1.3) drop-shadow(0 0 15px #a855f7); 
            transform: scale(1.02);
        }
        100% { 
            filter: brightness(1); 
            transform: scale(1);
        }
    }
`;
document.head.appendChild(monsterAnimStyles);

// ==========================================
// 전역 등록
// ==========================================
window.MonsterAnimations = MonsterAnimations;

console.log('[MonsterAnimations] 몬스터 애니메이션 시스템 로드됨');
