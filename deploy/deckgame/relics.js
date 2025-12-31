// ==========================================
// Shadow Deck - 유물 시스템
// ==========================================

// 유물 시스템
const RelicSystem = {
    // 보유 유물 목록
    ownedRelics: [],
    
    // 콤보 시스템 (거침없는 공격용)
    combo: {
        count: 0,
        lastCardType: null
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.ownedRelics = [];
        this.resetCombo();
        console.log('[Relic System] 초기화 완료');
    },
    
    // ==========================================
    // 유물 추가
    // silent: true면 팝업/로그 없이 조용히 추가 (스타터 유물용)
    // ==========================================
    addRelic(relicId, silent = false) {
        const relic = relicDatabase[relicId];
        if (!relic) {
            console.error(`[Relic] Not found: ${relicId}`);
            return false;
        }
        
        // 중복 체크
        if (this.hasRelic(relicId)) {
            console.log(`[Relic] Already owned: ${relic.name}`);
            return false;
        }
        
        this.ownedRelics.push({ ...relic });
        
        // 유물 UI 업데이트 (relics-ui.js에서 처리)
        this.updateRelicUI();
        
        // onAcquire 콜백 실행
        if (relic.onAcquire) {
            relic.onAcquire(gameState);
        }
        
        console.log(`[Relic] Acquired: ${relic.name}`);
        
        // silent가 아닐 때만 로그와 팝업 표시
        if (!silent) {
            addLog(`Relic: ${relic.name}`, 'relic');
            
            // 획득 팝업 표시 (relics-ui.js)
            if (typeof RelicUI !== 'undefined' && RelicUI.showAcquireEffect) {
                RelicUI.showAcquireEffect(relic);
            }
        }
        
        return true;
    },
    
    // ==========================================
    // 유물 보유 확인
    // ==========================================
    hasRelic(relicId) {
        return this.ownedRelics.some(r => r.id === relicId);
    },
    
    // ==========================================
    // 모든 유물 제거 (전직용)
    // ==========================================
    clearAllRelics() {
        console.log(`[Relic] 모든 유물 제거: ${this.ownedRelics.length}개`);
        this.ownedRelics = [];
        this.updateRelicUI();
    },
    
    // ==========================================
    // 카드 사용 시 호출
    // ==========================================
    onCardPlayed(card, gameState) {
        // 거침없는 공격 유물 체크
        if (this.hasRelic('relentlessAttack')) {
            // 카드 타입 체크 (문자열 또는 객체 둘 다 처리)
            const cardType = card.type?.id || card.type;
            const isAttack = cardType === 'attack' || cardType === CardType.ATTACK;
            
            if (isAttack) {
                // 공격 카드 연속 사용 - 콤보 증가
                this.combo.count++;
                this.combo.lastCardType = 'attack';
                
                // 콤보 플로터 표시 (보너스 데미지 = 콤보 수 - 1)
                if (this.combo.count > 1) {
                    const bonusDmg = this.combo.count - 1;
                    this.showComboFloater(this.combo.count, bonusDmg);
                }
                
                // 콤보 UI 업데이트
                this.updateComboUI();
                
                console.log(`[Relic] 콤보 ${this.combo.count}! (${card.name})`);
            } else {
                // 공격이 아닌 카드 - 콤보 리셋
                if (this.combo.count > 0) {
                    console.log(`[Relic] 콤보 리셋 (${card.name} - ${cardType} 카드 사용)`);
                }
                this.resetCombo();
            }
        }
        
        // 다른 유물들의 onCardPlayed 호출
        this.ownedRelics.forEach(relic => {
            if (relic.onCardPlayed) {
                relic.onCardPlayed(card, gameState);
            }
        });
    },
    
    // ==========================================
    // 데미지 보너스 계산
    // ==========================================
    calculateBonusDamage(baseDamage, card, gameState) {
        let bonus = 0;
        
        // 카드 타입 체크 (문자열 또는 객체 둘 다 처리)
        const cardType = card.type?.id || card.type;
        const isAttack = cardType === 'attack' || 
                        (typeof CardType !== 'undefined' && cardType === CardType.ATTACK) ||
                        (typeof CardType !== 'undefined' && card.type === CardType.ATTACK);
        
        console.log(`[Relic] calculateBonusDamage 호출 - 카드: ${card.name}, 타입: ${cardType}, isAttack: ${isAttack}, 콤보: ${this.combo.count}, 유물보유: ${this.hasRelic('relentlessAttack')}`);
        
        // 거침없는 공격 - 콤보당 +1 데미지
        if (this.hasRelic('relentlessAttack') && isAttack) {
            // 현재 콤보 카운트에서 1을 뺀 값 (첫 공격은 보너스 없음)
            const comboBonus = Math.max(0, this.combo.count - 1);
            console.log(`[Relic] 콤보 보너스 계산 - count: ${this.combo.count}, bonus: ${comboBonus}`);
            if (comboBonus > 0) {
                bonus += comboBonus;
                this.showBonusDamageFloater(comboBonus);
                console.log(`[Relic] 콤보 보너스 데미지 적용: +${comboBonus}`);
            }
        }
        
        // 다른 유물들의 데미지 보너스
        this.ownedRelics.forEach(relic => {
            if (relic.getDamageBonus) {
                bonus += relic.getDamageBonus(baseDamage, card, gameState);
            }
        });
        
        return bonus;
    },
    
    // ==========================================
    // 턴 종료 시 호출
    // ==========================================
    onTurnEnd() {
        // 콤보 리셋
        if (this.combo.count > 0) {
            console.log(`[Relic] 턴 종료 - 콤보 리셋`);
        }
        this.resetCombo();
        
        // 다른 유물들의 onTurnEnd 호출
        this.ownedRelics.forEach(relic => {
            if (relic.onTurnEnd) {
                relic.onTurnEnd(gameState);
            }
        });
    },
    
    // ==========================================
    // 턴 시작 시 호출
    // ==========================================
    onTurnStart() {
        this.ownedRelics.forEach(relic => {
            if (relic.onTurnStart) {
                relic.onTurnStart(gameState);
            }
        });
    },
    
    // ==========================================
    // 전투 시작 시 호출
    // ==========================================
    onBattleStart() {
        this.resetCombo();
        
        this.ownedRelics.forEach(relic => {
            if (relic.onBattleStart) {
                relic.onBattleStart(gameState);
            }
        });
    },
    
    // ==========================================
    // 콤보 증가 (다중 히트 카드용)
    // ==========================================
    incrementCombo() {
        if (this.hasRelic('relentlessAttack')) {
            this.combo.count++;
            this.combo.lastCardType = 'attack';
            this.updateComboUI();
            console.log(`[Relic] 콤보 증가: ${this.combo.count}`);
        }
    },
    
    // ==========================================
    // 콤보 리셋
    // ==========================================
    resetCombo() {
        this.combo.count = 0;
        this.combo.lastCardType = null;
        this.updateComboUI();
    },
    
    // ==========================================
    // 콤보 플로터 표시 (숫자 + Combo, +X DMG)
    // ==========================================
    showComboFloater(comboCount, bonusDamage = 0) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        
        const floater = document.createElement('div');
        floater.className = 'combo-floater';
        floater.innerHTML = `
            <div class="combo-line1"><span class="combo-num">${comboCount}</span> <span class="combo-label">Combo</span></div>
            <div class="combo-line2">+${bonusDamage} DMG</div>
        `;
        floater.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top - 20}px;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            animation: comboFloaterPop 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 800);
    },
    
    // ==========================================
    // 보너스 데미지 플로터 표시
    // ==========================================
    showBonusDamageFloater(bonus) {
        // 다중 적 시스템 지원: getSelectedEnemyElement 또는 첫 번째 적 사용
        let enemyEl = null;
        
        if (typeof getSelectedEnemyElement === 'function') {
            enemyEl = getSelectedEnemyElement();
        }
        
        if (!enemyEl) {
            const container = document.getElementById('enemies-container');
            if (container) {
                enemyEl = container.querySelector('.enemy-unit');
            }
        }
        
        if (!enemyEl) {
            enemyEl = document.getElementById('enemy');
        }
        
        if (!enemyEl) {
            console.log('[Relic] 보너스 플로터: 적 요소를 찾을 수 없음');
            return;
        }
        
        const rect = enemyEl.getBoundingClientRect();
        
        const floater = document.createElement('div');
        floater.className = 'bonus-damage-floater';
        floater.innerHTML = `<span class="bonus-icon">⚔️</span><span class="bonus-value">+${bonus}</span>`;
        floater.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2 + 60}px;
            top: ${rect.top + rect.height / 2 - 30}px;
            transform: translate(-50%, -50%);
            z-index: 1001;
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 900;
            color: #fbbf24;
            text-shadow: 0 0 15px rgba(251, 191, 36, 1), 0 0 30px rgba(251, 191, 36, 0.6), 2px 2px 0 #000;
            animation: bonusDamageFloat 1.2s ease-out forwards;
        `;
        
        console.log(`[Relic] 보너스 플로터 표시: +${bonus}`);
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 1200);
    },
    
    // ==========================================
    // 유물 UI 업데이트 (relics-ui.js에서 오버라이드됨)
    // ==========================================
    updateRelicUI() {
        // RelicUI가 로드되면 오버라이드됨
        console.log('[Relic] UI 업데이트 대기중...');
    },
    
    // ==========================================
    // 콤보 UI 업데이트
    // ==========================================
    updateComboUI() {
        let comboDisplay = document.getElementById('combo-display');
        
        if (this.combo.count > 1 && this.hasRelic('relentlessAttack')) {
            if (!comboDisplay) {
                comboDisplay = document.createElement('div');
                comboDisplay.id = 'combo-display';
                comboDisplay.className = 'combo-display';
                document.body.appendChild(comboDisplay);
            }
            
            comboDisplay.innerHTML = `
                <div class="combo-label">COMBO</div>
                <div class="combo-number">${this.combo.count}</div>
                <div class="combo-bonus">+${this.combo.count - 1} DMG</div>
            `;
            comboDisplay.classList.add('visible');
        } else if (comboDisplay) {
            comboDisplay.classList.remove('visible');
        }
    }
};

// ==========================================
// 유물 데이터베이스
// ==========================================
const relicDatabase = {
    // ==========================================
    // 기본 유물 (Basic Relics)
    // ==========================================
    heroMedal: {
        id: 'heroMedal',
        name: "Hero's Medal",
        name_kr: '용사의 증표',
        icon: '🏅',
        rarity: 'common',
        description: 'Max HP +10',
        description_kr: '최대 HP +10',
        onAcquire: (state) => {
            state.player.maxHp += 10;
            state.player.hp += 10;
            console.log('[Relic] Hero Medal: HP +10');
        }
    },
    
    // ==========================================
    // 시작 유물 (Starter Relics)
    // ==========================================
    relentlessAttack: {
        id: 'relentlessAttack',
        name: 'Relentless',
        name_kr: '거침없는 공격',
        icon: 'combo.png',
        isImageIcon: true,
        rarity: 'starter',
        description: '+1 damage for each consecutive Attack card',
        description_kr: '공격 카드를 연속으로 사용할 때마다 +1 데미지',
        onAcquire: (state) => {
            console.log('[Relic] Relentless activated!');
        }
    },
    
    criticalStrike: {
        id: 'criticalStrike',
        name: 'Critical Eye',
        name_kr: '회심',
        icon: 'critical.png',
        isImageIcon: true,
        rarity: 'starter',
        description: 'Every 7th Attack card is a CRITICAL (x2 dmg)',
        description_kr: '7번째 공격 카드는 크리티컬로 적중 (2배 데미지)',
        onAcquire: (state) => {
            if (typeof CriticalSystem !== 'undefined') {
                CriticalSystem.init();
            }
            console.log('[Relic] Critical Eye activated!');
        },
        onBattleStart: (state) => {
            if (typeof CriticalSystem !== 'undefined') {
                CriticalSystem.onBattleStart();
            }
        },
        onCardPlayed: (card, state) => {
            setTimeout(() => {
                if (typeof CriticalSystem !== 'undefined') {
                    CriticalSystem.updateCriticalUI();
                }
            }, 100);
        }
    },
    
    deepWound: {
        id: 'deepWound',
        name: 'Deep Wound',
        name_kr: '후벼파기',
        icon: 'bleed.png',
        isImageIcon: true,
        rarity: 'starter',
        description: 'Attacking same enemy twice applies Bleed 1',
        description_kr: '같은 적을 두 번 공격하면 출혈 1 부여',
        // 상태 추적용
        lastTargetIndex: -1,
        hitCount: 0,
        onAcquire: (state) => {
            console.log('[Relic] Deep Wound activated!');
        },
        onBattleStart: (state) => {
            // 전투 시작 시 리셋
            const relic = RelicSystem.ownedRelics.find(r => r.id === 'deepWound');
            if (relic) {
                relic.lastTargetIndex = -1;
                relic.hitCount = 0;
            }
        },
        onDealDamage: (state, targetIndex, damage) => {
            const relic = RelicSystem.ownedRelics.find(r => r.id === 'deepWound');
            if (!relic) return;
            
            if (relic.lastTargetIndex === targetIndex) {
                // 같은 대상 공격
                relic.hitCount++;
                if (relic.hitCount >= 2) {
                    // 출혈 적용
                    const enemy = state.enemies[targetIndex];
                    if (enemy && enemy.hp > 0) {
                        enemy.bleed = (enemy.bleed || 0) + 1;
                        addLog(`Deep Wound: ${enemy.name} Bleed +1!`, 'debuff');
                        
                        // 출혈 이펙트
                        const enemyEl = document.querySelectorAll('.enemy-unit')[targetIndex];
                        if (enemyEl) {
                            const bleedEffect = document.createElement('div');
                            bleedEffect.className = 'deep-wound-effect';
                            bleedEffect.textContent = '🩸+1';
                            enemyEl.appendChild(bleedEffect);
                            setTimeout(() => bleedEffect.remove(), 1000);
                        }
                        
                        // UI 업데이트
                        if (typeof updateEnemiesUI === 'function') {
                            updateEnemiesUI();
                        }
                    }
                    relic.hitCount = 0; // 리셋
                }
            } else {
                // 다른 대상 공격
                relic.lastTargetIndex = targetIndex;
                relic.hitCount = 1;
            }
        }
    },
    
    // 그림자 낙인 (닌자 시작 유물)
    shadowMark: {
        id: 'shadowMark',
        name: 'Shadow Mark',
        name_kr: '그림자 낙인',
        icon: '👤',
        rarity: 'starter',
        description: 'Shadow Clones deal 75% damage (instead of 50%)',
        description_kr: '분신이 75% 데미지를 줌 (기존 50%)',
        onAcquire: (state) => {
            console.log('[Relic] Shadow Mark activated!');
            // ShadowCloneSystem의 데미지 배율 증가
            if (typeof ShadowCloneSystem !== 'undefined') {
                ShadowCloneSystem.clones.forEach(clone => {
                    clone.damageMultiplier = 0.75;
                });
            }
        },
        onBattleStart: (state) => {
            // 전투 시작 시 분신 데미지 배율 설정
            if (typeof ShadowCloneSystem !== 'undefined') {
                // 앞으로 소환되는 분신에 적용되도록 기본값 변경
                ShadowCloneSystem.defaultDamageMultiplier = 0.75;
            }
        }
    },
    
    // ==========================================
    // 일반 유물 (Common Relics)
    // ==========================================
    ironHeart: {
        id: 'ironHeart',
        name: 'Iron Heart',
        name_kr: '강철 심장',
        icon: '♥',
        rarity: 'common',
        description: 'Gain 5 Block at combat start',
        description_kr: '전투 시작 시 방어도 5 획득',
        onBattleStart: (state) => {
            gainBlock(state.player, 5);
            addLog('Iron Heart: +5 Block', 'block');
        }
    },
    
    vampireFang: {
        id: 'vampireFang',
        name: 'Vampire Fang',
        name_kr: '흡혈의 송곳니',
        icon: '▼',
        rarity: 'common',
        description: 'Heal 5 HP on enemy kill',
        description_kr: '적 처치 시 HP 5 회복',
        onEnemyKill: (state) => {
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5);
            addLog('Vampire Fang: +5 HP', 'heal');
        }
    },
    
    // ==========================================
    // 고급 유물 (Uncommon Relics)
    // ==========================================
    energyCrystal: {
        id: 'energyCrystal',
        name: 'Energy Crystal',
        name_kr: '에너지 결정',
        icon: '◇',
        rarity: 'uncommon',
        description: 'Max Energy +1',
        description_kr: '최대 에너지 +1',
        onAcquire: (state) => {
            state.player.maxEnergy += 1;
            state.player.energy += 1;
            addLog('Energy Crystal: Max Energy +1');
        }
    },
    
    thornArmor: {
        id: 'thornArmor',
        name: 'Thorn Armor',
        name_kr: '가시 갑옷',
        icon: '※',
        rarity: 'uncommon',
        description: 'Deal 3 damage to attacker when hit',
        description_kr: '피격 시 공격자에게 3 데미지',
        onDamageTaken: (state, damage) => {
            if (damage > 0 && state.enemy && state.enemy.hp > 0) {
                state.enemy.hp = Math.max(0, state.enemy.hp - 3);
                addLog('Thorn Armor: 3 reflect dmg', 'damage');
                
                const enemyEl = document.getElementById('enemy');
                if (enemyEl && typeof EffectSystem !== 'undefined') {
                    EffectSystem.flash(enemyEl, { color: '#22c55e', duration: 100 });
                }
            }
        }
    },
    
    // ==========================================
    // 희귀 유물
    // ==========================================
    ancientCrown: {
        id: 'ancientCrown',
        name: '고대의 왕관',
        icon: '👑',
        rarity: 'rare',
        description: '매 턴 시작 시 카드를 1장 더 뽑습니다.',
        onTurnStart: (state) => {
            // game.js의 drawCards 함수 호출
            if (typeof drawCards === 'function') {
                setTimeout(() => {
                    drawCards(1);
                    addLog('고대의 왕관: 카드 +1!');
                }, 100);
            }
        }
    },
    
    phoenixFeather: {
        id: 'phoenixFeather',
        name: 'Phoenix Feather',
        name_kr: '불사조 깃털',
        icon: 'phoenix.png',
        isImageIcon: true,
        rarity: 'starter',
        description: 'Revive with 25% HP on death (once per combat)',
        description_kr: '사망 시 HP 25%로 부활 (1회)',
        used: false,
        onDeath: (state) => {
            const relic = RelicSystem.ownedRelics.find(r => r.id === 'phoenixFeather');
            if (relic && !relic.used) {
                relic.used = true;
                const reviveHp = Math.floor(state.player.maxHp * 0.25);
                state.player.hp = reviveHp;
                addLog(`불사조 깃털: HP ${reviveHp}로 부활!`, 'heal');
                
                // 부활 이펙트
                const playerEl = document.getElementById('player');
                if (playerEl && typeof EffectSystem !== 'undefined') {
                    EffectSystem.heal(playerEl, { color: '#f97316' });
                }
                
                return true; // 사망 방지
            }
            return false;
        }
    },
    
    // 에너지 결정 - 턴 시작 시 에너지 +1
    energyCrystal: {
        id: 'energyCrystal',
        name: 'Energy Crystal',
        name_kr: '에너지 결정',
        icon: 'diamond.png',
        isImageIcon: true,
        rarity: 'starter',
        description: '+1 Energy at the start of each turn',
        description_kr: '매 턴 시작 시 에너지 +1',
        onTurnStart: (state) => {
            state.player.energy += 1;
            addLog('에너지 결정: +1 에너지!', 'energy');
            
            // 에너지 획득 이펙트
            const playerEl = document.getElementById('player');
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                    color: '#60a5fa',
                    count: 10,
                    speed: 150
                });
            }
        }
    }
};

// ==========================================
// CSS 스타일 주입
// ==========================================
const relicStyles = document.createElement('style');
relicStyles.textContent = `
    /* 콤보 플로터 */
    .combo-floater {
        font-family: 'Cinzel', serif;
        text-align: center;
    }
    
    .combo-floater .combo-line1 {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 6px;
    }
    
    .combo-floater .combo-num {
        font-size: 1.8rem;
        font-weight: 900;
        color: #fbbf24;
        text-shadow: 0 0 15px rgba(251, 191, 36, 0.8), 2px 2px 0 #000;
    }
    
    .combo-floater .combo-label {
        font-size: 1rem;
        font-weight: 700;
        color: #f97316;
        text-shadow: 0 0 10px rgba(249, 115, 22, 0.8);
        text-transform: uppercase;
        letter-spacing: 2px;
    }
    
    .combo-floater .combo-line2 {
        font-size: 0.9rem;
        font-weight: 700;
        color: #4ade80;
        text-shadow: 0 0 10px rgba(74, 222, 128, 0.8), 1px 1px 0 #000;
        margin-top: 2px;
    }
    
    @keyframes comboFloaterPop {
        0% {
            transform: translate(-50%, -100%) scale(0.5);
            opacity: 0;
        }
        30% {
            transform: translate(-50%, -100%) scale(1.3);
            opacity: 1;
        }
        60% {
            transform: translate(-50%, -100%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -150%) scale(0.8);
            opacity: 0;
        }
    }
    
    /* 보너스 데미지 플로터 */
    @keyframes bonusDamageFloat {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
        }
        20% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -100%) scale(1);
            opacity: 0;
        }
    }
    
    /* 콤보 디스플레이 (화면 고정) */
    .combo-display {
        position: fixed;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 500;
    }
    
    .combo-display.visible {
        opacity: 1;
    }
    
    .combo-display .combo-label {
        font-family: 'Cinzel', serif;
        font-size: 0.75rem;
        font-weight: 700;
        color: #f97316;
        letter-spacing: 2px;
        text-shadow: 0 0 10px rgba(249, 115, 22, 0.6), 1px 1px 0 #000;
    }
    
    .combo-display .combo-number {
        font-family: 'Cinzel', serif;
        font-size: 2rem;
        font-weight: 900;
        color: #fbbf24;
        text-shadow: 0 0 15px rgba(251, 191, 36, 0.8), 2px 2px 0 #000;
        line-height: 1;
    }
    
    .combo-display .combo-bonus {
        font-family: 'Cinzel', serif;
        font-size: 0.8rem;
        font-weight: 700;
        color: #4ade80;
        text-shadow: 0 0 10px rgba(74, 222, 128, 0.6), 1px 1px 0 #000;
    }
    
    .combo-bonus {
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        font-weight: 700;
        color: #4ade80;
        text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
    }
    
    /* 로그 유물 색상 */
    .log-entry.relic {
        color: #fbbf24;
    }
    
    /* 후벼파기 출혈 이펙트 */
    .deep-wound-effect {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.5rem;
        color: #ef4444;
        text-shadow: 
            0 0 10px #ef4444,
            0 0 20px #dc2626,
            2px 2px 0 #000;
        animation: deepWoundPop 1s ease-out forwards;
        pointer-events: none;
        z-index: 1000;
    }
    
    @keyframes deepWoundPop {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
        }
        30% {
            transform: translate(-50%, -50%) scale(1.3);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -100%) scale(1);
        }
    }
`;
document.head.appendChild(relicStyles);

// 시스템 초기화
RelicSystem.init();

console.log('[Relic System] 로드 완료');

