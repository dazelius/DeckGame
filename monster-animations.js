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

// 독화살 (독/출혈 효과)
MonsterAnimations.register('arrow_poison', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    const spriteImg = enemyEl.querySelector('.enemy-sprite-img');
    
    // 독 기운 이펙트 (초록색 글로우)
    if (spriteImg && typeof gsap !== 'undefined') {
        gsap.to(spriteImg, {
            filter: 'brightness(1.2) hue-rotate(-40deg) drop-shadow(0 0 15px #22c55e)',
            duration: 0.15,
            yoyo: true,
            repeat: 1
        });
    }
    
    // 활 쏘기 애니메이션
    enemyEl.classList.add('enemy-shooting');
    
    setTimeout(() => {
        const enemyRect = enemyEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const fromX = enemyRect.left + enemyRect.width / 2;
        const fromY = enemyRect.top + enemyRect.height * 0.4;
        const toX = targetRect.left + targetRect.width / 2;
        const toY = targetRect.top + targetRect.height / 2;
        
        // 독화살 발사 (초록색)
        if (typeof VFX !== 'undefined' && VFX.arrow) {
            VFX.arrow(fromX, fromY, toX, toY, {
                speed: 45,
                color: '#22c55e', // 독 초록색
                onHit: () => {
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.screenShake(12, 300);
                        EffectSystem.showDamageVignette();
                    }
                    // 독 스플래시 이펙트
                    if (typeof VFX !== 'undefined') {
                        VFX.impact(toX, toY, { color: '#22c55e', size: 60 });
                        VFX.sparks(toX, toY, { color: '#4ade80', count: 15, speed: 100 });
                    }
                    if (onHit) onHit();
                }
            });
        } else {
            if (onHit) setTimeout(onHit, 100);
        }
    }, 180);
    
    setTimeout(() => {
        enemyEl.classList.remove('enemy-shooting');
        if (onComplete) onComplete();
    }, 450);
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

// ==========================================
// 🚀 통합 이동 애니메이션 (발사체처럼 슝~)
// ==========================================
function executeDashAnimation(context, direction = 'right') {
    const { enemyEl, enemy, onComplete } = context;
    
    if (!enemyEl) {
        if (onComplete) onComplete();
        return;
    }
    
    // 방향에 따른 설정
    const isRight = direction === 'right'; // 후퇴 = 오른쪽, 전진 = 왼쪽
    const dirMultiplier = isRight ? 1 : -1;
    
    // 사운드
    if (typeof SoundSystem !== 'undefined' && SoundSystem.play) {
        SoundSystem.play('dash');
    }
    
    const rect = enemyEl.getBoundingClientRect();
    const spriteImg = enemyEl.querySelector('.enemy-sprite-img');
    
    if (typeof gsap === 'undefined') {
        // GSAP 없으면 간단히 처리
        if (onComplete) setTimeout(onComplete, 300);
        return;
    }
    
    // 🎯 목표 거리 (화면 밖으로 발사!)
    const dashDistance = 400 * dirMultiplier;
    
    // ==========================================
    // 🌟 발사 준비 VFX (출발 지점)
    // ==========================================
    if (typeof VFX !== 'undefined') {
        // 발사 충격파
        VFX.sparks(rect.left + rect.width / 2, rect.bottom, { 
            color: '#f8fafc', count: 30, speed: 200, size: 4
        });
        VFX.sparks(rect.left + rect.width / 2, rect.bottom - 10, { 
            color: '#60a5fa', count: 15, speed: 150, size: 3
        });
    }
    
    // ==========================================
    // 🚀 메인 타임라인
    // ==========================================
    const tl = gsap.timeline({
        onComplete: () => {
            // 원상복구
            gsap.set(enemyEl, { x: 0, opacity: 1, scale: 1 });
            gsap.set(spriteImg, { 
                scaleX: 1, scaleY: 1, skewX: 0, 
                filter: 'none', x: 0, rotation: 0 
            });
            if (onComplete) onComplete();
        }
    });
    
    // 1️⃣ 준비 동작 (반대 방향으로 웅크림)
    tl.to(enemyEl, {
        x: -20 * dirMultiplier,
        scale: 0.95,
        duration: 0.08,
        ease: 'power2.in'
    })
    .to(spriteImg, {
        scaleX: 0.85,
        scaleY: 1.15,
        duration: 0.08,
        ease: 'power2.in'
    }, '<');
    
    // 2️⃣ 발사! (슝~)
    tl.to(enemyEl, {
        x: dashDistance,
        duration: 0.2,
        ease: 'power4.in',
        onUpdate: function() {
            // 이동 중 트레일 생성
            const progress = this.progress();
            if (progress > 0.2 && progress < 0.9 && Math.random() > 0.5) {
                createProjectileTrail(enemyEl, spriteImg, dirMultiplier, progress);
            }
        }
    })
    .to(spriteImg, {
        scaleX: 1.6,  // 횡방향으로 크게 늘어남 (발사체 느낌)
        scaleY: 0.7,
        skewX: 25 * dirMultiplier,
        filter: 'brightness(1.8) blur(4px) saturate(0.5)',
        x: 30 * dirMultiplier,
        duration: 0.2,
        ease: 'power4.in'
    }, '<');
    
    // 3️⃣ 스피드라인 VFX
    tl.call(() => {
        if (typeof VFX !== 'undefined' && VFX.speedLine) {
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    const lineY = rect.top + rect.height * 0.1 + (Math.random() * rect.height * 0.8);
                    const startX = isRight ? rect.left : rect.right;
                    VFX.speedLine(startX, lineY, { 
                        color: i < 4 ? '#ffffff' : '#94a3b8',
                        length: 100 + Math.random() * 80,
                        thickness: i < 3 ? 4 : 2,
                        angle: isRight ? 0 : 180
                    });
                }, i * 10);
            }
        }
    }, null, '-=0.15');
    
    // 4️⃣ 완전히 사라짐
    tl.to(enemyEl, {
        opacity: 0,
        duration: 0.05,
        ease: 'none'
    });
}

// 발사체 트레일 생성 함수
function createProjectileTrail(enemyEl, spriteImg, dirMultiplier, progress) {
    if (!spriteImg) return;
    
    const spriteContainer = enemyEl.querySelector('.enemy-sprite-container');
    if (!spriteContainer) return;
    
    const trail = spriteImg.cloneNode(true);
    trail.className = 'projectile-trail';
    
    const offsetX = (1 - progress) * 50 * -dirMultiplier;
    
    trail.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: auto;
        opacity: 0.6;
        filter: brightness(2.5) saturate(0) blur(${2 + progress * 6}px);
        pointer-events: none;
        z-index: -1;
        transform: translateX(${offsetX}px) scaleX(${1.2 + progress * 0.5}) scaleY(${0.8 - progress * 0.2});
    `;
    spriteContainer.appendChild(trail);
    
    // 빠르게 페이드아웃
    gsap.to(trail, {
        opacity: 0,
        x: offsetX - 40 * dirMultiplier,
        scaleX: 0.5,
        duration: 0.12,
        ease: 'power2.out',
        onComplete: () => trail.remove()
    });
}

// 후퇴 (뒤로 대시) - 발사체 스타일
MonsterAnimations.register('retreat_back', (context) => {
    executeDashAnimation(context, 'right');  // 오른쪽으로 발사
});

// 전진 (앞으로 대시) - 발사체 스타일
MonsterAnimations.register('advance_forward', (context) => {
    executeDashAnimation(context, 'left');  // 왼쪽으로 발사
});

// 급소 찌르기 (강력한 근접 공격)
MonsterAnimations.register('critical_strike', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    const sprite = enemyEl.querySelector('.enemy-sprite-img');
    const targetRect = targetEl.getBoundingClientRect();
    const enemyRect = enemyEl.getBoundingClientRect();
    
    if (typeof gsap !== 'undefined' && sprite) {
        const timeline = gsap.timeline();
        
        // 1단계: 긴장 자세 (살짝 뒤로 + 낮게)
        timeline.to(sprite, {
            x: 20,
            y: 5,
            scaleY: 0.95,
            scaleX: 1.05,
            duration: 0.15,
            ease: 'power1.in'
        });
        
        // 2단계: 빠른 대시! (왼쪽으로)
        timeline.to(sprite, {
            x: -(enemyRect.left - targetRect.right + 30),
            y: 0,
            scaleX: 1.2,
            skewX: -10,
            filter: 'brightness(1.5)',
            duration: 0.12,
            ease: 'power4.in'
        });
        
        // 3단계: 찌르기 (멈추면서 임팩트)
        timeline.call(() => {
            // 히트!
            if (onHit) onHit();
            
            // 임팩트 이펙트
            if (typeof VFX !== 'undefined') {
                VFX.sparks(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, {
                    color: '#ef4444',
                    count: 20,
                    speed: 180,
                    size: 5
                });
                VFX.sparks(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, {
                    color: '#fbbf24',
                    count: 15,
                    speed: 120,
                    size: 3
                });
            }
            
            // 화면 흔들림
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(12, 200);
            }
        });
        
        // 4단계: 히트스탑 (잠시 멈춤)
        timeline.to(sprite, {
            duration: 0.1,
            ease: 'none'
        });
        
        // 5단계: 복귀
        timeline.to(sprite, {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            filter: 'none',
            duration: 0.2,
            ease: 'power2.out'
        });
        
        // 완료
        timeline.call(() => {
            if (onComplete) onComplete();
        });
    } else {
        // GSAP 없으면 기본 처리
        if (onHit) onHit();
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 400);
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
