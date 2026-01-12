// =====================================================
// Knockback System - 넉백 시스템
// =====================================================

const KnockbackSystem = {
    game: null,
    
    // 넉백 대미지 설정
    KNOCKBACK_DAMAGE: 2,      // 기본 넉백 대미지
    WALL_DAMAGE: 5,           // 벽 충돌 대미지
    COLLISION_DAMAGE: 3,      // 유닛 충돌 대미지 (양쪽)
    PULL_CRASH_DAMAGE: 2,     // 당기기 충돌 대미지
    
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
    
    // 넉백 중인 유닛 추적 (무한 재귀 방지)
    _knockbackInProgress: new Set(),
    
    // ==========================================
    // 넉백 실행 (1칸씩 반복 처리)
    // ==========================================
    async knockback(unit, direction = 1, cells = 1) {
        const posTarget = this.getPositionTarget(unit);
        if (!posTarget || unit.hp <= 0) return false;
        if (!this.game) return false;
        
        // ★ 무한 재귀 방지: 이미 넉백 중인 유닛이면 실패
        if (this._knockbackInProgress.has(unit)) {
            console.log(`[Knockback] ${unit.type} 이미 넉백 중 - 스킵`);
            return false;
        }
        
        this._knockbackInProgress.add(unit);
        
        const isEnemy = unit.team === 'enemy';
        const knockbackDir = isEnemy ? direction : -direction; // Enemies go right (+X), allies go left (-X)
        
        let movedCells = 0;
        let hitWall = false;
        let hitUnit = false;
        
        try {
            // ★ 1칸씩 반복 처리 (2칸 이상 넉백도 제대로 처리)
            for (let i = 0; i < cells; i++) {
                if (unit.hp <= 0) break;  // 사망 체크
                
                const nextGridX = unit.gridX + knockbackDir;
                
                // 벽 체크
                if (nextGridX < 0 || nextGridX >= this.game.arena.width) {
                    hitWall = true;
                    break;
                }
                
                // 유닛 충돌 체크
                const allUnits = [...this.game.state.playerUnits, ...this.game.state.enemyUnits];
                const blockingUnit = allUnits.find(u => 
                    u !== unit && u.hp > 0 && u.gridX === nextGridX && u.gridZ === unit.gridZ
                );
                
                if (blockingUnit) {
                    // Chain knockback - push the blocking unit 1 cell
                    const chainSuccess = await this.knockback(blockingUnit, direction, 1);
                    if (!chainSuccess) {
                        // Blocking unit couldn't move, collision!
                        await this.collisionImpact(unit, blockingUnit);
                        this.dealKnockbackDamage(unit, this.COLLISION_DAMAGE, 'collision');
                        this.dealKnockbackDamage(blockingUnit, this.COLLISION_DAMAGE, 'collision');
                        hitUnit = true;
                        break;
                    }
                }
                
                // 1칸 이동
                await this.executeKnockback(unit, nextGridX);
                movedCells++;
            }
            
            // 벽에 충돌
            if (hitWall) {
                await this.wallImpact(unit);
                this.dealKnockbackDamage(unit, this.WALL_DAMAGE, 'wall');
            }
            
            // 이동한 칸만큼 넉백 대미지 (이동 안했으면 0)
            if (movedCells > 0) {
                this.dealKnockbackDamage(unit, this.KNOCKBACK_DAMAGE * movedCells, 'knockback');
            }
        } finally {
            // ★ 넉백 완료 후 Set에서 제거
            this._knockbackInProgress.delete(unit);
        }
        
        console.log(`[Knockback] ${unit.type}: ${movedCells}/${cells}칸 이동, wall=${hitWall}, unit=${hitUnit}`);
        return movedCells > 0;
    },
    
    // ==========================================
    // ★ Hook Pull (갈고리 당기기) - 갈고리 스킬 전용!
    // 적을 플레이어 쪽으로 당김, 앞에 있던 적과 충돌하면 크래시 대미지!
    // ==========================================
    async hookPull(unit, crashDamage = 2) {
        const posTarget = this.getPositionTarget(unit);
        if (!posTarget || unit.hp <= 0) return { success: false, crashedUnits: [] };
        if (!this.game) return { success: false, crashedUnits: [] };
        
        const hero = this.game.state.hero;
        if (!hero) return { success: false, crashedUnits: [] };
        
        // 타겟 위치: 플레이어 바로 앞 (X+1)
        const targetGridX = hero.gridX + 1;
        const oldGridX = unit.gridX;
        
        console.log(`[Pull] ${unit.type}: gridX ${oldGridX} → ${targetGridX}`);
        
        // 이미 맨 앞이면 무시
        if (unit.gridX <= targetGridX) {
            console.log(`[Pull] 이미 앞에 있음`);
            return { success: false, crashedUnits: [] };
        }
        
        // ★ 경로에 있는 적들 찾기 (당겨지는 적이 지나가는 칸의 적들)
        const allEnemies = this.game.state.enemyUnits.filter(e => 
            e !== unit && e.hp > 0 && e.gridZ === unit.gridZ
        );
        
        // 경로에 있는 적들 (targetGridX ~ unit.gridX 사이)
        const enemiesInPath = allEnemies.filter(e => 
            e.gridX >= targetGridX && e.gridX < oldGridX
        ).sort((a, b) => a.gridX - b.gridX); // X 오름차순 정렬
        
        const crashedUnits = [];
        
        // ★ 각 적을 밀어내고 충돌 처리
        for (const enemy of enemiesInPath) {
            // 적을 한 칸 뒤로 밀기
            const newEnemyX = enemy.gridX + 1;
            
            // 밀린 자리에 다른 적이 있으면 체인 밀기
            if (newEnemyX < this.game.arena.width) {
                await this.executeKnockback(enemy, newEnemyX);
            }
            
            // ★ 크래시 대미지!
            crashedUnits.push(enemy);
            this.dealKnockbackDamage(enemy, crashDamage, 'crash');
            this.dealKnockbackDamage(unit, crashDamage, 'crash');
            
            // 충돌 이펙트
            await this.collisionImpact(unit, enemy);
        }
        
        // ★ 당겨지는 유닛을 최종 위치로 이동
        await this.executePull(unit, targetGridX);
        
        console.log(`[Pull] 완료! 충돌 적: ${crashedUnits.length}명`);
        
        return { success: true, crashedUnits };
    },
    
    // ==========================================
    // Pull 이동 실행 (당겨지는 애니메이션)
    // ==========================================
    async executePull(unit, newGridX) {
        const posTarget = this.getPositionTarget(unit);
        if (!posTarget || posTarget.destroyed) {
            unit.gridX = newGridX;
            unit.x = newGridX + 0.5;
            return;
        }
        
        const startX = posTarget.x;
        const startY = posTarget.y;
        
        unit.gridX = newGridX;
        unit.x = newGridX + 0.5;
        
        const newPos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!newPos) return;
        
        unit.isAnimating = true;
        
        // ★ 당겨지는 애니메이션 (빠르게 끌려옴)
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                // 끌려오면서 기울어짐
                .to(posTarget, {
                    x: newPos.x,
                    y: newPos.y,
                    duration: 0.2,
                    ease: 'power3.in'
                })
                .to(posTarget, {
                    rotation: -0.15,
                    duration: 0.1
                }, 0)
                // 착지하며 복원
                .to(posTarget, {
                    rotation: 0,
                    duration: 0.15,
                    ease: 'elastic.out(1, 0.5)'
                });
        });
        
        unit.isAnimating = false;
    },
    
    // ==========================================
    // 넉백 대미지 처리
    // ==========================================
    dealKnockbackDamage(unit, damage, type = 'knockback') {
        if (!unit || unit.hp <= 0 || damage <= 0) return;
        
        // ★ 대미지 적용 (플로터 없이 - 아래서 직접 표시)
        this.game.applyDamageWithoutFloater(unit, damage);
        
        // 대미지 숫자 표시 (넉백 타입별 색상)
        const posTarget = this.getPositionTarget(unit);
        if (typeof CombatEffects !== 'undefined' && posTarget) {
            const colors = {
                knockback: 'normal',
                wall: 'bash',      // 벽 충돌은 주황색
                collision: 'burn', // 유닛 충돌은 빨강
                crash: 'burn'      // 갈고리 충돌은 빨강
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
    // 벽 충돌 이펙트 - 벽에 부딪혀 튕겨나오는 연출
    // ==========================================
    async wallImpact(unit) {
        const posTarget = this.getPositionTarget(unit);
        const scaleTarget = unit.sprite;
        if (!posTarget || posTarget.destroyed) return;
        
        unit.isAnimating = true;
        const originalX = posTarget.x;
        const originalY = posTarget.y;
        const baseScale = unit.baseScale || scaleTarget?.baseScale || 1;
        
        // ★ 벽 충돌 VFX 생성
        this.createWallImpactVFX(originalX + 40, originalY);
        
        return new Promise(resolve => {
            if (!posTarget || posTarget.destroyed) {
                unit.isAnimating = false;
                resolve();
                return;
            }
            
            gsap.timeline()
                // 1. 벽에 꽝! 부딪힘 (벽 쪽으로 밀려감)
                .to(posTarget, { 
                    x: originalX + 35,
                    duration: 0.06,
                    ease: 'power2.in'
                })
                .call(() => {
                    // 충돌 순간 - 찌그러짐 + 화면 효과
                    if (scaleTarget && scaleTarget.scale) {
                        gsap.to(scaleTarget.scale, { 
                            x: baseScale * 0.5, 
                            y: baseScale * 1.5, 
                            duration: 0.05 
                        });
                    }
                    if (typeof CombatEffects !== 'undefined') {
                        CombatEffects.screenShake(12, 200);
                        CombatEffects.screenFlash('#ff6600', 120, 0.3);
                    }
                })
                // 잠시 벽에 붙어있음
                .to({}, { duration: 0.08 })
                
                // 2. 벽에서 튕겨나옴! (반대 방향으로 크게)
                .to(posTarget, { 
                    x: originalX - 60,
                    duration: 0.12,
                    ease: 'power2.out'
                })
                .call(() => {
                    // 튕겨나오며 스케일 복구 시작
                    if (scaleTarget && scaleTarget.scale) {
                        gsap.to(scaleTarget.scale, { 
                            x: baseScale * 1.2, 
                            y: baseScale * 0.8, 
                            duration: 0.1 
                        });
                    }
                }, null, '<')
                
                // 3. 다시 원래 자리로 돌아옴
                .to(posTarget, { 
                    x: originalX, 
                    duration: 0.2,
                    ease: 'power2.inOut'
                })
                .call(() => {
                    if (scaleTarget && scaleTarget.scale) {
                        gsap.to(scaleTarget.scale, { 
                            x: baseScale, 
                            y: baseScale, 
                            duration: 0.15,
                            ease: 'elastic.out(1, 0.5)'
                        });
                    }
                }, null, '<')
                
                // 완료
                .to({}, { duration: 0.1 })
                .call(() => {
                    unit.isAnimating = false;
                    resolve();
                });
        });
    },
    
    // ★ 벽 충돌 VFX (강력한 임팩트!)
    createWallImpactVFX(x, y) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.zIndex = 500;
        CombatEffects.container.addChild(container);
        
        // ★ 1. 강력한 플래시 (중앙 섬광)
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 80);
        flash.fill({ color: 0xffffff, alpha: 1 });
        container.addChild(flash);
        
        gsap.to(flash, {
            alpha: 0,
            duration: 0.15,
            ease: 'power2.out',
            onComplete: () => { if (!flash.destroyed) flash.destroy(); }
        });
        gsap.to(flash.scale, {
            x: 1.5,
            y: 1.5,
            duration: 0.15
        });
        
        // ★ 2. 다중 충격파 (3겹)
        for (let w = 0; w < 3; w++) {
            const shockwave = new PIXI.Graphics();
            shockwave.circle(0, 0, 15);
            shockwave.stroke({ width: 6 - w * 1.5, color: w === 0 ? 0xffffff : 0xffaa00, alpha: 1 });
            container.addChild(shockwave);
            
            const delay = w * 0.05;
            const maxRadius = 120 + w * 30;
            
            gsap.to(shockwave, {
                alpha: 0,
                duration: 0.35,
                delay: delay,
                onUpdate: function() {
                    if (shockwave.destroyed) return;
                    const progress = this.progress();
                    const radius = 15 + progress * maxRadius;
                    shockwave.clear();
                    shockwave.circle(0, 0, radius);
                    shockwave.stroke({ width: (6 - w * 1.5) * (1 - progress), color: w === 0 ? 0xffffff : 0xffaa00, alpha: 1 - progress });
                },
                onComplete: () => { if (!shockwave.destroyed) shockwave.destroy(); }
            });
        }
        
        // ★ 3. 충격 스파크 (방사형 선들)
        for (let i = 0; i < 12; i++) {
            const spark = new PIXI.Graphics();
            const angle = (i / 12) * Math.PI * 2 - Math.PI; // 왼쪽 위주
            const length = 30 + Math.random() * 50;
            
            spark.moveTo(0, 0);
            spark.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            spark.stroke({ width: 3 + Math.random() * 3, color: 0xffee88, alpha: 1 });
            container.addChild(spark);
            
            gsap.to(spark, {
                alpha: 0,
                x: Math.cos(angle) * 30,
                y: Math.sin(angle) * 30,
                duration: 0.2 + Math.random() * 0.1,
                ease: 'power2.out',
                onComplete: () => { if (!spark.destroyed) spark.destroy(); }
            });
        }
        
        // ★ 4. 대형 파편들 (더 많고, 더 크게)
        for (let i = 0; i < 15; i++) {
            const debris = new PIXI.Graphics();
            const size = 5 + Math.random() * 12;
            
            // 다양한 모양
            if (Math.random() > 0.5) {
                debris.rect(-size/2, -size/2, size, size * (0.5 + Math.random()));
            } else {
                debris.poly([0, -size/2, size/2, size/2, -size/2, size/2]);
            }
            debris.fill({ color: i < 5 ? 0xffddaa : 0xaa8866 });
            debris.rotation = Math.random() * Math.PI;
            container.addChild(debris);
            
            const angle = -Math.PI + (Math.random() - 0.3) * Math.PI; // 왼쪽으로 퍼짐
            const speed = 150 + Math.random() * 200;
            const targetX = Math.cos(angle) * speed;
            const targetY = Math.sin(angle) * speed * 0.6 + 80; // 중력으로 아래로
            
            gsap.to(debris, {
                x: targetX,
                y: targetY,
                rotation: debris.rotation + (Math.random() - 0.5) * 12,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => { if (!debris.destroyed) debris.destroy(); }
            });
        }
        
        // ★ 5. 큰 먼지 구름 (더 많고 크게)
        for (let i = 0; i < 10; i++) {
            const dust = new PIXI.Graphics();
            const baseSize = 15 + Math.random() * 25;
            dust.circle(0, 0, baseSize);
            dust.fill({ color: i < 3 ? 0xeeddcc : 0xccbbaa, alpha: 0.7 });
            dust.x = (Math.random() - 0.3) * 40;
            dust.y = (Math.random() - 0.5) * 60;
            container.addChild(dust);
            
            const delay = i * 0.02;
            gsap.to(dust, {
                x: dust.x - 80 - Math.random() * 100,
                y: dust.y + 20 + Math.random() * 40,
                alpha: 0,
                delay: delay,
                duration: 0.6 + Math.random() * 0.4,
                ease: 'power2.out',
                onComplete: () => { if (!dust.destroyed) dust.destroy(); }
            });
            
            gsap.to(dust.scale, {
                x: 3 + Math.random() * 2,
                y: 3 + Math.random() * 2,
                delay: delay,
                duration: 0.6,
                ease: 'power2.out'
            });
        }
        
        // ★ 6. 작은 불꽃/스파크 파티클
        for (let i = 0; i < 20; i++) {
            const sparkle = new PIXI.Graphics();
            sparkle.circle(0, 0, 2 + Math.random() * 4);
            sparkle.fill({ color: Math.random() > 0.5 ? 0xffff88 : 0xffaa44, alpha: 1 });
            container.addChild(sparkle);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            
            gsap.to(sparkle, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed * 0.7 + 20,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.3,
                ease: 'power3.out',
                onComplete: () => { if (!sparkle.destroyed) sparkle.destroy(); }
            });
        }
        
        // 컨테이너 정리
        setTimeout(() => {
            if (!container.destroyed) container.destroy({ children: true });
        }, 1500);
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
