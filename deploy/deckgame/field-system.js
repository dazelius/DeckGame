// ==========================================
// 필드 시스템 (Field System)
// 적과 아군 모두에게 적용되는 전장 효과
// ==========================================

const FieldSystem = {
    // 현재 활성 필드 효과들
    activeFields: [],
    
    // 필드 효과 정의
    fieldEffects: {
        fog: {
            id: 'fog',
            name: '안개',
            icon: '🌫️',
            color: '#94a3b8',
            description: '실드 생성량 -3',
            onApply: () => {
                addLog('안개가 전장을 뒤덮습니다...', 'field');
            },
            onRemove: () => {
                addLog('안개가 걷힙니다.', 'field');
            },
            // 실드 생성 시 호출되는 수정자
            modifyBlock: (amount) => {
                return Math.max(0, amount - 3);
            }
        },
        
        storm: {
            id: 'storm',
            name: '폭풍',
            icon: '⛈️',
            color: '#60a5fa',
            description: '매 턴 종료 시 모두에게 3 데미지',
            onApply: () => {
                addLog('폭풍이 몰아칩니다!', 'field');
            },
            onRemove: () => {
                addLog('폭풍이 잦아듭니다.', 'field');
            },
            onTurnEnd: (state) => {
                // 플레이어 데미지
                const playerDmg = 3;
                state.player.hp = Math.max(0, state.player.hp - playerDmg);
                addLog(`폭풍! 플레이어 -${playerDmg} HP`, 'damage');
                
                // 적 데미지
                if (state.enemy && state.enemy.hp > 0) {
                    state.enemy.hp = Math.max(0, state.enemy.hp - 3);
                    addLog(`폭풍! ${state.enemy.name} -3 HP`, 'damage');
                }
                
                // 이펙트
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenShake(8, 200);
                }
            }
        },
        
        sanctuary: {
            id: 'sanctuary',
            name: '성역',
            icon: '✨',
            color: '#fbbf24',
            description: '받는 데미지 -2',
            onApply: () => {
                addLog('신성한 성역이 펼쳐집니다.', 'field');
            },
            onRemove: () => {
                addLog('성역이 사라집니다.', 'field');
            },
            modifyDamageTaken: (amount) => {
                return Math.max(0, amount - 2);
            }
        },
        
        rage: {
            id: 'rage',
            name: '격노',
            icon: '🔥',
            color: '#ef4444',
            description: '주는 데미지 +2, 받는 데미지 +2',
            onApply: () => {
                addLog('분노가 전장을 휩쓸립니다!', 'field');
            },
            onRemove: () => {
                addLog('분노가 가라앉습니다.', 'field');
            },
            modifyDamageDealt: (amount) => {
                return amount + 2;
            },
            modifyDamageTaken: (amount) => {
                return amount + 2;
            }
        },
        
        darkness: {
            id: 'darkness',
            name: '어둠',
            icon: '🌑',
            color: '#1e1b4b',
            description: '카드 드로우 -1',
            onApply: () => {
                addLog('어둠이 시야를 가립니다...', 'field');
            },
            onRemove: () => {
                addLog('어둠이 걷힙니다.', 'field');
            },
            modifyDrawCount: (count) => {
                return Math.max(1, count - 1);
            }
        }
    },
    
    // ==========================================
    // 필드 효과 관리
    // ==========================================
    
    // 필드 효과 추가
    applyField(fieldId, duration) {
        const fieldDef = this.fieldEffects[fieldId];
        if (!fieldDef) {
            console.error(`[Field] Unknown field: ${fieldId}`);
            return false;
        }
        
        // 이미 활성화된 같은 필드가 있으면 지속시간 갱신
        const existing = this.activeFields.find(f => f.id === fieldId);
        if (existing) {
            existing.duration = Math.max(existing.duration, duration);
            addLog(`${fieldDef.name} 지속시간 갱신: ${existing.duration}턴`, 'field');
        } else {
            // 새 필드 추가
            this.activeFields.push({
                id: fieldId,
                duration: duration,
                ...fieldDef
            });
            
            // 🎬 인트로 애니메이션 표시
            this.showFieldIntro(fieldDef);
            
            // 적용 시 효과
            if (fieldDef.onApply) {
                fieldDef.onApply();
            }
            
            // 🌫️ VFX 시작
            if (typeof FieldVFX !== 'undefined') {
                FieldVFX.start(fieldId);
            }
        }
        
        this.updateFieldUI();
        this.applyFieldVisuals();
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('field', 0.5);
        }
        
        return true;
    },
    
    // 필드 효과 제거
    removeField(fieldId) {
        const index = this.activeFields.findIndex(f => f.id === fieldId);
        if (index === -1) return false;
        
        const field = this.activeFields[index];
        
        // 제거 시 효과
        if (field.onRemove) {
            field.onRemove();
        }
        
        // 🌫️ VFX 중지
        if (typeof FieldVFX !== 'undefined') {
            FieldVFX.stop(fieldId);
        }
        
        this.activeFields.splice(index, 1);
        this.updateFieldUI();
        this.applyFieldVisuals();
        
        return true;
    },
    
    // 모든 필드 제거
    clearAllFields() {
        this.activeFields.forEach(field => {
            if (field.onRemove) {
                field.onRemove();
            }
            // 🌫️ VFX 중지
            if (typeof FieldVFX !== 'undefined') {
                FieldVFX.stop(field.id);
            }
        });
        this.activeFields = [];
        this.updateFieldUI();
        this.applyFieldVisuals();
    },
    
    // 턴 종료 시 처리
    onTurnEnd(state) {
        // 각 필드의 턴 종료 효과 실행
        this.activeFields.forEach(field => {
            if (field.onTurnEnd) {
                field.onTurnEnd(state);
            }
        });
        
        // 지속시간 감소
        this.activeFields = this.activeFields.filter(field => {
            field.duration--;
            if (field.duration <= 0) {
                if (field.onRemove) {
                    field.onRemove();
                }
                // 🌫️ VFX 중지
                if (typeof FieldVFX !== 'undefined') {
                    FieldVFX.stop(field.id);
                }
                return false;
            }
            return true;
        });
        
        this.updateFieldUI();
        this.applyFieldVisuals();
    },
    
    // 전투 시작 시 초기화
    onBattleStart() {
        this.clearAllFields();
    },
    
    // ==========================================
    // 수정자 (Modifiers)
    // ==========================================
    
    // 실드 생성량 수정
    modifyBlockGain(amount) {
        let modified = amount;
        this.activeFields.forEach(field => {
            if (field.modifyBlock) {
                modified = field.modifyBlock(modified);
            }
        });
        return modified;
    },
    
    // 받는 데미지 수정
    modifyDamageTaken(amount) {
        let modified = amount;
        this.activeFields.forEach(field => {
            if (field.modifyDamageTaken) {
                modified = field.modifyDamageTaken(modified);
            }
        });
        return modified;
    },
    
    // 주는 데미지 수정
    modifyDamageDealt(amount) {
        let modified = amount;
        this.activeFields.forEach(field => {
            if (field.modifyDamageDealt) {
                modified = field.modifyDamageDealt(modified);
            }
        });
        return modified;
    },
    
    // 드로우 수 수정
    modifyDrawCount(count) {
        let modified = count;
        this.activeFields.forEach(field => {
            if (field.modifyDrawCount) {
                modified = field.modifyDrawCount(modified);
            }
        });
        return modified;
    },
    
    // 특정 필드가 활성화되어 있는지 확인
    hasField(fieldId) {
        return this.activeFields.some(f => f.id === fieldId);
    },
    
    // ==========================================
    // UI
    // ==========================================
    
    updateFieldUI() {
        // 기존 UI 제거
        let container = document.getElementById('field-effects-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'field-effects-container';
            
            // 전투 영역 상단에 배치
            const battleArea = document.querySelector('.battle-area');
            if (battleArea) {
                battleArea.insertBefore(container, battleArea.firstChild);
            } else {
                document.body.appendChild(container);
            }
        }
        
        container.innerHTML = '';
        
        if (this.activeFields.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        
        this.activeFields.forEach(field => {
            const fieldEl = document.createElement('div');
            fieldEl.className = 'field-effect-badge';
            fieldEl.innerHTML = `
                <span class="field-icon">${field.icon}</span>
                <span class="field-duration">${field.duration}</span>
                <div class="field-tooltip">
                    <div class="field-tooltip-name">${field.name}</div>
                    <div class="field-tooltip-desc">${field.description}</div>
                    <div class="field-tooltip-turns">남은 턴: ${field.duration}</div>
                </div>
            `;
            fieldEl.style.setProperty('--field-color', field.color);
            container.appendChild(fieldEl);
        });
    },
    
    // 🎬 다크소울 스타일 필드 인트로
    showFieldIntro(fieldDef) {
        // 기존 인트로 제거
        const existing = document.getElementById('field-intro-overlay');
        if (existing) existing.remove();
        
        // 다크소울 스타일 오버레이
        const overlay = document.createElement('div');
        overlay.id = 'field-intro-overlay';
        overlay.innerHTML = `
            <div class="ds-field-intro">
                <div class="ds-field-line"></div>
                <div class="ds-field-text">
                    <span class="ds-field-name">${fieldDef.name}</span>
                </div>
                <div class="ds-field-line"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 2.5초 후 페이드아웃
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 1000);
        }, 2500);
    },
    
    // 필드 비주얼 효과
    applyFieldVisuals() {
        const battleArea = document.querySelector('.battle-area');
        if (!battleArea) return;
        
        // 기존 필드 오버레이 제거
        const existingOverlay = document.getElementById('field-visual-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        if (this.activeFields.length === 0) {
            battleArea.style.filter = '';
            return;
        }
        
        // 필드에 따른 비주얼 효과
        const overlay = document.createElement('div');
        overlay.id = 'field-visual-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 5;
            transition: all 0.5s ease;
        `;
        
        // 필드별 오버레이 효과
        let overlayStyles = [];
        
        this.activeFields.forEach(field => {
            switch (field.id) {
                case 'fog':
                    overlayStyles.push('linear-gradient(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2))');
                    break;
                case 'storm':
                    overlayStyles.push('linear-gradient(rgba(96, 165, 250, 0.15), rgba(30, 58, 138, 0.2))');
                    break;
                case 'sanctuary':
                    overlayStyles.push('linear-gradient(rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))');
                    break;
                case 'rage':
                    overlayStyles.push('linear-gradient(rgba(239, 68, 68, 0.15), rgba(127, 29, 29, 0.1))');
                    break;
                case 'darkness':
                    overlayStyles.push('linear-gradient(rgba(30, 27, 75, 0.4), rgba(0, 0, 0, 0.3))');
                    break;
            }
        });
        
        if (overlayStyles.length > 0) {
            overlay.style.background = overlayStyles.join(', ');
            battleArea.appendChild(overlay);
        }
    }
};

// ==========================================
// 필드 카드 타입 등록
// ==========================================
if (typeof CardType !== 'undefined') {
    CardType.FIELD = 'field';
}

// ==========================================
// 필드 카드 정의
// ==========================================
if (typeof cardDatabase !== 'undefined') {
    
    // 안개 - 실드 감소
    cardDatabase.fogField = {
        id: 'fogField',
        name: '안개',
        type: 'field',
        rarity: typeof Rarity !== 'undefined' ? Rarity.UNCOMMON : 'uncommon',
        cost: 1,
        icon: '<img src="myst.png" alt="Fog" class="card-icon-img">',
        description: '<span class="field">3턴</span> 동안 안개가 깔립니다.<br>실드 생성량 <span class="debuff">-3</span>. (적/아군 모두)',
        exhaust: true,
        effect: (state) => {
            FieldSystem.applyField('fog', 3);
        }
    };
    
    // 폭풍 - 턴마다 전체 데미지
    cardDatabase.stormField = {
        id: 'stormField',
        name: '폭풍',
        type: 'field',
        rarity: typeof Rarity !== 'undefined' ? Rarity.RARE : 'rare',
        cost: 2,
        icon: '⛈️',
        description: '<span class="field">3턴</span> 동안 폭풍이 몰아칩니다.<br>매 턴 종료 시 모두 <span class="damage">3</span> 데미지.',
        exhaust: true,
        effect: (state) => {
            FieldSystem.applyField('storm', 3);
        }
    };
    
    // 성역 - 받는 데미지 감소
    cardDatabase.sanctuaryField = {
        id: 'sanctuaryField',
        name: '성역',
        type: 'field',
        rarity: typeof Rarity !== 'undefined' ? Rarity.UNCOMMON : 'uncommon',
        cost: 1,
        icon: '✨',
        description: '<span class="field">2턴</span> 동안 성역이 펼쳐집니다.<br>받는 데미지 <span class="buff">-2</span>. (적/아군 모두)',
        exhaust: true,
        effect: (state) => {
            FieldSystem.applyField('sanctuary', 2);
        }
    };
    
    // 격노 - 데미지 증가 (양날의 검)
    cardDatabase.rageField = {
        id: 'rageField',
        name: '격노',
        type: 'field',
        rarity: typeof Rarity !== 'undefined' ? Rarity.UNCOMMON : 'uncommon',
        cost: 1,
        icon: '🔥',
        description: '<span class="field">2턴</span> 동안 격노가 휩쓸립니다.<br>주는 데미지 <span class="damage">+2</span>, 받는 데미지 <span class="debuff">+2</span>.',
        exhaust: true,
        effect: (state) => {
            FieldSystem.applyField('rage', 2);
        }
    };
    
    // 어둠 - 드로우 감소
    cardDatabase.darknessField = {
        id: 'darknessField',
        name: '어둠',
        type: 'field',
        rarity: typeof Rarity !== 'undefined' ? Rarity.RARE : 'rare',
        cost: 2,
        icon: '🌑',
        description: '<span class="field">3턴</span> 동안 어둠이 깔립니다.<br>카드 드로우 <span class="debuff">-1</span>. (적/아군 모두)',
        exhaust: true,
        effect: (state) => {
            FieldSystem.applyField('darkness', 3);
        }
    };
    
    // 필드 정화 - 모든 필드 효과 제거
    cardDatabase.dispelField = {
        id: 'dispelField',
        name: '필드 정화',
        type: 'field',
        rarity: typeof Rarity !== 'undefined' ? Rarity.COMMON : 'common',
        cost: 0,
        icon: '💨',
        description: '모든 필드 효과를 제거합니다.',
        exhaust: true,
        effect: (state) => {
            if (FieldSystem.activeFields.length > 0) {
                FieldSystem.clearAllFields();
                addLog('필드가 정화되었습니다!', 'buff');
            } else {
                addLog('제거할 필드 효과가 없습니다.', 'info');
            }
        }
    };
    
    console.log('[FieldCards] 필드 카드 6장 등록 완료');
}

// ==========================================
// CSS 스타일 주입
// ==========================================
const fieldStyles = document.createElement('style');
fieldStyles.textContent = `
    #field-effects-container {
        display: none;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
        background: rgba(0,0,0,0.75);
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(8px);
    }
    
    .field-effect-badge {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        background: transparent;
        color: #fff;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 0.85rem;
        cursor: help;
        transition: all 0.2s ease;
        border-radius: 12px;
    }
    
    .field-effect-badge:hover {
        background: rgba(255,255,255,0.1);
    }
    
    .field-icon {
        font-size: 1.1rem;
        filter: drop-shadow(0 0 5px var(--field-color, #666));
    }
    
    .field-name {
        display: none;
    }
    
    .field-duration {
        background: var(--field-color, #666);
        color: #000;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: bold;
        min-width: 18px;
        text-align: center;
    }
    
    /* 툴팁 (아래로) */
    .field-effect-badge .field-tooltip {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(8px);
        padding: 10px 14px;
        background: rgba(0,0,0,0.95);
        border: 1px solid var(--field-color, #666);
        border-radius: 8px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        z-index: 1000;
        pointer-events: none;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    
    .field-effect-badge:hover .field-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(5px);
    }
    
    .field-tooltip-name {
        font-size: 0.95rem;
        font-weight: bold;
        color: var(--field-color, #fff);
        margin-bottom: 4px;
    }
    
    .field-tooltip-desc {
        font-size: 0.8rem;
        color: rgba(255,255,255,0.8);
    }
    
    .field-tooltip-turns {
        font-size: 0.75rem;
        color: var(--field-color, #888);
        margin-top: 4px;
    }
    
    /* 툴팁 화살표 (위쪽) */
    .field-effect-badge .field-tooltip::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-bottom-color: var(--field-color, #666);
        text-align: center;
    }
    
    @keyframes fieldBadgePulse {
        0%, 100% { 
            box-shadow: 
                0 0 15px var(--field-color, #666),
                inset 0 0 10px rgba(255,255,255,0.1);
        }
        50% { 
            box-shadow: 
                0 0 25px var(--field-color, #666),
                inset 0 0 15px rgba(255,255,255,0.15);
        }
    }
    
    /* 🎮 다크소울 스타일 필드 인트로 */
    #field-intro-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: none;
        background: transparent;
    }
    
    #field-intro-overlay.fade-out .ds-field-intro {
        animation: dsFieldFadeOut 1s ease-in forwards;
    }
    
    .ds-field-intro {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        width: 100%;
        padding: 30px 0;
        background: linear-gradient(180deg, 
            transparent 0%, 
            rgba(0,0,0,0.7) 20%, 
            rgba(0,0,0,0.85) 50%, 
            rgba(0,0,0,0.7) 80%, 
            transparent 100%);
        animation: dsFieldFadeIn 1s ease-out;
    }
    
    .ds-field-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(200,180,140,0.8), transparent);
        max-width: 300px;
    }
    
    .ds-field-text {
        padding: 0 50px;
        text-align: center;
    }
    
    .ds-field-name {
        font-family: 'Times New Roman', 'Noto Serif KR', serif;
        font-size: 3.5rem;
        font-weight: normal;
        color: rgba(220, 200, 160, 0.95);
        letter-spacing: 15px;
        text-transform: uppercase;
        text-shadow: 
            0 0 30px rgba(200, 180, 140, 0.5),
            0 0 60px rgba(200, 180, 140, 0.3),
            0 4px 8px rgba(0,0,0,0.8);
        animation: dsTextGlow 2s ease-in-out infinite alternate;
    }
    
    @keyframes dsFieldFadeIn {
        0% { 
            opacity: 0;
            transform: scaleX(0.8);
        }
        100% { 
            opacity: 1;
            transform: scaleX(1);
        }
    }
    
    @keyframes dsFieldFadeOut {
        0% { 
            opacity: 1;
        }
        100% { 
            opacity: 0;
        }
    }
    
    @keyframes dsTextGlow {
        0% { 
            text-shadow: 
                0 0 30px rgba(200, 180, 140, 0.5),
                0 0 60px rgba(200, 180, 140, 0.3),
                0 4px 8px rgba(0,0,0,0.8);
        }
        100% { 
            text-shadow: 
                0 0 40px rgba(200, 180, 140, 0.7),
                0 0 80px rgba(200, 180, 140, 0.4),
                0 4px 8px rgba(0,0,0,0.8);
        }
    }
    
    /* 필드 카드 스타일 */
    .card.field {
        border-color: #10b981;
        background: linear-gradient(135deg, #1a1a2e 0%, #0f3d3e 100%);
    }
    
    .card.field .card-type {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
    }
    
    .card.field:hover {
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
    }
    
    /* 카드 설명의 필드 태그 */
    .field {
        color: #10b981;
        font-weight: bold;
    }
    
    /* 필드 비주얼 오버레이 애니메이션 */
    #field-visual-overlay {
        animation: fieldOverlayPulse 3s ease-in-out infinite;
    }
    
    @keyframes fieldOverlayPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    
    /* 🌫️ 필드 카드 드롭 타겟 하이라이트 */
    .battle-area.drop-target-field {
        position: relative;
    }
    
    .battle-area.drop-target-field::after {
        content: '🌫️ 필드에 사용';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.5rem;
        font-weight: bold;
        color: #10b981;
        text-shadow: 0 0 20px #10b981, 0 0 40px #10b981;
        padding: 20px 40px;
        border: 3px dashed #10b981;
        border-radius: 20px;
        background: rgba(16, 185, 129, 0.1);
        backdrop-filter: blur(5px);
        z-index: 1000;
        animation: fieldTargetPulse 1s ease-in-out infinite alternate;
        pointer-events: none;
    }
    
    .battle-area.drop-target-field-active::after {
        content: '✨ 필드 효과 발동!';
        background: rgba(16, 185, 129, 0.3);
        border-style: solid;
        box-shadow: 0 0 30px #10b981, inset 0 0 30px rgba(16, 185, 129, 0.2);
    }
    
    @keyframes fieldTargetPulse {
        0% { 
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
            transform: translate(-50%, -50%) scale(1);
        }
        100% { 
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
            transform: translate(-50%, -50%) scale(1.02);
        }
    }
    
    /* 🌫️ 배경 전체 드롭 가능 표시 */
    .game-container.drop-target-field-bg {
        position: relative;
    }
    
    .game-container.drop-target-field-bg::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 3px dashed rgba(16, 185, 129, 0.4);
        border-radius: 10px;
        pointer-events: none;
        z-index: 1;
        animation: fieldBgPulse 1.5s ease-in-out infinite;
    }
    
    .game-container.drop-target-field-bg-active::before {
        border-style: solid;
        border-color: rgba(16, 185, 129, 0.8);
        background: rgba(16, 185, 129, 0.05);
        box-shadow: inset 0 0 50px rgba(16, 185, 129, 0.1);
    }
    
    @keyframes fieldBgPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(fieldStyles);

// 전역 등록
window.FieldSystem = FieldSystem;

console.log('[FieldSystem] 필드 시스템 로드 완료');

