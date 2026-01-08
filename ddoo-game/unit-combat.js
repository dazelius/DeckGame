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
        
        attacker.isAnimating = true;
        
        const startX = attacker.sprite.x;
        const startY = attacker.sprite.y;
        const targetX = target.sprite.x;
        const targetCenter = target.sprite.y - (target.sprite.height || 60) / 2;
        
        // 방향 (아군은 오른쪽으로, 적은 왼쪽으로)
        const dashDirection = isEnemy ? -1 : 1;
        const dashX = targetX - (dashDirection * 60);
        
        // 1. 윈드업 + 돌진
        await new Promise(resolve => {
            gsap.timeline()
                .to(attacker.sprite, { x: startX - (dashDirection * 15), duration: 0.08 })
                .to(attacker.sprite.scale, { x: 0.9, y: 1.1, duration: 0.08 }, '<')
                .to(attacker.sprite, { x: dashX, duration: 0.12, ease: 'power2.in' })
                .to(attacker.sprite.scale, { x: 1.1, y: 0.9, duration: 0.1 }, '<')
                .add(resolve);
        });
        
        // 2. 히트 스톱
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.hitStop(40);
        }
        
        // 3. 공격 이펙트
        this.playAttackEffect(effectType, targetX, targetCenter, slashColor);
        
        // 4. 피격 처리
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitEffect(target.sprite);
            CombatEffects.showDamageNumber(targetX, targetCenter - 20, damage);
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
        
        // 5. 복귀 (await 없이)
        gsap.to(attacker.sprite, {
            x: startX,
            y: startY,
            duration: 0.25,
            ease: 'power2.out',
            onComplete: () => {
                attacker.isAnimating = false;
            }
        });
    },
    
    // ==========================================
    // 통합 원거리 공격 애니메이션
    // ==========================================
    async rangedAttack(attacker, target, damage, options = {}) {
        const {
            projectileColor = 0xffaa00,
            projectileSize = 8,
            createZone = null,
            isEnemy = false,
            onHit = null
        } = options;
        
        if (!attacker.sprite || !target.sprite) {
            if (isEnemy) {
                this.game.dealDamageToTarget(target, damage);
            } else {
                this.game.dealDamage(target, damage);
            }
            return;
        }
        
        attacker.isAnimating = true;
        
        const originalX = attacker.sprite.x;
        const startX = attacker.sprite.x;
        const startY = attacker.sprite.y - (attacker.sprite.height || 60) / 2;
        const endX = target.sprite.x;
        const endY = target.sprite.y - (target.sprite.height || 60) / 2;
        
        // 1. 슈팅 스탠스
        const recoil = isEnemy ? 8 : -10;
        await new Promise(resolve => {
            gsap.timeline()
                .to(attacker.sprite.scale, { x: 0.95, y: 1.05, duration: 0.1 })
                .to(attacker.sprite, { x: originalX + recoil, duration: 0.1 }, 0)
                .add(resolve);
        });
        
        // 2. 투사체
        if (typeof CombatEffects !== 'undefined') {
            await CombatEffects.projectileEffect(startX, startY, endX, endY, projectileColor, projectileSize);
            CombatEffects.hitEffect(target.sprite);
            CombatEffects.impactEffect(endX, endY, projectileColor, 0.8);
            CombatEffects.showDamageNumber(endX, endY - 20, damage);
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
        
        if (onHit) onHit();
        
        // 5. 복귀
        gsap.timeline()
            .to(attacker.sprite.scale, { x: 1, y: 1, duration: 0.1 })
            .to(attacker.sprite, { x: originalX, duration: 0.1 }, 0)
            .call(() => { attacker.isAnimating = false; });
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
        if (!unit || !unit.sprite) return;
        if (unit.gridZ === targetZ) return;
        
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
        
        unit.isAnimating = true;
        unit.gridZ = targetZ;
        unit.z = targetZ + 0.5;
        
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) {
            unit.isAnimating = false;
            return;
        }
        
        return new Promise(resolve => {
            const startY = unit.sprite.y;
            const midY = Math.min(startY, newPos.y) - 25;
            
            gsap.timeline()
                .to(unit.sprite.scale, { x: 1.1, y: 0.9, duration: 0.08 })
                .to(unit.sprite, { x: newPos.x, y: midY, duration: 0.15, ease: 'power2.out' })
                .to(unit.sprite.scale, { x: 0.95, y: 1.05, duration: 0.08 }, '<')
                .to(unit.sprite, { y: newPos.y, duration: 0.1, ease: 'power2.in' })
                .to(unit.sprite.scale, { x: 1, y: 1, duration: 0.1 }, '<')
                .call(() => {
                    unit.sprite.zIndex = Math.floor(newPos.y);
                    unit.isAnimating = false;
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 유닛 옆으로 이동 (블로킹 해제)
    // ==========================================
    async moveUnitAside(unit, avoidZ, team = 'player') {
        if (!unit || !unit.sprite) return;
        
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
        
        unit.isAnimating = true;
        unit.gridZ = newZ;
        unit.z = newZ + 0.5;
        
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) {
            unit.isAnimating = false;
            return;
        }
        
        return new Promise(resolve => {
            const startY = unit.sprite.y;
            const midY = Math.min(startY, newPos.y) - 15;
            
            gsap.timeline()
                .to(unit.sprite.scale, { x: 1.1, y: 0.9, duration: 0.06 })
                .to(unit.sprite, { x: newPos.x, y: midY, duration: 0.12, ease: 'power2.out' })
                .to(unit.sprite.scale, { x: 0.95, y: 1.05, duration: 0.06 }, '<')
                .to(unit.sprite, { y: newPos.y, duration: 0.08, ease: 'power2.in' })
                .to(unit.sprite.scale, { x: 1, y: 1, duration: 0.08 }, '<')
                .call(() => {
                    unit.sprite.zIndex = Math.floor(newPos.y);
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
