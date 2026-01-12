// =====================================================
// Monster Patterns - 몬스터 패턴 및 인텐트 관리
// 개별 JSON 파일 로딩 시스템
// =====================================================

const MonsterPatterns = {
    game: null,
    patterns: {},  // JSON에서 로드됨
    loaded: false,
    
    // 로드할 몬스터 목록 (파일명 = 몬스터 ID)
    monsterList: [
        'goblin',
        'goblinArcher', 
        'orc',
        'skeletonMage',
        'slime',
        'skeleton',
        'miniSlime',
        'bigSlime'
    ],
    
    // ==========================================
    // 초기화 (개별 JSON 파일 로드)
    // ==========================================
    async init(gameRef) {
        this.game = gameRef;
        this.patterns = {};
        
        // 각 몬스터 JSON 파일 병렬 로드
        const loadPromises = this.monsterList.map(id => this.loadMonster(id));
        await Promise.all(loadPromises);
        
        this.loaded = true;
        console.log(`[MonsterPatterns] ${Object.keys(this.patterns).length}개 패턴 로드 완료`);
    },
    
    // ==========================================
    // 개별 몬스터 JSON 로드
    // ==========================================
    async loadMonster(id) {
        try {
            const response = await fetch(`pattern/${id}.json`);
            if (response.ok) {
                const data = await response.json();
                this.patterns[id] = data;
                console.log(`[MonsterPatterns] ${id} 로드 완료`);
            } else {
                console.warn(`[MonsterPatterns] ${id}.json 로드 실패`);
            }
        } catch (e) {
            console.warn(`[MonsterPatterns] ${id}.json 오류:`, e.message);
        }
    },
    
    // ==========================================
    // 동적 몬스터 추가 (런타임에 새 패턴 로드)
    // ==========================================
    async addMonster(id) {
        if (this.patterns[id]) {
            console.log(`[MonsterPatterns] ${id} 이미 로드됨`);
            return true;
        }
        await this.loadMonster(id);
        return !!this.patterns[id];
    },
    
    // ==========================================
    // 패턴 가져오기
    // ==========================================
    getPattern(monsterType) {
        return this.patterns[monsterType] || null;
    },
    
    // ==========================================
    // 약점 가져오기
    // ==========================================
    getWeaknesses(monsterType) {
        const pattern = this.getPattern(monsterType);
        return pattern?.weaknesses || [];
    },
    
    // ==========================================
    // 스탯 가져오기
    // ==========================================
    getStats(monsterType) {
        const pattern = this.getPattern(monsterType);
        return pattern?.stats || {
            hp: 20,
            damage: 5,
            range: 1,
            sprite: 'goblin.png',
            scale: 0.35
        };
    },
    
    // ==========================================
    // AI 설정 가져오기
    // ==========================================
    getAI(monsterType) {
        const pattern = this.getPattern(monsterType);
        return pattern?.ai || {
            attackType: 'melee',
            preferredDistance: 1,
            retreatBeforeAttack: false
        };
    },
    
    // ==========================================
    // 유닛 타입 정보 생성 (game.js unitTypes 대체용)
    // ==========================================
    getUnitType(monsterType) {
        const pattern = this.getPattern(monsterType);
        if (!pattern) return null;
        
        const stats = pattern.stats || {};
        return {
            name: pattern.name || monsterType,
            nameKo: pattern.nameKo || pattern.name,
            cost: 0,
            hp: stats.hp || 20,
            damage: stats.damage || 5,
            range: stats.range || 1,
            sprite: stats.sprite || `${monsterType}.png`,
            scale: stats.scale || 0.35,
            ai: pattern.ai || {}
        };
    },
    
    // ==========================================
    // 약점 아이콘 매핑
    // ==========================================
    WeaknessIcons: {
        physical: '⚔️',
        fire: '🔥',
        ice: '❄️',
        lightning: '⚡',
        bleed: '🩸',
        poison: '☠️',
        magic: '✨',
        dark: '🌑'
    },
    
    // ==========================================
    // 약점 정보 팝업 표시
    // ==========================================
    showWeaknessPopup(enemy) {
        if (!enemy) return;
        
        const pattern = this.getPattern(enemy.type);
        if (!pattern) return;
        
        const weaknesses = pattern.weaknesses || [];
        if (weaknesses.length === 0) {
            console.log(`[MonsterPatterns] ${enemy.name || enemy.type}: 약점 없음`);
            return;
        }
        
        // 기존 팝업 제거
        const existingPopup = document.querySelector('.weakness-popup');
        if (existingPopup) existingPopup.remove();
        
        // 팝업 생성
        const popup = document.createElement('div');
        popup.className = 'weakness-popup';
        popup.innerHTML = `
            <div class="weakness-title">${pattern.nameKo || pattern.name} 약점</div>
            <div class="weakness-icons">
                ${weaknesses.map(w => `<span class="weakness-icon" title="${w}">${this.WeaknessIcons[w] || '?'}</span>`).join('')}
            </div>
        `;
        
        // 위치 설정 (캐릭터 위)
        const pos = enemy.container ? enemy.container.getGlobalPosition() : 
                    enemy.sprite ? enemy.sprite.getGlobalPosition() : null;
        if (pos) {
            popup.style.left = `${pos.x}px`;
            popup.style.top = `${pos.y - 80}px`;
        } else {
            popup.style.left = '50%';
            popup.style.top = '30%';
        }
        
        document.body.appendChild(popup);
        
        // 애니메이션
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(popup, 
                { opacity: 0, y: 10, scale: 0.8 },
                { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(1.5)' }
            );
        }
        
        // 2초 후 자동 제거
        setTimeout(() => {
            if (typeof gsap !== 'undefined') {
                gsap.to(popup, { 
                    opacity: 0, 
                    y: -10, 
                    duration: 0.2, 
                    onComplete: () => popup.remove() 
                });
            } else {
                popup.remove();
            }
        }, 2000);
    },
    
    // ==========================================
    // 랜덤 인텐트 선택 (가중치 기반)
    // ==========================================
    rollIntent(enemy) {
        const pattern = this.getPattern(enemy.type);
        if (!pattern || !pattern.intents || pattern.intents.length === 0) {
            // 기본 공격
            return { 
                id: 'basic_attack',
                type: 'attack', 
                damage: enemy.damage || 5 
            };
        }
        
        // ★★★ 슬라임 분열 체크! ★★★
        if (pattern.splitIntent && pattern.ai?.splitOnLowHP && !enemy.hasSplit) {
            const threshold = pattern.ai.splitThreshold || 0.5;
            const maxHp = pattern.stats?.hp || enemy.maxHp || 20;
            
            // HP가 절반 이하면 분열!
            if (enemy.hp <= maxHp * threshold) {
                console.log(`[MonsterPatterns] 🔮 ${enemy.name || enemy.type} 분열 조건 충족! HP: ${enemy.hp}/${maxHp}`);
                enemy.hasSplit = true; // 한 번만 분열
                return { ...pattern.splitIntent };
            }
        }
        
        // ★ 첫 턴(1턴)에는 브레이크 레시피가 있는 강력한 공격 제외
        const currentTurn = this.game?.state?.turn || 1;
        const isFirstTurn = currentTurn <= 1;
        
        // 사용 가능한 인텐트 필터링
        let availableIntents = pattern.intents;
        if (isFirstTurn) {
            // 첫 턴: 브레이크 레시피가 없는 인텐트만
            const safeIntents = pattern.intents.filter(i => !i.breakRecipe);
            if (safeIntents.length > 0) {
                availableIntents = safeIntents;
            }
            // 모든 인텐트가 브레이크 레시피가 있으면 어쩔 수 없이 원본 사용
        }
        
        // 가중치 합계
        const totalWeight = availableIntents.reduce((sum, intent) => sum + (intent.weight || 10), 0);
        let roll = Math.random() * totalWeight;
        
        // 가중치 기반 선택
        for (const intent of availableIntents) {
            roll -= (intent.weight || 10);
            if (roll <= 0) {
                // 인텐트 복사 후 반환 (원본 보호)
                const selectedIntent = { ...intent };
                
                // 기본 대미지가 없으면 몬스터 기본 대미지 사용
                if (selectedIntent.type === 'attack' && !selectedIntent.damage) {
                    selectedIntent.damage = enemy.damage || 5;
                }
                
                return selectedIntent;
            }
        }
        
        // 폴백
        return { ...availableIntents[0] };
    },
    
    // ==========================================
    // 모든 적 인텐트 롤링
    // ==========================================
    rollAllIntents(enemies) {
        enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            
            const intent = this.rollIntent(enemy);
            enemy.intent = intent;
            
            // BreakSystem 연동
            if (typeof BreakSystem !== 'undefined' && intent.breakRecipe) {
                BreakSystem.onIntentSelected(enemy, intent);
            }
            
            console.log(`[MonsterPatterns] ${enemy.name || enemy.type}: ${intent.name || intent.type} (${intent.damage || '-'})`);
        });
    },
    
    // ==========================================
    // 특정 인텐트 강제 설정
    // ==========================================
    setIntent(enemy, intentId) {
        const pattern = this.getPattern(enemy.type);
        if (!pattern) return false;
        
        const intent = pattern.intents.find(i => i.id === intentId);
        if (!intent) return false;
        
        enemy.intent = { ...intent };
        
        // BreakSystem 연동
        if (typeof BreakSystem !== 'undefined' && intent.breakRecipe) {
            BreakSystem.onIntentSelected(enemy, intent);
        }
        
        return true;
    },
    
    // ==========================================
    // 인텐트 정보 가져오기 (UI용)
    // ==========================================
    getIntentDisplay(enemy) {
        const intent = enemy.intent;
        if (!intent) return null;
        
        let icon = '⚔';
        let color = '#ff4444';
        let text = '';
        
        switch (intent.type) {
            case 'attack':
                icon = '⚔';
                color = '#ff4444';
                text = intent.damage ? `${intent.damage}` : '';
                if (intent.hits && intent.hits > 1) {
                    text = `${intent.damage} x${intent.hits}`;
                }
                break;
            case 'defend':
                icon = '🛡';
                color = '#4488ff';
                text = intent.block ? `${intent.block}` : '';
                break;
            case 'buff':
                icon = '↑';
                color = '#ffaa44';
                text = intent.buffValue ? `+${intent.buffValue}` : '';
                break;
            case 'debuff':
                icon = '↓';
                color = '#aa44ff';
                text = '';
                break;
            case 'summon':
                icon = '👥';
                color = '#44aaff';
                text = '';
                break;
            case 'split':
                icon = '💧';
                color = '#44ddff';
                text = '분열!';
                break;
            case 'heal':
                icon = '💚';
                color = '#44ff88';
                text = intent.healAmount ? `+${intent.healAmount}` : '';
                break;
        }
        
        return {
            icon,
            color,
            text,
            name: intent.name || intent.type,
            hasBreakRecipe: !!intent.breakRecipe
        };
    },
    
    // ==========================================
    // 인텐트 실행
    // ==========================================
    async executeIntent(enemy, target, game) {
        const intent = enemy.intent;
        if (!intent) return;
        
        switch (intent.type) {
            case 'attack':
                // 다중 공격 처리
                const hits = intent.hits || 1;
                const isMelee = (enemy.range || 1) <= 1;
                
                // ★ 근접 공격이면 타겟 레인으로 먼저 이동
                if (isMelee && enemy.gridZ !== target.gridZ) {
                    console.log(`[MonsterPatterns] ${enemy.name || enemy.type}: 레인 ${enemy.gridZ} → ${target.gridZ} 이동`);
                    await game.moveEnemyToLine(enemy, target.gridZ);
                }
                
                for (let i = 0; i < hits; i++) {
                    if (target.hp <= 0) break;
                    
                    if (isMelee) {
                        await game.enemyMeleeAttack(enemy, target, intent.damage);
                    } else {
                        await game.enemyRangedAttack(enemy, target, intent.damage);
                    }
                    
                    // 다중 공격 시 딜레이
                    if (hits > 1 && i < hits - 1) {
                        await new Promise(r => setTimeout(r, 200));
                    }
                }
                break;
                
            case 'defend':
                enemy.block = (enemy.block || 0) + (intent.block || 0);
                if (typeof game.updateUnitHPBar === 'function') {
                    game.updateUnitHPBar(enemy); // ★ HP 바에 쉴드 반영
                }
                // ★ 플로터로 변경 (중앙 토스트 대신)
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.showBlockGain(enemy, intent.block || 0);
                }
                break;
                
            case 'buff':
                if (intent.buffType === 'strength') {
                    enemy.strength = (enemy.strength || 0) + (intent.buffValue || 0);
                    enemy.damage += (intent.buffValue || 0);
                }
                // ★ 플로터로 변경
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.showBuff(enemy, intent.name || 'Buff', intent.buffValue);
                }
                break;
                
            case 'debuff':
                if (intent.vulnerable && target) {
                    target.vulnerable = (target.vulnerable || 0) + intent.vulnerable;
                    // ★ 플로터로 변경
                    if (typeof CombatEffects !== 'undefined') {
                        CombatEffects.showDebuff(target, 'Vulnerable', intent.vulnerable);
                    }
                }
                break;
                
            case 'summon':
                // 소환
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.showBuff(enemy, 'Summon!');
                }
                if (intent.summonType && typeof game.spawnEnemy === 'function') {
                    const count = intent.summonCount || 1;
                    for (let i = 0; i < count; i++) {
                        await game.spawnEnemy(intent.summonType, enemy.gridZ, enemy.gridX + 1 + i);
                    }
                }
                break;
                
            case 'split':
                // ★★★ 슬라임 분열! ★★★
                console.log(`[MonsterPatterns] 🔮 ${enemy.name || enemy.type} 분열 실행!`);
                
                // 분열 VFX
                await this.executeSplit(enemy, intent, game);
                break;
                
            case 'heal':
                // 회복
                const healAmount = intent.healAmount || 3;
                enemy.hp = Math.min((enemy.maxHp || 20), enemy.hp + healAmount);
                if (typeof game.updateUnitHPBar === 'function') {
                    game.updateUnitHPBar(enemy);
                }
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.showHeal(enemy, healAmount);
                }
                break;
        }
    },
    
    // ==========================================
    // ★★★ 슬라임 분열 실행! ★★★
    // ==========================================
    async executeSplit(enemy, intent, game) {
        const summonType = intent.summonType || 'miniSlime';
        const summonCount = intent.summonCount || 2;
        
        // 1. 분열 전조 연출
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#44aaff', 100, 0.3);
            
            // 부풀어오르는 효과
            if (enemy.sprite && !enemy.sprite.destroyed) {
                const baseScale = enemy.baseScale || enemy.sprite.baseScale || 0.35;
                await new Promise(resolve => {
                    gsap.timeline({ onComplete: resolve })
                        .to(enemy.sprite.scale, { 
                            x: baseScale * 1.5, 
                            y: baseScale * 1.5, 
                            duration: 0.3,
                            ease: 'power2.out'
                        })
                        .to(enemy.sprite.scale, {
                            x: baseScale * 0.8,
                            y: baseScale * 0.8,
                            duration: 0.15,
                            ease: 'power2.in'
                        });
                });
            }
        }
        
        // 2. 분열 파티클 이펙트
        const enemyPos = game.getUnitPosition ? game.getUnitPosition(enemy) : 
            { x: enemy.sprite?.x || 400, y: enemy.sprite?.y || 300 };
            
        if (typeof CombatEffects !== 'undefined') {
            // 슬라임 조각들이 튀는 효과
            for (let i = 0; i < 15; i++) {
                const particle = new PIXI.Graphics();
                particle.circle(0, 0, 5 + Math.random() * 8);
                particle.fill({ color: 0x44aaff, alpha: 0.8 });
                particle.x = enemyPos.x;
                particle.y = enemyPos.y - 30;
                particle.zIndex = 200;
                CombatEffects.container.addChild(particle);
                
                const angle = (i / 15) * Math.PI * 2;
                const dist = 50 + Math.random() * 80;
                
                gsap.to(particle, {
                    x: particle.x + Math.cos(angle) * dist,
                    y: particle.y + Math.sin(angle) * dist,
                    alpha: 0,
                    duration: 0.5,
                    ease: 'power2.out',
                    onUpdate: function() { if (particle.destroyed) this.kill(); },
                    onComplete: () => { if (!particle.destroyed) particle.destroy(); }
                });
            }
            
            CombatEffects.screenShake(10, 150);
        }
        
        // 3. ★★★ 베지어 곡선으로 슬라임 분열 연출! ★★★
        const spawnedMinis = [];
        
        // miniSlime 패턴이 로드되어 있는지 확인, 없으면 로드
        if (!this.patterns[summonType]) {
            await this.addMonster(summonType);
        }
        
        // 원본 위치 저장
        const startX = enemyPos.x;
        const startY = enemyPos.y - 30;
        
        // 미니 슬라임 위치 계산 (위/아래 레인으로 분산!)
        const spawnPositions = [];
        for (let i = 0; i < summonCount; i++) {
            // 위/아래 레인으로 분산 (0번은 위, 1번은 아래)
            const offsetZ = i === 0 ? -1 : 1;
            let targetZ = enemy.gridZ + offsetZ;
            let targetX = enemy.gridX;
            
            // 범위 체크
            targetZ = Math.max(0, Math.min(2, targetZ));
            
            // 같은 레인에 겹치면 X축으로 분산
            if (targetZ === enemy.gridZ) {
                targetX = enemy.gridX + (i === 0 ? -1 : 1);
                targetX = Math.max(game.arena?.playerZoneX || 5, Math.min(9, targetX));
            }
            
            const targetCenter = game.getCellCenter ? game.getCellCenter(targetX, targetZ) : null;
            spawnPositions.push({
                gridX: targetX,
                gridZ: targetZ,
                screenX: targetCenter?.x || startX,
                screenY: targetCenter?.y || startY + (i === 0 ? -80 : 80),
                directionY: i === 0 ? -1 : 1  // 위/아래 방향
            });
        }
        
        console.log(`[Split] 분열 위치:`, spawnPositions.map(p => `(${p.gridX},${p.gridZ})`));
        
        // ★ 분열 슬라임 공 발사! (베지어 곡선)
        const slimeBalls = [];
        for (let i = 0; i < summonCount; i++) {
            // waterball.png 스프라이트 사용
            const imagePath = typeof DDOOConfig !== 'undefined' 
                ? DDOOConfig.getImagePath('waterball.png') 
                : 'image/waterball.png';
            
            const ball = PIXI.Sprite.from(imagePath);
            ball.anchor.set(0.5);
            ball.scale.set(1);  // 원본 크기
            ball.x = startX;
            ball.y = startY;
            ball.zIndex = 250;
            CombatEffects.container.addChild(ball);
            slimeBalls.push(ball);
            
            const target = spawnPositions[i];
            const dirY = target.directionY;
            
            // 베지어 곡선 컨트롤 포인트 (위/아래로 볼록하게!)
            const cpX = (startX + target.screenX) / 2 + (Math.random() - 0.5) * 40;
            const cpY = startY + dirY * (80 + Math.random() * 40);
            
            // 베지어 애니메이션
            const duration = 0.5;
            const startTime = Date.now();
            
            const animateBall = () => {
                if (ball.destroyed) return;
                
                const elapsed = (Date.now() - startTime) / 1000;
                const t = Math.min(elapsed / duration, 1);
                
                // 2차 베지어 곡선
                const u = 1 - t;
                ball.x = u * u * startX + 2 * u * t * cpX + t * t * target.screenX;
                ball.y = u * u * startY + 2 * u * t * cpY + t * t * target.screenY;
                
                // 크기 변화 (통통)
                const baseScale = 1;
                const scale = baseScale * (1 + Math.sin(t * Math.PI) * 0.3);
                ball.scale.set(scale);
                
                // 트레일 파티클
                if (Math.random() > 0.5) {
                    const trail = new PIXI.Graphics();
                    trail.circle(0, 0, 5 + Math.random() * 5);
                    trail.fill({ color: 0x88eeff, alpha: 0.6 });
                    trail.x = ball.x + (Math.random() - 0.5) * 10;
                    trail.y = ball.y + (Math.random() - 0.5) * 10;
                    trail.zIndex = 245;
                    CombatEffects.container.addChild(trail);
                    
                    gsap.to(trail, {
                        alpha: 0,
                        duration: 0.3,
                        onUpdate: function() { if (trail.destroyed) this.kill(); },
                        onComplete: () => { if (!trail.destroyed) trail.destroy(); }
                    });
                    gsap.to(trail.scale, {
                        x: 0.3, y: 0.3,
                        duration: 0.3
                    });
                }
                
                if (t < 1) {
                    requestAnimationFrame(animateBall);
                } else {
                    // 착지 이펙트
                    CombatEffects.impactEffect(target.screenX, target.screenY, 0x44ddff, 0.8);
                    ball.destroy();
                }
            };
            
            animateBall();
        }
        
        // 슬라임 볼 이동 대기
        await new Promise(r => setTimeout(r, 550));
        
        // 4. 미니 슬라임 실제 소환
        for (let i = 0; i < summonCount; i++) {
            const pos = spawnPositions[i];
            console.log(`[Split] 미니 슬라임 ${i+1} 소환: gridX=${pos.gridX}, gridZ=${pos.gridZ}`);
            
            if (typeof game.spawnEnemy === 'function') {
                const mini = await game.spawnEnemy(summonType, pos.gridZ, pos.gridX);
                if (mini) {
                    spawnedMinis.push(mini);
                    
                    // 팝업 연출
                    if (mini.sprite) {
                        const targetScale = mini.baseScale || 0.6;
                        mini.sprite.scale.set(0.1);
                        
                        gsap.to(mini.sprite.scale, {
                            x: targetScale,
                            y: targetScale,
                            duration: 0.25,
                            ease: 'back.out(3)'
                        });
                    }
                }
            }
        }
        
        // 5. ★★★ 원본 슬라임 제거! (분열 = 1→2) ★★★
        console.log(`[Split] 원본 슬라임 제거!`);
        
        // 원본 슬라임 사망 처리
        if (enemy.sprite && !enemy.sprite.destroyed) {
            // 터지는 연출
            gsap.to(enemy.sprite.scale, {
                x: 0,
                y: 0,
                duration: 0.15,
                ease: 'back.in(3)',
                onComplete: () => {
                    if (enemy.sprite && !enemy.sprite.destroyed) {
                        enemy.sprite.visible = false;
                    }
                }
            });
        }
        
        // HP를 0으로 설정하여 사망 처리
        enemy.hp = 0;
        
        // 게임에서 유닛 제거
        if (typeof game.killUnit === 'function') {
            setTimeout(() => {
                game.killUnit(enemy);
            }, 200);
        }
        
        console.log(`[Split] 분열 완료! 원본 제거, ${spawnedMinis.length}개 미니 슬라임 소환`);
    }
};

console.log('[MonsterPatterns] 몬스터 패턴 모듈 로드 완료');
