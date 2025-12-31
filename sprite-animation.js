// ==========================================
// 스프라이트 애니메이션 시스템
// Squash & Stretch + 생동감 있는 움직임
// ==========================================

const SpriteAnimation = {
    // 설정
    config: {
        breathingSpeed: 2000,      // 숨쉬기 주기 (ms)
        idleSpeed: 3000,           // 대기 애니메이션 주기
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
        console.log('[SpriteAnimation] 초기화');
        this.startIdleAnimations();
        this.setupObserver();
    },
    
    // ==========================================
    // DOM 변화 감지 (적 생성 시 자동 애니메이션)
    // ==========================================
    setupObserver() {
        // 적 컨테이너 감시
        const enemyArea = document.querySelector('.enemy-area, .enemies-container');
        if (!enemyArea) {
            // 나중에 다시 시도
            setTimeout(() => this.setupObserver(), 1000);
            return;
        }
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    // 새 적이 추가되면 애니메이션 시작
                    setTimeout(() => this.refreshEnemyAnimations(), 100);
                }
            });
        });
        
        this.observer.observe(enemyArea, { childList: true, subtree: true });
        console.log('[SpriteAnimation] 적 감시 시작');
    },
    
    // ==========================================
    // 대기 애니메이션 시작 (모든 캐릭터)
    // ==========================================
    startIdleAnimations() {
        // 플레이어 대기 애니메이션
        this.startPlayerIdle();
        
        // 적들 대기 애니메이션 (약간의 딜레이로 자연스럽게)
        setTimeout(() => this.startEnemiesIdle(), 200);
    },
    
    // ==========================================
    // 플레이어 대기 애니메이션
    // ==========================================
    startPlayerIdle() {
        const playerSprite = document.querySelector('.player-sprite-img');
        if (!playerSprite) return;
        
        // 기존 CSS 애니메이션 제거
        playerSprite.style.animation = 'none';
        
        let time = 0;
        const animate = () => {
            time += 16; // ~60fps
            
            // 숨쉬기 효과 (사인파)
            const breathPhase = (time % this.config.breathingSpeed) / this.config.breathingSpeed;
            const breathValue = Math.sin(breathPhase * Math.PI * 2);
            
            // 미세한 좌우 흔들림
            const swayPhase = (time % (this.config.breathingSpeed * 1.5)) / (this.config.breathingSpeed * 1.5);
            const swayValue = Math.sin(swayPhase * Math.PI * 2) * 0.5;
            
            // Squash & Stretch 계산
            const scaleX = 1 + (breathValue * this.config.squashAmount * -0.5);
            const scaleY = 1 + (breathValue * this.config.stretchAmount);
            const translateY = breathValue * -this.config.bounceHeight;
            const rotate = swayValue;
            
            // 변환 적용
            playerSprite.style.transform = `
                translateY(${translateY}px) 
                scaleX(${scaleX}) 
                scaleY(${scaleY})
                rotate(${rotate}deg)
            `;
            
            // 계속 애니메이션
            this.activeAnimations.set('player-idle', requestAnimationFrame(animate));
        };
        
        this.activeAnimations.set('player-idle', requestAnimationFrame(animate));
    },
    
    // ==========================================
    // 적들 대기 애니메이션
    // ==========================================
    startEnemiesIdle() {
        const enemySprites = document.querySelectorAll('.enemy-sprite-img');
        
        console.log(`[SpriteAnimation] 적 스프라이트 발견: ${enemySprites.length}개`);
        
        if (enemySprites.length === 0) {
            // 적이 없으면 나중에 다시 시도
            setTimeout(() => this.startEnemiesIdle(), 500);
            return;
        }
        
        enemySprites.forEach((sprite, index) => {
            // 이미 애니메이션 중인지 확인
            if (this.activeAnimations.has(`enemy-idle-${index}`)) return;
            
            // 기존 CSS 애니메이션 제거
            sprite.style.animation = 'none';
            
            let time = index * 300; // 각 적마다 다른 시작점
            const speed = this.config.breathingSpeed + (index * 200); // 각 적마다 다른 속도
            
            const animate = () => {
                // 스프라이트가 아직 DOM에 있는지 확인
                if (!document.contains(sprite)) {
                    this.activeAnimations.delete(`enemy-idle-${index}`);
                    return;
                }
                
                time += 16;
                
                // 숨쉬기 효과 (더 위협적인 느낌)
                const breathPhase = (time % speed) / speed;
                const breathValue = Math.sin(breathPhase * Math.PI * 2);
                
                // 약간의 좌우 흔들림 (위협적)
                const threatPhase = (time % (speed * 0.7)) / (speed * 0.7);
                const threatValue = Math.sin(threatPhase * Math.PI * 2) * 0.3;
                
                // Squash & Stretch
                const scaleX = 1 + (breathValue * this.config.squashAmount * -0.3);
                const scaleY = 1 + (breathValue * this.config.stretchAmount * 0.7);
                const translateY = breathValue * -this.config.bounceHeight * 0.6;
                const rotate = threatValue;
                
                sprite.style.transform = `
                    translateY(${translateY}px) 
                    scaleX(${scaleX}) 
                    scaleY(${scaleY})
                    rotate(${rotate}deg)
                `;
                
                this.activeAnimations.set(`enemy-idle-${index}`, requestAnimationFrame(animate));
            };
            
            this.activeAnimations.set(`enemy-idle-${index}`, requestAnimationFrame(animate));
        });
    },
    
    // ==========================================
    // 플레이어 점프 애니메이션 (공격 시)
    // ==========================================
    playerJump(callback) {
        const playerSprite = document.querySelector('.player-sprite-img');
        if (!playerSprite) return;
        
        // 대기 애니메이션 일시 중지
        this.stopAnimation('player-idle');
        
        const duration = 400;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 점프 곡선 (위로 갔다가 내려옴)
            const jumpCurve = Math.sin(progress * Math.PI);
            
            // Squash & Stretch (점프할 때)
            let scaleX, scaleY, translateY;
            
            if (progress < 0.2) {
                // 준비 (웅크리기) - Squash
                const prepProgress = progress / 0.2;
                scaleX = 1 + (prepProgress * 0.15);
                scaleY = 1 - (prepProgress * 0.1);
                translateY = prepProgress * 5;
            } else if (progress < 0.5) {
                // 점프 - Stretch
                const jumpProgress = (progress - 0.2) / 0.3;
                scaleX = 1.15 - (jumpProgress * 0.25);
                scaleY = 0.9 + (jumpProgress * 0.2);
                translateY = 5 - (jumpCurve * 60);
            } else if (progress < 0.8) {
                // 낙하 - 약간 Stretch
                const fallProgress = (progress - 0.5) / 0.3;
                scaleX = 0.9 + (fallProgress * 0.05);
                scaleY = 1.1 - (fallProgress * 0.05);
                translateY = -60 + (jumpCurve * 60) + 5;
            } else {
                // 착지 - Squash
                const landProgress = (progress - 0.8) / 0.2;
                scaleX = 0.95 + (landProgress * 0.15);
                scaleY = 1.05 - (landProgress * 0.15);
                translateY = 5 - (landProgress * 5);
            }
            
            playerSprite.style.transform = `
                translateY(${translateY}px) 
                scaleX(${scaleX}) 
                scaleY(${scaleY})
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 애니메이션 완료 후 대기 애니메이션 재시작
                playerSprite.style.transform = '';
                this.startPlayerIdle();
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 플레이어 공격 모션 (빠른 전진)
    // ==========================================
    playerAttack(targetElement, callback) {
        const playerSprite = document.querySelector('.player-sprite-img');
        const playerContainer = document.querySelector('#player');
        if (!playerSprite || !playerContainer) return;
        
        this.stopAnimation('player-idle');
        
        const duration = 300;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 공격 곡선 (빠르게 전진 후 복귀)
            let translateX, scaleX, scaleY;
            
            if (progress < 0.3) {
                // 준비 (뒤로 살짝)
                const prepProgress = progress / 0.3;
                translateX = -20 * prepProgress;
                scaleX = 1 + (prepProgress * 0.1);
                scaleY = 1 - (prepProgress * 0.05);
            } else if (progress < 0.6) {
                // 돌진
                const rushProgress = (progress - 0.3) / 0.3;
                const easeOut = 1 - Math.pow(1 - rushProgress, 3);
                translateX = -20 + (120 * easeOut);
                scaleX = 1.1 - (rushProgress * 0.2);
                scaleY = 0.95 + (rushProgress * 0.1);
            } else {
                // 복귀
                const returnProgress = (progress - 0.6) / 0.4;
                const easeInOut = returnProgress < 0.5 
                    ? 2 * returnProgress * returnProgress 
                    : 1 - Math.pow(-2 * returnProgress + 2, 2) / 2;
                translateX = 100 - (100 * easeInOut);
                scaleX = 0.9 + (easeInOut * 0.1);
                scaleY = 1.05 - (easeInOut * 0.05);
            }
            
            playerSprite.style.transform = `
                translateX(${translateX}px) 
                scaleX(${scaleX}) 
                scaleY(${scaleY})
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                playerSprite.style.transform = '';
                this.startPlayerIdle();
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 적 피격 애니메이션 - 좌우 파닥파닥! (3배 강화!) + 빨간 깜박임!
    // ==========================================
    enemyHit(enemyElement, damage = 0) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        const duration = 500;
        const startTime = performance.now();
        const intensity = Math.min(damage / 10, 1.5) + 0.5;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 빠른 좌우 파닥파닥 흔들림!
            const shakeFreq = 22;
            const shake = Math.sin(progress * Math.PI * shakeFreq) * (1 - progress) * 75 * intensity;
            
            // 약간의 기울기
            const tilt = Math.sin(progress * Math.PI * shakeFreq * 0.8) * (1 - progress) * 24 * intensity;
            
            // 뒤로 밀림
            const knockback = Math.sin(progress * Math.PI * 0.5) * 45 * intensity;
            
            // Squash 효과
            let scaleX = 1, scaleY = 1;
            if (progress < 0.15) {
                scaleX = 1 + (progress / 0.15) * 0.25 * intensity;
                scaleY = 1 - (progress / 0.15) * 0.18 * intensity;
            } else {
                const rec = (progress - 0.15) / 0.85;
                scaleX = 1 + ((1 - rec) * 0.25 * intensity);
                scaleY = 1 - ((1 - rec) * 0.18 * intensity);
            }
            
            // 🔴 빨간 깜박임! (2D 게임 스타일)
            const flashFreq = 12;
            const flash = Math.sin(progress * Math.PI * flashFreq);
            if (flash > 0 && progress < 0.8) {
                sprite.style.filter = `
                    drop-shadow(2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(-2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 2px 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 -2px 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))
                    brightness(1.5) saturate(1.5)
                `;
            } else {
                sprite.style.filter = '';
            }
            
            sprite.style.transform = `
                translateX(${shake + knockback}px) 
                rotate(${tilt}deg)
                scaleX(${scaleX}) 
                scaleY(${scaleY})
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.style.transform = '';
                sprite.style.filter = '';
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 플레이어 피격 애니메이션 - 좌우 파닥파닥! (3배 강화!) + 빨간 깜박임!
    // ==========================================
    playerHit(damage = 0) {
        const sprite = document.querySelector('.player-sprite-img');
        const character = document.querySelector('.player-character');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        const duration = 500;
        const startTime = performance.now();
        const intensity = Math.min(damage / 8, 1.5) + 0.5;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 빠른 좌우 파닥파닥!
            const shakeFreq = 22;
            const shake = Math.sin(progress * Math.PI * shakeFreq) * (1 - progress) * 60 * intensity;
            
            // 머리 흔드는 기울기
            const tilt = Math.sin(progress * Math.PI * shakeFreq * 0.7) * (1 - progress) * 18 * intensity;
            
            // 뒤로 밀림
            const knockback = Math.sin(progress * Math.PI * 0.5) * -75 * intensity;
            
            // Squash 효과
            let scaleX = 1, scaleY = 1;
            if (progress < 0.12) {
                scaleX = 1 + (progress / 0.12) * 0.3 * intensity;
                scaleY = 1 - (progress / 0.12) * 0.2 * intensity;
            } else {
                const rec = (progress - 0.12) / 0.88;
                scaleX = 1 + ((1 - rec) * 0.3 * intensity);
                scaleY = 1 - ((1 - rec) * 0.2 * intensity);
            }
            
            // 🔴 빨간 깜박임! (2D 게임 스타일)
            const flashFreq = 12;
            const flash = Math.sin(progress * Math.PI * flashFreq);
            if (flash > 0 && progress < 0.8) {
                // 빨간 외곽선 + 밝기
                sprite.style.filter = `
                    drop-shadow(2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(-2px 0 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 2px 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 -2px 0 rgba(255, 50, 50, 1))
                    drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))
                    brightness(1.5) saturate(1.5)
                `;
            } else {
                sprite.style.filter = '';
            }
            
            sprite.style.transform = `
                translateX(${knockback + shake}px) 
                rotate(${tilt}deg)
                scaleX(${scaleX}) 
                scaleY(${scaleY})
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.style.transform = '';
                sprite.style.filter = '';
                this.startPlayerIdle();
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 플레이어 방어 애니메이션 (작게 파닥파닥)
    // ==========================================
    playerDefend(blockAmount = 5) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        const duration = 300;
        const startTime = performance.now();
        const intensity = Math.min(blockAmount / 10, 1) * 0.5 + 0.5; // 0.5 ~ 1.0
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 빠른 파닥파닥 흔들림 (작게)
            const flutter = Math.sin(progress * Math.PI * 12) * (1 - progress) * 5 * intensity;
            
            // 살짝 웅크리는 느낌
            let scaleX = 1, scaleY = 1;
            if (progress < 0.3) {
                const prepProgress = progress / 0.3;
                scaleX = 1 + (prepProgress * 0.05);
                scaleY = 1 - (prepProgress * 0.03);
            } else {
                const recoveryProgress = (progress - 0.3) / 0.7;
                scaleX = 1.05 - (recoveryProgress * 0.05);
                scaleY = 0.97 + (recoveryProgress * 0.03);
            }
            
            sprite.style.transform = `
                translateX(${flutter}px) 
                translateY(${Math.abs(flutter) * 0.3}px)
                scaleX(${scaleX}) 
                scaleY(${scaleY})
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.style.transform = '';
                this.startPlayerIdle();
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 적 방어 애니메이션 (작게 파닥파닥)
    // ==========================================
    enemyDefend(enemyElement, blockAmount = 5) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        const duration = 250;
        const startTime = performance.now();
        const intensity = Math.min(blockAmount / 10, 1) * 0.5 + 0.5;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 빠른 파닥파닥 (작게)
            const flutter = Math.sin(progress * Math.PI * 10) * (1 - progress) * 4 * intensity;
            
            // 살짝 움츠림
            let scaleX = 1, scaleY = 1;
            if (progress < 0.25) {
                scaleX = 1 + (progress / 0.25) * 0.04;
                scaleY = 1 - (progress / 0.25) * 0.03;
            } else {
                const rec = (progress - 0.25) / 0.75;
                scaleX = 1.04 - rec * 0.04;
                scaleY = 0.97 + rec * 0.03;
            }
            
            sprite.style.transform = `
                translateX(${flutter}px) 
                scaleX(${scaleX}) 
                scaleY(${scaleY})
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.style.transform = '';
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 플레이어 강한 피격 (크게 파닥파닥)
    // ==========================================
    playerHitHard(damage = 10) {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        const duration = 500;
        const startTime = performance.now();
        const intensity = Math.min(damage / 10, 1.5); // 최대 1.5배
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 강한 파닥파닥 흔들림
            const flutter = Math.sin(progress * Math.PI * 16) * (1 - progress) * 20 * intensity;
            
            // 뒤로 밀림
            const knockback = Math.sin(progress * Math.PI) * -40 * intensity;
            
            // 강한 Squash & Stretch
            let scaleX = 1, scaleY = 1;
            if (progress < 0.1) {
                const impact = progress / 0.1;
                scaleX = 1 + (impact * 0.25 * intensity);
                scaleY = 1 - (impact * 0.15 * intensity);
            } else if (progress < 0.3) {
                const bounce = (progress - 0.1) / 0.2;
                scaleX = 1.25 * intensity - (bounce * 0.35 * intensity) + (1 - intensity * 0.25);
                scaleY = (1 - 0.15 * intensity) + (bounce * 0.2 * intensity);
            } else {
                const recovery = (progress - 0.3) / 0.7;
                scaleX = 1 + ((1 - recovery) * 0.1 * intensity * (1 - recovery));
                scaleY = 1 - ((1 - recovery) * 0.05 * intensity * (1 - recovery));
            }
            
            sprite.style.transform = `
                translateX(${knockback + flutter}px) 
                translateY(${Math.abs(flutter) * 0.5}px)
                scaleX(${scaleX}) 
                scaleY(${scaleY})
                rotate(${flutter * 0.3}deg)
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.style.transform = '';
                this.startPlayerIdle();
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 적 강한 피격 (크게 파닥파닥)
    // ==========================================
    enemyHitHard(enemyElement, damage = 10) {
        const sprite = enemyElement?.querySelector('.enemy-sprite-img');
        if (!sprite) return;
        
        const duration = 450;
        const startTime = performance.now();
        const intensity = Math.min(damage / 10, 1.5);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 강한 파닥파닥
            const flutter = Math.sin(progress * Math.PI * 14) * (1 - progress) * 18 * intensity;
            
            // 뒤로 밀림
            const knockback = Math.sin(progress * Math.PI) * 35 * intensity;
            
            // Squash & Stretch
            let scaleX = 1, scaleY = 1;
            if (progress < 0.12) {
                const impact = progress / 0.12;
                scaleX = 1 + (impact * 0.22 * intensity);
                scaleY = 1 - (impact * 0.12 * intensity);
            } else {
                const recovery = (progress - 0.12) / 0.88;
                scaleX = 1 + ((1 - recovery) * 0.22 * intensity * (1 - recovery));
                scaleY = 1 - ((1 - recovery) * 0.12 * intensity * (1 - recovery));
            }
            
            sprite.style.transform = `
                translateX(${knockback + flutter}px) 
                translateY(${Math.abs(flutter) * 0.4}px)
                scaleX(${scaleX}) 
                scaleY(${scaleY})
                rotate(${flutter * 0.25}deg)
            `;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.style.transform = '';
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 적 죽음 애니메이션
    // ==========================================
    enemyDeath(enemyElement, callback) {
        const sprite = enemyElement.querySelector('.enemy-sprite-img');
        if (!sprite) {
            if (callback) callback();
            return;
        }
        
        const duration = 600;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 위로 튀어오른 후 아래로 떨어지며 사라짐
            const jumpCurve = progress < 0.3 
                ? Math.sin((progress / 0.3) * Math.PI * 0.5) 
                : 1 - ((progress - 0.3) / 0.7);
            
            const translateY = -50 * jumpCurve + (progress > 0.3 ? (progress - 0.3) * 100 : 0);
            const rotate = progress * 360;
            const scale = 1 - (progress * 0.5);
            const opacity = 1 - progress;
            
            sprite.style.transform = `
                translateY(${translateY}px) 
                rotate(${rotate}deg)
                scale(${scale})
            `;
            sprite.style.opacity = opacity;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 승리 애니메이션 (플레이어)
    // ==========================================
    playerVictory() {
        const sprite = document.querySelector('.player-sprite-img');
        if (!sprite) return;
        
        this.stopAnimation('player-idle');
        
        let bounceCount = 0;
        const maxBounces = 3;
        
        const bounce = () => {
            if (bounceCount >= maxBounces) {
                this.startPlayerIdle();
                return;
            }
            
            const duration = 400;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const jumpCurve = Math.sin(progress * Math.PI);
                const height = 40 * (1 - bounceCount * 0.3);
                
                // Squash & Stretch
                let scaleX, scaleY;
                if (progress < 0.2) {
                    scaleX = 1 + (progress / 0.2) * 0.1;
                    scaleY = 1 - (progress / 0.2) * 0.08;
                } else if (progress < 0.5) {
                    scaleX = 1.1 - ((progress - 0.2) / 0.3) * 0.15;
                    scaleY = 0.92 + ((progress - 0.2) / 0.3) * 0.13;
                } else {
                    scaleX = 0.95 + ((progress - 0.5) / 0.5) * 0.05;
                    scaleY = 1.05 - ((progress - 0.5) / 0.5) * 0.05;
                }
                
                sprite.style.transform = `
                    translateY(${-jumpCurve * height}px) 
                    scaleX(${scaleX}) 
                    scaleY(${scaleY})
                `;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    bounceCount++;
                    bounce();
                }
            };
            
            requestAnimationFrame(animate);
        };
        
        bounce();
    },
    
    // ==========================================
    // 애니메이션 중지
    // ==========================================
    stopAnimation(key) {
        if (this.activeAnimations.has(key)) {
            cancelAnimationFrame(this.activeAnimations.get(key));
            this.activeAnimations.delete(key);
        }
    },
    
    // ==========================================
    // 모든 애니메이션 중지
    // ==========================================
    stopAll() {
        this.activeAnimations.forEach((animId, key) => {
            cancelAnimationFrame(animId);
        });
        this.activeAnimations.clear();
        
        // 스프라이트 변환 초기화
        const playerSprite = document.querySelector('.player-sprite-img');
        if (playerSprite) playerSprite.style.transform = '';
        
        document.querySelectorAll('.enemy-sprite-img').forEach(sprite => {
            sprite.style.transform = '';
        });
    },
    
    // ==========================================
    // 적 갱신 시 애니메이션 재시작
    // ==========================================
    refreshEnemyAnimations() {
        // 기존 적 애니메이션 중지
        this.activeAnimations.forEach((animId, key) => {
            if (key.startsWith('enemy-idle')) {
                cancelAnimationFrame(animId);
                this.activeAnimations.delete(key);
            }
        });
        
        // 새로운 적 애니메이션 시작
        setTimeout(() => this.startEnemiesIdle(), 100);
    }
};

// ==========================================
// 전역 이벤트 리스너
// ==========================================

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 약간의 딜레이 후 초기화 (다른 요소들이 로드된 후)
    setTimeout(() => {
        SpriteAnimation.init();
    }, 500);
});

// 전투 시작 시 애니메이션 시작
document.addEventListener('battleStart', () => {
    SpriteAnimation.stopAll();
    setTimeout(() => {
        SpriteAnimation.startIdleAnimations();
    }, 300);
});

// 전투 종료 시 애니메이션 정리
document.addEventListener('battleEnd', () => {
    SpriteAnimation.stopAll();
});

// 전역 접근 가능하도록
window.SpriteAnimation = SpriteAnimation;

console.log('[SpriteAnimation] 모듈 로드 완료');
