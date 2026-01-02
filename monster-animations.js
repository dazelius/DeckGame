// ==========================================
// 몬스터 애니메이션 시스템
// 패턴별 유니크 애니메이션 바인딩
// ==========================================

// ✅ 적 위치 가져오기 유틸리티 (PixiJS/DOM 자동 선택)
function getEnemyPositionForAnimation(enemyEl) {
    // PixiJS 적 렌더링 사용 시
    if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled && enemyEl) {
        const pos = EnemyRenderer.getPositionFromElement(enemyEl);
        if (pos) {
            return {
                centerX: pos.centerX,
                centerY: pos.centerY,
                topY: pos.top + (pos.height * 0.4),  // 발사 위치 (상단 40%)
                width: pos.width,
                height: pos.height
            };
        }
    }
    
    // DOM 폴백
    if (enemyEl) {
        const rect = enemyEl.getBoundingClientRect();
        return {
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            topY: rect.top + rect.height * 0.4,
            width: rect.width,
            height: rect.height
        };
    }
    
    return null;
}

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
    
    if (!targetEl) return;
    
    // ✅ 적 위치 가져오기 (PixiJS/DOM 자동 선택)
    const enemyPos = getEnemyPositionForAnimation(enemyEl);
    if (!enemyPos) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    // 활 쏘기 애니메이션 시작 (DOM 있을 때만)
    if (enemyEl) {
        enemyEl.classList.add('enemy-shooting');
    }
    
    // 발사 타이밍 (애니메이션 50% = 0.4초 * 0.5 = 200ms)
    setTimeout(() => {
        const targetRect = targetEl.getBoundingClientRect();
        
        const fromX = enemyPos.centerX;
        const fromY = enemyPos.topY;
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
        if (enemyEl) {
            enemyEl.classList.remove('enemy-shooting');
        }
        if (onComplete) onComplete();
    }, 400);
});

// 독화살 (독/출혈 효과)
MonsterAnimations.register('arrow_poison', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!targetEl) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    // ✅ 적 위치 가져오기 (PixiJS/DOM 자동 선택)
    const enemyPos = getEnemyPositionForAnimation(enemyEl);
    if (!enemyPos) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    // DOM 요소가 있을 때만 DOM 애니메이션
    if (enemyEl) {
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
    }
    
    setTimeout(() => {
        const targetRect = targetEl.getBoundingClientRect();
        
        const fromX = enemyPos.centerX;
        const fromY = enemyPos.topY;
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
        if (enemyEl) {
            enemyEl.classList.remove('enemy-shooting');
        }
        if (onComplete) onComplete();
    }, 450);
});

// 급소 조준 (강화된 화살 - 스피디)
MonsterAnimations.register('arrow_precision', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!targetEl) return;
    
    // ✅ 적 위치 가져오기 (PixiJS/DOM 자동 선택)
    const enemyPos = getEnemyPositionForAnimation(enemyEl);
    if (!enemyPos) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    // 강화 활 쏘기 (파워샷) - DOM 있을 때만
    if (enemyEl) {
        enemyEl.classList.add('enemy-shooting', 'enemy-power-shot');
    }
    
    // 발사 (200ms)
    setTimeout(() => {
        const targetRect = targetEl.getBoundingClientRect();
        
        const fromX = enemyPos.centerX;
        const fromY = enemyPos.topY;
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
        if (enemyEl) {
            enemyEl.classList.remove('enemy-shooting', 'enemy-power-shot');
        }
        if (onComplete) onComplete();
    }, 450);
});

// ==========================================
// ⚡ 산데비스탄 스타일 대시 애니메이션
// ==========================================
function executeDashAnimation(context, direction = 'right') {
    const { enemyEl, enemy, onComplete } = context;
    
    if (!enemyEl) {
        if (onComplete) onComplete();
        return;
    }
    
    const isRight = direction === 'right';
    const dirMultiplier = isRight ? 1 : -1;
    
    if (typeof SoundSystem !== 'undefined' && SoundSystem.play) {
        SoundSystem.play('dash');
    }
    
    const rect = enemyEl.getBoundingClientRect();
    const spriteImg = enemyEl.querySelector('.enemy-sprite-img');
    const spriteContainer = enemyEl.querySelector('.enemy-sprite-container');
    
    if (typeof gsap === 'undefined') {
        if (onComplete) setTimeout(onComplete, 300);
        return;
    }
    
    const dashDistance = 500 * dirMultiplier;
    
    // ==========================================
    // 🌀 산데비스탄 시간 왜곡 오버레이
    // ==========================================
    const timeWarpOverlay = document.createElement('div');
    timeWarpOverlay.className = 'sandevistan-overlay';
    timeWarpOverlay.innerHTML = `
        <div class="sandevistan-radial"></div>
        <div class="sandevistan-lines"></div>
    `;
    document.body.appendChild(timeWarpOverlay);
    
    // CSS 삽입 (한번만)
    if (!document.getElementById('sandevistan-styles')) {
        const style = document.createElement('style');
        style.id = 'sandevistan-styles';
        style.textContent = `
            .sandevistan-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                z-index: 9999;
                overflow: hidden;
            }
            .sandevistan-radial {
                position: absolute;
                top: 50%; left: 50%;
                width: 200vmax; height: 200vmax;
                transform: translate(-50%, -50%);
                background: radial-gradient(ellipse at center, 
                    transparent 0%, 
                    transparent 30%,
                    rgba(0, 200, 255, 0.03) 50%,
                    rgba(255, 50, 100, 0.05) 70%,
                    rgba(0, 0, 0, 0.2) 100%
                );
                opacity: 0;
            }
            .sandevistan-lines {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: repeating-linear-gradient(
                    90deg,
                    transparent 0px,
                    transparent 3px,
                    rgba(255, 255, 255, 0.02) 3px,
                    rgba(255, 255, 255, 0.02) 4px
                );
                opacity: 0;
            }
            .sandevistan-ghost {
                position: absolute;
                pointer-events: none;
                image-rendering: pixelated;
            }
            .sandevistan-chromatic {
                filter: url(#chromatic-aberration) !important;
            }
            @keyframes sandevistan-pulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 색수차 SVG 필터
    if (!document.getElementById('chromatic-aberration')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'chromatic-aberration';
        svg.style.cssText = 'position:absolute;width:0;height:0;';
        svg.innerHTML = `
            <defs>
                <filter id="chromatic-aberration">
                    <feOffset in="SourceGraphic" dx="-3" dy="0" result="red">
                        <animate attributeName="dx" values="-3;-5;-3" dur="0.1s" repeatCount="indefinite"/>
                    </feOffset>
                    <feOffset in="SourceGraphic" dx="3" dy="0" result="blue">
                        <animate attributeName="dx" values="3;5;3" dur="0.1s" repeatCount="indefinite"/>
                    </feOffset>
                    <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red-only"/>
                    <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue-only"/>
                    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green-only"/>
                    <feBlend in="red-only" in2="green-only" mode="screen" result="rg"/>
                    <feBlend in="rg" in2="blue-only" mode="screen"/>
                </filter>
            </defs>
        `;
        document.body.appendChild(svg);
    }
    
    // ==========================================
    // 👻 다중 고스트 생성 함수
    // ==========================================
    const ghosts = [];
    function createGhost(offsetX, opacity, blur, hue) {
        if (!spriteImg) return;
        const ghost = spriteImg.cloneNode(true);
        ghost.className = 'sandevistan-ghost';
        const imgRect = spriteImg.getBoundingClientRect();
        ghost.style.cssText = `
            position: fixed;
            left: ${imgRect.left + offsetX}px;
            top: ${imgRect.top}px;
            width: ${imgRect.width}px;
            height: ${imgRect.height}px;
            opacity: ${opacity};
            filter: blur(${blur}px) brightness(1.5) hue-rotate(${hue}deg) saturate(1.5);
            transform: scaleX(${1 + Math.abs(offsetX) * 0.002});
            z-index: 9998;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(ghost);
        ghosts.push(ghost);
        return ghost;
    }
    
    // ==========================================
    // ⚡ 메인 타임라인
    // ==========================================
    const tl = gsap.timeline({
        onComplete: () => {
            // 클린업
            gsap.set(enemyEl, { x: 0, opacity: 1, scale: 1, filter: 'none' });
            if (spriteImg) {
                gsap.set(spriteImg, { 
                    scaleX: 1, scaleY: 1, skewX: 0, 
                    filter: 'none', x: 0, rotation: 0 
                });
                spriteImg.classList.remove('sandevistan-chromatic');
            }
            timeWarpOverlay.remove();
            ghosts.forEach(g => g.remove());
            if (onComplete) onComplete();
        }
    });
    
    // 1️⃣ 시간 정지 순간 (산데비스탄 활성화!)
    tl.to(timeWarpOverlay.querySelector('.sandevistan-radial'), {
        opacity: 1,
        scale: 1.2,
        duration: 0.15,
        ease: 'power2.out'
    })
    .to(timeWarpOverlay.querySelector('.sandevistan-lines'), {
        opacity: 0.5,
        duration: 0.1
    }, '<')
    .call(() => {
        // 색수차 활성화
        if (spriteImg) spriteImg.classList.add('sandevistan-chromatic');
        
        // 화면 색조 변화
        gsap.to('.battle-arena', {
            filter: 'saturate(0.7) brightness(0.9) contrast(1.1)',
            duration: 0.1
        });
    });
    
    // 2️⃣ 준비 자세 (웅크림)
    tl.to(enemyEl, {
        x: -30 * dirMultiplier,
        scale: 0.9,
        duration: 0.1,
        ease: 'power2.in'
    })
    .to(spriteImg, {
        scaleX: 0.8,
        scaleY: 1.2,
        duration: 0.1,
        ease: 'power2.in'
    }, '<');
    
    // 3️⃣ 산데비스탄 대시! (초고속)
    tl.call(() => {
        // 시작 고스트들 (색수차 효과)
        createGhost(-15 * dirMultiplier, 0.6, 2, -30);  // 빨강 쉬프트
        createGhost(15 * dirMultiplier, 0.6, 2, 30);    // 파랑 쉬프트
        
        // VFX
        if (typeof VFX !== 'undefined') {
            VFX.sparks(rect.left + rect.width / 2, rect.bottom, { 
                color: '#00ffff', count: 40, speed: 300, size: 3
            });
        }
    })
    .to(enemyEl, {
        x: dashDistance,
        duration: 0.12,  // 초고속!
        ease: 'power4.in',
        onUpdate: function() {
            const progress = this.progress();
            
            // 이동 중 다중 고스트 생성
            if (progress > 0.1 && progress < 0.95) {
                const ghostOffset = (1 - progress) * dashDistance * 0.8;
                
                if (Math.random() > 0.3) {
                    const ghost = createGhost(
                        -ghostOffset * dirMultiplier,
                        0.4 + Math.random() * 0.3,
                        1 + progress * 4,
                        Math.random() * 60 - 30
                    );
                    
                    if (ghost) {
                        gsap.to(ghost, {
                            opacity: 0,
                            x: -30 * dirMultiplier,
                            filter: 'blur(10px) brightness(2)',
                            duration: 0.15,
                            ease: 'power2.out',
                            onComplete: () => {
                                ghost.remove();
                                const idx = ghosts.indexOf(ghost);
                                if (idx > -1) ghosts.splice(idx, 1);
                            }
                        });
                    }
                }
            }
        }
    })
    .to(spriteImg, {
        scaleX: 2.5,  // 극단적 늘어남
        scaleY: 0.5,
        skewX: 35 * dirMultiplier,
        filter: 'brightness(2.5) blur(3px)',
        x: 50 * dirMultiplier,
        duration: 0.12,
        ease: 'power4.in'
    }, '<');
    
    // 4️⃣ 스피드라인 폭발
    tl.call(() => {
        if (typeof VFX !== 'undefined' && VFX.speedLine) {
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const lineY = rect.top + rect.height * 0.1 + (Math.random() * rect.height * 0.8);
                    const startX = isRight ? rect.left - 50 : rect.right + 50;
                    VFX.speedLine(startX, lineY, { 
                        color: i < 6 ? '#00ffff' : (i < 12 ? '#ffffff' : '#ff0066'),
                        length: 150 + Math.random() * 100,
                        thickness: i < 4 ? 5 : (i < 10 ? 3 : 2),
                        angle: isRight ? 0 : 180
                    });
                }, i * 8);
            }
        }
        
        // 도착점 충격파
        if (typeof VFX !== 'undefined') {
            const endX = rect.left + dashDistance;
            VFX.sparks(endX, rect.bottom, { 
                color: '#ff0066', count: 25, speed: 200, size: 4
            });
        }
    }, null, '-=0.08');
    
    // 5️⃣ 시간 복구 & 페이드아웃
    tl.to(timeWarpOverlay.querySelector('.sandevistan-radial'), {
        opacity: 0,
        scale: 2,
        duration: 0.15,
        ease: 'power2.in'
    })
    .to(timeWarpOverlay.querySelector('.sandevistan-lines'), {
        opacity: 0,
        duration: 0.1
    }, '<')
    .to('.battle-arena', {
        filter: 'none',
        duration: 0.15
    }, '<')
    .to(enemyEl, {
        opacity: 0,
        duration: 0.05,
        ease: 'none'
    }, '-=0.1');
}

// 산데비스탄 고스트 트레일 (호환용)
function createProjectileTrail(enemyEl, spriteImg, dirMultiplier, progress) {
    // 기존 호환성 유지
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
// 🔮 고블린 샤먼 애니메이션
// ==========================================

// 마법 화살 (보라색 마법 투사체)
MonsterAnimations.register('magic_arrow', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete } = context;
    
    if (!enemyEl || !targetEl) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    const sprite = enemyEl.querySelector('.enemy-sprite-img');
    const enemyRect = enemyEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    
    if (typeof gsap !== 'undefined' && sprite) {
        const timeline = gsap.timeline();
        
        // 1단계: 마력 충전 (빛나면서 떨림)
        timeline.to(sprite, {
            filter: 'brightness(1.5) drop-shadow(0 0 20px #a855f7)',
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.in'
        });
        
        // 마력 충전 VFX
        timeline.call(() => {
            if (typeof VFX !== 'undefined') {
                // 보라색 마법 파티클
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        VFX.sparks(
                            enemyRect.left + enemyRect.width / 2 + (Math.random() - 0.5) * 40,
                            enemyRect.top + enemyRect.height / 2 + (Math.random() - 0.5) * 40,
                            { color: '#a855f7', count: 3, speed: 50, size: 4 }
                        );
                    }, i * 30);
                }
            }
        });
        
        // 2단계: 손 내밀기 (발사 자세)
        timeline.to(sprite, {
            x: -15,
            scaleX: 1.1,
            duration: 0.15,
            ease: 'power2.out'
        });
        
        // 3단계: 마법 투사체 발사
        timeline.call(() => {
            // 마법 화살 투사체 생성
            const projectile = document.createElement('div');
            projectile.className = 'magic-projectile';
            projectile.innerHTML = '🔮';
            projectile.style.cssText = `
                position: fixed;
                left: ${enemyRect.left}px;
                top: ${enemyRect.top + enemyRect.height / 2}px;
                font-size: 28px;
                z-index: 10000;
                pointer-events: none;
                filter: drop-shadow(0 0 15px #a855f7) drop-shadow(0 0 30px #7c3aed);
            `;
            document.body.appendChild(projectile);
            
            // 투사체 이동
            gsap.to(projectile, {
                left: targetRect.left + targetRect.width / 2,
                top: targetRect.top + targetRect.height / 2,
                scale: 1.5,
                rotation: 360,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    projectile.remove();
                    
                    // 히트!
                    if (onHit) onHit();
                    
                    // 임팩트 VFX
                    if (typeof VFX !== 'undefined') {
                        VFX.sparks(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, {
                            color: '#a855f7', count: 25, speed: 200, size: 6
                        });
                        VFX.sparks(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, {
                            color: '#c084fc', count: 15, speed: 150, size: 4
                        });
                    }
                    
                    // 화면 흔들림
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.screenShake(8, 150);
                    }
                }
            });
            
            // 트레일 효과
            let trailCount = 0;
            const trailInterval = setInterval(() => {
                if (trailCount++ > 5) {
                    clearInterval(trailInterval);
                    return;
                }
                const trail = document.createElement('div');
                trail.innerHTML = '✨';
                trail.style.cssText = `
                    position: fixed;
                    left: ${parseFloat(projectile.style.left)}px;
                    top: ${parseFloat(projectile.style.top)}px;
                    font-size: 16px;
                    z-index: 9999;
                    pointer-events: none;
                    opacity: 0.8;
                `;
                document.body.appendChild(trail);
                gsap.to(trail, {
                    opacity: 0,
                    scale: 0.3,
                    duration: 0.3,
                    onComplete: () => trail.remove()
                });
            }, 40);
        });
        
        // 4단계: 복귀
        timeline.to(sprite, {
            x: 0,
            scale: 1,
            scaleX: 1,
            filter: 'brightness(1)',
            duration: 0.3,
            ease: 'power2.out'
        }, '+=0.3');
        
        // 완료
        timeline.call(() => {
            if (onComplete) onComplete();
        });
    } else {
        if (onHit) onHit();
        setTimeout(() => { if (onComplete) onComplete(); }, 500);
    }
});

// 번개 폭풍 (강력한 번개 VFX)
MonsterAnimations.register('thunder_storm', (context) => {
    const { enemyEl, targetEl, damage, onHit, onComplete, enemy } = context;
    
    if (!enemyEl || !targetEl) {
        if (onHit) onHit();
        if (onComplete) onComplete();
        return;
    }
    
    const sprite = enemyEl.querySelector('.enemy-sprite-img');
    const enemyRect = enemyEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const hits = enemy?.intentHits || 3;
    
    if (typeof gsap !== 'undefined' && sprite) {
        const timeline = gsap.timeline();
        
        // 1단계: 마력 집중 (강하게 빛남)
        timeline.to(sprite, {
            filter: 'brightness(2) drop-shadow(0 0 30px #facc15) drop-shadow(0 0 50px #fbbf24)',
            scale: 1.15,
            y: -10,
            duration: 0.5,
            ease: 'power2.in'
        });
        
        // 충전 VFX (노란색 번개 파티클)
        timeline.call(() => {
            if (typeof VFX !== 'undefined') {
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        VFX.sparks(
                            enemyRect.left + enemyRect.width / 2 + (Math.random() - 0.5) * 60,
                            enemyRect.top + (Math.random() - 0.5) * 40,
                            { color: '#facc15', count: 5, speed: 100, size: 3 }
                        );
                    }, i * 25);
                }
            }
        });
        
        // 2단계: 팔 들기
        timeline.to(sprite, {
            y: -20,
            scaleY: 1.1,
            duration: 0.2,
            ease: 'power1.out'
        });
        
        // 3단계: 번개 연속 발사!
        timeline.call(() => {
            let hitCount = 0;
            const strikeLightning = () => {
                if (hitCount >= hits) return;
                
                // 번개 볼트 생성
                const bolt = document.createElement('div');
                bolt.className = 'lightning-bolt';
                bolt.innerHTML = '⚡';
                const offsetX = (Math.random() - 0.5) * 60;
                bolt.style.cssText = `
                    position: fixed;
                    left: ${targetRect.left + targetRect.width / 2 + offsetX}px;
                    top: ${targetRect.top - 200}px;
                    font-size: 80px;
                    z-index: 10000;
                    pointer-events: none;
                    filter: drop-shadow(0 0 20px #facc15) drop-shadow(0 0 40px #fbbf24);
                    transform: scaleY(2);
                `;
                document.body.appendChild(bolt);
                
                // 번개 낙하
                gsap.to(bolt, {
                    top: targetRect.top + targetRect.height / 2,
                    scaleY: 1,
                    duration: 0.08,
                    ease: 'power4.in',
                    onComplete: () => {
                        // 히트!
                        if (hitCount === 0 && onHit) onHit();
                        
                        // 화면 플래시
                        const flash = document.createElement('div');
                        flash.style.cssText = `
                            position: fixed;
                            inset: 0;
                            background: rgba(250, 204, 21, 0.4);
                            z-index: 9999;
                            pointer-events: none;
                        `;
                        document.body.appendChild(flash);
                        gsap.to(flash, { opacity: 0, duration: 0.15, onComplete: () => flash.remove() });
                        
                        // 임팩트 VFX
                        if (typeof VFX !== 'undefined') {
                            VFX.sparks(targetRect.left + targetRect.width / 2 + offsetX, targetRect.top + targetRect.height / 2, {
                                color: '#facc15', count: 30, speed: 250, size: 5
                            });
                            VFX.sparks(targetRect.left + targetRect.width / 2 + offsetX, targetRect.top + targetRect.height / 2, {
                                color: '#ffffff', count: 15, speed: 180, size: 3
                            });
                        }
                        
                        // 화면 흔들림
                        if (typeof EffectSystem !== 'undefined') {
                            EffectSystem.screenShake(15, 200);
                        }
                        
                        // 번개 사라짐
                        gsap.to(bolt, {
                            opacity: 0,
                            scale: 1.5,
                            duration: 0.2,
                            onComplete: () => bolt.remove()
                        });
                    }
                });
                
                hitCount++;
                if (hitCount < hits) {
                    setTimeout(strikeLightning, 250);
                }
            };
            strikeLightning();
        });
        
        // 4단계: 복귀
        timeline.to(sprite, {
            y: 0,
            scale: 1,
            scaleY: 1,
            filter: 'brightness(1)',
            duration: 0.4,
            ease: 'power2.out'
        }, `+=${hits * 0.25 + 0.3}`);
        
        // 완료
        timeline.call(() => {
            if (onComplete) onComplete();
        });
    } else {
        if (onHit) onHit();
        setTimeout(() => { if (onComplete) onComplete(); }, 800);
    }
});

// 치유 주문 (녹색 힐 이펙트 - 타겟에 적용)
MonsterAnimations.register('heal_spell', (context) => {
    const { enemyEl, enemy, targetEl, targetEnemy, onComplete } = context;
    
    if (!enemyEl) {
        if (onComplete) onComplete();
        return;
    }
    
    const sprite = enemyEl.querySelector('.enemy-sprite-img');
    const casterRect = enemyEl.getBoundingClientRect();
    // ✅ 타겟이 있으면 타겟 위치, 없으면 시전자 위치
    const targetRect = targetEl ? targetEl.getBoundingClientRect() : casterRect;
    
    if (typeof gsap !== 'undefined' && sprite) {
        const timeline = gsap.timeline();
        
        // 1단계: 캐스팅 포즈 (시전자)
        timeline.to(sprite, {
            filter: 'brightness(1.3) drop-shadow(0 0 20px #4ade80)',
            y: -5,
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        // 시전자 주변 마력 파티클
        timeline.call(() => {
            if (typeof VFX !== 'undefined') {
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        VFX.sparks(
                            casterRect.left + casterRect.width / 2 + (Math.random() - 0.5) * 30,
                            casterRect.top + casterRect.height / 2,
                            { color: '#4ade80', count: 3, speed: 50, size: 4 }
                        );
                    }, i * 40);
                }
            }
        });
        
        // 2단계: 마력 방출 + 힐 투사체
        timeline.to(sprite, {
            filter: 'brightness(1.8) drop-shadow(0 0 40px #4ade80)',
            scale: 1.1,
            duration: 0.2,
            ease: 'power1.in'
        });
        
        // 💚 힐 투사체가 타겟으로 날아감
        timeline.call(() => {
            const healOrb = document.createElement('div');
            healOrb.innerHTML = '💚';
            healOrb.style.cssText = `
                position: fixed;
                left: ${casterRect.left + casterRect.width / 2}px;
                top: ${casterRect.top + casterRect.height / 2}px;
                font-size: 32px;
                z-index: 10000;
                pointer-events: none;
                filter: drop-shadow(0 0 15px #4ade80) drop-shadow(0 0 30px #22c55e);
                transform: translate(-50%, -50%);
            `;
            document.body.appendChild(healOrb);
            
            // 타겟으로 이동
            gsap.to(healOrb, {
                left: targetRect.left + targetRect.width / 2,
                top: targetRect.top + targetRect.height / 2,
                scale: 1.5,
                duration: 0.35,
                ease: 'power2.in',
                onComplete: () => {
                    healOrb.remove();
                    
                    // ✅ 타겟에 힐 이펙트!
                    if (typeof VFX !== 'undefined') {
                        VFX.heal(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, {
                            color: '#4ade80', count: 20
                        });
                    }
                    
                    // 타겟에 힐 서클
                    const circle = document.createElement('div');
                    circle.style.cssText = `
                        position: fixed;
                        left: ${targetRect.left + targetRect.width / 2}px;
                        top: ${targetRect.top + targetRect.height}px;
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        border: 3px solid #4ade80;
                        transform: translate(-50%, -50%);
                        z-index: 9999;
                        pointer-events: none;
                        box-shadow: 0 0 20px #4ade80;
                    `;
                    document.body.appendChild(circle);
                    
                    gsap.to(circle, {
                        width: 120,
                        height: 120,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'power2.out',
                        onComplete: () => circle.remove()
                    });
                    
                    // 타겟 스프라이트 반짝임
                    if (targetEl) {
                        const targetSprite = targetEl.querySelector('.enemy-sprite-img');
                        if (targetSprite) {
                            gsap.to(targetSprite, {
                                filter: 'brightness(1.5) drop-shadow(0 0 20px #4ade80)',
                                duration: 0.15,
                                yoyo: true,
                                repeat: 1
                            });
                        }
                    }
                }
            });
        });
        
        // 3단계: 복귀 (시전자)
        timeline.to(sprite, {
            filter: 'brightness(1)',
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, '+=0.3');
        
        // 완료
        timeline.call(() => {
            if (onComplete) onComplete();
        });
    } else {
        setTimeout(() => { if (onComplete) onComplete(); }, 600);
    }
});

// 버프 주문 (빨간색/주황색 파워업 이펙트)
MonsterAnimations.register('buff_spell', (context) => {
    const { enemyEl, enemy, onComplete } = context;
    
    if (!enemyEl) {
        if (onComplete) onComplete();
        return;
    }
    
    const sprite = enemyEl.querySelector('.enemy-sprite-img');
    const enemyRect = enemyEl.getBoundingClientRect();
    
    if (typeof gsap !== 'undefined' && sprite) {
        const timeline = gsap.timeline();
        
        // 1단계: 캐스팅 포즈 (붉은 기운)
        timeline.to(sprite, {
            filter: 'brightness(1.3) drop-shadow(0 0 20px #f97316) hue-rotate(-10deg)',
            y: -5,
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        // 불꽃 파티클 시작
        timeline.call(() => {
            if (typeof VFX !== 'undefined') {
                // 주황색 파워 파티클
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        VFX.sparks(
                            enemyRect.left + enemyRect.width / 2 + (Math.random() - 0.5) * 50,
                            enemyRect.top + enemyRect.height / 2 + (Math.random() - 0.5) * 30,
                            { color: '#f97316', count: 4, speed: 80, size: 4 }
                        );
                    }, i * 40);
                }
            }
            
            // 파워 링 이펙트
            const ring = document.createElement('div');
            ring.innerHTML = '🔥';
            ring.style.cssText = `
                position: fixed;
                left: ${enemyRect.left + enemyRect.width / 2}px;
                top: ${enemyRect.top + enemyRect.height / 2}px;
                font-size: 40px;
                transform: translate(-50%, -50%) scale(0.5);
                z-index: 9999;
                pointer-events: none;
                filter: drop-shadow(0 0 15px #f97316);
            `;
            document.body.appendChild(ring);
            
            gsap.to(ring, {
                scale: 2,
                opacity: 0,
                y: -50,
                duration: 0.8,
                ease: 'power2.out',
                onComplete: () => ring.remove()
            });
        });
        
        // 2단계: 마력 방출 (붉은 폭발)
        timeline.to(sprite, {
            filter: 'brightness(2) drop-shadow(0 0 50px #ef4444)',
            scale: 1.15,
            duration: 0.2,
            ease: 'power1.in'
        });
        
        // 아군들에게 버프 이펙트 전파
        timeline.call(() => {
            // 모든 적(아군)에게 버프 이펙트
            const allEnemyEls = document.querySelectorAll('.enemy-unit');
            allEnemyEls.forEach((el, i) => {
                if (el === enemyEl) return; // 자신 제외
                
                setTimeout(() => {
                    const allyRect = el.getBoundingClientRect();
                    
                    // 버프 받는 이펙트
                    if (typeof VFX !== 'undefined') {
                        VFX.sparks(allyRect.left + allyRect.width / 2, allyRect.top + allyRect.height / 2, {
                            color: '#f97316', count: 15, speed: 100, size: 5
                        });
                    }
                    
                    // 버프 아이콘 팝업
                    const buffIcon = document.createElement('div');
                    buffIcon.innerHTML = '⚔️+';
                    buffIcon.style.cssText = `
                        position: fixed;
                        left: ${allyRect.left + allyRect.width / 2}px;
                        top: ${allyRect.top}px;
                        font-size: 24px;
                        font-weight: bold;
                        color: #f97316;
                        text-shadow: 0 0 10px #f97316;
                        transform: translateX(-50%);
                        z-index: 10000;
                        pointer-events: none;
                    `;
                    document.body.appendChild(buffIcon);
                    
                    gsap.to(buffIcon, {
                        y: -40,
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        onComplete: () => buffIcon.remove()
                    });
                    
                    // 아군 반짝임
                    const allySprite = el.querySelector('.enemy-sprite-img');
                    if (allySprite) {
                        gsap.to(allySprite, {
                            filter: 'brightness(1.5) drop-shadow(0 0 20px #f97316)',
                            duration: 0.2,
                            yoyo: true,
                            repeat: 1
                        });
                    }
                }, i * 100);
            });
        });
        
        // 3단계: 복귀
        timeline.to(sprite, {
            filter: 'brightness(1)',
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, '+=0.3');
        
        // 완료
        timeline.call(() => {
            if (onComplete) onComplete();
        });
    } else {
        setTimeout(() => { if (onComplete) onComplete(); }, 600);
    }
});

// 보호 주문 (파란색 방어 이펙트 - 아군에게 적용)
MonsterAnimations.register('shield_spell', (context) => {
    const { enemyEl, enemy, onComplete } = context;
    
    if (!enemyEl) {
        if (onComplete) onComplete();
        return;
    }
    
    const sprite = enemyEl.querySelector('.enemy-sprite-img');
    const casterRect = enemyEl.getBoundingClientRect();
    
    if (typeof gsap !== 'undefined' && sprite) {
        const timeline = gsap.timeline();
        
        // 1단계: 캐스팅 포즈 (파란 기운)
        timeline.to(sprite, {
            filter: 'brightness(1.3) drop-shadow(0 0 20px #60a5fa)',
            y: -5,
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        // 시전자 주변 마력 파티클
        timeline.call(() => {
            if (typeof VFX !== 'undefined') {
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        VFX.sparks(
                            casterRect.left + casterRect.width / 2 + (Math.random() - 0.5) * 40,
                            casterRect.top + casterRect.height / 2,
                            { color: '#60a5fa', count: 4, speed: 60, size: 4 }
                        );
                    }, i * 30);
                }
            }
        });
        
        // 2단계: 마력 방출
        timeline.to(sprite, {
            filter: 'brightness(1.8) drop-shadow(0 0 40px #3b82f6)',
            scale: 1.1,
            duration: 0.2,
            ease: 'power1.in'
        });
        
        // 🛡️ 보호막이 아군들에게 날아감
        timeline.call(() => {
            const allEnemyEls = document.querySelectorAll('.enemy-unit');
            let delay = 0;
            
            allEnemyEls.forEach((el) => {
                if (el === enemyEl) return; // 자신 제외
                
                const targetRect = el.getBoundingClientRect();
                
                setTimeout(() => {
                    // 보호막 오브 생성
                    const shieldOrb = document.createElement('div');
                    shieldOrb.innerHTML = '🛡️';
                    shieldOrb.style.cssText = `
                        position: fixed;
                        left: ${casterRect.left + casterRect.width / 2}px;
                        top: ${casterRect.top + casterRect.height / 2}px;
                        font-size: 28px;
                        z-index: 10000;
                        pointer-events: none;
                        filter: drop-shadow(0 0 10px #60a5fa) drop-shadow(0 0 20px #3b82f6);
                        transform: translate(-50%, -50%);
                    `;
                    document.body.appendChild(shieldOrb);
                    
                    // 타겟으로 이동
                    gsap.to(shieldOrb, {
                        left: targetRect.left + targetRect.width / 2,
                        top: targetRect.top + targetRect.height / 2,
                        scale: 1.3,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            shieldOrb.remove();
                            
                            // 방어막 이펙트
                            if (typeof VFX !== 'undefined') {
                                VFX.sparks(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, {
                                    color: '#60a5fa', count: 15, speed: 100, size: 5
                                });
                            }
                            
                            // 방어막 서클
                            const shield = document.createElement('div');
                            shield.style.cssText = `
                                position: fixed;
                                left: ${targetRect.left + targetRect.width / 2}px;
                                top: ${targetRect.top + targetRect.height / 2}px;
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                border: 3px solid #60a5fa;
                                transform: translate(-50%, -50%);
                                z-index: 9999;
                                pointer-events: none;
                                box-shadow: 0 0 20px #60a5fa, inset 0 0 20px rgba(96, 165, 250, 0.3);
                            `;
                            document.body.appendChild(shield);
                            
                            gsap.to(shield, {
                                width: 100,
                                height: 100,
                                opacity: 0,
                                duration: 0.4,
                                ease: 'power2.out',
                                onComplete: () => shield.remove()
                            });
                            
                            // 타겟 스프라이트 반짝임
                            const targetSprite = el.querySelector('.enemy-sprite-img');
                            if (targetSprite) {
                                gsap.to(targetSprite, {
                                    filter: 'brightness(1.4) drop-shadow(0 0 15px #60a5fa)',
                                    duration: 0.15,
                                    yoyo: true,
                                    repeat: 1
                                });
                            }
                        }
                    });
                }, delay);
                
                delay += 80;
            });
        });
        
        // 3단계: 복귀 (시전자)
        timeline.to(sprite, {
            filter: 'brightness(1)',
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, '+=0.5');
        
        // 완료
        timeline.call(() => {
            if (onComplete) onComplete();
        });
    } else {
        setTimeout(() => { if (onComplete) onComplete(); }, 600);
    }
});

// ==========================================
// 전역 등록
// ==========================================
window.MonsterAnimations = MonsterAnimations;

console.log('[MonsterAnimations] 몬스터 애니메이션 시스템 로드됨');
