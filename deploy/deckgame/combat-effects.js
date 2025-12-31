// ==========================================
// Combat Effects System
// 전투 이펙트 시스템
// ==========================================

const CombatEffects = {
    // 히어로 슬래시 애니메이션
    playHeroSlash(hitCount = 1, hitInterval = 150, atImpactPosition = false) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;

        const targetEnemy = getSelectedEnemyElement();
        const heroImg = playerEl.querySelector('img:not(.hero-slash-effect)');

        // 기존 히어로 이미지 숨기기
        if (heroImg) {
            heroImg.style.opacity = '0';
        }

        let currentHit = 0;
        const animDuration = 120;

        // 몸통박치기 임팩트 위치 오프셋
        const impactOffset = atImpactPosition ? 150 : 0;

        const doSingleSlash = () => {
            if (currentHit >= hitCount) {
                setTimeout(() => {
                    if (heroImg) {
                        heroImg.style.opacity = '1';
                    }
                    playerEl.classList.remove('attacking');
                }, animDuration);
                return;
            }

            // 슬래시 이미지 생성 (직업별 스프라이트 사용)
            const slash = document.createElement('img');
            slash.src = (typeof JobSystem !== 'undefined') ? JobSystem.getCurrentSlashSprite() : 'hero_slash.png';
            slash.className = 'hero-slash-effect';
            
            // 슬래시 스프라이트 스케일 가져오기
            const slashScale = (typeof JobSystem !== 'undefined') ? JobSystem.getCurrentSlashSpriteScale() : 1.0;

            playerEl.style.position = 'relative';
            slash.style.cssText = `
                position: absolute;
                left: calc(50% + ${impactOffset}px);
                top: 50%;
                --slash-scale: ${slashScale};
                transform: translate(-50%, -50%) scale(${slashScale});
                transform-origin: center center;
                width: 140%;
                height: auto;
                z-index: 15;
                pointer-events: none;
                image-rendering: pixelated;
                animation: heroSlashAnim ${animDuration}ms ease-out forwards;
            `;

            playerEl.appendChild(slash);

            // 공격 모션
            playerEl.classList.remove('attacking');
            void playerEl.offsetWidth;
            playerEl.classList.add('attacking');

            // 히트 스파크
            if (targetEnemy) {
                const enemyRect = targetEnemy.getBoundingClientRect();
                setTimeout(() => {
                    this.showHitSpark(enemyRect);
                }, 50);
            }

            // 슬래시 이미지 정리
            setTimeout(() => {
                slash.remove();
            }, animDuration);

            currentHit++;

            if (currentHit < hitCount) {
                setTimeout(doSingleSlash, hitInterval);
            } else {
                setTimeout(() => {
                    if (heroImg) {
                        heroImg.style.opacity = '1';
                    }
                    playerEl.classList.remove('attacking');
                }, animDuration);
            }
        };

        doSingleSlash();
    },

    // 히트 스파크 효과
    showHitSpark(targetRect) {
        const spark = document.createElement('div');
        spark.className = 'hit-spark';
        spark.innerHTML = '💥';
        spark.style.cssText = `
            position: fixed;
            left: ${targetRect.left + targetRect.width / 2}px;
            top: ${targetRect.top + targetRect.height / 3}px;
            transform: translate(-50%, -50%) scale(0);
            font-size: 3rem;
            z-index: 1001;
            pointer-events: none;
            animation: hitSparkAnim 0.3s ease-out forwards;
        `;

        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 300);
    },

    // 소멸 카드 이펙트
    showEtherealEffect(card) {
        const popup = document.createElement('div');
        popup.innerHTML = `${card.icon} <span style="color: #a78bfa;">소멸</span>`;
        popup.style.cssText = `
            position: fixed;
            left: 50%;
            bottom: 250px;
            transform: translateX(-50%);
            font-size: 1.2rem;
            color: #c4b5fd;
            text-shadow: 0 0 10px rgba(167, 139, 250, 0.8);
            pointer-events: none;
            z-index: 1000;
            animation: etherealFade 1s ease-out forwards;
        `;

        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    },

    // 슬라임 분열 이펙트
    showSplitEffect() {
        const container = document.getElementById('enemies-container');
        if (!container) return;

        const flash = document.createElement('div');
        flash.className = 'split-flash';
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%);
            z-index: 50;
            animation: splitFlash 0.5s ease-out forwards;
            pointer-events: none;
        `;

        container.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    },

    // 부활 이펙트
    showReviveEffect() {
        const container = document.getElementById('enemies-container');
        if (!container) return;

        const flash = document.createElement('div');
        flash.className = 'revive-flash';
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(34, 197, 94, 0.5) 0%, transparent 70%);
            z-index: 50;
            animation: splitFlash 0.5s ease-out forwards;
            pointer-events: none;
        `;

        container.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    },

    // 실명 이펙트
    showBlindEffect(enemyEl, playerEl) {
        // 적에서 플레이어로 날아가는 연기 효과
        if (enemyEl && playerEl) {
            const enemyRect = enemyEl.getBoundingClientRect();
            const playerRect = playerEl.getBoundingClientRect();

            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const smoke = document.createElement('div');
                    smoke.className = 'blind-smoke';
                    smoke.innerHTML = '💨';
                    smoke.style.cssText = `
                        position: fixed;
                        left: ${enemyRect.left + enemyRect.width / 2}px;
                        top: ${enemyRect.top + enemyRect.height / 2}px;
                        font-size: 2rem;
                        z-index: 1000;
                        pointer-events: none;
                        opacity: 0.8;
                        transition: all 0.6s ease-out;
                    `;
                    document.body.appendChild(smoke);

                    requestAnimationFrame(() => {
                        smoke.style.left = `${playerRect.left + playerRect.width / 2 + (Math.random() - 0.5) * 50}px`;
                        smoke.style.top = `${playerRect.top + playerRect.height / 3}px`;
                        smoke.style.opacity = '0';
                        smoke.style.transform = 'scale(1.5)';
                    });

                    setTimeout(() => smoke.remove(), 700);
                }, i * 100);
            }
        }

        // 플레이어 화면 흔들림
        if (playerEl) {
            playerEl.classList.add('blinded');
            setTimeout(() => playerEl.classList.remove('blinded'), 500);
        }
    },

    // 플레이어 취약 이펙트
    showPlayerVulnerableEffect() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;

        const effect = document.createElement('div');
        effect.className = 'vulnerable-flash';
        effect.innerHTML = '💔';
        effect.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 2rem;
            z-index: 100;
            animation: vulnerableFlash 0.8s ease-out forwards;
            pointer-events: none;
        `;

        playerEl.appendChild(effect);
        setTimeout(() => effect.remove(), 800);
    },

    // 거미줄 카드 날아가는 연출 - CardAnimation 시스템 사용
    showWebCardAnimation(count, sourceName) {
        const enemyEl = document.querySelector('.enemy-unit.selected') || document.querySelector('.enemy-unit');
        
        // CardAnimation 시스템 사용 (card-animation.js의 showWebCardToDraw 호출)
        if (typeof showWebCardToDraw === 'function') {
            showWebCardToDraw(enemyEl, count);
        } else {
            console.warn('[CombatEffects] showWebCardToDraw not available');
        }
    },
    
    // 차크람 되돌아오기 카드가 Draw 덱으로 들어가는 연출 - CardAnimation 시스템 사용
    showChakramReturnAnimation(count = 1) {
        const enemyEl = document.querySelector('.enemy-unit.selected') || document.querySelector('.enemy-unit');
        
        // CardAnimation 시스템 사용 (card-animation.js의 showChakramCardToDraw 호출)
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (typeof showChakramCardToDraw === 'function') {
                    showChakramCardToDraw(enemyEl);
                } else {
                    console.warn('[CombatEffects] showChakramCardToDraw not available');
                }
            }, i * 200);
        }
    },

    // 요소 흔들기
    shakeElement(el) {
        if (!el) return;
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'hitShake 0.3s ease';
    },

    // 미니언 도주 연출
    triggerMinionsEscape(minions) {
        minions.forEach((minion, idx) => {
            const minionEl = document.querySelector(`.enemy-unit[data-index="${gameState.enemies.indexOf(minion)}"]`);
            if (minionEl) {
                // 공포 대사
                setTimeout(() => {
                    this.showEscapeSpeech(minionEl, minion.name, 'fear');
                }, idx * 300);

                // 도주 애니메이션
                setTimeout(() => {
                    minionEl.classList.add('escaping');
                    minion.hp = 0;
                    minion.escaped = true;
                }, idx * 300 + 800);
            }
        });

        // 전체 도주 완료 후 승리 메시지
        setTimeout(() => {
            this.showEscapeMessage();

            setTimeout(() => {
                updateEnemiesUI();
                checkAllEnemiesDefeated();
            }, 1500);
        }, minions.length * 300 + 1500);
    },

    // 도주 대사 표시
    showEscapeSpeech(enemyEl, name, type = 'escape') {
        const speeches = {
            fear: ['으악! 대장이...!', '도, 도망쳐!', '살려줘!', '무서워...!'],
            escape: ['도망가자!', '철수다!', '퇴각!']
        };

        const lines = speeches[type] || speeches.escape;
        const line = lines[Math.floor(Math.random() * lines.length)];

        const bubble = document.createElement('div');
        bubble.className = 'escape-speech';
        bubble.innerHTML = line;
        bubble.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'fear' ? '#fef3c7' : 'white'};
            color: ${type === 'fear' ? '#92400e' : '#333'};
            padding: 8px 15px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: bold;
            white-space: nowrap;
            z-index: 100;
            animation: speechBubble ${type === 'fear' ? '1.5s' : '1.2s'} ease-out forwards;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        `;
        enemyEl.appendChild(bubble);
        setTimeout(() => bubble.remove(), type === 'fear' ? 1500 : 1200);
    },

    // 도주 메시지
    showEscapeMessage() {
        const msg = document.createElement('div');
        msg.className = 'escape-message';
        msg.innerHTML = '🏃 나머지 적들이 도망쳤습니다!';
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fbbf24;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 1000;
            animation: escapeMsgAnim 2s ease-out forwards;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }
};

// 하위 호환성을 위한 전역 함수
function playHeroSlashAnimation(hitCount = 1, hitInterval = 150, atImpactPosition = false) {
    CombatEffects.playHeroSlash(hitCount, hitInterval, atImpactPosition);
}

function showHitSpark(targetRect) {
    CombatEffects.showHitSpark(targetRect);
}

function showEtherealEffect(card) {
    CombatEffects.showEtherealEffect(card);
}

function showSplitEffect() {
    CombatEffects.showSplitEffect();
}

function showReviveEffect() {
    CombatEffects.showReviveEffect();
}

function showBlindEffect(enemyEl, playerEl) {
    CombatEffects.showBlindEffect(enemyEl, playerEl);
}

function showPlayerVulnerableEffect() {
    CombatEffects.showPlayerVulnerableEffect();
}

function showWebCardAnimation(count, sourceName) {
    CombatEffects.showWebCardAnimation(count, sourceName);
}

function showChakramReturnAnimation(count = 1) {
    CombatEffects.showChakramReturnAnimation(count);
}

function shakeElement(el) {
    CombatEffects.shakeElement(el);
}

function triggerMinionsEscape(minions) {
    CombatEffects.triggerMinionsEscape(minions);
}

function showEscapeSpeech(enemyEl, name, type) {
    CombatEffects.showEscapeSpeech(enemyEl, name, type);
}

function showEscapeMessage() {
    CombatEffects.showEscapeMessage();
}

console.log('[CombatEffects] 로드 완료');

