// ==========================================
// 가챠 이벤트 전용 카드
// ==========================================

const GachaCards = {
    // 신비한 무녀의 부름
    mysticMaidenCall: {
        id: 'mysticMaidenCall',
        name: '신비한 무녀의 부름',
        type: CardType.SKILL,
        rarity: Rarity.LEGENDARY,
        cost: 0,
        isEthereal: true, // 소멸
        icon: '🔮',
        description: '랜덤 카드 <span class="draw">10장</span>을 생성하여 패에 추가합니다.<br><span class="ethereal">소멸</span>',
        effect: async (state) => {
            const playerEl = document.getElementById('player');
            
            // 가챠 스타일 연출 (강화)
            await GachaCardVFX.playMysticDraw(playerEl);
            
            // 잠시 대기 후 카드 생성 시작
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 카드 데이터베이스에서 랜덤 10장 생성
            const drawnCards = GachaCardVFX.drawRandomFromDatabase(10);
            
            if (drawnCards.length > 0) {
                addLog(`신비한 무녀의 부름! ${drawnCards.length}장 생성!`, 'special');
            } else {
                addLog('카드를 생성할 수 없습니다!', 'warning');
            }
            
            // 모든 카드가 추가될 때까지 대기
            await new Promise(resolve => setTimeout(resolve, drawnCards.length * 150 + 500));
        }
    }
};

// ==========================================
// 가챠 카드 VFX
// ==========================================
const GachaCardVFX = {
    // 핸드 스케일 자동 조정 (카드 수에 따라 부채꼴 배치, 축소 없이 겹침으로만)
    adjustHandScale() {
        const hand = document.getElementById('hand');
        if (!hand) return;
        
        const cards = hand.querySelectorAll('.card');
        const cardCount = cards.length;
        
        if (cardCount === 0) return;
        
        // 화면 너비
        const screenWidth = window.innerWidth;
        const baseCardWidth = 140;
        
        // 카드가 많을수록 더 많이 겹침 (스케일 축소 없이)
        // 기본 5장까지는 겹침 없음, 이후 카드당 겹침 증가
        let overlap = 0;
        
        if (cardCount > 5) {
            // 5장 초과 시 겹침 시작 - 더 강하게 겹침
            // 카드가 많을수록 기하급수적으로 겹침 증가
            overlap = Math.min(120, 40 + (cardCount - 5) * 12);
        }
        
        // 부채꼴 배치 계산 - 카드가 많을수록 각도 줄임 (더 촘촘하게)
        const maxRotation = Math.max(20, Math.min(40, 60 - cardCount * 2));
        const baseRotation = cardCount > 1 ? -maxRotation / 2 : 0;
        const rotationStep = cardCount > 1 ? maxRotation / (cardCount - 1) : 0;
        
        cards.forEach((card, index) => {
            // 회전 계산
            const rotation = baseRotation + (rotationStep * index);
            
            // Y 오프셋 (가운데가 낮고 양쪽이 높음)
            const centerIndex = (cardCount - 1) / 2;
            const distanceFromCenter = Math.abs(index - centerIndex);
            const yOffset = distanceFromCenter * 6;
            
            // 오버랩 (marginLeft) - 첫 카드 제외
            if (index > 0 && overlap > 0) {
                card.style.marginLeft = `-${overlap}px`;
            } else {
                card.style.marginLeft = '';
            }
            
            // 트랜스폼 적용 (부채꼴, 스케일은 1 고정)
            card.style.transform = `rotate(${rotation}deg) translateY(${yOffset}px)`;
            card.style.transformOrigin = 'center bottom';
            
            // z-index (왼쪽에서 오른쪽으로 패닝 - 오른쪽 카드가 앞)
            card.style.zIndex = index + 1;
        });
        
        // 핸드 컨테이너 스타일
        hand.style.display = 'flex';
        hand.style.justifyContent = 'center';
        hand.style.alignItems = 'flex-end';
    },
    
    // 카드 데이터베이스에서 랜덤 카드 생성하여 핸드에 추가 (애니메이션 포함)
    drawRandomFromDatabase(count) {
        const drawnCards = [];
        
        if (typeof cardDatabase === 'undefined') {
            console.error('[GachaCard] cardDatabase가 없습니다');
            return drawnCards;
        }
        
        // 제외할 카드 (특수 카드, 저주 등)
        const excludeIds = [
            'mysticMaidenCall', // 자기 자신
            'wound', 'burn', 'dazed', 'slimed', 'void', // 상태이상 카드
            'russianRoulette', 'towardsTheEnemy', // 특수 카드
        ];
        
        // 사용 가능한 카드 풀 생성
        const cardPool = [];
        Object.entries(cardDatabase).forEach(([id, card]) => {
            // 제외 목록에 없고, 기본 정보가 있는 카드만
            if (!excludeIds.includes(id) && 
                card.name && 
                card.cost !== undefined &&
                !id.startsWith('curse_')) {
                cardPool.push({ id, ...card });
            }
        });
        
        if (cardPool.length === 0) {
            console.error('[GachaCard] 사용 가능한 카드가 없습니다');
            return drawnCards;
        }
        
        // 랜덤 카드 선택 (중복 허용)
        for (let i = 0; i < count; i++) {
            const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
            
            // 새 카드 인스턴스 생성
            const newCard = {
                ...randomCard,
                instanceId: `${randomCard.id}_gacha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            drawnCards.push(newCard);
        }
        
        // 카드 하나씩 애니메이션과 함께 추가
        drawnCards.forEach((card, index) => {
            setTimeout(() => {
                // 핸드에 추가
                if (typeof gameState !== 'undefined') {
                    if (!gameState.hand) gameState.hand = [];
                    gameState.hand.push(card);
                }
                
                // 드로우 애니메이션
                if (typeof CardAnimation !== 'undefined') {
                    const cardType = card.type === 'attack' || card.type?.id === 'attack' ? 'attack' : 
                                    card.type === 'skill' || card.type?.id === 'skill' ? 'skill' : 
                                    card.type === 'power' || card.type?.id === 'power' ? 'power' : 'skill';
                    
                    CardAnimation.drawToHand({
                        cost: card.cost || 0,
                        cardType: cardType,
                        icon: card.icon || '🃏',
                        name: card.name || '카드',
                        description: card.description || ''
                    });
                }
                
                // VFX
                if (typeof VFX !== 'undefined') {
                    const handEl = document.getElementById('hand');
                    if (handEl) {
                        const rect = handEl.getBoundingClientRect();
                        VFX.sparks(rect.left + rect.width / 2, rect.top, {
                            color: '#ff69b4',
                            count: 10,
                            speed: 8,
                            size: 4
                        });
                    }
                }
                
                // 핸드 렌더링 (renderHand 사용)
                if (typeof renderHand === 'function') {
                    renderHand(false);
                } else if (typeof HandManager !== 'undefined' && HandManager.renderHand) {
                    HandManager.renderHand(false);
                }
                
                // 핸드 스케일 조정
                GachaCardVFX.adjustHandScale();
                
                // 마지막 카드일 때 추가 업데이트
                if (index === drawnCards.length - 1) {
                    setTimeout(() => {
                        // 강제 핸드 리렌더링
                        if (typeof renderHand === 'function') {
                            renderHand(false);
                        }
                        // 덱/버린 카드 카운트 업데이트
                        if (typeof updatePileCounts === 'function') {
                            updatePileCounts();
                        }
                        // 최종 스케일 조정
                        GachaCardVFX.adjustHandScale();
                        
                        // ResponsiveSystem 업데이트
                        if (typeof ResponsiveSystem !== 'undefined' && ResponsiveSystem.applyResponsiveLayout) {
                            ResponsiveSystem.applyResponsiveLayout();
                        }
                        
                        console.log(`[GachaCard] ${drawnCards.length}장의 랜덤 카드 생성 완료`);
                    }, 200);
                }
            }, index * 150); // 150ms 간격으로 카드 추가
        });
        
        console.log(`[GachaCard] ${drawnCards.length}장의 랜덤 카드 생성:`, drawnCards.map(c => c.name));
        
        return drawnCards;
    },
    
    async playMysticDraw(targetEl) {
        return new Promise(resolve => {
            // 가챠 스타일 오버레이
            const overlay = document.createElement('div');
            overlay.className = 'mystic-draw-overlay';
            overlay.innerHTML = `
                <div class="mystic-beam-container"></div>
                <div class="mystic-draw-crystal">
                    <img src="crystal.png" alt="Crystal" class="mystic-crystal-img">
                </div>
                <div class="mystic-mugirl">
                    <img src="mugirl.png" alt="무녀" class="mystic-mugirl-img">
                </div>
                <div class="mystic-draw-text">운명의 소환</div>
            `;
            document.body.appendChild(overlay);
            
            // 스타일 주입
            this.injectStyles();
            
            const beamContainer = overlay.querySelector('.mystic-beam-container');
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            
            // 1단계: 페이드인
            setTimeout(() => {
                overlay.classList.add('active');
            }, 100);
            
            // 2단계: 빔 생성 (점점 늘어남)
            let beamCount = 0;
            const maxBeams = 12;
            const beamInterval = setInterval(() => {
                if (beamCount < maxBeams) {
                    this.addBeam(beamContainer, beamCount, maxBeams);
                    beamCount++;
                    
                    // 파티클
                    if (typeof VFX !== 'undefined') {
                        VFX.sparks(cx, cy, { color: '#ff69b4', count: 8, speed: 6, size: 4 });
                    }
                }
            }, 100);
            
            // 3단계: 충전
            setTimeout(() => {
                overlay.classList.add('charging');
                
                if (typeof VFX !== 'undefined') {
                    // 핑크 충격파
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            VFX.shockwave(cx, cy, { color: '#ff69b4', size: 200 + i * 50, lineWidth: 4 });
                        }, i * 150);
                    }
                }
            }, 800);
            
            // 4단계: 텍스트 변경
            setTimeout(() => {
                const textEl = overlay.querySelector('.mystic-draw-text');
                textEl.textContent = '10장 드로우!';
                textEl.classList.add('reveal');
            }, 1500);
            
            // 5단계: 폭발
            setTimeout(() => {
                clearInterval(beamInterval);
                overlay.classList.add('explode');
                
                if (typeof VFX !== 'undefined') {
                    // 대폭발
                    VFX.criticalHit(cx, cy, { size: 400 });
                    
                    // 핑크 충격파 연속
                    for (let i = 0; i < 6; i++) {
                        setTimeout(() => {
                            const colors = ['#ff69b4', '#ff1493', '#ffb6c1', '#ffffff', '#ff69b4', '#ff1493'];
                            VFX.shockwave(cx, cy, { color: colors[i], size: 500 - i * 50, lineWidth: 10 - i });
                        }, i * 50);
                    }
                    
                    // 파티클 폭발
                    VFX.sparks(cx, cy, { color: '#ffffff', count: 100, speed: 35, size: 8 });
                    VFX.sparks(cx, cy, { color: '#ff69b4', count: 80, speed: 30, size: 6 });
                    VFX.sparks(cx, cy, { color: '#ffd700', count: 50, speed: 25, size: 5 });
                    
                    VFX.screenFlash('#ff69b4', 0.6);
                }
                
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenShake(25, 600);
                }
            }, 1800);
            
            // 정리 (더 빠르게)
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 400);
            }, 2400);
        });
    },
    
    addBeam(container, index, total) {
        if (!container) return;
        
        const beam = document.createElement('div');
        beam.className = 'mystic-beam';
        
        const angle = (index / total) * 360;
        const colors = ['#ff69b4', '#ff1493', '#ffb6c1', '#ffd700', '#ffffff'];
        const color = colors[index % colors.length];
        const length = 150 + (index / total) * 300;
        
        beam.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${length}px;
            height: 3px;
            background: linear-gradient(90deg, ${color} 0%, rgba(255,255,255,0.8) 50%, transparent 100%);
            transform-origin: left center;
            transform: rotate(${angle}deg);
            opacity: 0;
            animation: beamAppear 0.3s ease forwards;
            filter: blur(1px);
            box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
        `;
        
        container.appendChild(beam);
    },
    
    injectStyles() {
        if (document.getElementById('mystic-draw-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mystic-draw-styles';
        style.textContent = `
            .mystic-draw-overlay {
                position: fixed;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(30, 20, 40, 0.95) 0%, rgba(10, 5, 15, 0.98) 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .mystic-draw-overlay.active {
                opacity: 1;
            }
            
            .mystic-draw-overlay.fade-out {
                opacity: 0;
            }
            
            .mystic-beam-container {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                z-index: 1;
            }
            
            @keyframes beamAppear {
                0% { opacity: 0; width: 0; }
                100% { opacity: 0.8; }
            }
            
            .mystic-draw-overlay.explode .mystic-beam {
                animation: beamExplode 0.4s ease forwards;
            }
            
            @keyframes beamExplode {
                0% { opacity: 0.8; }
                50% { opacity: 1; transform: rotate(var(--angle)) scaleX(1.5); }
                100% { opacity: 0; transform: rotate(var(--angle)) scaleX(2); }
            }
            
            .mystic-draw-crystal {
                width: 120px;
                height: 120px;
                z-index: 10;
                animation: mysticCrystalFloat 2s ease-in-out infinite;
            }
            
            .mystic-draw-overlay.charging .mystic-draw-crystal {
                animation: mysticCrystalSpin 0.5s linear infinite;
            }
            
            .mystic-crystal-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 0 30px rgba(255, 105, 180, 0.8));
            }
            
            @keyframes mysticCrystalFloat {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(5deg); }
            }
            
            @keyframes mysticCrystalSpin {
                from { transform: rotate(0deg) scale(1); }
                to { transform: rotate(360deg) scale(1.1); }
            }
            
            .mystic-draw-overlay.explode .mystic-draw-crystal {
                animation: mysticCrystalExplode 0.5s ease forwards;
            }
            
            @keyframes mysticCrystalExplode {
                0% { transform: scale(1); opacity: 1; filter: brightness(1); }
                30% { transform: scale(1.5); opacity: 1; filter: brightness(3); }
                100% { transform: scale(3); opacity: 0; filter: brightness(5); }
            }
            
            .mystic-mugirl {
                position: absolute;
                bottom: 10%;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                height: 250px;
                z-index: 5;
                opacity: 0;
                animation: mugirlAppear 0.8s ease 0.3s forwards;
            }
            
            .mystic-mugirl-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 0 20px rgba(255, 105, 180, 0.5));
            }
            
            @keyframes mugirlAppear {
                0% { opacity: 0; transform: translateX(-50%) translateY(30px); }
                100% { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            .mystic-draw-text {
                margin-top: 20px;
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                z-index: 10;
                background: linear-gradient(90deg, #ff69b4, #ff1493, #ffb6c1, #ff69b4);
                background-size: 200% 100%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 0 20px #ff69b4);
                opacity: 0;
                animation: mysticTextAppear 0.5s ease 0.5s forwards, pinkGradient 2s linear infinite;
            }
            
            .mystic-draw-text.reveal {
                font-size: 3rem;
                animation: textReveal 0.5s ease forwards, pinkGradient 1s linear infinite;
            }
            
            @keyframes pinkGradient {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }
            
            @keyframes mysticTextAppear {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes textReveal {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); filter: drop-shadow(0 0 40px #ff69b4); }
                100% { transform: scale(1.2); }
            }
            
            .mystic-draw-overlay.explode .mystic-draw-text {
                animation: mysticTextExplode 0.5s ease forwards;
            }
            
            @keyframes mysticTextExplode {
                0% { transform: scale(1.2); opacity: 1; }
                50% { transform: scale(1.8); filter: brightness(2); }
                100% { transform: scale(2.5); opacity: 0; }
            }
            
            .mystic-draw-overlay.explode .mystic-mugirl {
                animation: mugirlFade 0.5s ease forwards;
            }
            
            @keyframes mugirlFade {
                0% { opacity: 1; }
                100% { opacity: 0; transform: translateX(-50%) scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    }
};

// ==========================================
// cardDatabase에 등록
// ==========================================
if (typeof cardDatabase !== 'undefined') {
    cardDatabase.mysticMaidenCall = GachaCards.mysticMaidenCall;
    console.log('[GachaCards] 신비한 무녀의 부름 카드 등록 완료');
}

// 전역 등록
window.GachaCards = GachaCards;
window.GachaCardVFX = GachaCardVFX;
