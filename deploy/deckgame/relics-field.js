// ==========================================
// 필드 연동 유물 (Field Relics)
// 특정 필드 효과와 시너지가 있는 유물들
// ==========================================

// 유물 데이터베이스에 필드 유물 추가
if (typeof relicDatabase !== 'undefined') {
    
    // ==========================================
    // 🌫️ 안개 연동 유물
    // ==========================================
    
    // 안개 걸음 신발 - 안개 환경에서 은신 획득
    relicDatabase.fogStepShoes = {
        id: 'fogStepShoes',
        name: 'Fog Step Shoes',
        name_kr: '안개 걸음 신발',
        icon: '👟',
        rarity: 'uncommon',
        description: 'In FOG: Gain 3 Stealth at turn start',
        description_kr: '[안개] 환경에서 매 턴 시작 시 은신 3 획득',
        fieldSynergy: 'fog',
        onTurnStart: (state) => {
            // 안개 필드가 활성화되어 있는지 확인
            if (typeof FieldSystem !== 'undefined' && FieldSystem.hasField('fog')) {
                // 은신 시스템이 있으면 은신 획득
                if (typeof StealthSystem !== 'undefined') {
                    StealthSystem.addStealth(3);
                    addLog('안개 속의 단검: 은신 +3!', 'buff');
                    
                    // 이펙트
                    const playerEl = document.getElementById('player');
                    if (playerEl && typeof VFX !== 'undefined') {
                        const rect = playerEl.getBoundingClientRect();
                        VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                            color: '#94a3b8',
                            count: 8,
                            speed: 100
                        });
                    }
                } else {
                    // 은신 시스템이 없으면 방어도로 대체
                    if (typeof gainBlock === 'function') {
                        gainBlock(state.player, 3);
                        addLog('안개 속의 단검: 방어도 +3!', 'buff');
                    }
                }
            }
        }
    };
    
    // 안개 망토 - 안개 환경에서 받는 데미지 감소
    relicDatabase.fogCloak = {
        id: 'fogCloak',
        name: 'Fog Cloak',
        name_kr: '안개 망토',
        icon: '🧥',
        rarity: 'rare',
        description: 'In FOG: Take 2 less damage from all sources',
        description_kr: '[안개] 환경에서 받는 모든 데미지 -2',
        fieldSynergy: 'fog',
        // 데미지 수정은 damage-system.js에서 처리해야 함
        modifyDamageTaken: (damage, state) => {
            if (typeof FieldSystem !== 'undefined' && FieldSystem.hasField('fog')) {
                const reduced = Math.max(0, damage - 2);
                if (damage !== reduced) {
                    addLog('안개 망토: 데미지 -2!', 'buff');
                }
                return reduced;
            }
            return damage;
        }
    };
    
    // ==========================================
    // ⛈️ 폭풍 연동 유물
    // ==========================================
    
    // 폭풍의 눈 - 폭풍 데미지 면역
    relicDatabase.stormEye = {
        id: 'stormEye',
        name: 'Eye of the Storm',
        name_kr: '폭풍의 눈',
        icon: '👁️',
        rarity: 'rare',
        description: 'Immune to STORM field damage',
        description_kr: '[폭풍] 환경 데미지에 면역',
        fieldSynergy: 'storm',
        immuneToField: 'storm'
    };
    
    // 번개의 지팡이 - 폭풍 환경에서 공격력 증가
    relicDatabase.lightningRod = {
        id: 'lightningRod',
        name: 'Lightning Rod',
        name_kr: '번개의 지팡이',
        icon: '⚡',
        rarity: 'uncommon',
        description: 'In STORM: Deal +3 damage with attacks',
        description_kr: '[폭풍] 환경에서 공격 데미지 +3',
        fieldSynergy: 'storm',
        modifyDamageDealt: (damage, state, card) => {
            if (typeof FieldSystem !== 'undefined' && FieldSystem.hasField('storm')) {
                const cardType = card?.type?.id || card?.type;
                if (cardType === 'attack') {
                    return damage + 3;
                }
            }
            return damage;
        }
    };
    
    // ==========================================
    // ✨ 성역 연동 유물
    // ==========================================
    
    // 축복받은 방패 - 성역 환경에서 추가 방어도
    relicDatabase.blessedShield = {
        id: 'blessedShield',
        name: 'Blessed Shield',
        name_kr: '축복받은 방패',
        icon: '🛡️',
        rarity: 'uncommon',
        description: 'In SANCTUARY: Gain +4 Block at turn start',
        description_kr: '[성역] 환경에서 매 턴 시작 시 방어도 +4',
        fieldSynergy: 'sanctuary',
        onTurnStart: (state) => {
            if (typeof FieldSystem !== 'undefined' && FieldSystem.hasField('sanctuary')) {
                if (typeof gainBlock === 'function') {
                    gainBlock(state.player, 4);
                    addLog('축복받은 방패: 방어도 +4!', 'buff');
                    
                    const playerEl = document.getElementById('player');
                    if (playerEl && typeof VFX !== 'undefined') {
                        const rect = playerEl.getBoundingClientRect();
                        VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                            color: '#fbbf24',
                            count: 10,
                            speed: 120
                        });
                    }
                }
            }
        }
    };
    
    // 신성한 부적 - 성역 환경에서 HP 회복
    relicDatabase.holyAmulet = {
        id: 'holyAmulet',
        name: 'Holy Amulet',
        name_kr: '신성한 부적',
        icon: '📿',
        rarity: 'rare',
        description: 'In SANCTUARY: Heal 2 HP at turn end',
        description_kr: '[성역] 환경에서 매 턴 종료 시 HP 2 회복',
        fieldSynergy: 'sanctuary',
        onTurnEnd: (state) => {
            if (typeof FieldSystem !== 'undefined' && FieldSystem.hasField('sanctuary')) {
                const healAmount = Math.min(2, state.player.maxHp - state.player.hp);
                if (healAmount > 0) {
                    state.player.hp += healAmount;
                    addLog(`신성한 부적: HP +${healAmount}!`, 'heal');
                    
                    if (typeof updatePlayerUI === 'function') {
                        updatePlayerUI();
                    }
                }
            }
        }
    };
    
    // ==========================================
    // 🔥 격노 연동 유물
    // ==========================================
    
    // 분노의 가면 - 격노 환경에서 추가 데미지 (받는 데미지 증가 없음)
    relicDatabase.rageMask = {
        id: 'rageMask',
        name: 'Mask of Fury',
        name_kr: '분노의 가면',
        icon: '👹',
        rarity: 'rare',
        description: 'In RAGE: Negate the extra damage taken',
        description_kr: '[격노] 환경의 추가 피해량 무효화',
        fieldSynergy: 'rage',
        negateFieldPenalty: 'rage'
    };
    
    // 광전사의 문장 - 격노 환경에서 공격 시 힘 획득
    relicDatabase.berserkerCrest = {
        id: 'berserkerCrest',
        name: 'Berserker Crest',
        name_kr: '광전사의 문장',
        icon: '🔱',
        rarity: 'uncommon',
        description: 'In RAGE: Gain 1 Strength on attack',
        description_kr: '[격노] 환경에서 공격 시 힘 +1',
        fieldSynergy: 'rage',
        onAttack: (state) => {
            if (typeof FieldSystem !== 'undefined' && FieldSystem.hasField('rage')) {
                state.player.strength = (state.player.strength || 0) + 1;
                addLog('광전사의 문장: 힘 +1!', 'buff');
                
                if (typeof updatePlayerUI === 'function') {
                    updatePlayerUI();
                }
            }
        }
    };
    
    // ==========================================
    // 🌑 어둠 연동 유물
    // ==========================================
    
    // 어둠의 시야 - 어둠 환경에서 드로우 패널티 무효화
    relicDatabase.darkVision = {
        id: 'darkVision',
        name: 'Dark Vision',
        name_kr: '어둠의 시야',
        icon: '👀',
        rarity: 'uncommon',
        description: 'Negate DARKNESS draw penalty',
        description_kr: '[어둠] 환경의 드로우 감소 무효화',
        fieldSynergy: 'darkness',
        negateFieldPenalty: 'darkness'
    };
    
    // 그림자 핵 - 어둠 환경에서 에너지 획득
    relicDatabase.shadowCore = {
        id: 'shadowCore',
        name: 'Shadow Core',
        name_kr: '그림자 핵',
        icon: '🖤',
        rarity: 'rare',
        description: 'In DARKNESS: +1 Energy at turn start',
        description_kr: '[어둠] 환경에서 매 턴 시작 시 에너지 +1',
        fieldSynergy: 'darkness',
        onTurnStart: (state) => {
            if (typeof FieldSystem !== 'undefined' && FieldSystem.hasField('darkness')) {
                state.player.energy += 1;
                addLog('그림자 핵: 에너지 +1!', 'energy');
                
                if (typeof updateEnergyUI === 'function') {
                    updateEnergyUI();
                }
                
                const playerEl = document.getElementById('player');
                if (playerEl && typeof VFX !== 'undefined') {
                    const rect = playerEl.getBoundingClientRect();
                    VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                        color: '#6b21a8',
                        count: 8,
                        speed: 100
                    });
                }
            }
        }
    };
    
    // ==========================================
    // 🌍 범용 필드 유물
    // ==========================================
    
    // 환경 적응자 - 모든 필드 효과가 1턴 더 지속
    relicDatabase.fieldAdaptor = {
        id: 'fieldAdaptor',
        name: 'Field Adaptor',
        name_kr: '환경 적응자',
        icon: '🌍',
        rarity: 'rare',
        description: 'Field effects you create last 1 extra turn',
        description_kr: '내가 생성한 필드 효과가 1턴 더 지속',
        extendFieldDuration: 1
    };
    
    // 기상학자의 지팡이 - 필드 카드 사용 시 에너지 회복
    relicDatabase.weatherStaff = {
        id: 'weatherStaff',
        name: 'Meteorologist Staff',
        name_kr: '기상학자의 지팡이',
        icon: '🌦️',
        rarity: 'uncommon',
        description: 'Gain 1 Energy when playing a Field card',
        description_kr: '필드 카드 사용 시 에너지 +1',
        onCardPlayed: (card, state) => {
            const cardType = card.type?.id || card.type;
            if (cardType === 'field') {
                state.player.energy += 1;
                addLog('기상학자의 지팡이: 에너지 +1!', 'energy');
                
                if (typeof updateEnergyUI === 'function') {
                    updateEnergyUI();
                }
            }
        }
    };
    
    console.log('[FieldRelics] 필드 연동 유물 12개 등록 완료');
}

// ==========================================
// RelicSystem 확장 - 필드 유물 지원
// ==========================================
if (typeof RelicSystem !== 'undefined') {
    
    // 턴 종료 시 유물 효과 (onTurnEnd 추가)
    const originalOnTurnEnd = RelicSystem.onTurnEnd;
    RelicSystem.onTurnEnd = function() {
        if (originalOnTurnEnd) {
            originalOnTurnEnd.call(this);
        }
        
        this.ownedRelics.forEach(relic => {
            if (relic.onTurnEnd) {
                relic.onTurnEnd(gameState);
            }
        });
    };
    
    // 공격 시 유물 효과 (onAttack)
    RelicSystem.onAttack = function(state) {
        this.ownedRelics.forEach(relic => {
            if (relic.onAttack) {
                relic.onAttack(state);
            }
        });
    };
    
    // 필드 지속시간 연장 체크
    RelicSystem.getFieldDurationBonus = function() {
        let bonus = 0;
        this.ownedRelics.forEach(relic => {
            if (relic.extendFieldDuration) {
                bonus += relic.extendFieldDuration;
            }
        });
        return bonus;
    };
    
    // 필드 페널티 무효화 체크
    RelicSystem.isFieldPenaltyNegated = function(fieldId) {
        return this.ownedRelics.some(relic => relic.negateFieldPenalty === fieldId);
    };
    
    // 필드 면역 체크
    RelicSystem.isImmuneToField = function(fieldId) {
        return this.ownedRelics.some(relic => relic.immuneToField === fieldId);
    };
    
    console.log('[FieldRelics] RelicSystem 확장 완료');
}

// ==========================================
// FieldSystem 확장 - 유물 연동
// ==========================================
if (typeof FieldSystem !== 'undefined') {
    
    // 원래 applyField 저장
    const originalApplyField = FieldSystem.applyField.bind(FieldSystem);
    
    // applyField 확장 - 유물로 지속시간 연장
    FieldSystem.applyField = function(fieldId, duration) {
        let extendedDuration = duration;
        
        // 유물로 지속시간 연장
        if (typeof RelicSystem !== 'undefined' && RelicSystem.getFieldDurationBonus) {
            const bonus = RelicSystem.getFieldDurationBonus();
            if (bonus > 0) {
                extendedDuration += bonus;
                addLog(`환경 적응자: 지속시간 +${bonus}턴!`, 'buff');
            }
        }
        
        return originalApplyField(fieldId, extendedDuration);
    };
    
    console.log('[FieldRelics] FieldSystem 확장 완료');
}

console.log('[FieldRelics] 필드 유물 시스템 로드 완료');

