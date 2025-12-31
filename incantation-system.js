// ==========================================
// 주문 영창 시스템 (Incantation System)
// 마법사 전용 - 마력을 축적하여 수동으로 대마법 시전
// ==========================================

const IncantationSystem = {
    // 현재 영창 스택
    stacks: 0,
    maxStacks: 15,  // 10 → 15 (메테오 요구량에 맞춤)
    
    // 활성화 상태
    isActive: false,
    
    // UI 요소
    gaugeElement: null,
    orbElement: null,
    
    // 단계별 마법 (수동 시전) - 영창 요구량 상향 너프
    spells: {
        4: {  // 3 → 4
            id: 'arcaneWave',
            name: '마력 파동',
            cost: 4,
            damage: 5,
            effect: 'wave',
            color: '#60a5fa',
            description: '전체 5 데미지',
            icon: 'spell_wave.png'
        },
        7: {  // 5 → 7
            id: 'flameBurst',
            name: '화염 작렬',
            cost: 7,
            damage: 12,
            effect: 'fire',
            color: '#f97316',
            description: '전체 12 데미지 + 화상',
            burn: 2,
            icon: 'spell_fire.png'
        },
        11: {  // 7 → 11
            id: 'frostNova',
            name: '절대영도',
            cost: 11,
            damage: 18,
            effect: 'ice',
            color: '#22d3ee',
            description: '전체 18 데미지 + 빙결',
            freeze: true,
            icon: 'spell_ice.png'
        },
        15: {  // 10 → 15
            id: 'meteor',
            name: '메테오',
            cost: 15,
            damage: 30,  // 35 → 30 데미지도 살짝 너프
            effect: 'meteor',
            color: '#ef4444',
            description: '전체 30 데미지!',
            icon: 'spell_meteor.png'
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.stacks = 0;
        this.isActive = false;
        this.removeUI();
        console.log('[Incantation] 시스템 초기화');
    },
    
    // 시스템 활성화
    activate() {
        if (this.isActive) {
            console.log('[Incantation] 이미 활성화됨');
            return;
        }
        
        console.log('[Incantation] 영창 시스템 활성화');
        
        this.isActive = true;
        this.stacks = 0;
        
        this.createGaugeUI();
        this.createOrbUI();
        this.updateUI();
        
        console.log('[Incantation] ✅ 활성화 완료');
    },
    
    // 시스템 비활성화
    deactivate() {
        this.isActive = false;
        this.stacks = 0;
        this.removeUI();
        console.log('[Incantation] 영창 시스템 비활성화');
    },
    
    // ==========================================
    // 영창 스택 관리
    // ==========================================
    
    // [영창] 카드 사용 시 자동 호출
    onCardPlayed(card) {
        if (!card || !card.isIncantation) return;
        
        // 마법사가 아니면 무시
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob !== 'mage') {
            return;
        }
        
        // 기본 1 + 보너스
        const baseAmount = 1;
        const bonusAmount = card.incantationBonus || 0;
        const totalAmount = baseAmount + bonusAmount;
        
        this.addStacks(totalAmount);
        
        // 영창 획득 로그
        if (typeof addLog === 'function') {
            addLog(`🔮 [영창] +${totalAmount}`, 'buff');
        }
    },
    
    addStacks(amount) {
        // 비활성 상태면 자동 활성화 시도
        if (!this.isActive) {
            if (typeof JobSystem !== 'undefined' && JobSystem.currentJob === 'mage') {
                this.activate();
            } else {
                return 0;
            }
        }
        
        const oldStacks = this.stacks;
        this.stacks = Math.min(this.maxStacks, this.stacks + amount);
        
        console.log(`[Incantation] 영창 +${amount} (${oldStacks} → ${this.stacks})`);
        
        this.updateUI();
        this.showStackGainEffect(amount);
        
        return this.stacks;
    },
    
    getStacks() {
        return this.stacks;
    },
    
    // 현재 사용 가능한 최고 마법 가져오기
    getAvailableSpell() {
        const levels = [15, 11, 7, 4];  // 변경된 영창 요구량
        for (const level of levels) {
            if (this.stacks >= level) {
                return { level, spell: this.spells[level] };
            }
        }
        return null;
    },
    
    // ==========================================
    // 마법 시전 (수동) - SpellVFX 연동
    // ==========================================
    castSpell() {
        const available = this.getAvailableSpell();
        if (!available) {
            console.log('[Incantation] 사용 가능한 마법 없음');
            return false;
        }
        
        const { level, spell } = available;
        
        console.log(`[Incantation] 마법 시전: ${spell.name} (영창 ${level} 소모)`);
        
        // 영창 소모
        this.stacks -= level;
        this.updateUI();
        
        // 오브 시전 효과
        if (this.orbElement) {
            this.orbElement.classList.add('casting');
            setTimeout(() => this.orbElement.classList.remove('casting'), 500);
        }
        
        // 플레이어 위치
        const playerEl = document.getElementById('player');
        const playerRect = playerEl ? playerEl.getBoundingClientRect() : null;
        const px = playerRect ? playerRect.left + playerRect.width / 2 : window.innerWidth / 2;
        const py = playerRect ? playerRect.top + playerRect.height / 2 : window.innerHeight / 2;
        
        // 타겟 수집
        const targets = this.collectTargets();
        
        // SpellVFX 사용 (다크소울 스타일 캐스팅)
        if (typeof SpellVFX !== 'undefined') {
            SpellVFX.castingAnimation(px, py, spell, () => {
                // 캐스팅 완료 후 마법별 VFX
                switch (spell.effect) {
                    case 'wave':
                        SpellVFX.arcaneWave(targets);
                        break;
                    case 'fire':
                        SpellVFX.flameBurst(targets);
                        break;
                    case 'ice':
                        SpellVFX.frostNova(targets);
                        break;
                    case 'meteor':
                        SpellVFX.meteorStrike(targets);
                        break;
                }
                
                // 데미지 적용 (마법 VFX 완료 후)
                // meteor: 폭발 타이밍 2200ms에 맞춤
                // fire/ice: 약간의 여유
                // wave: 바로
                let damageDelay;
                switch (spell.effect) {
                    case 'meteor': damageDelay = 2200; break;
                    case 'fire': damageDelay = 400; break;
                    case 'ice': damageDelay = 400; break;
                    default: damageDelay = 200;
                }
                setTimeout(() => {
                    this.applySpellDamage(spell);
                }, damageDelay);
            });
        } else {
            // SpellVFX 없으면 기본 연출
            this.showSpellCastAnimation(spell);
            const delay = spell.effect === 'meteor' ? 1500 : 600;
            setTimeout(() => {
                this.applySpellDamage(spell);
            }, delay);
        }
        
        // 알림
        this.showSpellNotification(spell);
        
        return true;
    },
    
    // 타겟 수집 (적 위치 정보)
    collectTargets() {
        const targets = [];
        
        if (typeof gameState !== 'undefined') {
            if (gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, index) => {
                    if (enemy.hp > 0) {
                        const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            targets.push({
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height / 2,
                                enemy,
                                element: el
                            });
                        }
                    }
                });
            } else if (gameState.enemy && gameState.enemy.hp > 0) {
                const el = document.getElementById('enemy');
                if (el) {
                    const rect = el.getBoundingClientRect();
                    targets.push({
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        enemy: gameState.enemy,
                        element: el
                    });
                }
            }
        }
        
        return targets;
    },
    
    // 마법 데미지 적용 (dealDamage 사용으로 오버킬/고어 시스템 연동)
    applySpellDamage(spell) {
        if (typeof gameState === 'undefined') return;
        
        // 가상 마법 카드 생성 (유물 보너스 등 적용을 위해)
        const magicCard = {
            id: spell.id || 'incantation_spell',
            name: spell.name,
            type: 'attack',
            isMagic: true,
            isAllEnemy: true
        };
        
        // 전체 적에게 데미지
        if (gameState.enemies && gameState.enemies.length > 0) {
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0 || enemy._overkillDamage !== undefined) {
                    const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                    
                    // ⚡ dealDamage 사용 (오버킬, 유물 보너스, 고어 시스템 연동)
                    if (typeof dealDamage === 'function') {
                        const result = dealDamage(enemy, spell.damage, magicCard);
                        
                        // 마법 히트 이펙트
                        if (typeof HitEffects !== 'undefined' && enemyEl) {
                            if (spell.damage >= 25) {
                                HitEffects.criticalHit(enemyEl, spell.damage);
                            } else if (spell.damage >= 10) {
                                HitEffects.heavyHit(enemyEl, spell.damage);
                            } else {
                                HitEffects.normalHit(enemyEl, spell.damage);
                            }
                        }
                        
                        console.log(`[Incantation] ${spell.name} → ${enemy.name || 'Enemy'}: ${spell.damage} dmg (실제: ${result?.actualDamage || spell.damage})`);
                    } else {
                        // dealDamage 없으면 폴백
                        enemy.hp = Math.max(0, enemy.hp - spell.damage);
                        
                        if (typeof showDamagePopup === 'function' && enemyEl) {
                            showDamagePopup(enemyEl, spell.damage, 'magic');
                        }
                    }
                    
                    // 상태이상 적용
                    if (spell.burn) {
                        enemy.burn = (enemy.burn || 0) + spell.burn;
                    }
                    if (spell.freeze) {
                        enemy.stunned = true;
                    }
                }
            });
            
            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
            
            // 적 처치 체크 (오버킬/고어 시스템 포함)
            setTimeout(() => {
                if (typeof checkEnemyDefeated === 'function') {
                    checkEnemyDefeated();
                }
            }, 300);
            
        } else if (gameState.enemy && gameState.enemy.hp > 0) {
            const enemyEl = document.getElementById('enemy');
            
            // ⚡ dealDamage 사용
            if (typeof dealDamage === 'function') {
                dealDamage(gameState.enemy, spell.damage, magicCard);
            } else {
                gameState.enemy.hp = Math.max(0, gameState.enemy.hp - spell.damage);
                
                if (typeof showDamagePopup === 'function' && enemyEl) {
                    showDamagePopup(enemyEl, spell.damage, 'magic');
                }
            }
            
            if (spell.burn) {
                gameState.enemy.burn = (gameState.enemy.burn || 0) + spell.burn;
            }
            if (spell.freeze) {
                gameState.enemy.stunned = true;
            }
            
            if (typeof updateUI === 'function') updateUI();
        }
        
        if (typeof addLog === 'function') {
            addLog(`✦ ${spell.name}! ${spell.description}`, 'magic');
        }
    },
    
    // ==========================================
    // 턴 관리
    // ==========================================
    onTurnStart() {
        // 턴 시작 시 처리
    },
    
    onTurnEnd() {
        // 턴 종료 시 처리
    },
    
    onBattleEnd() {
        this.stacks = 0;
        this.updateUI();
    },
    
    // ==========================================
    // UI: 통합 마력구 (원형 프로그레스 + 마법 버튼)
    // ==========================================
    createGaugeUI() {
        // 게이지는 마력구에 통합됨
        this.injectStyles();
    },
    
    createOrbUI() {
        if (this.orbElement) return;
        
        const orb = document.createElement('div');
        orb.id = 'mana-orb';
        orb.className = 'mana-orb';
        
        // SVG 원형 프로그레스 바 (시계방향)
        const circumference = 2 * Math.PI * 54; // radius 54
        
        orb.innerHTML = `
            <div class="mana-orb-glow"></div>
            
            <!-- 원형 프로그레스 SVG -->
            <svg class="mana-progress-ring" viewBox="0 0 120 120">
                <!-- 배경 원 -->
                <circle class="progress-bg" cx="60" cy="60" r="54" />
                <!-- 단계별 마커 (4/7/11/15) -->
                <g class="progress-markers">
                    <circle class="marker marker-4" cx="100" cy="15" r="4" />
                    <circle class="marker marker-7" cx="114" cy="75" r="4" />
                    <circle class="marker marker-11" cx="35" cy="110" r="4" />
                    <circle class="marker marker-15" cx="6" cy="45" r="5" />
                </g>
                <!-- 프로그레스 원 (시계방향) -->
                <circle class="progress-fill" cx="60" cy="60" r="54" 
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${circumference}"
                    transform="rotate(-90 60 60)" />
            </svg>
            
            <!-- 내부 구체 -->
            <div class="mana-core">
                <div class="mana-liquid"></div>
                <div class="mana-shine"></div>
                <div class="mana-icon"></div>
            </div>
            
            <!-- 영창 수치 -->
            <div class="mana-count">
                <span class="current">0</span>
            </div>
            
            <!-- 마법 이름 -->
            <div class="mana-spell-name"></div>
            
            <!-- 툴팁 -->
            <div class="mana-tooltip">
                <div class="tooltip-header">
                    <span class="tooltip-icon"></span>
                    <span class="tooltip-name"></span>
                </div>
                <div class="tooltip-cost"></div>
                <div class="tooltip-desc"></div>
                <div class="tooltip-hint">클릭하여 시전</div>
            </div>
        `;
        
        // 클릭으로 마법 시전
        orb.addEventListener('click', () => {
            if (this.getAvailableSpell()) {
                this.castSpell();
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
        const tooltip = this.orbElement.querySelector('.mana-tooltip');
        if (tooltip) tooltip.classList.add('show');
    },
    
    hideTooltip() {
        if (!this.orbElement) return;
        const tooltip = this.orbElement.querySelector('.mana-tooltip');
        if (tooltip) tooltip.classList.remove('show');
    },
    
    removeUI() {
        if (this.gaugeElement) {
            this.gaugeElement.remove();
            this.gaugeElement = null;
        }
        if (this.orbElement) {
            this.orbElement.remove();
            this.orbElement = null;
        }
    },
    
    updateUI() {
        this.updateManaOrb();
    },
    
    updateGauge() {
        // 마력구에 통합됨
    },
    
    updateOrb() {
        // 마력구에 통합됨
    },
    
    updateManaOrb() {
        if (!this.orbElement) return;
        
        const circumference = 2 * Math.PI * 54;
        const percent = this.stacks / this.maxStacks;
        const offset = circumference * (1 - percent);
        
        // 프로그레스 바 업데이트 (시계방향)
        const progressFill = this.orbElement.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.strokeDashoffset = offset;
            
            // 색상 변화
            let color = '#6366f1';
            if (this.stacks >= 10) color = '#ef4444';
            else if (this.stacks >= 7) color = '#22d3ee';
            else if (this.stacks >= 5) color = '#f97316';
            else if (this.stacks >= 3) color = '#8b5cf6';
            
            progressFill.style.stroke = color;
        }
        
        // 마커 업데이트
        const markers = this.orbElement.querySelectorAll('.progress-markers .marker');
        const thresholds = [4, 7, 11, 15];  // 변경된 영창 요구량
        markers.forEach((marker, i) => {
            if (this.stacks >= thresholds[i]) {
                marker.classList.add('reached');
            } else {
                marker.classList.remove('reached');
            }
        });
        
        // 영창 수치
        const countEl = this.orbElement.querySelector('.mana-count .current');
        if (countEl) countEl.textContent = this.stacks;
        
        // 마력구 내부 액체 높이
        const liquid = this.orbElement.querySelector('.mana-liquid');
        if (liquid) {
            liquid.style.height = `${percent * 100}%`;
        }
        
        // 사용 가능한 마법
        const available = this.getAvailableSpell();
        
        if (available) {
            const { level, spell } = available;
            
            this.orbElement.classList.add('active');
            this.orbElement.style.setProperty('--spell-color', spell.color);
            
            // 아이콘
            const icon = this.orbElement.querySelector('.mana-icon');
            if (icon) icon.innerHTML = this.getSpellIcon(spell);
            
            // 마법 이름
            const name = this.orbElement.querySelector('.mana-spell-name');
            if (name) name.textContent = spell.name;
            
            // 툴팁 업데이트
            this.updateTooltip(spell, level);
            
        } else {
            this.orbElement.classList.remove('active');
            this.orbElement.style.setProperty('--spell-color', '#4a4a6a');
            
            const icon = this.orbElement.querySelector('.mana-icon');
            if (icon) icon.innerHTML = '';
            
            const name = this.orbElement.querySelector('.mana-spell-name');
            if (name) name.textContent = '';
            
            // 다음 마법 정보
            this.updateTooltipNext();
        }
    },
    
    updateTooltip(spell, level) {
        if (!this.orbElement) return;
        
        const tooltip = this.orbElement.querySelector('.mana-tooltip');
        if (!tooltip) return;
        
        const iconEl = tooltip.querySelector('.tooltip-icon');
        const nameEl = tooltip.querySelector('.tooltip-name');
        const costEl = tooltip.querySelector('.tooltip-cost');
        const descEl = tooltip.querySelector('.tooltip-desc');
        const hintEl = tooltip.querySelector('.tooltip-hint');
        
        if (iconEl) iconEl.innerHTML = this.getSpellIcon(spell);
        if (nameEl) nameEl.textContent = spell.name;
        if (costEl) costEl.innerHTML = `영창 <span style="color:${spell.color}">${level}</span> 소모`;
        if (descEl) descEl.textContent = spell.description;
        if (hintEl) {
            hintEl.textContent = '클릭하여 시전';
            hintEl.style.color = spell.color;
        }
        
        tooltip.style.borderColor = spell.color;
    },
    
    updateTooltipNext() {
        if (!this.orbElement) return;
        
        const tooltip = this.orbElement.querySelector('.mana-tooltip');
        if (!tooltip) return;
        
        // 다음 사용 가능한 마법 찾기
        const nextSpell = this.getNextSpell();
        
        const iconEl = tooltip.querySelector('.tooltip-icon');
        const nameEl = tooltip.querySelector('.tooltip-name');
        const costEl = tooltip.querySelector('.tooltip-cost');
        const descEl = tooltip.querySelector('.tooltip-desc');
        const hintEl = tooltip.querySelector('.tooltip-hint');
        
        if (nextSpell) {
            if (iconEl) iconEl.innerHTML = this.getSpellIcon(nextSpell.spell);
            if (nameEl) nameEl.textContent = nextSpell.spell.name;
            if (costEl) costEl.innerHTML = `필요 영창: ${nextSpell.level} (현재: ${this.stacks})`;
            if (descEl) descEl.textContent = nextSpell.spell.description;
            if (hintEl) {
                hintEl.textContent = `${nextSpell.level - this.stacks} 더 필요`;
                hintEl.style.color = '#888';
            }
            tooltip.style.borderColor = '#4a4a6a';
        } else {
            if (iconEl) iconEl.innerHTML = '🔮';
            if (nameEl) nameEl.textContent = '마력 축적 중';
            if (costEl) costEl.textContent = `영창: ${this.stacks} / ${this.maxStacks}`;
            if (descEl) descEl.textContent = '카드를 사용하여 영창을 축적하세요';
            if (hintEl) {
                hintEl.textContent = '다음: 마력 파동 (3)';
                hintEl.style.color = '#888';
            }
            tooltip.style.borderColor = '#4a4a6a';
        }
    },
    
    getNextSpell() {
        const levels = [4, 7, 11, 15];  // 변경된 영창 요구량
        for (const level of levels) {
            if (this.stacks < level && this.spells[level]) {
                return { level, spell: this.spells[level] };
            }
        }
        return null;
    },
    
    getSpellIcon(spell) {
        // spell.icon이 있으면 이미지 사용
        if (spell.icon) {
            return `<img src="${spell.icon}" alt="${spell.name}" class="spell-icon-img" onerror="this.outerHTML='✦'">`;
        }
        
        // 폴백: SVG 아이콘
        const icons = {
            'arcaneWave': '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2"/></svg>',
            'flameBurst': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 4-6 8-6 11a6 6 0 1012 0c0-3-2-7-6-11z"/></svg>',
            'frostNova': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2"/></svg>',
            'meteor': '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"/></svg>'
        };
        return icons[spell.id] || '✦';
    },
    
    // ==========================================
    // 이펙트
    // ==========================================
    showStackGainEffect(amount) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        
        // 부유 텍스트
        const floater = document.createElement('div');
        floater.className = 'incant-floater';
        floater.textContent = `+${amount}`;
        floater.style.left = `${rect.left + rect.width / 2}px`;
        floater.style.top = `${rect.top}px`;
        document.body.appendChild(floater);
        
        setTimeout(() => floater.remove(), 800);
        
        // VFX
        if (typeof VFX !== 'undefined') {
            VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                color: '#8b5cf6',
                count: 3 + amount * 2,
                speed: 80
            });
        }
    },
    
    showSpellCastAnimation(spell) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 오브 시전 효과
        if (this.orbElement) {
            this.orbElement.classList.add('casting');
            setTimeout(() => this.orbElement.classList.remove('casting'), 500);
        }
        
        // 마법별 연출
        switch (spell.effect) {
            case 'meteor':
                this.showMeteorEffect();
                break;
            case 'ice':
                this.showIceEffect(centerX, centerY, spell.color);
                break;
            case 'fire':
                this.showFireEffect(centerX, centerY, spell.color);
                break;
            default:
                this.showWaveEffect(centerX, centerY, spell.color);
        }
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            const intensity = spell.damage >= 25 ? 15 : spell.damage >= 10 ? 10 : 5;
            EffectSystem.screenShake(intensity, 300);
        }
        
        // 알림
        this.showSpellNotification(spell);
    },
    
    showMeteorEffect() {
        // 화면 어둡게
        const overlay = document.createElement('div');
        overlay.className = 'meteor-overlay';
        document.body.appendChild(overlay);
        
        // 메테오 낙하
        setTimeout(() => {
            const meteor = document.createElement('div');
            meteor.className = 'meteor-fall';
            document.body.appendChild(meteor);
            
            setTimeout(() => {
                meteor.remove();
                
                if (typeof VFX !== 'undefined') {
                    const cx = window.innerWidth / 2;
                    const cy = window.innerHeight / 2;
                    VFX.shockwave(cx, cy, { color: '#ef4444', size: 500, duration: 600 });
                    VFX.sparks(cx, cy, { color: '#fbbf24', count: 40, speed: 400 });
                }
                
                // 플래시
                const flash = document.createElement('div');
                flash.className = 'screen-flash';
                document.body.appendChild(flash);
                setTimeout(() => flash.remove(), 150);
                
                overlay.remove();
            }, 500);
        }, 400);
    },
    
    showIceEffect(x, y, color) {
        if (typeof VFX !== 'undefined') {
            VFX.shockwave(x, y, { color, size: 350, duration: 500 });
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const angle = (i / 6) * Math.PI * 2;
                    VFX.sparks(x + Math.cos(angle) * 100, y + Math.sin(angle) * 100, {
                        color: '#67e8f9',
                        count: 8,
                        speed: 120
                    });
                }, i * 40);
            }
        }
    },
    
    showFireEffect(x, y, color) {
        if (typeof VFX !== 'undefined') {
            VFX.shockwave(x, y, { color, size: 280, duration: 400 });
            VFX.sparks(x, y, { color: '#fbbf24', count: 25, speed: 200 });
        }
    },
    
    showWaveEffect(x, y, color) {
        if (typeof VFX !== 'undefined') {
            VFX.shockwave(x, y, { color, size: 200, duration: 350 });
            VFX.sparks(x, y, { color, count: 15, speed: 150 });
        }
    },
    
    showSpellNotification(spell) {
        const notif = document.createElement('div');
        notif.className = 'spell-notif';
        notif.innerHTML = `
            <span class="spell-notif-name" style="color: ${spell.color}">${spell.name}</span>
        `;
        document.body.appendChild(notif);
        
        requestAnimationFrame(() => notif.classList.add('show'));
        
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 1500);
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('incantation-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'incantation-styles';
        style.textContent = `
            /* ==========================================
               통합 마력구 (Mana Orb)
               ========================================== */
            .mana-orb {
                position: fixed;
                bottom: 240px;
                left: 15px;
                width: 130px;
                height: 130px;
                cursor: pointer;
                z-index: 100;
                transition: transform 0.3s ease, filter 0.3s ease;
                --spell-color: #6366f1;
                filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
            }
            
            .mana-orb:hover {
                transform: scale(1.08);
                filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.6));
            }
            
            .mana-orb.active {
                cursor: pointer;
                filter: drop-shadow(0 0 25px var(--spell-color));
            }
            
            .mana-orb.active:hover {
                transform: scale(1.12);
                filter: drop-shadow(0 0 40px var(--spell-color));
            }
            
            /* 외곽 글로우 */
            .mana-orb-glow {
                position: absolute;
                inset: -20px;
                background: radial-gradient(circle, var(--spell-color) 0%, transparent 70%);
                border-radius: 50%;
                opacity: 0.4;
                transition: opacity 0.3s ease;
                animation: manaGlowPulse 3s ease-in-out infinite;
            }
            
            .mana-orb.active .mana-orb-glow {
                opacity: 0.7;
            }
            
            /* SVG 원형 프로그레스 */
            .mana-progress-ring {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                transform: scaleX(-1); /* 시계방향으로 반전 */
            }
            
            .progress-bg {
                fill: none;
                stroke: rgba(30, 30, 50, 0.8);
                stroke-width: 8;
            }
            
            .progress-fill {
                fill: none;
                stroke: var(--spell-color);
                stroke-width: 8;
                stroke-linecap: round;
                transition: stroke-dashoffset 0.4s ease, stroke 0.3s ease;
                filter: drop-shadow(0 0 6px var(--spell-color));
            }
            
            /* 단계 마커 */
            .progress-markers .marker {
                fill: #2a2a3a;
                stroke: #4a4a5a;
                stroke-width: 1;
                transition: all 0.3s ease;
            }
            
            .progress-markers .marker.reached {
                fill: var(--spell-color);
                stroke: #fff;
                filter: drop-shadow(0 0 4px var(--spell-color));
            }
            
            /* 내부 구체 (마력구 본체) */
            .mana-core {
                position: absolute;
                inset: 15px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 25%, 
                    rgba(60, 60, 100, 0.9) 0%,
                    rgba(20, 20, 40, 0.95) 50%,
                    rgba(10, 10, 25, 1) 100%);
                box-shadow: 
                    inset 0 -25px 50px rgba(0, 0, 0, 0.6),
                    inset 0 15px 25px rgba(255, 255, 255, 0.05),
                    0 0 40px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* 마력 액체 */
            .mana-liquid {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 0%;
                background: linear-gradient(to top, 
                    var(--spell-color) 0%,
                    rgba(99, 102, 241, 0.5) 50%,
                    transparent 100%);
                transition: height 0.5s ease;
                animation: liquidWave 2s ease-in-out infinite;
            }
            
            /* 반짝임 효과 */
            .mana-shine {
                position: absolute;
                top: 8px;
                left: 15px;
                width: 20px;
                height: 12px;
                background: radial-gradient(ellipse, 
                    rgba(255, 255, 255, 0.6) 0%, 
                    transparent 70%);
                border-radius: 50%;
            }
            
            /* 마법 아이콘 */
            .mana-icon {
                position: relative;
                z-index: 2;
                width: 64px;
                height: 64px;
                color: #fff;
                filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
                transition: transform 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: visible;
            }
            
            .mana-orb.active .mana-icon {
                animation: iconFloat 2s ease-in-out infinite;
            }
            
            .mana-icon svg {
                width: 100%;
                height: 100%;
            }
            
            .mana-icon .spell-icon-img {
                width: 140%;
                height: 140%;
                object-fit: contain;
                image-rendering: pixelated;
                opacity: 0.85;
                margin: -20%;
            }
            
            /* 영창 수치 */
            .mana-count {
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                border: 2px solid var(--spell-color);
                border-radius: 14px;
                padding: 3px 14px;
                font-size: 0.9rem;
                font-weight: bold;
                color: #fff;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            }
            
            /* 마법 이름 */
            .mana-spell-name {
                position: absolute;
                bottom: -32px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.85rem;
                font-weight: 700;
                color: var(--spell-color);
                white-space: nowrap;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
                opacity: 0;
                transition: opacity 0.3s ease;
                letter-spacing: 0.5px;
            }
            
            .mana-orb.active .mana-spell-name {
                opacity: 1;
            }
            
            /* 툴팁 */
            .mana-tooltip {
                position: absolute;
                left: 140px;
                top: 50%;
                transform: translateY(-50%) translateX(-10px);
                width: 200px;
                background: linear-gradient(135deg, rgba(20, 20, 35, 0.98) 0%, rgba(10, 10, 20, 0.98) 100%);
                border: 2px solid #4a4a6a;
                border-radius: 10px;
                padding: 12px;
                opacity: 0;
                pointer-events: none;
                transition: all 0.25s ease;
                z-index: 1000;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
            }
            
            .mana-tooltip.show {
                opacity: 1;
                transform: translateY(-50%) translateX(0);
            }
            
            .tooltip-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding-bottom: 6px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .tooltip-icon {
                width: 24px;
                height: 24px;
                color: var(--spell-color);
            }
            
            .tooltip-icon svg {
                width: 100%;
                height: 100%;
            }
            
            .tooltip-icon .spell-icon-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
            }
            
            .tooltip-name {
                font-size: 0.9rem;
                font-weight: bold;
                color: #fff;
            }
            
            .tooltip-cost {
                font-size: 0.75rem;
                color: #a0a0b0;
                margin-bottom: 6px;
            }
            
            .tooltip-desc {
                font-size: 0.8rem;
                color: #d0d0e0;
                line-height: 1.4;
                margin-bottom: 8px;
            }
            
            .tooltip-hint {
                font-size: 0.7rem;
                color: var(--spell-color);
                font-weight: 600;
                text-align: center;
                padding-top: 6px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            /* 시전 애니메이션 */
            .mana-orb.casting {
                animation: manaCast 0.8s ease-out;
            }
            
            .mana-orb.casting .mana-core {
                animation: coreCast 0.5s ease-out;
            }
            
            .mana-orb.casting .mana-orb-glow {
                animation: glowCast 0.6s ease-out;
            }
            
            @keyframes manaGlowPulse {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.05); opacity: 0.5; }
            }
            
            @keyframes liquidWave {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            
            @keyframes iconFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            
            @keyframes manaCast {
                0% { transform: scale(1); }
                20% { transform: scale(1.25); }
                50% { transform: scale(0.9); }
                70% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            @keyframes coreCast {
                0% { filter: brightness(1); }
                30% { filter: brightness(2.5) saturate(2); }
                100% { filter: brightness(1); }
            }
            
            @keyframes glowCast {
                0% { opacity: 0.3; transform: scale(1); }
                30% { opacity: 1; transform: scale(1.5); }
                100% { opacity: 0.3; transform: scale(1); }
            }
            
            /* ==========================================
               이펙트
               ========================================== */
            .incant-floater {
                position: fixed;
                font-size: 1rem;
                font-weight: bold;
                color: #c4b5fd;
                text-shadow: 0 0 10px #8b5cf6;
                transform: translateX(-50%);
                animation: floatUp 0.8s ease-out forwards;
                pointer-events: none;
                z-index: 1000;
            }
            
            @keyframes floatUp {
                0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-40px); }
            }
            
            .spell-notif {
                position: fixed;
                top: 40%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                padding: 12px 30px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 8px;
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 2000;
            }
            
            .spell-notif.show {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .spell-notif-name {
                font-family: 'Cinzel', serif;
                font-size: 1.8rem;
                font-weight: bold;
                text-shadow: 0 0 20px currentColor;
            }
            
            /* 메테오 연출 */
            .meteor-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                z-index: 1500;
                animation: fadeIn 0.4s ease;
            }
            
            .meteor-fall {
                position: fixed;
                top: -150px;
                left: 50%;
                width: 120px;
                height: 120px;
                background: radial-gradient(circle, #fbbf24 0%, #ef4444 50%, #7f1d1d 100%);
                border-radius: 50%;
                transform: translateX(-50%);
                animation: meteorDrop 0.5s ease-in forwards;
                box-shadow: 0 0 60px #ef4444, 0 0 100px #fbbf24;
                z-index: 1600;
            }
            
            @keyframes meteorDrop {
                0% { top: -150px; transform: translateX(-50%) scale(0.5); }
                100% { top: 45%; transform: translateX(-50%) scale(1.5); }
            }
            
            .screen-flash {
                position: fixed;
                inset: 0;
                background: rgba(255, 200, 100, 0.5);
                z-index: 1700;
                animation: flashOut 0.15s ease-out forwards;
            }
            
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            
            @keyframes flashOut {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 등록
window.IncantationSystem = IncantationSystem;

console.log('[IncantationSystem] 주문 영창 시스템 로드 완료');
