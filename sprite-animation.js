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
    // 🌍 화면 흔들림 - GSAP!
    // ==========================================
    screenShake(intensity = 5, duration = 0.15) {
        const gameContainer = document.querySelector('.game-container') || document.body;
        
        // 랜덤 흔들림
        gsap.to(gameContainer, {
            x: () => (Math.random() - 0.5) * intensity * 2,
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
    // 적 피격 애니메이션 - GSAP! 히트스탑 포함!
    // ==========================================
    enemyHit(enemyElement, damage = 0) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        // 데미지에 따른 강도
        let intensity, freezeTime;
        if (damage >= 25) {
            intensity = 3.5;
            freezeTime = 0.12;
            console.log('[Enemy Hit] 💀 치명적!', damage);
        } else if (damage >= 15) {
            intensity = 2.5;
            freezeTime = 0.08;
            console.log('[Enemy Hit] 😱 강함!', damage);
        } else if (damage >= 8) {
            intensity = 1.6;
            freezeTime = 0.05;
            console.log('[Enemy Hit] 😣 중간', damage);
        } else {
            intensity = 0.9;
            freezeTime = 0.03;
            console.log('[Enemy Hit] 😐 약함', damage);
        }
        
        // 화면 흔들림
        this.screenShake(intensity * 4, freezeTime + 0.1);
        
        // GSAP 타임라인
        gsap.timeline()
            // ⏸️ 히트스탑! 흰색 번쩍 + 정지
            .set(sprite, { 
                scale: 1.15,
                x: 10,
                filter: `
                    drop-shadow(3px 0 0 white)
                    drop-shadow(-3px 0 0 white)
                    drop-shadow(0 3px 0 white)
                    drop-shadow(0 -3px 0 white)
                    brightness(2.5) saturate(0)
                `
            })
            // 프리즈 유지
            .to(sprite, { duration: freezeTime })
            // 빨간 깜박 + 파닥파닥!
            .to(sprite, {
                x: 30 * intensity,
                rotation: 8 * intensity,
                scaleX: 1 + 0.15 * intensity,
                scaleY: 1 - 0.1 * intensity,
                filter: `
                    drop-shadow(2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(-2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 2px 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 -2px 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))
                    brightness(1.5)
                `,
                duration: 0.05,
                ease: "power2.out"
            })
            .to(sprite, {
                x: -20 * intensity,
                rotation: -6 * intensity,
                filter: 'brightness(1)',
                duration: 0.05
            })
            .to(sprite, {
                x: 15 * intensity,
                rotation: 5 * intensity,
                filter: `
                    drop-shadow(2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(-2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 0 10px rgba(255, 0, 0, 0.6))
                    brightness(1.3)
                `,
                duration: 0.04
            })
            .to(sprite, {
                x: -10 * intensity,
                rotation: -3 * intensity,
                filter: 'brightness(1)',
                duration: 0.04
            })
            .to(sprite, {
                x: 5 * intensity,
                rotation: 2 * intensity,
                duration: 0.03
            })
            // 복구
            .to(sprite, {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                scaleX: 1,
                scaleY: 1,
                filter: '',
                duration: 0.15,
                ease: "elastic.out(1, 0.5)"
            });
    },
    
    // ==========================================
    // 플레이어 피격 애니메이션 - GSAP! (약하게)
    // ==========================================
    playerHit(damage = 0) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        // 플레이어는 약하게
        let intensity, freezeTime;
        if (damage >= 20) {
            intensity = 1.5;
            freezeTime = 0.06;
        } else if (damage >= 12) {
            intensity = 1.2;
            freezeTime = 0.04;
        } else if (damage >= 6) {
            intensity = 0.8;
            freezeTime = 0.03;
        } else {
            intensity = 0.5;
            freezeTime = 0.02;
        }
        
        // 화면 흔들림 (약하게)
        this.screenShake(intensity * 2, freezeTime + 0.05);
        
        gsap.timeline()
            // 히트스탑
            .set(sprite, {
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
            .to(sprite, { duration: freezeTime })
            // 파닥파닥 (약하게)
            .to(sprite, {
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
            })
            // 복구
            .to(sprite, {
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
    // 플레이어 방어 애니메이션 - GSAP!
    // ==========================================
    playerDefend(blockAmount = 5) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        const intensity = Math.min(blockAmount / 10, 1) + 0.3;
        
        gsap.timeline()
            .to(sprite, {
                scaleX: 1.05 * intensity,
                scaleY: 0.95,
                x: -3 * intensity,
                filter: `
                    drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))
                    brightness(1.2)
                `,
                duration: 0.08
            })
            .to(sprite, {
                rotation: 2 * intensity,
                duration: 0.03
            })
            .to(sprite, {
                rotation: -1 * intensity,
                duration: 0.03
            })
            .to(sprite, {
                x: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                filter: '',
                duration: 0.15,
                ease: "elastic.out(1, 0.6)"
            });
    },
    
    // ==========================================
    // 적 방어 애니메이션 - GSAP!
    // ==========================================
    enemyDefend(enemyElement, blockAmount = 5) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        const intensity = Math.min(blockAmount / 10, 1) + 0.3;
        
        gsap.timeline()
            .to(sprite, {
                scaleX: 1.08 * intensity,
                scaleY: 0.92,
                x: 5 * intensity,
                filter: `
                    drop-shadow(0 0 12px rgba(100, 150, 255, 0.8))
                    brightness(1.3)
                `,
                duration: 0.08
            })
            .to(sprite, { rotation: -3 * intensity, duration: 0.03 })
            .to(sprite, { rotation: 2 * intensity, duration: 0.03 })
            .to(sprite, {
                x: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                filter: '',
                duration: 0.15,
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

console.log('[SpriteAnimation] GSAP 기반 시스템 로드됨!');
