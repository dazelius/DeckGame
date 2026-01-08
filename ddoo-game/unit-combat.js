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
    // 통합 근접 공격 애니메이션
    // ==========================================
    async meleeAttack(attacker, target, damage, options = {}) {
        const {
            effectType = 'strike',  // 'strike', 'bash', 'cleave', 'heavy'
            knockback = 0,
            onHit = null,           // 히트 시 콜백
            returnToStart = true    // 원위치 복귀 여부
        } = options;
        
        if (!attacker.sprite || !target.sprite) {
            this.game.dealDamage(target, damage);
            if (knockback > 0 && target.hp > 0 && typeof KnockbackSystem !== 'undefined') {
                await KnockbackSystem.knockback(target, 1, knockback);
            }
            return;
        }
        
        // 애니메이션 중 위치 업데이트 방지
        attacker.isAnimating = true;
        
        const startX = attacker.sprite.x;
        const startY = attacker.sprite.y;
        const targetX = target.sprite.x;
        const targetY = target.sprite.y;
        const targetCenter = targetY - (target.sprite.height || 60) / 2;
        
        // 1. 돌진 (타겟 앞까지)
        await this.dashToTarget(attacker, targetX - 60, startY);
        
        // 2. 히트 스톱
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.hitStop(40);
        }
        
        // 3. 공격 이펙트
        this.playAttackEffect(effectType, targetX, targetCenter);
        
        // 4. 피격 처리 (데미지 + 넉백 동시)
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitEffect(target.sprite);
            CombatEffects.showDamageNumber(targetX, targetCenter - 20, damage);
        }
        
        this.game.dealDamage(target, damage);
        
        // 넉백 (await 없이 병렬 실행)
        if (knockback > 0 && target.hp > 0 && typeof KnockbackSystem !== 'undefined') {
            KnockbackSystem.knockback(target, 1, knockback);
        }
        
        // 커스텀 히트 콜백
        if (onHit) onHit();
        
        // 5. 복귀 (await 없이 - 넉백과 병렬)
        if (returnToStart) {
            gsap.to(attacker.sprite, {
                x: startX,
                y: startY,
                duration: 0.25,
                ease: 'power2.out',
                onComplete: () => {
                    attacker.isAnimating = false;
                }
            });
        } else {
            attacker.isAnimating = false;
        }
    },
    
    // ==========================================
    // 통합 원거리 공격 애니메이션
    // ==========================================
    async rangedAttack(attacker, target, damage, options = {}) {
        const {
            projectileColor = 0xffaa00,
            projectileSize = 8,
            createZone = null,      // 'fire', 'poison' 등
            onHit = null
        } = options;
        
        if (!attacker.sprite || !target.sprite) {
            this.game.dealDamage(target, damage);
            return;
        }
        
        attacker.isAnimating = true;
        
        const startX = attacker.sprite.x;
        const startY = attacker.sprite.y - (attacker.sprite.height || 60) / 2;
        const endX = target.sprite.x;
        const endY = target.sprite.y - (target.sprite.height || 60) / 2;
        
        // 1. 캐스팅 모션
        await new Promise(resolve => {
            gsap.timeline()
                .to(attacker.sprite.scale, { x: 1.1, y: 0.95, duration: 0.15 })
                .to(attacker.sprite.scale, { x: 1, y: 1, duration: 0.1 })
                .add(resolve);
        });
        
        // 2. 투사체 발사
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.projectileEffect(startX, startY, endX, endY, projectileColor, projectileSize);
        }
        
        // 3. 피격 처리
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitEffect(target.sprite);
            CombatEffects.impactEffect(endX, endY, projectileColor, 0.8);
            CombatEffects.showDamageNumber(endX, endY - 20, damage);
        }
        
        this.game.dealDamage(target, damage);
        
        // 4. 영역 효과 생성
        if (createZone && typeof GridAOE !== 'undefined') {
            GridAOE.createZone(createZone, target.gridX, target.gridZ);
        }
        
        if (onHit) onHit();
        
        attacker.isAnimating = false;
    },
    
    // ==========================================
    // 타겟까지 돌진
    // ==========================================
    async dashToTarget(unit, targetX, targetY) {
        return new Promise(resolve => {
            gsap.timeline()
                // 준비 자세
                .to(unit.sprite.scale, { x: 0.9, y: 1.1, duration: 0.08 })
                // 돌진
                .to(unit.sprite, { 
                    x: targetX, 
                    duration: 0.15, 
                    ease: 'power2.in' 
                })
                .to(unit.sprite.scale, { x: 1.1, y: 0.9, duration: 0.1 }, '<')
                .add(resolve);
        });
    },
    
    // ==========================================
    // 공격 이펙트 재생
    // ==========================================
    playAttackEffect(effectType, x, y) {
        if (typeof CombatEffects === 'undefined') return;
        
        switch (effectType) {
            case 'bash':
                CombatEffects.heavySlash(x, y, -30, 0xff8800);
                CombatEffects.screenShake(10, 150);
                break;
            case 'cleave':
                CombatEffects.cleaveEffect(x, y, 180);
                CombatEffects.screenShake(8, 120);
                break;
            case 'heavy':
                CombatEffects.heavySlash(x, y, -45, 0xaaaaaa);
                CombatEffects.screenShake(8, 120);
                break;
            case 'fire':
                CombatEffects.impactEffect(x, y, 0xff4400, 1.2);
                CombatEffects.screenFlash('#ff4400', 80, 0.2);
                break;
            case 'strike':
            default:
                CombatEffects.slashEffect(x, y, -45, 0xffffff, 1.3);
                CombatEffects.screenShake(6, 100);
                break;
        }
    },
    
    // ==========================================
    // 유닛 라인 이동 (Z축)
    // ==========================================
    async moveToLine(unit, targetZ) {
        if (!unit || !unit.sprite) return;
        if (unit.gridZ === targetZ) return;
        
        unit.isAnimating = true;
        
        // 그리드 위치 업데이트
        unit.gridZ = targetZ;
        unit.z = targetZ + 0.5;
        
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) {
            unit.isAnimating = false;
            return;
        }
        
        // 호핑 이동
        return new Promise(resolve => {
            const startY = unit.sprite.y;
            const midY = startY - 30;
            
            gsap.timeline()
                .to(unit.sprite.scale, { x: 0.9, y: 1.15, duration: 0.08 })
                .to(unit.sprite, { y: midY, duration: 0.12, ease: 'power2.out' })
                .to(unit.sprite.scale, { x: 1.1, y: 0.85, duration: 0.08 }, '<')
                .to(unit.sprite, { 
                    x: newPos.x, 
                    y: newPos.y, 
                    duration: 0.15, 
                    ease: 'power2.in' 
                })
                .to(unit.sprite.scale, { x: 1.2, y: 0.8, duration: 0.05 })
                .to(unit.sprite.scale, { x: 1, y: 1, duration: 0.15, ease: 'elastic.out(1, 0.5)' })
                .call(() => {
                    unit.sprite.zIndex = Math.floor(newPos.y);
                    unit.isAnimating = false;
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 유닛 X축 이동
    // ==========================================
    async moveToX(unit, targetX) {
        if (!unit || !unit.sprite) return;
        if (unit.gridX === targetX) return;
        
        unit.isAnimating = true;
        
        unit.gridX = targetX;
        unit.x = targetX + 0.5;
        
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) {
            unit.isAnimating = false;
            return;
        }
        
        return new Promise(resolve => {
            const startY = unit.sprite.y;
            const midY = startY - 25;
            
            gsap.timeline()
                .to(unit.sprite.scale, { x: 0.9, y: 1.1, duration: 0.06 })
                .to(unit.sprite, { y: midY, duration: 0.1, ease: 'power2.out' })
                .to(unit.sprite, { 
                    x: newPos.x, 
                    y: newPos.y, 
                    duration: 0.12, 
                    ease: 'power2.in' 
                })
                .to(unit.sprite.scale, { x: 1.15, y: 0.85, duration: 0.05 })
                .to(unit.sprite.scale, { x: 1, y: 1, duration: 0.12, ease: 'elastic.out(1, 0.5)' })
                .call(() => {
                    unit.sprite.zIndex = Math.floor(newPos.y);
                    unit.isAnimating = false;
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 적 타겟 찾기 (동일 라인 우선)
    // ==========================================
    findTarget(attacker, possibleTargets) {
        if (!possibleTargets || possibleTargets.length === 0) return null;
        
        const validTargets = possibleTargets.filter(t => t && t.hp > 0);
        if (validTargets.length === 0) return null;
        
        // 같은 라인에서 가장 가까운 대상
        const sameLineTargets = validTargets.filter(t => t.gridZ === attacker.gridZ);
        if (sameLineTargets.length > 0) {
            return this.getClosestTarget(attacker, sameLineTargets);
        }
        
        // 인접 라인에서 가장 가까운 대상
        const adjacentTargets = validTargets.filter(t => 
            Math.abs(t.gridZ - attacker.gridZ) === 1
        );
        if (adjacentTargets.length > 0) {
            return this.getClosestTarget(attacker, adjacentTargets);
        }
        
        // 아무나
        return this.getClosestTarget(attacker, validTargets);
    },
    
    getClosestTarget(attacker, targets) {
        if (targets.length === 0) return null;
        
        // 적 → 플레이어 유닛이면 X가 작은 쪽이 가까움
        // 아군 → 적 유닛이면 X가 큰 쪽이 가까움
        const isEnemy = attacker.team === 'enemy';
        
        return targets.reduce((closest, t) => {
            if (!closest) return t;
            if (isEnemy) {
                return t.gridX < closest.gridX ? t : closest;
            } else {
                return t.gridX > closest.gridX ? t : closest;
            }
        }, null);
    }
};

console.log('[UnitCombat] 유닛 전투 시스템 로드 완료');
