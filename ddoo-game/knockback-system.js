// =====================================================
// Knockback System - 넉백 시스템
// =====================================================

const KnockbackSystem = {
    game: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        console.log('[KnockbackSystem] 초기화 완료');
    },
    
    // ==========================================
    // 넉백 실행
    // ==========================================
    async knockback(unit, direction = 1, cells = 1) {
        if (!unit || !unit.sprite || unit.hp <= 0) return false;
        if (!this.game) return false;
        
        const isEnemy = unit.team === 'enemy';
        const knockbackDir = isEnemy ? direction : -direction; // Enemies go right (+X), allies go left (-X)
        
        // Calculate new position
        const newGridX = unit.gridX + (knockbackDir * cells);
        
        // Check bounds
        if (newGridX < 0 || newGridX >= this.game.arena.width) {
            // Hit wall - show wall impact effect
            await this.wallImpact(unit);
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
                // Blocking unit couldn't move, collision!
                await this.collisionImpact(unit, blockingUnit);
                return false;
            }
        }
        
        // Execute knockback movement
        await this.executeKnockback(unit, newGridX);
        return true;
    },
    
    // ==========================================
    // 넉백 이동 실행
    // ==========================================
    async executeKnockback(unit, newGridX) {
        const oldGridX = unit.gridX;
        
        // Update grid position
        unit.gridX = newGridX;
        unit.x = newGridX + 0.5;
        
        // Get new screen position
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) return;
        
        // Knockback animation
        return new Promise(resolve => {
            const startX = unit.sprite.x;
            const startY = unit.sprite.y;
            
            // Calculate arc for knockback
            const midY = startY - 25; // Arc up
            
            gsap.timeline()
                // Hit reaction - squash
                .to(unit.sprite.scale, { 
                    x: 0.7, 
                    y: 1.3, 
                    duration: 0.05 
                })
                // Fly back in arc
                .to(unit.sprite, {
                    x: newPos.x,
                    y: midY,
                    duration: 0.15,
                    ease: 'power2.out'
                })
                .to(unit.sprite.scale, { 
                    x: 1.2, 
                    y: 0.8, 
                    duration: 0.1 
                }, '<')
                // Land
                .to(unit.sprite, {
                    y: newPos.y,
                    duration: 0.1,
                    ease: 'bounce.out'
                })
                .to(unit.sprite.scale, { 
                    x: 1, 
                    y: 1, 
                    duration: 0.15,
                    ease: 'elastic.out(1, 0.5)'
                }, '<')
                // Update zIndex and resolve
                .call(() => {
                    unit.sprite.zIndex = Math.floor(newPos.y);
                    
                    // Show knockback effect
                    if (typeof CombatEffects !== 'undefined') {
                        CombatEffects.burstParticles(
                            unit.sprite.x, 
                            unit.sprite.y - 30, 
                            0xffaa00, 
                            5, 
                            40
                        );
                    }
                    
                    resolve();
                });
        });
    },
    
    // ==========================================
    // 벽 충돌 이펙트
    // ==========================================
    async wallImpact(unit) {
        if (!unit.sprite) return;
        
        return new Promise(resolve => {
            const originalX = unit.sprite.x;
            
            // Screen shake
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.screenShake(8, 150);
                CombatEffects.screenFlash('#ff6600', 100, 0.2);
            }
            
            gsap.timeline()
                // Squash against wall
                .to(unit.sprite.scale, { 
                    x: 0.6, 
                    y: 1.4, 
                    duration: 0.08 
                })
                .to(unit.sprite, { 
                    x: originalX + 15, // Slight push toward wall
                    duration: 0.08 
                }, '<')
                // Bounce back
                .to(unit.sprite.scale, { 
                    x: 1.1, 
                    y: 0.9, 
                    duration: 0.1 
                })
                .to(unit.sprite, { 
                    x: originalX, 
                    duration: 0.15,
                    ease: 'power2.out'
                }, '<')
                // Settle
                .to(unit.sprite.scale, { 
                    x: 1, 
                    y: 1, 
                    duration: 0.1 
                })
                .call(resolve);
        });
    },
    
    // ==========================================
    // 유닛 충돌 이펙트
    // ==========================================
    async collisionImpact(unit, blockingUnit) {
        if (!unit.sprite || !blockingUnit.sprite) return;
        
        // Both units take minor stun effect
        const stunBoth = async () => {
            // Screen effects
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.screenShake(6, 120);
                CombatEffects.impactEffect(
                    (unit.sprite.x + blockingUnit.sprite.x) / 2,
                    (unit.sprite.y + blockingUnit.sprite.y) / 2 - 30,
                    0xffaa00,
                    0.8
                );
            }
            
            // Unit 1 reaction
            gsap.timeline()
                .to(unit.sprite.scale, { x: 0.8, y: 1.2, duration: 0.08 })
                .to(unit.sprite.scale, { x: 1, y: 1, duration: 0.15, ease: 'elastic.out(1, 0.5)' });
            
            // Unit 2 reaction
            gsap.timeline()
                .to(blockingUnit.sprite.scale, { x: 0.8, y: 1.2, duration: 0.08 })
                .to(blockingUnit.sprite.scale, { x: 1, y: 1, duration: 0.15, ease: 'elastic.out(1, 0.5)' });
        };
        
        await stunBoth();
        await new Promise(r => setTimeout(r, 200));
    },
    
    // ==========================================
    // 강제 밀어내기 (특정 방향으로)
    // ==========================================
    async push(unit, targetX, targetZ) {
        if (!unit || !unit.sprite || unit.hp <= 0) return false;
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
            gsap.to(unit.sprite, {
                x: newPos.x,
                y: newPos.y,
                duration: 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    unit.sprite.zIndex = Math.floor(newPos.y);
                    resolve(true);
                }
            });
        });
    },
    
    // ==========================================
    // 끌어당기기
    // ==========================================
    async pull(unit, towardUnit, cells = 1) {
        if (!unit || !unit.sprite || unit.hp <= 0) return false;
        if (!towardUnit) return false;
        
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
            gsap.timeline()
                .to(unit.sprite.scale, { x: 1.2, y: 0.85, duration: 0.1 })
                .to(unit.sprite, {
                    x: newPos.x,
                    y: newPos.y,
                    duration: 0.25,
                    ease: 'power3.in'
                }, '<')
                .to(unit.sprite.scale, { x: 0.9, y: 1.1, duration: 0.1 })
                .to(unit.sprite.scale, { x: 1, y: 1, duration: 0.15, ease: 'elastic.out(1, 0.5)' })
                .call(() => {
                    unit.sprite.zIndex = Math.floor(newPos.y);
                    resolve(true);
                });
        });
    }
};

console.log('[KnockbackSystem] 넉백 시스템 로드 완료');
