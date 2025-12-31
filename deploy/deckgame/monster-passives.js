// ==========================================
// 몬스터 패시브 시스템
// ==========================================

const MonsterPassiveSystem = {
    // 패시브 데이터베이스
    passiveDatabase: {
        thorns: {
            id: 'thorns',
            name: '가시',
            icon: '🌵',
            color: '#22c55e',
            description: (value) => `피격 시 ${value} 데미지 반사`
        },
        regeneration: {
            id: 'regeneration',
            name: '재생',
            icon: '💚',
            color: '#10b981',
            description: (value) => `턴 종료 시 HP ${value} 회복`
        },
        enrage: {
            id: 'enrage',
            name: '격노',
            icon: '😡',
            color: '#ef4444',
            description: (value) => `HP ${value}% 이하 시 공격력 2배`
        },
        armor: {
            id: 'armor',
            name: '중갑',
            icon: '🛡️',
            color: '#6b7280',
            description: (value) => `받는 데미지 ${value} 감소`
        },
        poison: {
            id: 'poison',
            name: '맹독',
            icon: '☠️',
            color: '#a855f7',
            description: (value) => `공격 시 ${value} 독 부여`
        },
        multiStrike: {
            id: 'multiStrike',
            name: '연속 공격',
            icon: '⚡',
            color: '#fbbf24',
            description: (value) => `공격 시 ${value}회 타격`
        },
        shieldBreaker: {
            id: 'shieldBreaker',
            name: '방패 파괴',
            icon: '💥',
            color: '#f97316',
            description: () => `공격 시 방어도 무시`
        },
        lifesteal: {
            id: 'lifesteal',
            name: '흡혈',
            icon: '🩸',
            color: '#dc2626',
            description: (value) => `데미지의 ${value}% HP 흡수`
        },
        bleedOnAttack: {
            id: 'bleedOnAttack',
            name: '출혈 공격',
            icon: '🩸',
            color: '#ef4444',
            description: () => `모든 공격이 출혈을 유발`
        },
        wildInstinct: {
            id: 'wildInstinct',
            name: '야생성',
            icon: '🐺',
            color: '#22c55e',
            description: (value) => `턴 종료 시 HP ${value} 회복`
        },
        split: {
            id: 'split',
            name: '분열',
            icon: '💜',
            color: '#a855f7',
            description: (value) => `HP 50% 이하 시 2마리로 분열`
        },
        webOnAttack: {
            id: 'webOnAttack',
            name: '거미줄',
            icon: '🕸️',
            color: '#9ca3af',
            description: (value) => `공격 시 덱에 거미줄 ${value}장 추가`
        },
        healer: {
            id: 'healer',
            name: '치유사',
            icon: '💚',
            color: '#4ade80',
            description: () => `아군을 치료할 수 있음`
        },
        magicUser: {
            id: 'magicUser',
            name: '마법 사용자',
            icon: '🔮',
            color: '#a78bfa',
            description: () => `마법 공격 사용`
        },
        deathSentence: {
            id: 'deathSentence',
            name: '죽음의 선고',
            icon: '☠️',
            color: '#7c3aed',
            description: (value) => value > 0 ? `턴 종료 시 공격력 +1 (현재 +${value})` : `턴 종료 시 공격력 +1`
        },
        deathTouch: {
            id: 'deathTouch',
            name: '죽음의 손길',
            icon: '💀',
            color: '#4c1d95',
            description: () => `HP 30% 이하 시 처형 준비`
        },
        shadowClone: {
            id: 'shadowClone',
            name: '그림자 분신',
            icon: '👥',
            color: '#6b21a8',
            description: () => `분신을 소환하여 함께 공격`
        },
        // 광신도 패시브
        frenzy: {
            id: 'frenzy',
            name: '광기',
            icon: '🔥',
            color: '#dc2626',
            description: (value) => value > 0 ? `광기 ${value} 중첩 (공격력 +${value})` : `자해할수록 강해진다`
        },
        bloodlust: {
            id: 'bloodlust',
            name: '피의 갈망',
            icon: '🩸',
            color: '#b91c1c',
            description: () => `광기가 3 이상이면 매 턴 자동 자해`
        },
        // 분노의 골렘 패시브
        rage: {
            id: 'rage',
            name: '분노',
            icon: '💢',
            color: '#ef4444',
            description: (value) => value > 0 ? `분노 ${value}/20 (공격력 +${Math.floor(value/2)}, 크기 ${Math.round(100 + value*2.5)}%)` : `피격 시 분노 증가`
        },
        growth: {
            id: 'growth',
            name: '성장',
            icon: '📈',
            color: '#f97316',
            description: () => `히트마다 분노 +1 (최대 150%)`
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.createPassiveContainer();
        console.log('[MonsterPassive] 시스템 초기화');
    },
    
    // ==========================================
    // 패시브 컨테이너 생성
    // ==========================================
    createPassiveContainer() {
        // 기존 컨테이너 제거
        const existing = document.getElementById('monster-passives');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'monster-passives';
        container.className = 'monster-passives';
        
        // 적 영역에 추가
        const enemyArea = document.getElementById('enemy');
        if (enemyArea) {
            enemyArea.appendChild(container);
        }
    },
    
    // ==========================================
    // 다중 적 패시브 표시 업데이트
    // ==========================================
    updateDisplayForEnemy(enemy, enemyIndex) {
        if (!enemy || enemy.hp <= 0) return;
        
        const container = document.getElementById('enemies-container');
        if (!container) return;
        
        const enemyEl = container.querySelector(`[data-index="${enemyIndex}"]`);
        if (!enemyEl) return;
        
        // 기존 패시브 컨테이너 제거 후 재생성
        let passiveContainer = enemyEl.querySelector('.monster-passives');
        if (!passiveContainer) {
            passiveContainer = document.createElement('div');
            passiveContainer.className = 'monster-passives';
            enemyEl.appendChild(passiveContainer);
        }
        
        passiveContainer.innerHTML = '';
        
        // 가시 패시브
        if (enemy.thorns && enemy.thorns > 0) {
            this.addPassiveIconToContainer(passiveContainer, 'thorns', enemy.thorns);
        }
        
        // 재생 패시브
        if (enemy.regeneration && enemy.regeneration > 0) {
            this.addPassiveIconToContainer(passiveContainer, 'regeneration', enemy.regeneration);
        }
        
        // 격노 패시브
        if (enemy.enrage) {
            this.addPassiveIconToContainer(passiveContainer, 'enrage', enemy.enrage);
        }
        
        // 중갑 패시브
        if (enemy.armor && enemy.armor > 0) {
            this.addPassiveIconToContainer(passiveContainer, 'armor', enemy.armor);
        }
        
        // 독 패시브
        if (enemy.poison && enemy.poison > 0) {
            this.addPassiveIconToContainer(passiveContainer, 'poison', enemy.poison);
        }
        
        // 연속 공격 패시브
        if (enemy.multiStrike && enemy.multiStrike > 1) {
            this.addPassiveIconToContainer(passiveContainer, 'multiStrike', enemy.multiStrike);
        }
        
        // 방패 파괴 패시브
        if (enemy.shieldBreaker) {
            this.addPassiveIconToContainer(passiveContainer, 'shieldBreaker', null);
        }
        
        // 흡혈 패시브
        if (enemy.lifesteal && enemy.lifesteal > 0) {
            this.addPassiveIconToContainer(passiveContainer, 'lifesteal', enemy.lifesteal);
        }
        
        // 출혈 공격 패시브
        if (enemy.bleedOnAttack) {
            this.addPassiveIconToContainer(passiveContainer, 'bleedOnAttack', null);
        }
        
        // 야생성 패시브
        if (enemy.wildInstinct && enemy.wildInstinct > 0) {
            this.addPassiveIconToContainer(passiveContainer, 'wildInstinct', enemy.wildInstinct);
        }
        
        // 분열 패시브 (아직 분열 안 했을 때만)
        if (enemy.canSplit && !enemy.hasSplit) {
            this.addPassiveIconToContainer(passiveContainer, 'split', null);
        }
        
        // 거미줄 패시브
        if (enemy.webOnAttack && enemy.webOnAttack > 0) {
            this.addPassiveIconToContainer(passiveContainer, 'webOnAttack', enemy.webOnAttack);
        }
        
        // ✅ passives 배열에서 추가 패시브 체크
        if (enemy.passives && Array.isArray(enemy.passives)) {
            // 죽음의 선고 패시브
            if (enemy.passives.includes('deathSentence')) {
                this.addPassiveIconToContainer(passiveContainer, 'deathSentence', enemy.attackBonus || 0);
            }
            // 죽음의 손길 패시브
            if (enemy.passives.includes('deathTouch')) {
                this.addPassiveIconToContainer(passiveContainer, 'deathTouch', null);
            }
            // 그림자 분신 패시브
            if (enemy.passives.includes('shadowClone')) {
                this.addPassiveIconToContainer(passiveContainer, 'shadowClone', null);
            }
            // 치유사 패시브
            if (enemy.passives.includes('healer')) {
                this.addPassiveIconToContainer(passiveContainer, 'healer', null);
            }
            // 마법 사용자 패시브
            if (enemy.passives.includes('magicUser')) {
                this.addPassiveIconToContainer(passiveContainer, 'magicUser', null);
            }
            // 광기 패시브 (광신도)
            if (enemy.passives.includes('frenzy')) {
                this.addPassiveIconToContainer(passiveContainer, 'frenzy', enemy.frenzyStacks || 0);
            }
            // 피의 갈망 패시브 (광신도)
            if (enemy.passives.includes('bloodlust') && (enemy.frenzyStacks || 0) >= 3) {
                this.addPassiveIconToContainer(passiveContainer, 'bloodlust', null);
            }
            // 분노 패시브 (분노의 골렘)
            if (enemy.passives.includes('rage')) {
                this.addPassiveIconToContainer(passiveContainer, 'rage', enemy.rageStacks || 0);
            }
            // 성장 패시브 (분노의 골렘)
            if (enemy.passives.includes('growth') && (enemy.rageStacks || 0) > 0) {
                this.addPassiveIconToContainer(passiveContainer, 'growth', null);
            }
        }
    },
    
    // 모든 적 패시브 표시 업데이트
    updateAllEnemiesDisplay(enemies) {
        if (!enemies || enemies.length === 0) return;
        
        enemies.forEach((enemy, index) => {
            if (enemy && enemy.hp > 0) {
                this.updateDisplayForEnemy(enemy, index);
            }
        });
        
        console.log('[MonsterPassive] 모든 적 패시브 업데이트 완료');
    },
    
    // 컨테이너에 패시브 아이콘 추가
    addPassiveIconToContainer(container, passiveId, value) {
        const passive = this.passiveDatabase[passiveId];
        if (!passive) return;
        
        const iconEl = document.createElement('div');
        iconEl.className = 'passive-icon';
        iconEl.dataset.passiveId = passiveId;
        iconEl.style.setProperty('--passive-color', passive.color);
        
        iconEl.innerHTML = `
            <span class="passive-emoji">${passive.icon}</span>
            ${value !== null ? `<span class="passive-value">${value}</span>` : ''}
        `;
        
        // 툴팁 이벤트
        iconEl.addEventListener('mouseenter', (e) => this.showTooltip(e, passive, value));
        iconEl.addEventListener('mouseleave', () => this.hideTooltip());
        
        container.appendChild(iconEl);
    },
    
    // ==========================================
    // 패시브 표시 업데이트 (구버전 호환)
    // ==========================================
    updateDisplay(enemy) {
        const container = document.getElementById('monster-passives');
        if (!container) {
            this.createPassiveContainer();
            return this.updateDisplay(enemy);
        }
        
        container.innerHTML = '';
        
        if (!enemy) return;
        
        // 가시 패시브
        if (enemy.thorns && enemy.thorns > 0) {
            this.addPassiveIcon(container, 'thorns', enemy.thorns);
        }
        
        // 재생 패시브
        if (enemy.regeneration && enemy.regeneration > 0) {
            this.addPassiveIcon(container, 'regeneration', enemy.regeneration);
        }
        
        // 격노 패시브
        if (enemy.enrage) {
            this.addPassiveIcon(container, 'enrage', enemy.enrage);
        }
        
        // 중갑 패시브
        if (enemy.armor && enemy.armor > 0) {
            this.addPassiveIcon(container, 'armor', enemy.armor);
        }
        
        // 독 패시브
        if (enemy.poison && enemy.poison > 0) {
            this.addPassiveIcon(container, 'poison', enemy.poison);
        }
        
        // 연속 공격 패시브
        if (enemy.multiStrike && enemy.multiStrike > 1) {
            this.addPassiveIcon(container, 'multiStrike', enemy.multiStrike);
        }
        
        // 방패 파괴 패시브
        if (enemy.shieldBreaker) {
            this.addPassiveIcon(container, 'shieldBreaker', null);
        }
        
        // 흡혈 패시브
        if (enemy.lifesteal && enemy.lifesteal > 0) {
            this.addPassiveIcon(container, 'lifesteal', enemy.lifesteal);
        }
        
        // 출혈 공격 패시브
        if (enemy.bleedOnAttack) {
            this.addPassiveIcon(container, 'bleedOnAttack', null);
        }
        
        // 야생성 패시브
        if (enemy.wildInstinct && enemy.wildInstinct > 0) {
            this.addPassiveIcon(container, 'wildInstinct', enemy.wildInstinct);
        }
        
        // 분열 패시브 (아직 분열 안 했을 때만)
        if (enemy.canSplit && !enemy.hasSplit) {
            this.addPassiveIcon(container, 'split', null);
        }
        
        // 거미줄 패시브
        if (enemy.webOnAttack && enemy.webOnAttack > 0) {
            this.addPassiveIcon(container, 'webOnAttack', enemy.webOnAttack);
        }
    },
    
    // ==========================================
    // 패시브 아이콘 추가
    // ==========================================
    addPassiveIcon(container, passiveId, value) {
        const passive = this.passiveDatabase[passiveId];
        if (!passive) return;
        
        const iconEl = document.createElement('div');
        iconEl.className = 'passive-icon';
        iconEl.dataset.passiveId = passiveId;
        iconEl.style.setProperty('--passive-color', passive.color);
        
        iconEl.innerHTML = `
            <span class="passive-emoji">${passive.icon}</span>
            ${value !== null ? `<span class="passive-value">${value}</span>` : ''}
        `;
        
        // 툴팁 이벤트
        iconEl.addEventListener('mouseenter', (e) => this.showTooltip(e, passive, value));
        iconEl.addEventListener('mouseleave', () => this.hideTooltip());
        
        container.appendChild(iconEl);
        
        // 등장 애니메이션
        iconEl.style.animation = 'passiveAppear 0.3s ease-out';
    },
    
    // ==========================================
    // 툴팁 표시
    // ==========================================
    showTooltip(event, passive, value) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'passive-tooltip';
        tooltip.className = 'passive-tooltip';
        tooltip.style.setProperty('--passive-color', passive.color);
        
        tooltip.innerHTML = `
            <div class="passive-tooltip-header">
                <span class="passive-tooltip-icon">${passive.icon}</span>
                <span class="passive-tooltip-name">${passive.name}</span>
            </div>
            <div class="passive-tooltip-desc">
                ${passive.description(value)}
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // 위치 조정
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
    },
    
    // ==========================================
    // 툴팁 숨기기
    // ==========================================
    hideTooltip() {
        const tooltip = document.getElementById('passive-tooltip');
        if (tooltip) tooltip.remove();
    },
    
    // ==========================================
    // 패시브 값 변경 애니메이션
    // ==========================================
    animatePassiveChange(passiveId, newValue, isIncrease = true) {
        const container = document.getElementById('monster-passives');
        if (!container) return;
        
        const iconEl = container.querySelector(`[data-passive-id="${passiveId}"]`);
        if (!iconEl) return;
        
        // 값 업데이트
        const valueEl = iconEl.querySelector('.passive-value');
        if (valueEl) {
            valueEl.textContent = newValue;
        }
        
        // 변경 애니메이션
        iconEl.classList.add(isIncrease ? 'passive-increase' : 'passive-decrease');
        setTimeout(() => {
            iconEl.classList.remove('passive-increase', 'passive-decrease');
        }, 500);
        
        // 플로터 표시
        this.showPassiveFloater(iconEl, isIncrease ? `+${newValue}` : `-${newValue}`, isIncrease);
    },
    
    // ==========================================
    // 패시브 플로터
    // ==========================================
    showPassiveFloater(targetEl, text, isPositive) {
        const rect = targetEl.getBoundingClientRect();
        
        const floater = document.createElement('div');
        floater.className = `passive-floater ${isPositive ? 'positive' : 'negative'}`;
        floater.textContent = text;
        floater.style.left = `${rect.left + rect.width / 2}px`;
        floater.style.top = `${rect.top}px`;
        
        document.body.appendChild(floater);
        
        setTimeout(() => floater.remove(), 1000);
    },
    
    // ==========================================
    // 패시브 발동 효과
    // ==========================================
    triggerPassiveEffect(passiveId) {
        const container = document.getElementById('monster-passives');
        if (!container) return;
        
        const iconEl = container.querySelector(`[data-passive-id="${passiveId}"]`);
        if (!iconEl) return;
        
        // 발동 애니메이션
        iconEl.classList.add('passive-triggered');
        setTimeout(() => iconEl.classList.remove('passive-triggered'), 600);
        
        // 패시브 이름 표시
        const passive = this.passiveDatabase[passiveId];
        if (passive) {
            this.showPassiveTriggerText(passive);
        }
    },
    
    // ==========================================
    // 적 공격 시 패시브 처리
    // ==========================================
    onEnemyAttack(enemy, enemyIndex) {
        if (!enemy || enemy.hp <= 0) return;
        
        // 독 공격 패시브
        if (enemy.poison && enemy.poison > 0 && typeof gameState !== 'undefined') {
            gameState.player.poison = (gameState.player.poison || 0) + enemy.poison;
            console.log(`[MonsterPassive] 독 ${enemy.poison} 부여`);
            this.triggerPassiveEffect('poison');
        }
        
        // 거미줄 패시브
        if (enemy.webOnAttack && enemy.webOnAttack > 0 && typeof gameState !== 'undefined') {
            // 거미줄 카드 추가 (cards.js에 정의된 경우)
            for (let i = 0; i < enemy.webOnAttack; i++) {
                if (typeof cardDatabase !== 'undefined' && cardDatabase.web) {
                    gameState.deck.push({ ...cardDatabase.web });
                }
            }
            console.log(`[MonsterPassive] 거미줄 ${enemy.webOnAttack}장 추가`);
            this.triggerPassiveEffect('webOnAttack');
        }
        
        // 출혈 공격 패시브
        if (enemy.bleedOnAttack && typeof gameState !== 'undefined') {
            const bleedAmount = enemy.bleedAmount || 2;
            gameState.player.bleed = (gameState.player.bleed || 0) + bleedAmount;
            console.log(`[MonsterPassive] 출혈 ${bleedAmount} 부여`);
            this.triggerPassiveEffect('bleedOnAttack');
        }
        
        // 흡혈 패시브 (데미지의 일정 % 회복)
        if (enemy.lifesteal && enemy.lifesteal > 0 && enemy.lastDamageDealt) {
            const healAmount = Math.floor(enemy.lastDamageDealt * (enemy.lifesteal / 100));
            if (healAmount > 0) {
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
                console.log(`[MonsterPassive] 흡혈 ${healAmount} 회복`);
                this.triggerPassiveEffect('lifesteal');
            }
        }
    },
    
    // ==========================================
    // 패시브 발동 텍스트
    // ==========================================
    showPassiveTriggerText(passive) {
        const text = document.createElement('div');
        text.className = 'passive-trigger-text';
        text.style.setProperty('--passive-color', passive.color);
        text.innerHTML = `
            <span class="trigger-icon">${passive.icon}</span>
            <span class="trigger-name">${passive.name}!</span>
        `;
        
        const enemyEl = document.getElementById('enemy');
        if (enemyEl) {
            const rect = enemyEl.getBoundingClientRect();
            text.style.left = `${rect.left + rect.width / 2}px`;
            text.style.top = `${rect.top - 30}px`;
        }
        
        document.body.appendChild(text);
        
        setTimeout(() => text.remove(), 1500);
    }
};

// ==========================================
// CSS 스타일
// ==========================================
const monsterPassiveStyles = document.createElement('style');
monsterPassiveStyles.textContent = `
    /* 패시브 컨테이너 - 몬스터 상단에 표시 */
    .monster-passives {
        position: absolute;
        top: -10px;
        right: -10px;
        transform: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
        z-index: 100;
    }
    
    /* 적 유닛 내 패시브 컨테이너 */
    .enemy-unit .monster-passives {
        top: 30px;
        right: 0px;
    }
    
    /* 패시브 아이콘 - 원형으로 구분 */
    .passive-icon {
        position: relative;
        width: 28px;
        height: 28px;
        background: linear-gradient(145deg, rgba(40, 40, 60, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%);
        border: 2px solid var(--passive-color, #fbbf24);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 
            0 0 8px rgba(0, 0, 0, 0.6),
            0 0 12px var(--passive-color);
    }
    
    .passive-icon:hover {
        transform: scale(1.15);
        box-shadow: 
            0 0 20px var(--passive-color),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
    }
    
    .passive-emoji {
        font-size: 1.1rem;
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
    }
    
    .passive-value {
        position: absolute;
        bottom: -4px;
        right: -4px;
        min-width: 16px;
        height: 16px;
        background: var(--passive-color, #fbbf24);
        color: #000;
        font-size: 0.65rem;
        font-weight: 900;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 3px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
    }
    
    /* 패시브 등장 애니메이션 */
    @keyframes passiveAppear {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        50% { transform: scale(1.2) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    /* 패시브 발동 애니메이션 */
    .passive-triggered {
        animation: passiveTriggered 0.6s ease-out !important;
    }
    
    @keyframes passiveTriggered {
        0% { transform: scale(1); }
        20% { transform: scale(1.4); box-shadow: 0 0 30px var(--passive-color); }
        40% { transform: scale(0.9); }
        60% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    /* 패시브 증가/감소 */
    .passive-increase {
        animation: passiveIncrease 0.5s ease-out;
    }
    
    .passive-decrease {
        animation: passiveDecrease 0.5s ease-out;
    }
    
    @keyframes passiveIncrease {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); filter: brightness(1.5); }
    }
    
    @keyframes passiveDecrease {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(0.8); filter: brightness(0.5); }
    }
    
    /* 패시브 툴팁 */
    .passive-tooltip {
        position: fixed;
        background: linear-gradient(145deg, rgba(35, 35, 55, 0.98) 0%, rgba(20, 20, 35, 0.99) 100%);
        border: 2px solid var(--passive-color, #fbbf24);
        border-radius: 12px;
        padding: 12px 16px;
        z-index: 10000;
        transform: translateX(-50%);
        box-shadow: 
            0 0 20px rgba(0, 0, 0, 0.5),
            0 0 30px var(--passive-color);
        animation: tooltipAppear 0.2s ease-out;
        min-width: 150px;
    }
    
    @keyframes tooltipAppear {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    
    .passive-tooltip-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .passive-tooltip-icon {
        font-size: 1.5rem;
    }
    
    .passive-tooltip-name {
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--passive-color, #fbbf24);
    }
    
    .passive-tooltip-desc {
        color: #d1d5db;
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    /* 패시브 플로터 */
    .passive-floater {
        position: fixed;
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        font-weight: 900;
        transform: translateX(-50%);
        z-index: 10000;
        pointer-events: none;
        animation: passiveFloaterAnim 1s ease-out forwards;
        text-shadow: 0 2px 5px rgba(0, 0, 0, 0.8);
    }
    
    .passive-floater.positive {
        color: #22c55e;
    }
    
    .passive-floater.negative {
        color: #ef4444;
    }
    
    @keyframes passiveFloaterAnim {
        0% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-40px); }
    }
    
    /* 패시브 발동 텍스트 */
    .passive-trigger-text {
        position: fixed;
        display: flex;
        align-items: center;
        gap: 8px;
        transform: translateX(-50%);
        z-index: 10000;
        pointer-events: none;
        animation: triggerTextAnim 1.5s ease-out forwards;
    }
    
    .trigger-icon {
        font-size: 2rem;
        filter: drop-shadow(0 0 10px var(--passive-color));
    }
    
    .trigger-name {
        font-family: 'Cinzel', serif;
        font-size: 1.5rem;
        font-weight: 900;
        color: var(--passive-color, #fbbf24);
        text-shadow: 
            0 0 20px var(--passive-color),
            2px 2px 0 #000;
    }
    
    @keyframes triggerTextAnim {
        0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
        20% { opacity: 1; transform: translateX(-50%) scale(1.2); }
        80% { opacity: 1; transform: translateX(-50%) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.8); }
    }
`;
document.head.appendChild(monsterPassiveStyles);

console.log('[MonsterPassive] 로드 완료');

