// ==========================================
// 개발자 모드 / 점검 시스템 (Dark Souls Style)
// ==========================================

const DevMode = {
    // ✅ 점검중 설정 - true로 바꾸면 점검 화면 표시
    maintenance: true,
    
    // 점검 메시지 (다크소울 스타일)
    maintenanceTitle: 'MAINTENANCE',
    maintenanceMessage: 'The servers have fallen to darkness...',
    maintenanceSubMessage: 'Await the return of the flame.',
    
    // 비밀 키 입력 확인
    secretKeyPressed: false,
    
    // 초기화
    init() {
        console.log('[DevMode] 초기화...');
        
        // 점검중이면 점검 화면 표시
        if (this.maintenance) {
            this.showMaintenanceScreen();
            this.setupSecretKey();
        }
        
        console.log(`[DevMode] 점검 모드: ${this.maintenance}`);
    },
    
    // 점검 화면 표시 (다크소울 스타일)
    showMaintenanceScreen() {
        // 기존 게임 컨텐츠 숨기기
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        // 타이틀 화면 숨기기
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.style.display = 'none';
        }
        
        // 점검 화면 생성 (다크소울 YOU DIED 스타일)
        const maintenanceScreen = document.createElement('div');
        maintenanceScreen.id = 'maintenance-screen';
        maintenanceScreen.innerHTML = `
            <div class="ds-vignette"></div>
            <div class="ds-particles"></div>
            <div class="maintenance-content">
                <div class="ds-line ds-line-top"></div>
                <h1 class="ds-title">${this.maintenanceTitle}</h1>
                <div class="ds-line ds-line-bottom"></div>
                <p class="ds-message">${this.maintenanceMessage}</p>
                <p class="ds-sub">${this.maintenanceSubMessage}</p>
            </div>
            <div class="ds-bonfire">
                <div class="ds-flame"></div>
                <div class="ds-ember"></div>
            </div>
        `;
        document.body.appendChild(maintenanceScreen);
        
        // 파티클 생성
        this.createParticles();
        
        console.log('[DevMode] 점검 화면 표시됨 (Dark Souls Style)');
    },
    
    // 먼지/재 파티클 생성
    createParticles() {
        const container = document.querySelector('.ds-particles');
        if (!container) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'ds-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            container.appendChild(particle);
        }
    },
    
    // 비밀 키 설정 (Ctrl+D)
    setupSecretKey() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + D
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.unlockGame();
            }
        });
        
        console.log('[DevMode] 비밀 키 리스너 등록됨 (Ctrl+D)');
    },
    
    // 게임 잠금 해제
    unlockGame() {
        if (this.secretKeyPressed) return;
        this.secretKeyPressed = true;
        
        console.log('[DevMode] 🔓 HUMANITY RESTORED');
        
        // 점검 화면 페이드 아웃
        const maintenanceScreen = document.getElementById('maintenance-screen');
        if (maintenanceScreen) {
            // 화이트 플래시
            const flash = document.createElement('div');
            flash.className = 'ds-flash';
            maintenanceScreen.appendChild(flash);
            
            setTimeout(() => {
                maintenanceScreen.style.transition = 'opacity 1s ease';
                maintenanceScreen.style.opacity = '0';
                
                setTimeout(() => {
                    maintenanceScreen.remove();
                    
                    // 타이틀 화면 표시
                    const titleScreen = document.getElementById('title-screen');
                    if (titleScreen) {
                        titleScreen.style.display = '';
                    }
                    
                    // 게임 컨테이너 표시
                    const gameContainer = document.querySelector('.game-container');
                    if (gameContainer) {
                        gameContainer.style.display = '';
                    }
                    
                    console.log('[DevMode] 게임 진입!');
                }, 1000);
            }, 300);
        }
    },
    
    // 점검 모드 토글 (콘솔용)
    toggleMaintenance() {
        this.maintenance = !this.maintenance;
        console.log(`[DevMode] 점검 모드: ${this.maintenance}`);
        if (this.maintenance) {
            location.reload();
        }
    }
};

// 전역 등록
window.DevMode = DevMode;

// 다크소울 스타일 추가
const devStyles = document.createElement('style');
devStyles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
    
    #maintenance-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        overflow: hidden;
    }
    
    /* 비네팅 효과 */
    .ds-vignette {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.8) 100%);
        pointer-events: none;
    }
    
    /* 메인 컨텐츠 */
    .maintenance-content {
        text-align: center;
        z-index: 10;
        animation: dsAppear 2s ease-out forwards;
        opacity: 0;
    }
    
    @keyframes dsAppear {
        0% {
            opacity: 0;
            transform: scale(0.8);
            filter: blur(10px);
        }
        100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
        }
    }
    
    /* 다크소울 스타일 라인 */
    .ds-line {
        width: 400px;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, #8b7355 20%, #c4a574 50%, #8b7355 80%, transparent 100%);
        margin: 0 auto;
        position: relative;
    }
    
    .ds-line::before {
        content: '◆';
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        color: #c4a574;
        font-size: 12px;
        top: -6px;
    }
    
    .ds-line-top {
        margin-bottom: 20px;
    }
    
    .ds-line-bottom {
        margin-top: 20px;
    }
    
    /* 메인 타이틀 (YOU DIED 스타일) */
    .ds-title {
        font-family: 'Cinzel', 'Times New Roman', serif;
        font-size: 72px;
        font-weight: 400;
        letter-spacing: 20px;
        color: #8b0000;
        text-shadow: 
            0 0 10px rgba(139, 0, 0, 0.8),
            0 0 20px rgba(139, 0, 0, 0.6),
            0 0 40px rgba(139, 0, 0, 0.4),
            0 0 60px rgba(139, 0, 0, 0.2);
        margin: 0;
        animation: dsPulse 3s ease-in-out infinite;
    }
    
    @keyframes dsPulse {
        0%, 100% {
            text-shadow: 
                0 0 10px rgba(139, 0, 0, 0.8),
                0 0 20px rgba(139, 0, 0, 0.6),
                0 0 40px rgba(139, 0, 0, 0.4);
        }
        50% {
            text-shadow: 
                0 0 20px rgba(139, 0, 0, 1),
                0 0 40px rgba(139, 0, 0, 0.8),
                0 0 60px rgba(139, 0, 0, 0.6),
                0 0 80px rgba(139, 0, 0, 0.4);
        }
    }
    
    /* 서브 메시지 */
    .ds-message {
        font-family: 'Cinzel', serif;
        font-size: 20px;
        color: #a08060;
        margin: 30px 0 10px 0;
        letter-spacing: 2px;
        opacity: 0;
        animation: dsFadeIn 1s ease-out 1.5s forwards;
    }
    
    .ds-sub {
        font-family: 'Cinzel', serif;
        font-size: 14px;
        color: #605040;
        margin: 0;
        letter-spacing: 1px;
        opacity: 0;
        animation: dsFadeIn 1s ease-out 2s forwards;
    }
    
    @keyframes dsFadeIn {
        to { opacity: 1; }
    }
    
    /* 화톳불 */
    .ds-bonfire {
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0;
        animation: dsFadeIn 2s ease-out 2.5s forwards;
    }
    
    .ds-flame {
        width: 30px;
        height: 50px;
        background: linear-gradient(to top, #ff6600, #ffcc00, transparent);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        animation: dsFlicker 0.15s infinite alternate;
        filter: blur(2px);
    }
    
    @keyframes dsFlicker {
        0% { 
            transform: scaleY(1) scaleX(1); 
            opacity: 1;
        }
        100% { 
            transform: scaleY(1.1) scaleX(0.9); 
            opacity: 0.8;
        }
    }
    
    .ds-ember {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 10px;
        background: radial-gradient(ellipse, #ff4400 0%, #cc3300 50%, transparent 70%);
        filter: blur(3px);
    }
    
    /* 파티클 컨테이너 */
    .ds-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
    }
    
    .ds-particle {
        position: absolute;
        bottom: -10px;
        width: 3px;
        height: 3px;
        background: rgba(200, 150, 100, 0.6);
        border-radius: 50%;
        animation: dsFloat 15s linear infinite;
    }
    
    @keyframes dsFloat {
        0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
        }
        10% {
            opacity: 0.6;
        }
        90% {
            opacity: 0.6;
        }
        100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
        }
    }
    
    /* 해금 시 화이트 플래시 */
    .ds-flash {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        opacity: 0;
        animation: dsWhiteFlash 0.3s ease-out forwards;
        z-index: 100;
    }
    
    @keyframes dsWhiteFlash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(devStyles);

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    DevMode.init();
});

console.log('[DevMode] 스크립트 로드됨 (Dark Souls Style)');
