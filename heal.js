// ==========================================
// 힐 연출 시스템
// HP 바가 하얗게 빛나며 치료량만큼 늘어나는 애니메이션
// ==========================================

const HealSystem = {
    
    // ==========================================
    // 적 힐 연출
    // ==========================================
    animateEnemyHeal(enemy, enemyIndex, healAmount) {
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        if (!enemyEl) return;
        
        const hpBar = enemyEl.querySelector('.enemy-hp-bar');
        const hpText = enemyEl.querySelector('.enemy-hp-text');
        if (!hpBar) return;
        
        const prevHp = enemy.hp - healAmount; // 힐 전 HP
        const prevPercent = Math.max(0, (prevHp / enemy.maxHp) * 100);
        const newPercent = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
        
        // 🎬 GSAP 애니메이션
        if (typeof gsap !== 'undefined') {
            // 1. 프리뷰 바 생성 (흰색으로 빛나는 부분)
            const hpBarContainer = hpBar.parentElement;
            let previewBar = hpBarContainer.querySelector('.heal-preview-bar');
            
            if (!previewBar) {
                previewBar = document.createElement('div');
                previewBar.className = 'heal-preview-bar';
                previewBar.style.cssText = `
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    background: linear-gradient(90deg, 
                        rgba(255, 255, 255, 0.9), 
                        rgba(74, 222, 128, 0.8),
                        rgba(255, 255, 255, 0.9));
                    border-radius: inherit;
                    z-index: 1;
                    box-shadow: 0 0 15px rgba(74, 222, 128, 0.8), 
                                0 0 30px rgba(255, 255, 255, 0.5);
                `;
                hpBarContainer.style.position = 'relative';
                hpBarContainer.appendChild(previewBar);
            }
            
            // 현재 HP 바 위치 설정
            hpBar.style.width = `${prevPercent}%`;
            previewBar.style.width = `${prevPercent}%`;
            previewBar.style.opacity = '1';
            
            // 🧹 기존 애니메이션 정리 후 타임라인 생성
            gsap.killTweensOf(hpBar);
            gsap.killTweensOf(previewBar);
            const tl = gsap.timeline();
            
            // 1단계: 프리뷰 바가 먼저 빠르게 확장 (흰색 빛)
            tl.to(previewBar, {
                width: `${newPercent}%`,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            // 2단계: 실제 HP 바가 뒤따라 확장
            tl.to(hpBar, {
                width: `${newPercent}%`,
                duration: 0.5,
                ease: 'power1.out',
                onUpdate: function() {
                    // HP 텍스트 업데이트
                    const progress = this.progress();
                    const currentHp = Math.round(prevHp + (enemy.hp - prevHp) * progress);
                    if (hpText) hpText.textContent = `${Math.max(0, currentHp)}/${enemy.maxHp}`;
                }
            }, '-=0.3'); // 0.3초 겹침
            
            // 3단계: 프리뷰 바 페이드아웃
            tl.to(previewBar, {
                opacity: 0,
                duration: 0.3,
                ease: 'power1.out',
                onComplete: () => {
                    previewBar.remove();
                }
            }, '-=0.2');
            
            // HP 바 빛나는 효과
            gsap.to(hpBar, {
                boxShadow: '0 0 20px rgba(74, 222, 128, 1), 0 0 40px rgba(255, 255, 255, 0.8)',
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: 'power1.inOut'
            });
            
            // 스프라이트 초록빛 플래시
            const sprite = enemyEl.querySelector('.enemy-sprite-img');
            if (sprite) {
                gsap.to(sprite, {
                    filter: 'brightness(1.4) sepia(0.3) saturate(1.5) hue-rotate(80deg)',
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power1.inOut',
                    onComplete: () => {
                        gsap.set(sprite, { filter: '' });
                    }
                });
            }
            
        } else {
            // GSAP 없으면 기본 처리
            hpBar.style.transition = 'width 0.5s ease-out';
            hpBar.style.width = `${newPercent}%`;
            if (hpText) hpText.textContent = `${enemy.hp}/${enemy.maxHp}`;
        }
        
        // 힐 파티클 VFX
        if (typeof VFX !== 'undefined') {
            const rect = enemyEl.getBoundingClientRect();
            VFX.heal(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                color: '#4ade80',
                count: 15
            });
        }
    },
    
    // ==========================================
    // 플레이어 힐 연출
    // ==========================================
    animatePlayerHeal(player, healAmount) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const hpBar = document.getElementById('player-hp-bar') || playerEl.querySelector('.hp-bar');
        const hpText = document.getElementById('player-hp-text') || playerEl.querySelector('.hp-text');
        if (!hpBar) return;
        
        const prevHp = player.hp - healAmount;
        const prevPercent = Math.max(0, (prevHp / player.maxHp) * 100);
        const newPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        
        if (typeof gsap !== 'undefined') {
            // 프리뷰 바 생성
            const hpBarContainer = hpBar.parentElement;
            let previewBar = hpBarContainer.querySelector('.heal-preview-bar');
            
            if (!previewBar) {
                previewBar = document.createElement('div');
                previewBar.className = 'heal-preview-bar';
                previewBar.style.cssText = `
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    background: linear-gradient(90deg, 
                        rgba(255, 255, 255, 0.9), 
                        rgba(74, 222, 128, 0.8),
                        rgba(255, 255, 255, 0.9));
                    border-radius: inherit;
                    z-index: 1;
                    box-shadow: 0 0 15px rgba(74, 222, 128, 0.8), 
                                0 0 30px rgba(255, 255, 255, 0.5);
                `;
                hpBarContainer.style.position = 'relative';
                hpBarContainer.appendChild(previewBar);
            }
            
            hpBar.style.width = `${prevPercent}%`;
            previewBar.style.width = `${prevPercent}%`;
            previewBar.style.opacity = '1';
            
            // 🧹 기존 애니메이션 정리 후 타임라인 생성
            gsap.killTweensOf(hpBar);
            gsap.killTweensOf(previewBar);
            const tl = gsap.timeline();
            
            tl.to(previewBar, {
                width: `${newPercent}%`,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            tl.to(hpBar, {
                width: `${newPercent}%`,
                duration: 0.5,
                ease: 'power1.out',
                onUpdate: function() {
                    const progress = this.progress();
                    const currentHp = Math.round(prevHp + (player.hp - prevHp) * progress);
                    if (hpText) hpText.textContent = `${Math.max(0, currentHp)}/${player.maxHp}`;
                }
            }, '-=0.3');
            
            tl.to(previewBar, {
                opacity: 0,
                duration: 0.3,
                ease: 'power1.out',
                onComplete: () => {
                    previewBar.remove();
                }
            }, '-=0.2');
            
            // HP 바 빛나는 효과
            gsap.to(hpBar, {
                boxShadow: '0 0 20px rgba(74, 222, 128, 1), 0 0 40px rgba(255, 255, 255, 0.8)',
                duration: 0.2,
                yoyo: true,
                repeat: 1
            });
            
            // 플레이어 스프라이트 플래시
            const sprite = playerEl.querySelector('.hero-sprite');
            if (sprite) {
                gsap.to(sprite, {
                    filter: 'brightness(1.4) sepia(0.3) saturate(1.5) hue-rotate(80deg)',
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        gsap.set(sprite, { filter: '' });
                    }
                });
            }
            
        } else {
            hpBar.style.transition = 'width 0.5s ease-out';
            hpBar.style.width = `${newPercent}%`;
            if (hpText) hpText.textContent = `${player.hp}/${player.maxHp}`;
        }
        
        // 힐 파티클
        if (typeof VFX !== 'undefined') {
            const rect = playerEl.getBoundingClientRect();
            VFX.heal(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                color: '#4ade80',
                count: 20
            });
        }
    },
    
    // ==========================================
    // 힐 팝업 표시
    // ==========================================
    showHealPopup(targetEl, amount) {
        if (!targetEl) return;
        
        const popup = document.createElement('div');
        popup.className = 'heal-popup';
        popup.textContent = `+${amount}`;
        popup.style.cssText = `
            position: absolute;
            left: 50%;
            top: 30%;
            transform: translateX(-50%);
            color: #4ade80;
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(74, 222, 128, 0.8),
                         0 0 20px rgba(74, 222, 128, 0.6),
                         2px 2px 0 rgba(0, 0, 0, 0.5);
            z-index: 1000;
            pointer-events: none;
            animation: healPopupAnim 1.2s ease-out forwards;
        `;
        
        targetEl.style.position = 'relative';
        targetEl.appendChild(popup);
        
        setTimeout(() => popup.remove(), 1200);
    }
};

// ==========================================
// CSS 애니메이션 추가
// ==========================================
const healStyles = document.createElement('style');
healStyles.id = 'heal-system-styles';
healStyles.textContent = `
    @keyframes healPopupAnim {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.5);
        }
        20% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1.2);
        }
        40% {
            transform: translateX(-50%) translateY(-10px) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-40px) scale(0.8);
        }
    }
    
    .heal-preview-bar {
        animation: healBarGlow 0.5s ease-in-out;
    }
    
    @keyframes healBarGlow {
        0%, 100% {
            filter: brightness(1);
        }
        50% {
            filter: brightness(1.5);
        }
    }
`;

if (!document.getElementById('heal-system-styles')) {
    document.head.appendChild(healStyles);
}

// 전역 등록
window.HealSystem = HealSystem;

console.log('[HealSystem] 힐 연출 시스템 로드 완료');
