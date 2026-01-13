// =====================================================
// Animation System - 범용 카드 애니메이션 시스템
// JSON의 anim.type을 보고 자동으로 연출 실행
// =====================================================

const AnimSystem = {
    game: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        console.log('[AnimSystem] 애니메이션 시스템 초기화 완료');
    },
    
    // ==========================================
    // 메인 실행 함수 - JSON의 anim.type으로 자동 매핑
    // ==========================================
    async play(animType, attacker, target, cardDef, options = {}) {
        console.log(`[AnimSystem] 연출 실행: ${animType}`);
        
        const handler = this.handlers[animType];
        if (handler) {
            return await handler.call(this, attacker, target, cardDef, options);
        } else {
            console.warn(`[AnimSystem] 알 수 없는 애니메이션 타입: ${animType}, 기본 타격 실행`);
            return await this.handlers.slash.call(this, attacker, target, cardDef, options);
        }
    },
    
    // ==========================================
    // 애니메이션 핸들러들 (anim.type → 함수 매핑)
    // ==========================================
    handlers: {
        // ========================================
        // 기본 슬래시 (strike, 기본값)
        // ========================================
        async slash(attacker, target, cardDef, options) {
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.meleeAttack(attacker, target, cardDef.damage, {
                    isEnemy: options.isEnemy || false
                });
            }
        },
        
        // ========================================
        // 강타 (bash)
        // ========================================
        async bash(attacker, target, cardDef, options) {
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.bashAttack(attacker, target, cardDef.damage, {
                    isEnemy: options.isEnemy || false
                });
            }
        },
        
        // ========================================
        // 휘두르기 (cleave) - bash와 동일하지만 확장 가능
        // ========================================
        async cleave(attacker, target, cardDef, options) {
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.bashAttack(attacker, target, cardDef.damage, {
                    isEnemy: options.isEnemy || false
                });
            }
        },
        
        // ========================================
        // 연속 찌르기 (flurry)
        // ========================================
        async flurry(attacker, target, cardDef, options) {
            const hits = cardDef.hits || 3;
            
            if (typeof UnitCombat !== 'undefined') {
                for (let i = 0; i < hits; i++) {
                    if (target.hp <= 0) break;
                    
                    // 브레이크 시스템
                    if (typeof BreakSystem !== 'undefined') {
                        BreakSystem.onAttack(target, cardDef, 1, i);
                    }
                    
                    await UnitCombat.flurryAttack(attacker, target, cardDef.damage, {
                        isEnemy: options.isEnemy || false
                    });
                    
                    if (i < hits - 1) {
                        await new Promise(r => setTimeout(r, 50));
                    }
                }
            }
            
            return { skipDamage: true, skipBreak: true }; // 내부에서 처리됨
        },
        
        // ========================================
        // 돌진 (rush)
        // ========================================
        async rush(attacker, target, cardDef, options) {
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.rushAttack(attacker, target, cardDef.damage, {
                    hits: cardDef.hits || 3,
                    knockbackPerHit: cardDef.knockbackPerHit || 1,
                    isEnemy: options.isEnemy || false,
                    cardDef: cardDef
                });
            }
            
            return { skipDamage: true, skipKnockback: true }; // 내부에서 처리됨
        },
        
        // ========================================
        // 비열한 습격 (sneakAttack)
        // ========================================
        async sneak(attacker, target, cardDef, options) {
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.sneakAttack(attacker, target, cardDef.damage, {
                    bleed: cardDef.bleed || 2,
                    isEnemy: options.isEnemy || false
                });
            }
            
            return { skipDamage: true, skipBleed: true }; // 내부에서 처리됨
        },
        
        // ========================================
        // 물결 (wave) - 워터웨이브/타이달크래시
        // ========================================
        async wave(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            const isTidal = cardDef.cost >= 3; // 코스트로 구분
            const gridZ = target.gridZ;
            const targetX = target.gridX; // ★ 타겟 위치 기준!
            const knockbackDir = 1;
            const lineLength = cardDef.lineAttack || cardDef.aoe?.width || 3;
            
            console.log(`[AnimSystem.wave] 타겟: X=${targetX}, Z=${gridZ}, 길이=${lineLength}`);
            
            // 1. 전진 애니메이션
            const heroPos = attacker.container || attacker.sprite;
            if (heroPos) {
                const originalX = heroPos.x;
                const dashDist = isTidal ? 100 : 80;
                await gsap.to(heroPos, {
                    x: originalX + dashDist,
                    duration: isTidal ? 0.2 : 0.15,
                    ease: 'power2.in'
                });
                
                gsap.to(heroPos, {
                    x: originalX,
                    duration: 0.3,
                    ease: 'power2.out',
                    delay: isTidal ? 0.3 : 0.2
                });
            }
            
            // 2. VFX (타겟 위치 기준)
            if (game.showWaterWaveVFX) {
                game.showWaterWaveVFX(targetX, gridZ, knockbackDir, lineLength, isTidal);
            }
            
            if (isTidal && game.showTidalCrashVFX) {
                setTimeout(() => {
                    game.showTidalCrashVFX(targetX, gridZ, cardDef.aoe?.depth || 3);
                }, 150);
            }
            
            // 3. 타겟 위치부터 라인 범위 타격
            const enemies = game.state?.enemyUnits || [];
            const affectedEnemies = [];
            
            for (let dx = 0; dx < lineLength; dx++) {
                const checkX = targetX + dx;
                if (checkX >= 10) continue;
                
                for (const enemy of enemies) {
                    if (enemy.hp > 0 && enemy.gridX === checkX && enemy.gridZ === gridZ) {
                        affectedEnemies.push({ enemy, delay: dx * 60 });
                    }
                }
            }
            
            // 순차 타격
            for (const { enemy, delay } of affectedEnemies) {
                await new Promise(r => setTimeout(r, delay > 0 ? delay : 50));
                
                game.dealDamage(enemy, cardDef.damage, null, cardDef);
                
                if (cardDef.knockback && enemy.hp > 0 && typeof KnockbackSystem !== 'undefined') {
                    KnockbackSystem.knockback(enemy, knockbackDir, cardDef.knockback);
                }
                
                if (typeof BreakSystem !== 'undefined') {
                    BreakSystem.onAttack(enemy, cardDef, 1, 0);
                }
            }
            
            // 4. 물 영역 생성 (타겟 위치부터)
            if (cardDef.createZone && typeof GridAOE !== 'undefined') {
                const zoneLength = cardDef.createZoneLength || lineLength;
                GridAOE.createWaterWaveLine(targetX, gridZ, knockbackDir, zoneLength);
            }
            
            await new Promise(r => setTimeout(r, 300));
            
            return { skipDamage: true, skipKnockback: true, skipBreak: true, skipZone: true };
        },
        
        // ========================================
        // 번개 (lightning)
        // ========================================
        async lightning(attacker, target, cardDef, options) {
            let bonusDamage = 0;
            
            // 물 영역 콤보 체크 (타겟 위치)
            console.log(`[AnimSystem.lightning] 타겟 위치: X=${target.gridX}, Z=${target.gridZ}`);
            if (typeof GridAOE !== 'undefined') {
                // 디버그: 모든 물 영역 출력
                const waterZones = GridAOE.zones.filter(z => z.type === 'water');
                console.log(`[AnimSystem.lightning] 물 영역 ${waterZones.length}개:`, 
                    waterZones.map(z => `(${z.gridX},${z.gridZ})`).join(', '));
                
                bonusDamage = GridAOE.checkLightningCombo(target.gridX, target.gridZ);
                console.log(`[AnimSystem.lightning] 콤보 보너스: ${bonusDamage}`);
            }
            
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.lightningAttack(attacker, target, cardDef.damage + bonusDamage, {
                    chainReduction: cardDef.chainDamageReduction || 2,
                    isEnemy: options.isEnemy || false
                });
            }
            
            return { skipDamage: true };
        },
        
        // ========================================
        // 스파크 (spark) - 연쇄 전기 방전
        // ========================================
        async spark(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            const chainRange = cardDef.chainRange || 1;
            const chainReduction = cardDef.chainDamageReduction || 1;
            const enemies = game.state?.enemyUnits || [];
            
            // 타격 대상 수집 (연쇄 포함)
            const hitTargets = [{ unit: target, damage: cardDef.damage, order: 0 }];
            const hitSet = new Set([target]);
            
            // 인접 적 찾기 (1칸 범위)
            for (const enemy of enemies) {
                if (enemy.hp <= 0 || hitSet.has(enemy)) continue;
                
                const dx = Math.abs(enemy.gridX - target.gridX);
                const dz = Math.abs(enemy.gridZ - target.gridZ);
                
                // 1칸 인접 (상하좌우 + 대각선)
                if (dx <= chainRange && dz <= chainRange && (dx + dz) > 0) {
                    hitTargets.push({ 
                        unit: enemy, 
                        damage: Math.max(1, cardDef.damage - chainReduction),
                        order: 1
                    });
                    hitSet.add(enemy);
                }
            }
            
            // 첫 번째 타겟에 스파크 VFX
            await AnimSystem.playSparkVFX(game, attacker, target, cardDef.damage);
            
            // 메인 타겟 데미지 + 물 콤보
            let bonusDamage = 0;
            if (typeof GridAOE !== 'undefined') {
                bonusDamage = GridAOE.checkLightningCombo(target.gridX, target.gridZ);
            }
            game.dealDamage(target, cardDef.damage + bonusDamage, null, cardDef);
            
            // 연쇄 타겟들에 전기 아크 + 데미지
            for (let i = 1; i < hitTargets.length; i++) {
                const chainTarget = hitTargets[i];
                await new Promise(r => setTimeout(r, 80));
                
                // 연쇄 아크 VFX
                AnimSystem.playChainArc(game, target, chainTarget.unit);
                
                // 연쇄 대상 물 콤보 체크
                let chainBonus = 0;
                if (typeof GridAOE !== 'undefined') {
                    chainBonus = GridAOE.checkLightningCombo(chainTarget.unit.gridX, chainTarget.unit.gridZ);
                }
                game.dealDamage(chainTarget.unit, chainTarget.damage + chainBonus, null, cardDef);
            }
            
            return { skipDamage: true };
        },
        
        // ========================================
        // 투사체 (projectile) - 파이어볼, 파이어애로우 등
        // ========================================
        async projectile(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.rangedAttack(attacker, target, cardDef.damage, {
                    projectileType: cardDef.projectileType || 'default',
                    projectileColor: options.projectileColor || 0xffaa00,
                    createZone: cardDef.createZone || null,
                    isEnemy: options.isEnemy || false,
                    onHit: options.onHit
                });
            }
            
            return { skipDamage: true };
        },
        
        // ========================================
        // 스피어 투척 (spear)
        // ========================================
        async spear(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            // 거리 계산
            const distance = Math.abs(target.gridX - attacker.gridX);
            const distanceBonus = (cardDef.distanceBonus || 0) * distance;
            const totalDamage = cardDef.damage + distanceBonus;
            
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.rangedAttack(attacker, target, totalDamage, {
                    projectileType: 'spear',
                    projectileColor: 0xccaa77,
                    projectileSize: 12,
                    gridDistance: distance,
                    isEnemy: options.isEnemy || false,
                    onHit: options.onHit
                });
                
                // 거리 보너스 플로터
                if (distanceBonus > 0 && typeof CombatEffects !== 'undefined') {
                    const targetPos = target.container || target.sprite;
                    setTimeout(() => {
                        CombatEffects.showDamageNumber(
                            targetPos.x + 30,
                            targetPos.y - 60,
                            distanceBonus,
                            'distance'
                        );
                    }, 100);
                }
            }
            
            return { skipDamage: true };
        },
        
        // ========================================
        // 갈고리 (hook)
        // ========================================
        async hook(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.hookAttack(attacker, target, cardDef.damage, {
                    pullDistance: cardDef.pull || 99,
                    crashDamage: cardDef.crashDamage || 0,
                    isEnemy: options.isEnemy || false
                });
            }
            
            return { skipDamage: true };
        }
    },
    
    // ==========================================
    // 스파크 VFX 헬퍼 (3D + 2D 하이브리드)
    // ==========================================
    async playSparkVFX(game, attacker, target, damage) {
        if (!game.app) return;
        
        const attackerPos = attacker.container || attacker.sprite;
        const targetPos = target.container || target.sprite;
        if (!attackerPos || !targetPos) return;
        
        const startX = attackerPos.x + 60;
        const startY = attackerPos.y - 50;
        const endX = targetPos.x;
        const endY = targetPos.y - (target.sprite?.height || 60) / 2;
        
        // ========================================
        // 1. 시전 이펙트 (손에서 전기 모으기)
        // ========================================
        const chargeContainer = new PIXI.Container();
        chargeContainer.x = startX;
        chargeContainer.y = startY;
        game.app.stage.addChild(chargeContainer);
        
        // 전기 코어
        const core = new PIXI.Graphics();
        core.beginFill(0xffffff, 1);
        core.drawCircle(0, 0, 8);
        core.endFill();
        chargeContainer.addChild(core);
        
        // 차지 스파크
        for (let i = 0; i < 6; i++) {
            const miniArc = new PIXI.Graphics();
            miniArc.lineStyle(2, 0xffff44, 0.8);
            const angle = (i / 6) * Math.PI * 2;
            const len = 15 + Math.random() * 10;
            miniArc.moveTo(0, 0);
            miniArc.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            chargeContainer.addChild(miniArc);
        }
        
        gsap.to(chargeContainer.scale, { x: 1.5, y: 1.5, duration: 0.08, yoyo: true, repeat: 1 });
        
        await new Promise(r => setTimeout(r, 60));
        
        // ========================================
        // 2. 메인 전기 아크 (시작 → 타겟)
        // ========================================
        const arcs = [];
        const drawLightningArc = (sx, sy, ex, ey, segments, color, width, jitter) => {
            const arc = new PIXI.Graphics();
            arc.lineStyle(width, color, 1);
            arc.moveTo(sx, sy);
            
            const dx = ex - sx;
            const dy = ey - sy;
            
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = sx + dx * t + (Math.random() - 0.5) * jitter;
                const y = sy + dy * t + (Math.random() - 0.5) * jitter * 0.6;
                arc.lineTo(x, y);
            }
            arc.lineTo(ex, ey);
            
            game.app.stage.addChild(arc);
            arcs.push(arc);
            return arc;
        };
        
        // 메인 아크
        drawLightningArc(startX, startY, endX, endY, 10, 0xffffff, 6, 50);
        drawLightningArc(startX, startY, endX, endY, 12, 0xffff44, 4, 45);
        drawLightningArc(startX, startY, endX, endY, 8, 0x88ddff, 3, 55);
        
        // ========================================
        // 3. 타겟 위치 갈래번개 (핵심!)
        // ========================================
        const branchCount = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < branchCount; i++) {
            // 타겟 중심에서 뻗어나가는 갈래번개
            const angle = (i / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const branchLen = 50 + Math.random() * 70;
            const branchEndX = endX + Math.cos(angle) * branchLen;
            const branchEndY = endY + Math.sin(angle) * branchLen * 0.5; // 3D 느낌 위해 Y 압축
            
            // 굵은 갈래
            drawLightningArc(endX, endY, branchEndX, branchEndY, 6, 0xffffff, 4, 25);
            drawLightningArc(endX, endY, branchEndX, branchEndY, 5, 0xffff44, 3, 20);
            
            // 2차 분기 (갈래에서 더 갈라지는 번개)
            if (Math.random() < 0.6) {
                const midT = 0.5 + Math.random() * 0.3;
                const midX = endX + (branchEndX - endX) * midT;
                const midY = endY + (branchEndY - endY) * midT;
                const subAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
                const subLen = 25 + Math.random() * 35;
                const subEndX = midX + Math.cos(subAngle) * subLen;
                const subEndY = midY + Math.sin(subAngle) * subLen * 0.5;
                
                drawLightningArc(midX, midY, subEndX, subEndY, 4, 0xffffaa, 2, 15);
            }
        }
        
        // ========================================
        // 4. 전기 코어 (타겟 중심)
        // ========================================
        const impactCore = new PIXI.Container();
        impactCore.x = endX;
        impactCore.y = endY;
        game.app.stage.addChild(impactCore);
        
        // 밝은 코어
        const brightCore = new PIXI.Graphics();
        brightCore.beginFill(0xffffff, 1);
        brightCore.drawCircle(0, 0, 20);
        brightCore.endFill();
        impactCore.addChild(brightCore);
        
        // 노란 글로우
        const yellowGlow = new PIXI.Graphics();
        yellowGlow.beginFill(0xffff44, 0.7);
        yellowGlow.drawCircle(0, 0, 35);
        yellowGlow.endFill();
        impactCore.addChild(yellowGlow);
        
        // 파란 외곽
        const blueGlow = new PIXI.Graphics();
        blueGlow.beginFill(0x4488ff, 0.4);
        blueGlow.drawCircle(0, 0, 50);
        blueGlow.endFill();
        impactCore.addChild(blueGlow);
        
        // 코어 펄스
        gsap.to(impactCore.scale, { x: 1.8, y: 1.8, duration: 0.1, ease: 'power2.out' });
        gsap.to(impactCore, {
            alpha: 0,
            duration: 0.25,
            delay: 0.05,
            onComplete: () => {
                game.app.stage.removeChild(impactCore);
                impactCore.destroy({ children: true });
            }
        });
        
        // ========================================
        // 5. 전기 파티클 (타겟 주변)
        // ========================================
        for (let i = 0; i < 25; i++) {
            const spark = new PIXI.Graphics();
            const colors = [0xffffff, 0xffffaa, 0xffff44, 0x88ddff];
            spark.beginFill(colors[Math.floor(Math.random() * colors.length)], 1);
            
            // 길쭉한 스파크
            const sparkLen = 4 + Math.random() * 8;
            spark.drawEllipse(0, 0, sparkLen, 2);
            spark.endFill();
            
            spark.x = endX;
            spark.y = endY;
            spark.rotation = Math.random() * Math.PI * 2;
            game.app.stage.addChild(spark);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            
            gsap.to(spark, {
                x: endX + Math.cos(angle) * dist,
                y: endY + Math.sin(angle) * dist * 0.5,
                rotation: spark.rotation + Math.PI,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    game.app.stage.removeChild(spark);
                    spark.destroy();
                }
            });
        }
        
        // ========================================
        // 6. 충격파 링
        // ========================================
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            const colors = [0xffffff, 0xffff44, 0x88ddff];
            ring.lineStyle(4 - i, colors[i], 0.9);
            ring.drawEllipse(0, 0, 15, 10); // 3D 느낌의 타원
            ring.x = endX;
            ring.y = endY;
            game.app.stage.addChild(ring);
            
            gsap.to(ring.scale, { 
                x: 6 - i, 
                y: 4 - i * 0.5, 
                duration: 0.35, 
                ease: 'power2.out', 
                delay: i * 0.04 
            });
            gsap.to(ring, {
                alpha: 0,
                duration: 0.35,
                delay: i * 0.04,
                onComplete: () => {
                    game.app.stage.removeChild(ring);
                    ring.destroy();
                }
            });
        }
        
        // ========================================
        // 7. 화면 효과
        // ========================================
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffffcc', 150, 0.15);
            CombatEffects.screenShake(12, 180);
        }
        
        // 아크 페이드아웃
        gsap.to(arcs, {
            alpha: 0,
            duration: 0.2,
            delay: 0.05,
            onComplete: () => {
                arcs.forEach(arc => {
                    game.app.stage.removeChild(arc);
                    arc.destroy();
                });
            }
        });
        
        // 시전 이펙트 정리
        gsap.to(chargeContainer, {
            alpha: 0,
            duration: 0.1,
            onComplete: () => {
                game.app.stage.removeChild(chargeContainer);
                chargeContainer.destroy({ children: true });
            }
        });
        
        await new Promise(r => setTimeout(r, 200));
    },
    
    // ==========================================
    // 연쇄 아크 VFX (타겟 간 전기 연결)
    // ==========================================
    playChainArc(game, fromUnit, toUnit) {
        if (!game.app) return;
        
        const fromPos = fromUnit.container || fromUnit.sprite;
        const toPos = toUnit.container || toUnit.sprite;
        if (!fromPos || !toPos) return;
        
        const sx = fromPos.x;
        const sy = fromPos.y - (fromUnit.sprite?.height || 60) / 2;
        const ex = toPos.x;
        const ey = toPos.y - (toUnit.sprite?.height || 60) / 2;
        
        const arcs = [];
        
        // 지그재그 아크 그리기
        const drawArc = (startX, startY, endX, endY, segments, color, width, jitter) => {
            const arc = new PIXI.Graphics();
            arc.lineStyle(width, color, 1);
            arc.moveTo(startX, startY);
            
            const dx = endX - startX;
            const dy = endY - startY;
            
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = startX + dx * t + (Math.random() - 0.5) * jitter;
                const y = startY + dy * t + (Math.random() - 0.5) * jitter * 0.6;
                arc.lineTo(x, y);
            }
            arc.lineTo(endX, endY);
            
            game.app.stage.addChild(arc);
            arcs.push(arc);
            return arc;
        };
        
        // 메인 연쇄 아크
        drawArc(sx, sy, ex, ey, 8, 0xffffff, 5, 30);
        drawArc(sx, sy, ex, ey, 6, 0xffff44, 4, 25);
        drawArc(sx, sy, ex, ey, 10, 0x88ddff, 3, 35);
        
        // 타겟 위치 갈래번개 (작은 버전)
        const branchCount = 4;
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const branchLen = 30 + Math.random() * 40;
            const branchEndX = ex + Math.cos(angle) * branchLen;
            const branchEndY = ey + Math.sin(angle) * branchLen * 0.5;
            
            drawArc(ex, ey, branchEndX, branchEndY, 4, 0xffff88, 2, 15);
        }
        
        // 연쇄 충격 코어
        const chainCore = new PIXI.Graphics();
        chainCore.beginFill(0xffffff, 0.9);
        chainCore.drawCircle(0, 0, 15);
        chainCore.endFill();
        chainCore.x = ex;
        chainCore.y = ey;
        game.app.stage.addChild(chainCore);
        
        gsap.to(chainCore.scale, { x: 2, y: 2, duration: 0.1, ease: 'power2.out' });
        gsap.to(chainCore, {
            alpha: 0,
            duration: 0.2,
            onComplete: () => {
                game.app.stage.removeChild(chainCore);
                chainCore.destroy();
            }
        });
        
        // 연쇄 충격 파티클
        for (let i = 0; i < 15; i++) {
            const spark = new PIXI.Graphics();
            const colors = [0xffffff, 0xffff44, 0x88ddff];
            spark.beginFill(colors[Math.floor(Math.random() * colors.length)], 1);
            const sparkLen = 3 + Math.random() * 5;
            spark.drawEllipse(0, 0, sparkLen, 1.5);
            spark.endFill();
            spark.x = ex;
            spark.y = ey;
            spark.rotation = Math.random() * Math.PI * 2;
            game.app.stage.addChild(spark);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 40;
            gsap.to(spark, {
                x: ex + Math.cos(angle) * dist,
                y: ey + Math.sin(angle) * dist * 0.5,
                rotation: spark.rotation + Math.PI,
                alpha: 0,
                duration: 0.25,
                ease: 'power2.out',
                onComplete: () => {
                    game.app.stage.removeChild(spark);
                    spark.destroy();
                }
            });
        }
        
        // 연쇄 충격파 링
        const chainRing = new PIXI.Graphics();
        chainRing.lineStyle(3, 0xffff88, 0.8);
        chainRing.drawEllipse(0, 0, 12, 8);
        chainRing.x = ex;
        chainRing.y = ey;
        game.app.stage.addChild(chainRing);
        
        gsap.to(chainRing.scale, { x: 4, y: 3, duration: 0.25, ease: 'power2.out' });
        gsap.to(chainRing, {
            alpha: 0,
            duration: 0.25,
            onComplete: () => {
                game.app.stage.removeChild(chainRing);
                chainRing.destroy();
            }
        });
        
        // 작은 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffffaa', 80, 0.1);
            CombatEffects.screenShake(6, 100);
        }
        
        // 아크 페이드아웃
        gsap.to(arcs, {
            alpha: 0,
            duration: 0.18,
            onComplete: () => {
                arcs.forEach(arc => {
                    game.app.stage.removeChild(arc);
                    arc.destroy();
                });
            }
        });
    },
    
    // ==========================================
    // 연출 타입 존재 여부 확인
    // ==========================================
    hasHandler(animType) {
        return !!this.handlers[animType];
    },
    
    // ==========================================
    // 커스텀 핸들러 등록 (확장용)
    // ==========================================
    registerHandler(animType, handler) {
        this.handlers[animType] = handler;
        console.log(`[AnimSystem] 핸들러 등록: ${animType}`);
    }
};

console.log('[AnimSystem] 애니메이션 시스템 로드 완료');
