// ==========================================
// Shadow Deck - 에너지 볼트 시스템
// ==========================================

const EnergyBoltSystem = {
    bolts: [],
    boltElements: [],
    animationFrameId: null,
    isActive: false,
    indicatorEl: null,
    
    // 구체 위치 설정 (겹치지 않도록 분산)
    BOLT_POSITIONS: [
        { offsetX: -100, offsetY: -80, bobPhase: 0 },      // 왼쪽 위
        { offsetX: 100, offsetY: -80, bobPhase: Math.PI * 0.66 },   // 오른쪽 위
        { offsetX: 0, offsetY: -140, bobPhase: Math.PI * 1.33 }     // 중앙 위
    ],
    
    init() {
        this.bolts = [];
        this.boltElements = [];
        this.isActive = false;
        this.removeAllBoltElements();
        this.removeIndicator();
    },
    
    addBolt() {
        if (this.bolts.length >= 3) return false;
        const boltIndex = this.bolts.length;
        const position = this.BOLT_POSITIONS[boltIndex];
        
        const bolt = {
            id: Date.now() + Math.random(),
            index: boltIndex,
            offsetX: position.offsetX,
            offsetY: position.offsetY,
            bobPhase: position.bobPhase,
            pulsePhase: Math.random() * Math.PI * 2
        };
        this.bolts.push(bolt);
        this.createBoltElement(bolt);
        this.updateIndicator();
        
        if (!this.isActive) {
            this.isActive = true;
            this.startAnimation();
        }
        return true;
    },
    
    createBoltElement(bolt) {
        const el = document.createElement('div');
        el.className = 'energy-bolt-orb';
        el.dataset.boltId = bolt.id;
        el.innerHTML = `
            <img src="energybolt.png" alt="Energy Bolt" class="bolt-image">
            <div class="bolt-glow-overlay"></div>
        `;
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%, -50%) scale(0.5)';
        document.body.appendChild(el);
        
        // 등장 애니메이션
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        this.boltElements.push(el);
    },
    
    // 버프 인디케이터 업데이트
    updateIndicator() {
        const debuffContainer = document.getElementById('player-debuffs');
        if (!debuffContainer) return;
        
        // 기존 인디케이터 제거
        this.removeIndicator();
        
        if (this.bolts.length === 0) return;
        
        const totalDamage = this.bolts.length * 3;
        
        this.indicatorEl = document.createElement('div');
        this.indicatorEl.className = 'energy-bolt-indicator buff-icon';
        this.indicatorEl.innerHTML = `
            <img src="energybolt.png" alt="Energy Bolt" class="indicator-icon-img">
            <span class="indicator-stack">${this.bolts.length}</span>
        `;
        this.indicatorEl.title = `에너지 볼트 x${this.bolts.length}\n턴 종료 시 랜덤 적에게 ${totalDamage} 데미지`;
        
        // 호버 시 상세 툴팁
        const tooltip = document.createElement('div');
        tooltip.className = 'energy-bolt-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title"><img src="energybolt.png" class="tooltip-icon-img"> 에너지 볼트</div>
            <div class="tooltip-count">${this.bolts.length}/3 충전</div>
            <div class="tooltip-desc">턴 종료 시 랜덤 적에게<br><span class="damage-value">${totalDamage}</span> 데미지</div>
            <div class="tooltip-hint">(4번째 사용 시 과부하 폭발!<br>구체당 9 데미지 × ${this.bolts.length}회!)</div>
        `;
        this.indicatorEl.appendChild(tooltip);
        
        debuffContainer.appendChild(this.indicatorEl);
        
        // 등장 애니메이션
        requestAnimationFrame(() => {
            this.indicatorEl.classList.add('active');
        });
    },
    
    removeIndicator() {
        if (this.indicatorEl) {
            this.indicatorEl.remove();
            this.indicatorEl = null;
        }
        document.querySelectorAll('.energy-bolt-indicator').forEach(el => el.remove());
    },
    
    startAnimation() {
        const animate = () => {
            if (!this.isActive || this.bolts.length === 0) return;
            const playerEl = document.getElementById('player');
            if (!playerEl) { this.animationFrameId = requestAnimationFrame(animate); return; }
            const rect = playerEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const time = Date.now() * 0.001;
            
            this.bolts.forEach((bolt, index) => {
                // 부드러운 상하 움직임 (bobbing)
                const bobY = Math.sin(time * 1.5 + bolt.bobPhase) * 12;
                // 살짝 좌우 흔들림
                const swayX = Math.sin(time * 0.8 + bolt.pulsePhase) * 5;
                
                const x = centerX + bolt.offsetX + swayX;
                const y = centerY + bolt.offsetY + bobY;
                
                const el = this.boltElements[index];
                if (el) {
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;
                }
            });
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    },
    
    onTurnEnd() {
        if (this.bolts.length === 0) return;
        const aliveEnemies = [];
        if (gameState.enemies) {
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                    if (el) aliveEnemies.push({ enemy, el, index });
                }
            });
        }
        if (aliveEnemies.length === 0) return;
        
        // 각 볼트가 번개를 발사하지만 볼트 자체는 유지됨
        this.bolts.forEach((bolt, boltIndex) => {
            setTimeout(() => {
                const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                if (!target || target.enemy.hp <= 0) return;
                const boltEl = this.boltElements[boltIndex];
                if (!boltEl) return;
                const boltRect = boltEl.getBoundingClientRect();
                const targetRect = target.el.getBoundingClientRect();
                
                // 발사 시 볼트 강조 애니메이션 (사라지지 않음)
                boltEl.classList.add('firing-pulse');
                setTimeout(() => boltEl.classList.remove('firing-pulse'), 400);
                
                if (typeof VFX !== 'undefined') {
                    // 발사 전 충전 이펙트
                    VFX.sparks(boltRect.left, boltRect.top, { color: '#93c5fd', count: 8, speed: 100 });
                    
                    // 번개 발사
                    VFX.lightning(boltRect.left, boltRect.top, targetRect.left + targetRect.width/2, targetRect.top + targetRect.height/2, { color: '#60a5fa', width: 4 });
                    
                    // 임팩트
                    setTimeout(() => { 
                        VFX.impact(targetRect.left + targetRect.width/2, targetRect.top + targetRect.height/2, { color: '#60a5fa', size: 100 });
                        VFX.sparks(targetRect.left + targetRect.width/2, targetRect.top + targetRect.height/2, { color: '#93c5fd', count: 12 });
                    }, 150);
                }
                
                setTimeout(() => {
                    if (target.enemy.hp > 0) {
                        dealDamage(target.enemy, 3);
                        if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                    }
                }, 200);
                addLog(`⚡ 에너지 볼트가 ${target.enemy.name}에게 3 데미지!`, 'damage');
            }, boltIndex * 350);
        });
        
        // 볼트는 유지됨 - 제거하지 않음!
    },
    
    triggerOvercharge(state) {
        console.log('[EnergyBolt] ⚡ 과부하 폭발!');
        
        // 모든 적 수집
        const targets = [];
        if (gameState.enemies && gameState.enemies.length > 0) {
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        targets.push({ 
                            enemy, 
                            el, 
                            x: rect.left + rect.width/2, 
                            y: rect.top + rect.height/2 
                        });
                    }
                }
            });
        } else if (state.enemy && state.enemy.hp > 0) {
            const el = document.getElementById('enemy');
            if (el) {
                const rect = el.getBoundingClientRect();
                targets.push({ 
                    enemy: state.enemy, 
                    el, 
                    x: rect.left + rect.width/2, 
                    y: rect.top + rect.height/2 
                });
            }
        }
        
        // 볼트 위치 수집
        const boltPositions = [];
        this.bolts.forEach((bolt, boltIndex) => {
            const boltEl = this.boltElements[boltIndex];
            if (!boltEl) return;
            const boltRect = boltEl.getBoundingClientRect();
            boltPositions.push({
                x: boltRect.left + boltRect.width/2,
                y: boltRect.top + boltRect.height/2
            });
        });
        
        // MageVFX 과부하 이펙트 사용
        if (typeof MageVFX !== 'undefined' && boltPositions.length > 0) {
            MageVFX.energyBoltOvercharge(boltPositions, targets);
        }
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            setTimeout(() => {
                EffectSystem.screenShake(20, 500);
            }, 150);
        }
        
        // 데미지 적용 (각 구체당 9 데미지, 순차적으로 타격)
        const damagePerBolt = 9;
        const boltCount = this.bolts.length;
        let totalDamageDealt = 0;
        
        // 각 볼트가 순차적으로 데미지
        this.bolts.forEach((bolt, boltIndex) => {
            setTimeout(() => {
                // 살아있는 적 중 랜덤 타겟 (또는 모든 적에게)
                const aliveTargets = targets.filter(t => t.enemy.hp > 0);
                if (aliveTargets.length === 0) return;
                
                // 모든 살아있는 적에게 9 데미지
                aliveTargets.forEach(target => {
                    if (target.enemy.hp > 0) {
                        target.enemy.hp = Math.max(0, target.enemy.hp - damagePerBolt);
                        totalDamageDealt += damagePerBolt;
                        if (typeof showDamagePopup === 'function') {
                            showDamagePopup(target.el, damagePerBolt, 'magic');
                        }
                    }
                });
                
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                
                addLog(`⚡ 과부하 ${boltIndex + 1}번째 폭발! ${damagePerBolt} 데미지!`, 'critical');
                
                // 마지막 볼트 후 처리
                if (boltIndex === boltCount - 1) {
                    setTimeout(() => {
                        if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
                    }, 200);
                }
            }, 300 + boltIndex * 250); // 각 볼트마다 250ms 간격
        });
        
        // 과부하 후 완전 초기화
        setTimeout(() => {
            this.clear();
            // 손패 UI 업데이트 (에너지 볼트 카드 상태 복원)
            if (typeof updateHandUI === 'function') {
                updateHandUI();
            }
        }, 800);
    },
    
    clear() {
        this.bolts = [];
        this.isActive = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.removeAllBoltElements();
        this.removeIndicator();
    },
    
    removeAllBoltElements() {
        // 사라지는 애니메이션
        this.boltElements.forEach(el => {
            if (el) {
                el.style.transition = 'opacity 0.3s, transform 0.3s';
                el.style.opacity = '0';
                el.style.transform = 'translate(-50%, -50%) scale(0.3)';
                setTimeout(() => el.remove(), 300);
            }
        });
        this.boltElements = [];
        setTimeout(() => {
            document.querySelectorAll('.energy-bolt-orb').forEach(el => el.remove());
        }, 350);
    }
};

window.EnergyBoltSystem = EnergyBoltSystem;

console.log('[Card EnergyBolt] 에너지 볼트 시스템 로드됨');

