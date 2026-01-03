// ==========================================
// Shadow Deck - 카드 애니메이션 시스템
// 카드별 고유 애니메이션을 관리하는 레지스트리
// ==========================================

const CardAnimations = {
    // 등록된 애니메이션 목록
    registry: {},
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[CardAnimations] 카드 애니메이션 시스템 초기화');
        this.registerAnimations();
    },
    
    // ==========================================
    // 애니메이션 등록
    // ==========================================
    registerAnimations() {
        // 🗡️ 연속 찌르기 (Flurry)
        this.registry['flurry'] = {
            name: '연속 찌르기',
            execute: this.flurryAnimation.bind(this)
        };
        
        // 🗡️ 연속 찌르기+ (Flurry+)
        this.registry['flurryP'] = {
            name: '연속 찌르기+',
            execute: this.flurryPlusAnimation.bind(this)
        };
        
        console.log('[CardAnimations] 등록된 애니메이션:', Object.keys(this.registry));
    },
    
    // ==========================================
    // 애니메이션 존재 여부 확인
    // ==========================================
    has(animationId) {
        return animationId && this.registry[animationId] !== undefined;
    },
    
    // ==========================================
    // 애니메이션 실행
    // ==========================================
    play(animationId, options = {}) {
        if (!this.has(animationId)) {
            console.warn(`[CardAnimations] 애니메이션 없음: ${animationId}`);
            return Promise.resolve();
        }
        
        console.log(`[CardAnimations] 🎬 애니메이션 실행: ${animationId}`);
        return this.registry[animationId].execute(options);
    },
    
    // ==========================================
    // 🗡️ 연속 찌르기 애니메이션 (3회 공격)
    // ==========================================
    flurryAnimation(options = {}) {
        const {
            target,           // 타겟 적 (enemy 객체)
            targetEl,         // 타겟 DOM 요소
            hitCount = 3,     // 타격 횟수
            damage = 2,       // 타격당 데미지
            interval = 120,   // 타격 간격 (ms)
            onHit,            // 각 타격 시 콜백
            onComplete        // 완료 시 콜백
        } = options;
        
        return new Promise((resolve) => {
            let currentHit = 0;
            
            // 🎯 타겟 위치 계산
            let targetX, targetY;
            if (target && typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                const pos = EnemyRenderer.getEnemyPosition(target);
                if (pos) {
                    targetX = pos.centerX;
                    targetY = pos.centerY;
                }
            }
            if (!targetX && targetEl) {
                const rect = targetEl.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
            }
            
            // 🏃 플레이어 돌진 (첫 번째)
            this.playerDashAttack(() => {
                // 돌진 완료 후 연속 찌르기 시작
                const doStab = () => {
                    if (currentHit >= hitCount) {
                        // 모든 타격 완료
                        setTimeout(() => {
                            if (onComplete) onComplete();
                            resolve();
                        }, 100);
                        return;
                    }
                    
                    // 🗡️ 찌르기 모션!
                    this.playerStabMotion(currentHit, hitCount);
                    
                    // ⚡ 슬래시 이펙트
                    if (targetX) {
                        const offsetY = (currentHit - 1) * 30;
                        const offsetX = (Math.random() - 0.5) * 40;
                        
                        if (typeof VFX !== 'undefined') {
                            // 빠른 찌르기 슬래시
                            VFX.slash(targetX + offsetX, targetY + offsetY, {
                                color: '#60a5fa',
                                length: 180,
                                width: 8,
                                angle: -10 + Math.random() * 20
                            });
                            
                            // 스파크
                            VFX.sparks(targetX + offsetX + 20, targetY + offsetY, { 
                                color: '#60a5fa', 
                                count: 6,
                                speed: 10
                            });
                        }
                        
                        // 히트 넘버
                        this.showHitNumber(targetX + 50, targetY + offsetY - 30, currentHit + 1);
                    }
                    
                    // 🎯 적 피격 애니메이션
                    if (target && typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                        EnemyRenderer.playHitAnimation(target, damage, false);
                    }
                    
                    // 💥 화면 흔들림 (가벼운)
                    if (typeof SpriteAnimation !== 'undefined') {
                        SpriteAnimation.screenShake(4 + currentHit * 2, 0.08);
                    }
                    
                    // 콜백
                    if (onHit) onHit(currentHit, damage);
                    
                    currentHit++;
                    
                    // 다음 타격
                    if (currentHit < hitCount) {
                        setTimeout(doStab, interval);
                    } else {
                        // 마지막 타격 후 약간의 딜레이
                        setTimeout(() => {
                            // 🏃 플레이어 복귀
                            this.playerReturnFromAttack();
                            
                            if (onComplete) onComplete();
                            resolve();
                        }, 150);
                    }
                };
                
                // 첫 번째 찌르기 시작
                doStab();
            });
        });
    },
    
    // ==========================================
    // 🗡️ 연속 찌르기+ 애니메이션 (5회 공격)
    // ==========================================
    flurryPlusAnimation(options = {}) {
        return this.flurryAnimation({
            ...options,
            hitCount: options.hitCount || 5,
            damage: options.damage || 2,
            interval: options.interval || 100  // 더 빠르게
        });
    },
    
    // ==========================================
    // 플레이어 돌진 공격
    // ==========================================
    playerDashAttack(onReach) {
        // PixiJS PlayerRenderer 사용
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
            const container = PlayerRenderer.playerContainer;
            if (!container) {
                if (onReach) onReach();
                return;
            }
            
            const baseScale = container.breathingBaseScale || PlayerRenderer.getPlayerScale();
            
            // 숨쉬기 일시 중지
            if (container.breathingTween) {
                container.breathingTween.pause();
            }
            
            PlayerRenderer.isAnimating = true;
            
            // 🏃 3D 대시
            if (typeof Background3D !== 'undefined' && Background3D.dashPlayer) {
                Background3D.dashPlayer(-1, () => {
                    if (onReach) onReach();
                });
            } else {
                // GSAP 2D 대시 (폴백)
                if (typeof gsap !== 'undefined') {
                    gsap.to(container, {
                        x: container.x + 80,
                        duration: 0.15,
                        ease: 'power2.out',
                        onComplete: () => {
                            if (onReach) onReach();
                        }
                    });
                } else {
                    if (onReach) onReach();
                }
            }
        } else {
            // DOM 폴백
            const playerEl = document.getElementById('player');
            if (playerEl) {
                playerEl.classList.add('player-attacking');
            }
            setTimeout(() => {
                if (onReach) onReach();
            }, 150);
        }
    },
    
    // ==========================================
    // 플레이어 찌르기 모션 (각 타격)
    // ==========================================
    playerStabMotion(hitIndex, totalHits) {
        if (typeof PlayerRenderer === 'undefined' || !PlayerRenderer.initialized) return;
        
        const container = PlayerRenderer.playerContainer;
        const sprite = PlayerRenderer.sprite;
        if (!container || !sprite) return;
        
        const baseScale = container.breathingBaseScale || PlayerRenderer.getPlayerScale();
        
        if (typeof gsap !== 'undefined') {
            // 이전 찌르기 애니메이션 킬
            gsap.killTweensOf(sprite);
            
            // 각 타격마다 다른 각도/방향
            const angles = [-5, 0, 5, -3, 3];
            const xOffsets = [10, 15, 12, 8, 14];
            const angle = angles[hitIndex % angles.length];
            const xOffset = xOffsets[hitIndex % xOffsets.length];
            
            // 🗡️ 빠른 찌르기 모션
            gsap.timeline()
                // 찌르기 준비 (짧게)
                .to(sprite, {
                    x: -5,
                    rotation: angle * 0.02,
                    duration: 0.03,
                    ease: 'power2.in'
                })
                // 찌르기! (빠르게 앞으로)
                .to(sprite, {
                    x: xOffset,
                    scaleX: 1.1,
                    scaleY: 0.95,
                    rotation: angle * 0.01,
                    duration: 0.04,
                    ease: 'power3.out'
                })
                // 복귀 (약간 느리게)
                .to(sprite, {
                    x: 0,
                    scaleX: 1,
                    scaleY: 1,
                    rotation: 0,
                    duration: 0.06,
                    ease: 'power2.out'
                });
            
            // ⚡ 틴트 플래시 (찌르는 순간)
            const originalTint = sprite.tint;
            sprite.tint = 0xaaddff;
            setTimeout(() => {
                sprite.tint = originalTint;
            }, 40);
        }
    },
    
    // ==========================================
    // 플레이어 공격 복귀
    // ==========================================
    playerReturnFromAttack() {
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
            const container = PlayerRenderer.playerContainer;
            if (!container) return;
            
            const baseScale = container.breathingBaseScale || PlayerRenderer.getPlayerScale();
            
            if (typeof gsap !== 'undefined') {
                gsap.to(container.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        PlayerRenderer.isAnimating = false;
                        
                        // 숨쉬기 재개
                        if (container.breathingTween) {
                            container.breathingTween.resume();
                        }
                    }
                });
            }
            
            // 3D 복귀
            if (typeof Background3D !== 'undefined' && Background3D.resetPlayerPosition) {
                setTimeout(() => {
                    Background3D.resetPlayerPosition(0.3);
                }, 100);
            }
        } else {
            // DOM 폴백
            const playerEl = document.getElementById('player');
            if (playerEl) {
                playerEl.classList.remove('player-attacking');
            }
        }
    },
    
    // ==========================================
    // 히트 넘버 표시
    // ==========================================
    showHitNumber(x, y, hitNum) {
        const number = document.createElement('div');
        number.textContent = hitNum;
        number.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-family: 'Cinzel', serif;
            font-size: 2rem;
            font-weight: 900;
            color: #60a5fa;
            text-shadow: 
                0 0 10px rgba(96, 165, 250, 1),
                0 0 20px rgba(96, 165, 250, 0.6),
                2px 2px 0 #000;
            transform: translate(-50%, -50%) scale(0);
            z-index: 10002;
            pointer-events: none;
        `;
        document.body.appendChild(number);
        
        // GSAP 애니메이션
        if (typeof gsap !== 'undefined') {
            gsap.timeline()
                .to(number, {
                    scale: 1.3,
                    duration: 0.08,
                    ease: 'back.out(3)'
                })
                .to(number, {
                    scale: 1,
                    duration: 0.05
                })
                .to(number, {
                    y: -30,
                    opacity: 0,
                    duration: 0.25,
                    delay: 0.1,
                    ease: 'power2.in',
                    onComplete: () => number.remove()
                });
        } else {
            number.style.animation = 'hitNumberPop 0.4s ease-out forwards';
            setTimeout(() => number.remove(), 400);
        }
    }
};

// 전역 노출
window.CardAnimations = CardAnimations;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    CardAnimations.init();
});

// 즉시 실행
if (document.readyState !== 'loading') {
    CardAnimations.init();
}

