// =====================================================
// Unit Combat System - 유닛 전투 시스템 (통합)
// =====================================================

const UnitCombat = {
    game: null,
    app: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef, pixiApp) {
        this.game = gameRef;
        this.app = pixiApp;
        console.log('[UnitCombat] 유닛 전투 시스템 초기화 완료');
    },
    
    // ==========================================
    // ★ 새 유닛 구조 헬퍼 함수
    // container: 위치/이동용 (scale=1)
    // sprite: 스케일 애니메이션용
    // ==========================================
    getPositionTarget(unit) {
        // 위치 접근용: container 우선, 없으면 sprite
        return unit?.container || unit?.sprite;
    },
    
    getScaleTarget(unit) {
        // 스케일 애니메이션용: sprite
        return unit?.sprite;
    },
    
    getUnitPosition(unit) {
        const target = this.getPositionTarget(unit);
        return target ? { x: target.x, y: target.y } : { x: 0, y: 0 };
    },
    
    // ==========================================
    // 통합 근접 공격 애니메이션
    // attacker: 공격자 유닛
    // target: 대상 유닛
    // damage: 데미지
    // options: { effectType, knockback, slashColor, isEnemy, onHit }
    // ==========================================
    async meleeAttack(attacker, target, damage, options = {}) {
        const {
            effectType = 'strike',
            knockback = 0,
            slashColor = null,
            isEnemy = false,
            onHit = null
        } = options;
        
        // 스프라이트 없으면 데미지만
        if (!attacker.sprite || !target.sprite) {
            if (isEnemy) {
                this.game.dealDamageToTarget(target, damage);
            } else {
                this.game.dealDamage(target, damage);
            }
            if (knockback > 0 && target.hp > 0 && typeof KnockbackSystem !== 'undefined') {
                await KnockbackSystem.knockback(target, 1, knockback);
            }
            return;
        }
        
        // 배쉬는 별도 처리 (묵직한 타격)
        if (effectType === 'bash') {
            await this.bashAttack(attacker, target, damage, { knockback, isEnemy, onHit });
            return;
        }
        
        // 연속 찌르기는 빠른 공격
        if (effectType === 'flurry') {
            await this.flurryAttack(attacker, target, damage, { isEnemy, onHit });
            return;
        }
        
        attacker.isAnimating = true;
        
        // ★ 새 구조: 위치는 container, 스케일은 sprite
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const targetPosTarget = this.getPositionTarget(target);
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = targetPosTarget.x;
        const targetCenter = targetPosTarget.y - (target.sprite?.height || 60) / 2;
        
        // 방향 (아군은 오른쪽으로, 적은 왼쪽으로)
        const dashDirection = isEnemy ? -1 : 1;
        const dashX = targetX - (dashDirection * 60);
        
        // 1. 윈드업 + 돌진 (위치: posTarget, 스케일: scaleTarget) + ★ 산데비스탄!
        // 잔상: 윈드업 시작
        if (typeof SkillSystem !== 'undefined') {
            SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.CYAN);
        }
        
        await new Promise(resolve => {
            // 잔상: 대시 중 산데비스탄 트레일 (★ 더 많이, 더 빠르게!)
            let trailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                trailTimer = SkillSystem.startSandevistanTrail(attacker, 6, SkillSystem.GHOST_COLORS.CYAN, 18);
            }
            
            gsap.timeline()
                .to(posTarget, { x: startX - (dashDirection * 15), duration: 0.08 })
                .to(scaleTarget.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.08 }, '<')
                .to(posTarget, { x: dashX, duration: 0.12, ease: 'power2.in' })
                .to(scaleTarget.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.1 }, '<')
                .add(() => {
                    if (trailTimer && typeof SkillSystem !== 'undefined') {
                        SkillSystem.stopSandevistanTrail(trailTimer);
                    }
                    resolve();
                });
        });
        
        // 2. 히트 스톱
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.hitStop(40);
        }
        
        // 3. 공격 이펙트
        this.playAttackEffect(effectType, targetX, targetCenter, slashColor);
        
        // 4. 피격 처리 (데미지 숫자는 dealDamage에서 표시)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitEffect(target.sprite);
        }
        
        if (isEnemy) {
            this.game.dealDamageToTarget(target, damage);
        } else {
            this.game.dealDamage(target, damage);
        }
        
        // 넉백 (병렬)
        if (knockback > 0 && target.hp > 0 && typeof KnockbackSystem !== 'undefined') {
            KnockbackSystem.knockback(target, 1, knockback);
        }
        
        if (onHit) onHit();
        
        // 5. 복귀 (await 없이) + 스케일 복원! + ★ 산데비스탄!
        if (posTarget && scaleTarget && !scaleTarget.destroyed) {
            // 잔상: 복귀 시작
            if (typeof SkillSystem !== 'undefined') {
                SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.MAGENTA);
            }
            
            // 잔상: 복귀 중 산데비스탄 트레일 (★ 더 많이!)
            let returnTrailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                returnTrailTimer = SkillSystem.startSandevistanTrail(attacker, 5, SkillSystem.GHOST_COLORS.MAGENTA, 25);
            }
            
            gsap.timeline()
                .to(posTarget, {
                    x: startX,
                    y: startY,
                    duration: 0.25,
                    ease: 'power2.out'
                })
                .to(scaleTarget.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.15,
                    ease: 'power2.out'
                }, '<')
                .call(() => {
                    if (returnTrailTimer && typeof SkillSystem !== 'undefined') {
                        SkillSystem.stopSandevistanTrail(returnTrailTimer);
                    }
                    if (attacker) attacker.isAnimating = false;
                });
        } else {
            if (attacker) attacker.isAnimating = false;
        }
    },
    
    // ==========================================
    // 배쉬 전용 공격 (묵직한 내려치기)
    // ==========================================
    async bashAttack(attacker, target, damage, options = {}) {
        const { knockback = 0, isEnemy = false, onHit = null } = options;
        
        // 스프라이트 체크
        if (!attacker?.sprite || !target?.sprite) {
            if (isEnemy) {
                this.game.dealDamageToTarget(target, damage);
            } else {
                this.game.dealDamage(target, damage);
            }
            if (knockback > 0 && target?.hp > 0 && typeof KnockbackSystem !== 'undefined') {
                await KnockbackSystem.knockback(target, 1, knockback);
            }
            return;
        }
        
        attacker.isAnimating = true;
        
        // ★ 새 구조: 위치는 posTarget, 스케일은 scaleTarget
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const targetPosTarget = this.getPositionTarget(target);
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = targetPosTarget.x;
        const targetCenter = targetPosTarget.y - (target.sprite?.height || 60) / 2;
        
        const dashDirection = isEnemy ? -1 : 1;
        const bashX = targetX - (dashDirection * 40);
        
        // 1. 큰 윈드업 (무기 들어올림) + ★ 산데비스탄!
        // 잔상: 윈드업 시작
        if (typeof SkillSystem !== 'undefined') {
            SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.YELLOW);
        }
        
        await new Promise(resolve => {
            if (!posTarget || !scaleTarget) { resolve(); return; }
            
            // 잔상: 대시 중 산데비스탄 트레일 (강타는 노란색 + 더 강하게!)
            let trailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                trailTimer = SkillSystem.startSandevistanTrail(attacker, 7, SkillSystem.GHOST_COLORS.YELLOW, 15);
            }
            
            gsap.timeline()
                .to(posTarget, { x: startX - (dashDirection * 25), duration: 0.12 })
                .to(scaleTarget.scale, { x: baseScale * 0.85, y: baseScale * 1.2, duration: 0.12 }, '<')
                .to(posTarget, { 
                    x: bashX, 
                    y: startY - 30,
                    duration: 0.15, 
                    ease: 'power2.out' 
                })
                .to(scaleTarget.scale, { x: baseScale * 1.3, y: baseScale * 0.75, duration: 0.1 }, '<')
                .to(posTarget, { 
                    y: startY + 5,
                    duration: 0.08, 
                    ease: 'power3.in' 
                })
                .to(scaleTarget.scale, { x: baseScale * 1.4, y: baseScale * 0.65, duration: 0.08 }, '<')
                .add(() => {
                    if (trailTimer && typeof SkillSystem !== 'undefined') {
                        SkillSystem.stopSandevistanTrail(trailTimer);
                    }
                    // 착지 잔상
                    if (typeof SkillSystem !== 'undefined') {
                        SkillSystem.createGhost(attacker, 0.6, SkillSystem.GHOST_COLORS.YELLOW);
                    }
                    resolve();
                });
        });
        
        // 2. 긴 히트스톱
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.hitStop(80);
        }
        
        // 3. 강력한 이펙트
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.heavySlash(targetX, targetCenter, -30, 0xff8800);
            CombatEffects.screenShake(15, 200);
            CombatEffects.screenFlash('#ff6600', 100, 0.3);
            CombatEffects.burstParticles(targetX, targetCenter, 0xff8800, 12);
        }
        
        // 4. 피격 (데미지 숫자는 dealDamage에서 표시)
        if (typeof CombatEffects !== 'undefined' && target.sprite) {
            CombatEffects.hitEffect(target.sprite);
        }
        
        if (isEnemy) {
            this.game.dealDamageToTarget(target, damage);
        } else {
            this.game.dealDamage(target, damage);
        }
        
        // 5. 넉백
        if (knockback > 0 && target.hp > 0 && typeof KnockbackSystem !== 'undefined') {
            KnockbackSystem.knockback(target, 1, knockback);
        }
        
        if (onHit) onHit();
        
        // 6. 느린 복귀 + 스케일 복원! + ★ 산데비스탄!
        if (posTarget && scaleTarget && !scaleTarget.destroyed) {
            // 잔상: 복귀 시작
            if (typeof SkillSystem !== 'undefined') {
                SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.MAGENTA);
            }
            
            // 잔상: 복귀 중 산데비스탄 트레일 (★ 더 많이!)
            let returnTrailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                returnTrailTimer = SkillSystem.startSandevistanTrail(attacker, 6, SkillSystem.GHOST_COLORS.MAGENTA, 30);
            }
            
            gsap.timeline()
                .to({}, { duration: 0.15 })
                .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.2, ease: 'power2.out' })
                .to(posTarget, {
                    x: startX,
                    y: startY,
                    duration: 0.35,
                    ease: 'power2.out',
                    onComplete: () => {
                        if (returnTrailTimer && typeof SkillSystem !== 'undefined') {
                            SkillSystem.stopSandevistanTrail(returnTrailTimer);
                        }
                        if (attacker) attacker.isAnimating = false;
                    }
                }, '<');
        } else {
            if (attacker) attacker.isAnimating = false;
        }
    },
    
    // ==========================================
    // ★ 돌진 공격 (Rush) - 밀어붙이기!
    // 한 번 돌진 후 적을 따라가며 연속 타격
    // ==========================================
    async rushAttack(attacker, target, damage, options = {}) {
        const { hits = 3, knockbackPerHit = 1, isEnemy = false, onHit = null } = options;
        
        console.log(`[Rush] 돌진 시작! hits=${hits}, damage=${damage}`);
        
        if (!target || target.hp <= 0 || !target.sprite) {
            console.log('[Rush] 타겟 없음, 종료');
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        attacker.isAnimating = true;
        
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        
        if (!posTarget || !scaleTarget) {
            console.log('[Rush] posTarget/scaleTarget 없음, 종료');
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        const dashDirection = isEnemy ? -1 : 1;
        
        // ====================================
        // 1. 초기 돌진 (한 번만!) - 강력한 연출!
        // ====================================
        const initialTargetPos = this.getPositionTarget(target);
        if (!initialTargetPos) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        const initialDashX = initialTargetPos.x - (dashDirection * 25);
        
        // ★ 돌진 준비 - 웅크림 + 충격파 예고
        if (typeof SkillSystem !== 'undefined') {
            SkillSystem.createGhost(attacker, 0.7, SkillSystem.GHOST_COLORS.RED);
        }
        
        // 스피드라인 생성
        this.createRushSpeedLines(posTarget.x, posTarget.y, dashDirection);
        
        // 윈드업 (더 극적으로)
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(posTarget, { x: startX - (dashDirection * 40), duration: 0.1, ease: 'power2.in' })
                .to(scaleTarget.scale, { x: baseScale * 0.7, y: baseScale * 1.4, duration: 0.1 }, '<');
        });
        
        // ★ 강력한 대쉬 트레일
        let trailTimer = null;
        if (typeof SkillSystem !== 'undefined') {
            trailTimer = SkillSystem.startSandevistanTrail(attacker, 12, SkillSystem.GHOST_COLORS.RED, 8);
        }
        
        // ★ 돌진! (더 빠르고 강하게)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff8800', 40, 0.2);
        }
        
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(posTarget, { x: initialDashX, y: startY - 10, duration: 0.08, ease: 'power4.out' })
                .to(scaleTarget.scale, { x: baseScale * 1.4, y: baseScale * 0.7, duration: 0.06 }, '<');
        });
        
        if (trailTimer && typeof SkillSystem !== 'undefined') {
            SkillSystem.stopSandevistanTrail(trailTimer);
        }
        
        // ====================================
        // 2. 연속 밀어붙이기 (파파팍!) - 강화된 이펙트
        // ====================================
        for (let hitNum = 0; hitNum < hits; hitNum++) {
            console.log(`[Rush] Hit ${hitNum + 1}/${hits}`);
            
            // 타겟 사망 체크
            if (!target || target.hp <= 0 || !target.sprite || target.sprite.destroyed) {
                console.log(`[Rush] 타겟 사망, 중단`);
                break;
            }
            
            // 현재 타겟 위치
            const currentTargetPos = this.getPositionTarget(target);
            if (!currentTargetPos) {
                console.log(`[Rush] 타겟 위치 없음, 중단`);
                break;
            }
            
            const targetX = currentTargetPos.x;
            const targetY = currentTargetPos.y;
            const targetCenter = targetY - (target.sprite?.height || 60) / 2;
            
            // ★ 타격 직전 - 몸통 앞으로 찌름
            if (scaleTarget && !scaleTarget.destroyed) {
                gsap.to(scaleTarget.scale, { 
                    x: baseScale * 1.2, 
                    y: baseScale * 0.85, 
                    duration: 0.03 
                });
            }
            
            // ★ 짧은 히트스톱
            if (typeof CombatEffects !== 'undefined') {
                await CombatEffects.hitStop(12);
            }
            
            // ★ 타격 이펙트 (점점 강해짐!)
            if (typeof CombatEffects !== 'undefined') {
                // 임팩트 효과
                CombatEffects.impactEffect(targetX, targetCenter, 0xff6600, 0.8 + hitNum * 0.3);
                CombatEffects.slashEffect(targetX, targetCenter, -45 + hitNum * 30, 0xff8844);
                CombatEffects.burstParticles(targetX, targetCenter, 0xffaa44, 5 + hitNum * 3);
                CombatEffects.screenShake(5 + hitNum * 4, 50);
                
                // 스피드라인 (밀어붙이는 느낌)
                this.createPushImpactLines(targetX, targetY, dashDirection);
                
                if (hitNum === hits - 1) {
                    // ★ 마지막 타격 - 폭발적!
                    CombatEffects.heavySlash(targetX, targetCenter, 0, 0xff4400);
                    CombatEffects.impactEffect(targetX, targetCenter, 0xff4400, 1.5);
                    CombatEffects.screenFlash('#ff4400', 80, 0.35);
                    CombatEffects.screenShake(15, 150);
                    CombatEffects.burstParticles(targetX, targetCenter, 0xff6600, 15);
                }
            }
            
            // 피격
            if (target.sprite && !target.sprite.destroyed) {
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.hitEffect(target.sprite);
                }
            }
            
            // 대미지
            if (isEnemy) {
                this.game.dealDamageToTarget(target, damage);
            } else {
                this.game.dealDamage(target, damage);
            }
            
            // 브레이크 시스템
            if (typeof BreakSystem !== 'undefined' && options.cardDef) {
                BreakSystem.onAttack(target, options.cardDef, 1, hitNum);
            }
            
            // ★ 넉백 + 추격을 동시에!
            if (target.hp > 0 && typeof KnockbackSystem !== 'undefined') {
                // 넉백 시작
                const knockbackPromise = KnockbackSystem.knockback(target, dashDirection, knockbackPerHit);
                
                // 적을 따라가기 (넉백과 동시에!)
                if (hitNum < hits - 1 && posTarget && !posTarget.destroyed) {
                    const predictedX = currentTargetPos.x + (dashDirection * 65);
                    const chaseX = predictedX - (dashDirection * 20);
                    
                    // 추격 잔상 + 스케일
                    if (typeof SkillSystem !== 'undefined') {
                        SkillSystem.createGhost(attacker, 0.35, SkillSystem.GHOST_COLORS.RED);
                    }
                    
                    // ★ 추격 시 앞으로 찌르는 느낌
                    gsap.to(posTarget, { x: chaseX, duration: 0.08, ease: 'power2.out' });
                    gsap.to(scaleTarget.scale, { 
                        x: baseScale * 1.15, 
                        y: baseScale * 0.9, 
                        duration: 0.06 
                    });
                }
                
                // 넉백 완료 대기
                await knockbackPromise;
                
                // 실제 적 위치로 미세 조정
                if (hitNum < hits - 1) {
                    const newTargetPos = this.getPositionTarget(target);
                    if (newTargetPos && posTarget && !posTarget.destroyed) {
                        const finalChaseX = newTargetPos.x - (dashDirection * 20);
                        gsap.to(posTarget, { x: finalChaseX, duration: 0.04, ease: 'none' });
                    }
                    await new Promise(r => setTimeout(r, 25));
                }
            } else if (hitNum < hits - 1) {
                // 넉백 없어도 다음 타격 진행
                await new Promise(r => setTimeout(r, 40));
            }
        }
        
        if (onHit) onHit();
        
        // ====================================
        // 3. 복귀 (부드럽게)
        // ====================================
        if (posTarget && !posTarget.destroyed && scaleTarget && !scaleTarget.destroyed) {
            // 복귀 잔상
            if (typeof SkillSystem !== 'undefined') {
                SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.MAGENTA);
            }
            
            await new Promise(resolve => {
                gsap.timeline({ onComplete: resolve })
                    .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.12, ease: 'elastic.out(1, 0.5)' })
                    .to(posTarget, { x: startX, y: startY, duration: 0.2, ease: 'power2.out' }, '<');
            });
        }
        
        console.log('[Rush] 돌진 완료!');
        if (attacker) attacker.isAnimating = false;
    },
    
    // ★ 돌진 스피드라인 생성
    createRushSpeedLines(x, y, direction) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        for (let i = 0; i < 8; i++) {
            const line = new PIXI.Graphics();
            const offsetY = (Math.random() - 0.5) * 80;
            const length = 60 + Math.random() * 80;
            
            line.moveTo(0, 0);
            line.lineTo(-direction * length, 0);
            line.stroke({ width: 2 + Math.random() * 3, color: 0xffaa44, alpha: 0.8 });
            
            line.x = x + direction * 20;
            line.y = y + offsetY;
            line.zIndex = 150;
            CombatEffects.container.addChild(line);
            
            gsap.to(line, {
                x: line.x + direction * 150,
                alpha: 0,
                duration: 0.2,
                delay: i * 0.015,
                ease: 'power2.out',
                onComplete: () => { if (!line.destroyed) line.destroy(); }
            });
        }
    },
    
    // ★ 밀어붙이기 임팩트 라인
    createPushImpactLines(x, y, direction) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        for (let i = 0; i < 5; i++) {
            const line = new PIXI.Graphics();
            const angle = (Math.random() - 0.5) * 0.6; // 약간의 각도 변화
            const length = 40 + Math.random() * 50;
            
            line.moveTo(0, 0);
            line.lineTo(direction * length, Math.tan(angle) * length);
            line.stroke({ width: 3 + Math.random() * 2, color: 0xffcc66, alpha: 0.9 });
            
            line.x = x - direction * 10;
            line.y = y - 30 + (Math.random() - 0.5) * 60;
            line.zIndex = 150;
            CombatEffects.container.addChild(line);
            
            gsap.to(line, {
                x: line.x + direction * 80,
                alpha: 0,
                duration: 0.15,
                ease: 'power2.out',
                onComplete: () => { if (!line.destroyed) line.destroy(); }
            });
        }
    },
    
    // ==========================================
    // 연속 찌르기 공격 (Flurry) - 빠른 3연타
    // ==========================================
    async flurryAttack(attacker, target, damage, options = {}) {
        const { isEnemy = false, onHit = null } = options;
        
        // ★ 타겟이 이미 죽었으면 즉시 종료
        if (!target || target.hp <= 0 || !target.sprite || target.sprite.destroyed) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        attacker.isAnimating = true;
        
        // ★ 새 구조: 위치는 posTarget, 스케일은 scaleTarget
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const targetPosTarget = this.getPositionTarget(target);
        
        // ★ 유효성 체크
        if (!posTarget || !scaleTarget || !targetPosTarget) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = targetPosTarget.x;
        const targetCenter = targetPosTarget.y - (target.sprite?.height || 60) / 2;
        const dashDirection = isEnemy ? -1 : 1;
        const dashX = targetX - (dashDirection * 50);
        
        // 1. 빠른 돌진 (안전 체크) + ★ 산데비스탄!
        // 잔상: 돌진 시작
        if (typeof SkillSystem !== 'undefined') {
            SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.CYAN);
        }
        
        await new Promise(resolve => {
            if (!posTarget || posTarget.destroyed || !scaleTarget || scaleTarget.destroyed) {
                resolve();
                return;
            }
            
            // 잔상: 대시 중 트레일 (빠른 공격용)
            let trailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                trailTimer = SkillSystem.startSandevistanTrail(attacker, 5, SkillSystem.GHOST_COLORS.CYAN, 15);
            }
            
            gsap.timeline()
                .to(posTarget, { x: dashX, duration: 0.08, ease: 'power3.in' })
                .to(scaleTarget.scale, { x: baseScale * 1.05, y: baseScale * 0.95, duration: 0.06 }, '<')
                .add(() => {
                    if (trailTimer && typeof SkillSystem !== 'undefined') {
                        SkillSystem.stopSandevistanTrail(trailTimer);
                    }
                    resolve();
                });
        });
        
        // ★ 타겟 사망 체크
        if (!target || target.hp <= 0 || !target.sprite || target.sprite.destroyed) {
            // 복귀만 하고 종료
            if (posTarget && !posTarget.destroyed && scaleTarget && !scaleTarget.destroyed) {
                gsap.to(posTarget, { x: startX, y: startY, duration: 0.15 });
                gsap.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.1 });
            }
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        // 2. 짧은 히트스톱
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.hitStop(25);
        }
        
        // 3. 빠른 찌르기 이펙트 (단일 타격용 - 작은 스파크)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.slashEffect(targetX, targetCenter, 25, 0x88ccff);
            CombatEffects.burstParticles(targetX, targetCenter, 0x88ccff, 5);
        }
        
        // 4. 피격 (데미지 숫자는 dealDamage에서 표시)
        if (typeof CombatEffects !== 'undefined' && target.sprite && !target.sprite.destroyed) {
            CombatEffects.hitEffect(target.sprite);
        }
        
        if (isEnemy) {
            this.game.dealDamageToTarget(target, damage);
        } else {
            this.game.dealDamage(target, damage);
        }
        
        if (onHit) onHit();
        
        // 5. 빠른 복귀 (바로 다음 타격 준비) + 스케일 복원! + ★ 산데비스탄!
        await new Promise(resolve => {
            if (!scaleTarget || scaleTarget.destroyed || !posTarget || posTarget.destroyed) {
                if (attacker) attacker.isAnimating = false;
                resolve();
                return;
            }
            
            // 잔상: 복귀
            if (typeof SkillSystem !== 'undefined') {
                SkillSystem.createGhost(attacker, 0.4, SkillSystem.GHOST_COLORS.MAGENTA);
            }
            
            gsap.timeline()
                .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.06 })
                .to(posTarget, {
                    x: startX,
                    y: startY,
                    duration: 0.1,
                    ease: 'power1.out',
                    onComplete: () => {
                        if (attacker) attacker.isAnimating = false;
                        resolve();
                    }
                }, '<');
        });
    },
    
    // ==========================================
    // 통합 원거리 공격 애니메이션
    // ==========================================
    async rangedAttack(attacker, target, damage, options = {}) {
        const {
            projectileColor = 0xffaa00,
            projectileSize = 8,
            projectileType = 'default',  // 'default', 'arrow', 'fire'
            createZone = null,
            isEnemy = false,
            onHit = null
        } = options;
        
        // ★ 새 구조: 위치는 posTarget, 스케일은 scaleTarget
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const targetPosTarget = this.getPositionTarget(target);
        
        if (!posTarget || !targetPosTarget) {
            if (isEnemy) {
                this.game.dealDamageToTarget(target, damage);
            } else {
                this.game.dealDamage(target, damage);
            }
            return;
        }
        
        attacker.isAnimating = true;
        
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        const originalX = posTarget.x;
        const startX = posTarget.x;
        const startY = posTarget.y - (attacker.sprite?.height || 60) / 2;
        const endX = targetPosTarget.x;
        const endY = targetPosTarget.y - (target.sprite?.height || 60) / 2;
        
        // ★ 타겟 방향 쳐다보기 (스프라이트 뒤집기)
        const shouldFaceRight = endX > startX;
        if (scaleTarget && scaleTarget.scale) {
            if (isEnemy) {
                // 적: 기본적으로 왼쪽을 봄, 오른쪽 타겟이면 뒤집기
                scaleTarget.scale.x = shouldFaceRight ? -baseScale : baseScale;
            } else {
                // 아군: 기본적으로 오른쪽을 봄, 왼쪽 타겟이면 뒤집기
                scaleTarget.scale.x = shouldFaceRight ? baseScale : -baseScale;
            }
        }
        
        // 1. 슈팅 스탠스
        const recoil = isEnemy ? 8 : -10;
        if (!scaleTarget || scaleTarget.destroyed) {
            attacker.isAnimating = false;
            return;
        }
        
        await new Promise(resolve => {
            if (!scaleTarget || scaleTarget.destroyed) {
                resolve();
                return;
            }
            gsap.timeline()
                .to(scaleTarget.scale, { y: baseScale * 1.05, duration: 0.1 })
                .to(posTarget, { x: originalX + recoil, duration: 0.1 }, 0)
                .add(resolve);
        });
        
        // 2. 투사체 타입별 처리 (데미지 숫자는 dealDamage에서 표시)
        if (typeof CombatEffects !== 'undefined') {
            console.log('[UnitCombat] rangedAttack - projectileType:', projectileType, 'createZone:', createZone);
            
            if (createZone === 'fire') {
                // 파이어볼 전용 이펙트
                console.log('[UnitCombat] 🔥 파이어볼 이펙트 실행!');
                await CombatEffects.fireballEffect(startX, startY, endX, endY);
            } else if (projectileType === 'arrow') {
                // ★ 화살 이펙트 (곡사)
                console.log('[UnitCombat] 🏹 화살 이펙트 실행!');
                await CombatEffects.arrowEffect(startX, startY, endX, endY, { isEnemy });
                CombatEffects.hitEffect(target.sprite);
            } else {
                // 일반 투사체
                await CombatEffects.projectileEffect(startX, startY, endX, endY, projectileColor, projectileSize);
                CombatEffects.hitEffect(target.sprite);
                CombatEffects.impactEffect(endX, endY, projectileColor, 0.8);
            }
        }
        
        // ★★★ 타격 시점! onHit 콜백 (브레이크 시스템 등) ★★★
        if (typeof onHit === 'function') {
            onHit(target);
        }
        
        // 3. 데미지
        if (isEnemy) {
            this.game.dealDamageToTarget(target, damage);
        } else {
            this.game.dealDamage(target, damage);
        }
        
        // 4. 영역 효과
        if (createZone && typeof GridAOE !== 'undefined') {
            GridAOE.createZone(createZone, target.gridX, target.gridZ);
        }
        
        // 5. 복귀 + 스프라이트 방향 복원
        if (scaleTarget && posTarget) {
            gsap.timeline()
                .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.1 })
                .to(posTarget, { x: originalX, duration: 0.1 }, 0)
                .call(() => { if (attacker) attacker.isAnimating = false; });
        } else {
            if (attacker) attacker.isAnimating = false;
        }
    },
    
    // ==========================================
    // 공격 이펙트 재생
    // ==========================================
    playAttackEffect(effectType, x, y, customColor = null) {
        if (typeof CombatEffects === 'undefined') return;
        
        switch (effectType) {
            case 'bash':
                CombatEffects.heavySlash(x, y, -30, customColor || 0xff8800);
                CombatEffects.screenShake(10, 150);
                break;
            case 'cleave':
                CombatEffects.cleaveEffect(x, y, 180);
                CombatEffects.screenShake(8, 120);
                break;
            case 'heavy':
                CombatEffects.heavySlash(x, y, -45, customColor || 0xaaaaaa);
                CombatEffects.screenShake(8, 120);
                break;
            case 'fire':
                CombatEffects.impactEffect(x, y, 0xff4400, 1.2);
                CombatEffects.screenFlash('#ff4400', 80, 0.2);
                break;
            case 'summon':
                CombatEffects.slashEffect(x, y, -30 + Math.random() * 20, customColor || 0x44ff44, 1.0);
                CombatEffects.screenShake(5, 100);
                break;
            case 'enemy':
                CombatEffects.slashEffect(x, y, 30, customColor || 0xff4444, 1.0);
                CombatEffects.screenShake(6, 100);
                break;
            case 'strike':
            default:
                CombatEffects.slashEffect(x, y, -45, customColor || 0xffffff, 1.3);
                CombatEffects.screenShake(6, 100);
                break;
        }
    },
    
    // ==========================================
    // 유닛 라인 이동 (Z축) - 블로킹 유닛 처리 포함
    // ==========================================
    async moveToLine(unit, targetZ, options = {}) {
        console.log(`[UnitCombat] moveToLine: unit=${unit?.type}, from Z=${unit?.gridZ} to Z=${targetZ}`);
        
        // ★ 새 구조: 위치는 posTarget, 스케일은 scaleTarget
        const posTarget = this.getPositionTarget(unit);
        const scaleTarget = this.getScaleTarget(unit);
        
        if (!posTarget) {
            console.warn('[UnitCombat] moveToLine: no posTarget');
            return;
        }
        if (unit.gridZ === targetZ) {
            console.log('[UnitCombat] moveToLine: already at target Z');
            return;
        }
        
        const { checkBlocking = true, team = 'player' } = options;
        
        // 블로킹 유닛 체크
        if (checkBlocking) {
            const unitList = team === 'enemy' 
                ? this.game.state.enemyUnits 
                : this.game.state.playerUnits;
            
            const blockingUnit = unitList.find(u => 
                u !== unit && u.hp > 0 && u.gridX === unit.gridX && u.gridZ === targetZ
            );
            
            if (blockingUnit) {
                await this.moveUnitAside(blockingUnit, targetZ, team);
            }
        }
        
        // 애니메이션 시작 전 다시 체크
        if (!posTarget) return;
        
        unit.isAnimating = true;
        unit.gridZ = targetZ;
        unit.z = targetZ + 0.5;
        
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) {
            unit.isAnimating = false;
            return;
        }
        
        // ★ baseScale 기준으로 스케일 애니메이션
        const baseScale = unit.baseScale || scaleTarget?.baseScale || 1;
        
        return new Promise(resolve => {
            const startY = posTarget.y;
            const midY = Math.min(startY, newPos.y) - 25;
            
            const tl = gsap.timeline()
                .call(() => {
                    // 위치는 posTarget, 스케일은 scaleTarget
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.08 });
                })
                .to(posTarget, { x: newPos.x, y: midY, duration: 0.15, ease: 'power2.out' })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 0.95, y: baseScale * 1.05, duration: 0.08 });
                }, null, '<')
                .to(posTarget, { y: newPos.y, duration: 0.1, ease: 'power2.in' })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.1 });
                }, null, '<')
                .call(() => {
                    if (posTarget && !posTarget.destroyed) {
                        posTarget.zIndex = Math.floor(newPos.y);
                    }
                    unit.isAnimating = false;
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 유닛 옆으로 이동 (블로킹 해제)
    // ==========================================
    async moveUnitAside(unit, avoidZ, team = 'player') {
        // ★ 새 구조: 위치는 posTarget, 스케일은 scaleTarget
        const posTarget = this.getPositionTarget(unit);
        const scaleTarget = this.getScaleTarget(unit);
        
        if (!posTarget) return;
        
        const unitList = team === 'enemy' 
            ? this.game.state.enemyUnits 
            : this.game.state.playerUnits;
        
        // 빈 셀 찾기
        const possibleZ = [];
        for (let z = 0; z < this.game.arena.depth; z++) {
            if (z === avoidZ || z === unit.gridZ) continue;
            const occupied = unitList.some(u => 
                u !== unit && u.hp > 0 && u.gridX === unit.gridX && u.gridZ === z
            );
            if (!occupied) possibleZ.push(z);
        }
        
        if (possibleZ.length === 0) return;
        
        // 가장 가까운 빈 셀
        possibleZ.sort((a, b) => Math.abs(a - unit.gridZ) - Math.abs(b - unit.gridZ));
        const newZ = possibleZ[0];
        
        // 애니메이션 시작 전 다시 체크
        if (!posTarget) return;
        
        unit.isAnimating = true;
        unit.gridZ = newZ;
        unit.z = newZ + 0.5;
        
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) {
            unit.isAnimating = false;
            return;
        }
        
        // ★ baseScale 기준으로 스케일 애니메이션
        const baseScale = unit.baseScale || scaleTarget?.baseScale || 1;
        
        return new Promise(resolve => {
            const startY = posTarget.y;
            const midY = Math.min(startY, newPos.y) - 15;
            
            const tl = gsap.timeline()
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.06 });
                })
                .to(posTarget, { x: newPos.x, y: midY, duration: 0.12, ease: 'power2.out' })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 0.95, y: baseScale * 1.05, duration: 0.06 });
                }, null, '<')
                .to(posTarget, { y: newPos.y, duration: 0.08, ease: 'power2.in' })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.08 });
                }, null, '<')
                .call(() => {
                    if (posTarget && !posTarget.destroyed) {
                        posTarget.zIndex = Math.floor(newPos.y);
                    }
                    unit.isAnimating = false;
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 타겟 찾기 (동일 라인 우선)
    // ==========================================
    findTarget(attacker, possibleTargets) {
        if (!possibleTargets || possibleTargets.length === 0) return null;
        
        const validTargets = possibleTargets.filter(t => t && t.hp > 0);
        if (validTargets.length === 0) return null;
        
        const sameLineTargets = validTargets.filter(t => t.gridZ === attacker.gridZ);
        if (sameLineTargets.length > 0) {
            return this.getClosestTarget(attacker, sameLineTargets);
        }
        
        const adjacentTargets = validTargets.filter(t => 
            Math.abs(t.gridZ - attacker.gridZ) === 1
        );
        if (adjacentTargets.length > 0) {
            return this.getClosestTarget(attacker, adjacentTargets);
        }
        
        return this.getClosestTarget(attacker, validTargets);
    },
    
    getClosestTarget(attacker, targets) {
        if (targets.length === 0) return null;
        const isEnemy = attacker.team === 'enemy';
        
        return targets.reduce((closest, t) => {
            if (!closest) return t;
            return isEnemy 
                ? (t.gridX < closest.gridX ? t : closest)
                : (t.gridX > closest.gridX ? t : closest);
        }, null);
    }
};

console.log('[UnitCombat] 유닛 전투 시스템 로드 완료');
