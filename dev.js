// ==========================================
// 개발자 모드 / 점검 시스템
// ==========================================

const DevMode = {
    // ✅ 점검중 설정 - true로 바꾸면 점검 화면 표시
    maintenance: true,
    
    // 점검 메시지
    maintenanceMessage: '서버 점검중입니다.',
    maintenanceSubMessage: '빠른 시일 내에 돌아오겠습니다.',
    
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
    
    // 점검 화면 표시
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
        
        // 점검 화면 생성
        const maintenanceScreen = document.createElement('div');
        maintenanceScreen.id = 'maintenance-screen';
        maintenanceScreen.innerHTML = `
            <div class="maintenance-content">
                <div class="maintenance-icon">🔧</div>
                <h1 class="maintenance-title">점검중</h1>
                <p class="maintenance-message">${this.maintenanceMessage}</p>
                <p class="maintenance-sub">${this.maintenanceSubMessage}</p>
                <div class="maintenance-spinner"></div>
            </div>
        `;
        document.body.appendChild(maintenanceScreen);
        
        console.log('[DevMode] 점검 화면 표시됨');
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
        
        console.log('[DevMode] 🔓 개발자 모드 활성화!');
        
        // 점검 화면 페이드 아웃
        const maintenanceScreen = document.getElementById('maintenance-screen');
        if (maintenanceScreen) {
            maintenanceScreen.style.transition = 'opacity 0.5s ease';
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
            }, 500);
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

// 스타일 추가
const devStyles = document.createElement('style');
devStyles.textContent = `
    #maintenance-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-family: 'DungGeunMo', monospace;
    }
    
    .maintenance-content {
        text-align: center;
        color: #e8e8e8;
        padding: 40px;
    }
    
    .maintenance-icon {
        font-size: 80px;
        margin-bottom: 20px;
        animation: bounce 2s ease infinite;
    }
    
    .maintenance-title {
        font-size: 48px;
        margin: 0 0 20px 0;
        color: #ffd700;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    }
    
    .maintenance-message {
        font-size: 24px;
        margin: 0 0 10px 0;
        color: #a0a0a0;
    }
    
    .maintenance-sub {
        font-size: 16px;
        margin: 0 0 30px 0;
        color: #666;
    }
    
    .maintenance-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #333;
        border-top: 4px solid #ffd700;
        border-radius: 50%;
        margin: 0 auto;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
`;
document.head.appendChild(devStyles);

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    DevMode.init();
});

console.log('[DevMode] 스크립트 로드됨');
