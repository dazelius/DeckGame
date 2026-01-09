// =====================================================
// Knockback System - 넉백 시스템
// =====================================================

const KnockbackSystem = {
    game: null,
    
    // 넉백 대미지 설정
    KNOCKBACK_DAMAGE: 2,      // 기본 넉백 대미지
    WALL_DAMAGE: 5,           // 벽 충돌 대미지
    COLLISION_DAMAGE: 3,      // 유닛 충돌 대미지 (양쪽)
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        console.log('[KnockbackSystem] 초기화 완료');
    },
    
    // ==========================================
    // 유틸: 위치용 타겟 (container || sprite)
    // ==========================================
    getPositionTarget(unit) {
        return unit?.container || unit?.sprite || null;
    },
    
    // ==========================================
    // 넉백 실행
    // ==========================================
    async knockback(unit, direction = 1, cells = 1) {
        const posTarget = this.getPositionTarget(unit);
        if (!posTarget || unit.hp <= 0) return false;
        if (!this.game) return false;
        
        const isEnemy = unit.team === 'enemy';
        const knockbackDir = isEnemy ? direction : -direction; // Enemies go right (+X), allies go left (-X)
        
        // Calculate new position
        const newGridX = unit.gridX + (knockbackDir * cells);
        
        // Check bounds
        if (newGridX < 0 || newGridX >= this.game.arena.width) {
            // Hit wall - show wall impact effect + WALL DAMAGE
            await this.wallImpact(unit);
            this.dealKnockbackDamage(unit, this.WALL_DAMAGE, 'wall');
            return false;
        }
        
        // Check if destination cell is occupied
        const allUnits = [...this.game.state.playerUnits, ...this.game.state.enemyUnits];
        const blockingUnit = allUnits.find(u => 
            u !== unit && u.hp > 0 && u.gridX === newGridX && u.gridZ === unit.gridZ
        );
        
        if (blockingUnit) {
            // Chain knockback - push the blocking unit too
            const chainSuccess = await this.knockback(blockingUnit, direction, 1);
            if (!chainSuccess) {
                // Blocking unit couldn't move, collision! Both take damage
                await this.collisionImpact(unit, blockingUnit);
                this.dealKnockbackDamage(unit, this.COLLISION_DAMAGE, 'collision');
                this.dealKnockbackDamage(blockingUnit, this.COLLISION_DAMAGE, 'collision');
                return false;
            }
        }
        
        // Execute knockback movement
        await this.executeKnockback(unit, newGridX);
        
        // 넉백 성공 시 기본 대미지
        this.dealKnockbackDamage(unit, this.KNOCKBACK_DAMAGE, 'knockback');
        
        return true;
    },
    
    // ==========================================
    // 넉백 대미지 처리
    // ==========================================
    dealKnockbackDamage(unit, damage, type = 'knockback') {
        if (!unit || unit.hp <= 0 || damage <= 0) return;
        
        // 대미지 적용
        const isEnemy = unit.team === 'enemy';
        if (isEnemy) {
            this.game.dealDamage(unit, damage);
        } else {
            this.game.dealDamageToTarget(unit, damage);
        }
        
        // 대미지 숫자 표시
        const posTarget = this.getPositionTarget(unit);
        if (typeof CombatEffects !== 'undefined' && posTarget) {
            const colors = {
                knockback: 'normal',
                wall: 'bash',      // 벽 충돌은 주황색
                collision: 'burn'  // 유닛 충돌은 빨강
            };
            
            CombatEffects.showDamageNumber(
                posTarget.x,
                posTarget.y - 60,
                damage,
                colors[type] || 'normal'
            );
        }
        
        console.log(`[KnockbackSystem] ${type} damage: ${damage} to ${unit.name || unit.type}`);
    },
    
    // ==========================================
    // 넉백 이동 실행
    // ==========================================
    async executeKnockback(unit, newGridX) {
        // ★ 새 구조: posTarget 사용
        const posTarget = this.getPositionTarget(unit);
        if (!posTarget || posTarget.destroyed) {
            unit.gridX = newGridX;
            unit.x = newGridX + 0.5;
            return;
        }
        
        const oldGridX = unit.gridX;
        
        // Store current position before updating grid position
        const startX = posTarget.x;
        const startY = posTarget.y;
        
        // Update grid position (for game logic)
        unit.gridX = newGridX;
        unit.x = newGridX + 0.5;
        
        // Get new screen position
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) return;
        
        // Mark unit as animating to prevent ticker from updating position
        unit.isAnimating = true;
        
        // Hit effects at impact moment
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenShake(12, 200);
            CombatEffects.screenFlash('#ffaa00', 80, 0.3);
            CombatEffects.hitStop(60);
        }
        
        // Knockback animation
        const scaleTarget = unit.sprite;  // 스케일은 sprite에서
        const baseScale = unit.baseScale || scaleTarget?.baseScale || 1;
        
        return new Promise(resolve => {
            // ★ 애니메이션 시작 전 다시 체크
            if (!posTarget || posTarget.destroyed) {
                unit.isAnimating = false;
                resolve();
                return;
            }
            
            const distance = Math.abs(newPos.x - startX);
            
            // Calculate dramatic arc - higher for longer distances
            const arcHeight = Math.max(50, distance * 0.4);
            const midY = startY - arcHeight;
            
            // Create motion blur / afterimage effect
            this.createAfterImage(posTarget, startX, startY);
            
            gsap.timeline()
                // Hit reaction - violent squash & flash (스케일은 scaleTarget에)
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 0.5, y: baseScale * 1.5, duration: 0.04 });
                })
                .call(() => {
                    // Impact particles at start
                    if (typeof CombatEffects !== 'undefined') {
                        CombatEffects.impactEffect(startX, startY - 30, 0xff8800, 1.2);
                        this.createDustCloud(startX, startY);
                    }
                })
                // Fly back in dramatic arc (위치는 posTarget에)
                .to(posTarget, {
                    x: newPos.x,
                    y: midY,
                    duration: 0.18,
                    ease: 'power2.out'
                })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 1.4, y: baseScale * 0.6, duration: 0.12 });
                }, null, '<')
                // Speed lines during flight
                .call(() => {
                    if (posTarget && !posTarget.destroyed) {
                        this.createSpeedLines(posTarget.x, posTarget.y, newPos.x > startX ? 1 : -1);
                    }
                }, null, '<+=0.05')
                // Land with impact
                .to(posTarget, {
                    y: newPos.y,
                    duration: 0.12,
                    ease: 'power3.in'
                })
                // Squash on landing
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 1.3, y: baseScale * 0.7, duration: 0.05 });
                })
                .call(() => {
                    // Landing dust
                    this.createDustCloud(newPos.x, newPos.y);
                    if (typeof CombatEffects !== 'undefined') {
                        CombatEffects.screenShake(6, 100);
                    }
                })
                // Bounce recovery
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.08 });
                })
                .to({}, { duration: 0.08 })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.2, ease: 'elastic.out(1, 0.4)' });
                })
                // Update zIndex and resolve
                .call(() => {
                    if (posTarget && !posTarget.destroyed) {
                        posTarget.zIndex = Math.floor(newPos.y);
                    }
                    unit.isAnimating = false; // Allow ticker to update position again
                    
                    // 넉백으로 불구덩이 등에 진입 시 대미지!
                    if (typeof GridAOE !== 'undefined') {
                        GridAOE.onUnitEnterCell(unit, newGridX, unit.gridZ);
                    }
                    
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 잔상 효과
    // ==========================================
    createAfterImage(sprite, x, y) {
        if (!this.game?.app) return;
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ghost = new PIXI.Graphics();
                ghost.beginFill(0xffffff, 0.4 - i * 0.1);
                ghost.drawEllipse(0, -30, 25, 40);
                ghost.endFill();
                ghost.x = x;
                ghost.y = y;
                this.game.app.stage.addChild(ghost);
                
                gsap.to(ghost, {
                    alpha: 0,
                    duration: 0.2,
                    onComplete: () => {
                        this.game.app.stage.removeChild(ghost);
                        ghost.destroy();
                    }
                });
            }, i * 30);
        }
    },
    
    // ==========================================
    // 먼지 구름 효과
    // ==========================================
    createDustCloud(x, y) {
        if (!this.game?.app) return;
        
        for (let i = 0; i < 8; i++) {
            const dust = new PIXI.Graphics();
            const size = 5 + Math.random() * 8;
            dust.beginFill(0xccaa88, 0.6);
            dust.drawCircle(0, 0, size);
            dust.endFill();
            dust.x = x + (Math.random() - 0.5) * 30;
            dust.y = y - 5;
            this.game.app.stage.addChild(dust);
            
            const angle = Math.random() * Math.PI - Math.PI / 2;
            const distance = 20 + Math.random() * 30;
            
            gsap.to(dust, {
                x: dust.x + Math.cos(angle) * distance,
                y: dust.y + Math.sin(angle) * distance - 15,
                alpha: 0,
                duration: 0.4 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    this.game.app.stage.removeChild(dust);
                    dust.destroy();
                }
            });
            
            gsap.to(dust.scale, {
                x: 0.5,
                y: 0.5,
                duration: 0.4
            });
        }
    },
    
    // ==========================================
    // 속도선 효과
    // ==========================================
    createSpeedLines(x, y, direction) {
        if (!this.game?.app) return;
        
        for (let i = 0; i < 5; i++) {
            const line = new PIXI.Graphics();
            line.lineStyle(2, 0xffffff, 0.7);
            line.moveTo(0, 0);
            line.lineTo(-direction * (30 + Math.random() * 20), 0);
            line.x = x + (Math.random() - 0.5) * 20;
            line.y = y - 20 - Math.random() * 40;
            this.game.app.stage.addChild(line);
            
            gsap.to(line, {
                x: line.x + direction * 30,
                alpha: 0,
                duration: 0.15,
                ease: 'power2.out',
                onComplete: () => {
                    this.game.app.stage.removeChild(line);
                    line.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 벽 충돌 이펙트
    // ==========================================
    async wallImpact(unit) {
        const posTarget = this.getPositionTarget(unit);
        const scaleTarget = unit.sprite;
        if (!posTarget || posTarget.destroyed) return;
        
        unit.isAnimating = true;
        const originalX = posTarget.x;
        const baseScale = unit.baseScale || scaleTarget?.baseScale || 1;
        
        // Screen shake
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenShake(8, 150);
            CombatEffects.screenFlash('#ff6600', 100, 0.2);
        }
        
        return new Promise(resolve => {
            if (!posTarget || posTarget.destroyed) {
                unit.isAnimating = false;
                resolve();
                return;
            }
            
            gsap.timeline()
                // Squash against wall (스케일은 scaleTarget)
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 0.6, y: baseScale * 1.4, duration: 0.08 });
                })
                .to(posTarget, { 
                    x: originalX + 15, // Slight push toward wall
                    duration: 0.08 
                }, '<')
                // Bounce back
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.1 });
                })
                .to(posTarget, { 
                    x: originalX, 
                    duration: 0.15,
                    ease: 'power2.out'
                }, '<')
                // Settle
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.1 });
                })
                .to({}, { duration: 0.1 })
                .call(() => {
                    unit.isAnimating = false;
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 유닛 충돌 이펙트
    // ==========================================
    async collisionImpact(unit, blockingUnit) {
        const posTarget1 = this.getPositionTarget(unit);
        const posTarget2 = this.getPositionTarget(blockingUnit);
        const scaleTarget1 = unit?.sprite;
        const scaleTarget2 = blockingUnit?.sprite;
        
        if (!posTarget1 || posTarget1.destroyed || !posTarget2 || posTarget2.destroyed) return;
        
        const baseScale1 = unit.baseScale || scaleTarget1?.baseScale || 1;
        const baseScale2 = blockingUnit.baseScale || scaleTarget2?.baseScale || 1;
        
        // Both units take minor stun effect
        const stunBoth = async () => {
            // Screen effects
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.screenShake(6, 120);
                CombatEffects.impactEffect(
                    (posTarget1.x + posTarget2.x) / 2,
                    (posTarget1.y + posTarget2.y) / 2 - 30,
                    0xffaa00,
                    0.8
                );
            }
            
            // Unit 1 reaction
            if (scaleTarget1 && !scaleTarget1.destroyed) {
                gsap.timeline()
                    .to(scaleTarget1.scale, { x: baseScale1 * 0.8, y: baseScale1 * 1.2, duration: 0.08 })
                    .to(scaleTarget1.scale, { x: baseScale1, y: baseScale1, duration: 0.15, ease: 'elastic.out(1, 0.5)' });
            }
            
            // Unit 2 reaction
            if (scaleTarget2 && !scaleTarget2.destroyed) {
                gsap.timeline()
                    .to(scaleTarget2.scale, { x: baseScale2 * 0.8, y: baseScale2 * 1.2, duration: 0.08 })
                    .to(scaleTarget2.scale, { x: baseScale2, y: baseScale2, duration: 0.15, ease: 'elastic.out(1, 0.5)' });
            }
        };
        
        await stunBoth();
        await new Promise(r => setTimeout(r, 200));
    },
    
    // ==========================================
    // 강제 밀어내기 (특정 방향으로)
    // ==========================================
    async push(unit, targetX, targetZ) {
        const posTarget = this.getPositionTarget(unit);
        if (!posTarget || posTarget.destroyed || unit.hp <= 0) return false;
        if (!this.game) return false;
        
        // Check bounds
        if (targetX < 0 || targetX >= this.game.arena.width) return false;
        if (targetZ < 0 || targetZ >= this.game.arena.depth) return false;
        
        // Check if destination is occupied
        const allUnits = [...this.game.state.playerUnits, ...this.game.state.enemyUnits];
        const occupied = allUnits.some(u => 
            u !== unit && u.hp > 0 && u.gridX === targetX && u.gridZ === targetZ
        );
        
        if (occupied) return false;
        
        // Update position
        unit.gridX = targetX;
        unit.gridZ = targetZ;
        unit.x = targetX + 0.5;
        unit.z = targetZ + 0.5;
        
        // Get new screen position
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) return false;
        
        // Animate
        return new Promise(resolve => {
            if (!posTarget || posTarget.destroyed) {
                resolve(false);
                return;
            }
            gsap.to(posTarget, {
                x: newPos.x,
                y: newPos.y,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    if (posTarget && !posTarget.destroyed) {
                        posTarget.zIndex = Math.floor(newPos.y);
                    }
                    resolve(true);
                }
            });
        });
    },
    
    // ==========================================
    // 끌어당기기
    // ==========================================
    async pull(unit, towardUnit, cells = 1) {
        const posTarget = this.getPositionTarget(unit);
        const scaleTarget = unit.sprite;
        if (!posTarget || posTarget.destroyed || unit.hp <= 0) return false;
        if (!towardUnit) return false;
        
        const baseScale = unit.baseScale || scaleTarget?.baseScale || 1;
        
        // Calculate direction toward the pulling unit
        const dx = Math.sign(towardUnit.gridX - unit.gridX);
        
        // Calculate new position
        const newGridX = unit.gridX + (dx * cells);
        
        // Clamp to valid range
        const clampedX = Math.max(0, Math.min(this.game.arena.width - 1, newGridX));
        
        if (clampedX === unit.gridX) return false; // No movement
        
        // Check if destination is occupied
        const allUnits = [...this.game.state.playerUnits, ...this.game.state.enemyUnits];
        const occupied = allUnits.some(u => 
            u !== unit && u.hp > 0 && u.gridX === clampedX && u.gridZ === unit.gridZ
        );
        
        if (occupied) return false;
        
        // Update position
        unit.gridX = clampedX;
        unit.x = clampedX + 0.5;
        
        // Get new screen position
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) return false;
        
        // Pull animation (different from knockback - more dragging feel)
        return new Promise(resolve => {
            if (!posTarget || posTarget.destroyed) {
                resolve(false);
                return;
            }
            
            gsap.timeline()
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 1.2, y: baseScale * 0.85, duration: 0.1 });
                })
                .to(posTarget, {
                    x: newPos.x,
                    y: newPos.y,
                    duration: 0.25,
                    ease: 'power3.in'
                }, '<')
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.1 });
                })
                .to({}, { duration: 0.1 })
                .call(() => {
                    if (scaleTarget) gsap.to(scaleTarget.scale, { x: baseScale, y: baseScale, duration: 0.15, ease: 'elastic.out(1, 0.5)' });
                })
                .to({}, { duration: 0.15 })
                .call(() => {
                    if (posTarget && !posTarget.destroyed) {
                        posTarget.zIndex = Math.floor(newPos.y);
                    }
                    resolve(true);
                });
        });
    }
};

console.log('[KnockbackSystem] 넉백 시스템 로드 완료');
