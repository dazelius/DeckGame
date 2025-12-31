// ==========================================
// Shadow Deck - 로딩 화면 시스템
// ==========================================

const LoadingScreen = {
    overlay: null,
    progressBar: null,
    progressText: null,
    tipText: null,
    isComplete: false,
    
    // 로딩 팁 목록
    tips: [
        "💡 방어도는 턴이 끝나면 사라집니다",
        "💡 적의 인텐트를 보고 전략을 세우세요",
        "💡 브레이크 시스템으로 위험한 공격을 막을 수 있습니다",
        "💡 유물은 영구적인 보너스를 제공합니다",
        "💡 카드를 업그레이드하면 효과가 강화됩니다",
        "💡 캠프에서 휴식하거나 카드를 제거할 수 있습니다",
        "💡 던전에서 획득한 골드는 탈출해야 저장됩니다",
        "💡 취약 상태의 적은 50% 추가 피해를 받습니다",
        "💡 에너지를 효율적으로 사용하세요",
        "💡 덱이 작을수록 원하는 카드를 더 자주 뽑습니다"
    ],
    
    // ==========================================
    // 초기화 - DOM 로드 전에 호출
    // ==========================================
    init() {
        // 이미 존재하면 스킵
        if (document.getElementById('loading-screen')) return;
        
        this.createLoadingScreen();
        this.show();
        
        // 초기 인라인 로딩 화면 숨기기
        this.hideInitialLoading();
        
        this.startLoading();
    },
    
    // ==========================================
    // 초기 로딩 화면 숨기기
    // ==========================================
    hideInitialLoading() {
        const initialLoading = document.getElementById('initial-loading');
        if (initialLoading) {
            initialLoading.style.opacity = '0';
            setTimeout(() => {
                if (initialLoading.parentNode) {
                    initialLoading.remove();
                }
            }, 500);
        }
    },
    
    // ==========================================
    // 로딩 화면 생성
    // ==========================================
    createLoadingScreen() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-screen';
        overlay.innerHTML = `
            <div class="loading-bg">
                <div class="loading-particles"></div>
                <div class="loading-vignette"></div>
            </div>
            
            <div class="loading-content">
                <!-- 로고 -->
                <div class="loading-logo">
                    <div class="loading-logo-glow"></div>
                    <div class="loading-logo-text">PROJECT</div>
                    <div class="loading-logo-main">DDoo</div>
                </div>
                
                <!-- 프로그레스 바 -->
                <div class="loading-progress-container">
                    <div class="loading-progress-bg">
                        <div class="loading-progress-bar" id="loading-progress-bar"></div>
                        <div class="loading-progress-shine"></div>
                    </div>
                    <div class="loading-progress-text" id="loading-progress-text">리소스 로딩 중...</div>
                </div>
                
                <!-- 팁 -->
                <div class="loading-tip" id="loading-tip">
                    ${this.getRandomTip()}
                </div>
            </div>
            
            <!-- 하단 -->
            <div class="loading-footer">
                <div class="loading-ember"></div>
                <div class="loading-ember"></div>
                <div class="loading-ember"></div>
            </div>
        `;
        
        // 스타일 주입
        this.injectStyles();
        
        // body 맨 앞에 추가
        document.body.insertBefore(overlay, document.body.firstChild);
        
        this.overlay = overlay;
        this.progressBar = document.getElementById('loading-progress-bar');
        this.progressText = document.getElementById('loading-progress-text');
        this.tipText = document.getElementById('loading-tip');
        
        // 팁 변경 인터벌
        this.tipInterval = setInterval(() => {
            this.changeTip();
        }, 4000);
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('loading-screen-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-screen-styles';
        style.textContent = `
            /* 로딩 화면 오버레이 */
            #loading-screen {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #0a0a0f;
                transition: opacity 0.8s ease, visibility 0.8s ease;
            }
            
            #loading-screen.hidden {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }
            
            /* 배경 */
            .loading-bg {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at 50% 30%, rgba(201, 165, 92, 0.05) 0%, transparent 50%),
                    radial-gradient(ellipse at 50% 70%, rgba(139, 69, 69, 0.05) 0%, transparent 50%),
                    linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%);
            }
            
            .loading-vignette {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%);
            }
            
            /* 파티클 */
            .loading-particles {
                position: absolute;
                inset: 0;
                overflow: hidden;
            }
            
            .loading-particles::before,
            .loading-particles::after {
                content: '';
                position: absolute;
                width: 4px;
                height: 4px;
                background: #c9a55c;
                border-radius: 50%;
                animation: loadingParticle 8s infinite;
                opacity: 0.4;
            }
            
            .loading-particles::before {
                left: 30%;
                animation-delay: 0s;
            }
            
            .loading-particles::after {
                left: 70%;
                animation-delay: 4s;
            }
            
            @keyframes loadingParticle {
                0% { bottom: -20px; opacity: 0; }
                10% { opacity: 0.6; }
                90% { opacity: 0.2; }
                100% { bottom: 100%; opacity: 0; }
            }
            
            /* 컨텐츠 */
            .loading-content {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 40px;
            }
            
            /* 로고 */
            .loading-logo {
                text-align: center;
                position: relative;
            }
            
            .loading-logo-glow {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 200px;
                height: 200px;
                background: radial-gradient(circle, rgba(201, 165, 92, 0.3) 0%, transparent 70%);
                transform: translate(-50%, -50%);
                animation: logoGlow 3s ease-in-out infinite;
            }
            
            @keyframes logoGlow {
                0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
            }
            
            .loading-logo-text {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #8a7a5a;
                letter-spacing: 8px;
                margin-bottom: 5px;
                animation: logoFadeIn 1s ease-out 0.3s both;
            }
            
            .loading-logo-main {
                font-family: 'Cinzel', serif;
                font-size: 3.5rem;
                font-weight: 900;
                color: #c9a55c;
                text-shadow: 
                    0 0 30px rgba(201, 165, 92, 0.5),
                    0 0 60px rgba(201, 165, 92, 0.3),
                    0 4px 8px rgba(0, 0, 0, 0.8);
                animation: logoFadeIn 1s ease-out 0.5s both;
            }
            
            @keyframes logoFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* 프로그레스 바 */
            .loading-progress-container {
                width: 300px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                animation: logoFadeIn 1s ease-out 0.7s both;
            }
            
            .loading-progress-bg {
                width: 100%;
                height: 6px;
                background: rgba(201, 165, 92, 0.1);
                border: 1px solid rgba(201, 165, 92, 0.3);
                border-radius: 3px;
                overflow: hidden;
                position: relative;
            }
            
            .loading-progress-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #8b6914, #c9a55c, #daa520);
                border-radius: 3px;
                transition: width 0.3s ease;
                position: relative;
            }
            
            .loading-progress-shine {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(255, 255, 255, 0.3) 50%, 
                    transparent 100%);
                animation: progressShine 2s infinite;
            }
            
            @keyframes progressShine {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            .loading-progress-text {
                font-family: 'Cinzel', serif;
                font-size: 0.85rem;
                color: #8a7a5a;
                letter-spacing: 2px;
            }
            
            /* 팁 */
            .loading-tip {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 0.9rem;
                color: #6a5a4a;
                max-width: 400px;
                text-align: center;
                line-height: 1.5;
                animation: tipFadeIn 0.5s ease-out;
                min-height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes tipFadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* 하단 엠버 */
            .loading-footer {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 100px;
                display: flex;
                justify-content: center;
                gap: 100px;
                pointer-events: none;
            }
            
            .loading-ember {
                width: 3px;
                height: 3px;
                background: #c9a55c;
                border-radius: 50%;
                box-shadow: 0 0 10px #c9a55c, 0 0 20px rgba(201, 165, 92, 0.5);
                animation: emberFloat 6s ease-in-out infinite;
            }
            
            .loading-ember:nth-child(1) { animation-delay: 0s; }
            .loading-ember:nth-child(2) { animation-delay: 2s; }
            .loading-ember:nth-child(3) { animation-delay: 4s; }
            
            @keyframes emberFloat {
                0%, 100% {
                    transform: translateY(0);
                    opacity: 0;
                }
                10% { opacity: 0.8; }
                50% { transform: translateY(-80px); opacity: 0.6; }
                90% { opacity: 0.2; }
            }
            
            /* 완료 상태 */
            #loading-screen.complete .loading-progress-bar {
                background: linear-gradient(90deg, #4ade80, #22c55e, #16a34a);
            }
            
            #loading-screen.complete .loading-progress-text {
                color: #4ade80;
            }
            
            /* 반응형 */
            @media (max-width: 480px) {
                .loading-logo-main {
                    font-size: 2.5rem;
                }
                
                .loading-progress-container {
                    width: 250px;
                }
                
                .loading-tip {
                    font-size: 0.8rem;
                    padding: 0 20px;
                }
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 로딩 시작
    // ==========================================
    startLoading() {
        let imageProgress = 0;
        let soundProgress = 0;
        let totalProgress = 0;
        
        // 이미지 로딩
        if (typeof ImagePreloader !== 'undefined') {
            ImagePreloader.preload(
                // 진행 콜백
                (loaded, total) => {
                    imageProgress = (loaded / total) * 50; // 이미지는 50%
                    this.updateProgress(imageProgress + soundProgress);
                },
                // 완료 콜백
                () => {
                    imageProgress = 50;
                    this.updateProgress(imageProgress + soundProgress);
                    this.checkComplete();
                }
            );
        } else {
            imageProgress = 50;
        }
        
        // 사운드 로딩 (이미 SoundSystem.init()에서 처리됨)
        // 약간의 딜레이 후 사운드 로딩 완료로 처리
        setTimeout(() => {
            if (typeof SoundSystem !== 'undefined') {
                SoundSystem.init();
            }
            
            // 사운드 로딩 애니메이션
            let soundLoadProgress = 0;
            const soundInterval = setInterval(() => {
                soundLoadProgress += 10;
                soundProgress = Math.min(soundLoadProgress, 50);
                this.updateProgress(imageProgress + soundProgress);
                
                if (soundLoadProgress >= 50) {
                    clearInterval(soundInterval);
                    this.checkComplete();
                }
            }, 100);
        }, 500);
    },
    
    // ==========================================
    // 프로그레스 업데이트
    // ==========================================
    updateProgress(percent) {
        percent = Math.min(100, Math.max(0, percent));
        
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        
        if (this.progressText) {
            if (percent < 50) {
                this.progressText.textContent = `이미지 로딩 중... ${Math.round(percent * 2)}%`;
            } else if (percent < 100) {
                this.progressText.textContent = `사운드 로딩 중... ${Math.round((percent - 50) * 2)}%`;
            } else {
                this.progressText.textContent = '로딩 완료!';
            }
        }
    },
    
    // ==========================================
    // 로딩 완료 체크
    // ==========================================
    checkComplete() {
        if (this.isComplete) return;
        
        // 이미지와 사운드 모두 로딩되었는지 확인
        const imageLoaded = typeof ImagePreloader === 'undefined' || ImagePreloader.isLoaded;
        const soundLoaded = typeof SoundSystem === 'undefined' || SoundSystem.initialized;
        
        if (imageLoaded && soundLoaded) {
            this.isComplete = true;
            this.onComplete();
        }
    },
    
    // ==========================================
    // 로딩 완료
    // ==========================================
    onComplete() {
        if (this.progressBar) {
            this.progressBar.style.width = '100%';
        }
        
        if (this.progressText) {
            this.progressText.textContent = '로딩 완료!';
        }
        
        if (this.overlay) {
            this.overlay.classList.add('complete');
        }
        
        // 팁 인터벌 정리
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
        }
        
        // 잠시 후 페이드 아웃
        setTimeout(() => {
            this.hide();
        }, 800);
        
        console.log('[LoadingScreen] ✅ 로딩 완료!');
    },
    
    // ==========================================
    // 표시/숨기기
    // ==========================================
    show() {
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            
            // 완전히 사라진 후 제거
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.remove();
                }
            }, 800);
        }
    },
    
    // ==========================================
    // 팁 관련
    // ==========================================
    getRandomTip() {
        return this.tips[Math.floor(Math.random() * this.tips.length)];
    },
    
    changeTip() {
        if (!this.tipText) return;
        
        // 페이드 아웃
        this.tipText.style.opacity = '0';
        this.tipText.style.transform = 'translateY(-5px)';
        
        setTimeout(() => {
            this.tipText.textContent = this.getRandomTip();
            this.tipText.style.opacity = '1';
            this.tipText.style.transform = 'translateY(0)';
        }, 300);
    }
};

// ==========================================
// 즉시 실행 - DOM 로드 전에 로딩 화면 표시
// ==========================================
(function() {
    // DOM이 준비되면 로딩 화면 생성
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            LoadingScreen.init();
        });
    } else {
        LoadingScreen.init();
    }
})();

// 전역 등록
window.LoadingScreen = LoadingScreen;

console.log('[LoadingScreen] 로딩 화면 시스템 로드됨');

