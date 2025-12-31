// ==========================================
// 브레이브 시스템 (전사 전용)
// 다음 턴의 에너지를 미리 당겨쓰는 시스템
// ==========================================

const BraveSystem = {
    // 브레이브 상태
    braveDebt: 0,           // 다음 턴에 갚아야 할 에너지 빚
    maxBraveDebt: 3,        // 최대 빚 한도
    
    // 시스템 활성화 여부 (전사 전용)
    isActive() {
        if (typeof JobSystem === 'undefined') return false;
        const job = JobSystem.getCurrentJob();
        return job && job.id === 'warrior';
    },
    
    // ==========================================
    // 브레이브 사용
    // ==========================================
    
    // 브레이브 사용 가능 여부
    canUseBrave(amount = 1) {
        if (!this.isActive()) return false;
        return this.braveDebt + amount <= this.maxBraveDebt;
    },
    
    // 브레이브로 에너지 획득 (빚 증가)
    useBrave(amount = 1) {
        if (!this.canUseBrave(amount)) {
            this.showBraveWarning();
            return false;
        }
        
        this.braveDebt += amount;
        gameState.player.energy += amount;
        
        // UI 업데이트
        this.updateBraveUI();
        updateUI();
        
        // 이펙트
        this.showBraveEffect(amount);
        
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('powerup', 0.5);
        }
        
        addLog(`브레이브! +${amount} 에너지 (빚: ${this.braveDebt})`, 'buff');
        console.log(`[Brave] 사용: +${amount} 에너지, 총 빚: ${this.braveDebt}`);
        
        return true;
    },
    
    // ==========================================
    // 턴 시작 시 빚 상환
    // ==========================================
    
    onTurnStart() {
        if (!this.isActive()) return;
        
        if (this.braveDebt > 0) {
            const debt = this.braveDebt;
            
            // 에너지에서 빚 차감
            gameState.player.energy = Math.max(0, gameState.player.energy - debt);
            
            // 빚 초기화
            this.braveDebt = 0;
            
            // 이펙트
            this.showDebtPaymentEffect(debt);
            
            addLog(`브레이브 상환: -${debt} 에너지`, 'debuff');
            console.log(`[Brave] 빚 상환: -${debt} 에너지`);
        }
        
        this.updateBraveUI();
    },
    
    // 전투 시작 시 초기화
    onBattleStart() {
        this.braveDebt = 0;
        this.updateBraveUI();
    },
    
    // ==========================================
    // UI
    // ==========================================
    
    // 브레이브 UI 생성 (컴팩트 오브 스타일)
    createBraveUI() {
        if (!this.isActive()) return;
        
        // 기존 UI 제거
        const existing = document.getElementById('brave-indicator');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'brave-indicator';
        container.className = 'brave-indicator';
        container.title = '클릭: 브레이브 +1 (다음 턴 에너지 -1)';
        container.innerHTML = `
            <div class="brave-orb">
                <span class="brave-icon">⚔</span>
            </div>
            <div class="brave-count">
                <span class="brave-current">0</span>/<span class="brave-max">${this.maxBraveDebt}</span>
            </div>
        `;
        
        // 클릭 이벤트
        container.addEventListener('click', () => {
            this.useBrave(1);
        });
        
        // 플레이어 디버프 영역에 배치
        const debuffContainer = document.getElementById('player-debuffs');
        if (debuffContainer) {
            debuffContainer.insertBefore(container, debuffContainer.firstChild);
        } else {
            const playerContainer = document.querySelector('.combatant.player-side');
            if (playerContainer) {
                playerContainer.appendChild(container);
            }
        }
        
        console.log('[BraveSystem] UI 생성 완료');
        this.updateBraveUI();
    },
    
    // 브레이브 UI 업데이트
    updateBraveUI() {
        const indicator = document.getElementById('brave-indicator');
        if (!indicator) return;
        
        const current = indicator.querySelector('.brave-current');
        const orb = indicator.querySelector('.brave-orb');
        
        if (current) current.textContent = this.braveDebt;
        
        // 빚에 따른 스타일 변경
        indicator.classList.remove('debt-0', 'debt-1', 'debt-2', 'debt-max');
        if (this.braveDebt >= this.maxBraveDebt) {
            indicator.classList.add('debt-max');
        } else if (this.braveDebt >= 2) {
            indicator.classList.add('debt-2');
        } else if (this.braveDebt >= 1) {
            indicator.classList.add('debt-1');
        } else {
            indicator.classList.add('debt-0');
        }
        
        // 최대치면 비활성화 표시
        if (this.braveDebt >= this.maxBraveDebt) {
            indicator.style.opacity = '0.6';
            indicator.style.cursor = 'not-allowed';
        } else {
            indicator.style.opacity = '1';
            indicator.style.cursor = 'pointer';
        }
    },
    
    // ==========================================
    // 이펙트
    // ==========================================
    
    showBraveEffect(amount) {
        const indicator = document.getElementById('brave-indicator');
        if (!indicator) return;
        
        const rect = indicator.getBoundingClientRect();
        
        // 브레이브 텍스트
        const text = document.createElement('div');
        text.innerHTML = `+${amount}`;
        text.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            transform: translateX(-50%);
            font-family: 'Cinzel', serif;
            font-size: 1.2rem;
            font-weight: bold;
            color: #fbbf24;
            text-shadow: 0 0 10px rgba(251, 191, 36, 0.8), 0 2px 3px rgba(0, 0, 0, 0.8);
            z-index: 10000;
            pointer-events: none;
            animation: braveTextRise 0.8s ease-out forwards;
        `;
        document.body.appendChild(text);
        
        // 오브 펄스 효과
        indicator.style.transform = 'scale(1.2)';
        setTimeout(() => indicator.style.transform = '', 150);
        
        setTimeout(() => text.remove(), 800);
    },
    
    showDebtPaymentEffect(amount) {
        const indicator = document.getElementById('brave-indicator');
        const target = indicator || document.getElementById('player');
        if (!target) return;
        
        const rect = target.getBoundingClientRect();
        
        const text = document.createElement('div');
        text.innerHTML = `-${amount}`;
        text.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height}px;
            transform: translateX(-50%);
            font-family: 'Cinzel', serif;
            font-size: 1rem;
            font-weight: bold;
            color: #ef4444;
            text-shadow: 0 2px 3px rgba(0, 0, 0, 0.8);
            z-index: 10000;
            pointer-events: none;
            animation: braveDebtFade 1s ease-out forwards;
        `;
        document.body.appendChild(text);
        
        setTimeout(() => text.remove(), 1000);
    },
    
    showBraveWarning() {
        const indicator = document.getElementById('brave-indicator');
        if (indicator) {
            indicator.classList.add('brave-warning');
            indicator.style.borderColor = '#ef4444';
            setTimeout(() => {
                indicator.classList.remove('brave-warning');
                indicator.style.borderColor = '';
            }, 400);
        }
        
        addLog('브레이브 한도 초과!', 'debuff');
    }
};

// ==========================================
// CSS 스타일 주입
// ==========================================
const braveStyles = document.createElement('style');
braveStyles.textContent = `
    /* 컴팩트 브레이브 인디케이터 */
    .brave-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2));
        border: 2px solid rgba(251, 191, 36, 0.6);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-right: 5px;
    }
    
    .brave-indicator:hover {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.5), rgba(245, 158, 11, 0.4));
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
    }
    
    .brave-indicator:active {
        transform: scale(0.95);
    }
    
    .brave-orb {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at 30% 30%, #fbbf24, #b45309);
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
    }
    
    .brave-icon {
        font-size: 14px;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    
    .brave-count {
        font-family: 'Cinzel', serif;
        font-size: 0.85rem;
        font-weight: bold;
        color: #fff;
    }
    
    .brave-current {
        color: #fbbf24;
    }
    
    .brave-max {
        color: #888;
        font-size: 0.75rem;
    }
    
    /* 빚 상태에 따른 스타일 */
    .brave-indicator.debt-1 {
        border-color: rgba(245, 158, 11, 0.7);
    }
    .brave-indicator.debt-1 .brave-orb {
        background: radial-gradient(circle at 30% 30%, #f59e0b, #92400e);
    }
    .brave-indicator.debt-1 .brave-current {
        color: #f59e0b;
    }
    
    .brave-indicator.debt-2 {
        border-color: rgba(239, 68, 68, 0.6);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.15));
    }
    .brave-indicator.debt-2 .brave-orb {
        background: radial-gradient(circle at 30% 30%, #f97316, #7c2d12);
    }
    .brave-indicator.debt-2 .brave-current {
        color: #f97316;
    }
    
    .brave-indicator.debt-max {
        border-color: rgba(239, 68, 68, 0.8);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(153, 27, 27, 0.2));
        animation: braveMaxPulse 1.5s ease-in-out infinite;
    }
    .brave-indicator.debt-max .brave-orb {
        background: radial-gradient(circle at 30% 30%, #ef4444, #7f1d1d);
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
    }
    .brave-indicator.debt-max .brave-current {
        color: #ef4444;
        text-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
    }
    
    .brave-indicator.brave-warning {
        animation: braveShake 0.3s ease-in-out;
    }
    
    @keyframes braveMaxPulse {
        0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
        50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
    }
    
    @keyframes braveShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
    }
    
    @keyframes braveTextRise {
        0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-40px) scale(1.2);
        }
    }
    
    @keyframes braveDebtFade {
        0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(15px);
        }
    }
`;
document.head.appendChild(braveStyles);

// 전역 등록
window.BraveSystem = BraveSystem;

console.log('[BraveSystem] 브레이브 시스템 로드 완료');

