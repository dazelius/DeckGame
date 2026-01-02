// ==========================================
// 스프라이트 애니메이션 시스템 - GSAP 기반!
// Squash & Stretch + 생동감 있는 움직임
// ==========================================

const SpriteAnimation = {
    // 설정
    config: {
        breathingSpeed: 2,         // 숨쉬기 주기 (초)
        idleSpeed: 3,              // 대기 애니메이션 주기
        bounceHeight: 5,           // 튀어오르는 높이 (px)
        squashAmount: 0.05,        // 찌그러지는 정도 (0~1)
        stretchAmount: 0.08,       // 늘어나는 정도 (0~1)
    },
    
    // 활성화된 애니메이션들
    activeAnimations: new Map(),
    
    // MutationObserver
    observer: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[SpriteAnimation] GSAP 기반 초기화!');
        
        // GSAP 로드 확인
        if (typeof gsap === 'undefined') {
            console.error('[SpriteAnimation] GSAP이 로드되지 않았습니다!');
            return;
        }
        
        console.log('[SpriteAnimation] GSAP 버전:', gsap.version);
        this.startIdleAnimations();
        this.setupObserver();
    },
    
    // ==========================================
    // DOM 변화 감지 (적 생성 시 자동 애니메이션)
    // ==========================================
    setupObserver() {
        const enemyArea = document.querySelector('.enemy-area, .enemies-container');
        if (!enemyArea) {
            setTimeout(() => this.setupObserver(), 1000);
            return;
        }
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    setTimeout(() => this.refreshEnemyAnimations(), 100);
                }
            });
        });
        
        this.observer.observe(enemyArea, { childList: true, subtree: true });
        console.log('[SpriteAnimation] DOM Observer 설정 완료');
    },
    
    // ==========================================
    // 🌍 화면 흔들림 - GSAP! (더 과장되게!)
    // ==========================================
    screenShake(intensity = 5, duration = 0.15) {
        const gameContainer = document.querySelector('.game-container') || document.body;
        
        // 🔥 강도 증폭 (1.5배!)
        const boostedIntensity = intensity * 1.5;
        
        // 랜덤 흔들림
        gsap.to(gameContainer, {
            x: () => (Math.random() - 0.5) * boostedIntensity * 2,
            y: () => (Math.random() - 0.5) * intensity * 2,
            duration: 0.02,
            repeat: Math.floor(duration / 0.02),
            yoyo: true,
            ease: "none",
            onComplete: () => {
                gsap.set(gameContainer, { x: 0, y: 0 });
            }
        });
    },
    
    // ==========================================
    // 대기 애니메이션 시작
    // ==========================================
    startIdleAnimations() {
        this.startPlayerIdle();
        this.startEnemiesIdle();
    },
    
    refreshEnemyAnimations() {
        this.startEnemiesIdle();
    },
    
    // ==========================================
    // 플레이어 대기 애니메이션 - GSAP!
    // ==========================================
    startPlayerIdle() {
        // ✅ PixiJS PlayerRenderer 활성화 시 DOM 애니메이션 스킵
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.enabled && PlayerRenderer.initialized) {
            return;
        }
        
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        // 기존 애니메이션 정리
        this.stopAnimation('player-idle');
        
        // GSAP 타임라인으로 숨쉬기 애니메이션
        const tl = gsap.timeline({ repeat: -1, yoyo: true });
        tl.to(sprite, {
            y: -this.config.bounceHeight,
            scaleY: 1 + this.config.stretchAmount,
            scaleX: 1 - this.config.squashAmount * 0.5,
            duration: this.config.breathingSpeed / 2,
            ease: "sine.inOut"
        });
        
        this.activeAnimations.set('player-idle', tl);
    },
    
    // ==========================================
    // 적 대기 애니메이션 - GSAP!
    // ==========================================
    startEnemiesIdle() {
        // ✅ PixiJS EnemyRenderer 활성화 시 DOM 애니메이션 스킵
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled && EnemyRenderer.initialized) {
            return;
        }
        
        const enemyUnits = document.querySelectorAll('.enemy-unit');
        
        enemyUnits.forEach((enemyUnit, index) => {
            const sprite = enemyUnit.querySelector('.enemy-sprite-img');
            if (!sprite) return;
            
            const key = `enemy-idle-${index}`;
            this.stopAnimation(key);
            
            // 각 적마다 약간 다른 타이밍
            const delay = index * 0.3;
            const speed = this.config.breathingSpeed + (Math.random() * 0.5 - 0.25);
            
            const tl = gsap.timeline({ repeat: -1, yoyo: true, delay });
            tl.to(sprite, {
                y: -this.config.bounceHeight * 0.8,
                scaleY: 1 + this.config.stretchAmount * 0.7,
                scaleX: 1 - this.config.squashAmount * 0.3,
                duration: speed / 2,
                ease: "sine.inOut"
            });
            
            this.activeAnimations.set(key, tl);
        });
    },
    
    // ==========================================
    // 플레이어 점프 - GSAP!
    // ==========================================
    playerJump() {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        gsap.timeline()
            // 웅크리기
            .to(sprite, { scaleY: 0.85, scaleX: 1.1, y: 5, duration: 0.1, ease: "power2.in" })
            // 점프!
            .to(sprite, { scaleY: 1.15, scaleX: 0.9, y: -40, duration: 0.2, ease: "power2.out" })
            // 착지
            .to(sprite, { scaleY: 0.9, scaleX: 1.1, y: 0, duration: 0.15, ease: "power2.in" })
            // 복구
            .to(sprite, { scaleY: 1, scaleX: 1, duration: 0.2, ease: "elastic.out(1, 0.5)" })
            .add(() => this.startPlayerIdle());
    },
    
    // ==========================================
    // 플레이어 공격 모션 - GSAP!
    // ==========================================
    playerAttack(targetElement, callback) {
        const sprite = document.querySelector('.player-sprite-img');
        const playerContainer = document.querySelector('#player');
        if (!sprite || !playerContainer) return;
        
        this.stopAnimation('player-idle');
        
        gsap.timeline()
            // 준비 자세 (뒤로)
            .to(sprite, { 
                x: -30, 
                scaleX: 0.85, 
                scaleY: 1.1,
                duration: 0.15, 
                ease: "back.in(2)" 
            })
            // 돌진!
            .to(sprite, { 
                x: 120, 
                scaleX: 1.3, 
                scaleY: 0.9,
                duration: 0.1, 
                ease: "power4.out" 
            })
            // 히트 순간 플래시
            .to(sprite, {
                filter: 'brightness(2)',
                duration: 0.03
            })
            .to(sprite, {
                filter: 'brightness(1)',
                duration: 0.1
            })
            // 복귀
            .to(sprite, { 
                x: 0, 
                scaleX: 1, 
                scaleY: 1,
                duration: 0.3, 
                ease: "back.out(1.5)" 
            })
            .add(() => {
                this.startPlayerIdle();
                if (callback) callback();
            });
    },
    
    // ==========================================
    // 🔥 연타 공격 (콤보) - GSAP!
    // ==========================================
    playerComboAttack(hitCount = 3, onHit, onComplete) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        const tl = gsap.timeline();
        
        // 준비 자세
        tl.to(sprite, { 
            x: -40, 
            scaleX: 0.85, 
            rotation: -5,
            duration: 0.12, 
            ease: "back.in(2)" 
        });
        
        // 연타 히트!
        for (let i = 0; i < hitCount; i++) {
            const isLast = i === hitCount - 1;
            const hitX = 60 + (i * 15); // 점점 더 멀리
            const hitRotation = (i % 2 === 0) ? 8 : -8; // 좌우 번갈아
            
            // 돌진 + 히트
            tl.to(sprite, {
                x: hitX,
                scaleX: 1.25 + (i * 0.05),
                scaleY: 0.85 - (i * 0.02),
                rotation: hitRotation,
                duration: 0.06,
                ease: "power4.out"
            })
            // 히트 플래시!
            .to(sprite, {
                filter: `brightness(${1.8 + i * 0.2}) drop-shadow(0 0 ${15 + i * 5}px white)`,
                duration: 0.02
            })
            // 콜백 (데미지 처리용)
            .add(() => {
                if (onHit) onHit(i);
            })
            // 플래시 해제 + 약간 뒤로
            .to(sprite, {
                x: hitX - 20,
                filter: 'brightness(1)',
                scaleX: 1.1,
                scaleY: 0.95,
                rotation: hitRotation * 0.5,
                duration: 0.04
            });
            
            // 마지막 히트가 아니면 다음 준비
            if (!isLast) {
                tl.to(sprite, {
                    x: hitX - 30,
                    scaleX: 0.95,
                    rotation: -hitRotation * 0.3,
                    duration: 0.05
                });
            }
        }
        
        // 마무리 (더 강한 복귀)
        tl.to(sprite, {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            filter: '',
            duration: 0.35,
            ease: "elastic.out(1, 0.4)"
        })
        .add(() => {
            this.startPlayerIdle();
            if (onComplete) onComplete();
        });
        
        return tl;
    },
    
    // ==========================================
    // ⚡ 빠른 연타 (닌자 스타일) - GSAP!
    // ==========================================
    playerRapidAttack(hitCount = 5, onHit, onComplete) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        const tl = gsap.timeline();
        
        // 순간이동 준비
        tl.to(sprite, {
            scaleX: 0.7,
            scaleY: 1.3,
            alpha: 0.5,
            filter: 'blur(3px)',
            duration: 0.08
        });
        
        // 초고속 연타!
        for (let i = 0; i < hitCount; i++) {
            const posX = 40 + Math.sin(i * 1.5) * 30;
            const posY = Math.cos(i * 1.2) * 15;
            
            tl.to(sprite, {
                x: posX,
                y: posY,
                alpha: 1,
                scaleX: 1.15,
                scaleY: 0.9,
                filter: 'blur(0px)',
                duration: 0.03
            })
            .to(sprite, {
                filter: 'brightness(2) drop-shadow(0 0 20px rgba(147, 51, 234, 0.9))',
                duration: 0.02
            })
            .add(() => { if (onHit) onHit(i); })
            .to(sprite, {
                alpha: 0.6,
                filter: 'blur(2px) brightness(1)',
                duration: 0.02
            });
        }
        
        // 마무리 포즈
        tl.to(sprite, {
            x: 80,
            y: 0,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 0.85,
            rotation: 5,
            filter: 'brightness(1.5) drop-shadow(0 0 25px rgba(147, 51, 234, 1))',
            duration: 0.05
        })
        // 잠시 멈춤 (간지!)
        .to(sprite, { duration: 0.15 })
        // 복귀
        .to(sprite, {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            filter: '',
            duration: 0.3,
            ease: "back.out(2)"
        })
        .add(() => {
            this.startPlayerIdle();
            if (onComplete) onComplete();
        });
        
        return tl;
    },
    
    // ==========================================
    // 💥 전체 공격 (휩쓸기) - GSAP!
    // ==========================================
    playerSweepAttack(onHit, onComplete) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        this.screenShake(8, 0.3);
        
        gsap.timeline()
            // 크게 뒤로
            .to(sprite, {
                x: -60,
                scaleX: 0.8,
                rotation: -15,
                duration: 0.2,
                ease: "back.in(3)"
            })
            // 거대한 휩쓸기!
            .to(sprite, {
                x: 150,
                scaleX: 1.5,
                scaleY: 0.8,
                rotation: 20,
                filter: 'brightness(1.8) drop-shadow(0 0 30px rgba(239, 68, 68, 0.9))',
                duration: 0.12,
                ease: "power4.out"
            })
            .add(() => { if (onHit) onHit(); })
            // 잔상 효과
            .to(sprite, {
                filter: 'brightness(2) drop-shadow(0 0 50px white)',
                duration: 0.05
            })
            .to(sprite, {
                filter: 'brightness(1)',
                duration: 0.1
            })
            // 복귀
            .to(sprite, {
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                duration: 0.4,
                ease: "elastic.out(1, 0.3)"
            })
            .add(() => {
                this.startPlayerIdle();
                if (onComplete) onComplete();
            });
    },
    
    // ==========================================
    // 🗡️ 찌르기 공격 - GSAP!
    // ==========================================
    playerThrustAttack(onHit, onComplete) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        gsap.timeline()
            // 웅크리기
            .to(sprite, {
                x: -20,
                scaleX: 0.9,
                scaleY: 1.1,
                duration: 0.1,
                ease: "power2.in"
            })
            // 찌르기!
            .to(sprite, {
                x: 100,
                scaleX: 1.4,
                scaleY: 0.85,
                duration: 0.06,
                ease: "power4.out"
            })
            .add(() => { if (onHit) onHit(); })
            .to(sprite, {
                filter: 'brightness(2)',
                duration: 0.03
            })
            // 유지
            .to(sprite, {
                duration: 0.08
            })
            // 빠른 복귀
            .to(sprite, {
                x: 0,
                scaleX: 1,
                scaleY: 1,
                filter: '',
                duration: 0.25,
                ease: "back.out(1.5)"
            })
            .add(() => {
                this.startPlayerIdle();
                if (onComplete) onComplete();
            });
    },
    
    // ==========================================
    // 적 피격 애니메이션 - 리얼리스틱 & 임팩트!
    // ==========================================
    enemyHit(enemyElement, damage = 0) {
        const target = enemyElement;
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!target) return;
        if (typeof gsap === 'undefined') return;
        
        // 🔥 데미지 기반 강도 계산
        const intensity = Math.min(damage / 5, 8); // 최대 8
        const freezeTime = Math.min(0.04 + damage * 0.003, 0.12); // 4~120ms
        const isCritical = damage >= 20;
        const isHeavy = damage >= 12;
        
        // 🎆 PixiJS 이펙트
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            const rect = enemyElement.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2 - 20;
            
            if (isCritical) {
                PixiRenderer.createCriticalHit(cx, cy, damage);
                PixiRenderer.hitFlash('#ff0000', 120);
            } else if (isHeavy) {
                PixiRenderer.createHitImpact(cx, cy, damage, '#ff4444');
                PixiRenderer.hitFlash('#ff0000', 60);
            } else {
                PixiRenderer.createHitImpact(cx, cy, damage, '#ff6644');
            }
        }
        
        // 🌍 화면 흔들림 (데미지 비례)
        this.screenShake(intensity * 3, 0.1 + intensity * 0.02);
        
        // 🎬 메인 타임라인
        const tl = gsap.timeline();
        
        // ==========================================
        // 1️⃣ 히트스탑 (Impact Freeze) - 가장 중요!
        // ==========================================
        const knockbackX = 20 + intensity * 8; // 밀려나는 거리
        
        // 순간적으로 밀려남 + 스쿼시!
        tl.to(target, {
            x: knockbackX,
            scaleX: 0.85,
            scaleY: 1.15,
            duration: 0.03,
            ease: "power4.out"
        });
        
        // 🔴 빨간 플래시 (sprite-img의 filter)
        if (sprite) {
            gsap.to(sprite, {
                filter: 'brightness(2) sepia(1) saturate(10) hue-rotate(-20deg)',
                duration: 0.05,
                yoyo: true,
                repeat: 1
            });
        }
        
        // ⏸️ 프리즈! (히트스탑 핵심)
        tl.to(target, { duration: freezeTime });
        
        // ==========================================
        // 2️⃣ 반동 (Recoil) - 자연스러운 물리
        // ==========================================
        if (isCritical) {
            // 💀 크리티컬: 크게 밀려났다가 휘청휘청
            tl.to(target, {
                x: knockbackX + 30,
                y: -15,
                rotation: 8,
                scaleX: 1.1,
                scaleY: 0.92,
                duration: 0.06,
                ease: "power2.out"
            })
            .to(target, {
                x: knockbackX - 20,
                y: 5,
                rotation: -5,
                scaleX: 0.95,
                scaleY: 1.05,
                duration: 0.08,
                ease: "power1.inOut"
            })
            .to(target, {
                x: knockbackX * 0.3,
                y: 0,
                rotation: 3,
                scaleX: 1.02,
                scaleY: 0.98,
                duration: 0.07
            })
            .to(target, {
                x: -knockbackX * 0.15,
                rotation: -2,
                duration: 0.06
            });
        } else if (isHeavy) {
            // 😱 강타: 밀려났다가 흔들림
            tl.to(target, {
                x: knockbackX * 0.6,
                rotation: 5,
                scaleX: 1.05,
                scaleY: 0.95,
                duration: 0.07,
                ease: "power2.out"
            })
            .to(target, {
                x: -knockbackX * 0.3,
                rotation: -3,
                scaleX: 0.97,
                scaleY: 1.03,
                duration: 0.08
            })
            .to(target, {
                x: knockbackX * 0.15,
                rotation: 2,
                duration: 0.06
            });
        } else {
            // 😐 약타: 가볍게 밀림
            tl.to(target, {
                x: knockbackX * 0.4,
                rotation: 3,
                scaleX: 1.03,
                scaleY: 0.97,
                duration: 0.06,
                ease: "power2.out"
            })
            .to(target, {
                x: -knockbackX * 0.15,
                rotation: -1,
                duration: 0.06
            });
        }
        
        // ==========================================
        // 3️⃣ 복귀 (Settle) - 탄성 있게 원위치
        // ==========================================
        tl.to(target, {
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            duration: isCritical ? 0.35 : 0.2,
            ease: "elastic.out(1, 0.4)"
        });
        
        return tl;
    },
    
    // ==========================================
    // 🔥 적 연타 피격 (콤보) - GSAP + PixiJS!
    // ==========================================
    enemyComboHit(enemyElement, hitCount = 3, damagePerHit = 5) {
        console.log('[SpriteAnimation] 🔥 enemyComboHit 호출됨!', { enemyElement, hitCount, damagePerHit });
        
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        console.log('[SpriteAnimation] 🔍 sprite 찾기:', sprite);
        
        if (!sprite) {
            console.warn('[SpriteAnimation] ⚠️ .enemy-sprite-img를 찾지 못함! (combo)');
            return;
        }
        
        // GSAP 확인
        if (typeof gsap === 'undefined') {
            console.error('[SpriteAnimation] ❌ GSAP이 로드되지 않음! (combo)');
            return;
        }
        
        const tl = gsap.timeline();
        const baseIntensity = Math.min(damagePerHit / 8, 1.5) + 0.5;
        const totalDamage = hitCount * damagePerHit;
        
        // 🌍 화면 흔들림 (전체)
        this.screenShake(baseIntensity * hitCount, 0.1 * hitCount);
        
        // 🎆 PixiJS 히트 이펙트 (각 히트마다!)
        if (enemyElement && typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            const rect = enemyElement.getBoundingClientRect();
            const baseX = rect.left + rect.width / 2;
            const baseY = rect.top + rect.height / 2 - 20;
            
            // 히트마다 약간 다른 위치에 이펙트
            for (let i = 0; i < hitCount; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * 30;
                    const offsetY = (Math.random() - 0.5) * 20;
                    PixiRenderer.createHitImpact(baseX + offsetX, baseY + offsetY, damagePerHit, '#ff6644');
                }, i * 80);
            }
            
            // 마지막에 큰 이펙트
            setTimeout(() => {
                if (totalDamage >= 20) {
                    PixiRenderer.hitFlash('#ff4400', 100);
                }
            }, hitCount * 80);
        }
        
        for (let i = 0; i < hitCount; i++) {
            const intensity = baseIntensity + (i * 0.4); // 🔥 더 강하게 점점 강해짐!
            const direction = (i % 2 === 0) ? 1 : -1;
            const isLast = i === hitCount - 1;
            
            // 💥 히트스탑 + 흰색 플래시 (과장되게!)
            tl.set(sprite, {
                scale: 1.2 + (i * 0.05),
                x: direction * 15,
                filter: `
                    drop-shadow(4px 0 0 white)
                    drop-shadow(-4px 0 0 white)
                    drop-shadow(0 4px 0 white)
                    drop-shadow(0 -4px 0 white)
                    brightness(3) saturate(0)
                `
            })
            // 프리즈 (더 길게!)
            .to(sprite, { duration: 0.06 + (i * 0.015) })
            // 반동 + 빨간/주황 플래시 (과장되게!)
            .to(sprite, {
                x: direction * 50 * intensity / 2,
                rotation: direction * 15 * intensity / 2,
                scaleX: 1.35,
                scaleY: 0.75,
                filter: `
                    drop-shadow(3px 0 0 rgba(255, ${100 - i * 15}, 50, 1))
                    drop-shadow(-3px 0 0 rgba(255, ${100 - i * 15}, 50, 1))
                    drop-shadow(0 0 ${20 + i * 6}px rgba(255, ${50 - i * 10}, 0, 1))
                    brightness(${1.8 + i * 0.15})
                `,
                duration: 0.05,
                ease: "power4.out"
            })
            // 흔들림 (과장되게!)
            .to(sprite, {
                x: -direction * 35 * intensity / 2,
                rotation: -direction * 10 * intensity / 2,
                scaleX: 0.9,
                scaleY: 1.15,
                filter: 'brightness(1.3)',
                duration: 0.04
            })
            .to(sprite, {
                x: direction * 20 * intensity / 2,
                rotation: direction * 6 * intensity / 2,
                filter: 'brightness(1.1)',
                duration: 0.04
            });
            
            // 마지막 히트에 추가 반동 (더 극적으로!)
            if (isLast) {
                tl.to(sprite, {
                    x: direction * 70,
                    rotation: direction * 20,
                    scaleX: 1.4,
                    scaleY: 0.65,
                    filter: `
                        drop-shadow(4px 0 0 rgba(255, 255, 0, 1))
                        drop-shadow(-4px 0 0 rgba(255, 255, 0, 1))
                        drop-shadow(0 0 30px rgba(255, 100, 0, 1))
                        brightness(2.5)
                    `,
                    duration: 0.06
                })
                .to(sprite, {
                    x: -50,
                    rotation: -15,
                    scaleX: 0.85,
                    scaleY: 1.2,
                    duration: 0.05
                });
            }
        }
        
        // 🔄 마지막 복구 (더 강한 탄성)
        tl.to(sprite, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
            filter: '',
            duration: 0.3,
            ease: "elastic.out(1.2, 0.4)"
        });
        
        return tl;
    },
    
    // ==========================================
    // ⚡ 적 초고속 연타 피격 - GSAP + PixiJS!
    // ==========================================
    enemyRapidHit(enemyElement, hitCount = 5, damagePerHit = 3) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        const tl = gsap.timeline();
        const totalDamage = hitCount * damagePerHit;
        
        // 🌍 화면 흔들림 (격렬하게!)
        this.screenShake(12, 0.2);
        
        // 🎆 PixiJS 연속 히트 이펙트!
        if (enemyElement && typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            const rect = enemyElement.getBoundingClientRect();
            const baseX = rect.left + rect.width / 2;
            const baseY = rect.top + rect.height / 2 - 20;
            
            // 빠른 연속 이펙트
            for (let i = 0; i < hitCount; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * 50;
                    const offsetY = (Math.random() - 0.5) * 30;
                    PixiRenderer.createHitImpact(baseX + offsetX, baseY + offsetY, damagePerHit, '#ffaa00');
                }, i * 40);
            }
            
            // 마무리 큰 이펙트
            setTimeout(() => {
                PixiRenderer.createCriticalHit(baseX, baseY, totalDamage);
                PixiRenderer.hitFlash('#ffcc00', 120);
            }, hitCount * 40 + 50);
        }
        
        // ⚡ 잔상 효과 추가
        tl.set(sprite, {
            filter: 'blur(4px) brightness(0.7)'
        });
        
        // 🔥 초고속 연타! (더 과장되게!)
        for (let i = 0; i < hitCount; i++) {
            const offsetX = (Math.random() - 0.5) * 80;  // 더 크게!
            const offsetY = (Math.random() - 0.5) * 40;
            const rot = (Math.random() - 0.5) * 30;      // 더 많이!
            const isEven = i % 2 === 0;
            
            // 히트스탑 (잠깐 멈춤)
            tl.set(sprite, {
                x: offsetX,
                y: offsetY,
                rotation: rot,
                scaleX: isEven ? 1.35 : 0.8,
                scaleY: isEven ? 0.8 : 1.35,
                filter: `
                    drop-shadow(4px 0 0 white)
                    drop-shadow(-4px 0 0 white)
                    drop-shadow(0 4px 0 white)
                    drop-shadow(0 -4px 0 white)
                    brightness(3) saturate(0)
                `
            })
            .to(sprite, { duration: 0.03 })  // 히트스탑!
            .to(sprite, {
                filter: `
                    drop-shadow(0 0 25px rgba(255, ${200 - i * 20}, 0, 1))
                    brightness(2.5)
                `,
                duration: 0.025,
                ease: "power4.out"
            })
            .to(sprite, {
                filter: `
                    drop-shadow(0 0 15px rgba(255, 100, 0, 0.8))
                    brightness(1.5)
                `,
                duration: 0.02
            });
        }
        
        // 💥 마무리 충격 (훨씬 더 극적으로!)
        tl.to(sprite, {
            x: 80,
            y: -20,
            rotation: 25,
            scaleX: 1.5,
            scaleY: 0.6,
            filter: `
                drop-shadow(5px 0 0 rgba(255, 255, 0, 1))
                drop-shadow(-5px 0 0 rgba(255, 255, 0, 1))
                drop-shadow(0 5px 0 rgba(255, 255, 0, 1))
                drop-shadow(0 -5px 0 rgba(255, 255, 0, 1))
                drop-shadow(0 0 40px rgba(255, 200, 0, 1))
                brightness(3) saturate(0)
            `,
            duration: 0.06,
            ease: "power4.out"
        })
        .to(sprite, { duration: 0.12 }) // 긴 프리즈!
        // 🔄 복구 (크게 튕겨나옴)
        .to(sprite, {
            x: -60,
            rotation: -18,
            scaleX: 0.8,
            scaleY: 1.25,
            filter: `
                drop-shadow(3px 0 0 rgba(255, 50, 50, 1))
                drop-shadow(-3px 0 0 rgba(255, 50, 50, 1))
                brightness(1.5)
            `,
            duration: 0.08
        })
        .to(sprite, {
            x: 40,
            rotation: 12,
            scaleX: 1.15,
            scaleY: 0.9,
            duration: 0.06
        })
        .to(sprite, {
            x: -25,
            rotation: -8,
            duration: 0.05
        })
        .to(sprite, {
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            filter: '',
            duration: 0.35,
            ease: "elastic.out(1.2, 0.35)"
        });
        
        return tl;
    },
    
    // ==========================================
    // 플레이어 피격 애니메이션 - GSAP + PixiJS!
    // ==========================================
    playerHit(damage = 0) {
        // ✅ PixiJS PlayerRenderer 활성화 시 DOM 애니메이션 스킵
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.enabled && PlayerRenderer.initialized) {
            return;
        }
        
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        // 플레이어는 약하게
        let intensity, freezeTime, hitType;
        if (damage >= 20) {
            intensity = 1.5;
            freezeTime = 0.06;
            hitType = 'heavy';
        } else if (damage >= 12) {
            intensity = 1.2;
            freezeTime = 0.04;
            hitType = 'medium';
        } else if (damage >= 6) {
            intensity = 0.8;
            freezeTime = 0.03;
            hitType = 'light';
        } else {
            intensity = 0.5;
            freezeTime = 0.02;
            hitType = 'weak';
        }
        
        // 🎆 PixiJS 히트 이펙트!
        const playerEl = document.getElementById('player');
        if (playerEl && typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            const rect = playerEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2 - 20;
            
            if (hitType === 'heavy') {
                PixiRenderer.createHitImpact(centerX, centerY, damage, '#ff6666');
                PixiRenderer.hitFlash('#ff0000', 100);
            } else if (hitType === 'medium') {
                PixiRenderer.createHitImpact(centerX, centerY, damage, '#ff8888');
            }
        }
        
        // 🌍 화면 흔들림 (플레이어는 약하게)
        this.screenShake(intensity * 2.5, freezeTime + 0.05);
        
        const tl = gsap.timeline({
            onComplete: () => {
                sprite.style.filter = '';
                this.startPlayerIdle();
            }
        });
        
        // ⏸️ 히트스탑
        tl.set(sprite, {
            scale: 1.05,
            x: -5,
            filter: `
                drop-shadow(2px 0 0 white)
                drop-shadow(-2px 0 0 white)
                drop-shadow(0 2px 0 white)
                drop-shadow(0 -2px 0 white)
                brightness(1.8) saturate(0)
            `
        })
        .to(sprite, { duration: freezeTime });
        
        // 💢 파닥파닥 (히트 타입별)
        if (hitType === 'heavy') {
            // 강한 피격: 더 극적인 반응
            tl.to(sprite, {
                x: -25 * intensity,
                rotation: -8,
                scaleX: 1.1,
                scaleY: 0.9,
                filter: `
                    drop-shadow(2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(-2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))
                    brightness(1.5)
                `,
                duration: 0.05,
                ease: "power3.out"
            })
            .to(sprite, {
                x: 18 * intensity,
                rotation: 5,
                filter: 'brightness(1.2)',
                duration: 0.05
            })
            .to(sprite, { x: -12 * intensity, rotation: -3, duration: 0.04 })
            .to(sprite, { x: 6 * intensity, rotation: 2, filter: 'brightness(1)', duration: 0.04 })
            .to(sprite, { x: -3 * intensity, rotation: -1, duration: 0.03 });
        } else {
            // 일반 피격
            tl.to(sprite, {
                x: -15 * intensity,
                rotation: -4 * intensity,
                filter: `
                    drop-shadow(1px 0 0 rgba(255, 60, 60, 1))
                    drop-shadow(-1px 0 0 rgba(255, 60, 60, 1))
                    drop-shadow(0 0 8px rgba(255, 0, 0, 0.6))
                    brightness(1.3)
                `,
                duration: 0.05
            })
            .to(sprite, {
                x: 10 * intensity,
                rotation: 3 * intensity,
                filter: 'brightness(1)',
                duration: 0.05
            })
            .to(sprite, {
                x: -6 * intensity,
                rotation: -2 * intensity,
                duration: 0.04
            })
            .to(sprite, {
                x: 3 * intensity,
                rotation: 1 * intensity,
                duration: 0.03
            });
        }
        
        // 🔄 복구
        tl.to(sprite, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
                filter: '',
                duration: 0.2,
                ease: "elastic.out(1, 0.5)"
            })
            .add(() => this.startPlayerIdle());
    },
    
    // ==========================================
    // 플레이어 방어 애니메이션 - GSAP + 히트스탑!
    // ==========================================
    playerDefend(blockAmount = 5) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        // 방어량에 따른 강도 (5~50 기준)
        let intensity, freezeTime;
        if (blockAmount >= 20) {
            intensity = 1.5; freezeTime = 0.08;
        } else if (blockAmount >= 12) {
            intensity = 1.2; freezeTime = 0.06;
        } else if (blockAmount >= 6) {
            intensity = 1.0; freezeTime = 0.04;
        } else {
            intensity = 0.6; freezeTime = 0.02;
        }
        
        // PixiJS 쉴드 이펙트!
        const playerEl = document.getElementById('player');
        if (playerEl) {
            const rect = playerEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // PixiJS 파직 이펙트!
            if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
                PixiRenderer.createShieldImpact(centerX, centerY, blockAmount, intensity);
            }
        }
        
        const tl = gsap.timeline({
            onComplete: () => {
                sprite.style.filter = '';
                this.startPlayerIdle();
            }
        });
        
        // ⏸️ 히트스탑! 파란색 플래시 + 정지
        tl.set(sprite, {
            scaleX: 1 + (0.1 * intensity),
            scaleY: 1 - (0.05 * intensity),
            x: -5 * intensity,
            filter: `
                drop-shadow(2px 0 0 rgba(100, 180, 255, 1))
                drop-shadow(-2px 0 0 rgba(100, 180, 255, 1))
                drop-shadow(0 2px 0 rgba(100, 180, 255, 1))
                drop-shadow(0 -2px 0 rgba(100, 180, 255, 1))
                brightness(1.8) saturate(1.5)
            `
        })
        .to(sprite, { duration: freezeTime }); // 프리즈 듀레이션!
        
        // 🌍 화면 흔들림 (약하게)
        this.screenShake(intensity * 2, freezeTime + 0.05);
        
        // 방어 자세 (방패를 받아치는 느낌)
        tl.to(sprite, {
            x: 5 * intensity,
            rotation: -3 * intensity,
            scaleX: 0.92,
            scaleY: 1.08,
            filter: `
                drop-shadow(1px 0 0 rgba(59, 130, 246, 1))
                drop-shadow(-1px 0 0 rgba(59, 130, 246, 1))
                drop-shadow(0 1px 0 rgba(59, 130, 246, 1))
                drop-shadow(0 -1px 0 rgba(59, 130, 246, 1))
                drop-shadow(0 0 ${10 + (intensity * 5)}px rgba(59, 130, 246, 0.8))
                brightness(1.3)
            `,
            duration: 0.08,
            ease: "power2.out"
        })
        // 파닥파닥 (작게)
        .to(sprite, {
            rotation: 2 * intensity,
            duration: 0.04,
            ease: "power1.inOut"
        })
        .to(sprite, {
            rotation: -1.5 * intensity,
            duration: 0.03,
            ease: "power1.inOut"
        })
        .to(sprite, {
            rotation: 0.8 * intensity,
            duration: 0.02,
            ease: "power1.inOut"
        })
        // 복귀
        .to(sprite, {
            x: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            filter: '',
            duration: 0.25,
            ease: "elastic.out(1, 0.5)"
        });
    },
    
    // ==========================================
    // 적 방어 애니메이션 - GSAP + 히트스탑!
    // ==========================================
    enemyDefend(enemyElement, blockAmount = 5) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        // 방어량에 따른 강도
        let intensity, freezeTime;
        if (blockAmount >= 20) {
            intensity = 1.5; freezeTime = 0.08;
        } else if (blockAmount >= 12) {
            intensity = 1.2; freezeTime = 0.06;
        } else if (blockAmount >= 6) {
            intensity = 1.0; freezeTime = 0.04;
        } else {
            intensity = 0.6; freezeTime = 0.02;
        }
        
        // PixiJS 쉴드 이펙트!
        if (enemyElement) {
            const rect = enemyElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
                PixiRenderer.createShieldImpact(centerX, centerY, blockAmount, intensity);
            }
        }
        
        const tl = gsap.timeline({
            onComplete: () => {
                sprite.style.filter = '';
            }
        });
        
        // ⏸️ 히트스탑! 파란색 플래시 + 정지
        tl.set(sprite, {
            scaleX: 1 + (0.12 * intensity),
            scaleY: 1 - (0.08 * intensity),
            x: 5 * intensity,
            filter: `
                drop-shadow(2px 0 0 rgba(100, 180, 255, 1))
                drop-shadow(-2px 0 0 rgba(100, 180, 255, 1))
                drop-shadow(0 2px 0 rgba(100, 180, 255, 1))
                drop-shadow(0 -2px 0 rgba(100, 180, 255, 1))
                brightness(1.8) saturate(1.5)
            `
        })
        .to(sprite, { duration: freezeTime }); // 프리즈 듀레이션!
        
        // 🌍 화면 흔들림 (약하게)
        this.screenShake(intensity * 1.5, freezeTime + 0.03);
        
        // 방어 자세 (방패를 받아치는 느낌)
        tl.to(sprite, {
            x: -5 * intensity,
            rotation: 3 * intensity,
            scaleX: 0.92,
            scaleY: 1.08,
            filter: `
                drop-shadow(1px 0 0 rgba(100, 150, 255, 1))
                drop-shadow(-1px 0 0 rgba(100, 150, 255, 1))
                drop-shadow(0 1px 0 rgba(100, 150, 255, 1))
                drop-shadow(0 -1px 0 rgba(100, 150, 255, 1))
                drop-shadow(0 0 ${12 + (intensity * 6)}px rgba(100, 150, 255, 0.8))
                brightness(1.3)
            `,
            duration: 0.08,
            ease: "power2.out"
        })
        // 파닥파닥
        .to(sprite, { rotation: -2 * intensity, duration: 0.04 })
        .to(sprite, { rotation: 1.5 * intensity, duration: 0.03 })
        .to(sprite, { rotation: -0.8 * intensity, duration: 0.02 })
        // 복귀
        .to(sprite, {
            x: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            filter: '',
            duration: 0.2,
            ease: "elastic.out(1, 0.5)"
        });
    },
    
    // ==========================================
    // 적 사망 애니메이션 - GSAP!
    // ==========================================
    enemyDeath(enemyElement, callback) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        gsap.timeline()
            // 충격
            .to(sprite, {
                scaleX: 1.3,
                scaleY: 0.7,
                filter: 'brightness(2) saturate(0)',
                duration: 0.1
            })
            // 흔들림
            .to(sprite, { x: -15, rotation: -10, duration: 0.05 })
            .to(sprite, { x: 15, rotation: 10, duration: 0.05 })
            .to(sprite, { x: -10, rotation: -5, duration: 0.05 })
            // 쓰러짐
            .to(sprite, {
                y: 30,
                rotation: -20,
                scaleX: 1.2,
                scaleY: 0.8,
                duration: 0.2,
                ease: "power2.in"
            })
            // 사라짐
            .to(sprite, {
                alpha: 0,
                scale: 0.5,
                filter: 'brightness(3) blur(5px)',
                duration: 0.3,
                ease: "power2.in"
            })
            .add(() => {
                if (callback) callback();
            });
    },
    
    // ==========================================
    // 플레이어 승리 애니메이션 - GSAP!
    // ==========================================
    playerVictory() {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        gsap.timeline()
            // 점프!
            .to(sprite, { y: -50, scaleY: 1.15, scaleX: 0.9, duration: 0.25, ease: "power2.out" })
            .to(sprite, { y: 0, scaleY: 0.85, scaleX: 1.15, duration: 0.15, ease: "power2.in" })
            // 다시 점프
            .to(sprite, { y: -30, scaleY: 1.1, scaleX: 0.95, duration: 0.2, ease: "power2.out" })
            .to(sprite, { y: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" })
            .add(() => this.startPlayerIdle());
    },
    
    // ==========================================
    // 카드 사용 모션 - GSAP!
    // ==========================================
    playerCastSpell() {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        gsap.timeline()
            // 집중
            .to(sprite, {
                scaleY: 0.95,
                filter: 'brightness(1.3) drop-shadow(0 0 20px rgba(147, 51, 234, 0.8))',
                duration: 0.2
            })
            // 발동!
            .to(sprite, {
                scaleY: 1.1,
                scaleX: 0.95,
                y: -10,
                filter: 'brightness(1.8) drop-shadow(0 0 40px rgba(147, 51, 234, 1))',
                duration: 0.1,
                ease: "power2.out"
            })
            // 복구
            .to(sprite, {
                scaleY: 1,
                scaleX: 1,
                y: 0,
                filter: '',
                duration: 0.3,
                ease: "elastic.out(1, 0.5)"
            })
            .add(() => this.startPlayerIdle());
    },
    
    // ==========================================
    // 힐 이펙트 - GSAP!
    // ==========================================
    playerHeal() {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        gsap.timeline()
            .to(sprite, {
                y: -8,
                filter: 'brightness(1.4) drop-shadow(0 0 25px rgba(34, 197, 94, 0.9))',
                duration: 0.3,
                ease: "sine.out"
            })
            .to(sprite, {
                y: 0,
                filter: '',
                duration: 0.4,
                ease: "sine.inOut"
            });
    },
    
    // ==========================================
    // 버프 이펙트 - GSAP!
    // ==========================================
    playerBuff() {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        gsap.timeline()
            .to(sprite, {
                scaleY: 1.08,
                filter: 'brightness(1.3) drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))',
                duration: 0.15
            })
            .to(sprite, {
                scaleY: 1,
                filter: '',
                duration: 0.25,
                ease: "elastic.out(1, 0.5)"
            });
    },
    
    // ==========================================
    // 애니메이션 중지
    // ==========================================
    stopAnimation(key) {
        const anim = this.activeAnimations.get(key);
        if (anim) {
            anim.kill();
            this.activeAnimations.delete(key);
        }
    },
    
    // ==========================================
    // 모든 애니메이션 중지
    // ==========================================
    stopAllAnimations() {
        this.activeAnimations.forEach((anim, key) => {
            anim.kill();
        });
        this.activeAnimations.clear();
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // GSAP 로드 후 초기화
    setTimeout(() => {
        SpriteAnimation.init();
    }, 100);
});

// 전역 등록
window.SpriteAnimation = SpriteAnimation;

// 🧪 디버그용: 강제 테스트 함수
window.testEnemyHit = function(damage = 10) {
    console.log('[TEST] 🧪 적 피격 테스트! 데미지:', damage);
    const enemyEl = document.querySelector('.enemy-unit');
    
    if (enemyEl && typeof SpriteAnimation !== 'undefined') {
        SpriteAnimation.enemyHit(enemyEl, damage);
    } else {
        console.error('[TEST] ❌ enemyEl 또는 SpriteAnimation 없음!');
    }
};

// 크리티컬 테스트
window.testCriticalHit = function() {
    testEnemyHit(25);
};

// 약타 테스트
window.testLightHit = function() {
    testEnemyHit(5);
};

console.log('[SpriteAnimation] GSAP 기반 시스템 로드됨!');
console.log('[SpriteAnimation] 💡 콘솔에서 testEnemyHit() 실행해서 테스트 가능!');