// ==========================================
// Shadow Deck - 방어도(쉴드) 시스템
// ==========================================

const ShieldSystem = {
    
    // ==========================================
    // 방어도 획득
    // ==========================================
    gainBlock(target, amount) {
        if (!target || amount <= 0) return;
        
        // 필드 효과로 실드 생성량 수정
        let modifiedAmount = amount;
        if (typeof FieldSystem !== 'undefined') {
            modifiedAmount = FieldSystem.modifyBlockGain(amount);
            if (modifiedAmount !== amount) {
                addLog(`필드 효과: 실드 ${amount} → ${modifiedAmount}`, 'field');
            }
        }
        
        // 🔥 도발 디버프: 플레이어 방어도 생성량 감소
        if (target === gameState.player && gameState.player.taunt && gameState.player.taunt > 0) {
            const reduction = Math.floor(modifiedAmount * 0.5); // 50% 감소
            modifiedAmount = modifiedAmount - reduction;
            if (reduction > 0) {
                addLog(`도발! 방어도 -${reduction}`, 'debuff');
            }
        }
        
        if (modifiedAmount <= 0) return;
        
        const previousBlock = target.block || 0;
        target.block = previousBlock + modifiedAmount;
        
        // 방어도 획득 사운드 재생
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.playShield();
        } else {
            try {
                const sound = new Audio('sound/shield.mp3');
                sound.volume = 0.4;
                sound.play().catch(() => {});
            } catch (e) {}
        }
        
        // UI 업데이트 (증가 애니메이션)
        this.updateBlockUI(target, 'gain', amount);
        
        // 캐릭터 색상 플래시 효과 + 파란 외곽선
        const isPlayer = target === gameState.player;
        let targetEl;
        if (isPlayer) {
            targetEl = document.getElementById('player');
            if (targetEl) {
                targetEl.classList.add('block-flash', 'has-block');
                // 🛡️ .player-character에도 추가!
                const playerChar = targetEl.querySelector('.player-character');
                if (playerChar) playerChar.classList.add('has-block');
                setTimeout(() => targetEl.classList.remove('block-flash'), 300);
            }
            // 🎯 PixiJS 플레이어 방어막 효과 + UI 업데이트!
            if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                PlayerRenderer.setBlockEffect(true);
                PlayerRenderer.updatePlayerBlock();
            }
        } else {
            // 🛡️ 적에게도 has-block 클래스 추가!
            if (typeof gameState !== 'undefined' && gameState.enemies) {
                const enemyIndex = gameState.enemies.indexOf(target);
                if (enemyIndex !== -1) {
                    targetEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
                }
            }
            if (!targetEl) {
                targetEl = document.querySelector('.enemy-unit:not(.dead)');
            }
            if (targetEl) {
                targetEl.classList.add('block-flash', 'has-block');
                setTimeout(() => targetEl.classList.remove('block-flash'), 300);
            }
            // 🎯 PixiJS 적 방어막 UI 업데이트!
            if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                EnemyRenderer.updateEnemyBlock(target);
            }
        }
        
        console.log(`[Shield] ${this.getTargetName(target)} 방어도 +${amount} (${previousBlock} -> ${target.block})`);
    },
    
    // ==========================================
    // 데미지 처리 (방어도 먼저 소모)
    // ==========================================
    applyDamage(target, amount) {
        if (!target || amount <= 0) return { 
            blockedDamage: 0, 
            actualDamage: 0,
            overkill: 0 
        };
        
        let remainingDamage = amount;
        let blockedDamage = 0;
        const previousBlock = target.block || 0;
        
        // 1. 방어도로 먼저 데미지 흡수
        if (target.block > 0) {
            blockedDamage = Math.min(target.block, remainingDamage);
            target.block -= blockedDamage;
            remainingDamage -= blockedDamage;
            
            // 방어도 차감 UI 효과
            this.updateBlockUI(target, 'damage', blockedDamage);
            this.showBlockBreakEffect(target, blockedDamage, previousBlock);
            
            // 🎯 PixiJS UI 업데이트!
            const isPlayer = target === gameState.player;
            if (isPlayer) {
                if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                    PlayerRenderer.updatePlayerBlock();
                    if (target.block <= 0) {
                        PlayerRenderer.setBlockEffect(false);
                    }
                }
            } else {
                if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                    EnemyRenderer.updateEnemyBlock(target);
                }
            }
            
            console.log(`[Shield] 방어도로 ${blockedDamage} 데미지 흡수 (${previousBlock} -> ${target.block})`);
        }
        
        // 🌑 플레이어에게 은신이 있으면 남은 데미지 감소
        let stealthReduced = 0;
        if (target === gameState.player && remainingDamage > 0 && typeof StealthSystem !== 'undefined' && StealthSystem.hasStacks()) {
            const stealthResult = StealthSystem.reduceDamage(remainingDamage);
            stealthReduced = stealthResult.reduced;
            remainingDamage = stealthResult.remaining;
            console.log(`[Shield] 은신으로 ${stealthReduced} 피해 회피, 남은 피해: ${remainingDamage}`);
        }
        
        // 2. 남은 데미지를 HP에 적용 (오버킬 계산을 위해 음수 허용)
        const actualDamage = remainingDamage;
        const hpBeforeDamage = target.hp;
        
        // 🔥 이미 죽은 적에게도 데미지 누적 (연타 공격용)
        if (target.hp <= 0) {
            // 이미 죽어있으면 오버킬 데미지만 누적
            target._overkillDamage = (target._overkillDamage || 0) + remainingDamage;
            console.log('[Shield] 🔥 연타 오버킬 누적:', remainingDamage, '→ 총:', target._overkillDamage);
        } else {
            target.hp = target.hp - remainingDamage;  // 음수 허용!
            
            // 오버킬 데미지 저장
            if (target.hp < 0) {
                target._overkillDamage = Math.abs(target.hp);
            }
            
            // 🎬 플레이어 피격 시 카메라 효과
            if (target === gameState.player && remainingDamage > 0) {
                if (typeof CameraEffects !== 'undefined') {
                    // 큰 피해 (10 이상) 시 더 강한 효과
                    if (remainingDamage >= 10) {
                        CameraEffects.triggerHeavyHit();
                    } else {
                        CameraEffects.triggerHitPulse();
                    }
                }
            }
        }
        
        console.log(`[Shield] HP에 ${actualDamage} 데미지 (HP: ${hpBeforeDamage} → ${target.hp})`);
        
        return {
            blockedDamage,
            actualDamage,
            totalDamage: amount,
            remainingHp: target.hp,
            remainingBlock: target.block
        };
    },
    
    // ==========================================
    // 방어도 차감 이펙트
    // ==========================================
    showBlockBreakEffect(target, blockedAmount, previousBlock) {
        const isPlayer = target === gameState.player;
        
        // 다중 적 시스템 지원: 타겟 요소 찾기
        let containerEl = null;
        if (isPlayer) {
            containerEl = document.getElementById('player');
        } else {
            // 적인 경우: gameState.enemies에서 인덱스 찾기
            if (typeof gameState !== 'undefined' && gameState.enemies) {
                const enemyIndex = gameState.enemies.indexOf(target);
                if (enemyIndex !== -1) {
                    containerEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
                }
            }
            // 폴백: 선택된 적 또는 첫 번째 적
            if (!containerEl) {
                if (typeof getSelectedEnemyElement === 'function') {
                    containerEl = getSelectedEnemyElement();
                }
            }
            // 최종 폴백: 기존 방식
            if (!containerEl) {
                containerEl = document.querySelector('.enemy-unit:not(.dead)') || 
                              document.getElementById('enemy');
            }
        }
        
        if (!containerEl) {
            console.warn('[Shield] 방어도 이펙트 표시 실패: 타겟 요소를 찾을 수 없음');
            return;
        }
        
        const rect = containerEl.getBoundingClientRect();
        
        // 방어도 숫자가 튀어나가는 효과
        const blockPopup = document.createElement('div');
        blockPopup.className = 'shield-break-popup';
        blockPopup.innerHTML = `<span class="shield-icon">🛡️</span><span class="shield-value">-${blockedAmount}</span>`;
        blockPopup.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2 - 30}px;
            transform: translate(-50%, -50%);
            z-index: 1000;
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 5px;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 900;
            color: #60a5fa;
            text-shadow: 0 0 10px rgba(96, 165, 250, 0.8), 2px 2px 0 #000;
            animation: shieldBreakPop 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(blockPopup);
        setTimeout(() => blockPopup.remove(), 800);
        
        // 방어도가 완전히 깨졌을 때 추가 이펙트
        if (target.block === 0 && previousBlock > 0) {
            this.showShieldShatterEffect(containerEl);
        } else if (target.block > 0) {
            // 쉴드가 파괴되지 않았으면 보호 VFX + 사운드 재생
            this.playShieldHitSound();
            
            // 🛡️ 보호막 VFX
            if (typeof ShieldBreakVFX !== 'undefined') {
                ShieldBreakVFX.playProtect(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    blockedAmount
                );
            }
        }
        
        // 방패 흔들림 효과
        let blockContainer;
        if (isPlayer) {
            blockContainer = document.getElementById('player-block-container');
        } else {
            // 다중 적: containerEl 내부에서 block-display 찾기
            blockContainer = containerEl ? containerEl.querySelector('.block-display') : null;
            if (!blockContainer) {
                blockContainer = document.getElementById('enemy-block-container');
            }
        }
        if (blockContainer) {
            blockContainer.classList.add('shield-hit');
            setTimeout(() => blockContainer.classList.remove('shield-hit'), 300);
        }
    },
    
    // ==========================================
    // 방어도 완전 파괴 이펙트
    // ==========================================
    showShieldShatterEffect(containerEl) {
        const rect = containerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 🛡️ 방어도 0이 되면 has-block 클래스 제거!
        if (containerEl) {
            containerEl.classList.remove('has-block');
            // .player-character에서도 제거
            const playerChar = containerEl.querySelector('.player-character');
            if (playerChar) playerChar.classList.remove('has-block');
            
            // 🎯 PixiJS 플레이어 방어막 효과 제거!
            const isPlayerEl = containerEl.id === 'player' || containerEl.classList.contains('player-side');
            if (isPlayerEl && typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                PlayerRenderer.setBlockEffect(false);
            }
        }
        
        // 🎬 캔버스 유리창 깨지는 VFX 실행
        if (typeof ShieldBreakVFX !== 'undefined') {
            ShieldBreakVFX.play(centerX, centerY, 1);
        }
        
        // 파편 생성 (캔버스 VFX와 함께)
        for (let i = 0; i < 8; i++) {
            const shard = document.createElement('div');
            const angle = (i / 8) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            
            shard.innerHTML = '◆';
            shard.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                font-size: ${10 + Math.random() * 10}px;
                color: #60a5fa;
                text-shadow: 0 0 10px #60a5fa;
                pointer-events: none;
                z-index: 1000;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
                --rot: ${Math.random() * 360}deg;
                animation: shardFly 0.6s ease-out forwards;
            `;
            
            document.body.appendChild(shard);
            setTimeout(() => shard.remove(), 600);
        }
        
        // "BREAK!" 텍스트
        const breakText = document.createElement('div');
        breakText.textContent = 'BREAK!';
        breakText.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY - 50}px;
            transform: translate(-50%, -50%) scale(0);
            font-family: 'Cinzel', serif;
            font-size: 1.2rem;
            font-weight: 900;
            color: #fbbf24;
            text-shadow: 0 0 10px #fbbf24, 2px 2px 0 #000;
            pointer-events: none;
            z-index: 1001;
            animation: breakTextPop 0.6s ease-out forwards;
        `;
        
        document.body.appendChild(breakText);
        setTimeout(() => breakText.remove(), 600);
    },
    
    // ==========================================
    // 턴 시작 시 방어도 초기화
    // ==========================================
    resetBlockOnTurnStart(target) {
        if (!target) return 0;
        
        const previousBlock = target.block || 0;
        
        if (previousBlock > 0) {
            // 방어도 소멸 이펙트
            this.showBlockFadeEffect(target, previousBlock);
            target.block = 0;
            this.updateBlockUI(target, 'reset');
            
            // 🛡️ has-block 클래스 제거!
            const isPlayer = target === gameState.player;
            let targetEl;
            if (isPlayer) {
                targetEl = document.getElementById('player');
                if (targetEl) {
                    targetEl.classList.remove('has-block');
                    // 🛡️ .player-character에서도 제거!
                    const playerChar = targetEl.querySelector('.player-character');
                    if (playerChar) playerChar.classList.remove('has-block');
                }
                // 🎯 PixiJS 플레이어 방어막 효과 제거!
                if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                    PlayerRenderer.setBlockEffect(false);
                }
            } else {
                if (typeof gameState !== 'undefined' && gameState.enemies) {
                    const enemyIndex = gameState.enemies.indexOf(target);
                    if (enemyIndex !== -1) {
                        targetEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
                    }
                }
                if (!targetEl) {
                    targetEl = document.querySelector('.enemy-unit:not(.dead)');
                }
                if (targetEl) {
                    targetEl.classList.remove('has-block');
                }
            }
            
            console.log(`[Shield] ${this.getTargetName(target)} 방어도 소멸 (${previousBlock} -> 0)`);
        }
        
        return previousBlock;
    },
    
    // ==========================================
    // 방어도 소멸 이펙트
    // ==========================================
    showBlockFadeEffect(target, amount) {
        const isPlayer = target === gameState.player;
        const containerEl = document.getElementById(isPlayer ? 'player' : 'enemy');
        
        if (!containerEl) return;
        
        const rect = containerEl.getBoundingClientRect();
        
        // 소멸 텍스트
        const fadeText = document.createElement('div');
        fadeText.innerHTML = `🛡️ <span style="text-decoration: line-through; opacity: 0.6;">${amount}</span>`;
        fadeText.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            transform: translate(-50%, -50%);
            font-family: 'Cinzel', serif;
            font-size: 1.2rem;
            color: #94a3b8;
            pointer-events: none;
            z-index: 1000;
            animation: blockFade 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(fadeText);
        setTimeout(() => fadeText.remove(), 800);
    },
    
    // ==========================================
    // 방어도 UI 업데이트
    // ==========================================
    updateBlockUI(target, action = 'update', amount = 0) {
        const isPlayer = target === gameState.player;
        const containerEl = document.getElementById(isPlayer ? 'player-block-container' : 'enemy-block-container');
        const valueEl = document.getElementById(isPlayer ? 'player-block' : 'enemy-block');
        
        if (!containerEl || !valueEl) return;
        
        if (target.block > 0) {
            containerEl.classList.add('visible');
            valueEl.textContent = target.block;
            
            // 액션에 따른 애니메이션
            valueEl.classList.remove('block-gain', 'block-damage', 'block-reset');
            void valueEl.offsetWidth; // Reflow
            
            switch(action) {
                case 'gain':
                    valueEl.classList.add('block-gain');
                    break;
                case 'damage':
                    valueEl.classList.add('block-damage');
                    break;
            }
        } else {
            containerEl.classList.remove('visible');
        }
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    getBlock(target) {
        return target?.block || 0;
    },
    
    hasBlock(target) {
        return (target?.block || 0) > 0;
    },
    
    // ==========================================
    // 쉴드 피격 사운드
    // ==========================================
    playShieldHitSound() {
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.playShieldHit();
        } else {
            try {
                const sound = new Audio('sound/shield_hit.mp3');
                sound.volume = 0.5;
                sound.play().catch(() => {});
            } catch (e) {}
        }
    },
    
    getTargetName(target) {
        if (target === gameState.player) return '플레이어';
        if (target === gameState.enemy) return gameState.enemy.name;
        return '알 수 없음';
    }
};

// ==========================================
// 전역 헬퍼 함수 (기존 코드 호환성)
// ==========================================

// 방어도 획득
function gainBlock(target, amount) {
    ShieldSystem.gainBlock(target, amount);
}

// ==========================================
// CSS 애니메이션 추가
// ==========================================
const shieldStyles = document.createElement('style');
shieldStyles.id = 'shield-system-styles';
shieldStyles.textContent = `
    /* 방어도 획득 애니메이션 */
    .block-gain {
        animation: blockGainPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
    
    @keyframes blockGainPop {
        0% { transform: scale(1); color: #60a5fa; }
        50% { transform: scale(1.5); color: #93c5fd; text-shadow: 0 0 20px #60a5fa; }
        100% { transform: scale(1); color: white; }
    }
    
    /* 방어도 피해 애니메이션 */
    .block-damage {
        animation: blockDamageShake 0.4s ease-out !important;
    }
    
    @keyframes blockDamageShake {
        0%, 100% { transform: translateX(0); color: white; }
        20% { transform: translateX(-5px); color: #f87171; }
        40% { transform: translateX(5px); color: #fbbf24; }
        60% { transform: translateX(-3px); color: #f87171; }
        80% { transform: translateX(3px); color: white; }
    }
    
    /* 방패 피격 효과 */
    .shield-hit {
        animation: shieldHitShake 0.3s ease-out !important;
    }
    
    @keyframes shieldHitShake {
        0%, 100% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(0.9) rotate(-10deg); }
        50% { transform: scale(1.1) rotate(5deg); }
        75% { transform: scale(0.95) rotate(-3deg); }
    }
    
    /* 방어도 차감 팝업 */
    @keyframes shieldBreakPop {
        0% { 
            transform: translate(-50%, -50%) scale(0.5); 
            opacity: 1; 
        }
        30% { 
            transform: translate(-50%, -50%) scale(1.2); 
            opacity: 1; 
        }
        100% { 
            transform: translate(-50%, calc(-50% - 40px)) scale(0.8); 
            opacity: 0; 
        }
    }
    
    /* 파편 날아가는 효과 */
    @keyframes shardFly {
        0% { 
            transform: translate(-50%, -50%) scale(1) rotate(0deg); 
            opacity: 1; 
        }
        100% { 
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0) rotate(var(--rot)); 
            opacity: 0; 
        }
    }
    
    /* BREAK 텍스트 */
    @keyframes breakTextPop {
        0% { 
            transform: translate(-50%, -50%) scale(0); 
            opacity: 0; 
        }
        30% { 
            transform: translate(-50%, -50%) scale(1.3); 
            opacity: 1; 
        }
        100% { 
            transform: translate(-50%, calc(-50% - 30px)) scale(1); 
            opacity: 0; 
        }
    }
    
    /* 방어도 소멸 효과 */
    @keyframes blockFade {
        0% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 1; 
        }
        100% { 
            transform: translate(-50%, calc(-50% - 30px)) scale(0.7); 
            opacity: 0; 
        }
    }
    
    /* 방어도 표시 개선 */
    .block-display {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .block-display.visible {
        animation: blockAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    @keyframes blockAppear {
        0% { transform: scale(0) rotate(-15deg); opacity: 0; }
        60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    .block-shield {
        position: relative;
        transition: transform 0.2s ease;
    }
    
    .block-shield:hover {
        transform: scale(1.1);
    }
    
    .block-shield::after {
        content: '';
        position: absolute;
        inset: -3px;
        background: linear-gradient(135deg, rgba(96, 165, 250, 0.4) 0%, transparent 50%);
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        animation: shieldShine 2s infinite;
    }
    
    @keyframes shieldShine {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
    
    /* 방어도 값 기본 스타일 */
    .block-value {
        transition: transform 0.2s ease, color 0.2s ease;
    }
`;

// 스타일이 없으면 추가
if (!document.getElementById('shield-system-styles')) {
    document.head.appendChild(shieldStyles);
}

// 전역 등록
window.ShieldSystem = ShieldSystem;
window.gainBlock = gainBlock;

console.log('[ShieldSystem] 방어도 시스템 로드 완료');
