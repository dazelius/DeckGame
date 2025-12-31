// ==========================================
// Shadow Deck - 트라이포스 시스템
// ==========================================

const TriforceSystem = {
    // 이번 턴에 사용한 트라이포스
    usedThisTurn: {
        power: false,
        courage: false,
        wisdom: false
    },
    
    // 트라이포스 사용 시 호출
    onTriforceUsed(type, state) {
        this.usedThisTurn[type] = true;
        console.log(`[Triforce] ${type} used!`, this.usedThisTurn);
        
        // 3개 모두 사용했는지 체크
        if (this.usedThisTurn.power && this.usedThisTurn.courage && this.usedThisTurn.wisdom) {
            this.summonMasterSword(state);
        }
    },
    
    // 마스터 소드 소환 (트라이포스 완성 강조)
    summonMasterSword(state) {
        console.log('[Triforce] All three used! Summoning Master Sword!');
        
        // 마스터 소드 카드 생성
        const masterSword = createCard('masterSword');
        if (!masterSword) return;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 1단계: 화면 플래시 + 트라이포스 완성 강조
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'triforce-flash-overlay';
        flashOverlay.innerHTML = `
            <div class="triforce-symbol">▲</div>
            <div class="triforce-text">TRIFORCE COMPLETE</div>
        `;
        document.body.appendChild(flashOverlay);
        
        // 번개 VFX (4방향에서)
        if (typeof VFX !== 'undefined') {
            VFX.lightning(centerX - 300, 0, centerX, centerY, { color: '#ffd700', width: 4 });
            VFX.lightning(centerX + 300, 0, centerX, centerY, { color: '#ffd700', width: 4 });
            setTimeout(() => {
                VFX.lightning(0, centerY - 200, centerX, centerY, { color: '#ffd700', width: 4 });
                VFX.lightning(window.innerWidth, centerY - 200, centerX, centerY, { color: '#ffd700', width: 4 });
            }, 200);
            
            // 충격파 + 스파크
            setTimeout(() => {
                VFX.shockwave(centerX, centerY, { color: '#ffd700', size: 500 });
                VFX.sparks(centerX, centerY, { color: '#ffd700', count: 50, speed: 500 });
                VFX.sparks(centerX, centerY, { color: '#00ff88', count: 30, speed: 400 });
            }, 400);
        }
        
        // 화면 흔들림
        setTimeout(() => {
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(20, 500);
            }
        }, 500);
        
        // 2단계: 페이드아웃 (1.5초 후)
        setTimeout(() => {
            flashOverlay.classList.add('fade-out');
        }, 1500);
        
        // 3단계: 정리 + 손패 렌더링 (2초 후)
        setTimeout(() => {
            // 요소 제거
            flashOverlay.remove();
            
            // 손패에 추가
            const existingCount = gameState.hand.length;
            gameState.hand.push(masterSword);
            
            // 로그
            if (typeof addLog === 'function') {
                addLog('⚔️ 트라이포스 완성! 마스터 소드 획득!', 'special');
            }
            
            // 손패 렌더링
            if (typeof addCardsToHandWithAnimation === 'function') {
                addCardsToHandWithAnimation(existingCount, 1);
            } else if (typeof renderHandWithNewCards === 'function') {
                renderHandWithNewCards(existingCount, 1);
            } else if (typeof renderHand === 'function') {
                renderHand(false);
            }
            
            // 상태 리셋
            this.reset();
        }, 2200);
    },
    
    // 턴 시작 시 리셋
    reset() {
        this.usedThisTurn = {
            power: false,
            courage: false,
            wisdom: false
        };
    },
    
    // 턴 종료 시 호출
    onTurnEnd() {
        this.reset();
    }
};

console.log('[Card Triforce] 트라이포스 시스템 로드됨');

