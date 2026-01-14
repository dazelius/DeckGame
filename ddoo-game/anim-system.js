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
                    isEnemy: options.isEnemy || false,
                    dashOffset: cardDef.anim?.dashOffset || 0,  // ★ JSON에서 대시 오프셋
                    vfx: cardDef.anim?.vfx || null  // ★ JSON에서 VFX 설정
                });
            }
        },
        
        // ========================================
        // 강타 (bash)
        // ========================================
        async bash(attacker, target, cardDef, options) {
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.bashAttack(attacker, target, cardDef.damage, {
                    isEnemy: options.isEnemy || false,
                    dashOffset: cardDef.anim?.dashOffset || 0,
                    vfx: cardDef.anim?.vfx || null
                });
            }
        },
        
        // ========================================
        // 휘두르기 (cleave) - bash와 동일하지만 확장 가능
        // ========================================
        async cleave(attacker, target, cardDef, options) {
            if (typeof UnitCombat !== 'undefined') {
                await UnitCombat.bashAttack(attacker, target, cardDef.damage, {
                    isEnemy: options.isEnemy || false,
                    dashOffset: cardDef.anim?.dashOffset || 0,
                    vfx: cardDef.anim?.vfx || null
                });
            }
        },
        
        // ========================================
        // 연속 찌르기 (flurry) - 대시 1번 + 찌르기 N번
        // ========================================
        async flurry(attacker, target, cardDef, options) {
            const hits = cardDef.hits || 3;
            
            // ★ JSON에서 애니메이션 설정 로드 (속도 늦춤!)
            const anim = cardDef.anim || {};
            const animConfig = {
                dash: anim.dash || 0.4,        // 대시 시간 (0.28 → 0.4)
                stab: anim.stab || 0.12,       // 찌르기 시간 (0.08 → 0.12)
                interval: anim.interval || 0.1, // 히트 간격 (0.06 → 0.1)
                ease: anim.ease || 'power2.inOut',
                vfx: anim.vfx || 'stab'        // VFX 타입
            };
            
            if (typeof UnitCombat !== 'undefined') {
                let actualHits = 0;
                
                for (let i = 0; i < hits; i++) {
                    // ★ 타겟이 죽으면 마지막 히트로 처리 후 종료
                    if (target.hp <= 0) {
                        // 이미 대시했으면 복귀만 해야 함
                        if (actualHits > 0) {
                            await UnitCombat.flurryAttack(attacker, target, 0, {
                                isEnemy: options.isEnemy || false,
                                hitIndex: i,
                                isLastHit: true,  // ★ 강제 마지막 히트로 복귀!
                                animConfig: animConfig,
                                skipDamage: true  // 데미지 스킵
                            });
                        }
                        break;
                    }
                    
                    actualHits++;
                    
                    // 브레이크 시스템
                    if (typeof BreakSystem !== 'undefined') {
                        BreakSystem.onAttack(target, cardDef, 1, i);
                    }
                    
                    // ★ hitIndex, isLastHit, animConfig 전달
                    await UnitCombat.flurryAttack(attacker, target, cardDef.damage, {
                        isEnemy: options.isEnemy || false,
                        hitIndex: i,
                        isLastHit: (i === hits - 1),
                        animConfig: animConfig  // ★ JSON 설정 전달
                    });
                    
                    // 히트 사이 딜레이 (JSON에서 로드, 마지막 제외)
                    if (i < hits - 1 && target.hp > 0) {
                        await new Promise(r => setTimeout(r, animConfig.interval * 1000));
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
                    cardDef: cardDef,
                    dashOffset: cardDef.anim?.dashOffset || 0
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
                    isEnemy: options.isEnemy || false,
                    dashOffset: cardDef.anim?.dashOffset || 0
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
                    chainDelay: cardDef.anim?.chainDelay || 350,
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
            
            // 연쇄 타겟들에 전기 아크 + 데미지 (JSON에서 타이밍 로드)
            const chainDelay = cardDef.anim?.chainDelay || 300;
            const hitDelay = cardDef.anim?.hitDelay || 100;
            
            for (let i = 1; i < hitTargets.length; i++) {
                const chainTarget = hitTargets[i];
                await new Promise(r => setTimeout(r, chainDelay));
                
                // 연쇄 아크 VFX
                AnimSystem.playChainArc(game, target, chainTarget.unit);
                
                // 연쇄 대상 물 콤보 체크
                let chainBonus = 0;
                if (typeof GridAOE !== 'undefined') {
                    chainBonus = GridAOE.checkLightningCombo(chainTarget.unit.gridX, chainTarget.unit.gridZ);
                }
                
                // 히트 딜레이 후 데미지
                await new Promise(r => setTimeout(r, hitDelay));
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
            
            // ★ JSON에서 애니메이션 설정 로드
            const anim = cardDef.anim || {};
            const hits = cardDef.hits || 1;
            const interval = (anim.interval || 0.15) * 1000;  // 연사 간격 (초 → ms)
            const spreadY = anim.spreadY || 0;                // Y축 분산
            const speedMult = anim.speedMult || 1.0;          // 속도 배율
            
            if (typeof UnitCombat !== 'undefined') {
                for (let i = 0; i < hits; i++) {
                    // ★ 타겟이 죽으면 중단
                    if (target.hp <= 0) break;
                    
                    // ★ Y축 분산 (여러 발일 때 약간씩 위아래로)
                    const offsetY = hits > 1 ? (i - (hits - 1) / 2) * spreadY : 0;
                    
                    await UnitCombat.rangedAttack(attacker, target, cardDef.damage, {
                        projectileType: cardDef.projectileType || anim.projectileType || 'default',
                        projectileColor: options.projectileColor || 0xffaa00,
                        createZone: i === hits - 1 ? (cardDef.createZone || null) : null,
                        isEnemy: options.isEnemy || false,
                        onHit: options.onHit,
                        hitIndex: i,
                        offsetY: offsetY,        // ★ Y축 오프셋
                        speedMult: speedMult     // ★ 속도 배율
                    });
                    
                    // ★ 연사 간격 (마지막 제외)
                    if (i < hits - 1 && target.hp > 0) {
                        await new Promise(r => setTimeout(r, interval));
                    }
                }
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
            
            // game.heroHookAnimation 사용
            if (game.heroHookAnimation) {
                await game.heroHookAnimation(attacker, target, cardDef.damage, cardDef.crashDamage || 2, {
                    onHit: options.onHit
                });
            }
            
            return { skipDamage: true };
        },
        
        // ========================================
        // 비 (rain) - 환경 카드
        // ========================================
        async rain(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            const duration = cardDef.duration || 3;
            
            // 환경 시스템 활성화
            if (typeof EnvironmentSystem !== 'undefined') {
                EnvironmentSystem.activate('rain', duration);
            }
            
            return { skipDamage: true, skipTarget: true };
        },
        
        // ========================================
        // 가뭄 (drought) - 환경 카드
        // ========================================
        async drought(attacker, target, cardDef, options) {
            const game = AnimSystem.game;
            if (!game) return;
            
            const duration = cardDef.duration || 3;
            
            // 환경 시스템 활성화
            if (typeof EnvironmentSystem !== 'undefined') {
                EnvironmentSystem.activate('drought', duration);
            }
            
            return { skipDamage: true, skipTarget: true };
        }
    },
    
    // ==========================================
    // 스파크 VFX - Lightning 스타일 갈래번개
    // ==========================================
    async playSparkVFX(game, attacker, target, damage) {
        // CombatEffects.container 사용 (Lightning과 동일)
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) {
            console.warn('[Spark VFX] CombatEffects.container 없음');
            return;
        }
        
        // UnitCombat의 위치 함수 사용 (Lightning과 동일)
        let targetPos;
        if (typeof UnitCombat !== 'undefined' && UnitCombat.getPositionTarget) {
            targetPos = UnitCombat.getPositionTarget(target);
        } else {
            const targetSprite = target.container || target.sprite;
            if (!targetSprite) return;
            const global = targetSprite.getGlobalPosition ? 
                targetSprite.getGlobalPosition() : 
                { x: targetSprite.x, y: targetSprite.y };
            targetPos = { x: global.x, y: global.y };
        }
        
        if (!targetPos) return;
        
        const centerX = targetPos.x;
        const centerY = targetPos.y - (target.sprite?.height || 80) * 0.4;
        
        console.log(`[Spark VFX] 타겟 위치: (${centerX}, ${centerY})`);
        
        // ========================================
        // 번개 경로 생성 (Lightning 스타일)
        // ========================================
        const generatePath = (x1, y1, x2, y2, segments) => {
            const points = [{ x: x1, y: y1 }];
            const dx = (x2 - x1) / segments;
            const dy = (y2 - y1) / segments;
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const maxOffset = Math.min(40, dist * 0.2);
            
            for (let i = 1; i < segments; i++) {
                points.push({
                    x: x1 + dx * i + (Math.random() - 0.5) * maxOffset,
                    y: y1 + dy * i + (Math.random() - 0.5) * maxOffset * 0.7
                });
            }
            points.push({ x: x2, y: y2 });
            return points;
        };
        
        // ========================================
        // 번개 볼트 그리기 (4겹 레이어)
        // ========================================
        const drawBolt = (points, isMain = true) => {
            const container = new PIXI.Container();
            container.zIndex = 300;
            CombatEffects.container.addChild(container);
            
            // 외부 글로우
            if (isMain) {
                const outerGlow = new PIXI.Graphics();
                outerGlow.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    outerGlow.lineTo(points[i].x, points[i].y);
                }
                outerGlow.stroke({ width: 25, color: 0x4488ff, alpha: 0.25 });
                container.addChild(outerGlow);
            }
            
            // 글로우
            const glow = new PIXI.Graphics();
            glow.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                glow.lineTo(points[i].x, points[i].y);
            }
            glow.stroke({ width: isMain ? 14 : 8, color: 0x4488ff, alpha: 0.5 });
            container.addChild(glow);
            
            // 메인
            const main = new PIXI.Graphics();
            main.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                main.lineTo(points[i].x, points[i].y);
            }
            main.stroke({ width: isMain ? 6 : 4, color: 0x88ccff, alpha: 0.95 });
            container.addChild(main);
            
            // 코어
            const core = new PIXI.Graphics();
            core.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                core.lineTo(points[i].x, points[i].y);
            }
            core.stroke({ width: isMain ? 3 : 2, color: 0xffffff, alpha: 1 });
            container.addChild(core);
            
            // 페이드아웃
            gsap.to(container, {
                alpha: 0,
                duration: 0.12,
                delay: 0.05,
                onUpdate: function() { if (container.destroyed) this.kill(); },
                onComplete: () => {
                    if (!container.destroyed) container.destroy({ children: true });
                }
            });
            
            return container;
        };
        
        // ========================================
        // 분기 번개 생성
        // ========================================
        const createBranch = (parent, x, y) => {
            const branch = new PIXI.Graphics();
            const segments = 3 + Math.floor(Math.random() * 3);
            const angle = Math.random() * Math.PI * 2;
            const length = 25 + Math.random() * 45;
            
            let curX = x;
            let curY = y;
            branch.moveTo(curX, curY);
            
            for (let i = 0; i < segments; i++) {
                const segLen = length / segments;
                const offsetAngle = angle + (Math.random() - 0.5) * 0.8;
                curX += Math.cos(offsetAngle) * segLen;
                curY += Math.sin(offsetAngle) * segLen;
                branch.lineTo(curX, curY);
            }
            
            branch.stroke({ width: 2 + Math.random() * 2, color: 0x88ccff, alpha: 0.8 });
            parent.addChild(branch);
            
            // 분기 끝 스파크
            const spark = new PIXI.Graphics();
            spark.circle(curX, curY, 2 + Math.random() * 3);
            spark.fill({ color: 0xffffff, alpha: 0.9 });
            parent.addChild(spark);
        };
        
        // ========================================
        // 화면 플래시 (먼저!)
        // ========================================
        CombatEffects.screenFlash('#ffffff', 30, 0.6);
        
        // ========================================
        // 갈래번개 8방향 생성
        // ========================================
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const len = 70 + Math.random() * 50;
            const endX = centerX + Math.cos(angle) * len;
            const endY = centerY + Math.sin(angle) * len * 0.55;
            
            const points = generatePath(centerX, centerY, endX, endY, 6);
            const boltContainer = drawBolt(points, true);
            
            // 각 갈래에서 분기 추가
            for (let j = 1; j < points.length - 1; j++) {
                if (Math.random() > 0.4) {
                    createBranch(boltContainer, points[j].x, points[j].y);
                }
            }
        }
        
        // ========================================
        // 중앙 임팩트
        // ========================================
        const impactContainer = new PIXI.Container();
        impactContainer.x = centerX;
        impactContainer.y = centerY;
        impactContainer.zIndex = 350;
        CombatEffects.container.addChild(impactContainer);
        
        // 중앙 플래시
        const flash = new PIXI.Graphics();
        flash.circle(0, 0, 50);
        flash.fill({ color: 0xffffff, alpha: 1 });
        impactContainer.addChild(flash);
        
        gsap.to(flash, { alpha: 0, duration: 0.15 });
        gsap.to(flash.scale, { x: 2, y: 2, duration: 0.15, ease: 'power2.out' });
        
        // 충격파 링
        for (let i = 0; i < 2; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 20 + i * 10);
            ring.stroke({ width: 4 - i * 2, color: i === 0 ? 0x88ccff : 0x4488ff, alpha: 0.8 });
            impactContainer.addChild(ring);
            
            gsap.to(ring.scale, { x: 4 - i, y: 4 - i, duration: 0.3, ease: 'power2.out', delay: i * 0.05 });
            gsap.to(ring, { alpha: 0, duration: 0.3, delay: i * 0.05 });
        }
        
        // 전기 스파크 파티클
        for (let i = 0; i < 15; i++) {
            const spark = new PIXI.Graphics();
            const len = 8 + Math.random() * 15;
            const angle = Math.random() * Math.PI * 2;
            
            spark.moveTo(0, 0);
            spark.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            spark.stroke({ width: 2 + Math.random() * 2, color: 0xffffff, alpha: 1 });
            
            spark.x = (Math.random() - 0.5) * 20;
            spark.y = (Math.random() - 0.5) * 20;
            impactContainer.addChild(spark);
            
            const speed = 60 + Math.random() * 80;
            gsap.to(spark, {
                x: spark.x + Math.cos(angle) * speed,
                y: spark.y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 0.25 + Math.random() * 0.15,
                ease: 'power2.out'
            });
        }
        
        // 임팩트 정리
        setTimeout(() => {
            if (!impactContainer.destroyed) impactContainer.destroy({ children: true });
        }, 400);
        
        // ========================================
        // 화면 효과
        // ========================================
        CombatEffects.screenShake(12, 150);
        CombatEffects.screenFlash('#88ccff', 80, 0.4);
        
        await new Promise(r => setTimeout(r, 200));
    },
    
    // ==========================================
    // 연쇄 아크 VFX - Lightning 스타일
    // ==========================================
    playChainArc(game, fromUnit, toUnit) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) {
            console.warn('[ChainArc] CombatEffects.container 없음');
            return;
        }
        
        // UnitCombat의 위치 함수 사용
        const getPos = (unit) => {
            if (typeof UnitCombat !== 'undefined' && UnitCombat.getPositionTarget) {
                return UnitCombat.getPositionTarget(unit);
            }
            const sprite = unit.container || unit.sprite;
            if (!sprite) return null;
            const global = sprite.getGlobalPosition ? sprite.getGlobalPosition() : { x: sprite.x, y: sprite.y };
            return { x: global.x, y: global.y };
        };
        
        const fromPos = getPos(fromUnit);
        const toPos = getPos(toUnit);
        if (!fromPos || !toPos) return;
        
        const sx = fromPos.x;
        const sy = fromPos.y - (fromUnit.sprite?.height || 60) * 0.4;
        const ex = toPos.x;
        const ey = toPos.y - (toUnit.sprite?.height || 60) * 0.4;
        
        console.log(`[ChainArc] ${sx},${sy} -> ${ex},${ey}`);
        
        // ========================================
        // 번개 경로 생성
        // ========================================
        const generatePath = (x1, y1, x2, y2, segments) => {
            const points = [{ x: x1, y: y1 }];
            const dx = (x2 - x1) / segments;
            const dy = (y2 - y1) / segments;
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const maxOffset = Math.min(30, dist * 0.15);
            
            for (let i = 1; i < segments; i++) {
                points.push({
                    x: x1 + dx * i + (Math.random() - 0.5) * maxOffset,
                    y: y1 + dy * i + (Math.random() - 0.5) * maxOffset * 0.7
                });
            }
            points.push({ x: x2, y: y2 });
            return points;
        };
        
        // ========================================
        // 연쇄 번개 볼트 그리기 (4겹)
        // ========================================
        const container = new PIXI.Container();
        container.zIndex = 300;
        CombatEffects.container.addChild(container);
        
        const points = generatePath(sx, sy, ex, ey, 8);
        
        // 외부 글로우
        const outerGlow = new PIXI.Graphics();
        outerGlow.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            outerGlow.lineTo(points[i].x, points[i].y);
        }
        outerGlow.stroke({ width: 20, color: 0x4488ff, alpha: 0.25 });
        container.addChild(outerGlow);
        
        // 글로우
        const glow = new PIXI.Graphics();
        glow.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            glow.lineTo(points[i].x, points[i].y);
        }
        glow.stroke({ width: 10, color: 0x4488ff, alpha: 0.5 });
        container.addChild(glow);
        
        // 메인
        const main = new PIXI.Graphics();
        main.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            main.lineTo(points[i].x, points[i].y);
        }
        main.stroke({ width: 5, color: 0x88ccff, alpha: 0.95 });
        container.addChild(main);
        
        // 코어
        const core = new PIXI.Graphics();
        core.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            core.lineTo(points[i].x, points[i].y);
        }
        core.stroke({ width: 2, color: 0xffffff, alpha: 1 });
        container.addChild(core);
        
        // 분기 번개
        for (let i = 1; i < points.length - 1; i++) {
            if (Math.random() > 0.5) {
                const branch = new PIXI.Graphics();
                const angle = Math.random() * Math.PI * 2;
                const len = 20 + Math.random() * 30;
                let curX = points[i].x;
                let curY = points[i].y;
                
                branch.moveTo(curX, curY);
                for (let j = 0; j < 3; j++) {
                    const offsetAngle = angle + (Math.random() - 0.5) * 0.8;
                    curX += Math.cos(offsetAngle) * (len / 3);
                    curY += Math.sin(offsetAngle) * (len / 3);
                    branch.lineTo(curX, curY);
                }
                branch.stroke({ width: 2, color: 0x88ccff, alpha: 0.8 });
                container.addChild(branch);
            }
        }
        
        // 연쇄 임팩트
        const impact = new PIXI.Graphics();
        impact.circle(ex, ey, 30);
        impact.fill({ color: 0xffffff, alpha: 0.9 });
        container.addChild(impact);
        
        gsap.to(impact, { alpha: 0, duration: 0.12 });
        gsap.to(impact.scale, { x: 1.5, y: 1.5, duration: 0.12, ease: 'power2.out' });
        
        // 페이드아웃
        gsap.to(container, {
            alpha: 0,
            duration: 0.15,
            delay: 0.05,
            onUpdate: function() { if (container.destroyed) this.kill(); },
            onComplete: () => {
                if (!container.destroyed) container.destroy({ children: true });
            }
        });
        
        // 화면 효과
        CombatEffects.screenFlash('#88ccff', 50, 0.3);
        CombatEffects.screenShake(6, 100);
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
