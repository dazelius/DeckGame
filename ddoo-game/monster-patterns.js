// =====================================================
// Monster Patterns - 몬스터 패턴 및 인텐트 관리
// =====================================================

const MonsterPatterns = {
    game: null,
    
    // ==========================================
    // 몬스터별 패턴 정의
    // ==========================================
    patterns: {
        // === 고블린 ===
        goblin: {
            name: 'Goblin',
            intents: [
                { 
                    id: 'slash',
                    name: '베기', 
                    type: 'attack', 
                    damage: 8,
                    weight: 40,
                    breakRecipe: ['physical', 'physical', 'physical'] // 3타 브레이크
                },
                { 
                    id: 'wild_swing',
                    name: '난폭한 휘두르기', 
                    type: 'attack', 
                    damage: 12,
                    weight: 25,
                    breakRecipe: ['physical', 'physical', 'physical'] // 3타 브레이크
                },
                { 
                    id: 'defend',
                    name: '방어 태세', 
                    type: 'defend', 
                    block: 6,
                    weight: 20
                    // 방어는 브레이크 불가
                },
                { 
                    id: 'prepare',
                    name: '준비', 
                    type: 'buff', 
                    buffType: 'strength',
                    buffValue: 2,
                    weight: 15
                }
            ]
        },
        
        // === 고블린 궁수 ===
        goblinArcher: {
            name: 'Goblin Archer',
            intents: [
                { 
                    id: 'arrow',
                    name: '화살', 
                    type: 'attack', 
                    damage: 6,
                    weight: 45
                },
                { 
                    id: 'double_shot',
                    name: '연사', 
                    type: 'attack', 
                    damage: 4,
                    hits: 2,
                    weight: 25,
                    breakRecipe: ['physical', 'physical'] // 2타 브레이크
                },
                { 
                    id: 'poison_arrow',
                    name: '독화살', 
                    type: 'attack', 
                    damage: 3,
                    poison: 4, // 4턴 독
                    weight: 20,
                    breakRecipe: ['physical', 'poison'] // 물리+독 브레이크
                },
                { 
                    id: 'aim',
                    name: '조준', 
                    type: 'buff', 
                    buffType: 'accuracy',
                    buffValue: 1,
                    nextDamageBonus: 6, // 다음 공격 +6 대미지
                    weight: 10
                }
            ]
        },
        
        // === 오크 (강력한 적) ===
        orc: {
            name: 'Orc',
            intents: [
                { 
                    id: 'heavy_strike',
                    name: '강타', 
                    type: 'attack', 
                    damage: 15,
                    weight: 35,
                    breakRecipe: ['physical', 'physical', 'physical', 'physical'] // 4타 브레이크
                },
                { 
                    id: 'rage_slam',
                    name: '분노의 강타', 
                    type: 'attack', 
                    damage: 22,
                    weight: 15,
                    breakRecipe: ['fire', 'physical', 'physical'] // 화염 + 2물리
                },
                { 
                    id: 'war_cry',
                    name: '전투 함성', 
                    type: 'buff', 
                    buffType: 'strength',
                    buffValue: 4,
                    weight: 25
                },
                { 
                    id: 'block',
                    name: '방패 막기', 
                    type: 'defend', 
                    block: 10,
                    weight: 25
                }
            ]
        },
        
        // === 해골 마법사 ===
        skeletonMage: {
            name: 'Skeleton Mage',
            intents: [
                { 
                    id: 'dark_bolt',
                    name: '암흑 탄환', 
                    type: 'attack', 
                    damage: 10,
                    element: 'dark',
                    weight: 40
                },
                { 
                    id: 'soul_drain',
                    name: '영혼 흡수', 
                    type: 'attack', 
                    damage: 8,
                    heal: 4, // 자신 회복
                    weight: 25,
                    breakRecipe: ['magic', 'magic'] // 마법 2타
                },
                { 
                    id: 'curse',
                    name: '저주', 
                    type: 'debuff', 
                    vulnerable: 2, // 취약 2턴
                    weight: 20,
                    breakRecipe: ['physical', 'magic'] // 물리 + 마법
                },
                { 
                    id: 'summon_skeleton',
                    name: '해골 소환', 
                    type: 'summon',
                    summonType: 'skeleton',
                    weight: 15
                }
            ]
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        console.log('[MonsterPatterns] 몬스터 패턴 시스템 초기화 완료');
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
        
        // 가중치 합계
        const totalWeight = pattern.intents.reduce((sum, intent) => sum + (intent.weight || 10), 0);
        let roll = Math.random() * totalWeight;
        
        // 가중치 기반 선택
        for (const intent of pattern.intents) {
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
        return { ...pattern.intents[0] };
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
                for (let i = 0; i < hits; i++) {
                    if (target.hp <= 0) break;
                    
                    const isMelee = (enemy.range || 1) <= 1;
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
                game.showMessage(`${enemy.name || enemy.type}: +${intent.block} Block`, 800);
                break;
                
            case 'buff':
                if (intent.buffType === 'strength') {
                    enemy.strength = (enemy.strength || 0) + (intent.buffValue || 0);
                    enemy.damage += (intent.buffValue || 0);
                }
                game.showMessage(`${enemy.name || enemy.type}: ${intent.name || 'Buff'}!`, 800);
                break;
                
            case 'debuff':
                if (intent.vulnerable && target) {
                    target.vulnerable = (target.vulnerable || 0) + intent.vulnerable;
                    game.showMessage(`${target.name || 'Target'}: Vulnerable ${intent.vulnerable}!`, 800);
                }
                break;
                
            case 'summon':
                // TODO: 소환 구현
                game.showMessage(`${enemy.name || enemy.type}: Summons!`, 800);
                break;
        }
    }
};

console.log('[MonsterPatterns] 몬스터 패턴 모듈 로드 완료');
