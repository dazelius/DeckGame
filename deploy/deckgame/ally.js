// ==========================================
// Shadow Deck - 조력자 시스템 (Ally System)
// ==========================================

const AllySystem = {
    // 현재 조력자
    currentAlly: null,
    
    // 조력자 활성화 상태
    isActive: false,
    
    // 코스트 카운터 (공격 발동용)
    costSpent: 0,
    costThreshold: 3, // 3코스트마다 조력자 공격
    
    // ==========================================
    // 조력자 데이터베이스
    // ==========================================
    allyDatabase: {
        // 그림자 검사
        shadowSwordsman: {
            id: 'shadowSwordsman',
            name: {
                kr: '그림자 검사',
                en: 'Shadow Swordsman'
            },
            description: {
                kr: '3 코스트 사용 시 적에게 4 데미지를 입힙니다.',
                en: 'Deals 4 damage when 3 energy is spent.'
            },
            icon: 'ally_shadow.png',
            attackDamage: 4,
            attackType: 'slash', // slash, projectile, fire, shield
            attackColor: '#8b5cf6',
            costThreshold: 3,
            onAttack: (ally, enemy) => {
                return { damage: 4, effect: 'slash' };
            }
        },
        
        // 정령 궁수
        spiritArcher: {
            id: 'spiritArcher',
            name: {
                kr: '정령 궁수',
                en: 'Spirit Archer'
            },
            description: {
                kr: '3 코스트 사용 시 적에게 3 데미지를 입힙니다. (원거리)',
                en: 'Deals 3 ranged damage when 3 energy is spent.'
            },
            icon: 'ally_archer.png',
            attackDamage: 3,
            attackType: 'projectile',
            attackColor: '#22c55e',
            costThreshold: 3,
            onAttack: (ally, enemy) => {
                return { damage: 3, effect: 'projectile' };
            }
        },
        
        // 수호의 성기사
        guardianPaladin: {
            id: 'guardianPaladin',
            name: {
                kr: '수호의 성기사',
                en: 'Guardian Paladin'
            },
            description: {
                kr: '4 코스트 사용 시 플레이어에게 5 방어도를 부여합니다.',
                en: 'Grants 5 block when 4 energy is spent.'
            },
            icon: 'ally_paladin.png',
            attackDamage: 0,
            blockAmount: 5,
            attackType: 'shield',
            attackColor: '#3b82f6',
            costThreshold: 4,
            onAttack: (ally, enemy) => {
                return { block: 5, effect: 'shield' };
            }
        },
        
        // 화염 마법사
        flameMage: {
            id: 'flameMage',
            name: {
                kr: '화염 마법사',
                en: 'Flame Mage'
            },
            description: {
                kr: '3 코스트 사용 시 적에게 6 데미지를 입힙니다. (화염)',
                en: 'Deals 6 fire damage when 3 energy is spent.'
            },
            icon: 'ally_mage.png',
            attackDamage: 6,
            attackType: 'fire',
            attackColor: '#f97316',
            costThreshold: 3,
            onAttack: (ally, enemy) => {
                return { damage: 6, effect: 'fire' };
            }
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // 이미 조력자가 있으면 상태 유지
        if (!this.currentAlly) {
            this.costSpent = 0;
            this.isActive = false;
        }
        this.injectStyles();
        console.log('[AllySystem] Initialized');
    },
    
    // ==========================================
    // 조력자 설정
    // ==========================================
    setAlly(allyId) {
        const allyData = this.allyDatabase[allyId];
        if (!allyData) {
            console.error(`[AllySystem] Ally not found: ${allyId}`);
            return false;
        }
        
        this.currentAlly = {
            ...allyData,
            isReady: false
        };
        
        this.costThreshold = allyData.costThreshold || 3;
        this.costSpent = 0;
        this.isActive = true;
        
        this.createAllyUI();
        this.updateAllyUI();
        
        console.log(`[AllySystem] Ally set: ${allyData.name.kr || allyData.name}`);
        return true;
    },
    
    // ==========================================
    // 조력자 제거
    // ==========================================
    removeAlly() {
        this.currentAlly = null;
        this.isActive = false;
        this.costSpent = 0;
        
        const allyContainer = document.getElementById('ally-container');
        if (allyContainer) {
            allyContainer.remove();
        }
        
        console.log('[AllySystem] Ally removed');
    },
    
    // ==========================================
    // 코스트 사용 시 호출
    // ==========================================
    onCostSpent(cost) {
        console.log(`[AllySystem] onCostSpent called: cost=${cost}, isActive=${this.isActive}, hasAlly=${!!this.currentAlly}`);
        
        if (!this.isActive || !this.currentAlly) {
            console.log('[AllySystem] Not active or no ally');
            return;
        }
        
        this.costSpent += cost;
        console.log(`[AllySystem] Cost accumulated: ${this.costSpent}/${this.costThreshold}`);
        this.updateAllyUI();
        
        // 코스트 임계값 도달 시 공격
        if (this.costSpent >= this.costThreshold) {
            console.log('[AllySystem] Threshold reached! Triggering attack...');
            this.costSpent -= this.costThreshold;
            this.triggerAllyAttack();
        }
    },
    
    // ==========================================
    // 조력자 공격 발동
    // ==========================================
    triggerAllyAttack() {
        console.log('[AllySystem] triggerAllyAttack called');
        
        if (!this.currentAlly) {
            console.log('[AllySystem] Cannot attack - no ally');
            return;
        }
        
        const ally = this.currentAlly;
        const allyEl = document.getElementById('ally-character');
        const lang = typeof LanguageSystem !== 'undefined' ? LanguageSystem.currentLang : 'kr';
        console.log(`[AllySystem] Ally attacking: ${ally.name[lang] || ally.name.kr}, allyEl=${!!allyEl}`);
        
        // 타겟 설정
        let targetEl, target;
        if (ally.attackType === 'shield') {
            targetEl = document.getElementById('player');
            target = gameState.player;
        } else {
            targetEl = document.querySelector('.enemy-unit.selected') || document.querySelector('.enemy-unit');
            target = gameState.enemy;
        }
        
        if (!targetEl || !target) return;
        
        // 조력자 준비 상태 표시
        this.showAllyReadyEffect(allyEl);
        
        // 공격 실행 (약간의 딜레이)
        setTimeout(() => {
            this.executeAllyAction(ally, target, allyEl, targetEl);
        }, 300);
    },
    
    // ==========================================
    // 조력자 액션 실행
    // ==========================================
    executeAllyAction(ally, target, allyEl, targetEl) {
        const result = ally.onAttack(ally, target);
        const sprite = document.getElementById('ally-sprite');
        
        // Idle 애니메이션 일시 중지
        this.stopIdleAnimation();
        
        // 이펙트 및 데미지/방어도 처리
        const allyRect = allyEl?.getBoundingClientRect();
        const targetRect = targetEl?.getBoundingClientRect();
        
        if (allyRect && targetRect) {
            const allyX = allyRect.left + allyRect.width / 2;
            const allyY = allyRect.top + allyRect.height / 2;
            const targetX = targetRect.left + targetRect.width / 2;
            const targetY = targetRect.top + targetRect.height / 2;
            
            switch (ally.attackType) {
                case 'slash':
                    // 근접 돌진 공격 모션
                    if (allyEl) {
                        allyEl.classList.add('ally-melee-attack');
                        setTimeout(() => {
                            allyEl.classList.remove('ally-melee-attack');
                            this.startIdleAnimation();
                        }, 600);
                    }
                    setTimeout(() => {
                        if (typeof VFX !== 'undefined') {
                            VFX.slash(targetX, targetY, { 
                                color: ally.attackColor, 
                                slashCount: 2,
                                randomOffset: 30
                            });
                        }
                        if (result.damage && target.hp !== undefined) {
                            this.dealAllyDamage(target, result.damage, targetEl);
                        }
                    }, 250);
                    break;
                    
                case 'projectile':
                    // 원거리 발사 모션 (활 당기기)
                    if (allyEl) {
                        allyEl.classList.add('ally-ranged-attack');
                        setTimeout(() => {
                            allyEl.classList.remove('ally-ranged-attack');
                            this.startIdleAnimation();
                        }, 500);
                    }
                    // 화살 발사
                    setTimeout(() => {
                        if (typeof VFX !== 'undefined') {
                            VFX.dagger(allyX, allyY - 20, targetX, targetY, {
                                color: '#8b7355',
                                glowColor: ally.attackColor,
                                size: 40,
                                speed: 40,
                                spinSpeed: 0 // 화살은 회전 안함
                            });
                        }
                    }, 200);
                    setTimeout(() => {
                        if (result.damage && target.hp !== undefined) {
                            this.dealAllyDamage(target, result.damage, targetEl);
                        }
                    }, 350);
                    break;
                    
                case 'fire':
                    // 마법 시전 모션
                    if (allyEl) {
                        allyEl.classList.add('ally-cast-attack');
                        setTimeout(() => {
                            allyEl.classList.remove('ally-cast-attack');
                            this.startIdleAnimation();
                        }, 700);
                    }
                    // 화염 발사
                    setTimeout(() => {
                        if (typeof VFX !== 'undefined') {
                            VFX.projectile(allyX, allyY - 30, targetX, targetY, {
                                color: ally.attackColor,
                                size: 25,
                                speed: 20
                            });
                        }
                    }, 250);
                    setTimeout(() => {
                        if (typeof VFX !== 'undefined') {
                            VFX.fire(targetX, targetY, { size: 120 });
                        }
                        if (result.damage && target.hp !== undefined) {
                            this.dealAllyDamage(target, result.damage, targetEl);
                        }
                    }, 450);
                    break;
                    
                case 'shield':
                    // 버프 모션
                    if (allyEl) {
                        allyEl.classList.add('ally-buff-action');
                        setTimeout(() => {
                            allyEl.classList.remove('ally-buff-action');
                            this.startIdleAnimation();
                        }, 600);
                    }
                    setTimeout(() => {
                        if (typeof VFX !== 'undefined') {
                            VFX.shield(targetX, targetY, { color: ally.attackColor, size: 120 });
                        }
                        if (result.block && typeof gainBlock === 'function') {
                            gainBlock(target, result.block);
                        }
                    }, 300);
                    break;
                    
                default:
                    this.startIdleAnimation();
            }
        } else {
            this.startIdleAnimation();
        }
        
        // 로그
        const lang = typeof LanguageSystem !== 'undefined' ? LanguageSystem.currentLang : 'kr';
        const allyName = ally.name[lang] || ally.name.kr;
        
        if (result.damage) {
            if (typeof addLog === 'function') {
                addLog(`⚔️ ${allyName}: ${result.damage} damage!`, 'ally');
            }
        } else if (result.block) {
            if (typeof addLog === 'function') {
                addLog(`🛡️ ${allyName}: +${result.block} block!`, 'ally');
            }
        }
        
        // UI 업데이트
        this.updateAllyUI();
        if (typeof updateUI === 'function') updateUI();
        if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
    },
    
    // ==========================================
    // 조력자 데미지 처리
    // ==========================================
    dealAllyDamage(target, damage, targetEl) {
        // 취약 보너스
        if (target.vulnerable && target.vulnerable > 0) {
            damage = Math.floor(damage * 1.5);
        }
        
        // 방어도 처리
        const blocked = Math.min(target.block || 0, damage);
        target.block = Math.max(0, (target.block || 0) - blocked);
        const finalDamage = damage - blocked;
        
        // HP 감소
        target.hp -= finalDamage;
        
        // 데미지 팝업
        if (finalDamage > 0 && targetEl && typeof showDamagePopup === 'function') {
            showDamagePopup(targetEl, finalDamage, 'damage');
        }
        
        // 피격 효과
        if (targetEl) {
            targetEl.classList.add('hit-effect');
            setTimeout(() => targetEl.classList.remove('hit-effect'), 200);
        }
        
        // 사망 체크
        if (target.hp <= 0) {
            setTimeout(() => {
                if (typeof checkEnemyDefeated === 'function') {
                    checkEnemyDefeated();
                }
            }, 300);
        }
    },
    
    
    // ==========================================
    // 턴 시작 시 호출
    // ==========================================
    onTurnStart() {
        // 코스트 카운터는 유지 (턴 넘어가도 유지)
        this.updateAllyUI();
    },
    
    // ==========================================
    // 전투 종료 시 호출
    // ==========================================
    onBattleEnd() {
        this.costSpent = 0;
        this.updateAllyUI();
    },
    
    // ==========================================
    // UI 생성
    // ==========================================
    createAllyUI() {
        console.log('[AllySystem] createAllyUI called');
        
        // 기존 UI 제거
        const existing = document.getElementById('ally-container');
        if (existing) existing.remove();
        
        const playerSide = document.querySelector('.player-side');
        console.log(`[AllySystem] playerSide found: ${!!playerSide}`);
        if (!playerSide) {
            console.error('[AllySystem] .player-side not found! Cannot create UI');
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'ally-container';
        container.className = 'ally-container';
        
        container.innerHTML = `
            <div class="ally-character" id="ally-character">
                <div class="ally-sprite-wrapper">
                    <img class="ally-sprite" id="ally-sprite" 
                         src="${this.currentAlly.icon}" alt="${this.currentAlly.name.kr || 'Ally'}" 
                         onerror="this.src='hero.png';">
                </div>
                <div class="ally-info-panel">
                    <div class="ally-name" id="ally-name"></div>
                    <div class="ally-cost-bar">
                        <div class="ally-cost-fill" id="ally-cost-fill"></div>
                        <span class="ally-cost-text" id="ally-cost-text">0/${this.costThreshold}</span>
                    </div>
                </div>
            </div>
            <div class="ally-tooltip" id="ally-tooltip">
                <div class="ally-tooltip-name"></div>
                <div class="ally-tooltip-desc"></div>
            </div>
        `;
        
        // 플레이어 옆에 배치 (캐릭터 컨테이너 앞에)
        const characterContainer = playerSide.querySelector('.character-container');
        console.log(`[AllySystem] characterContainer found: ${!!characterContainer}`);
        if (characterContainer) {
            characterContainer.insertAdjacentElement('beforebegin', container);
            console.log('[AllySystem] Ally UI inserted before character-container');
        } else {
            playerSide.insertBefore(container, playerSide.firstChild);
            console.log('[AllySystem] Ally UI inserted at start of player-side');
        }
        console.log('[AllySystem] Ally UI created successfully');
        
        // 툴팁 이벤트
        const allyChar = container.querySelector('.ally-character');
        const tooltip = container.querySelector('.ally-tooltip');
        
        allyChar.addEventListener('mouseenter', () => {
            this.showAllyTooltip(tooltip);
        });
        
        allyChar.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
        
        // Idle 애니메이션 시작
        this.startIdleAnimation();
    },
    
    // ==========================================
    // Idle 애니메이션
    // ==========================================
    startIdleAnimation() {
        const sprite = document.getElementById('ally-sprite');
        if (sprite) {
            sprite.classList.add('ally-idle');
        }
    },
    
    stopIdleAnimation() {
        const sprite = document.getElementById('ally-sprite');
        if (sprite) {
            sprite.classList.remove('ally-idle');
        }
    },
    
    // ==========================================
    // UI 업데이트
    // ==========================================
    updateAllyUI() {
        if (!this.currentAlly) return;
        
        const ally = this.currentAlly;
        const lang = typeof LanguageSystem !== 'undefined' ? LanguageSystem.currentLang : 'kr';
        
        // 이름
        const nameEl = document.getElementById('ally-name');
        if (nameEl) {
            nameEl.textContent = ally.name[lang] || ally.name.kr;
        }
        
        // 코스트 바
        const costFill = document.getElementById('ally-cost-fill');
        const costText = document.getElementById('ally-cost-text');
        if (costFill && costText) {
            const costPercent = (this.costSpent / this.costThreshold) * 100;
            costFill.style.width = `${costPercent}%`;
            costText.textContent = `${this.costSpent}/${this.costThreshold}`;
            
            // 준비 완료 시 글로우
            if (this.costSpent >= this.costThreshold - 1) {
                costFill.classList.add('ready');
            } else {
                costFill.classList.remove('ready');
            }
        }
    },
    
    // ==========================================
    // 툴팁 표시
    // ==========================================
    showAllyTooltip(tooltipEl) {
        if (!this.currentAlly || !tooltipEl) return;
        
        const ally = this.currentAlly;
        const lang = typeof LanguageSystem !== 'undefined' ? LanguageSystem.currentLang : 'kr';
        
        const nameEl = tooltipEl.querySelector('.ally-tooltip-name');
        const descEl = tooltipEl.querySelector('.ally-tooltip-desc');
        
        if (nameEl) {
            nameEl.textContent = ally.name[lang] || ally.name.kr;
        }
        if (descEl) {
            descEl.textContent = ally.description[lang] || ally.description.kr;
        }
        
        tooltipEl.classList.add('visible');
    },
    
    // ==========================================
    // 준비 이펙트
    // ==========================================
    showAllyReadyEffect(allyEl) {
        if (!allyEl) return;
        
        // Idle 애니메이션 일시 중지
        this.stopIdleAnimation();
        
        allyEl.classList.add('ally-ready');
        setTimeout(() => {
            allyEl.classList.remove('ally-ready');
        }, 400);
        
        // VFX
        const sprite = document.getElementById('ally-sprite');
        if (sprite) {
            const rect = sprite.getBoundingClientRect();
            if (typeof VFX !== 'undefined') {
                VFX.sparks(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    { color: this.currentAlly.attackColor, count: 15, speed: 10 }
                );
            }
        }
    },
    
    // ==========================================
    // CSS 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('ally-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ally-styles';
        styles.textContent = `
            /* 조력자 컨테이너 - 플레이어 옆에 배치 */
            .ally-container {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                margin-right: -20px;
                margin-bottom: 40px;  /* 플레이어 스프라이트와 수평 맞춤 */
                z-index: 5;
                align-self: flex-end;
            }
            
            /* 조력자 캐릭터 전체 */
            .ally-character {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
            }
            
            /* 스프라이트 래퍼 - 플레이어와 동일한 높이 */
            .ally-sprite-wrapper {
                position: relative;
                width: 180px;
                height: 220px;
                display: flex;
                align-items: flex-end;
                justify-content: center;
            }
            
            /* 조력자 스프라이트 이미지 */
            .ally-sprite {
                width: 170px;
                height: auto;
                max-height: 210px;
                object-fit: contain;
                filter: drop-shadow(3px 6px 8px rgba(0,0,0,0.5));
                transform-origin: bottom center;
            }
            
            /* ===================== */
            /* Idle 애니메이션 */
            /* ===================== */
            .ally-sprite.ally-idle {
                animation: allyIdleBounce 2s ease-in-out infinite;
            }
            
            @keyframes allyIdleBounce {
                0%, 100% { 
                    transform: translateY(0) scale(1); 
                }
                50% { 
                    transform: translateY(-5px) scale(1.02); 
                }
            }
            
            /* ===================== */
            /* 근접 공격 모션 (돌진) */
            /* ===================== */
            .ally-character.ally-melee-attack .ally-sprite {
                animation: allyMeleeAttack 0.6s ease-out forwards !important;
            }
            
            @keyframes allyMeleeAttack {
                0% { 
                    transform: translateX(0) translateY(0) scale(1); 
                }
                20% { 
                    transform: translateX(-20px) translateY(-5px) scale(1.1); 
                }
                40% { 
                    transform: translateX(80px) translateY(-10px) scale(1.15); 
                }
                60% { 
                    transform: translateX(100px) translateY(0) scale(1.2); 
                }
                100% { 
                    transform: translateX(0) translateY(0) scale(1); 
                }
            }
            
            /* ===================== */
            /* 원거리 공격 모션 (활 당기기/발사) */
            /* ===================== */
            .ally-character.ally-ranged-attack .ally-sprite {
                animation: allyRangedAttack 0.5s ease-out forwards !important;
            }
            
            @keyframes allyRangedAttack {
                0% { 
                    transform: translateX(0) scale(1); 
                }
                30% { 
                    transform: translateX(-15px) scale(1.05) rotate(-5deg); 
                }
                50% { 
                    transform: translateX(-20px) scale(1.1) rotate(-8deg); 
                }
                70% { 
                    transform: translateX(10px) scale(1.05) rotate(3deg); 
                }
                100% { 
                    transform: translateX(0) scale(1) rotate(0deg); 
                }
            }
            
            /* ===================== */
            /* 마법 시전 모션 */
            /* ===================== */
            .ally-character.ally-cast-attack .ally-sprite {
                animation: allyCastAttack 0.7s ease-out forwards !important;
            }
            
            @keyframes allyCastAttack {
                0% { 
                    transform: translateY(0) scale(1);
                    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
                }
                30% { 
                    transform: translateY(-15px) scale(1.1);
                    filter: drop-shadow(0 0 20px rgba(249, 115, 22, 0.8));
                }
                50% { 
                    transform: translateY(-20px) scale(1.15);
                    filter: drop-shadow(0 0 35px rgba(249, 115, 22, 1));
                }
                70% { 
                    transform: translateY(-10px) scale(1.05);
                    filter: drop-shadow(0 0 15px rgba(249, 115, 22, 0.5));
                }
                100% { 
                    transform: translateY(0) scale(1);
                    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
                }
            }
            
            /* ===================== */
            /* 버프/실드 모션 */
            /* ===================== */
            .ally-character.ally-buff-action .ally-sprite {
                animation: allyBuffAction 0.6s ease-out forwards !important;
            }
            
            @keyframes allyBuffAction {
                0% { 
                    transform: scale(1);
                    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
                }
                30% { 
                    transform: scale(1.1) rotate(-5deg);
                    filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.8));
                }
                60% { 
                    transform: scale(1.15) rotate(5deg);
                    filter: drop-shadow(0 0 40px rgba(59, 130, 246, 1));
                }
                100% { 
                    transform: scale(1) rotate(0deg);
                    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
                }
            }
            
            /* ===================== */
            /* 준비 이펙트 */
            /* ===================== */
            .ally-character.ally-ready .ally-sprite {
                animation: allyReadyFlash 0.4s ease-out !important;
            }
            
            @keyframes allyReadyFlash {
                0%, 100% { 
                    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5)); 
                }
                50% { 
                    filter: drop-shadow(0 0 30px #fbbf24) brightness(1.5); 
                }
            }
            
            /* ===================== */
            /* 피격 모션 */
            /* ===================== */
            .ally-character.ally-hit .ally-sprite {
                animation: allyHitShake 0.3s ease-out !important;
            }
            
            @keyframes allyHitShake {
                0%, 100% { 
                    transform: translateX(0); 
                    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5)); 
                }
                25% { 
                    transform: translateX(-10px); 
                    filter: brightness(0.6) saturate(0.3); 
                }
                75% { 
                    transform: translateX(10px); 
                    filter: brightness(1.3); 
                }
            }
            
            /* ===================== */
            /* 정보 패널 */
            /* ===================== */
            .ally-info-panel {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-top: 8px;
                width: 160px;
            }
            
            /* 조력자 이름 */
            .ally-name {
                font-size: 0.9rem;
                color: #a78bfa;
                text-align: center;
                font-weight: 600;
                text-shadow: 0 1px 3px rgba(0,0,0,0.9);
                margin-bottom: 5px;
            }
            
            /* 바 컨테이너 */
            .ally-bars {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            
            /* 코스트 바 (에너지 차지) */
            .ally-cost-bar {
                width: 100%;
                height: 10px;
                background: rgba(0,0,0,0.7);
                border-radius: 5px;
                overflow: hidden;
                position: relative;
                border: 1px solid rgba(139, 92, 246, 0.4);
            }
            
            .ally-cost-fill {
                height: 100%;
                background: linear-gradient(90deg, #8b5cf6, #a78bfa);
                transition: width 0.3s ease;
                border-radius: 4px;
            }
            
            .ally-cost-fill.ready {
                background: linear-gradient(90deg, #fbbf24, #f59e0b);
                animation: allyReadyPulse 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes allyReadyPulse {
                0% { box-shadow: 0 0 5px #fbbf24 inset; }
                100% { box-shadow: 0 0 15px #fbbf24 inset, 0 0 10px #fbbf24; }
            }
            
            .ally-cost-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 0.6rem;
                color: white;
                font-weight: bold;
                text-shadow: 0 1px 2px rgba(0,0,0,0.9);
            }
            
            /* ===================== */
            /* 툴팁 */
            /* ===================== */
            .ally-tooltip {
                position: absolute;
                bottom: calc(100% + 10px);
                left: 50%;
                transform: translateX(-50%);
                background: rgba(20, 20, 40, 0.95);
                border: 1px solid #8b5cf6;
                border-radius: 8px;
                padding: 10px 15px;
                min-width: 180px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
            }
            
            .ally-tooltip.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .ally-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 8px solid transparent;
                border-top-color: #8b5cf6;
            }
            
            .ally-tooltip-name {
                font-size: 0.9rem;
                font-weight: bold;
                color: #a78bfa;
                margin-bottom: 5px;
            }
            
            .ally-tooltip-desc {
                font-size: 0.75rem;
                color: #d1d5db;
                line-height: 1.4;
            }
            
            /* ===================== */
            /* 모바일 대응 */
            /* ===================== */
            @media (max-height: 500px) and (orientation: landscape) {
                .ally-container {
                    margin-right: -15px;
                }
                
                .ally-sprite-wrapper {
                    width: 100px;
                    height: 120px;
                }
                
                .ally-sprite {
                    width: 90px;
                    max-height: 110px;
                }
                
                .ally-info-panel {
                    width: 90px;
                }
                
                .ally-cost-bar {
                    height: 6px;
                }
                
                .ally-name {
                    font-size: 0.6rem;
                }
                
                .ally-cost-text {
                    font-size: 0.5rem;
                }
                
                /* 모바일에서 공격 모션 축소 */
                @keyframes allyMeleeAttack {
                    0% { transform: translateX(0) scale(1); }
                    20% { transform: translateX(-10px) scale(1.05); }
                    50% { transform: translateX(50px) scale(1.1); }
                    100% { transform: translateX(0) scale(1); }
                }
            }
        `;
        document.head.appendChild(styles);
    }
};

// 전역 초기화
document.addEventListener('DOMContentLoaded', () => {
    AllySystem.init();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    AllySystem.init();
}

console.log('[AllySystem] Loaded');

