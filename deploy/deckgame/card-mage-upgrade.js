// ==========================================
// Shadow Deck - 마법사 카드 업그레이드
// ==========================================

const MageUpgrades = {
    // ==========================================
    // 마력 집중+ (방어도 증가)
    // ==========================================
    manaFocusPlus: {
        id: 'manaFocusPlus',
        name: '마력 집중+',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="magicT.png" alt="Mana Focus+" class="card-icon-img">',
        isIncantation: true,
        incantationBonus: 2, // 기본 1 + 보너스 2 = 총 3
        isUpgraded: true,
        description: '<span class="block-val">5</span> 방어도.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            gainBlock(state.player, 5);
            
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.manaFocus(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            addLog('🔮 마력 집중+! 방어도 5!', 'block');
        }
    },
    
    // ==========================================
    // 아케인 볼트+ (데미지 증가)
    // ==========================================
    arcaneBoltPlus: {
        id: 'arcaneBoltPlus',
        name: '아케인 볼트+',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="arcanebolt.png" alt="Arcane Bolt+" class="card-icon-img">',
        isIncantation: true,
        hitCount: 5,
        hitInterval: 150,
        isUpgraded: true,
        description: '무작위 적에게 <span class="damage">3</span> 데미지를 <span class="damage">5</span>회 발사.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            const aliveEnemies = [];
            if (gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, index) => {
                    if (enemy.hp > 0) {
                        const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                        if (el) aliveEnemies.push({ enemy, el, index });
                    }
                });
            }
            
            if (aliveEnemies.length === 0) {
                addLog('⚡ 아케인 볼트+ - 대상 없음!', 'warning');
                return;
            }
            
            let totalDelay = 0;
            for (let i = 0; i < 5; i++) {
                const randomDelay = 100 + Math.random() * 100;
                
                setTimeout(() => {
                    const livingEnemies = aliveEnemies.filter(e => e.enemy.hp > 0);
                    if (livingEnemies.length === 0) return;
                    
                    const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
                    
                    if (playerEl && typeof MageVFX !== 'undefined') {
                        const pRect = playerEl.getBoundingClientRect();
                        const eRect = target.el.getBoundingClientRect();
                        MageVFX.arcaneBolt(
                            pRect.left + pRect.width/2, pRect.top + pRect.height/2,
                            eRect.left + eRect.width/2, eRect.top + eRect.height/2
                        );
                    }
                    
                    setTimeout(() => {
                        if (target.enemy.hp > 0) {
                            dealDamage(target.enemy, 3); // 3 데미지
                            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                        }
                    }, 180);
                }, totalDelay);
                
                totalDelay += randomDelay;
            }
            
            setTimeout(() => {
                if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
            }, totalDelay + 300);
            
            addLog('⚡ 아케인 볼트+! 3×5 데미지!', 'damage');
        }
    },
    
    // ==========================================
    // 명상+ (2드로우)
    // ==========================================
    meditationPlus: {
        id: 'meditationPlus',
        name: '명상+',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="medi.png" alt="Meditation+" class="card-icon-img">',
        isIncantation: true,
        incantationBonus: 1, // 영창 2
        isUpgraded: true,
        description: '카드 2장 드로우.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.meditation(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            setTimeout(() => { drawCards(2, true); }, 200);
            
            addLog('🧘 명상+! 2 드로우!', 'draw');
        }
    },
    
    // ==========================================
    // 에너지 볼트+ (데미지 증가)
    // ==========================================
    energyBoltPlus: {
        id: 'energyBoltPlus',
        name: '에너지 볼트+',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '<img src="energybolt.png" alt="Energy Bolt+" class="card-icon-img">',
        isIncantation: true,
        isUpgraded: true,
        description: '에너지 볼트 시전.<br>턴 종료 시 랜덤 적 <span class="damage">5</span> 데미지.<br><span class="special">(최대 3개)</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            if (typeof EnergyBoltSystem === 'undefined') {
                addLog('에너지 볼트 시스템 오류!', 'error');
                return;
            }
            
            if (EnergyBoltSystem.bolts.length >= 3) {
                addLog('⚡ 과부하! 에너지 볼트+ 폭발!', 'critical');
                EnergyBoltSystem.triggerOverchargePlus(state); // 강화 버전
                if (typeof updateHandUI === 'function') {
                    setTimeout(() => updateHandUI(), 100);
                }
                return;
            }
            
            EnergyBoltSystem.addBoltPlus(); // 강화 버전 추가
            
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.energyBolt(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            addLog('⚡ 에너지 볼트+ 시전! (5 데미지)', 'buff');
        }
    },
    
    // ==========================================
    // 마나 증폭+ (영창 증가)
    // ==========================================
    manaAmplifyPlus: {
        id: 'manaAmplifyPlus',
        name: '마나 증폭+',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '💠',
        isIncantation: true,
        incantationBonus: 5, // 기본 1 + 보너스 5 = 총 6
        isUpgraded: true,
        description: '마력을 크게 증폭시킨다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.shockwave(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#8b5cf6', size: 200 });
                VFX.sparks(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#c084fc', count: 35, speed: 250 });
            }
            
            addLog('💠 마나 증폭+! 영창 6!', 'buff');
        }
    },
    
    // ==========================================
    // 시간 왜곡+ (코스트 감소)
    // ==========================================
    timeWarpPlus: {
        id: 'timeWarpPlus',
        name: '시간 왜곡+',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 0, // 1 → 0
        icon: '<img src="time.png" alt="Time Warp+" class="card-icon-img">',
        isIncantation: true,
        incantationBonus: 1,
        isEthereal: true,
        isUpgraded: true,
        description: '직전에 사용한 카드를<br>한번 더 사용한다.<br><span class="ethereal">소멸</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.timeWarp(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            if (!gameState.lastPlayedCard) {
                addLog('⏳ 시간 왜곡+ - 직전 카드 없음!', 'warning');
                return;
            }
            
            const lastCard = gameState.lastPlayedCard;
            
            if (lastCard.id === 'timeWarp' || lastCard.id === 'timeWarpPlus') {
                addLog('⏳ 시간 왜곡은 자기 자신을 복제할 수 없습니다!', 'warning');
                return;
            }
            
            addLog(`⏳ 시간 왜곡+! ${lastCard.name} 재사용!`, 'special');
            
            setTimeout(() => {
                lastCard.effect(state);
            }, 300);
        }
    },
    
    // ==========================================
    // 마력 해방+ (배수 증가)
    // ==========================================
    manaReleasePlus: {
        id: 'manaReleasePlus',
        name: '마력 해방+',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '💥',
        isUpgraded: true,
        description: '영창 전부 소모.<br>영창 × <span class="damage">6</span> 데미지.',
        effect: (state) => {
            if (typeof IncantationSystem === 'undefined' || !IncantationSystem.isActive) {
                dealDamage(state.enemy, 0);
                addLog('영창 시스템이 비활성화 상태입니다.', 'warning');
                return;
            }
            
            const stacks = IncantationSystem.consumeAll();
            const damage = stacks * 6; // 4 → 6
            
            if (damage <= 0) {
                addLog('영창이 없습니다!', 'warning');
                state.player.energy += 1;
                return;
            }
            
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            if (enemyEl && typeof VFX !== 'undefined') {
                const rect = enemyEl.getBoundingClientRect();
                VFX.shockwave(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#8b5cf6', size: 250 + stacks * 25 });
                VFX.sparks(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#c084fc', count: 25 + stacks * 6, speed: 350 });
            }
            
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(stacks * 3, 400);
            }
            
            setTimeout(() => {
                dealDamage(state.enemy, damage);
            }, 200);
            
            addLog(`💥 마력 해방+! ${stacks} 영창 × 6 = ${damage} 데미지!`, 'critical');
        }
    },
    
    // ==========================================
    // 불안정한 마력+ (자해 감소)
    // ==========================================
    unstableManaPlus: {
        id: 'unstableManaPlus',
        name: '불안정한 마력+',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 0,
        icon: '⚠️',
        isIncantation: true,
        incantationBonus: 3, // 기본 1 + 보너스 3 = 총 4
        isUpgraded: true,
        description: '<span class="debuff">자신에게 2 데미지.</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            state.player.hp = Math.max(1, state.player.hp - 2); // 4 → 2
            updateUI();
            
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.impact(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#ef4444', size: 80 });
                VFX.sparks(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#a855f7', count: 15, speed: 100 });
            }
            
            addLog('⚠️ 불안정한 마력+! 자해 2, 영창 4!', 'damage');
        }
    },
    
    // ==========================================
    // 마력 폭주 (새 카드) - 대형 공격
    // ==========================================
    manaExplosion: {
        id: 'manaExplosion',
        name: '마력 폭주',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 3,
        icon: '🌟',
        isIncantation: true,
        incantationBonus: 2,
        description: '모든 적에게 <span class="damage">20</span> 데미지.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 대형 이펙트
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.shockwave(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#fbbf24', size: 400 });
            }
            
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(20, 500);
            }
            
            // 모든 적에게 데미지
            setTimeout(() => {
                if (gameState.enemies && gameState.enemies.length > 0) {
                    gameState.enemies.forEach((enemy, index) => {
                        if (enemy.hp > 0) {
                            const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                            if (el && typeof VFX !== 'undefined') {
                                const eRect = el.getBoundingClientRect();
                                VFX.impact(eRect.left + eRect.width/2, eRect.top + eRect.height/2, { color: '#fbbf24', size: 150 });
                            }
                            dealDamage(enemy, 20);
                        }
                    });
                    if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                }
            }, 300);
            
            setTimeout(() => {
                if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
            }, 600);
            
            addLog('🌟 마력 폭주! 모든 적 20 데미지!', 'critical');
        }
    },
    
    // ==========================================
    // 마력 폭주+ (데미지 증가)
    // ==========================================
    manaExplosionPlus: {
        id: 'manaExplosionPlus',
        name: '마력 폭주+',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 3,
        icon: '🌟',
        isIncantation: true,
        incantationBonus: 3,
        isUpgraded: true,
        description: '모든 적에게 <span class="damage">28</span> 데미지.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.shockwave(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#fbbf24', size: 500 });
                VFX.sparks(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#fff', count: 40, speed: 400 });
            }
            
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(25, 600);
            }
            
            setTimeout(() => {
                if (gameState.enemies && gameState.enemies.length > 0) {
                    gameState.enemies.forEach((enemy, index) => {
                        if (enemy.hp > 0) {
                            const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                            if (el && typeof VFX !== 'undefined') {
                                const eRect = el.getBoundingClientRect();
                                VFX.impact(eRect.left + eRect.width/2, eRect.top + eRect.height/2, { color: '#fbbf24', size: 180 });
                            }
                            dealDamage(enemy, 28);
                        }
                    });
                    if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                }
            }, 300);
            
            setTimeout(() => {
                if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
            }, 600);
            
            addLog('🌟 마력 폭주+! 모든 적 28 데미지!', 'critical');
        }
    }
};

// cardDatabase에 등록
if (typeof cardDatabase !== 'undefined') {
    Object.assign(cardDatabase, MageUpgrades);
    console.log('[MageUpgrades] 마법사 카드 cardDatabase 등록 완료:', Object.keys(MageUpgrades).length + '장');
}

// upgradedCardDatabase에도 등록 (업그레이드 시스템용)
if (typeof upgradedCardDatabase !== 'undefined') {
    Object.assign(upgradedCardDatabase, MageUpgrades);
    console.log('[MageUpgrades] 마법사 카드 upgradedCardDatabase 등록 완료');
}

// 업그레이드 매핑
if (typeof CardUpgradeSystem !== 'undefined') {
    // 기존 업그레이드 매핑에 추가
    const mageUpgradeMap = {
        'manaFocus': 'manaFocusPlus',
        'arcaneBolt': 'arcaneBoltPlus',
        'meditation': 'meditationPlus',
        'energyBolt': 'energyBoltPlus',
        'manaAmplify': 'manaAmplifyPlus',
        'timeWarp': 'timeWarpPlus',
        'manaRelease': 'manaReleasePlus',
        'unstableMana': 'unstableManaPlus',
        'manaExplosion': 'manaExplosionPlus'
    };
    
    if (CardUpgradeSystem.upgradeMap) {
        Object.assign(CardUpgradeSystem.upgradeMap, mageUpgradeMap);
    }
    
    console.log('[MageUpgrades] 업그레이드 매핑 등록 완료');
} else {
    // CardUpgradeSystem이 없으면 전역 매핑 생성
    window.MageUpgradeMap = {
        'manaFocus': 'manaFocusPlus',
        'arcaneBolt': 'arcaneBoltPlus',
        'meditation': 'meditationPlus',
        'energyBolt': 'energyBoltPlus',
        'manaAmplify': 'manaAmplifyPlus',
        'timeWarp': 'timeWarpPlus',
        'manaRelease': 'manaReleasePlus',
        'unstableMana': 'unstableManaPlus',
        'manaExplosion': 'manaExplosionPlus'
    };
}

// EnergyBoltSystem 확장 (강화 버전)
if (typeof EnergyBoltSystem !== 'undefined') {
    // 강화 버전 볼트 추가
    EnergyBoltSystem.addBoltPlus = function() {
        if (this.bolts.length >= 3) return;
        this.bolts.push({ damage: 5, isPlus: true }); // 5 데미지
        this.updateUI();
    };
    
    // 강화 버전 과부하
    EnergyBoltSystem.triggerOverchargePlus = function(state) {
        const totalDamage = this.bolts.reduce((sum, b) => sum + (b.damage || 3), 0) + 8;
        
        if (gameState.enemies && gameState.enemies.length > 0) {
            gameState.enemies.forEach((enemy) => {
                if (enemy.hp > 0) {
                    dealDamage(enemy, totalDamage);
                }
            });
        }
        
        if (typeof VFX !== 'undefined') {
            VFX.shockwave(window.innerWidth/2, window.innerHeight/2, { color: '#60a5fa', size: 350 });
        }
        
        this.clear();
        addLog(`⚡⚡ 과부하+ 폭발! 모든 적 ${totalDamage} 데미지!`, 'critical');
    };
}

window.MageUpgrades = MageUpgrades;
console.log('[MageUpgrades] 마법사 카드 업그레이드 시스템 로드 완료');

