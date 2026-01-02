// ==========================================
// 기믹 시스템 - Gimmick System
// 전장에 배치되는 상호작용 오브젝트
// ==========================================

const GimmickSystem = {
    // 현재 전투의 기믹 배열
    gimmicks: [],
    
    // 기믹 데이터베이스
    database: {
        explosiveBarrel: {
            id: 'explosiveBarrel',
            name: '폭발 배럴',
            hp: 8,
            maxHp: 8,
            img: 'barrel_explosive.png',
            description: '공격하면 폭발하여 모든 적에게 15 대미지',
            onDestroy: {
                type: 'aoe_damage',
                damage: 15,
                target: 'all_enemies',
                vfx: 'explosion'
            },
            // 드래그 타겟 가능 여부
            canTarget: true,
            // 적 공격 대상 가능 여부
            enemyTargetable: false
        },
        poisonBarrel: {
            id: 'poisonBarrel',
            name: '독 배럴',
            hp: 6,
            maxHp: 6,
            img: 'barrel_poison.png',
            description: '공격하면 터져서 모든 적에게 독 3 부여',
            onDestroy: {
                type: 'aoe_debuff',
                debuff: 'poison',
                value: 3,
                target: 'all_enemies',
                vfx: 'poison_cloud'
            },
            canTarget: true,
            enemyTargetable: false
        },
        healingCrystal: {
            id: 'healingCrystal',
            name: '치유 수정',
            hp: 10,
            maxHp: 10,
            img: 'crystal_heal.png',
            description: '공격하면 부서지며 플레이어 HP 20 회복',
            onDestroy: {
                type: 'heal_player',
                value: 20,
                vfx: 'heal_burst'
            },
            canTarget: true,
            enemyTargetable: true  // 적도 공격 가능
        },
        shieldGenerator: {
            id: 'shieldGenerator',
            name: '보호막 생성기',
            hp: 12,
            maxHp: 12,
            img: 'generator_shield.png',
            description: '매 턴 적에게 방어도 5 부여. 파괴 시 효과 해제',
            onTurnStart: {
                type: 'buff_enemies',
                buff: 'block',
                value: 5
            },
            onDestroy: {
                type: 'none',
                vfx: 'electric_burst'
            },
            canTarget: true,
            enemyTargetable: false
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.gimmicks = [];
        console.log('[GimmickSystem] 기믹 시스템 초기화');
    },
    
    // ==========================================
    // 기믹 생성
    // ==========================================
    createGimmick(gimmickId, position = 0) {
        const template = this.database[gimmickId];
        if (!template) {
            console.error(`[GimmickSystem] 알 수 없는 기믹: ${gimmickId}`);
            return null;
        }
        
        const gimmick = {
            ...template,
            uid: `gimmick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            hp: template.hp,
            maxHp: template.maxHp,
            position: position, // 숫자 인덱스 (0, 1, 2, 3...)로 몬스터 사이에 배치
            isGimmick: true
        };
        
        this.gimmicks.push(gimmick);
        console.log(`[GimmickSystem] 기믹 생성: ${gimmick.name} (위치: ${position})`);
        
        return gimmick;
    },
    
    // ==========================================
    // 전투에 기믹 추가
    // ==========================================
    addGimmicksToBattle(gimmickList) {
        // gimmickList: [{ id: 'explosiveBarrel', position: 0 }, ...]
        // position은 숫자 인덱스 - 몬스터 사이에 교차 배치됨
        gimmickList.forEach((g, i) => {
            const pos = g.position !== undefined ? g.position : i;
            this.createGimmick(g.id, pos);
        });
        this.renderGimmicks();
    },
    
    // ==========================================
    // 기믹 렌더링
    // ==========================================
    renderGimmicks() {
        const enemyArea = document.querySelector('.enemy-area');
        if (!enemyArea) return;
        
        // 기존 기믹 컨테이너 제거
        const existingGimmickContainer = document.getElementById('gimmicks-container');
        if (existingGimmickContainer) existingGimmickContainer.remove();
        
        // 살아있는 기믹이 없으면 종료
        const aliveGimmicks = this.gimmicks.filter(g => g.hp > 0);
        if (aliveGimmicks.length === 0) return;
        
        // 기믹 전용 컨테이너 생성 (몬스터와 별도 행)
        const gimmickContainer = document.createElement('div');
        gimmickContainer.id = 'gimmicks-container';
        gimmickContainer.className = 'gimmicks-container';
        
        this.gimmicks.forEach((gimmick, index) => {
            if (gimmick.hp <= 0) return;
            
            const gimmickEl = document.createElement('div');
            gimmickEl.className = 'gimmick-unit';
            gimmickEl.dataset.gimmickIndex = index;
            gimmickEl.dataset.gimmickId = gimmick.uid;
            
            // position에 따른 order 설정
            gimmickEl.style.order = gimmick.position;
            
            gimmickEl.innerHTML = `
                <div class="gimmick-sprite-container">
                    <img src="${gimmick.img}" alt="${gimmick.name}" class="gimmick-sprite-img" 
                         onerror="this.src='chest.png'">
                </div>
                <div class="gimmick-hp-wrapper">
                    <div class="gimmick-hp-bar-container">
                        <div class="gimmick-hp-bar" style="width: ${(gimmick.hp / gimmick.maxHp) * 100}%"></div>
                        <div class="gimmick-hp-text">${gimmick.hp}/${gimmick.maxHp}</div>
                    </div>
                </div>
                <div class="gimmick-tooltip">${gimmick.description}</div>
            `;
            
            // 드래그 타겟 설정
            if (gimmick.canTarget) {
                gimmickEl.classList.add('droppable-target');
                this.setupDragTarget(gimmickEl, gimmick, index);
            }
            
            gimmickContainer.appendChild(gimmickEl);
        });
        
        // 몬스터 컨테이너 앞에 기믹 컨테이너 추가 (화면상 몬스터 앞쪽에 배치)
        const enemiesContainer = document.getElementById('enemies-container');
        if (enemiesContainer) {
            enemyArea.insertBefore(gimmickContainer, enemiesContainer);
        } else {
            enemyArea.appendChild(gimmickContainer);
        }
    },
    
    // ==========================================
    // 드래그 타겟 설정
    // ==========================================
    setupDragTarget(gimmickEl, gimmick, index) {
        // 마우스 오버 시 하이라이트
        gimmickEl.addEventListener('mouseenter', () => {
            if (gameState.draggingCard) {
                gimmickEl.classList.add('gimmick-targetable');
            }
        });
        
        gimmickEl.addEventListener('mouseleave', () => {
            gimmickEl.classList.remove('gimmick-targetable');
        });
        
        // 클릭으로 기믹 선택 (공격 카드 사용 시)
        gimmickEl.addEventListener('click', () => {
            if (gameState.currentCard && gameState.currentCard.type === 'attack') {
                this.attackGimmick(index, gameState.currentCard);
            }
        });
    },
    
    // ==========================================
    // 기믹 공격
    // ==========================================
    attackGimmick(gimmickIndex, card) {
        const gimmick = this.gimmicks[gimmickIndex];
        if (!gimmick || gimmick.hp <= 0) return false;
        
        const damage = card.damage || card.value || 5;
        
        console.log(`[GimmickSystem] ${gimmick.name}에게 ${damage} 대미지!`);
        addLog(`⚡ ${gimmick.name}에 ${damage} 대미지!`, 'player');
        
        // 대미지 적용
        gimmick.hp -= damage;
        
        // VFX
        const gimmickEl = document.querySelector(`[data-gimmick-index="${gimmickIndex}"]`);
        if (gimmickEl) {
            // 히트 이펙트
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.flash(gimmickEl);
            }
            
            // 대미지 팝업
            if (typeof showDamagePopup === 'function') {
                showDamagePopup(gimmickEl, damage, 'normal');
            }
            
            // HP 바 업데이트
            const hpBar = gimmickEl.querySelector('.gimmick-hp-bar');
            const hpText = gimmickEl.querySelector('.gimmick-hp-text');
            if (hpBar) hpBar.style.width = `${Math.max(0, (gimmick.hp / gimmick.maxHp) * 100)}%`;
            if (hpText) hpText.textContent = `${Math.max(0, gimmick.hp)}/${gimmick.maxHp}`;
            
            // 흔들림 효과
            gimmickEl.classList.add('gimmick-hit');
            setTimeout(() => gimmickEl.classList.remove('gimmick-hit'), 300);
        }
        
        // 파괴 체크
        if (gimmick.hp <= 0) {
            this.destroyGimmick(gimmickIndex);
        }
        
        return true;
    },
    
    // ==========================================
    // 카드로 기믹 공격 (외부 호출용)
    // ==========================================
    damageGimmick(gimmickIndex, damage) {
        const gimmick = this.gimmicks[gimmickIndex];
        if (!gimmick || gimmick.hp <= 0) return false;
        
        console.log(`[GimmickSystem] ${gimmick.name}에게 ${damage} 대미지!`);
        
        gimmick.hp -= damage;
        
        const gimmickEl = document.querySelector(`[data-gimmick-index="${gimmickIndex}"]`);
        if (gimmickEl) {
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.flash(gimmickEl);
            }
            if (typeof showDamagePopup === 'function') {
                showDamagePopup(gimmickEl, damage, 'normal');
            }
            
            const hpBar = gimmickEl.querySelector('.gimmick-hp-bar');
            const hpText = gimmickEl.querySelector('.gimmick-hp-text');
            if (hpBar) hpBar.style.width = `${Math.max(0, (gimmick.hp / gimmick.maxHp) * 100)}%`;
            if (hpText) hpText.textContent = `${Math.max(0, gimmick.hp)}/${gimmick.maxHp}`;
            
            gimmickEl.classList.add('gimmick-hit');
            setTimeout(() => gimmickEl.classList.remove('gimmick-hit'), 300);
        }
        
        if (gimmick.hp <= 0) {
            this.destroyGimmick(gimmickIndex);
        }
        
        return true;
    },
    
    // ==========================================
    // 기믹 파괴
    // ==========================================
    destroyGimmick(gimmickIndex) {
        const gimmick = this.gimmicks[gimmickIndex];
        if (!gimmick) return;
        
        console.log(`[GimmickSystem] ${gimmick.name} 파괴!`);
        addLog(`${gimmick.name} 파괴!`, 'important');
        
        const gimmickEl = document.querySelector(`[data-gimmick-index="${gimmickIndex}"]`);
        
        // 파괴 효과 실행
        this.executeDestroyEffect(gimmick, gimmickEl);
        
        // 파괴 애니메이션
        if (gimmickEl) {
            gimmickEl.classList.add('gimmick-destroyed');
            
            // VFX 실행
            const rect = gimmickEl.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            if (gimmick.onDestroy.vfx === 'explosion') {
                this.playExplosionVFX(x, y);
            } else if (gimmick.onDestroy.vfx === 'poison_cloud') {
                this.playPoisonCloudVFX(x, y);
            } else if (gimmick.onDestroy.vfx === 'heal_burst') {
                this.playHealBurstVFX(x, y);
            } else if (gimmick.onDestroy.vfx === 'electric_burst') {
                this.playElectricBurstVFX(x, y);
            }
            
            // 요소 숨기기 (제거하지 않고 공간 유지)
            setTimeout(() => {
                gimmickEl.style.visibility = 'hidden';
                gimmickEl.style.pointerEvents = 'none';
            }, 600);
        }
        
        // 기믹 배열에서 제거 표시
        gimmick.hp = 0;
        gimmick.destroyed = true;
    },
    
    // ==========================================
    // 파괴 효과 실행
    // ==========================================
    executeDestroyEffect(gimmick, gimmickEl) {
        const effect = gimmick.onDestroy;
        if (!effect || effect.type === 'none') return;
        
        switch (effect.type) {
            case 'aoe_damage':
                // 모든 적에게 대미지
                this.dealAoeDamage(effect.damage, effect.target);
                break;
                
            case 'aoe_debuff':
                // 모든 적에게 디버프
                this.applyAoeDebuff(effect.debuff, effect.value, effect.target);
                break;
                
            case 'heal_player':
                // 플레이어 회복
                this.healPlayer(effect.value);
                break;
                
            case 'buff_player':
                // 플레이어 버프
                this.buffPlayer(effect.buff, effect.value);
                break;
        }
    },
    
    // ==========================================
    // AOE 대미지
    // ==========================================
    dealAoeDamage(damage, target) {
        if (target === 'all_enemies') {
            addLog(`폭발! 모든 적에게 ${damage} 대미지!`, 'important');
            
            // 카메라 흔들림
            if (typeof CameraEffects !== 'undefined') {
                CameraEffects.shake('heavy');
            }
            
            // 일반 대미지 시스템 사용
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    // dealDamage 함수 사용 (방어도, 취약, VFX 등 모두 처리)
                    if (typeof dealDamage === 'function') {
                        dealDamage(enemy, damage);
                    } else {
                        // 폴백: 직접 처리
                        let actualDamage = damage;
                        if (enemy.block > 0) {
                            const blockedDamage = Math.min(enemy.block, damage);
                            enemy.block -= blockedDamage;
                            actualDamage = damage - blockedDamage;
                        }
                        if (actualDamage > 0) {
                            enemy.hp -= actualDamage;
                        }
                    }
                }
            });
            
            // UI 업데이트
            setTimeout(() => {
                updateEnemiesUI();
                if (typeof checkEnemyDefeated === 'function') {
                    checkEnemyDefeated();
                }
            }, 300);
        }
    },
    
    // ==========================================
    // AOE 디버프
    // ==========================================
    applyAoeDebuff(debuff, value, target) {
        if (target === 'all_enemies') {
            addLog(`☠️ 독구름! 모든 적에게 독 ${value} 부여!`, 'debuff');
            
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    if (debuff === 'poison') {
                        enemy.poison = (enemy.poison || 0) + value;
                    } else if (debuff === 'weak') {
                        enemy.weak = (enemy.weak || 0) + value;
                    } else if (debuff === 'vulnerable') {
                        enemy.vulnerable = (enemy.vulnerable || 0) + value;
                    }
                    
                    const enemyEl = document.querySelector(`[data-index="${index}"]`);
                    if (enemyEl && typeof EffectSystem !== 'undefined') {
                        EffectSystem.debuff(enemyEl);
                    }
                }
            });
            
            updateEnemiesUI();
        }
    },
    
    // ==========================================
    // 플레이어 회복
    // ==========================================
    healPlayer(value) {
        const prevHp = gameState.player.hp;
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + value);
        const actualHeal = gameState.player.hp - prevHp;
        
        if (actualHeal > 0) {
            addLog(`💚 수정 파괴! HP +${actualHeal} 회복!`, 'heal');
            
            const playerEl = document.querySelector('.player-character');
            if (playerEl) {
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.heal(playerEl);
                }
                if (typeof showDamagePopup === 'function') {
                    showDamagePopup(playerEl, actualHeal, 'heal');
                }
            }
            
            updateUI();
        }
    },
    
    // ==========================================
    // VFX 함수들
    // ==========================================
    playExplosionVFX(x, y) {
        // 폭발 VFX - VFX.impact와 sparks 사용
        if (typeof VFX !== 'undefined') {
            // 큰 충격파
            VFX.impact(x, y, { color: '#ff6b35', scale: 2 });
            
            // 불꽃 스파크
            setTimeout(() => {
                VFX.sparks(x, y, { color: '#ffd700', count: 15, scale: 1.5 });
            }, 50);
            
            // 연기
            setTimeout(() => {
                VFX.smoke(x, y, { color: '#555555', count: 8, scale: 1.5 });
            }, 100);
        }
        
        // 화면 플래시
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at ${x}px ${y}px, rgba(255, 150, 50, 0.8) 0%, transparent 50%);
            pointer-events: none;
            z-index: 9999;
            animation: explosionFlash 0.3s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
        
        // 카메라 흔들림
        if (typeof CameraEffects !== 'undefined') {
            CameraEffects.shake('heavy');
        }
    },
    
    playPoisonCloudVFX(x, y) {
        if (typeof VFX !== 'undefined') {
            // 독 연기
            VFX.smoke(x, y, { color: '#22c55e', count: 12, scale: 1.3 });
            setTimeout(() => {
                VFX.smoke(x, y, { color: '#166534', count: 8, scale: 1 });
            }, 150);
        }
    },
    
    playHealBurstVFX(x, y) {
        if (typeof VFX !== 'undefined') {
            VFX.shield(x, y, { color: '#4ade80', scale: 1.2 });
            VFX.sparks(x, y, { color: '#22c55e', count: 10, scale: 0.8 });
        }
    },
    
    playElectricBurstVFX(x, y) {
        if (typeof VFX !== 'undefined') {
            VFX.sparks(x, y, { color: '#60a5fa', count: 12, scale: 1 });
            VFX.impact(x, y, { color: '#3b82f6', scale: 0.8 });
        }
    },
    
    // ==========================================
    // 턴 시작 시 효과
    // ==========================================
    onTurnStart() {
        this.gimmicks.forEach((gimmick, index) => {
            if (gimmick.hp <= 0 || !gimmick.onTurnStart) return;
            
            const effect = gimmick.onTurnStart;
            
            if (effect.type === 'buff_enemies' && effect.buff === 'block') {
                // 모든 적에게 방어도 부여
                addLog(`⚙️ ${gimmick.name}: 적에게 방어도 +${effect.value}`, 'warning');
                
                gameState.enemies.forEach((enemy, enemyIndex) => {
                    if (enemy.hp > 0) {
                        enemy.block = (enemy.block || 0) + effect.value;
                        
                        const enemyEl = document.querySelector(`[data-index="${enemyIndex}"]`);
                        if (enemyEl && typeof EffectSystem !== 'undefined') {
                            EffectSystem.block(enemyEl);
                        }
                    }
                });
                
                updateEnemiesUI();
            }
        });
    },
    
    // ==========================================
    // 기믹 인덱스로 기믹 가져오기
    // ==========================================
    getGimmick(index) {
        return this.gimmicks[index];
    },
    
    // ==========================================
    // 살아있는 기믹 가져오기
    // ==========================================
    getAliveGimmicks() {
        return this.gimmicks.filter(g => g.hp > 0);
    },
    
    // ==========================================
    // 기믹이 있는지 확인
    // ==========================================
    hasGimmicks() {
        return this.gimmicks.some(g => g.hp > 0);
    },
    
    // ==========================================
    // CSS 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('gimmick-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'gimmick-styles';
        style.textContent = `
            /* 기믹 유닛 */
            .gimmick-unit {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                transition: transform 0.2s, filter 0.2s;
            }
            
            .gimmick-unit:hover {
                transform: scale(1.05);
                filter: brightness(1.2);
            }
            
            .gimmick-unit:hover .gimmick-tooltip {
                opacity: 1;
                visibility: visible;
                transform: translateX(-50%) translateY(0);
            }
            
            /* 기믹 스프라이트 */
            .gimmick-sprite-container {
                position: relative;
                width: 153px;
                height: 153px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .gimmick-sprite-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 5px rgba(255, 100, 50, 0.5));
            }
            
            /* 기믹 HP 바 */
            .gimmick-hp-wrapper {
                width: 120px;
                margin-top: 5px;
            }
            
            .gimmick-hp-bar-container {
                position: relative;
                width: 100%;
                height: 12px;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 6px;
                border: 1px solid #555;
                overflow: hidden;
            }
            
            .gimmick-hp-bar {
                height: 100%;
                background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
                border-radius: 5px;
                transition: width 0.3s ease;
            }
            
            .gimmick-hp-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 0.65rem;
                font-weight: bold;
                color: white;
                text-shadow: 0 0 3px black;
            }
            
            /* 기믹 이름 */
            .gimmick-name-label {
                font-size: 0.7rem;
                color: #f97316;
                text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
                margin-top: 3px;
                font-weight: bold;
            }
            
            /* 기믹 툴팁 */
            .gimmick-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(10px);
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s;
                z-index: 100;
                border: 1px solid #f97316;
                pointer-events: none;
            }
            
            /* 타겟 가능 상태 */
            .gimmick-targetable {
                filter: brightness(1.5) drop-shadow(0 0 15px rgba(255, 200, 50, 0.8)) !important;
            }
            
            .gimmick-targetable .gimmick-sprite-img {
                animation: gimmickPulse 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes gimmickPulse {
                from { filter: drop-shadow(0 0 10px rgba(255, 150, 50, 0.8)); }
                to { filter: drop-shadow(0 0 20px rgba(255, 200, 100, 1)); }
            }
            
            /* 히트 효과 */
            .gimmick-hit {
                animation: gimmickHit 0.3s ease;
            }
            
            @keyframes gimmickHit {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-8px); }
                75% { transform: translateX(8px); }
            }
            
            /* 파괴 효과 */
            .gimmick-destroyed {
                animation: gimmickDestroy 0.6s ease-out forwards;
            }
            
            @keyframes gimmickDestroy {
                0% { 
                    transform: scale(1);
                    opacity: 1;
                    filter: brightness(2);
                }
                50% {
                    transform: scale(1.3);
                    filter: brightness(3);
                }
                100% { 
                    transform: scale(0);
                    opacity: 0;
                }
            }
            
            /* 폭발 플래시 */
            @keyframes explosionFlash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
};

// 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GimmickSystem.init();
        GimmickSystem.injectStyles();
    });
} else {
    GimmickSystem.init();
    GimmickSystem.injectStyles();
}

// 전역 노출
window.GimmickSystem = GimmickSystem;

console.log('[GimmickSystem] gimmick-system.js 로드 완료');
