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
        // ⚔️ 베기 (Strike) - 기본 공격
        this.registry['strike'] = {
            name: '베기',
            execute: this.strikeAnimation.bind(this)
        };
        
        // 💥 강타 (Bash)
        this.registry['bash'] = {
            name: '강타',
            execute: this.bashAnimation.bind(this)
        };
        
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
        
        // 💀 비열한 일격 (Dirty Strike) - 그림자 백스탭!
        this.registry['dirtyStrike'] = {
            name: '비열한 일격',
            execute: this.dirtyStrikeAnimation.bind(this)
        };
        
        // 💀 비열한 일격+ (Dirty Strike+)
        this.registry['dirtyStrikeP'] = {
            name: '비열한 일격+',
            execute: this.dirtyStrikePlusAnimation.bind(this)
        };
        
        console.log('[CardAnimations] 등록된 애니메이션:', Object.keys(this.registry));
    },
    
    // ==========================================
    // ⚔️ 베기 애니메이션 - DDOO Action 엔진 사용!
    // ==========================================
    strikeAnimation(options = {}) {
        const {
            target,
            targetEl,
            damage = 6,
            onHit,
            onComplete
        } = options;
        
        return new Promise(async (resolve) => {
            // 🎮 DDOO Action 엔진 사용
            if (typeof DDOOAction !== 'undefined' && DDOOAction.initialized) {
                console.log('[CardAnimations] 🎮 DDOO Action 엔진으로 베기 실행');
                
                const playerContainer = PlayerRenderer?.playerContainer;
                const playerSprite = PlayerRenderer?.sprite;
                
                if (!playerContainer || !playerSprite) {
                    return this.strikeAnimationFallback(options).then(resolve);
                }
                
                const getHitPoint = () => {
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                        if (enemyData) {
                            const bounds = enemyData.sprite.getBounds();
                            return {
                                x: enemyData.container.x,
                                y: enemyData.container.y - bounds.height / 2,
                                scale: enemyData.sprite.scale.x
                            };
                        }
                    }
                    return { x: playerContainer.x + 200, y: playerContainer.y - 60, scale: 1 };
                };
                
                const baseX = playerContainer.x;
                const baseY = playerContainer.y;
                
                const animOptions = {
                    container: playerContainer,
                    sprite: playerSprite,
                    baseX,
                    baseY,
                    dir: 1,
                    getHitPoint
                };
                
                try {
                    // 🏃 대시
                    await DDOOAction.play('player.dash', animOptions);
                    
                    // ⚔️ 대검 베기
                    const attackPromise = DDOOAction.play('player.heavy_slash', {
                        ...animOptions,
                        isRelative: true
                    });
                    
                    // 타격 시점에 콜백
                    setTimeout(() => {
                        if (onHit) onHit(0, damage);
                        
                        // 적 피격 애니메이션
                        if (target && typeof EnemyRenderer !== 'undefined') {
                            const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                            if (enemyData) {
                                DDOOAction.play('enemy.hit', {
                                    container: enemyData.container,
                                    sprite: enemyData.sprite,
                                    baseX: enemyData.container.x,
                                    baseY: enemyData.container.y,
                                    dir: -1,
                                    isRelative: true,
                                    getHitPoint: () => getHitPoint()
                                });
                            }
                        }
                    }, 65);
                    
                    await attackPromise;
                    await DDOOAction.delay(120);
                    
                    // 🏃 복귀
                    await DDOOAction.play('player.return', animOptions);
                    
                    if (onComplete) onComplete();
                    resolve();
                    
                } catch (e) {
                    console.error('[CardAnimations] Strike 에러:', e);
                    this.playerReturnFromAttack();
                    if (onComplete) onComplete();
                    resolve();
                }
                
            } else {
                return this.strikeAnimationFallback(options).then(resolve);
            }
        });
    },
    
    // 베기 폴백
    strikeAnimationFallback(options = {}) {
        const { target, targetEl, damage = 6, onHit, onComplete } = options;
        
        return new Promise((resolve) => {
            this.playerDashAttack(() => {
                setTimeout(() => {
                    if (onHit) onHit(0, damage);
                    
                    let targetX, targetY;
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        const pos = EnemyRenderer.getEnemyPosition(target);
                        if (pos) { targetX = pos.centerX; targetY = pos.centerY; }
                    }
                    if (!targetX && targetEl) {
                        const rect = targetEl.getBoundingClientRect();
                        targetX = rect.left + rect.width / 2;
                        targetY = rect.top + rect.height / 2;
                    }
                    
                    if (targetX && typeof VFX !== 'undefined') {
                        VFX.slash(targetX, targetY, { color: '#ff4444', length: 200 });
                    }
                }, 50);
                
                setTimeout(() => {
                    this.playerReturnFromAttack();
                    if (onComplete) onComplete();
                    resolve();
                }, 300);
            });
        });
    },
    
    // ==========================================
    // 💥 강타 애니메이션 - DDOO Action 엔진 사용!
    // ==========================================
    bashAnimation(options = {}) {
        const {
            target,
            targetEl,
            damage = 15,
            onHit,
            onComplete
        } = options;
        
        return new Promise(async (resolve) => {
            if (typeof DDOOAction !== 'undefined' && DDOOAction.initialized) {
                console.log('[CardAnimations] 🎮 DDOO Action 엔진으로 강타 실행');
                
                const playerContainer = PlayerRenderer?.playerContainer;
                const playerSprite = PlayerRenderer?.sprite;
                
                if (!playerContainer || !playerSprite) {
                    return this.bashAnimationFallback(options).then(resolve);
                }
                
                const getHitPoint = () => {
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                        if (enemyData) {
                            const bounds = enemyData.sprite.getBounds();
                            return {
                                x: enemyData.container.x,
                                y: enemyData.container.y - bounds.height / 2,
                                scale: enemyData.sprite.scale.x
                            };
                        }
                    }
                    return { x: playerContainer.x + 200, y: playerContainer.y - 60, scale: 1 };
                };
                
                const animOptions = {
                    container: playerContainer,
                    sprite: playerSprite,
                    baseX: playerContainer.x,
                    baseY: playerContainer.y,
                    dir: 1,
                    getHitPoint
                };
                
                try {
                    await DDOOAction.play('player.dash', animOptions);
                    
                    const attackPromise = DDOOAction.play('player.bash', {
                        ...animOptions,
                        isRelative: true
                    });
                    
                    setTimeout(() => {
                        if (onHit) onHit(0, damage);
                        
                        if (target && typeof EnemyRenderer !== 'undefined') {
                            const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                            if (enemyData) {
                                DDOOAction.play('enemy.bash_hit', {
                                    container: enemyData.container,
                                    sprite: enemyData.sprite,
                                    baseX: enemyData.container.x,
                                    baseY: enemyData.container.y,
                                    dir: -1,
                                    isRelative: true,
                                    getHitPoint: () => getHitPoint()
                                });
                            }
                        }
                    }, 55);
                    
                    await attackPromise;
                    await DDOOAction.delay(150);
                    await DDOOAction.play('player.return', animOptions);
                    
                    if (onComplete) onComplete();
                    resolve();
                    
                } catch (e) {
                    console.error('[CardAnimations] Bash 에러:', e);
                    this.playerReturnFromAttack();
                    if (onComplete) onComplete();
                    resolve();
                }
                
            } else {
                return this.bashAnimationFallback(options).then(resolve);
            }
        });
    },
    
    // 강타 폴백
    bashAnimationFallback(options = {}) {
        const { target, targetEl, damage = 15, onHit, onComplete } = options;
        
        return new Promise((resolve) => {
            this.playerDashAttack(() => {
                setTimeout(() => {
                    if (onHit) onHit(0, damage);
                    
                    let targetX, targetY;
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        const pos = EnemyRenderer.getEnemyPosition(target);
                        if (pos) { targetX = pos.centerX; targetY = pos.centerY; }
                    }
                    if (!targetX && targetEl) {
                        const rect = targetEl.getBoundingClientRect();
                        targetX = rect.left + rect.width / 2;
                        targetY = rect.top + rect.height / 2;
                    }
                    
                    if (targetX && typeof VFX !== 'undefined') {
                        VFX.impact(targetX, targetY, { color: '#ff6b6b', size: 150 });
                    }
                }, 50);
                
                setTimeout(() => {
                    this.playerReturnFromAttack();
                    if (onComplete) onComplete();
                    resolve();
                }, 400);
            });
        });
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
    // 🗡️ 연속 찌르기 애니메이션 (3회 공격) - DDOO Action 엔진 사용!
    // ==========================================
    flurryAnimation(options = {}) {
        const {
            target,           // 타겟 적 (enemy 객체)
            targetEl,         // 타겟 DOM 요소
            hitCount = 3,     // 타격 횟수
            damage = 2,       // 타격당 데미지
            interval = 200,   // 타격 간격 (ms)
            onHit,            // 각 타격 시 콜백
            onComplete        // 완료 시 콜백
        } = options;
        
        return new Promise(async (resolve) => {
            // 🎮 DDOO Action 엔진 사용 가능 여부 확인
            if (typeof DDOOAction !== 'undefined' && DDOOAction.initialized) {
                console.log('[CardAnimations] 🎮 DDOO Action 엔진으로 연속찌르기 실행');
                
                // 플레이어/적 컨테이너 가져오기
                const playerContainer = PlayerRenderer?.playerContainer;
                const playerSprite = PlayerRenderer?.sprite;
                
                if (!playerContainer || !playerSprite) {
                    console.warn('[CardAnimations] PlayerRenderer 없음, 폴백 사용');
                    return this.flurryAnimationFallback(options).then(resolve);
                }
                
                // 적 위치 계산
                const getHitPoint = () => {
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                        if (enemyData) {
                            const bounds = enemyData.sprite.getBounds();
                            return {
                                x: enemyData.container.x,
                                y: enemyData.container.y - bounds.height / 2,
                                scale: enemyData.sprite.scale.x
                            };
                        }
                    }
                    // 폴백
                    return { x: playerContainer.x + 200, y: playerContainer.y - 60, scale: 1 };
                };
                
                const baseX = playerContainer.x;
                const baseY = playerContainer.y;
                
                // 애니메이션 옵션
                const animOptions = {
                    container: playerContainer,
                    sprite: playerSprite,
                    baseX,
                    baseY,
                    dir: 1,
                    getHitPoint
                };
                
                try {
                    // 🏃 대시
                    await DDOOAction.play('player.dash', animOptions);
                    
                    // 🗡️ 연속 찌르기 (3회)
                    const stabAnims = ['player.flurry_stab1', 'player.flurry_stab2', 'player.flurry_stab3'];
                    
                    for (let i = 0; i < hitCount; i++) {
                        const stabAnim = stabAnims[i % stabAnims.length];
                        
                        // 찌르기 애니메이션 (상대 좌표)
                        const stabPromise = DDOOAction.play(stabAnim, {
                            ...animOptions,
                            isRelative: true
                        });
                        
                        // 타격 시점에 콜백 (약간의 딜레이 후)
                        setTimeout(() => {
                            if (onHit) onHit(i, damage);
                            
                            // 적 피격 애니메이션
                            if (target && typeof EnemyRenderer !== 'undefined') {
                                const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                                if (enemyData) {
                                    DDOOAction.play('enemy.flurry_hit', {
                                        container: enemyData.container,
                                        sprite: enemyData.sprite,
                                        baseX: enemyData.container.x,
                                        baseY: enemyData.container.y,
                                        dir: -1,
                                        isRelative: true,
                                        getHitPoint: () => getHitPoint()
                                    });
                                }
                            }
                        }, 20);
                        
                        await stabPromise;
                        
                        // 타격 사이 딜레이
                        if (i < hitCount - 1) {
                            await DDOOAction.delay(40);
                        }
                    }
                    
                    // 잠시 대기 후 복귀
                    await DDOOAction.delay(80);
                    
                    // 🏃 복귀
                    await DDOOAction.play('player.return', animOptions);
                    
                    if (onComplete) onComplete();
                    resolve();
                    
                } catch (e) {
                    console.error('[CardAnimations] DDOOAction 에러:', e);
                    // 폴백
                    this.playerReturnFromAttack();
                    if (onComplete) onComplete();
                    resolve();
                }
                
            } else {
                // 폴백: 기존 애니메이션
                console.log('[CardAnimations] DDOOAction 없음, 폴백 사용');
                return this.flurryAnimationFallback(options).then(resolve);
            }
        });
    },
    
    // 기존 애니메이션 (폴백)
    flurryAnimationFallback(options = {}) {
        const {
            target,
            targetEl,
            hitCount = 3,
            damage = 2,
            interval = 200,
            onHit,
            onComplete
        } = options;
        
        return new Promise((resolve) => {
            let currentHit = 0;
            
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
            
            const stabPatterns = [
                { offsetX: -20, offsetY: -15, angle: -35, scale: 1.0 },
                { offsetX: 15, offsetY: 5, angle: 10, scale: 1.1 },
                { offsetX: -10, offsetY: 20, angle: -15, scale: 1.05 },
                { offsetX: 25, offsetY: -10, angle: 25, scale: 1.0 },
                { offsetX: 0, offsetY: 0, angle: 0, scale: 1.2 }
            ];
            
            this.playerDashAttack(() => {
                const doStab = () => {
                    if (currentHit >= hitCount) {
                        this.showFinishEffect(targetX, targetY);
                        setTimeout(() => {
                            this.playerReturnFromAttack();
                            if (onComplete) onComplete();
                            resolve();
                        }, 200);
                        return;
                    }
                    
                    const pattern = stabPatterns[currentHit % stabPatterns.length];
                    const isLastHit = currentHit === hitCount - 1;
                    
                    this.playerStabMotion(currentHit, hitCount, pattern);
                    
                    setTimeout(() => {
                        if (targetX) {
                            const hitX = targetX + pattern.offsetX;
                            const hitY = targetY + pattern.offsetY;
                            this.showStabVFX(hitX, hitY, pattern.angle, currentHit, isLastHit);
                            if (onHit) onHit(currentHit, damage);
                            this.showHitNumber(hitX + 60, hitY - 40, currentHit + 1, isLastHit);
                        }
                    }, 50);
                    
                    currentHit++;
                    
                    if (currentHit < hitCount) {
                        setTimeout(doStab, interval);
                    }
                };
                
                doStab();
            });
        });
    },
    
    // ==========================================
    // 🔥 찌르기 VFX (강화)
    // ==========================================
    showStabVFX(x, y, angle, hitIndex, isLast) {
        if (typeof VFX === 'undefined') return;
        
        const colors = ['#60a5fa', '#38bdf8', '#818cf8'];
        const color = colors[hitIndex % colors.length];
        
        // 🗡️ 메인 슬래시 (찌르기 방향)
        VFX.slash(x, y, {
            color: color,
            length: isLast ? 250 : 180,
            width: isLast ? 15 : 10,
            angle: angle,
            duration: 200
        });
        
        // ⚡ 속도선 (찌르기 잔상)
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                VFX.slash(x - 30 - i * 15, y + (Math.random() - 0.5) * 20, {
                    color: '#ffffff',
                    length: 60 + Math.random() * 30,
                    width: 2,
                    angle: angle + (Math.random() - 0.5) * 10,
                    duration: 100,
                    opacity: 0.6 - i * 0.15
                });
            }, i * 15);
        }
        
        // 💥 임팩트 스파크
        VFX.sparks(x, y, { 
            color: color, 
            count: isLast ? 15 : 8,
            speed: isLast ? 20 : 12,
            spread: isLast ? 120 : 80
        });
        
        // ✨ 타격점 플래시
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            PixiRenderer.createHitImpact(x, y, isLast ? 8 : 4, color);
        }
        
        // 🌟 마지막 타격은 더 화려하게!
        if (isLast) {
            // 십자 슬래시
            VFX.crossSlash?.(x, y, { color: '#fbbf24', size: 180 });
            
            // 충격파
            VFX.shockwave?.(x, y, { color: color, size: 120, duration: 200 });
            
            // 추가 스파크 버스트
            setTimeout(() => {
                VFX.sparks(x, y, { color: '#fbbf24', count: 12, speed: 25 });
            }, 50);
        }
    },
    
    // ==========================================
    // 🎬 피니시 이펙트
    // ==========================================
    showFinishEffect(x, y) {
        if (!x || !y) return;
        
        // 잔상 슬래시들
        if (typeof VFX !== 'undefined') {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    VFX.slash(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, {
                        color: '#60a5fa',
                        length: 80 + Math.random() * 40,
                        width: 4,
                        angle: Math.random() * 360,
                        duration: 150,
                        opacity: 0.4
                    });
                }, i * 20);
            }
        }
    },
    
    // ==========================================
    // 🗡️ 연속 찌르기+ 애니메이션 (5회 공격)
    // ==========================================
    flurryPlusAnimation(options = {}) {
        return this.flurryAnimation({
            ...options,
            hitCount: options.hitCount || 5,
            damage: options.damage || 3,
            interval: options.interval || 160  // 더 빠르게 (기본 200ms보다 빠름)
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
    // 플레이어 찌르기 모션 (각 타격) - 강화!
    // ==========================================
    playerStabMotion(hitIndex, totalHits, pattern = null) {
        if (typeof PlayerRenderer === 'undefined' || !PlayerRenderer.initialized) return;
        
        const container = PlayerRenderer.playerContainer;
        const sprite = PlayerRenderer.sprite;
        if (!container || !sprite) return;
        
        const baseScale = container.breathingBaseScale || PlayerRenderer.getPlayerScale();
        const isLastHit = hitIndex === totalHits - 1;
        
        // 패턴이 없으면 기본 패턴 사용
        const p = pattern || {
            offsetX: 15,
            offsetY: 0,
            angle: 0,
            scale: 1.0
        };
        
        if (typeof gsap !== 'undefined') {
            // 이전 찌르기 애니메이션 킬
            gsap.killTweensOf(sprite);
            gsap.killTweensOf(container);
            
            // 찌르기 강도 (마지막은 더 강하게)
            const intensity = isLastHit ? 1.5 : 1.0;
            const xThrust = (25 + p.offsetX * 0.5) * intensity;
            const yShift = p.offsetY * 0.3;
            const rotAngle = p.angle * 0.015 * intensity;
            
            // 🗡️ 강화된 찌르기 모션! (총 120ms)
            const tl = gsap.timeline();
            
            // 1단계: 힘 모으기 (뒤로 살짝) - 30ms
            tl.to(sprite, {
                x: -10 * intensity,
                scaleX: 0.95,
                scaleY: 1.05,
                rotation: -rotAngle * 0.3,
                duration: 0.03,
                ease: 'power2.in'
            })
            // 2단계: 찌르기! (빠르게 앞으로) - 30ms
            .to(sprite, {
                x: xThrust,
                scaleX: 1.1 * p.scale,
                scaleY: 0.92,
                rotation: rotAngle,
                duration: 0.03,
                ease: 'power4.out'
            })
            // 3단계: 복귀 - 60ms
            .to(sprite, {
                x: 0,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                duration: 0.06,
                ease: 'power2.out'
            });
            
            // ⚡ 틴트 플래시 (찌르는 순간)
            const originalTint = sprite.tint || 0xffffff;
            sprite.tint = isLastHit ? 0xffffcc : 0xccddff;
            
            // 50ms 후 원래 색으로 복귀
            setTimeout(() => {
                if (sprite && !sprite.destroyed) {
                    sprite.tint = originalTint;
                }
            }, 50);
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
    // 히트 넘버 표시 (강화!)
    // ==========================================
    showHitNumber(x, y, hitNum, isLast = false) {
        // 컨테이너 (히트 넘버 + 이펙트)
        const container = document.createElement('div');
        container.className = 'flurry-hit-container';
        container.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            z-index: 10002;
            pointer-events: none;
        `;
        
        // 히트 넘버
        const number = document.createElement('div');
        number.textContent = hitNum;
        const fontSize = isLast ? '3rem' : '2.2rem';
        const color = isLast ? '#fbbf24' : '#60a5fa';
        number.style.cssText = `
            font-family: 'Cinzel', serif;
            font-size: ${fontSize};
            font-weight: 900;
            color: ${color};
            text-shadow: 
                0 0 15px ${color},
                0 0 30px ${color}80,
                3px 3px 0 #000,
                -1px -1px 0 #000;
            transform: scale(0);
        `;
        container.appendChild(number);
        
        // 임팩트 링 (마지막 타격)
        if (isLast) {
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: 60px;
                height: 60px;
                border: 3px solid #fbbf24;
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                opacity: 0.8;
            `;
            container.appendChild(ring);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(ring, {
                    scale: 2,
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        }
        
        // 스파크 라인들
        for (let i = 0; i < (isLast ? 8 : 4); i++) {
            const spark = document.createElement('div');
            const angle = (360 / (isLast ? 8 : 4)) * i;
            spark.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: ${isLast ? 25 : 15}px;
                height: 2px;
                background: linear-gradient(90deg, ${color}, transparent);
                transform-origin: left center;
                transform: rotate(${angle}deg) scaleX(0);
            `;
            container.appendChild(spark);
            
            if (typeof gsap !== 'undefined') {
                gsap.to(spark, {
                    scaleX: 1,
                    opacity: 0,
                    duration: 0.2,
                    ease: 'power2.out',
                    delay: 0.02
                });
            }
        }
        
        document.body.appendChild(container);
        
        // GSAP 애니메이션
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline();
            
            // 팝업!
            tl.to(number, {
                scale: isLast ? 1.6 : 1.3,
                duration: 0.06,
                ease: 'back.out(4)'
            })
            // 흔들림
            .to(number, {
                x: isLast ? 5 : 2,
                duration: 0.02,
                yoyo: true,
                repeat: isLast ? 3 : 1
            })
            // 안정화
            .to(number, {
                scale: isLast ? 1.3 : 1,
                x: 0,
                duration: 0.04
            })
            // 위로 날아가며 사라짐
            .to(container, {
                y: isLast ? -60 : -40,
                opacity: 0,
                duration: 0.35,
                delay: 0.08,
                ease: 'power2.in',
                onComplete: () => container.remove()
            });
        } else {
            number.style.transform = 'scale(1)';
            setTimeout(() => container.remove(), 500);
        }
    },
    
    // ==========================================
    // 🗡️ PixiJS 히트 임팩트 (보조)
    // ==========================================
    createPixiImpact(x, y, isLast = false) {
        if (typeof PixiRenderer === 'undefined' || !PixiRenderer.initialized) return;
        
        const container = PixiRenderer.particleContainer || PixiRenderer.container;
        if (!container) return;
        
        const color = isLast ? 0xfbbf24 : 0x60a5fa;
        
        // 임팩트 원
        const impact = new PIXI.Graphics();
        impact.beginFill(color, 0.8);
        impact.drawCircle(0, 0, isLast ? 20 : 10);
        impact.endFill();
        impact.position.set(x, y);
        container.addChild(impact);
        
        // 확장 + 페이드아웃
        if (typeof gsap !== 'undefined') {
            gsap.to(impact, {
                pixi: { scaleX: 3, scaleY: 3 },
                alpha: 0,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    impact.destroy();
                }
            });
        } else {
            setTimeout(() => impact.destroy(), 200);
        }
    },
    
    // ==========================================
    // 💀 비열한 일격 애니메이션 - 그림자 백스탭!
    // ==========================================
    dirtyStrikeAnimation(options = {}) {
        const {
            target,
            targetEl,
            damage = 4,
            onHit,
            onComplete
        } = options;
        
        return new Promise(async (resolve) => {
            // 🎮 DDOO Action 엔진 사용
            if (typeof DDOOAction !== 'undefined' && DDOOAction.initialized) {
                console.log('[CardAnimations] 💀 비열한 일격 - 그림자 백스탭!');
                
                const playerContainer = PlayerRenderer?.playerContainer;
                const playerSprite = PlayerRenderer?.sprite;
                
                if (!playerContainer || !playerSprite) {
                    console.warn('[CardAnimations] PlayerRenderer 없음, 폴백 사용');
                    return this.dirtyStrikeFallback(options).then(resolve);
                }
                
                const getHitPoint = () => {
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                        if (enemyData) {
                            const bounds = enemyData.sprite.getBounds();
                            return {
                                x: enemyData.container.x,
                                y: enemyData.container.y - bounds.height / 2,
                                scale: enemyData.sprite.scale.x
                            };
                        }
                    }
                    return { x: playerContainer.x + 300, y: playerContainer.y - 60, scale: 1 };
                };
                
                const baseX = playerContainer.x;
                const baseY = playerContainer.y;
                
                const animOptions = {
                    container: playerContainer,
                    sprite: playerSprite,
                    baseX,
                    baseY,
                    dir: 1,
                    getHitPoint,
                    onHit: (kf) => {
                        console.log('[CardAnimations] 💀 비열한 일격 히트!');
                        
                        // 적 히트 애니메이션
                        if (target && typeof EnemyRenderer !== 'undefined') {
                            const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                            if (enemyData) {
                                DDOOAction.hitFlash('enemy_' + target.pixiId);
                            }
                        }
                        
                        // 대미지 콜백
                        if (onHit) onHit();
                    }
                };
                
                try {
                    // card.dirtystrike 시퀀스 실행
                    await DDOOAction.play('card.dirtystrike', animOptions);
                    
                    console.log('[CardAnimations] 💀 비열한 일격 완료!');
                    if (onComplete) onComplete();
                    resolve();
                    
                } catch (e) {
                    console.error('[CardAnimations] 비열한 일격 오류:', e);
                    this.dirtyStrikeFallback(options).then(resolve);
                }
                
            } else {
                // 폴백
                this.dirtyStrikeFallback(options).then(resolve);
            }
        });
    },
    
    // 비열한 일격 폴백 (기존 EffectSystem 사용)
    dirtyStrikeFallback(options) {
        const { targetEl, onComplete } = options;
        
        return new Promise((resolve) => {
            const playerEl = document.getElementById('player');
            
            if (typeof EffectSystem !== 'undefined' && EffectSystem.playerAttack) {
                EffectSystem.playerAttack(playerEl, targetEl, () => {
                    if (targetEl) {
                        EffectSystem.slash(targetEl, { color: '#9333ea', count: 1 });
                    }
                    if (onComplete) onComplete();
                    resolve();
                });
            } else {
                if (onComplete) onComplete();
                resolve();
            }
        });
    },
    
    // 💀 비열한 일격+ 애니메이션
    dirtyStrikePlusAnimation(options = {}) {
        // 강화된 버전 - 같은 시퀀스, 더 강한 대미지
        return this.dirtyStrikeAnimation({
            ...options,
            damage: options.damage || 7
        });
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

