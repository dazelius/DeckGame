// ==========================================
// Shadow Deck - 겜블러 직업
// 고위험 고수익 도박꾼 스타일
// ==========================================

// ==========================================
// 칩 시스템 (겜블러 고유 메카닉) - 영창 시스템 스타일
// ==========================================
const ChipSystem = {
    chips: 0,
    maxChips: 15,
    isActive: false,
    
    // 초기화
    init() {
        this.chips = 0;
        this.isActive = true;
        console.log('[ChipSystem] 초기화');
    },
    
    // 시스템 활성화 (전투 시작 시)
    activate() {
        // 겜블러가 아니면 무시
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob !== 'gambler') {
            this.isActive = false;
            this.hideUI();
            return;
        }
        
        this.isActive = true;
        this.chips = 3; // 시작 칩 3개
        this.createUI();
        this.updateUI();
        
        if (typeof addLog === 'function') {
            addLog('🎰 칩 시스템 활성화! 시작 칩 3개!', 'buff');
        }
        
        console.log('[ChipSystem] 활성화');
    },
    
    // 시스템 비활성화
    deactivate() {
        this.isActive = false;
        this.chips = 0;
        this.hideUI();
    },
    
    // 카드가 무덤에 들어갈 때 호출
    onCardDiscarded(card, count = 1) {
        if (!this.isActive) return;
        
        // 겜블러가 아니면 무시
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob !== 'gambler') {
            return;
        }
        
        // 버린 카드당 1칩 획득 (딸랑딸랑!)
        this.addChipsWithJingle(count);
    },
    
    // 딸랑딸랑 효과와 함께 칩 획득
    addChipsWithJingle(amount) {
        if (!this.isActive || amount <= 0) return 0;
        
        const container = document.querySelector('.chip-container');
        let totalGained = 0;
        
        // 각 칩마다 딜레이를 주며 딸랑딸랑 효과
        for (let i = 0; i < amount; i++) {
            setTimeout(() => {
                if (this.chips >= this.maxChips) return;
                
                this.chips = Math.min(this.maxChips, this.chips + 1);
                totalGained++;
                
                // 딸랑 사운드 효과
                this.playChipJingle();
                
                // 칩 하나씩 올라가는 VFX
                if (container && typeof GamblerVFX !== 'undefined') {
                    const rect = container.getBoundingClientRect();
                    GamblerVFX.playChipGainEffect(1, rect.left + rect.width / 2, rect.top);
                }
                
                // UI 갱신 (흔들림 애니메이션)
                this.updateUI();
                this.shakeChipUI();
                
            }, i * 120); // 0.12초 간격으로 딸랑딸랑
        }
        
        // 마지막에 로그
        setTimeout(() => {
            if (totalGained > 0 && typeof addLog === 'function') {
                addLog(`💠 칩 +${amount} (${this.chips}/${this.maxChips})`, 'buff');
            }
        }, amount * 120 + 50);
        
        return amount;
    },
    
    // 칩 딸랑 사운드
    playChipJingle() {
        // SoundSystem이 있으면 칩 소리 재생
        if (typeof SoundSystem !== 'undefined' && SoundSystem.play) {
            // 간단한 비프음으로 대체 (칩 사운드가 없으면)
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                // 칩 딸랑 소리 (높은 금속음)
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1200 + Math.random() * 400, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.1);
            } catch (e) {
                // 오디오 에러 무시
            }
        }
    },
    
    // UI 흔들림 애니메이션
    shakeChipUI() {
        const container = document.querySelector('.chip-container');
        if (!container) return;
        
        container.classList.add('chip-jingle');
        setTimeout(() => {
            container.classList.remove('chip-jingle');
        }, 200);
    },
    
    // 칩 획득 (기본, 딸랑 없이)
    addChips(amount) {
        if (!this.isActive) return 0;
        
        const before = this.chips;
        this.chips = Math.min(this.maxChips, this.chips + amount);
        const gained = this.chips - before;
        
        if (gained > 0) {
            // VFX 이펙트
            const container = document.querySelector('.chip-container');
            if (container && typeof GamblerVFX !== 'undefined') {
                const rect = container.getBoundingClientRect();
                GamblerVFX.playChipGainEffect(gained, rect.left + rect.width / 2, rect.top);
            }
            
            if (typeof addLog === 'function') {
                addLog(`💠 칩 +${gained} (${this.chips}/${this.maxChips})`, 'buff');
            }
        }
        
        this.updateUI();
        return gained;
    },
    
    // 칩 사용
    useChips(amount) {
        if (this.chips < amount) return 0;
        this.chips -= amount;
        this.updateUI();
        return amount;
    },
    
    // 모든 칩 사용 (올인)
    useAllChips() {
        const used = this.chips;
        this.chips = 0;
        this.updateUI();
        return used;
    },
    
    
    // UI 생성
    createUI() {
        if (document.querySelector('.chip-container')) return;
        
        const container = document.createElement('div');
        container.className = 'chip-container';
        container.innerHTML = `
            <div class="chip-header">
                <span class="chip-title">💠 칩</span>
            </div>
            <div class="chip-gauge-wrap">
                <div class="chip-gauge">
                    <div class="chip-fill"></div>
                </div>
                <div class="chip-count">0</div>
            </div>
            <button class="chip-allin-btn" onclick="ChipSystem.executeAllIn()" disabled>
                🔥 올인
            </button>
            <div class="chip-hint">카드 버릴 때마다 칩 획득!</div>
        `;
        
        document.body.appendChild(container);
        this.updateUI();
    },
    
    // 올인 실행 (필살기) - 10히트 랜덤 타겟 분산
    executeAllIn() {
        if (this.chips < 5) {
            if (typeof addLog === 'function') {
                addLog('💠 칩이 부족합니다! (최소 5개 필요)', 'debuff');
            }
            return;
        }
        
        const chips = this.useAllChips();
        const enemies = gameState.enemies ? gameState.enemies.filter(e => e && e.hp > 0) : [];
        
        if (enemies.length === 0) {
            if (typeof addLog === 'function') {
                addLog('🔥 올인할 대상이 없습니다!', 'debuff');
            }
            return;
        }
        
        // 칩 개수만큼 히트, 히트당 1~3 랜덤 데미지 (판돈올리기 적용)
        const hitCount = chips; // 칩 개수 = 히트 수
        const minDamage = 1;
        const maxDamage = 3;
        const chipLaunchInterval = 60; // 빠른 발사 간격 (60ms)
        const chipFallTime = 250; // 빠른 낙하 (250ms)
        
        // 최적화: VFX는 일부만, 데미지는 전부
        const vfxInterval = Math.max(1, Math.floor(hitCount / 8)); // 최대 8개 VFX만
        
        let totalDamage = 0;
        
        // 처음에 ALL-IN 텍스트 표시 (간소화)
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playAllInTextFast(chips);
        }
        
        // 각 히트마다 랜덤 타겟 선택 및 데미지
        for (let i = 0; i < hitCount; i++) {
            setTimeout(() => {
                // 살아있는 적 중 랜덤 선택
                const aliveEnemies = gameState.enemies.filter(e => e && e.hp > 0);
                if (aliveEnemies.length === 0) return;
                
                const targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                const enemyEl = GamblerCards.getTargetEnemyElement(targetEnemy);
                
                // VFX: 일부 히트에서만 (최적화)
                const showVfx = (i % vfxInterval === 0) || (i === hitCount - 1);
                if (showVfx && enemyEl && typeof GamblerVFX !== 'undefined') {
                    const rect = enemyEl.getBoundingClientRect();
                    GamblerVFX.playChipHitFast(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2,
                        i === hitCount - 1
                    );
                }
                
                // 데미지 (짧은 딜레이)
                setTimeout(() => {
                    const stillAlive = gameState.enemies.filter(e => e && e.hp > 0);
                    if (stillAlive.length === 0) return;
                    
                    const damage = GamblerCards.rollValue(minDamage, maxDamage);
                    const actualTarget = (targetEnemy && targetEnemy.hp > 0) ? targetEnemy : stillAlive[0];
                    
                    if (actualTarget) {
                        totalDamage += damage;
                        
                        if (typeof dealDamage === 'function') {
                            dealDamage(actualTarget, damage);
                        } else {
                            actualTarget.hp = Math.max(0, actualTarget.hp - damage);
                        }
                        
                        if (actualTarget.hp <= 0 && typeof checkEnemyDefeated === 'function') {
                            checkEnemyDefeated();
                        }
                    }
                }, chipFallTime);
                
            }, i * chipLaunchInterval);
        }
        
        // 마지막 히트 후 결과 표시
        const totalTime = hitCount * chipLaunchInterval + chipFallTime + 100;
        setTimeout(() => {
            if (typeof addLog === 'function') {
                addLog(`🔥 올인! ${chips}칩 → ${totalDamage} 데미지 (${hitCount}히트)`, 'critical');
            }
            
            // "X HITS!" 표시
            if (typeof GamblerVFX !== 'undefined') {
                GamblerVFX.playHitsText(window.innerWidth / 2, window.innerHeight / 2 - 50, hitCount);
            }
        }, totalTime);
    },
    
    // UI 숨기기
    hideUI() {
        const container = document.querySelector('.chip-container');
        if (container) container.remove();
    },
    
    // UI 업데이트
    updateUI() {
        const container = document.querySelector('.chip-container');
        if (!container) return;
        
        const fill = container.querySelector('.chip-fill');
        const count = container.querySelector('.chip-count');
        const allInBtn = container.querySelector('.chip-allin-btn');
        
        if (fill) {
            fill.style.width = `${(this.chips / this.maxChips) * 100}%`;
            
            // 칩이 많으면 색상 변경
            if (this.chips >= 10) {
                fill.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
                fill.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.8)';
            } else if (this.chips >= 5) {
                fill.style.background = 'linear-gradient(90deg, #60a5fa, #3b82f6)';
                fill.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.6)';
            } else {
                fill.style.background = 'linear-gradient(90deg, #94a3b8, #64748b)';
                fill.style.boxShadow = 'none';
            }
        }
        
        if (count) {
            count.textContent = this.chips;
            count.className = 'chip-count' + (this.chips >= 10 ? ' high' : this.chips >= 5 ? ' mid' : '');
        }
        
        // 올인 버튼 활성화/비활성화
        if (allInBtn) {
            if (this.chips >= 5) {
                allInBtn.disabled = false;
                allInBtn.classList.add('ready');
            } else {
                allInBtn.disabled = true;
                allInBtn.classList.remove('ready');
            }
        }
    },
    
    // 스타일 주입
    injectStyles() {
        if (document.getElementById('chip-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'chip-styles';
        style.textContent = `
            /* 칩 컨테이너 - 영창 UI 스타일 */
            .chip-container {
                position: fixed;
                bottom: 180px;
                left: 20px;
                width: 160px;
                padding: 15px;
                background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
                border: 2px solid rgba(251, 191, 36, 0.4);
                border-radius: 12px;
                box-shadow: 0 0 30px rgba(251, 191, 36, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                font-family: 'Noto Sans KR', sans-serif;
            }
            
            .chip-header {
                display: flex;
                justify-content: center;
                margin-bottom: 10px;
            }
            
            .chip-title {
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                color: #fbbf24;
                text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
                letter-spacing: 2px;
            }
            
            .chip-gauge-wrap {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .chip-gauge {
                flex: 1;
                height: 20px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 10px;
                overflow: hidden;
                border: 1px solid rgba(100, 116, 139, 0.3);
            }
            
            .chip-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #94a3b8, #64748b);
                border-radius: 10px;
                transition: width 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
            }
            
            .chip-count {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                font-weight: bold;
                color: #94a3b8;
                min-width: 30px;
                text-align: center;
                transition: color 0.3s ease, text-shadow 0.3s ease;
            }
            
            .chip-count.mid {
                color: #60a5fa;
                text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
            }
            
            .chip-count.high {
                color: #fbbf24;
                text-shadow: 0 0 15px rgba(251, 191, 36, 0.8);
                animation: chipCountPulse 1s ease-in-out infinite;
            }
            
            @keyframes chipCountPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .chip-allin-btn {
                width: 100%;
                margin-top: 10px;
                padding: 10px 15px;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                font-weight: bold;
                color: #64748b;
                background: rgba(0, 0, 0, 0.4);
                border: 2px solid #374151;
                border-radius: 8px;
                cursor: not-allowed;
                transition: all 0.3s ease;
            }
            
            .chip-allin-btn:disabled {
                opacity: 0.5;
            }
            
            .chip-allin-btn.ready {
                color: #fbbf24;
                background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
                border-color: #fbbf24;
                cursor: pointer;
                animation: allInPulse 1.5s ease-in-out infinite;
                box-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
            }
            
            .chip-allin-btn.ready:hover {
                background: linear-gradient(135deg, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.3) 100%);
                transform: scale(1.05);
                box-shadow: 0 0 25px rgba(251, 191, 36, 0.6);
            }
            
            .chip-allin-btn.ready:active {
                transform: scale(0.95);
            }
            
            @keyframes allInPulse {
                0%, 100% { 
                    box-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
                }
                50% { 
                    box-shadow: 0 0 25px rgba(251, 191, 36, 0.7);
                }
            }
            
            .chip-hint {
                margin-top: 8px;
                font-size: 0.75rem;
                color: #64748b;
                text-align: center;
            }
            
            /* 칩 딸랑딸랑 애니메이션 */
            .chip-container.chip-jingle {
                animation: chipJingle 0.2s ease-in-out;
            }
            
            @keyframes chipJingle {
                0%, 100% { transform: translateX(0) rotate(0deg); }
                25% { transform: translateX(-3px) rotate(-2deg); }
                75% { transform: translateX(3px) rotate(2deg); }
            }
            
            /* 칩 획득 시 게이지 반짝임 */
            .chip-fill.gaining {
                animation: chipGainFlash 0.3s ease-out;
            }
            
            @keyframes chipGainFlash {
                0% { filter: brightness(1); }
                50% { filter: brightness(1.8); }
                100% { filter: brightness(1); }
            }
            
            /* 칩 획득 파티클 */
            @keyframes chipGainAnim {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(1) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-80px) scale(1.5) rotate(360deg);
                }
            }
            
            .chip-gain-particle {
                filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.8));
            }
        `;
        document.head.appendChild(style);
    }
};

// ==========================================
// 겜블러 카드 데이터베이스
// ==========================================
const GamblerCards = {
    // ==========================================
    // 기본 카드
    // ==========================================
    
    // 럭키 스트라이크 - 기본 공격 (숫자 스핀 + 칩 드롭 VFX)
    luckyStrike: {
        id: 'luckyStrike',
        name: '럭키 스트라이크',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '🎲',
        minDamage: 3,
        maxDamage: 9,
        description: '<span class="damage">3~9</span> 랜덤 데미지.',
        effect: (state) => {
            const min = 3;
            const max = 9;
            const actualMax = GamblerCards.getActualMax(max);  // 판돈 올리기 적용
            const damage = GamblerCards.rollDamage(min, max);
            const enemy = state.enemy || gameState.targetEnemy;
            const isMax = damage === actualMax;
            const isMin = damage === min;
            
            // 타겟팅된 적 요소 찾기
            const enemyEl = GamblerCards.getTargetEnemyElement(enemy);
            if (enemyEl && typeof GamblerVFX !== 'undefined') {
                const rect = enemyEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                
                // 숫자 스핀 VFX 재생 (actualMax 사용)
                GamblerVFX.playLuckyStrike(x, y, min, actualMax, damage, () => {
                    // VFX 완료 후 슬래시 이펙트
                    if (typeof VFX !== 'undefined') {
                        if (isMax) {
                            VFX.crossSlash(x, y, { color: '#fbbf24', size: 200 });
                        } else {
                            VFX.slash(x, y, { color: '#60a5fa', length: 180 });
                        }
                    }
                });
                
                // 칩이 떨어지는 타이밍에 맞춰 데미지 적용 (스핀 800ms + 딜레이 100ms + 칩 낙하 ~500ms)
                setTimeout(() => {
                    dealDamage(enemy, damage);
                    addLog(`🎲 럭키 스트라이크! ${damage} 데미지!${isMax ? ' ⭐MAX!' : isMin ? ' 💀MIN...' : ''}`, 
                           isMax ? 'critical' : isMin ? 'debuff' : 'damage');
                }, 1400);
            } else {
                // VFX 없으면 바로 적용
                dealDamage(enemy, damage);
                addLog(`🎲 럭키 스트라이크! ${damage} 데미지!`, 'damage');
            }
        }
    },
    
    // 포춘 가드 - 기본 방어 (칩 쉴드 VFX)
    fortuneGuard: {
        id: 'fortuneGuard',
        name: '포춘 가드',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '🛡️',
        minBlock: 2,
        maxBlock: 8,
        description: '<span class="block-val">2~8</span> 랜덤 방어도.',
        effect: (state) => {
            const min = 2;
            const max = 8;
            const actualMax = GamblerCards.getActualMax(max);
            const block = GamblerCards.rollValue(min, max);
            const isMax = block === actualMax;
            const isMin = block === min;
            
            // 플레이어 앞쪽에서 칩 쉴드 VFX
            const playerEl = document.getElementById('player');
            if (playerEl && typeof GamblerVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2 + 80;  // 캐릭터 앞쪽 (오른쪽)
                const y = rect.top + rect.height / 2;
                
                // 칩 쉴드 VFX - 칩들이 모여서 방패 형성
                GamblerVFX.playChipShield(x, y, min, actualMax, block, () => {
                    // 완료
                });
                
                // 쉴드 형성 타이밍에 방어도 적용 (스핀 600ms + 형성 400ms)
                setTimeout(() => {
                    gainBlock(state.player, block);
                    addLog(`🛡️ 포춘 가드! 방어도 ${block}!${isMax ? ' ⭐MAX!' : isMin ? ' 💀MIN...' : ''}`, 
                           isMax ? 'buff' : 'block');
                }, 1000);
            } else {
                gainBlock(state.player, block);
                addLog(`🛡️ 포춘 가드! 방어도 ${block}!`, 'block');
            }
        }
    },
    
    // 칩 토스 - 드로우
    chipToss: {
        id: 'chipToss',
        name: '칩 토스',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '💠',
        description: '카드 2장 드로우.',
        effect: (state) => {
            // 드로우 애니메이션
            if (typeof CardAnimation !== 'undefined' && CardAnimation.drawMultipleCards) {
                CardAnimation.drawMultipleCards({
                    count: 2,
                    onComplete: () => {
                        drawCards(2);
                        addLog('💠 칩 토스! 드로우 +2', 'buff');
                    }
                });
            } else {
                drawCards(2);
                addLog('💠 칩 토스! 드로우 +2', 'buff');
            }
        }
    },
    
    // ==========================================
    // 언커먼 카드
    // ==========================================
    
    // 더블 다운 - 50% 2배 or 0
    doubleDown: {
        id: 'doubleDown',
        name: '칩 스프레이',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '💰',
        target: 'all',  // 광역 공격
        description: '모든 적에게 <span class="damage">2~6</span> 랜덤 데미지.<br>(각 적마다 따로 굴림)',
        effect: (state) => {
            const min = 2;
            const max = 6;
            const actualMax = GamblerCards.getActualMax(max);
            const enemies = gameState.enemies || [state.enemy];
            
            let totalDamage = 0;
            let maxCount = 0;
            let minCount = 0;
            
            enemies.forEach((enemy, index) => {
                if (!enemy || enemy.hp <= 0) return;
                
                const damage = GamblerCards.rollValue(min, max);
                const isMax = damage === actualMax;
                const isMin = damage === min;
                
                if (isMax) maxCount++;
                if (isMin) minCount++;
                totalDamage += damage;
                
                // 각 적에게 VFX
                const enemyEl = GamblerCards.getTargetEnemyElement(enemy);
                if (enemyEl && typeof GamblerVFX !== 'undefined') {
                    const rect = enemyEl.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    // 딜레이를 두고 칩 날리기
                    setTimeout(() => {
                        GamblerVFX.playChipDrop(x, y, damage, isMax, isMin);
                        
                        setTimeout(() => {
                            dealDamage(enemy, damage);
                        }, 300);
                    }, index * 150);
                } else {
                    dealDamage(enemy, damage);
                }
            });
            
            // 로그
            setTimeout(() => {
                let logText = `💰 칩 스프레이! 총 ${totalDamage} 데미지!`;
                if (maxCount > 0) logText += ` ⭐MAX x${maxCount}!`;
                if (minCount > 0) logText += ` 💀MIN x${minCount}`;
                addLog(logText, maxCount > 0 ? 'critical' : 'damage');
            }, enemies.length * 150 + 300);
        }
    },
    
    // 하이 롤러 - 고위험 고수익 (숫자 스핀 + 칩 드롭 VFX)
    highRoller: {
        id: 'highRoller',
        name: '하이 롤러',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '🎰',
        description: '<span class="damage">5~25</span> 랜덤 데미지. 칩 +2.',
        effect: (state) => {
            const min = 5;
            const max = 25;
            const actualMax = GamblerCards.getActualMax(max);
            const damage = GamblerCards.rollDamage(min, max);
            const enemy = state.enemy || gameState.targetEnemy;
            const isMax = damage === actualMax;
            const isMin = damage === min;
            
            // 타겟팅된 적 요소 찾기
            const enemyEl = GamblerCards.getTargetEnemyElement(enemy);
            if (enemyEl && typeof GamblerVFX !== 'undefined') {
                const rect = enemyEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                
                GamblerVFX.playLuckyStrike(x, y, min, actualMax, damage, () => {
                    if (typeof VFX !== 'undefined') {
                        if (isMax) {
                            VFX.criticalHit(x, y, { size: 200 });
                        } else if (damage >= actualMax * 0.6) {
                            VFX.crossSlash(x, y, { color: '#f59e0b', size: 230 });
                        } else {
                            VFX.slash(x, y, { color: '#f59e0b', length: 200 });
                        }
                    }
                });
                
                setTimeout(() => {
                    dealDamage(enemy, damage);
                    ChipSystem.addChips(2);
                    addLog(`🎰 하이 롤러! ${damage} 데미지!${isMax ? ' ⭐MAX! 대박!' : isMin ? ' 💀MIN...' : ''}`, 
                           isMax ? 'critical' : damage >= 15 ? 'critical' : 'damage');
                }, 1400);
            } else {
                dealDamage(enemy, damage);
                ChipSystem.addChips(2);
                addLog(`🎰 하이 롤러! ${damage} 데미지!`, damage >= 15 ? 'critical' : 'damage');
            }
        }
    },
    
    // 블러프 - 공격 무효화 확률
    bluff: {
        id: 'bluff',
        name: '블러프',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '🃏',
        description: '이번 턴 피해를 <span class="special">40%</span> 확률로 무효화.',
        effect: (state) => {
            state.player.bluffActive = true;
            state.player.bluffChance = 0.4;
            
            GamblerCards.showBluffEffect();
            
            addLog('🃏 블러프! 40% 회피 활성화!', 'buff');
        }
    },
    
    // 칩 스택 - 칩 대량 획득
    chipStack: {
        id: 'chipStack',
        name: '칩 스택',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '💎',
        description: '칩 4개 획득. 방어도 3.',
        effect: (state) => {
            ChipSystem.addChips(4);
            gainBlock(state.player, 3);
            
            addLog('💎 칩 스택! 칩 +4, 방어도 +3', 'buff');
        }
    },
    
    // 슬롯 스핀 - 랜덤 효과
    slotSpin: {
        id: 'slotSpin',
        name: '슬롯 스핀',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '🎰',
        description: '랜덤 효과 발동!<br>🍒 데미지 / 🍋 방어 / 🍀 칩 / ⭐ 드로우',
        effect: (state) => {
            const results = [];
            const symbols = ['🍒', '🍋', '🍀', '⭐'];
            
            // 3개 심볼 뽑기
            for (let i = 0; i < 3; i++) {
                results.push(symbols[Math.floor(Math.random() * symbols.length)]);
            }
            
            GamblerCards.playSlotEffect(results);
            
            // 효과 적용
            const enemy = state.enemy || gameState.targetEnemy;
            let message = `🎰 [${results.join('')}] `;
            
            results.forEach(symbol => {
                switch (symbol) {
                    case '🍒':
                        dealDamage(enemy, 4);
                        message += '+4 데미지 ';
                        break;
                    case '🍋':
                        gainBlock(state.player, 4);
                        message += '+4 방어 ';
                        break;
                    case '🍀':
                        ChipSystem.addChips(2);
                        message += '+2 칩 ';
                        break;
                    case '⭐':
                        drawCards(1);
                        message += '+1 드로우 ';
                        break;
                }
            });
            
            // 잭팟! (3개 동일)
            if (results[0] === results[1] && results[1] === results[2]) {
                message += '🎉 잭팟! 보너스!';
                dealDamage(enemy, 10);
                gainBlock(state.player, 10);
                ChipSystem.addChips(5);
            }
            
            addLog(message, 'special');
        }
    },
    
    // ==========================================
    // 레어 카드
    // ==========================================
    
    // 올인 - 칩 전부 소모, 칩당 다단히트
    allIn: {
        id: 'allIn',
        name: '올인',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '🔥',
        description: '칩 전부 소모.<br>칩당 <span class="damage">4~8</span> 랜덤 다단히트.',
        effect: (state) => {
            const chips = ChipSystem.useAllChips();
            const enemy = state.enemy || gameState.targetEnemy;
            
            if (chips === 0) {
                addLog('🔥 올인 실패! 칩이 없습니다!', 'warning');
                return;
            }
            
            GamblerCards.playAllInEffect(chips);
            
            let totalDamage = 0;
            for (let i = 0; i < chips; i++) {
                setTimeout(() => {
                    if (enemy.hp > 0) {
                        const damage = GamblerCards.rollValue(4, 8);
                        totalDamage += damage;
                        dealDamage(enemy, damage);
                        
                        // 히트 이펙트 - 타겟팅된 적에게
                        const enemyEl = GamblerCards.getTargetEnemyElement(enemy);
                        if (enemyEl && typeof VFX !== 'undefined') {
                            const rect = enemyEl.getBoundingClientRect();
                            VFX.impact(rect.left + rect.width/2 + (Math.random()-0.5)*30, 
                                      rect.top + rect.height/2 + (Math.random()-0.5)*30, 
                                      { color: '#fbbf24', size: 60 });
                        }
                    }
                }, i * 120);
            }
            
            setTimeout(() => {
                addLog(`🔥 올인! ${chips}칩 → ${totalDamage} 총 데미지!`, 'critical');
                if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
            }, chips * 120 + 200);
        }
    },
    
    // 잭팟 - 10% 대박
    jackpot: {
        id: 'jackpot',
        name: '잭팟',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 3,
        icon: '🎰',
        description: '<span class="special">10%</span>: 50 데미지!<br><span class="debuff">90%</span>: 5 데미지.',
        effect: (state) => {
            const enemy = state.enemy || gameState.targetEnemy;
            const isJackpot = Math.random() < 0.1;
            
            if (isJackpot) {
                GamblerCards.playJackpotEffect();
                dealDamage(enemy, 50);
                ChipSystem.addChips(10);
                addLog('🎰🎰🎰 잭팟!!! 50 데미지!', 'critical');
            } else {
                GamblerCards.playFailEffect();
                dealDamage(enemy, 5);
                addLog('🎰 잭팟 실패... 5 데미지.', 'damage');
            }
        }
    },
    
    // 리스키 힐 - 회복 or 자해
    riskyHeal: {
        id: 'riskyHeal',
        name: '리스키 힐',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 1,
        icon: '❤️',
        description: '<span class="heal">50%</span>: HP 15 회복.<br><span class="debuff">50%</span>: 자해 8.',
        effect: (state) => {
            const success = Math.random() >= 0.5;
            
            if (success) {
                state.player.hp = Math.min(state.player.maxHp, state.player.hp + 15);
                GamblerCards.playHealEffect();
                addLog('❤️ 리스키 힐 성공! HP +15!', 'heal');
            } else {
                state.player.hp = Math.max(1, state.player.hp - 8);
                GamblerCards.playFailEffect();
                addLog('💔 리스키 힐 실패! 자해 8!', 'debuff');
            }
            
            if (typeof updateUI === 'function') updateUI();
        }
    },
    
    // 하우스 머니 - 잃은 HP만큼 데미지
    houseMoney: {
        id: 'houseMoney',
        name: '하우스 머니',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 1,
        icon: '💰',
        description: '잃은 HP만큼 데미지.<br><span class="special">(최대 40)</span>',
        effect: (state) => {
            const enemy = state.enemy || gameState.targetEnemy;
            const lostHp = state.player.maxHp - state.player.hp;
            const damage = Math.min(40, lostHp);
            
            dealDamage(enemy, damage);
            
            addLog(`💰 하우스 머니! 잃은 HP ${lostHp} → ${damage} 데미지!`, damage >= 20 ? 'critical' : 'damage');
        }
    },
    
    // 포커 페이스 - 인텐트 숨김 + 방어 (롤링 VFX)
    pokerFace: {
        id: 'pokerFace',
        name: '포커 페이스',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '😐',
        description: '이번 턴 적 인텐트 숨김.<br>방어도 <span class="block-val">10~20</span>. 칩 +3.',
        effect: (state) => {
            const min = 10;
            const max = 20;
            const actualMax = GamblerCards.getActualMax(max);
            const block = GamblerCards.rollValue(min, max);
            const isMax = block === actualMax;
            
            // 인텐트 숨김
            document.querySelectorAll('.enemy-intent').forEach(el => {
                el.style.visibility = 'hidden';
            });
            state.player.pokerFaceActive = true;
            
            const playerEl = document.getElementById('player');
            if (playerEl && typeof GamblerVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top - 50;
                
                GamblerVFX.playLuckyStrike(x, y, min, actualMax, block, () => {
                    if (typeof VFX !== 'undefined') {
                        VFX.shield(x, y + 50, { color: '#8b5cf6', size: 100 });
                    }
                });
                
                setTimeout(() => {
                    gainBlock(state.player, block);
                    ChipSystem.addChips(3);
                    addLog(`😐 포커 페이스! 인텐트 숨김, 방어도 ${block}!${isMax ? ' ⭐MAX!' : ''}`, 'buff');
                }, 1200);
            } else {
                gainBlock(state.player, block);
                ChipSystem.addChips(3);
                addLog(`😐 포커 페이스! 인텐트 숨김, 방어도 ${block}!`, 'buff');
            }
        }
    },
    
    // ==========================================
    // 핸드 셔플 - 손패 리셋
    // ==========================================
    handShuffle: {
        id: 'handShuffle',
        name: '핸드 셔플',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 0,
        icon: '🔄',
        description: '손패의 모든 카드를 버리고<br>버린 카드 수만큼 드로우.',
        effect: (state) => {
            // 현재 손패 카드 수 (핸드 셔플 자신 제외)
            const cardsToDiscard = state.hand.filter(card => card.id !== 'handShuffle');
            const discardCount = cardsToDiscard.length;
            
            if (discardCount <= 0) {
                addLog(`🔄 핸드 셔플! 버릴 카드가 없다.`, 'info');
                return;
            }
            
            // 카드 애니메이션 실행
            if (typeof CardAnimation !== 'undefined' && CardAnimation.handShuffle) {
                CardAnimation.handShuffle({
                    cardCount: discardCount,
                    onScatterComplete: () => {
                        // 손패 비우기 (데이터)
                        cardsToDiscard.forEach(card => {
                            const cardIndex = state.hand.indexOf(card);
                            if (cardIndex > -1) {
                                state.hand.splice(cardIndex, 1);
                                state.discardPile.push(card);
                            }
                        });
                        
                        // 겜블러: 버린 카드만큼 칩 획득! (딸랑딸랑!)
                        if (typeof ChipSystem !== 'undefined' && ChipSystem.isActive) {
                            ChipSystem.onCardDiscarded(null, discardCount);
                        }
                        
                        // UI 갱신
                        if (typeof renderHand === 'function') {
                            renderHand();
                        }
                    },
                    onDrawComplete: () => {
                        // 드로우 (데이터)
                        if (typeof drawCards === 'function') {
                            drawCards(discardCount);
                        }
                        addLog(`🔄 핸드 셔플! ${discardCount}장 버리고 ${discardCount}장 드로우!`, 'buff');
                    }
                });
            } else {
                // 애니메이션 없이 처리
                cardsToDiscard.forEach(card => {
                    const cardIndex = state.hand.indexOf(card);
                    if (cardIndex > -1) {
                        state.hand.splice(cardIndex, 1);
                        state.discardPile.push(card);
                    }
                });
                
                // 겜블러: 버린 카드만큼 칩 획득! (딸랑딸랑!)
                if (typeof ChipSystem !== 'undefined' && ChipSystem.isActive) {
                    ChipSystem.onCardDiscarded(null, discardCount);
                }
                
                setTimeout(() => {
                    if (typeof drawCards === 'function') {
                        drawCards(discardCount);
                    }
                    addLog(`🔄 핸드 셔플! ${discardCount}장 버리고 ${discardCount}장 드로우!`, 'buff');
                }, 300);
            }
        }
    },
    
    // ==========================================
    // 조커 - 손패를 완전 랜덤 카드로 교체
    // ==========================================
    wildJoker: {
        id: 'wildJoker',
        name: '와일드 조커',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 1,
        icon: '🃏',
        exhaust: true,
        description: '손패의 모든 카드를 버리고<br><span class="damage-val">완전 랜덤</span> 카드로 교체!<br><span class="exhaust-text">소멸</span>',
        effect: (state) => {
            // 와일드 조커 자신의 참조 찾기
            const jokerCard = state.hand.find(card => card.id === 'wildJoker');
            
            // 현재 손패 카드 수 (조커 자신 제외)
            const cardsToDiscard = state.hand.filter(card => card.id !== 'wildJoker');
            const discardCount = cardsToDiscard.length;
            
            if (discardCount <= 0) {
                addLog(`🃏 와일드 조커! 교체할 카드가 없다.`, 'info');
                return;
            }
            
            // 기존 카드들의 코스트 저장
            const originalCosts = cardsToDiscard.map(card => card.cost);
            
            // 손패 완전히 비우기 (와일드 조커 포함!)
            state.hand.length = 0;
            
            // 버린 카드들을 무덤으로
            cardsToDiscard.forEach(card => {
                state.discardPile.push(card);
            });
            
            // 와일드 조커는 소멸 더미로 (exhaust)
            if (!state.exhaustPile) state.exhaustPile = [];
            if (jokerCard) {
                state.exhaustPile.push(jokerCard);
            }
            
            // 겜블러: 버린 카드만큼 칩 획득
            if (typeof ChipSystem !== 'undefined' && ChipSystem.isActive) {
                ChipSystem.onCardDiscarded(null, discardCount);
            }
            
            // 랜덤 카드 풀 생성 (전체 카드에서!)
            const randomCardPool = GamblerCards.getRandomCardPool();
            
            // 랜덤 카드 생성 (기존 코스트 유지!)
            const newCards = [];
            for (let i = 0; i < discardCount; i++) {
                const randomCardId = randomCardPool[Math.floor(Math.random() * randomCardPool.length)];
                const newCard = typeof createCard === 'function' ? createCard(randomCardId) : null;
                if (newCard) {
                    // 기존 카드의 코스트로 덮어쓰기
                    newCard.originalCost = newCard.cost; // 원래 코스트 저장
                    newCard.cost = originalCosts[i];     // 기존 코스트로 변경
                    newCards.push(newCard);
                    state.hand.push(newCard);
                }
            }
            
            // VFX
            GamblerCards.showJokerEffect(newCards);
            
            addLog(`🃏 와일드 조커! ${discardCount}장 → 완전 랜덤! (코스트 유지)`, 'critical');
            
            // UI 갱신 (즉시)
            if (typeof renderHand === 'function') {
                renderHand();
            }
        }
    },
    
    // 랜덤 카드 풀 (조커용)
    getRandomCardPool() {
        const pool = [];
        
        // 제외할 카드 ID 목록
        const excludeIds = [
            'wildJoker',     // 조커 자신
            'curse_',        // 저주 카드
            'wound',         // 상처
            'burn',          // 화상
            'dazed',         // 멍함
            'slimed',        // 슬라임
            'void',          // 공허
            'blueCard',      // 휘발 카드들 (직접 획득해야 의미)
            'redCard',
            'goldCard',
            'allIn',         // 특수 카드
            'jackpot'
        ];
        
        // 기본 카드
        pool.push('strike', 'defend');
        
        // 겜블러 카드 (사용 가능한 것만)
        pool.push('luckyStrike', 'fortuneGuard', 'chipToss', 'pickACard', 'handShuffle');
        
        // 다른 직업 카드들 (있으면)
        if (typeof cardDatabase !== 'undefined') {
            Object.keys(cardDatabase).forEach(cardId => {
                const card = cardDatabase[cardId];
                
                // 제외 조건 체크
                if (!card) return;
                if (excludeIds.some(ex => cardId.includes(ex))) return;
                if (card.exhaust) return;           // 소멸 카드 제외
                if (card.ethereal || card.isEthereal) return;  // 휘발 카드 제외
                if (card.unplayable) return;        // 사용 불가 카드 제외
                if (card.type === CardType.POWER) return;      // 파워 카드 제외
                if (card.type === CardType.STATUS) return;     // 상태이상 제외
                if (card.type === CardType.CURSE) return;      // 저주 제외
                
                // 공격/스킬 카드, 기본~언커먼만
                if ((card.type === CardType.ATTACK || card.type === CardType.SKILL) &&
                    (card.rarity === Rarity.BASIC || card.rarity === Rarity.COMMON || card.rarity === Rarity.UNCOMMON)) {
                    // 중복 방지
                    if (!pool.includes(cardId)) {
                        pool.push(cardId);
                    }
                }
            });
        }
        
        console.log('[WildJoker] 랜덤 카드 풀:', pool.length, '종류');
        return pool;
    },
    
    // 조커 VFX
    showJokerEffect(newCards) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: jokerFlash 0.8s ease-out;
        `;
        
        // 조커 텍스트
        const text = document.createElement('div');
        text.style.cssText = `
            font-family: 'Cinzel', serif;
            font-size: 4rem;
            font-weight: bold;
            color: #a855f7;
            text-shadow: 0 0 30px #a855f7, 0 0 60px #7c3aed;
            animation: jokerTextPop 0.5s ease-out;
            margin-bottom: 30px;
        `;
        text.textContent = '🃏 WILD JOKER! 🃏';
        overlay.appendChild(text);
        
        // 새 카드들 미리보기
        const cardPreview = document.createElement('div');
        cardPreview.style.cssText = `
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 80%;
        `;
        
        newCards.forEach((card, i) => {
            const cardEl = document.createElement('div');
            cardEl.style.cssText = `
                background: linear-gradient(135deg, #1e1b4b, #312e81);
                border: 2px solid #a855f7;
                border-radius: 8px;
                padding: 10px 15px;
                color: #e9d5ff;
                font-size: 0.9rem;
                animation: cardReveal 0.3s ease-out ${i * 0.1}s both;
                box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
            `;
            cardEl.innerHTML = `${card.icon || '🎴'} ${card.name}`;
            cardPreview.appendChild(cardEl);
        });
        overlay.appendChild(cardPreview);
        
        // 스타일 추가
        if (!document.getElementById('joker-styles')) {
            const style = document.createElement('style');
            style.id = 'joker-styles';
            style.textContent = `
                @keyframes jokerFlash {
                    0% { background: rgba(168, 85, 247, 0.8); }
                    100% { background: rgba(0, 0, 0, 0.7); }
                }
                @keyframes jokerTextPop {
                    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                    60% { transform: scale(1.2) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes cardReveal {
                    0% { transform: translateY(30px) rotateY(90deg); opacity: 0; }
                    100% { transform: translateY(0) rotateY(0deg); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
        
        // 자동 제거
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }, 1500);
    },
    
    // ==========================================
    // 판돈 올리기 - 최대 수치 +3
    // ==========================================
    raiseStakes: {
        id: 'raiseStakes',
        name: '판돈 올리기',
        type: CardType.POWER,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '📈',
        exhaust: true,  // 사용 후 소멸
        description: '이번 전투 동안<br>모든 카드의 최대 수치가 <span class="damage-val">+3</span>.<br><span class="exhaust-text">소멸</span>',
        effect: (state) => {
            // 판돈 올리기 버프 적용 (고정 +3씩 중첩)
            if (!state.player.raiseStakes) {
                state.player.raiseStakes = 0;
            }
            state.player.raiseStakes += 3;  // +3, +6, +9...
            
            // VFX - 칩이 쌓이는 판돈 올리기 연출
            const playerEl = document.getElementById('player');
            if (playerEl && typeof GamblerVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                GamblerVFX.playRaiseStakes(x, y, state.player.raiseStakes);
            }
            
            // 버프 UI 업데이트
            GamblerCards.updateRaiseStakesUI();
            
            addLog(`📈 판돈 올리기! 최대 수치 +${state.player.raiseStakes}!`, 'buff');
        }
    },
    
    // ==========================================
    // 운명의 카드 시스템 (트페 스타일)
    // ==========================================
    pickACard: {
        id: 'pickACard',
        name: '운명의 카드',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '🃏',
        description: '랜덤한 카드를 1장 드로우.<br><span style="color:#60a5fa">🔵파랑</span> <span style="color:#f87171">🔴빨강</span> <span style="color:#fbbf24">🟡골드</span>',
        effect: (state) => {
            // 40% 블루, 40% 레드, 20% 골드
            const roll = Math.random();
            let cardId;
            let cardName;
            let cardColor;
            
            if (roll < 0.4) {
                cardId = 'blueCard';
                cardName = '블루 카드';
                cardColor = '#60a5fa';
            } else if (roll < 0.8) {
                cardId = 'redCard';
                cardName = '레드 카드';
                cardColor = '#f87171';
            } else {
                cardId = 'goldCard';
                cardName = '골드 카드';
                cardColor = '#fbbf24';
            }
            
            // 카드 생성 및 손패에 추가
            const newCard = typeof createCard === 'function' ? createCard(cardId) : null;
            if (newCard) {
                state.hand.push(newCard);
                
                // VFX - 카드 등장 연출
                GamblerCards.showPickACardEffect(cardColor, cardName);
                
                addLog(`🃏 ${cardName} 드로우!`, 'buff');
                
                // 손패 업데이트
                if (typeof renderHand === 'function') {
                    setTimeout(() => renderHand(), 300);
                }
            }
        }
    },
    
    // 블루 카드 - 드로우만
    blueCard: {
        id: 'blueCard',
        name: '블루 카드',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,  // 휘발 카드는 COMMON
        cost: 0,
        icon: '🔵',
        ethereal: true,  // 턴 종료 시 소멸
        description: '카드 1장 드로우.<br><span class="exhaust-text">휘발</span>',
        effect: (state) => {
            // 카드 1장 드로우
            if (typeof drawCards === 'function') {
                drawCards(1);
            }
            
            // VFX
            if (typeof GamblerVFX !== 'undefined') {
                GamblerVFX.playSuccessEffect();
            }
            
            addLog('🔵 카드 드로우!', 'buff');
        }
    },
    
    // 레드 카드 - 전체 랜덤 공격
    redCard: {
        id: 'redCard',
        name: '레드 카드',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,  // 휘발 카드는 COMMON
        cost: 0,
        icon: '🔴',
        ethereal: true,  // 턴 종료 시 소멸
        description: '모든 적에게 <span class="damage-val">2~5</span> 피해.<br><span class="exhaust-text">휘발</span>',
        effect: (state) => {
            const min = 2;
            const max = 5;
            
            // 모든 적에게 랜덤 피해
            state.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    const damage = GamblerCards.rollValue(min, max);
                    const actualMax = GamblerCards.getActualMax(max);
                    const isMax = damage >= actualMax;
                    const isMin = damage <= min;
                    
                    // VFX
                    const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                    if (enemyEl && typeof GamblerVFX !== 'undefined') {
                        const rect = enemyEl.getBoundingClientRect();
                        GamblerVFX.playChipHitFast(rect.left + rect.width/2, rect.top + rect.height/2, isMax);
                    }
                    
                    if (typeof dealDamage === 'function') {
                        dealDamage(enemy, damage);
                    } else {
                        enemy.hp -= damage;
                    }
                    
                    // MAX/MIN 로그
                    if (isMax) {
                        addLog(`🔴 MAX! ${damage} 피해!`, 'critical');
                    } else if (isMin) {
                        addLog(`🔴 MIN... ${damage} 피해`, 'debuff');
                    }
                }
            });
            
            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
        }
    },
    
    // 골드 카드 - 강력한 단일 랜덤 공격 + 약화
    goldCard: {
        id: 'goldCard',
        name: '골드 카드',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,  // 골드는 약간 높게
        cost: 0,
        icon: '🟡',
        ethereal: true,  // 턴 종료 시 소멸
        description: '적에게 <span class="damage-val">4~10</span> 피해.<br><span class="debuff-val">약화</span> 1 부여.<br><span class="exhaust-text">휘발</span>',
        effect: (state) => {
            const min = 4;
            const max = 10;
            const target = state.targetEnemy || state.enemies[0];
            
            if (target && target.hp > 0) {
                const damage = GamblerCards.rollValue(min, max);
                const actualMax = GamblerCards.getActualMax(max);
                const isMax = damage >= actualMax;
                const isMin = damage <= min;
                
                // VFX - 골드 카드는 화려하게!
                const enemyEl = GamblerCards.getTargetEnemyElement(target);
                if (enemyEl && typeof GamblerVFX !== 'undefined') {
                    const rect = enemyEl.getBoundingClientRect();
                    if (isMax) {
                        GamblerVFX.playJackpotParticles(rect.left + rect.width/2, rect.top + rect.height/2);
                    } else {
                        GamblerVFX.playChipHitFast(rect.left + rect.width/2, rect.top + rect.height/2, false);
                    }
                }
                
                // 대미지
                if (typeof dealDamage === 'function') {
                    dealDamage(target, damage);
                } else {
                    target.hp -= damage;
                }
                
                // 약화 부여
                if (!target.weak) target.weak = 0;
                target.weak += 1;
                
                // 로그
                if (isMax) {
                    addLog(`🟡 JACKPOT! ${damage} 피해 + 약화!`, 'critical');
                } else if (isMin) {
                    addLog(`🟡 골드 카드... ${damage} 피해 + 약화`, 'debuff');
                } else {
                    addLog(`🟡 골드 카드! ${damage} 피해 + 약화!`, 'damage');
                }
            }
            
            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
        }
    },
    
    // 운명의 카드 VFX
    showPickACardEffect(color, cardName) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 99999;
            pointer-events: none;
        `;
        
        // 3장의 카드가 돌다가 하나가 선택되는 연출
        overlay.innerHTML = `
            <div style="
                display: flex;
                gap: 20px;
                animation: pickCardReveal 0.5s ease-out;
            ">
                <div class="fate-card" style="
                    width: 60px;
                    height: 90px;
                    background: linear-gradient(135deg, ${color}44, ${color}88);
                    border: 3px solid ${color};
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    box-shadow: 0 0 30px ${color};
                    animation: fateCardPop 0.6s ease-out;
                ">
                    ${cardName.includes('블루') ? '🔵' : cardName.includes('레드') ? '🔴' : '🟡'}
                </div>
            </div>
            <div style="
                text-align: center;
                margin-top: 15px;
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                font-weight: bold;
                color: ${color};
                text-shadow: 0 0 20px ${color}, 0 2px 4px rgba(0,0,0,0.8);
                animation: fateTextPop 0.4s ease-out 0.2s both;
            ">
                ${cardName}!
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 스타일 추가
        if (!document.getElementById('fate-card-styles')) {
            const style = document.createElement('style');
            style.id = 'fate-card-styles';
            style.textContent = `
                @keyframes pickCardReveal {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes fateCardPop {
                    0% { transform: scale(0) rotateY(180deg); }
                    60% { transform: scale(1.2) rotateY(0deg); }
                    100% { transform: scale(1) rotateY(0deg); }
                }
                @keyframes fateTextPop {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }, 800);
    },
    
    // ==========================================
    // 유틸리티 함수
    // ==========================================
    
    // 타겟팅된 적의 DOM 요소 가져오기
    getTargetEnemyElement(enemy) {
        // enemy 객체에서 인덱스 찾기
        if (enemy && typeof gameState !== 'undefined' && gameState.enemies) {
            const enemyIndex = gameState.enemies.indexOf(enemy);
            if (enemyIndex >= 0) {
                // getEnemyElement 함수 사용
                if (typeof getEnemyElement === 'function') {
                    return getEnemyElement(enemyIndex);
                }
                // fallback: 직접 쿼리
                const container = document.getElementById('enemies-container');
                if (container) {
                    return container.querySelector(`[data-index="${enemyIndex}"]`);
                }
            }
        }
        // 최종 fallback: 첫 번째 적 또는 단일 적
        return document.querySelector('.enemy-unit[data-index="0"]') || document.getElementById('enemy');
    },
    
    // 랜덤 값 계산 (판돈 올리기 적용)
    rollValue(min, max) {
        // 판돈 올리기 버프 적용 (고정 수치 추가)
        let actualMax = max;
        if (typeof gameState !== 'undefined' && gameState.player && gameState.player.raiseStakes) {
            actualMax = max + gameState.player.raiseStakes;
        }
        return Math.floor(Math.random() * (actualMax - min + 1)) + min;
    },
    
    // 실제 최대값 가져오기 (고정 수치 추가)
    getActualMax(max) {
        if (typeof gameState !== 'undefined' && gameState.player && gameState.player.raiseStakes) {
            return max + gameState.player.raiseStakes;
        }
        return max;
    },
    
    // 판돈 올리기 버프 UI 업데이트
    updateRaiseStakesUI() {
        // player-debuffs 또는 player-buffs 컨테이너 찾기
        let container = document.getElementById('player-buffs') || document.getElementById('player-debuffs');
        
        // 컨테이너가 없으면 생성
        if (!container) {
            const playerUnit = document.querySelector('.player-unit');
            if (playerUnit) {
                container = document.createElement('div');
                container.id = 'player-buffs';
                container.className = 'player-buffs';
                playerUnit.appendChild(container);
            } else {
                return;
            }
        }
        
        // 기존 판돈 올리기 아이콘 제거
        const existing = document.querySelector('.buff-icon.raise-stakes');
        if (existing) existing.remove();
        
        // 버프가 있으면 추가
        if (typeof gameState !== 'undefined' && gameState.player && gameState.player.raiseStakes > 0) {
            const bonus = gameState.player.raiseStakes;
            
            const buffIcon = document.createElement('div');
            buffIcon.className = 'buff-icon raise-stakes';
            buffIcon.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 45px;
                height: 45px;
                background: linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%);
                border: 2px solid #fbbf24;
                border-radius: 8px;
                cursor: help;
                box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
                animation: raiseStakesPulse 2s ease-in-out infinite;
            `;
            buffIcon.innerHTML = `
                <span style="font-size: 1.2rem; line-height: 1;">📈</span>
                <span style="font-size: 0.65rem; font-weight: bold; color: #fbbf24; text-shadow: 0 0 5px rgba(251, 191, 36, 0.8); margin-top: 2px;">+${bonus}</span>
                <div class="raise-stakes-tooltip" style="
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid #fbbf24;
                    border-radius: 6px;
                    padding: 8px 12px;
                    white-space: nowrap;
                    font-size: 0.8rem;
                    color: #fcd34d;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                    z-index: 1000;
                    margin-bottom: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                ">
                    <div style="font-weight: bold; margin-bottom: 4px;">📈 판돈 올리기</div>
                    <div>최대 수치 <span style="color: #4ade80;">+${bonus}</span></div>
                </div>
            `;
            
            // 마우스 호버 시 툴팁 표시
            buffIcon.addEventListener('mouseenter', () => {
                const tooltip = buffIcon.querySelector('.raise-stakes-tooltip');
                if (tooltip) tooltip.style.opacity = '1';
            });
            buffIcon.addEventListener('mouseleave', () => {
                const tooltip = buffIcon.querySelector('.raise-stakes-tooltip');
                if (tooltip) tooltip.style.opacity = '0';
            });
            
            container.appendChild(buffIcon);
            
            console.log(`[Gambler] 판돈 올리기 UI 업데이트: +${bonus}`);
        }
    },
    
    // 랜덤 데미지 (취약 등 적용)
    rollDamage(min, max) {
        return this.rollValue(min, max);
    },
    
    // 도박 이펙트 (GamblerVFX 연동)
    playGambleEffect(value, min, max, type = 'damage') {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top - 20;
        
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playGambleResult(value, min, max, x, y, type);
        }
    },
    
    // 성공 이펙트
    playSuccessEffect() {
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playSuccessEffect(window.innerWidth / 2, window.innerHeight / 2);
        }
    },
    
    // 실패 이펙트
    playFailEffect() {
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playFailEffect(window.innerWidth / 2, window.innerHeight / 2);
        }
    },
    
    // 블러프 이펙트
    showBluffEffect() {
        const playerEl = document.getElementById('player');
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playBluffEffect(playerEl);
        }
    },
    
    // 슬롯 이펙트
    playSlotEffect(results, callback) {
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playSlotEffect(results, callback);
        }
    },
    
    // 올인 이펙트
    playAllInEffect(chips) {
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playAllInEffect(chips, window.innerWidth / 2, window.innerHeight / 2);
        }
    },
    
    // 잭팟 이펙트
    playJackpotEffect() {
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playJackpotFullEffect();
        }
    },
    
    // 힐 이펙트
    playHealEffect() {
        const playerEl = document.getElementById('player');
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playHealEffect(playerEl);
        }
    },
    
    // 칩 획득 이펙트
    playChipGainEffect(amount) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.playChipGainEffect(amount, rect.left + rect.width / 2, rect.top);
        }
    }
};

// ==========================================
// 겜블러 직업 정의
// ==========================================
const GamblerJob = {
    id: 'gambler',
    name: '겜블러',
    nameEn: 'Gambler',
    icon: '🎰',
    color: '#fbbf24',
    description: '모든 수치가 랜덤! 칩을 모아 올인하라!',
    lore: '운명을 주사위에 맡기는 도박꾼. 고위험 고수익의 짜릿한 전투 스타일.',
    unlocked: false, // ALL-IN 이벤트로 언락
    sprite: 'hero_gambler.png',
    spriteScale: 1.0,
    slashSprite: 'hero_gambler.png',
    slashSpriteScale: 1.2,
    stats: {
        maxHp: 60,
        energy: 3,
        drawCount: 5
    },
    starterDeck: {
        attacks: {
            luckyStrike: 4,
            doubleDown: 1
        },
        skills: {
            fortuneGuard: 3,
            chipToss: 1,
            handShuffle: 1,
            pickACard: 2  // 운명의 카드 2장
        },
        powers: {
            raiseStakes: 1
        }
    },
    starterRelics: ['gamblersDice'],
    
    // 전투 시작 시 호출
    onBattleStart(state) {
        ChipSystem.activate();
        
        // GamblerVFX 미리 초기화 (첫 카드 사용 시 지연 방지)
        if (typeof GamblerVFX !== 'undefined') {
            GamblerVFX.ensureInit();
            console.log('[Gambler] VFX 사전 초기화 완료');
        }
        
        // 판돈 올리기 초기화
        if (state.player) {
            state.player.raiseStakes = 0;
        }
    },
    
    // 전투 종료 시 호출
    onBattleEnd(state) {
        ChipSystem.deactivate();
    },
    
    // 턴 시작 시 호출
    onTurnStart(state) {
        // 블러프 초기화
        state.player.bluffActive = false;
        state.player.bluffChance = 0;
        
        // 포커 페이스 해제
        if (state.player.pokerFaceActive) {
            document.querySelectorAll('.enemy-intent').forEach(el => {
                el.style.visibility = 'visible';
            });
            state.player.pokerFaceActive = false;
        }
    },
    
    // 턴 종료 시 호출
    onTurnEnd(state) {
        // 칩 빚: 턴 종료 시 칩 0개면 자해
        if (ChipSystem.chips === 0) {
            state.player.hp = Math.max(1, state.player.hp - 3);
            addLog('💀 칩 빚! 자해 3!', 'debuff');
            if (typeof updateUI === 'function') updateUI();
        }
    },
    
    // 피해 받기 전 (블러프 처리)
    onBeforeDamage(state, damage) {
        if (state.player.bluffActive && Math.random() < state.player.bluffChance) {
            addLog('🃏 블러프 성공! 피해 회피!', 'special');
            return 0;
        }
        return damage;
    }
};

// ==========================================
// 겜블러 전용 유물
// ==========================================
const GamblerRelics = {
    gamblersDice: {
        id: 'gamblersDice',
        name: '도박꾼의 주사위',
        name_kr: '도박꾼의 주사위',
        rarity: 'starter',
        icon: '🎲',
        description: '전투 시작 시 칩 +3. 턴 시작 시 10% 확률로 칩 +2.',
        onBattleStart: function(state) {
            ChipSystem.addChips(3);
        },
        onTurnStart: function(state) {
            if (Math.random() < 0.1) {
                ChipSystem.addChips(2);
                addLog('🎲 도박꾼의 주사위! 칩 +2!', 'buff');
            }
        }
    },
    
    luckyCharm: {
        id: 'luckyCharm',
        name: '행운의 부적',
        name_kr: '행운의 부적',
        rarity: 'uncommon',
        icon: '🍀',
        description: '랜덤 수치의 최소값 +1.',
        // 카드에서 참조
    },
    
    loadedDice: {
        id: 'loadedDice',
        name: '조작된 주사위',
        name_kr: '조작된 주사위',
        rarity: 'rare',
        icon: '🎯',
        description: '올인 시 데미지 최대값 보장.',
        // 올인 카드에서 참조
    }
};

// ==========================================
// 스타일 추가
// ==========================================
const gamblerStyles = `
    @keyframes gambleResultPop {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(0) scale(0.5);
        }
        30% {
            opacity: 1;
            transform: translateX(-50%) translateY(-20px) scale(1.2);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-60px) scale(1);
        }
    }
    
    /* 판돈 올리기 버프 아이콘 */
    .buff-icon.raise-stakes {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 45px;
        height: 45px;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%);
        border: 2px solid #fbbf24;
        border-radius: 8px;
        position: relative;
        cursor: help;
        box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
        animation: raiseStakesPulse 2s ease-in-out infinite;
    }
    
    .buff-icon.raise-stakes .buff-emoji {
        font-size: 1.2rem;
        line-height: 1;
    }
    
    .buff-icon.raise-stakes .buff-value {
        font-size: 0.65rem;
        font-weight: bold;
        color: #fbbf24;
        text-shadow: 0 0 5px rgba(251, 191, 36, 0.8);
        margin-top: 2px;
    }
    
    @keyframes raiseStakesPulse {
        0%, 100% {
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
            transform: scale(1);
        }
        50% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.7);
            transform: scale(1.05);
        }
    }
    
`;

// ==========================================
// 카드 목록 (유틸리티 함수 제외)
// ==========================================
const GamblerCardList = {
    luckyStrike: GamblerCards.luckyStrike,
    fortuneGuard: GamblerCards.fortuneGuard,
    chipToss: GamblerCards.chipToss,
    doubleDown: GamblerCards.doubleDown,
    highRoller: GamblerCards.highRoller,
    bluff: GamblerCards.bluff,
    chipStack: GamblerCards.chipStack,
    slotSpin: GamblerCards.slotSpin,
    allIn: GamblerCards.allIn,
    jackpot: GamblerCards.jackpot,
    riskyHeal: GamblerCards.riskyHeal,
    houseMoney: GamblerCards.houseMoney,
    pokerFace: GamblerCards.pokerFace,
    handShuffle: GamblerCards.handShuffle,
    wildJoker: GamblerCards.wildJoker,
    raiseStakes: GamblerCards.raiseStakes,
    // 운명의 카드 시스템
    pickACard: GamblerCards.pickACard,
    blueCard: GamblerCards.blueCard,
    redCard: GamblerCards.redCard,
    goldCard: GamblerCards.goldCard
};

// ==========================================
// 초기화
// ==========================================
function initGamblerSystem() {
    // 스타일 주입
    ChipSystem.injectStyles();
    
    const style = document.createElement('style');
    style.textContent = gamblerStyles;
    document.head.appendChild(style);
    
    // 카드 데이터베이스에 등록 (카드만!)
    if (typeof cardDatabase !== 'undefined') {
        Object.keys(GamblerCardList).forEach(cardId => {
            cardDatabase[cardId] = GamblerCardList[cardId];
        });
        console.log('[Gambler] 카드 데이터베이스에 등록 완료:', Object.keys(GamblerCardList));
    } else {
        console.warn('[Gambler] cardDatabase가 아직 정의되지 않음! 지연 등록 시도...');
        // 지연 등록
        setTimeout(() => {
            if (typeof cardDatabase !== 'undefined') {
                Object.keys(GamblerCardList).forEach(cardId => {
                    cardDatabase[cardId] = GamblerCardList[cardId];
                });
                console.log('[Gambler] 지연 등록 완료:', Object.keys(GamblerCardList));
            }
        }, 100);
    }
    
    // 유물 데이터베이스에 등록
    if (typeof relicDatabase !== 'undefined') {
        Object.assign(relicDatabase, GamblerRelics);
        console.log('[Gambler] 유물 데이터베이스에 등록 완료');
    }
    
    // JobSystem에 직업 등록
    if (typeof JobSystem !== 'undefined' && JobSystem.jobs) {
        // 언락 상태 확인
        const isUnlocked = localStorage.getItem('lordofnight_gambler_unlocked') === 'true';
        GamblerJob.unlocked = isUnlocked;
        
        JobSystem.jobs.gambler = GamblerJob;
        console.log('[Gambler] JobSystem에 직업 등록 완료 (언락:', isUnlocked, ')');
    }
    
    console.log('[Gambler] 겜블러 시스템 초기화 완료');
}

// 전역 등록
window.ChipSystem = ChipSystem;
window.GamblerCards = GamblerCards;
window.GamblerCardList = GamblerCardList;
window.GamblerJob = GamblerJob;
window.GamblerRelics = GamblerRelics;

// cardDatabase가 이미 있으면 즉시 등록
if (typeof cardDatabase !== 'undefined') {
    Object.keys(GamblerCardList).forEach(cardId => {
        cardDatabase[cardId] = GamblerCardList[cardId];
    });
    console.log('[Gambler] 즉시 카드 등록 완료:', Object.keys(GamblerCardList));
}

// DOM 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGamblerSystem);
} else {
    initGamblerSystem();
}

console.log('[Gambler] hero-gambler.js 로드됨');

