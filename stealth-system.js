// ==========================================
// 도적 은신 시스템 (Stealth System)
// 도적 전용 - 카드 사용으로 게이지 충전 후 발동
// ==========================================

const StealthSystem = {
    // 은신 게이지 (충전용)
    gauge: 0,
    maxGauge: 3,  // 3장 사용 시 1스택 획득
    
    // 은신 상태
    isStealthed: false,
    stealthPerStack: 3,  // 스택당 은신 효과 (1스택 = 3은신)
    
    // 현재 은신 스택 (피해 감소 & 공격 보너스)
    stacks: 0,
    maxStacks: 5,  // 최대 스택 수
    
    // 현재 은신 값 (발동 시 고정, 피격 시 감소)
    currentStealthValue: 0,
    
    // 활성화 상태
    isActive: false,
    
    // UI 요소
    orbElement: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.gauge = 0;
        this.stacks = 0;
        this.currentStealthValue = 0;
        this.isStealthed = false;
        this.isActive = false;
        this.removeUI();
        console.log('[Stealth] 시스템 초기화');
    },
    
    // 시스템 활성화
    activate() {
        if (this.isActive) {
            console.log('[Stealth] 이미 활성화됨');
            return;
        }
        
        console.log('[Stealth] 은신 시스템 활성화');
        
        this.isActive = true;
        this.gauge = 0;
        this.stacks = 0;
        this.currentStealthValue = 0;
        this.isStealthed = false;
        
        this.createUI();
        this.updateUI();
        this.injectStyles();
        
        console.log('[Stealth] ✅ 활성화 완료');
    },
    
    // 시스템 비활성화
    deactivate() {
        this.isActive = false;
        this.gauge = 0;
        this.stacks = 0;
        this.currentStealthValue = 0;
        this.isStealthed = false;
        this.removeUI();
        this.removeStealthVFX();
        console.log('[Stealth] 은신 시스템 비활성화');
    },
    
    // ==========================================
    // 카드 사용 시 호출
    // ==========================================
    onCardPlayed(card) {
        // 도적이 아니면 무시
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob !== 'rogue') {
            return;
        }
        
        // 비활성 상태면 자동 활성화
        if (!this.isActive) {
            this.activate();
        }
        
        // 최대 스택이면 게이지 증가 안함
        if (this.stacks >= this.maxStacks) {
            return;
        }
        
        // 게이지 증가
        this.gauge++;
        console.log(`[Stealth] 게이지 ${this.gauge}/${this.maxGauge}`);
        
        // 게이지가 가득 차면 스택 자동 추가
        if (this.gauge >= this.maxGauge) {
            this.gauge = 0;  // 게이지 리셋
            this.addStack();
        }
        
        this.updateUI();
    },
    
    // 스택 추가 (자동) - 은신 발동은 별도
    addStack() {
        if (this.stacks >= this.maxStacks) {
            return;
        }
        
        this.stacks++;
        
        console.log(`[Stealth] 🌑 스택 +1 → ${this.stacks}스택 (${this.getStealthValue()} 은신 준비)`);
        
        // 스택 획득 VFX (작은 효과)
        this.showStackGainVFX();
        
        if (typeof addLog === 'function') {
            addLog(`🌑 은신 준비 +1! (${this.stacks}스택)`, 'buff');
        }
    },
    
    // 은신 발동 (클릭 시)
    activateStealth() {
        if (this.stacks <= 0) {
            console.log('[Stealth] 스택 없음');
            return false;
        }
        
        if (this.isStealthed) {
            console.log('[Stealth] 이미 은신 중');
            return false;
        }
        
        // 은신 발동! 스택 * 3 = 은신 값 고정
        this.isStealthed = true;
        this.currentStealthValue = this.stacks * this.stealthPerStack;
        
        console.log(`[Stealth] 🌑 은신 발동! ${this.stacks}스택 = ${this.currentStealthValue} 은신`);
        
        // 스택은 소모 (은신 값으로 전환됨)
        this.stacks = 0;
        this.gauge = 0;
        
        // 산데비스탄 VFX
        this.applyStealthVFX();
        this.playStealthSound();
        
        // 버프 인디케이터 표시
        this.updatePlayerBuffIndicator();
        
        if (typeof addLog === 'function') {
            addLog(`🌑 은신! (${this.currentStealthValue} 은신)`, 'buff');
        }
        
        this.updateUI();
        return true;
    },
    
    // 스택 → 은신 효과 변환
    getStealthValue() {
        return this.stacks * this.stealthPerStack;
    },
    
    // 스택 획득 VFX
    showStackGainVFX() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        
        // 스택 획득 텍스트
        const text = document.createElement('div');
        text.className = 'stealth-stack-gain';
        text.innerHTML = `<span class="stack-text">+1 STACK</span><span class="stack-value">${this.getStealthValue()} 은신</span>`;
        text.style.left = `${centerX}px`;
        text.style.top = `${rect.top - 30}px`;
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1000);
        
        // 오브 펄스
        if (this.orbElement) {
            this.orbElement.classList.add('stack-gained');
            setTimeout(() => this.orbElement.classList.remove('stack-gained'), 400);
        }
    },
    
    // ==========================================
    // 은신 스택 관리
    // ==========================================
    getStacks() {
        return this.stacks;
    },
    
    // 은신 중이고 은신 값이 있는지 확인
    hasStacks() {
        return this.isStealthed && this.currentStealthValue > 0;
    },
    
    // 현재 은신 값 반환 (발동된 은신)
    getCurrentStealthValue() {
        return this.currentStealthValue;
    },
    
    // 은신 소모 (공격 시) - 현재 은신 값 전체를 보너스 데미지로
    consumeStealth() {
        if (!this.isStealthed || this.currentStealthValue <= 0) {
            return 0;
        }
        
        const bonusDamage = this.currentStealthValue;
        
        console.log(`[Stealth] ${bonusDamage} 은신 소모 → 추가 데미지`);
        
        // 은신 해제
        this.currentStealthValue = 0;
        this.isStealthed = false;
        
        // 은신 해제 VFX
        this.showStealthBreakVFX(bonusDamage);
        this.removeStealthVFX();
        
        // 버프 인디케이터 제거
        this.updatePlayerBuffIndicator();
        
        if (typeof addLog === 'function') {
            addLog(`⚔️ 기습! +${bonusDamage} 데미지`, 'buff');
        }
        
        this.updateUI();
        return bonusDamage;
    },
    
    // ==========================================
    // 피해 감소 (방어도 깨진 후)
    // 순서: 방어도 → 은신 → HP
    // ==========================================
    reduceDamage(damage) {
        if (!this.isStealthed || this.currentStealthValue <= 0 || damage <= 0) {
            return { reduced: 0, remaining: damage };
        }
        
        // 현재 은신 값만큼 데미지 감소
        const reduced = Math.min(this.currentStealthValue, damage);
        const remaining = damage - reduced;
        
        // 은신 값 감소
        this.currentStealthValue -= reduced;
        
        // 은신 값이 0이 되면 은신 해제
        if (this.currentStealthValue <= 0) {
            this.currentStealthValue = 0;
            this.isStealthed = false;
            this.removeStealthVFX();
        }
        
        console.log(`[Stealth] 은신으로 ${reduced} 피해 회피 (남은 은신: ${this.currentStealthValue})`);
        
        // 회피 VFX
        this.showDodgeVFX(reduced);
        
        // 버프 인디케이터 업데이트
        this.updatePlayerBuffIndicator();
        
        if (typeof addLog === 'function') {
            if (this.currentStealthValue > 0) {
                addLog(`🌑 은신으로 ${reduced} 회피! (남은 은신: ${this.currentStealthValue})`, 'buff');
            } else {
                addLog(`🌑 은신으로 ${reduced} 회피! (은신 해제)`, 'buff');
            }
        }
        
        this.updateUI();
        
        return { reduced, remaining };
    },
    
    // ==========================================
    // 공격 데미지 보너스 계산
    // ==========================================
    getAttackBonus() {
        return this.isStealthed ? this.currentStealthValue : 0;
    },
    
    // 공격 카드 사용 시 호출 (데미지 계산용)
    onAttackCardPlayed(card) {
        if (!this.isActive || !this.isStealthed || this.currentStealthValue <= 0) {
            return { bonusDamage: 0, consumed: false };
        }
        
        const bonus = this.consumeStealth();  // 현재 은신 값 반환
        
        return { bonusDamage: bonus, consumed: true };
    },
    
    // ==========================================
    // 턴 관리
    // ==========================================
    onTurnStart() {
        // 턴 시작 시 처리 없음 (은신은 유지)
    },
    
    onTurnEnd() {
        // 턴 종료 시 처리 없음 (은신은 유지)
    },
    
    onBattleStart() {
        this.gauge = 0;
        this.stacks = 0;
        this.currentStealthValue = 0;
        this.isStealthed = false;
        this.removeStealthVFX();
        this.updateUI();
    },
    
    onBattleEnd() {
        this.gauge = 0;
        this.stacks = 0;
        this.currentStealthValue = 0;
        this.isStealthed = false;
        this.removeStealthVFX();
        this.updateUI();
    },
    
    // ==========================================
    // UI: 은신 오브 (영창 시스템 스타일)
    // ==========================================
    createUI() {
        if (this.orbElement) return;
        
        const orb = document.createElement('div');
        orb.id = 'stealth-orb';
        orb.className = 'stealth-orb';
        
        orb.innerHTML = `
            <div class="stealth-orb-glow"></div>
            
            <!-- 원형 프로그레스 SVG -->
            <svg class="stealth-progress-ring" viewBox="0 0 120 120">
                <circle class="progress-bg" cx="60" cy="60" r="54" />
                <circle class="progress-fill" cx="60" cy="60" r="54" 
                    stroke-dasharray="${2 * Math.PI * 54}" 
                    stroke-dashoffset="${2 * Math.PI * 54}"
                    transform="rotate(-90 60 60)" />
            </svg>
            
            <!-- 내부 구체 -->
            <div class="stealth-core">
                <div class="stealth-shadow"></div>
                <div class="stealth-icon">🌑</div>
            </div>
            
            <!-- 스택 표시 -->
            <div class="stealth-stacks">
                <span class="stacks-value">0</span>
            </div>
            
            <!-- 게이지 수치 (진행도) -->
            <div class="stealth-count">
                <span class="current">0</span>/<span class="max">${this.maxGauge}</span>
            </div>
            
            <!-- 상태 텍스트 -->
            <div class="stealth-status"></div>
            
            <!-- 툴팁 -->
            <div class="stealth-tooltip">
                <div class="tooltip-header">🌑 은신</div>
                <div class="tooltip-desc">
                    카드 ${this.maxGauge}장 → 1스택 획득<br>
                    • 1스택 = ${this.stealthPerStack} 은신<br>
                    • 피해 시 은신만큼 감소<br>
                    • 공격 시 은신만큼 추가 데미지
                </div>
                <div class="tooltip-hint">최대 ${this.maxStacks}스택 (${this.maxStacks * this.stealthPerStack} 은신)</div>
            </div>
        `;
        
        // 클릭으로 은신 발동
        orb.addEventListener('click', () => {
            if (this.stacks > 0 && !this.isStealthed) {
                this.activateStealth();
            }
        });
        
        // 마우스 호버로 툴팁 표시
        orb.addEventListener('mouseenter', () => this.showTooltip());
        orb.addEventListener('mouseleave', () => this.hideTooltip());
        
        document.body.appendChild(orb);
        this.orbElement = orb;
    },
    
    showTooltip() {
        if (!this.orbElement) return;
        const tooltip = this.orbElement.querySelector('.stealth-tooltip');
        if (tooltip) tooltip.classList.add('show');
    },
    
    hideTooltip() {
        if (!this.orbElement) return;
        const tooltip = this.orbElement.querySelector('.stealth-tooltip');
        if (tooltip) tooltip.classList.remove('show');
    },
    
    removeUI() {
        if (this.orbElement) {
            this.orbElement.remove();
            this.orbElement = null;
        }
    },
    
    updateUI() {
        if (!this.orbElement) return;
        
        const circumference = 2 * Math.PI * 54;
        const percent = this.gauge / this.maxGauge;
        const offset = circumference * (1 - percent);
        
        // 프로그레스 바 업데이트
        const progressFill = this.orbElement.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.strokeDashoffset = offset;
        }
        
        // 게이지 수치 (진행도)
        const countEl = this.orbElement.querySelector('.stealth-count .current');
        if (countEl) countEl.textContent = this.gauge;
        
        // 스택 표시 (은신 중이면 현재 은신 값, 아니면 스택 수)
        const stacksEl = this.orbElement.querySelector('.stealth-stacks .stacks-value');
        if (stacksEl) {
            if (this.isStealthed) {
                stacksEl.textContent = this.currentStealthValue;
            } else {
                stacksEl.textContent = this.stacks;
            }
        }
        
        // 상태 텍스트
        const statusEl = this.orbElement.querySelector('.stealth-status');
        if (statusEl) {
            if (this.isStealthed) {
                statusEl.textContent = `${this.currentStealthValue} 은신 중!`;
                statusEl.className = 'stealth-status active';
            } else if (this.stacks > 0) {
                statusEl.textContent = '클릭하여 발동!';
                statusEl.className = 'stealth-status ready';
            } else {
                statusEl.textContent = '';
                statusEl.className = 'stealth-status';
            }
        }
        
        // 오브 상태 클래스
        this.orbElement.classList.remove('ready', 'stealthed', 'max-stacks');
        if (this.isStealthed) {
            this.orbElement.classList.add('stealthed');
        } else if (this.stacks > 0) {
            this.orbElement.classList.add('ready');
            if (this.stacks >= this.maxStacks) {
                this.orbElement.classList.add('max-stacks');
            }
        }
    },
    
    // ==========================================
    // 플레이어 버프 인디케이터 (buff.js 스타일)
    // ==========================================
    updatePlayerBuffIndicator() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        // 버프 컨테이너 찾기/생성
        let container = playerEl.querySelector('.stealth-buff-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'stealth-buff-container';
            playerEl.appendChild(container);
        }
        
        // 은신 중이면 버프 아이콘 표시
        if (this.isStealthed && this.currentStealthValue > 0) {
            container.innerHTML = `
                <div class="stealth-buff-icon" title="은신: ${this.currentStealthValue}">
                    <span class="buff-emoji">🌑</span>
                    <span class="buff-value">${this.currentStealthValue}</span>
                </div>
            `;
            container.style.display = 'flex';
        } else {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    },
    
    // ==========================================
    // VFX: 은신 발동
    // ==========================================
    showStealthActivateVFX() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 은신 발동 텍스트
        const text = document.createElement('div');
        text.className = 'stealth-activate-text';
        text.textContent = 'STEALTH!';
        text.style.left = `${centerX}px`;
        text.style.top = `${rect.top - 40}px`;
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1200);
        
        // 그림자 폭발 파티클
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'stealth-particle';
            const angle = (i / 12) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            particle.style.cssText = `
                left: ${centerX}px;
                top: ${centerY}px;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
        
        // 오브 시전 효과
        if (this.orbElement) {
            this.orbElement.classList.add('casting');
            setTimeout(() => this.orbElement.classList.remove('casting'), 600);
        }
    },
    
    // VFX: 은신 상태 (지속)
    applyStealthVFX() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        // 산데비스탄 스타일: 뒤로 살짝 갔다가 제자리로
        playerEl.classList.add('stealth-enter');
        setTimeout(() => playerEl.classList.remove('stealth-enter'), 600);
        
        // 잔상 효과
        this.createAfterImages(playerEl);
        
        // 은신 상태 적용 (애니메이션 후)
        setTimeout(() => {
            playerEl.classList.add('stealthed');
            
            // 그림자 오라 추가
            let aura = playerEl.querySelector('.stealth-aura');
            if (!aura) {
                aura = document.createElement('div');
                aura.className = 'stealth-aura';
                playerEl.appendChild(aura);
            }
        }, 200);
    },
    
    // 잔상 효과 생성
    createAfterImages(playerEl) {
        const rect = playerEl.getBoundingClientRect();
        const sprite = playerEl.querySelector('img');
        if (!sprite) return;
        
        // 잔상 3개 생성
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const afterImage = document.createElement('div');
                afterImage.className = 'stealth-afterimage';
                afterImage.style.cssText = `
                    left: ${rect.left + rect.width / 2}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    background-image: url('${sprite.src}');
                    --offset: ${-30 - i * 25}px;
                `;
                document.body.appendChild(afterImage);
                setTimeout(() => afterImage.remove(), 400);
            }, i * 80);
        }
    },
    
    removeStealthVFX() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        playerEl.classList.remove('stealthed');
        
        const aura = playerEl.querySelector('.stealth-aura');
        if (aura) aura.remove();
    },
    
    // VFX: 은신 해제 (기습)
    showStealthBreakVFX(stealthValue) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        
        // 기습 텍스트는 damage-system.js의 앰부시 VFX가 처리
        // 여기서는 플레이어 쪽 이펙트만
        
        // 플래시 이펙트
        playerEl.classList.add('stealth-break');
        setTimeout(() => playerEl.classList.remove('stealth-break'), 400);
        
        // 그림자 흩어짐
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'stealth-break-particle';
            const angle = (i / 8) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            particle.style.cssText = `
                left: ${centerX}px;
                top: ${rect.top + rect.height / 2}px;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
    },
    
    // VFX: 피해 회피 (빗겨맞기)
    showDodgeVFX(amount) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 1. 회피 동작 - 옆으로 빠졌다가 돌아옴
        playerEl.classList.add('stealth-evade');
        setTimeout(() => playerEl.classList.remove('stealth-evade'), 500);
        
        // 2. 잔상 효과 (회피 궤적)
        const sprite = playerEl.querySelector('img');
        if (sprite) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const afterImage = document.createElement('div');
                    afterImage.className = 'evade-afterimage';
                    afterImage.style.cssText = `
                        left: ${centerX}px;
                        top: ${rect.top}px;
                        width: ${rect.width}px;
                        height: ${rect.height}px;
                        background-image: url('${sprite.src}');
                        --offset: ${40 + i * 20}px;
                    `;
                    document.body.appendChild(afterImage);
                    setTimeout(() => afterImage.remove(), 350);
                }, i * 50);
            }
        }
        
        // 3. 빗겨가는 대미지 숫자
        const missText = document.createElement('div');
        missText.className = 'stealth-miss-text';
        missText.innerHTML = `<span class="miss-label">EVADE</span><span class="miss-amount">-${amount}</span>`;
        missText.style.left = `${centerX + 60}px`;
        missText.style.top = `${centerY - 20}px`;
        document.body.appendChild(missText);
        setTimeout(() => missText.remove(), 1000);
        
        // 4. 그림자 파티클 (회피 방향으로)
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'evade-particle';
            const angle = -0.3 + Math.random() * 0.6; // 오른쪽 방향
            particle.style.cssText = `
                left: ${centerX}px;
                top: ${centerY}px;
                --tx: ${60 + Math.random() * 40}px;
                --ty: ${(Math.random() - 0.5) * 40}px;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 400);
        }
        
        // 5. 회피 사운드
        this.playEvadeSound();
    },
    
    // 회피 사운드
    playEvadeSound() {
        try {
            // evade.mp3 재생
            const sound = new Audio('sound/evade.mp3');
            sound.volume = 0.6;
            sound.play().catch(() => {});
        } catch (e) {
            console.log('[Stealth] evade.mp3 재생 실패');
        }
    },
    
    // VFX: 게이지 가득 참
    showReadyEffect() {
        if (!this.orbElement) return;
        
        this.orbElement.classList.add('pulse-ready');
        setTimeout(() => this.orbElement.classList.remove('pulse-ready'), 500);
    },
    
    // ==========================================
    // 사운드
    // ==========================================
    playStealthSound() {
        try {
            // hide.mp3 재생
            const sound = new Audio('sound/hide.mp3');
            sound.volume = 0.7;
            sound.play().catch(() => {});
        } catch (e) {
            console.log('[Stealth] hide.mp3 재생 실패');
        }
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('stealth-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'stealth-styles';
        style.textContent = `
            /* ==========================================
               은신 오브 (Stealth Orb)
               ========================================== */
            .stealth-orb {
                position: fixed;
                bottom: 240px;
                left: 15px;
                width: 100px;
                height: 100px;
                cursor: pointer;
                z-index: 100;
                transition: transform 0.3s ease, filter 0.3s ease;
                filter: drop-shadow(0 0 15px rgba(76, 29, 149, 0.3));
            }
            
            .stealth-orb:hover {
                transform: scale(1.08);
                filter: drop-shadow(0 0 25px rgba(76, 29, 149, 0.5));
            }
            
            .stealth-orb.ready {
                cursor: pointer;
                filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.7));
                animation: stealthOrbPulse 1.5s ease-in-out infinite;
            }
            
            .stealth-orb.stealthed {
                filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.9));
            }
            
            .stealth-orb.stealthed .stealth-core {
                animation: stealthCorePulse 2s ease-in-out infinite;
            }
            
            /* 외곽 글로우 */
            .stealth-orb-glow {
                position: absolute;
                inset: -15px;
                background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
                border-radius: 50%;
                opacity: 0.3;
                transition: opacity 0.3s ease;
            }
            
            .stealth-orb.ready .stealth-orb-glow,
            .stealth-orb.stealthed .stealth-orb-glow {
                opacity: 0.7;
            }
            
            /* SVG 원형 프로그레스 */
            .stealth-progress-ring {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
            }
            
            .stealth-progress-ring .progress-bg {
                fill: none;
                stroke: rgba(30, 27, 75, 0.8);
                stroke-width: 8;
            }
            
            .stealth-progress-ring .progress-fill {
                fill: none;
                stroke: #8b5cf6;
                stroke-width: 8;
                stroke-linecap: round;
                transition: stroke-dashoffset 0.4s ease;
                filter: drop-shadow(0 0 6px #8b5cf6);
            }
            
            .stealth-orb.stealthed .progress-fill {
                stroke: #a78bfa;
            }
            
            /* 내부 구체 */
            .stealth-core {
                position: absolute;
                inset: 12px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 25%, 
                    rgba(76, 29, 149, 0.9) 0%,
                    rgba(30, 27, 75, 0.95) 50%,
                    rgba(15, 10, 30, 1) 100%);
                box-shadow: 
                    inset 0 -20px 40px rgba(0, 0, 0, 0.6),
                    inset 0 10px 20px rgba(139, 92, 246, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            
            .stealth-shadow {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 50% 100%, 
                    rgba(0, 0, 0, 0.8) 0%,
                    transparent 60%);
                animation: shadowWave 3s ease-in-out infinite;
            }
            
            .stealth-icon {
                position: relative;
                z-index: 2;
                font-size: 2.2rem;
                filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8));
            }
            
            /* 스택 표시 (큰 숫자) */
            .stealth-stacks {
                position: absolute;
                top: -12px;
                right: -8px;
                min-width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%);
                border: 3px solid #a78bfa;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 15px rgba(139, 92, 246, 0.6), 0 3px 8px rgba(0, 0, 0, 0.5);
                z-index: 10;
            }
            
            .stealth-stacks .stacks-value {
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                font-weight: 900;
                color: #fff;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            }
            
            .stealth-orb.max-stacks .stealth-stacks {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border-color: #fde68a;
                animation: maxStacksPulse 1s ease-in-out infinite;
            }
            
            .stealth-orb.max-stacks .stealth-stacks .stacks-value {
                color: #000;
            }
            
            @keyframes maxStacksPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(251, 191, 36, 0.6); }
                50% { transform: scale(1.1); box-shadow: 0 0 25px rgba(251, 191, 36, 0.9); }
            }
            
            /* 게이지 수치 (진행도) */
            .stealth-count {
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #1e1b4b 0%, #0f0a1a 100%);
                border: 2px solid #4c1d95;
                border-radius: 12px;
                padding: 2px 12px;
                font-size: 0.75rem;
                font-weight: bold;
                color: #c4b5fd;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            }
            
            .stealth-orb.stealthed .stealth-count {
                border-color: #8b5cf6;
                color: #e9d5ff;
            }
            
            /* 스택 획득 효과 */
            .stealth-orb.stack-gained {
                animation: stackGained 0.4s ease-out !important;
            }
            
            @keyframes stackGained {
                0% { transform: scale(1); }
                30% { transform: scale(1.25); filter: drop-shadow(0 0 30px rgba(139, 92, 246, 1)); }
                100% { transform: scale(1); }
            }
            
            /* 상태 텍스트 */
            .stealth-status {
                position: absolute;
                bottom: -32px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.75rem;
                font-weight: 700;
                white-space: nowrap;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .stealth-status.ready {
                opacity: 1;
                color: #a78bfa;
                animation: statusBlink 1s ease-in-out infinite;
            }
            
            .stealth-status.active {
                opacity: 1;
                color: #c4b5fd;
            }
            
            /* 툴팁 */
            .stealth-tooltip {
                position: absolute;
                left: 110px;
                top: 50%;
                transform: translateY(-50%) translateX(-10px);
                width: 180px;
                background: linear-gradient(135deg, rgba(30, 27, 75, 0.98) 0%, rgba(15, 10, 30, 0.98) 100%);
                border: 2px solid #4c1d95;
                border-radius: 10px;
                padding: 12px;
                opacity: 0;
                pointer-events: none;
                transition: all 0.25s ease;
                z-index: 1000;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
            }
            
            .stealth-tooltip.show {
                opacity: 1;
                transform: translateY(-50%) translateX(0);
            }
            
            .stealth-tooltip .tooltip-header {
                font-size: 1rem;
                font-weight: bold;
                color: #a78bfa;
                margin-bottom: 8px;
                padding-bottom: 6px;
                border-bottom: 1px solid rgba(139, 92, 246, 0.3);
            }
            
            .stealth-tooltip .tooltip-desc {
                font-size: 0.8rem;
                color: #d1d5db;
                line-height: 1.5;
                margin-bottom: 8px;
            }
            
            .stealth-tooltip .tooltip-hint {
                font-size: 0.7rem;
                color: #8b5cf6;
                font-weight: 600;
                text-align: center;
                padding-top: 6px;
                border-top: 1px solid rgba(139, 92, 246, 0.3);
            }
            
            /* 시전 애니메이션 */
            .stealth-orb.casting {
                animation: stealthCast 0.6s ease-out;
            }
            
            .stealth-orb.pulse-ready {
                animation: pulseReady 0.5s ease-out;
            }
            
            @keyframes stealthOrbPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes stealthCorePulse {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.3); }
            }
            
            @keyframes shadowWave {
                0%, 100% { transform: translateY(0); opacity: 0.8; }
                50% { transform: translateY(-10px); opacity: 0.5; }
            }
            
            @keyframes statusBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes stealthCast {
                0% { transform: scale(1); }
                30% { transform: scale(1.3); }
                60% { transform: scale(0.9); }
                100% { transform: scale(1); }
            }
            
            @keyframes pulseReady {
                0% { transform: scale(1); }
                50% { transform: scale(1.15); filter: drop-shadow(0 0 40px rgba(139, 92, 246, 1)); }
                100% { transform: scale(1); }
            }
            
            /* ==========================================
               플레이어 버프 인디케이터
               ========================================== */
            .stealth-buff-container {
                position: absolute;
                bottom: -40px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 5px;
                z-index: 50;
            }
            
            .stealth-buff-icon {
                position: relative;
                width: 36px;
                height: 36px;
                background: linear-gradient(145deg, rgba(76, 29, 149, 0.9) 0%, rgba(30, 27, 75, 0.95) 100%);
                border: 2px solid #8b5cf6;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
                animation: buffAppear 0.3s ease-out;
            }
            
            .stealth-buff-icon .buff-emoji {
                font-size: 1.3rem;
                filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
            }
            
            .stealth-buff-icon .buff-value {
                position: absolute;
                bottom: -4px;
                right: -4px;
                min-width: 18px;
                height: 18px;
                background: #8b5cf6;
                color: #fff;
                font-size: 0.7rem;
                font-weight: 900;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }
            
            @keyframes buffAppear {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                60% { transform: scale(1.2) rotate(10deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            /* ==========================================
               VFX 이펙트
               ========================================== */
            /* 스택 획득 텍스트 */
            .stealth-stack-gain {
                position: fixed;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateX(-50%);
                animation: stackGainPop 1s ease-out forwards;
                pointer-events: none;
                z-index: 1000;
            }
            
            .stealth-stack-gain .stack-text {
                font-family: 'Cinzel', serif;
                font-size: 1.4rem;
                font-weight: 900;
                color: #a78bfa;
                text-shadow: 0 0 20px rgba(139, 92, 246, 0.9), 2px 2px 0 #000;
            }
            
            .stealth-stack-gain .stack-value {
                font-size: 1rem;
                font-weight: 700;
                color: #c4b5fd;
                text-shadow: 0 0 10px rgba(196, 181, 253, 0.8);
            }
            
            @keyframes stackGainPop {
                0% { transform: translateX(-50%) scale(0); opacity: 0; }
                25% { transform: translateX(-50%) scale(1.3); opacity: 1; }
                100% { transform: translateX(-50%) scale(1) translateY(-35px); opacity: 0; }
            }
            
            /* 은신 발동 텍스트 */
            .stealth-activate-text {
                position: fixed;
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                font-weight: 900;
                color: #a78bfa;
                text-shadow: 0 0 30px rgba(139, 92, 246, 0.9), 3px 3px 0 #000;
                transform: translateX(-50%) scale(0);
                animation: stealthTextPop 1.2s ease-out forwards;
                pointer-events: none;
                z-index: 1000;
            }
            
            @keyframes stealthTextPop {
                0% { transform: translateX(-50%) scale(0); opacity: 0; }
                20% { transform: translateX(-50%) scale(1.4); opacity: 1; }
                100% { transform: translateX(-50%) scale(1) translateY(-30px); opacity: 0; }
            }
            
            /* 그림자 파티클 */
            .stealth-particle {
                position: fixed;
                width: 10px;
                height: 10px;
                background: radial-gradient(circle, #8b5cf6 0%, #4c1d95 50%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: particleFly 0.8s ease-out forwards;
                pointer-events: none;
                z-index: 1000;
            }
            
            @keyframes particleFly {
                0% { 
                    transform: translate(-50%, -50%) scale(1); 
                    opacity: 1; 
                }
                100% { 
                    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); 
                    opacity: 0; 
                }
            }
            
            /* ==========================================
               산데비스탄 스타일 은신 진입
               ========================================== */
            
            /* 은신 진입 애니메이션 (뒤로 갔다가 제자리) */
            #player.stealth-enter {
                animation: stealthEnterAnim 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            
            @keyframes stealthEnterAnim {
                0% { 
                    transform: translateX(0); 
                    filter: brightness(1);
                }
                30% { 
                    transform: translateX(-60px); 
                    filter: brightness(0.5) blur(2px);
                    opacity: 0.6;
                }
                50% {
                    transform: translateX(-80px);
                    filter: brightness(0.3) blur(4px);
                    opacity: 0.3;
                }
                70% {
                    transform: translateX(-40px);
                    filter: brightness(0.6) blur(1px);
                    opacity: 0.7;
                }
                100% { 
                    transform: translateX(0); 
                    filter: brightness(0.7) saturate(0.8);
                    opacity: 1;
                }
            }
            
            /* 잔상 효과 */
            .stealth-afterimage {
                position: fixed;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                transform: translateX(-50%);
                pointer-events: none;
                z-index: 999;
                opacity: 0.6;
                filter: brightness(0.4) saturate(0) blur(2px) hue-rotate(240deg);
                animation: afterImageFade 0.4s ease-out forwards;
            }
            
            @keyframes afterImageFade {
                0% { 
                    transform: translateX(calc(-50% + var(--offset))) scale(1);
                    opacity: 0.7;
                    filter: brightness(0.5) saturate(0) blur(1px) hue-rotate(240deg);
                }
                100% { 
                    transform: translateX(calc(-50% + var(--offset) - 30px)) scale(0.9);
                    opacity: 0;
                    filter: brightness(0.2) saturate(0) blur(6px) hue-rotate(240deg);
                }
            }
            
            /* ==========================================
               회피 (Evade) 애니메이션
               ========================================== */
            
            /* 회피 동작 - 옆으로 빠졌다가 돌아옴 */
            #player.stealth-evade {
                animation: evadeAnim 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            
            @keyframes evadeAnim {
                0% { 
                    transform: translateX(0) skewX(0deg); 
                    filter: brightness(0.7);
                }
                20% { 
                    transform: translateX(70px) skewX(-15deg); 
                    filter: brightness(0.4) blur(2px);
                    opacity: 0.5;
                }
                40% {
                    transform: translateX(90px) skewX(-20deg);
                    filter: brightness(0.3) blur(3px);
                    opacity: 0.3;
                }
                60% {
                    transform: translateX(50px) skewX(-10deg);
                    filter: brightness(0.5) blur(1px);
                    opacity: 0.6;
                }
                80% {
                    transform: translateX(20px) skewX(-5deg);
                    filter: brightness(0.6);
                    opacity: 0.8;
                }
                100% { 
                    transform: translateX(0) skewX(0deg); 
                    filter: brightness(0.7) saturate(0.8);
                    opacity: 1;
                }
            }
            
            /* 회피 잔상 */
            .evade-afterimage {
                position: fixed;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                transform: translateX(-50%);
                pointer-events: none;
                z-index: 999;
                animation: evadeAfterFade 0.35s ease-out forwards;
            }
            
            @keyframes evadeAfterFade {
                0% { 
                    transform: translateX(calc(-50% + var(--offset))) scale(1) skewX(-15deg);
                    opacity: 0.7;
                    filter: brightness(0.5) saturate(0) blur(1px) hue-rotate(240deg);
                }
                100% { 
                    transform: translateX(calc(-50% + var(--offset) + 20px)) scale(0.95) skewX(-5deg);
                    opacity: 0;
                    filter: brightness(0.2) saturate(0) blur(4px) hue-rotate(240deg);
                }
            }
            
            /* 빗겨가는 EVADE 텍스트 */
            .stealth-miss-text {
                position: fixed;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateX(-50%);
                pointer-events: none;
                z-index: 1000;
                animation: missTextSlide 1s ease-out forwards;
            }
            
            .stealth-miss-text .miss-label {
                font-family: 'Cinzel', serif;
                font-size: 1.6rem;
                font-weight: 900;
                color: #a78bfa;
                text-shadow: 
                    0 0 20px rgba(139, 92, 246, 1),
                    0 0 40px rgba(139, 92, 246, 0.6),
                    2px 2px 0 #000;
                letter-spacing: 3px;
            }
            
            .stealth-miss-text .miss-amount {
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                font-weight: 700;
                color: #c4b5fd;
                text-shadow: 0 0 10px rgba(196, 181, 253, 0.8), 1px 1px 0 #000;
            }
            
            @keyframes missTextSlide {
                0% { 
                    transform: translateX(-30px) rotate(-10deg) scale(0.5); 
                    opacity: 0;
                }
                20% {
                    transform: translateX(0) rotate(5deg) scale(1.2);
                    opacity: 1;
                }
                40% {
                    transform: translateX(10px) rotate(-2deg) scale(1);
                }
                100% { 
                    transform: translateX(60px) rotate(0deg) translateY(-30px) scale(0.9); 
                    opacity: 0;
                }
            }
            
            /* 회피 파티클 */
            .evade-particle {
                position: fixed;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #c4b5fd 0%, #8b5cf6 40%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 998;
                animation: evadeParticleFly 0.4s ease-out forwards;
            }
            
            @keyframes evadeParticleFly {
                0% { 
                    transform: translate(-50%, -50%) scale(1.5); 
                    opacity: 1;
                }
                100% { 
                    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); 
                    opacity: 0;
                }
            }
            
            /* 플레이어 은신 상태 */
            #player.stealthed {
                filter: brightness(0.7) saturate(0.8);
            }
            
            #player.stealthed .stealth-aura {
                position: absolute;
                inset: -20px;
                background: radial-gradient(ellipse at center bottom, 
                    rgba(76, 29, 149, 0.6) 0%,
                    rgba(139, 92, 246, 0.3) 30%,
                    transparent 70%);
                border-radius: 50%;
                animation: auraFloat 2s ease-in-out infinite;
                pointer-events: none;
                z-index: -1;
            }
            
            @keyframes auraFloat {
                0%, 100% { transform: scaleY(1); opacity: 0.8; }
                50% { transform: scaleY(1.1); opacity: 0.5; }
            }
            
            /* 기습 텍스트 */
            .stealth-ambush-text {
                position: fixed;
                font-family: 'Cinzel', serif;
                font-size: 1.8rem;
                font-weight: bold;
                color: #fbbf24;
                text-shadow: 0 0 25px rgba(251, 191, 36, 0.9), 3px 3px 0 #000;
                transform: translateX(-50%) scale(0);
                animation: ambushPop 1s ease-out forwards;
                pointer-events: none;
                z-index: 1000;
            }
            
            @keyframes ambushPop {
                0% { transform: translateX(-50%) scale(0); opacity: 0; }
                25% { transform: translateX(-50%) scale(1.5); opacity: 1; }
                100% { transform: translateX(-50%) scale(1) translateY(-25px); opacity: 0; }
            }
            
            /* 플레이어 이펙트 */
            #player.stealth-break {
                animation: stealthBreakAnim 0.4s ease-out;
            }
            
            @keyframes stealthBreakAnim {
                0% { filter: brightness(1); }
                20% { filter: brightness(2.5) saturate(2) hue-rotate(30deg); }
                100% { filter: brightness(1); }
            }
            
            /* 은신 해제 파티클 */
            .stealth-break-particle {
                position: fixed;
                width: 12px;
                height: 12px;
                background: radial-gradient(circle, #fbbf24 0%, #a78bfa 40%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: breakParticleFly 0.5s ease-out forwards;
                pointer-events: none;
                z-index: 1000;
            }
            
            @keyframes breakParticleFly {
                0% { 
                    transform: translate(-50%, -50%) scale(1.5); 
                    opacity: 1; 
                }
                100% { 
                    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); 
                    opacity: 0; 
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 등록
window.StealthSystem = StealthSystem;

console.log('[StealthSystem] 도적 은신 시스템 로드 완료');
