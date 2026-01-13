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
        // 스파크 (spark) - 작은 전기 방전
        // ========================================
        async spark(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            let bonusDamage = 0;
            
            // 물 영역 콤보 체크
            if (typeof GridAOE !== 'undefined') {
                bonusDamage = GridAOE.checkLightningCombo(target.gridX, target.gridZ);
            }
            
            const totalDamage = cardDef.damage + bonusDamage;
            
            // 스파크 VFX
            await AnimSystem.playSparkVFX(game, attacker, target, totalDamage);
            
            // 데미지 적용
            game.dealDamage(target, totalDamage, null, cardDef);
            
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
    // 스파크 VFX 헬퍼 (handlers 외부)
    // ==========================================
    async playSparkVFX(game, attacker, target, damage) {
        if (!game.app) return;
        
        const attackerPos = attacker.container || attacker.sprite;
        const targetPos = target.container || target.sprite;
        if (!attackerPos || !targetPos) return;
        
        const startX = attackerPos.x + 50;
        const startY = attackerPos.y - 30;
        const endX = targetPos.x;
        const endY = targetPos.y - (target.sprite?.height || 60) / 2;
        
        // ========================================
        // 1. 전기 볼 (시작점에서 생성)
        // ========================================
        const sparkBall = new PIXI.Container();
        sparkBall.x = startX;
        sparkBall.y = startY;
        game.app.stage.addChild(sparkBall);
        
        // 코어
        const core = new PIXI.Graphics();
        core.beginFill(0xffffff, 1);
        core.drawCircle(0, 0, 8);
        core.endFill();
        sparkBall.addChild(core);
        
        // 글로우
        const glow = new PIXI.Graphics();
        glow.beginFill(0xffff44, 0.5);
        glow.drawCircle(0, 0, 20);
        glow.endFill();
        sparkBall.addChild(glow);
        
        // 외부 글로우
        const outerGlow = new PIXI.Graphics();
        outerGlow.beginFill(0x4488ff, 0.3);
        outerGlow.drawCircle(0, 0, 30);
        outerGlow.endFill();
        sparkBall.addChild(outerGlow);
        
        // ========================================
        // 2. 전기 아크 라인 (지그재그)
        // ========================================
        const arcContainer = new PIXI.Container();
        game.app.stage.addChild(arcContainer);
        
        // 전기 볼 이동 + 아크 생성
        await new Promise(resolve => {
            let arcTimer = 0;
            const duration = 0.25;
            
            const animate = () => {
                arcTimer += 0.016;
                const progress = Math.min(arcTimer / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                
                // 전기 볼 위치
                sparkBall.x = startX + (endX - startX) * eased;
                sparkBall.y = startY + (endY - startY) * eased;
                
                // 글로우 펄스
                const pulse = 1 + Math.sin(arcTimer * 30) * 0.3;
                glow.scale.x = pulse;
                glow.scale.y = pulse;
                
                // 랜덤 스파크 발사
                if (Math.random() < 0.4) {
                    const miniSpark = new PIXI.Graphics();
                    miniSpark.beginFill(0xffff88, 0.8);
                    miniSpark.drawCircle(0, 0, 2 + Math.random() * 2);
                    miniSpark.endFill();
                    miniSpark.x = sparkBall.x;
                    miniSpark.y = sparkBall.y;
                    game.app.stage.addChild(miniSpark);
                    
                    const angle = Math.random() * Math.PI * 2;
                    gsap.to(miniSpark, {
                        x: miniSpark.x + Math.cos(angle) * (20 + Math.random() * 30),
                        y: miniSpark.y + Math.sin(angle) * (15 + Math.random() * 20),
                        alpha: 0,
                        duration: 0.15,
                        onComplete: () => {
                            game.app.stage.removeChild(miniSpark);
                            miniSpark.destroy();
                        }
                    });
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
        
        // ========================================
        // 3. 충격 이펙트
        // ========================================
        // 전기 폭발
        for (let i = 0; i < 20; i++) {
            const spark = new PIXI.Graphics();
            const isWhite = Math.random() < 0.3;
            spark.beginFill(isWhite ? 0xffffff : 0xffff44, 0.9);
            spark.drawCircle(0, 0, 2 + Math.random() * 4);
            spark.endFill();
            
            spark.x = endX;
            spark.y = endY;
            game.app.stage.addChild(spark);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 50;
            
            gsap.to(spark, {
                x: endX + Math.cos(angle) * dist,
                y: endY + Math.sin(angle) * dist * 0.6,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    game.app.stage.removeChild(spark);
                    spark.destroy();
                }
            });
        }
        
        // 충격파 링
        const shockRing = new PIXI.Graphics();
        shockRing.lineStyle(3, 0xffff88, 0.8);
        shockRing.drawCircle(0, 0, 10);
        shockRing.x = endX;
        shockRing.y = endY;
        game.app.stage.addChild(shockRing);
        
        gsap.to(shockRing.scale, { x: 4, y: 2.5, duration: 0.3, ease: 'power2.out' });
        gsap.to(shockRing, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => {
                game.app.stage.removeChild(shockRing);
                shockRing.destroy();
            }
        });
        
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffff88', 100, 0.25);
            CombatEffects.screenShake(8, 150);
        }
        
        // 정리
        game.app.stage.removeChild(sparkBall);
        sparkBall.destroy({ children: true });
        game.app.stage.removeChild(arcContainer);
        arcContainer.destroy({ children: true });
        
        await new Promise(r => setTimeout(r, 100));
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
