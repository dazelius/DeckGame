// ==========================================
// 버프/디버프 시스템
// ==========================================

const BuffSystem = {
    // 버프 데이터베이스
    buffDatabase: {
        // 공격력 증가
        attackUp: {
            id: 'attackUp',
            name: '공격력 증가',
            icon: '⚔️',
            color: '#ef4444',
            type: 'buff',
            stackable: true, // 중첩 가능
            description: (value) => `공격력 +${value}`
        },
        // 방어력 증가
        defenseUp: {
            id: 'defenseUp',
            name: '방어력 증가',
            icon: '🛡️',
            color: '#3b82f6',
            type: 'buff',
            stackable: true,
            description: (value) => `방어력 +${value}`
        },
        // 전투 함성 (고블린 킹)
        battleCry: {
            id: 'battleCry',
            name: '전투 함성',
            icon: '🔥',
            color: '#f59e0b',
            type: 'buff',
            stackable: true,
            description: (value) => `공격력 +${value} (함성)`
        },
        // 울음 (다이어 울프)
        howl: {
            id: 'howl',
            name: '울음',
            icon: '🌙',
            color: '#a855f7',
            type: 'buff',
            stackable: true,
            description: (value) => `공격력 +${value} (울음)`
        },
        // 격노
        enrage: {
            id: 'enrage',
            name: '격노',
            icon: '😡',
            color: '#dc2626',
            type: 'buff',
            stackable: true,
            description: (value) => `공격력 +${value} (격노)`
        },
        // 취약 (디버프)
        vulnerable: {
            id: 'vulnerable',
            name: '취약',
            icon: '💔',
            color: '#a855f7',
            type: 'debuff',
            stackable: false,
            duration: true, // 턴 기반
            description: (value) => `취약 ${value}턴`
        },
        // 약화 (디버프)
        weak: {
            id: 'weak',
            name: '약화',
            icon: '💫',
            color: '#6b7280',
            type: 'debuff',
            stackable: false,
            duration: true,
            description: (value) => `공격력 25% 감소 ${value}턴`
        }
    },
    
    // ==========================================
    // 버프 적용
    // ==========================================
    applyBuff(target, buffId, value, source = null) {
        if (!target) return;
        
        const buffData = this.buffDatabase[buffId];
        if (!buffData) {
            console.warn(`[Buff] 알 수 없는 버프: ${buffId}`);
            return;
        }
        
        // 버프 배열 초기화
        if (!target.buffs) {
            target.buffs = {};
        }
        
        // 중첩 가능한 버프면 값 추가
        if (buffData.stackable && target.buffs[buffId]) {
            target.buffs[buffId].value += value;
        } else {
            target.buffs[buffId] = {
                ...buffData,
                value: value,
                source: source
            };
        }
        
        console.log(`[Buff] ${target.name}에게 ${buffData.name} +${value} 적용`);
        
        // 버프 효과 적용
        this.applyBuffEffect(target, buffId, value);
        
        return target.buffs[buffId];
    },
    
    // 버프 제거
    removeBuff(target, buffId) {
        if (!target || !target.buffs || !target.buffs[buffId]) return;
        
        const buff = target.buffs[buffId];
        console.log(`[Buff] ${target.name}에게서 ${buff.name} 제거`);
        
        // 버프 효과 제거
        this.removeBuffEffect(target, buffId, buff.value);
        
        delete target.buffs[buffId];
    },
    
    // 버프 값 감소 (턴 종료 시)
    decrementBuff(target, buffId, amount = 1) {
        if (!target || !target.buffs || !target.buffs[buffId]) return;
        
        const buff = target.buffs[buffId];
        buff.value -= amount;
        
        if (buff.value <= 0) {
            this.removeBuff(target, buffId);
        }
    },
    
    // ==========================================
    // 버프 효과 적용/제거
    // ==========================================
    applyBuffEffect(target, buffId, value) {
        switch(buffId) {
            case 'attackUp':
            case 'battleCry':
            case 'enrage':
            case 'howl':
                // 공격력 증가는 attackBuff에 저장
                target.attackBuff = (target.attackBuff || 0) + value;
                // 현재 인텐트가 공격이면 값도 증가
                if (target.intent === 'attack') {
                    target.intentValue += value;
                }
                break;
            case 'defenseUp':
                target.defenseBuff = (target.defenseBuff || 0) + value;
                break;
            case 'vulnerable':
                target.vulnerable = value;
                break;
            case 'weak':
                target.weak = value;
                break;
        }
    },
    
    removeBuffEffect(target, buffId, value) {
        switch(buffId) {
            case 'attackUp':
            case 'battleCry':
            case 'enrage':
            case 'howl':
                target.attackBuff = Math.max(0, (target.attackBuff || 0) - value);
                break;
            case 'defenseUp':
                target.defenseBuff = Math.max(0, (target.defenseBuff || 0) - value);
                break;
            case 'vulnerable':
                target.vulnerable = 0;
                break;
            case 'weak':
                target.weak = 0;
                break;
        }
    },
    
    // ==========================================
    // 버프 인디케이터 UI
    // ==========================================
    createBuffContainer(targetEl) {
        if (!targetEl) return null;
        
        // 기존 컨테이너 확인
        let container = targetEl.querySelector('.buff-container');
        if (container) return container;
        
        // 새 컨테이너 생성
        container = document.createElement('div');
        container.className = 'buff-container';
        targetEl.appendChild(container);
        
        return container;
    },
    
    // 버프 UI 업데이트
    updateBuffDisplay(target, targetEl) {
        if (!target || !targetEl) return;
        
        const container = this.createBuffContainer(targetEl);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!target.buffs) return;
        
        // 각 버프에 대해 아이콘 생성
        Object.values(target.buffs).forEach(buff => {
            if (buff.value <= 0) return;
            
            const buffIcon = document.createElement('div');
            buffIcon.className = `buff-icon ${buff.type}`;
            buffIcon.dataset.buffId = buff.id;
            buffIcon.style.setProperty('--buff-color', buff.color);
            
            buffIcon.innerHTML = `
                <span class="buff-emoji">${buff.icon}</span>
                <span class="buff-value">${buff.value}</span>
            `;
            
            // 툴팁
            buffIcon.addEventListener('mouseenter', (e) => this.showBuffTooltip(e, buff));
            buffIcon.addEventListener('mouseleave', () => this.hideBuffTooltip());
            
            container.appendChild(buffIcon);
            
            // 등장 애니메이션
            buffIcon.style.animation = 'buffAppear 0.3s ease-out';
        });
    },
    
    // 모든 적의 버프 UI 업데이트
    updateAllEnemiesBuffDisplay() {
        if (typeof gameState === 'undefined' || !gameState.enemies) return;
        
        gameState.enemies.forEach((enemy, index) => {
            const enemyEl = typeof getEnemyElement === 'function' 
                ? getEnemyElement(index) 
                : null;
            
            if (enemyEl) {
                this.updateBuffDisplay(enemy, enemyEl);
            }
        });
    },
    
    // 버프 툴팁
    showBuffTooltip(event, buff) {
        this.hideBuffTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'buff-tooltip';
        tooltip.className = 'buff-tooltip';
        tooltip.style.setProperty('--buff-color', buff.color);
        
        tooltip.innerHTML = `
            <div class="buff-tooltip-header">
                <span class="buff-tooltip-icon">${buff.icon}</span>
                <span class="buff-tooltip-name">${buff.name}</span>
            </div>
            <div class="buff-tooltip-desc">
                ${buff.description(buff.value)}
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
    },
    
    hideBuffTooltip() {
        const tooltip = document.getElementById('buff-tooltip');
        if (tooltip) tooltip.remove();
    },
    
    // ==========================================
    // 버프 발동 이펙트
    // ==========================================
    showBuffEffect(targetEl, buff) {
        if (!targetEl) return;
        
        // 버프 텍스트 표시
        const effectText = document.createElement('div');
        effectText.className = 'buff-effect-text';
        effectText.style.setProperty('--buff-color', buff.color);
        effectText.innerHTML = `
            <span class="effect-icon">${buff.icon}</span>
            <span class="effect-name">${buff.name}!</span>
        `;
        
        const rect = targetEl.getBoundingClientRect();
        effectText.style.left = `${rect.left + rect.width / 2}px`;
        effectText.style.top = `${rect.top - 20}px`;
        
        document.body.appendChild(effectText);
        setTimeout(() => effectText.remove(), 1500);
    },
    
    // 버프 값 변경 이펙트
    showBuffValueChange(targetEl, buff, change) {
        if (!targetEl) return;
        
        const container = targetEl.querySelector('.buff-container');
        if (!container) return;
        
        const buffIcon = container.querySelector(`[data-buff-id="${buff.id}"]`);
        if (!buffIcon) return;
        
        // 값 변경 팝업
        const popup = document.createElement('div');
        popup.className = `buff-change ${change > 0 ? 'positive' : 'negative'}`;
        popup.textContent = `${change > 0 ? '+' : ''}${change}`;
        popup.style.cssText = `
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem;
            font-weight: bold;
            color: ${change > 0 ? '#22c55e' : '#ef4444'};
            animation: buffChangeAnim 0.8s ease-out forwards;
            pointer-events: none;
        `;
        
        buffIcon.appendChild(popup);
        setTimeout(() => popup.remove(), 800);
    },
    
    // ==========================================
    // 턴 종료 시 처리
    // ==========================================
    onTurnEnd(target) {
        if (!target || !target.buffs) return;
        
        // 턴 기반 버프/디버프 감소
        Object.keys(target.buffs).forEach(buffId => {
            const buff = target.buffs[buffId];
            if (buff.duration) {
                this.decrementBuff(target, buffId);
            }
        });
    }
};

// ==========================================
// CSS 스타일
// ==========================================
const buffStyles = document.createElement('style');
buffStyles.textContent = `
    /* 버프 컨테이너 - 몬스터 하단에 표시 */
    .buff-container {
        position: absolute;
        bottom: -45px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 5px;
        z-index: 50;
    }
    
    /* 적 유닛 내 버프 컨테이너 */
    .enemy-unit .buff-container {
        bottom: -40px;
    }
    
    /* 버프 아이콘 */
    .buff-icon {
        position: relative;
        width: 32px;
        height: 32px;
        background: linear-gradient(145deg, rgba(30, 30, 45, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%);
        border: 2px solid var(--buff-color, #fbbf24);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }
    
    .buff-icon.buff {
        box-shadow: 0 0 8px var(--buff-color);
    }
    
    .buff-icon.debuff {
        border-style: dashed;
    }
    
    .buff-icon:hover {
        transform: scale(1.15);
        box-shadow: 0 0 15px var(--buff-color);
    }
    
    .buff-emoji {
        font-size: 1.1rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
    }
    
    .buff-value {
        position: absolute;
        bottom: -4px;
        right: -4px;
        min-width: 16px;
        height: 16px;
        background: var(--buff-color, #fbbf24);
        color: #000;
        font-size: 0.65rem;
        font-weight: 900;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 3px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    
    /* 버프 등장 애니메이션 */
    @keyframes buffAppear {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        60% { transform: scale(1.2) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    /* 버프 툴팁 */
    .buff-tooltip {
        position: fixed;
        background: linear-gradient(145deg, rgba(35, 35, 55, 0.98) 0%, rgba(20, 20, 35, 0.99) 100%);
        border: 2px solid var(--buff-color, #fbbf24);
        border-radius: 10px;
        padding: 10px 14px;
        z-index: 10000;
        transform: translateX(-50%);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5), 0 0 25px var(--buff-color);
        animation: tooltipFade 0.2s ease-out;
        min-width: 120px;
    }
    
    @keyframes tooltipFade {
        from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    
    .buff-tooltip-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .buff-tooltip-icon {
        font-size: 1.2rem;
    }
    
    .buff-tooltip-name {
        font-family: 'Cinzel', serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--buff-color, #fbbf24);
    }
    
    .buff-tooltip-desc {
        color: #d1d5db;
        font-size: 0.85rem;
    }
    
    /* 버프 발동 텍스트 */
    .buff-effect-text {
        position: fixed;
        display: flex;
        align-items: center;
        gap: 8px;
        transform: translateX(-50%);
        z-index: 10000;
        pointer-events: none;
        animation: buffEffectAnim 1.5s ease-out forwards;
    }
    
    .buff-effect-text .effect-icon {
        font-size: 1.8rem;
        filter: drop-shadow(0 0 10px var(--buff-color));
    }
    
    .buff-effect-text .effect-name {
        font-family: 'Cinzel', serif;
        font-size: 1.3rem;
        font-weight: 900;
        color: var(--buff-color, #fbbf24);
        text-shadow: 0 0 15px var(--buff-color), 2px 2px 0 #000;
    }
    
    @keyframes buffEffectAnim {
        0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
        20% { opacity: 1; transform: translateX(-50%) scale(1.2); }
        80% { opacity: 1; transform: translateX(-50%) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.8); }
    }
    
    /* 버프 값 변경 애니메이션 */
    @keyframes buffChangeAnim {
        0% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(buffStyles);

// 전역 접근
window.BuffSystem = BuffSystem;

console.log('[Buff] 버프 시스템 로드 완료');

