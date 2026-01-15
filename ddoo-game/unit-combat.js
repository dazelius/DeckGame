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
    // 대시 목표 위치 계산 (스프라이트 겹침 방지)
    // ==========================================
    calculateDashX(attacker, target, isEnemy = false, dashOffset = 0) {
        const targetPos = this.getPositionTarget(target);
        if (!targetPos) return 0;
        
        const targetX = targetPos.x;
        const dashDirection = isEnemy ? -1 : 1;
        
        // 타겟 스프라이트 너비의 절반 + 공격자 스프라이트 너비의 절반 + 여유 간격
        const targetHalfWidth = (target.sprite?.width || 60) / 2;
        const attackerHalfWidth = (attacker.sprite?.width || 60) / 2;
        const baseGap = 15; // 기본 여유 간격
        
        // 기본 거리: 두 스프라이트가 겹치지 않는 위치
        const safeDistance = targetHalfWidth + attackerHalfWidth + baseGap;
        
        // dashOffset: 양수면 더 가까이, 음수면 더 멀리 (JSON에서 설정)
        const finalDistance = safeDistance - dashOffset;
        
        return targetX - (dashDirection * finalDistance);
    },
    
    // ==========================================
    // 통합 근접 공격 애니메이션
    // attacker: 공격자 유닛
    // target: 대상 유닛
    // damage: 데미지
    // options: { effectType, knockback, slashColor, isEnemy, onHit, dashOffset, vfx }
    // ==========================================
    async meleeAttack(attacker, target, damage, options = {}) {
        const {
            effectType = 'strike',
            knockback = 0,
            slashColor = null,
            isEnemy = false,
            onHit = null,
            dashOffset = 0,  // ★ JSON에서 설정 가능 (양수: 더 가까이, 음수: 더 멀리)
            vfx = null       // ★ JSON에서 VFX 설정 { angle, color, scale }
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
        const attackerCenter = startY - (attacker.sprite?.height || 60) / 2;  // ★ 공격자 중심 Y
        
        // 방향 (아군은 오른쪽으로, 적은 왼쪽으로)
        const dashDirection = isEnemy ? -1 : 1;
        
        // ★ 스프라이트 겹침 방지 대시 위치 계산
        const dashX = this.calculateDashX(attacker, target, isEnemy, dashOffset);
        
        // 1. 윈드업 + 돌진 (위치: posTarget, 스케일: scaleTarget) + ★ 산데비스탄!
        // 잔상: 윈드업 시작
        if (typeof SkillSystem !== 'undefined') {
            SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.CYAN);
        }
        
        await new Promise(resolve => {
            // 잔상: 대시 중 산데비스탄 트레일
            let trailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                trailTimer = SkillSystem.startSandevistanTrail(attacker, 6, SkillSystem.GHOST_COLORS.CYAN, 18);
            }
            
            // ★ 속도 늦춤 - 인지하기 쉽게!
            const cfg = typeof AnimConfig !== 'undefined' ? AnimConfig.dash : { windup: 0.18, move: 0.35, ease: 'power2.inOut' };
            const dashDir = dashDirection > 0 ? 0 : Math.PI;
            let lastDustX = posTarget.x;
            const dashStartX = startX - (dashDirection * 15);  // 윈드업 후 위치
            const totalDashDist = Math.abs(dashX - dashStartX);  // 총 이동 거리
            
            gsap.timeline()
                .to(posTarget, { x: dashStartX, duration: cfg.windup })
                .to(scaleTarget.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: cfg.windup }, '<')
                .add(() => {
                    // ★ 대시 시작 시 점프 먼지!
                    if (typeof DustVFX !== 'undefined') {
                        DustVFX.jumpFromUnit(attacker, 1.2);
                    }
                    lastDustX = posTarget.x;
                })
                .to(posTarget, { 
                    x: dashX, 
                    duration: cfg.move, 
                    ease: cfg.ease,
                    onUpdate: function() {
                        // ★ 초반에 많이, 후반에 적게!
                        if (typeof DustVFX !== 'undefined') {
                            const progress = this.progress();  // 0~1
                            const dist = Math.abs(posTarget.x - lastDustX);
                            const threshold = 12 + progress * 30;  // 초반 12px, 후반 42px 간격
                            const intensity = 1.5 - progress * 1.0;  // 초반 1.5, 후반 0.5
                            
                            if (dist > threshold && intensity > 0.2) {
                                DustVFX.run(posTarget.x, posTarget.y, intensity);
                                lastDustX = posTarget.x;
                            }
                        }
                    }
                })
                .to(scaleTarget.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: cfg.move }, '<')
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
        
        // 3. 공격 이펙트 - 공격자 위치(dashX)에서 베기!
        this.playAttackEffect(effectType, dashX, attackerCenter, slashColor, vfx);
        
        // 4. 피격 처리 (데미지 숫자는 dealDamage에서 표시)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitEffect(target);  // ★ target 유닛 전달
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
            
            // ★ 복귀 시작 시 점프 먼지!
            if (typeof DustVFX !== 'undefined') {
                DustVFX.jumpFromUnit(attacker, 0.7);
            }
            
            // 잔상: 복귀 중 산데비스탄 트레일
            let returnTrailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                returnTrailTimer = SkillSystem.startSandevistanTrail(attacker, 5, SkillSystem.GHOST_COLORS.MAGENTA, 25);
            }
            
            let lastReturnDustX = posTarget.x;
            
            gsap.timeline()
                .to(posTarget, {
                    x: startX,
                    y: startY,
                    duration: 0.35,  // ★ 0.25 → 0.35 속도 늦춤!
                    ease: 'power2.out',
                    onUpdate: () => {
                        // ★ 복귀 중 트레일 먼지!
                        if (typeof DustVFX !== 'undefined') {
                            const dist = Math.abs(posTarget.x - lastReturnDustX);
                            if (dist > 30) {
                                DustVFX.run(posTarget.x, posTarget.y, 0.5);
                                lastReturnDustX = posTarget.x;
                            }
                        }
                    }
                })
                .to(scaleTarget.scale, {
                    x: baseScale,
                    y: baseScale,
                    duration: 0.2,  // ★ 0.15 → 0.2
                    ease: 'power2.out'
                }, '<')
                .call(() => {
                    if (returnTrailTimer && typeof SkillSystem !== 'undefined') {
                        SkillSystem.stopSandevistanTrail(returnTrailTimer);
                    }
                    // ★ 착지 먼지!
                    if (typeof DustVFX !== 'undefined') {
                        DustVFX.landFromUnit(attacker, 0.8);
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
        const { knockback = 0, isEnemy = false, onHit = null, dashOffset = 0, vfx = null } = options;
        
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
        const attackerCenter = startY - (attacker.sprite?.height || 60) / 2;  // ★ 공격자 중심 Y
        
        const dashDirection = isEnemy ? -1 : 1;
        // ★ 스프라이트 겹침 방지 (bash는 기본 오프셋 +10으로 더 가까이)
        const bashX = this.calculateDashX(attacker, target, isEnemy, dashOffset + 10);
        
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
            
            // ★ 속도 늦춤 - 묵직한 강타 느낌!
            const bashCfg = typeof AnimConfig !== 'undefined' ? AnimConfig.attack.bash : { windup: 0.25, move: 0.35, impact: 0.18, ease: 'power2.inOut', impactEase: 'power3.in' };
            let lastDustX = posTarget.x;
            
            gsap.timeline()
                .to(posTarget, { x: startX - (dashDirection * 25), duration: bashCfg.windup })
                .to(scaleTarget.scale, { x: baseScale * 0.85, y: baseScale * 1.2, duration: bashCfg.windup }, '<')
                .add(() => {
                    // ★ 대시 시작 시 점프 먼지! (강타는 더 강하게)
                    if (typeof DustVFX !== 'undefined') {
                        DustVFX.jumpFromUnit(attacker, 1.5);
                    }
                    lastDustX = posTarget.x;
                })
                .to(posTarget, { 
                    x: bashX, 
                    y: startY - 30,
                    duration: bashCfg.move, 
                    ease: bashCfg.ease,
                    onUpdate: function() {
                        // ★ 초반에 많이, 후반에 적게! (bash는 더 강하게)
                        if (typeof DustVFX !== 'undefined') {
                            const progress = this.progress();
                            const dist = Math.abs(posTarget.x - lastDustX);
                            const threshold = 10 + progress * 25;
                            const intensity = 1.8 - progress * 1.2;
                            
                            if (dist > threshold && intensity > 0.3) {
                                DustVFX.run(posTarget.x, posTarget.y, intensity);
                                lastDustX = posTarget.x;
                            }
                        }
                    }
                })
                .to(scaleTarget.scale, { x: baseScale * 1.3, y: baseScale * 0.75, duration: bashCfg.move }, '<')
                .to(posTarget, { 
                    y: startY + 5,
                    duration: bashCfg.impact, 
                    ease: bashCfg.impactEase 
                })
                .to(scaleTarget.scale, { x: baseScale * 1.4, y: baseScale * 0.65, duration: bashCfg.impact }, '<')
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
        
        // 3. 강력한 이펙트 - 공격자 위치(bashX)에서 베기!
        if (typeof CombatEffects !== 'undefined') {
            if (vfx) {
                const angle = vfx.angle ?? -30;
                const color = vfx.color ? parseInt(vfx.color, 16) : 0xff8800;
                const scale = vfx.scale ?? 1.8;
                CombatEffects.slashEffect(bashX, attackerCenter, angle, color, scale);
            } else {
                CombatEffects.heavySlash(bashX, attackerCenter, -30, 0xff8800);
            }
            CombatEffects.screenShake(15, 200);
            CombatEffects.screenFlash('#ff6600', 100, 0.3);
            CombatEffects.burstParticles(targetX, targetCenter, 0xff8800, 12);  // 파티클은 타겟에
        }
        
        // 4. 피격 (데미지 숫자는 dealDamage에서 표시)
        if (typeof CombatEffects !== 'undefined' && target.sprite) {
            CombatEffects.hitEffect(target);  // ★ target 유닛 전달
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
            
            // ★ 복귀 시작 시 점프 먼지!
            if (typeof DustVFX !== 'undefined') {
                DustVFX.jumpFromUnit(attacker, 0.8);
            }
            
            // 잔상: 복귀 중 산데비스탄 트레일
            let returnTrailTimer = null;
            if (typeof SkillSystem !== 'undefined') {
                returnTrailTimer = SkillSystem.startSandevistanTrail(attacker, 6, SkillSystem.GHOST_COLORS.MAGENTA, 30);
            }
            
            let lastReturnDustX = posTarget.x;
            
            gsap.timeline()
                .to({}, { duration: 0.2 })  // ★ 착지 후 잠시 멈춤
                .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.25, ease: 'power2.out' })
                .to(posTarget, {
                    x: startX,
                    y: startY,
                    duration: 0.45,  // ★ 0.35 → 0.45 느긋하게 복귀
                    ease: 'power2.out',
                    onUpdate: () => {
                        // ★ 복귀 중 트레일 먼지!
                        if (typeof DustVFX !== 'undefined') {
                            const dist = Math.abs(posTarget.x - lastReturnDustX);
                            if (dist > 25) {
                                DustVFX.run(posTarget.x, posTarget.y, 0.6);
                                lastReturnDustX = posTarget.x;
                            }
                        }
                    },
                    onComplete: () => {
                        if (returnTrailTimer && typeof SkillSystem !== 'undefined') {
                            SkillSystem.stopSandevistanTrail(returnTrailTimer);
                        }
                        // ★ 착지 먼지! (bash는 더 강하게)
                        if (typeof DustVFX !== 'undefined') {
                            DustVFX.landFromUnit(attacker, 1.2);
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
        const { hits = 3, knockbackPerHit = 1, isEnemy = false, onHit = null, dashOffset = 0 } = options;
        
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
        
        // ★ 공격자→타겟 방향으로 밀어냄 (위치 기반)
        // 공격자가 왼쪽에 있으면 오른쪽(+1)으로, 오른쪽에 있으면 왼쪽(-1)으로
        const pushDirection = Math.sign(target.gridX - attacker.gridX) || (isEnemy ? -1 : 1);
        const dashDirection = pushDirection; // 대쉬 방향 = 밀어내는 방향
        
        // ====================================
        // 1. 초기 돌진 (한 번만!) - 강력한 연출!
        // ====================================
        const initialTargetPos = this.getPositionTarget(target);
        if (!initialTargetPos) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        // ★ 스프라이트 겹침 방지 + rush 기본 오프셋(15)
        const initialDashX = this.calculateDashX(attacker, target, isEnemy, dashOffset + 15);
        
        // ★ 소닉 스타일 돌진 준비 - 에너지 오라!
        let rushAura = null;
        if (typeof RushVFX !== 'undefined') {
            // 에너지 충전 이펙트
            await RushVFX.playChargeEffect(attacker, 0xff8800);
            
            // 에너지 오라 생성 (몸을 감쌈)
            rushAura = RushVFX.createFallbackAura(attacker, 0xff8800);
            
            // 스피드라인
            RushVFX.createSpeedLines(posTarget.x, posTarget.y, dashDirection, 0xff8800);
        } else {
            // 폴백: 기존 이펙트
            if (typeof SkillSystem !== 'undefined') {
                SkillSystem.createGhost(attacker, 0.7, SkillSystem.GHOST_COLORS.RED);
            }
            this.createRushSpeedLines(posTarget.x, posTarget.y, dashDirection);
        }
        
        // 윈드업 (더 극적으로) - ★ 속도 늦춤!
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(posTarget, { x: startX - (dashDirection * 40), duration: 0.18, ease: 'power2.in' })
                .to(scaleTarget.scale, { x: baseScale * 0.7, y: baseScale * 1.4, duration: 0.18 }, '<');
        });
        
        // ★ 강력한 대쉬 트레일
        let trailTimer = null;
        if (typeof SkillSystem !== 'undefined') {
            trailTimer = SkillSystem.startSandevistanTrail(attacker, 12, SkillSystem.GHOST_COLORS.RED, 8);
        }
        
        // ★ 대시 시작 점프 먼지 (rush는 매우 강하게!)
        if (typeof DustVFX !== 'undefined') {
            DustVFX.jumpFromUnit(attacker, 2.0);
        }
        
        // ★ 돌진! (더 빠르고 강하게)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff8800', 40, 0.2);
        }
        
        let lastDustX = posTarget.x;
        let lastTrailX = posTarget.x;
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(posTarget, { 
                    x: initialDashX, 
                    y: startY,  // ★ 바닥에 붙어있도록!
                    duration: 0.15,  // ★ 0.08 → 0.15 속도 늦춤!
                    ease: 'power4.out',
                    onUpdate: function() {
                        const progress = this.progress();
                        
                        // ★ 먼지 이펙트
                        if (typeof DustVFX !== 'undefined') {
                            const dist = Math.abs(posTarget.x - lastDustX);
                            const threshold = 8 + progress * 20;
                            const intensity = 2.0 - progress * 1.2;
                            
                            if (dist > threshold && intensity > 0.4) {
                                DustVFX.run(posTarget.x, posTarget.y, intensity);
                                lastDustX = posTarget.x;
                            }
                        }
                        
                        // ★ 대시 트레일 (간소화)
                        if (typeof RushVFX !== 'undefined') {
                            const trailDist = Math.abs(posTarget.x - lastTrailX);
                            if (trailDist > 40) {  // 40px마다 트레일 (더 sparse하게)
                                RushVFX.createDashTrail(
                                    posTarget.x, 
                                    posTarget.y - 30,
                                    dashDirection, 
                                    0xff8800, 
                                    15  // 작은 사이즈
                                );
                                lastTrailX = posTarget.x;
                            }
                        }
                    }
                })
                .to(scaleTarget.scale, { x: baseScale * 1.4, y: baseScale * 0.7, duration: 0.12 }, '<');  // ★ 0.06 → 0.12
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
            
            // ★ VFXAnchor로 타겟 중심 가져오기
            let targetX, targetCenter;
            if (typeof VFXAnchor !== 'undefined') {
                const anchorPos = VFXAnchor.getChest(target);
                // CombatEffects.container 로컬 좌표로 변환
                if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
                    const localPos = CombatEffects.container.toLocal({ x: anchorPos.x, y: anchorPos.y });
                    targetX = localPos.x;
                    targetCenter = localPos.y;
                } else {
                    targetX = anchorPos.x;
                    targetCenter = anchorPos.y;
                }
            } else {
                targetX = currentTargetPos.x;
                targetCenter = currentTargetPos.y - (target.sprite?.height || 60) / 2;
            }
            
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
                this.createPushImpactLines(targetX, targetCenter, dashDirection);
                
                if (hitNum === hits - 1) {
                    // ★ 마지막 타격 - 폭발적! (소닉 임팩트)
                    if (typeof RushVFX !== 'undefined') {
                        RushVFX.playImpactEffect(targetX, targetCenter, 0xff8800);
                    }
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
                    CombatEffects.hitEffect(target);
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
        // ★ 소닉 오라 제거
        if (rushAura && typeof RushVFX !== 'undefined') {
            RushVFX.removeAura(rushAura);
        }
        
        if (posTarget && !posTarget.destroyed && scaleTarget && !scaleTarget.destroyed) {
            // 복귀 잔상
            if (typeof SkillSystem !== 'undefined') {
                SkillSystem.createGhost(attacker, 0.5, SkillSystem.GHOST_COLORS.MAGENTA);
            }
            
            // ★ 복귀 시작 먼지
            if (typeof DustVFX !== 'undefined') {
                DustVFX.dashFromUnit(attacker, dashDirection > 0 ? Math.PI : 0, 1.0);
            }
            
            await new Promise(resolve => {
                gsap.timeline({ onComplete: resolve })
                    .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.18, ease: 'elastic.out(1, 0.5)' })  // ★ 0.12 → 0.18
                    .to(posTarget, { x: startX, y: startY, duration: 0.3, ease: 'power2.out' }, '<');  // ★ 0.2 → 0.3
            });
            
            // ★ 착지 먼지! (rush는 매우 강하게)
            if (typeof DustVFX !== 'undefined') {
                DustVFX.landingFromUnit(attacker, 1.5);
            }
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
    // ★ 비열한 습격 (Sneak Attack) - 뒤치기 + 출혈!
    // ==========================================
    async sneakAttack(attacker, target, damage, options = {}) {
        const { bleed = 2, isEnemy = false, onHit = null, dashOffset = 0 } = options;
        
        console.log(`[SneakAttack] 비열한 습격! damage=${damage}, bleed=${bleed}`);
        
        if (!target || target.hp <= 0 || !target.sprite) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        attacker.isAnimating = true;
        
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const targetPosTarget = this.getPositionTarget(target);
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        
        if (!posTarget || !scaleTarget || !targetPosTarget) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = targetPosTarget.x;
        const targetY = targetPosTarget.y;
        const targetCenter = targetY - (target.sprite?.height || 60) / 2;
        const dashDirection = isEnemy ? -1 : 1;
        
        // ====================================
        // 1. 그림자처럼 사라짐 (페이드아웃)
        // ====================================
        if (typeof SkillSystem !== 'undefined') {
            SkillSystem.createGhost(attacker, 0.8, 0x440044);
        }
        
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(scaleTarget, { alpha: 0.3, duration: 0.1 })
                .to(posTarget, { y: startY - 20, duration: 0.1 }, '<');
        });
        
        // ====================================
        // 2. 적 뒤로 순간이동! (암살자 느낌)
        // ====================================
        // 적 뒤쪽으로 (스프라이트 너비 고려 + dashOffset)
        const targetHalfWidth = (target.sprite?.width || 60) / 2;
        const behindDistance = targetHalfWidth + 20 + dashOffset; // dashOffset: 양수면 더 가까이
        const behindX = targetX + (dashDirection * behindDistance);
        
        // 잠시 사라짐
        if (scaleTarget && !scaleTarget.destroyed) {
            scaleTarget.alpha = 0;
        }
        
        // 그림자 파티클
        this.createShadowParticles(startX, startY);
        
        await new Promise(r => setTimeout(r, 80));
        
        // 뒤에서 등장!
        if (posTarget && !posTarget.destroyed) {
            posTarget.x = behindX;
            posTarget.y = targetY;
        }
        
        // 등장 그림자 파티클
        this.createShadowParticles(behindX, targetY);
        
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(scaleTarget, { alpha: 1, duration: 0.08 })
                .to(scaleTarget.scale, { x: baseScale * 1.2, y: baseScale * 0.85, duration: 0.06 }, '<');
        });
        
        // ====================================
        // 3. 뒤치기! (빠른 찌르기)
        // ====================================
        // 히트스톱
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.hitStop(30);
        }
        
        // 찌르기 동작
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(posTarget, { x: targetX + (dashDirection * 10), duration: 0.05, ease: 'power3.out' })
                .to(scaleTarget.scale, { x: baseScale * 1.4, y: baseScale * 0.7, duration: 0.04 }, '<');
        });
        
        // ★ VFX: 피 튀김 + 찌르기 이펙트
        if (typeof CombatEffects !== 'undefined') {
            // 어둠의 찌르기
            this.createSneakSlash(targetX, targetCenter, dashDirection);
            
            // 피 튀김
            CombatEffects.burstParticles(targetX, targetCenter, 0xcc0000, 12);
            
            // 화면 효과
            CombatEffects.screenShake(10, 120);
            CombatEffects.screenFlash('#880044', 60, 0.25);
        }
        
        // 피격
        if (target.sprite && !target.sprite.destroyed) {
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.hitEffect(target);
            }
        }
        
        // 대미지
        if (isEnemy) {
            this.game.dealDamageToTarget(target, damage);
        } else {
            this.game.dealDamage(target, damage);
        }
        
        // ★ 출혈 부여!
        if (bleed > 0 && target.hp > 0 && typeof BleedSystem !== 'undefined') {
            BleedSystem.applyBleed(target, bleed);
        }
        
        if (onHit) onHit();
        
        // ====================================
        // 4. 그림자처럼 복귀
        // ====================================
        // 다시 사라짐
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(scaleTarget, { alpha: 0.3, duration: 0.08 })
                .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.08 }, '<');
        });
        
        this.createShadowParticles(posTarget.x, posTarget.y);
        
        await new Promise(r => setTimeout(r, 60));
        
        // 원위치 등장
        if (posTarget && !posTarget.destroyed) {
            posTarget.x = startX;
            posTarget.y = startY;
        }
        
        this.createShadowParticles(startX, startY);
        
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(scaleTarget, { alpha: 1, duration: 0.1 })
                .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.1, ease: 'back.out(1.5)' }, '<');
        });
        
        console.log('[SneakAttack] 비열한 습격 완료!');
        if (attacker) attacker.isAnimating = false;
    },
    
    // ★ 그림자 파티클 생성
    createShadowParticles(x, y) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        for (let i = 0; i < 10; i++) {
            const particle = new PIXI.Graphics();
            const size = 5 + Math.random() * 10;
            particle.circle(0, 0, size);
            particle.fill({ color: 0x220022, alpha: 0.8 });
            
            particle.x = x + (Math.random() - 0.5) * 40;
            particle.y = y + (Math.random() - 0.5) * 60;
            particle.zIndex = 150;
            CombatEffects.container.addChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            
            gsap.to(particle, {
                x: particle.x + Math.cos(angle) * speed,
                y: particle.y + Math.sin(angle) * speed - 20,
                alpha: 0,
                duration: 0.4 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => { if (!particle.destroyed) particle.destroy(); }
            });
            
            gsap.to(particle.scale, {
                x: 0.3,
                y: 0.3,
                duration: 0.4,
                ease: 'power2.in'
            });
        }
    },
    
    // ==========================================
    // ★ 번개 공격 (Lightning) - 연쇄 번개!
    // ==========================================
    async lightningAttack(attacker, target, damage, options = {}) {
        const { chainReduction = 2, chainDelay = 350, isEnemy = false, onHit = null } = options;
        
        console.log(`[Lightning] 번개! damage=${damage}, chainReduction=${chainReduction}`);
        
        if (!target || target.hp <= 0 || !target.sprite) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        attacker.isAnimating = true;
        
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        
        if (!posTarget || !scaleTarget) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        
        // ====================================
        // 1. 시전 동작 (손 들어올리기)
        // ====================================
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(scaleTarget.scale, { x: baseScale * 0.9, y: baseScale * 1.15, duration: 0.15 })
                .to(posTarget, { y: startY - 10, duration: 0.15 }, '<');
        });
        
        // ★ 시전 이펙트 (전기 수렴!)
        this.createLightningCharge(startX, startY - 30);
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#4488ff', 50, 0.2);
        }
        
        await new Promise(r => setTimeout(r, 200));
        
        // ====================================
        // 2. 연쇄 번개 처리
        // ====================================
        const hitTargets = new Set();
        const chainQueue = [{ unit: target, damage: damage }];
        
        while (chainQueue.length > 0) {
            const current = chainQueue.shift();
            
            if (!current.unit || current.unit.hp <= 0 || hitTargets.has(current.unit)) {
                continue;
            }
            
            if (current.damage <= 0) {
                continue;
            }
            
            hitTargets.add(current.unit);
            
            // 이전 타겟에서 현재 타겟으로 번개 발사
            const prevTarget = hitTargets.size > 1 ? 
                Array.from(hitTargets)[hitTargets.size - 2] : attacker;
            
            await this.fireLightningBolt(prevTarget, current.unit, current.damage, hitTargets.size === 1);
            
            // 대미지 적용
            if (isEnemy) {
                this.game.dealDamageToTarget(current.unit, current.damage);
            } else {
                this.game.dealDamage(current.unit, current.damage);
            }
            
            // 다음 연쇄 대상 찾기 (8방향 1칸)
            const nextDamage = current.damage - chainReduction;
            if (nextDamage > 0) {
                const neighbors = this.findAdjacentEnemies(current.unit, hitTargets);
                for (const neighbor of neighbors) {
                    chainQueue.push({ unit: neighbor, damage: nextDamage });
                }
            }
            
            // 연쇄 간 딜레이 (JSON에서 로드)
            if (chainQueue.length > 0) {
                await new Promise(r => setTimeout(r, chainDelay));
            }
        }
        
        if (onHit) onHit();
        
        // ====================================
        // 3. 복귀
        // ====================================
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.15, ease: 'back.out(1.5)' })
                .to(posTarget, { y: startY, duration: 0.15 }, '<');
        });
        
        console.log(`[Lightning] 연쇄 완료! 총 ${hitTargets.size}명 피격`);
        if (attacker) attacker.isAnimating = false;
    },
    
    // ★ 인접 적 찾기 (8방향 1칸)
    findAdjacentEnemies(unit, excludeSet) {
        if (!this.game) return [];
        
        const enemies = this.game.state.enemyUnits || [];
        const adjacent = [];
        
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],          [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (const enemy of enemies) {
            if (enemy.hp <= 0 || excludeSet.has(enemy)) continue;
            
            const dx = enemy.gridX - unit.gridX;
            const dz = enemy.gridZ - unit.gridZ;
            
            // 8방향 1칸 이내인지 확인
            for (const [checkX, checkZ] of directions) {
                if (dx === checkX && dz === checkZ) {
                    adjacent.push(enemy);
                    break;
                }
            }
        }
        
        return adjacent;
    },
    
    // ★★★ 번개 발사 VFX (초강화!)
    async fireLightningBolt(from, to, damage, isFirst = false) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const fromPos = this.getPositionTarget(from);
        const toPos = this.getPositionTarget(to);
        
        if (!fromPos || !toPos) return;
        
        const startX = fromPos.x;
        const startY = fromPos.y - (from.sprite?.height || 60) / 2;
        const endX = toPos.x;
        const endY = toPos.y - (to.sprite?.height || 60) / 2;
        
        // 첫 번째 번개는 위에서 내려옴 (더 높이!)
        const actualStartX = isFirst ? endX + (Math.random() - 0.5) * 50 : startX;
        const actualStartY = isFirst ? -200 : startY;
        
        // ★★ 첫 플래시 (강렬하게!)
        CombatEffects.screenFlash('#ffffff', 50, 0.8);
        
        // ★★ 번개 5번 깜빡임 (더 많이, 더 빠르게!)
        for (let flash = 0; flash < 5; flash++) {
            // 매번 다른 경로로 번개 생성
            this.createLightningBolt(
                actualStartX + (Math.random() - 0.5) * 20, 
                actualStartY, 
                endX + (Math.random() - 0.5) * 15, 
                endY, 
                damage, 
                flash === 0
            );
            
            // 각 번개마다 작은 플래시
            if (flash < 3) {
                CombatEffects.screenFlash('#ffffff', 20, 0.4);
            }
            
            await new Promise(r => setTimeout(r, 25));
        }
        
        // ★★ 착탄 임팩트!
        this.createLightningImpact(endX, endY, damage);
        
        // ★★ 강렬한 화면 효과
        CombatEffects.screenShake(15 + damage * 1.5, 200);
        CombatEffects.screenFlash('#88ccff', 100, 0.5);
        
        // 피격 효과
        if (to.sprite && !to.sprite.destroyed) {
            CombatEffects.hitEffect(to.sprite);
            
            // 더 강한 전기 깜빡임 (8번)
            const originalTint = to.sprite.tint || 0xffffff;
            let flickerCount = 0;
            const flickerInterval = setInterval(() => {
                if (!to.sprite || to.sprite.destroyed || flickerCount >= 10) {
                    clearInterval(flickerInterval);
                    if (to.sprite && !to.sprite.destroyed) to.sprite.tint = originalTint;
                    return;
                }
                // 다양한 색상으로 깜빡임
                const colors = [0x88ccff, 0xffffff, 0x4488ff, 0xaaddff];
                to.sprite.tint = colors[flickerCount % colors.length];
                flickerCount++;
            }, 35);
        }
        
        // 히트스톱 (더 길게)
        await CombatEffects.hitStop(50);
    },
    
    // ★★★ 강화된 번개 착탄 임팩트
    createLightningImpact(x, y, damage) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.zIndex = 350;
        CombatEffects.container.addChild(container);
        
        // ★ 외곽 글로우 (보라색)
        const outerGlow = new PIXI.Graphics();
        outerGlow.circle(0, 0, 100);
        outerGlow.fill({ color: 0x4422aa, alpha: 0.3 });
        container.addChild(outerGlow);
        gsap.to(outerGlow.scale, { x: 2, y: 2, duration: 0.2, ease: 'power2.out' });
        gsap.to(outerGlow, { alpha: 0, duration: 0.2 });
        
        // ★ 중앙 플래시 (더 크게)
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 80);
        flash.fill({ color: 0xffffff, alpha: 1 });
        container.addChild(flash);
        
        gsap.to(flash, {
            alpha: 0,
            duration: 0.18,
            onUpdate: function() { if (flash.destroyed) this.kill(); },
            onComplete: () => { if (!flash.destroyed) flash.destroy(); }
        });
        gsap.to(flash.scale, { 
            x: 3, y: 3, duration: 0.18, ease: 'power2.out',
            onUpdate: function() { if (flash.destroyed) this.kill(); }
        });
        
        // ★ 충격파 링 (4겹)
        const colors = [0xffffff, 0x88ccff, 0x4488ff, 0x2244aa];
        for (let r = 0; r < 4; r++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 25 + r * 12);
            ring.stroke({ width: 5 - r, color: colors[r], alpha: 0.9 - r * 0.15 });
            container.addChild(ring);
            
            gsap.to(ring.scale, {
                x: 4 - r * 0.4, y: 4 - r * 0.4,
                duration: 0.3 + r * 0.05, delay: r * 0.02, ease: 'power2.out',
                onUpdate: function() { if (ring.destroyed) this.kill(); }
            });
            gsap.to(ring, {
                alpha: 0, duration: 0.3 + r * 0.05, delay: r * 0.02,
                onUpdate: function() { if (ring.destroyed) this.kill(); },
                onComplete: () => { if (!ring.destroyed) ring.destroy(); }
            });
        }
        
        // ★ 지그재그 전기 스파크 (더 많이!)
        for (let i = 0; i < 25 + damage; i++) {
            const spark = new PIXI.Graphics();
            const len = 15 + Math.random() * 30;
            const angle = Math.random() * Math.PI * 2;
            
            spark.moveTo(0, 0);
            const midX = Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 10;
            const midY = Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 10;
            spark.lineTo(midX, midY);
            spark.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            spark.stroke({ width: 2 + Math.random() * 3, color: 0xffffff, alpha: 1 });
            
            spark.x = (Math.random() - 0.5) * 40;
            spark.y = (Math.random() - 0.5) * 40;
            container.addChild(spark);
            
            const speed = 100 + Math.random() * 150;
            gsap.to(spark, {
                x: spark.x + Math.cos(angle) * speed,
                y: spark.y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.2,
                ease: 'power2.out',
                onUpdate: function() { if (spark.destroyed) this.kill(); },
                onComplete: () => { if (!spark.destroyed) spark.destroy(); }
            });
        }
        
        // ★ 전기 볼 파티클 (더 많이)
        for (let i = 0; i < 12; i++) {
            const ball = new PIXI.Graphics();
            ball.circle(0, 0, 4 + Math.random() * 7);
            ball.fill({ color: colors[i % 3], alpha: 1 });
            container.addChild(ball);
            
            const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const speed = 80 + Math.random() * 100;
            
            gsap.to(ball, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
                alpha: 0,
                duration: 0.35,
                ease: 'power2.out',
                onUpdate: function() { if (ball.destroyed) this.kill(); },
                onComplete: () => { if (!ball.destroyed) ball.destroy(); }
            });
        }
        
        // 컨테이너 정리
        setTimeout(() => {
            if (!container.destroyed) container.destroy({ children: true });
        }, 600);
    },
    
    // ★★★ 번개 볼트 그래픽 (초강화!)
    createLightningBolt(x1, y1, x2, y2, damage, isMain = true) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const container = new PIXI.Container();
        container.zIndex = 300;
        CombatEffects.container.addChild(container);
        
        // 번개 경로 생성 (더 많은 세그먼트, 더 큰 지그재그)
        const points = this.generateLightningPath(x1, y1, x2, y2, isMain ? 14 : 8);
        
        // ★ 5겹 레이어 시스템
        if (isMain) {
            // 1. 최외곽 글로우 (보라색)
            const outerMost = new PIXI.Graphics();
            outerMost.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) outerMost.lineTo(points[i].x, points[i].y);
            outerMost.stroke({ width: 50 + damage * 1.5, color: 0x2244aa, alpha: 0.15 });
            container.addChild(outerMost);
            
            // 2. 외부 글로우 (진파랑)
            const outerGlow = new PIXI.Graphics();
            outerGlow.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) outerGlow.lineTo(points[i].x, points[i].y);
            outerGlow.stroke({ width: 35 + damage, color: 0x4488ff, alpha: 0.25 });
            container.addChild(outerGlow);
        }
        
        // 3. 글로우 레이어
        const glow = new PIXI.Graphics();
        glow.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) glow.lineTo(points[i].x, points[i].y);
        glow.stroke({ width: isMain ? 20 + damage / 2 : 12, color: 0x4488ff, alpha: 0.5 });
        container.addChild(glow);
        
        // 4. 메인 번개
        const main = new PIXI.Graphics();
        main.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) main.lineTo(points[i].x, points[i].y);
        main.stroke({ width: isMain ? 10 + damage / 3 : 6, color: 0x88ccff, alpha: 0.95 });
        container.addChild(main);
        
        // 5. 코어 (가장 밝은)
        const core = new PIXI.Graphics();
        core.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) core.lineTo(points[i].x, points[i].y);
        core.stroke({ width: isMain ? 4 : 2, color: 0xffffff, alpha: 1 });
        container.addChild(core);
        
        // ★★ 강화된 분기 번개 시스템
        if (isMain) {
            for (let i = 1; i < points.length - 1; i++) {
                // 80% 확률로 분기 (기존 70%)
                if (Math.random() > 0.2) {
                    this.createLightningBranch(container, points[i].x, points[i].y, damage, true);
                }
            }
            
            // 추가 작은 분기들
            for (let i = 2; i < points.length - 2; i += 2) {
                if (Math.random() > 0.4) {
                    this.createLightningBranch(container, points[i].x, points[i].y, damage, false);
                }
            }
        }
        
        // 경로상 스파크 파티클
        if (isMain) {
            for (let i = 0; i < points.length; i += 2) {
                const spark = new PIXI.Graphics();
                spark.circle(points[i].x, points[i].y, 3 + Math.random() * 4);
                spark.fill({ color: 0xffffff, alpha: 0.9 });
                container.addChild(spark);
            }
        }
        
        // 빠른 페이드아웃 (깜빡임 효과)
        gsap.to(container, {
            alpha: 0,
            duration: 0.1,
            delay: 0.03,
            onUpdate: function() { if (container.destroyed) this.kill(); },
            onComplete: () => {
                if (!container.destroyed) container.destroy({ children: true });
            }
        });
    },
    
    // ★ 시전시 전기 수렴 효과
    createLightningCharge(x, y) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.zIndex = 280;
        CombatEffects.container.addChild(container);
        
        // 전기 파티클이 모여드는 효과
        for (let i = 0; i < 20; i++) {
            const spark = new PIXI.Graphics();
            const size = 3 + Math.random() * 5;
            
            // 멀리서 시작
            const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
            const dist = 80 + Math.random() * 60;
            spark.x = Math.cos(angle) * dist;
            spark.y = Math.sin(angle) * dist;
            
            // 선 형태로 그리기
            spark.moveTo(-size, 0);
            spark.lineTo(size, 0);
            spark.stroke({ width: 2, color: i % 2 === 0 ? 0x88ccff : 0xffffff, alpha: 0.9 });
            
            container.addChild(spark);
            
            // 중앙으로 수렴!
            gsap.to(spark, {
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
                alpha: 0,
                duration: 0.15 + Math.random() * 0.1,
                delay: i * 0.01,
                ease: 'power3.in',
                onUpdate: function() { if (spark.destroyed) this.kill(); },
                onComplete: () => { if (!spark.destroyed) spark.destroy(); }
            });
            
            gsap.to(spark, {
                rotation: Math.random() * Math.PI * 4,
                duration: 0.2,
                onUpdate: function() { if (spark.destroyed) this.kill(); }
            });
        }
        
        // 중앙 전기 구체
        const core = new PIXI.Graphics();
        core.circle(0, 0, 5);
        core.fill({ color: 0xffffff, alpha: 0 });
        container.addChild(core);
        
        gsap.to(core, {
            alpha: 1,
            duration: 0.15,
            delay: 0.1,
            onUpdate: function() { if (core.destroyed) this.kill(); }
        });
        gsap.to(core.scale, {
            x: 3,
            y: 3,
            duration: 0.1,
            delay: 0.15,
            onUpdate: function() { if (core.destroyed) this.kill(); },
            onComplete: () => {
                if (core.destroyed) return;
                gsap.to(core, {
                    alpha: 0,
                    duration: 0.05,
                    onUpdate: function() { if (core.destroyed) this.kill(); },
                    onComplete: () => {
                        if (!core.destroyed) core.destroy();
                    }
                });
            }
        });
        
        // 컨테이너 정리
        setTimeout(() => {
            if (!container.destroyed) container.destroy({ children: true });
        }, 400);
    },
    
    // ★★★ 초강화 번개 분기
    createLightningBranch(parent, x, y, damage, isLarge = true) {
        const segments = isLarge ? (5 + Math.floor(Math.random() * 4)) : (3 + Math.floor(Math.random() * 2));
        const angle = Math.random() * Math.PI * 2;
        const length = isLarge ? (50 + Math.random() * 70) : (25 + Math.random() * 35);
        
        let curX = x;
        let curY = y;
        
        // 분기 경로 생성 (더 날카로운 지그재그)
        const branchPoints = [{ x: curX, y: curY }];
        for (let i = 0; i < segments; i++) {
            const segLen = length / segments;
            // 더 날카로운 꺾임
            const offsetAngle = angle + (Math.random() - 0.5) * 1.4;
            curX += Math.cos(offsetAngle) * segLen;
            curY += Math.sin(offsetAngle) * segLen;
            branchPoints.push({ x: curX, y: curY });
        }
        
        // 4겹 레이어 (더 굵고 밝게!)
        if (isLarge) {
            // 외곽 글로우
            const outerGlow = new PIXI.Graphics();
            outerGlow.moveTo(branchPoints[0].x, branchPoints[0].y);
            for (let i = 1; i < branchPoints.length; i++) outerGlow.lineTo(branchPoints[i].x, branchPoints[i].y);
            outerGlow.stroke({ width: 16, color: 0x2244aa, alpha: 0.3 });
            parent.addChild(outerGlow);
        }
        
        // 글로우
        const glow = new PIXI.Graphics();
        glow.moveTo(branchPoints[0].x, branchPoints[0].y);
        for (let i = 1; i < branchPoints.length; i++) glow.lineTo(branchPoints[i].x, branchPoints[i].y);
        glow.stroke({ width: isLarge ? 10 : 6, color: 0x4488ff, alpha: 0.5 });
        parent.addChild(glow);
        
        // 메인 분기
        const branch = new PIXI.Graphics();
        branch.moveTo(branchPoints[0].x, branchPoints[0].y);
        for (let i = 1; i < branchPoints.length; i++) branch.lineTo(branchPoints[i].x, branchPoints[i].y);
        branch.stroke({ width: isLarge ? 6 : 3, color: 0x88ccff, alpha: 0.9 });
        parent.addChild(branch);
        
        // 코어 (밝은 흰색)
        const core = new PIXI.Graphics();
        core.moveTo(branchPoints[0].x, branchPoints[0].y);
        for (let i = 1; i < branchPoints.length; i++) core.lineTo(branchPoints[i].x, branchPoints[i].y);
        core.stroke({ width: isLarge ? 3 : 1.5, color: 0xffffff, alpha: 1 });
        parent.addChild(core);
        
        // 분기 끝 스파크 (더 크게!)
        const spark = new PIXI.Graphics();
        spark.circle(curX, curY, isLarge ? (5 + Math.random() * 6) : (3 + Math.random() * 3));
        spark.fill({ color: 0xffffff, alpha: 1 });
        parent.addChild(spark);
        
        // 2차 분기 (60% 확률로 증가)
        if (isLarge && Math.random() > 0.4) {
            const subIdx = Math.floor(branchPoints.length * (0.4 + Math.random() * 0.3));
            const subPoint = branchPoints[subIdx];
            this.createLightningBranch(parent, subPoint.x, subPoint.y, damage, false);
        }
        
        // 3차 분기 (큰 분기에서 30% 확률)
        if (isLarge && Math.random() > 0.7) {
            const subIdx = Math.floor(branchPoints.length * 0.7);
            const subPoint = branchPoints[subIdx];
            this.createLightningBranch(parent, subPoint.x, subPoint.y, damage, false);
        }
    },
    
    // ★ 번개 경로 생성 (지그재그)
    generateLightningPath(x1, y1, x2, y2, numSegments = 8) {
        const points = [{ x: x1, y: y1 }];
        const segments = numSegments + Math.floor(Math.random() * 4);
        
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        
        // 거리에 비례한 오프셋
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const maxOffset = Math.min(50, dist * 0.15);
        
        for (let i = 1; i < segments; i++) {
            const offsetX = (Math.random() - 0.5) * maxOffset;
            const offsetY = (Math.random() - 0.5) * maxOffset * 0.7;
            
            points.push({
                x: x1 + dx * i + offsetX,
                y: y1 + dy * i + offsetY
            });
        }
        
        points.push({ x: x2, y: y2 });
        
        return points;
    },
    
    // ★ 비열한 찌르기 이펙트
    createSneakSlash(x, y, direction) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.zIndex = 200;
        CombatEffects.container.addChild(container);
        
        // 어둠의 찌르기 라인
        const slash = new PIXI.Graphics();
        slash.moveTo(-direction * 60, 0);
        slash.lineTo(direction * 80, 0);
        slash.stroke({ width: 8, color: 0x880044, alpha: 0.9 });
        
        // 코어 라인
        const core = new PIXI.Graphics();
        core.moveTo(-direction * 50, 0);
        core.lineTo(direction * 70, 0);
        core.stroke({ width: 3, color: 0xff4488, alpha: 1 });
        
        container.addChild(slash);
        container.addChild(core);
        
        // 피 방울들
        for (let i = 0; i < 6; i++) {
            const drop = new PIXI.Graphics();
            drop.circle(0, 0, 3 + Math.random() * 4);
            drop.fill({ color: 0xcc0000, alpha: 0.9 });
            drop.x = direction * (20 + i * 15);
            drop.y = (Math.random() - 0.5) * 20;
            container.addChild(drop);
            
            gsap.to(drop, {
                y: drop.y + 40 + Math.random() * 30,
                alpha: 0,
                duration: 0.4 + Math.random() * 0.2,
                delay: i * 0.02,
                ease: 'power2.in',
                onComplete: () => { if (!drop.destroyed) drop.destroy(); }
            });
        }
        
        // 애니메이션
        container.alpha = 0;
        container.scale.set(0.5, 1);
        
        gsap.timeline()
            .to(container, { alpha: 1, duration: 0.05 })
            .to(container.scale, { x: 1, y: 1, duration: 0.08, ease: 'power2.out' }, '<')
            .to(container, { alpha: 0, duration: 0.15, delay: 0.1 })
            .add(() => {
                if (!container.destroyed) container.destroy({ children: true });
            });
    },
    
    // ==========================================
    // 연속 찌르기 공격 (Flurry) - 빠른 3연타
    // ==========================================
    async flurryAttack(attacker, target, damage, options = {}) {
        const { isEnemy = false, onHit = null, hitIndex = 0, isLastHit = false, animConfig = {}, skipDamage = false } = options;
        
        // ★ JSON에서 로드된 애니메이션 설정 (속도 늦춤!)
        const dashTime = animConfig.dash || 0.4;   // 0.28 → 0.4
        const stabTime = animConfig.stab || 0.12;  // 0.08 → 0.12
        const ease = animConfig.ease || 'power2.inOut';
        const vfxType = animConfig.vfx || 'stab';
        const dashOffset = animConfig.dashOffset || 0;  // ★ 대시 오프셋
        
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
        
        // ★ 스프라이트 겹침 방지 대시 위치 계산
        const dashX = this.calculateDashX(attacker, target, isEnemy, dashOffset);
        const dashDirection = isEnemy ? -1 : 1;
        
        // ★ 첫 번째 히트에서만 대시!
        if (hitIndex === 0) {
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
                
                let lastDustX = posTarget.x;
                
                // ★ 대시 시작 점프 먼지
                if (typeof DustVFX !== 'undefined') {
                    DustVFX.jumpFromUnit(attacker, 1.0);
                }
                
                gsap.timeline()
                    .to(posTarget, { 
                        x: dashX, 
                        duration: dashTime * 0.3, 
                        ease: ease,
                        onUpdate: function() {
                            // ★ 초반에 많이, 후반에 적게!
                            if (typeof DustVFX !== 'undefined') {
                                const progress = this.progress();
                                const dist = Math.abs(posTarget.x - lastDustX);
                                const threshold = 12 + progress * 20;
                                const intensity = 1.2 - progress * 0.7;
                                
                                if (dist > threshold && intensity > 0.3) {
                                    DustVFX.run(posTarget.x, posTarget.y, intensity);
                                    lastDustX = posTarget.x;
                                }
                            }
                        }
                    })
                    .to(scaleTarget.scale, { x: baseScale * 1.05, y: baseScale * 0.95, duration: dashTime * 0.25 }, '<')
                    .add(() => {
                        if (trailTimer && typeof SkillSystem !== 'undefined') {
                            SkillSystem.stopSandevistanTrail(trailTimer);
                        }
                        resolve();
                    });
            });
        } else {
            // 2번째, 3번째 히트: 제자리에서 찌르기 모션만
            await new Promise(resolve => {
                if (!scaleTarget || scaleTarget.destroyed) {
                    resolve();
                    return;
                }
                
                // 찌르기 전 약간 뒤로 (★ JSON 설정 사용)
                const halfStab = stabTime / 2;
                gsap.timeline()
                    .to(posTarget, { x: posTarget.x - dashDirection * 8, duration: halfStab, ease: 'power1.out' })
                    .to(scaleTarget.scale, { x: baseScale * 0.95, y: baseScale * 1.02, duration: halfStab }, '<')
                    .to(posTarget, { x: dashX, duration: halfStab, ease: ease })
                    .to(scaleTarget.scale, { x: baseScale * 1.05, y: baseScale * 0.95, duration: halfStab }, '<')
                    .call(resolve);
            });
        }
        
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
        
        // 3. VFX (★ JSON에서 vfx 타입 로드)
        const direction = isEnemy ? -1 : 1;
        if (typeof CombatEffects !== 'undefined') {
            if (vfxType === 'stab') {
                // ★ 찌르기 - 깊숙히 찌르는 관통 이펙트
                if (CombatEffects.flurryStabEffect) {
                    CombatEffects.flurryStabEffect(targetX, targetCenter, direction, hitIndex, 0x88ccff);
                } else {
                    CombatEffects.stabEffect?.(targetX, targetCenter, direction, 0x88ccff, 1);
                    CombatEffects.burstParticles(targetX, targetCenter, 0x88ccff, 5);
                }
            } else if (vfxType === 'slash') {
                // 베기 - 큰 슬래시
                CombatEffects.slashEffect(targetX, targetCenter, 40, 0xffcc44);
            } else if (vfxType === 'pierce') {
                // 관통 - 날카로운 라인
                if (CombatEffects.stabEffect) {
                    CombatEffects.stabEffect(targetX, targetCenter, direction, 0xff4444, 1.2);
                } else {
                    CombatEffects.burstParticles(targetX, targetCenter, 0xff4444, 8);
                }
            } else {
                // 기본 - 찌르기
                if (CombatEffects.stabEffect) {
                    CombatEffects.stabEffect(targetX, targetCenter, direction, 0x88ccff, 0.8);
                } else {
                    CombatEffects.slashEffect(targetX, targetCenter, 25, 0x88ccff);
                }
            }
        }
        
        // 4. 피격 (데미지 숫자는 dealDamage에서 표시) - skipDamage면 스킵
        if (!skipDamage) {
            if (typeof CombatEffects !== 'undefined' && target.sprite && !target.sprite.destroyed) {
                CombatEffects.hitEffect(target);
            }
            
            if (isEnemy) {
                this.game.dealDamageToTarget(target, damage);
            } else {
                this.game.dealDamage(target, damage);
            }
            
            if (onHit) onHit();
        }
        
        // ★ 마지막 히트에서만 복귀!
        if (isLastHit) {
            console.log('[Flurry] 마지막 히트 - 이펙트 완료 대기');
            
            // ★★★ VFX 이펙트가 완전히 출력될 때까지 대기! ★★★
            await new Promise(r => setTimeout(r, 250));  // 0.25초 대기
            
            console.log('[Flurry] 복귀 시작');
            
            // 5. 복귀 + 스케일 복원! + ★ 산데비스탄!
            await new Promise(resolve => {
                if (!scaleTarget || scaleTarget.destroyed || !posTarget || posTarget.destroyed) {
                    console.log('[Flurry] 복귀 실패 - scaleTarget/posTarget 없음');
                    if (attacker) attacker.isAnimating = false;
                    resolve();
                    return;
                }
                
                // 잔상: 복귀
                if (typeof SkillSystem !== 'undefined') {
                    SkillSystem.createGhost(attacker, 0.4, SkillSystem.GHOST_COLORS.MAGENTA);
                }
                
                // ★ 복귀 시작 점프 먼지
                if (typeof DustVFX !== 'undefined') {
                    DustVFX.jumpFromUnit(attacker, 0.8);
                }
                
                console.log(`[Flurry] 복귀 애니메이션: startX=${startX}, startY=${startY}`);
                
                gsap.timeline()
                    .to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: stabTime })
                    .to(posTarget, {
                        x: startX,
                        y: startY,
                        duration: dashTime * 0.4,  // ★ JSON 설정
                        ease: ease,
                        onComplete: () => {
                            console.log('[Flurry] 복귀 완료!');
                            // ★ 착지 먼지!
                            if (typeof DustVFX !== 'undefined') {
                                DustVFX.landFromUnit(attacker, 0.8);
                            }
                            if (attacker) attacker.isAnimating = false;
                            resolve();
                        }
                    }, '<');
            });
        } else {
            // 마지막 히트가 아니면 제자리 유지, 다음 히트 대기
            // isAnimating은 그대로 유지
        }
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
            } else if (projectileType === 'spear') {
                // ★ 스피어 이펙트 (직선 투척, 거리 파워업!)
                const gridDist = options.gridDistance || 1;
                console.log('[UnitCombat] 🗡️ 스피어 이펙트 실행! 그리드 거리:', gridDist);
                await CombatEffects.spearEffect(startX, startY, endX, endY, { isEnemy, gridDistance: gridDist });
                CombatEffects.hitEffect(target);
            } else if (projectileType === 'arrow') {
                // ★ 화살 이펙트 (곡사)
                console.log('[UnitCombat] 🏹 화살 이펙트 실행!');
                await CombatEffects.arrowEffect(startX, startY, endX, endY, { isEnemy });
                CombatEffects.hitEffect(target);
            } else if (projectileType === 'fireArrow') {
                // ★ 화염 화살 이펙트 (3D 볼류메트릭)
                console.log('[UnitCombat] 🔥🏹 화염 화살 이펙트 실행!');
                await CombatEffects.fireArrowEffect(startX, startY, endX, endY, { isEnemy });
                CombatEffects.hitEffect(target);
            } else {
                // 일반 투사체
                await CombatEffects.projectileEffect(startX, startY, endX, endY, projectileColor, projectileSize);
                CombatEffects.hitEffect(target);
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
    // ★ 관통 공격 (차크람 등) - 일직선 모든 적 타격
    // ==========================================
    async piercingAttack(attacker, targets, damage, options = {}) {
        const {
            projectileColor = 0xccddff,
            projectileType = 'chakram',
            speed = 0.4,
            spin = true,
            isEnemy = false,
            onHit = null,
            targetZ = null  // ★ 타겟 Z 라인
        } = options;
        
        console.log(`[Piercing] 관통 공격! targets=${targets.length}, damage=${damage}, targetZ=${targetZ}`);
        
        if (!attacker || !attacker.sprite) {
            if (attacker) attacker.isAnimating = false;
            return;
        }
        
        attacker.isAnimating = true;
        
        // ★ 1. 타겟 Z 라인으로 이동 (다른 라인이면)
        if (targetZ !== null && attacker.gridZ !== targetZ) {
            console.log(`[Piercing] 레인 변경: ${attacker.gridZ} → ${targetZ}`);
            await this.moveToLine(attacker, targetZ, { checkBlocking: false });
        }
        
        const posTarget = this.getPositionTarget(attacker);
        const scaleTarget = this.getScaleTarget(attacker);
        const baseScale = attacker.baseScale || scaleTarget?.baseScale || 1;
        
        if (!posTarget) {
            attacker.isAnimating = false;
            return;
        }
        
        const startX = posTarget.x;
        const startY = posTarget.y - 40;
        
        // ★ 화면 오른쪽 끝까지 날아감! (화면 너비 + 여유)
        const screenWidth = this.game?.app?.screen?.width || 1920;
        const endX = screenWidth + 100;  // 화면 밖까지!
        const endY = startY;
        
        console.log(`[Chakram] 비행 경로: ${startX} → ${endX} (거리: ${endX - startX}px)`);
        
        // 2. 던지기 모션
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(scaleTarget?.scale || {}, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.1 })
                .to(scaleTarget?.scale || {}, { x: baseScale, y: baseScale, duration: 0.1 });
        });
        
        // 3. 차크람 발사체 생성 - 이미지 사용!
        let chakram;
        
        // ★ 이미지 로드 (비동기)
        try {
            const texture = await PIXI.Assets.load('image/chakramthrow.png');
            chakram = new PIXI.Sprite(texture);
            chakram.anchor.set(0.5);
            chakram.scale.set(0.25);  // 1/2 크기로 축소
            console.log('[Chakram] ✓ 이미지 로드 성공!');
        } catch (e) {
            console.warn('[Chakram] 이미지 로드 실패, 폴백 사용:', e);
            
            // ★ 폴백: 그래픽으로 그리기
            chakram = new PIXI.Graphics();
            const size = 30;
            
            // 외곽 원
            chakram.circle(0, 0, size);
            chakram.stroke({ width: 5, color: 0xaabbcc });
            
            // 톱니 (8개)
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const innerR = size * 0.7;
                const outerR = size * 1.2;
                chakram.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
                chakram.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
                chakram.stroke({ width: 4, color: 0xccddee });
            }
            
            // 내부 원
            chakram.circle(0, 0, size * 0.5);
            chakram.stroke({ width: 3, color: 0xffffff });
            
            // 중앙
            chakram.circle(0, 0, 6);
            chakram.fill({ color: 0xffffff });
        }
        
        chakram.zIndex = 500;
        chakram.x = startX;
        chakram.y = startY;
        
        // ★ 컨테이너에 추가
        let container = null;
        if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
            container = CombatEffects.container;
        } else if (this.game?.app?.stage) {
            container = this.game.app.stage;
        }
        
        if (container) {
            container.addChild(chakram);
            console.log(`[Chakram] 발사체 생성 완료! 위치: (${startX}, ${startY})`);
        } else {
            console.error('[Chakram] 컨테이너를 찾을 수 없음!');
        }
        
        // 4. 차크람 비행 + 회전 + 타겟별 히트 처리
        const totalDistance = endX - startX;
        const duration = Math.max(0.8, speed * (totalDistance / 600));  // 최소 0.8초, 빠르게!
        console.log(`[Chakram] 비행 시간: ${duration.toFixed(2)}초`);
        
        // 각 타겟의 X 위치에서 히트 처리
        const hitPositions = targets.map(t => {
            const pos = this.getPositionTarget(t);
            return pos ? pos.x : startX;
        });
        
        let hitIndex = 0;
        let lastDustX = startX;  // ★ 더스트 트레일용
        let lastTrailX = startX; // ★ 산데비스탄 잔상용
        
        await new Promise(resolve => {
            gsap.to(chakram, {
                x: endX,
                duration: duration,
                ease: 'linear',
                onUpdate: () => {
                    // 회전
                    if (spin) {
                        chakram.rotation += 0.4;
                    }
                    
                    // ★ 산데비스탄 잔상 (30px마다)
                    if (chakram.x - lastTrailX > 30 && container) {
                        this.createChakramAfterimage(chakram, container);
                        lastTrailX = chakram.x;
                    }
                    
                    // ★ 차크람 더스트 트레일 (60px마다)
                    if (typeof DustVFX !== 'undefined' && chakram.x - lastDustX > 60) {
                        DustVFX.createPuff(chakram.x, chakram.y, 2, 'dash', 0.3);
                        lastDustX = chakram.x;
                    }
                    
                    // 타겟 히트 체크
                    while (hitIndex < targets.length && chakram.x >= hitPositions[hitIndex] - 20) {
                        const target = targets[hitIndex];
                        
                        // 히트 이펙트
                        if (typeof CombatEffects !== 'undefined') {
                            const targetPos = this.getPositionTarget(target);
                            if (targetPos) {
                                CombatEffects.slashEffect(targetPos.x, targetPos.y - 40, 0, projectileColor, 0.8);
                                CombatEffects.hitEffect(target);
                                CombatEffects.screenShake(4, 50);
                            }
                        }
                        
                        // ★ 히트 시 더스트 폭발
                        if (typeof DustVFX !== 'undefined') {
                            DustVFX.createPuff(chakram.x, chakram.y, 8, 'land', 0.8);
                        }
                        
                        // 데미지
                        if (isEnemy) {
                            this.game.dealDamageToTarget(target, damage);
                        } else {
                            this.game.dealDamage(target, damage);
                        }
                        
                        // 브레이크 시스템
                        if (typeof BreakSystem !== 'undefined' && options.cardDef) {
                            BreakSystem.onAttack(target, options.cardDef, 1, hitIndex);
                        }
                        
                        if (onHit) onHit(target);
                        
                        hitIndex++;
                    }
                },
                onComplete: resolve
            });
        });
        
        // 4. 차크람 제거 (페이드아웃)
        gsap.to(chakram, {
            alpha: 0,
            duration: 0.15,
            onComplete: () => {
                if (!chakram.destroyed) chakram.destroy();
            }
        });
        
        attacker.isAnimating = false;
    },
    
    // ==========================================
    // 공격 이펙트 재생
    // vfx: JSON에서 설정한 VFX 옵션 { angle, color, scale }
    // ==========================================
    playAttackEffect(effectType, x, y, customColor = null, vfx = null) {
        if (typeof CombatEffects === 'undefined') return;
        
        // ★ JSON에서 VFX 설정이 있으면 우선 사용
        if (vfx) {
            const angle = vfx.angle ?? -45;
            const color = vfx.color ? parseInt(vfx.color, 16) : (customColor || 0xffffff);
            const scale = vfx.scale ?? 1.3;
            CombatEffects.slashEffect(x, y, angle, color, scale);
            CombatEffects.screenShake(6, 100);
            return;
        }
        
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
    // 차크람 산데비스탄 잔상 생성
    // ==========================================
    createChakramAfterimage(chakram, container) {
        if (!chakram || chakram.destroyed || !container) return;
        
        try {
            // 잔상 스프라이트 생성
            let ghost;
            
            if (chakram.texture && chakram.texture.valid) {
                // 이미지 차크람인 경우
                ghost = new PIXI.Sprite(chakram.texture);
                ghost.anchor.set(0.5);
                ghost.scale.set(chakram.scale.x * 1.1);  // 살짝 크게
            } else {
                // 그래픽 차크람인 경우 - 원으로 대체
                ghost = new PIXI.Graphics();
                ghost.circle(0, 0, 25);
                ghost.fill({ color: 0x88ccff, alpha: 0.5 });
            }
            
            ghost.x = chakram.x;
            ghost.y = chakram.y;
            ghost.rotation = chakram.rotation;
            ghost.alpha = 0.6;
            ghost.tint = 0x88ddff;  // 시안 틴트
            ghost.zIndex = chakram.zIndex - 1;
            
            container.addChild(ghost);
            
            // 페이드아웃 + 확대
            gsap.to(ghost, {
                alpha: 0,
                duration: 0.25,
                ease: 'power2.out',
                onUpdate: () => {
                    if (ghost.scale) {
                        ghost.scale.x *= 1.02;
                        ghost.scale.y *= 1.02;
                    }
                },
                onComplete: () => {
                    if (!ghost.destroyed) ghost.destroy();
                }
            });
        } catch (e) {
            // 조용히 실패
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
            const startX = posTarget.x;
            const startY = posTarget.y;
            const midY = Math.min(startY, newPos.y) - 25;
            
            // ★ 도약 먼지!
            if (typeof DustVFX !== 'undefined') {
                DustVFX.jump(startX, startY, 1.0);
            }
            
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
                    // ★ 착지 먼지!
                    if (typeof DustVFX !== 'undefined') {
                        DustVFX.land(newPos.x, newPos.y, 1.2);
                    }
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
