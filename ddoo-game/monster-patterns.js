// =====================================================
// Monster Patterns - 몬스터 패턴 및 인텐트 관리
// JSON 기반 패턴 로딩 시스템
// =====================================================

const MonsterPatterns = {
    game: null,
    patterns: {},  // JSON에서 로드됨
    loaded: false,
    
    // ==========================================
    // 초기화 (JSON 로드)
    // ==========================================
    async init(gameRef) {
        this.game = gameRef;
        
        // JSON 파일에서 패턴 로드
        try {
            const response = await fetch('pattern/monsters.json');
            if (response.ok) {
                this.patterns = await response.json();
                this.loaded = true;
                console.log(`[MonsterPatterns] JSON에서 ${Object.keys(this.patterns).length}개 패턴 로드 완료`);
            } else {
                console.warn('[MonsterPatterns] JSON 로드 실패, 기본 패턴 사용');
                this.loadFallbackPatterns();
            }
        } catch (e) {
            console.warn('[MonsterPatterns] JSON 로드 오류:', e.message);
            this.loadFallbackPatterns();
        }
    },
    
    // ==========================================
    // 폴백 패턴 (JSON 로드 실패 시)
    // ==========================================
    loadFallbackPatterns() {
        this.patterns = {
            goblin: {
                name: 'Goblin',
                intents: [
                    { id: 'slash', name: '베기', type: 'attack', damage: 8, weight: 50 },
                    { id: 'defend', name: '방어', type: 'defend', block: 6, weight: 50 }
                ]
            }
        };
        this.loaded = true;
        console.log('[MonsterPatterns] 폴백 패턴 로드 완료');
    },
    
    // ==========================================
    // 패턴 가져오기
    // ==========================================
    getPattern(monsterType) {
        return this.patterns[monsterType] || null;
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
        
        // ★ 첫 턴(1턴)에는 브레이크 레시피가 있는 강력한 공격 제외
        const currentTurn = this.game?.state?.turn || 1;
        const isFirstTurn = currentTurn <= 1;
        
        // 사용 가능한 인텐트 필터링
        let availableIntents = pattern.intents;
        if (isFirstTurn) {
            // 첫 턴: 브레이크 레시피가 없는 인텐트만
            const safeIntents = pattern.intents.filter(i => !i.breakRecipe || i.breakRecipe.length === 0);
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
                // TODO: 소환 구현
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.showBuff(enemy, 'Summon!');
                }
                break;
        }
    }
};

console.log('[MonsterPatterns] 몬스터 패턴 모듈 로드 완료');
