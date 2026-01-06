// ==========================================
// Shadow Deck - 반응형 시스템
// 해상도 감지 및 동적 레이아웃
// ==========================================

const ResponsiveSystem = {
    // 현재 상태
    currentBreakpoint: null,
    currentHeightClass: null,
    isLandscape: true,
    debugMode: false,
    
    // ==========================================
    // 브레이크포인트 정의
    // ==========================================
    breakpoints: {
        tiny: { min: 0, max: 319, class: 'res-tiny', name: '초소형' },
        mobileSm: { min: 320, max: 480, class: 'res-mobile-sm', name: '소형 모바일' },
        mobile: { min: 481, max: 767, class: 'res-mobile', name: '모바일' },
        tablet: { min: 768, max: 1023, class: 'res-tablet', name: '태블릿' },
        laptop: { min: 1024, max: 1365, class: 'res-laptop', name: '노트북' },
        desktop: { min: 1366, max: 1919, class: 'res-desktop', name: 'PC' },
        large: { min: 1920, max: 2559, class: 'res-large', name: '대형 모니터' },
        xlarge: { min: 2560, max: 3839, class: 'res-xlarge', name: '초대형' },
        '4k': { min: 3840, max: Infinity, class: 'res-4k', name: '4K' }
    },
    
    // 높이 브레이크포인트
    heightBreakpoints: {
        tiny: { max: 400, class: 'height-tiny' },
        low: { max: 600, class: 'height-low' },
        medium: { max: 800, class: 'height-medium' },
        normal: { max: Infinity, class: 'height-normal' }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[Responsive] 반응형 시스템 초기화...');
        
        // 초기 해상도 감지
        this.detectResolution();
        
        // 리사이즈 이벤트 리스너 (디바운스 적용)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.detectResolution();
            }, 100);
        });
        
        // 방향 변경 이벤트
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.detectResolution();
            }, 100);
        });
        
        // 풀스크린 변경 이벤트
        document.addEventListener('fullscreenchange', () => {
            this.detectResolution();
        });
        
        console.log('[Responsive] 초기화 완료');
    },
    
    // ==========================================
    // 해상도 감지
    // ==========================================
    detectResolution() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscape = width > height;
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // 실제 해상도 (디바이스 픽셀 기준)
        const realWidth = width * devicePixelRatio;
        const realHeight = height * devicePixelRatio;
        
        // 너비 기반 브레이크포인트 결정
        let newBreakpoint = null;
        for (const [key, bp] of Object.entries(this.breakpoints)) {
            if (width >= bp.min && width <= bp.max) {
                newBreakpoint = key;
                break;
            }
        }
        
        // 높이 기반 클래스 결정
        let newHeightClass = null;
        for (const [key, hp] of Object.entries(this.heightBreakpoints)) {
            if (height <= hp.max) {
                newHeightClass = key;
                break;
            }
        }
        
        // 변경 사항이 있으면 적용
        const changed = (
            this.currentBreakpoint !== newBreakpoint ||
            this.currentHeightClass !== newHeightClass ||
            this.isLandscape !== isLandscape
        );
        
        if (changed) {
            this.applyBreakpoint(newBreakpoint, newHeightClass, isLandscape);
        }
        
        // 디버그 모드
        if (this.debugMode) {
            this.updateDebugInfo(width, height, realWidth, realHeight, devicePixelRatio);
        }
        
        return {
            width,
            height,
            realWidth,
            realHeight,
            devicePixelRatio,
            breakpoint: newBreakpoint,
            heightClass: newHeightClass,
            isLandscape
        };
    },
    
    // ==========================================
    // 브레이크포인트 적용
    // ==========================================
    applyBreakpoint(breakpoint, heightClass, isLandscape) {
        const body = document.body;
        const gameContainer = document.querySelector('.game-container');
        
        // 이전 클래스 제거
        Object.values(this.breakpoints).forEach(bp => {
            body.classList.remove(bp.class);
            if (gameContainer) gameContainer.classList.remove(bp.class);
        });
        Object.values(this.heightBreakpoints).forEach(hp => {
            body.classList.remove(hp.class);
            if (gameContainer) gameContainer.classList.remove(hp.class);
        });
        body.classList.remove('landscape', 'portrait');
        
        // 새 클래스 적용
        const bpClass = this.breakpoints[breakpoint]?.class;
        const hpClass = this.heightBreakpoints[heightClass]?.class;
        
        if (bpClass) {
            body.classList.add(bpClass);
            if (gameContainer) gameContainer.classList.add(bpClass);
        }
        
        if (hpClass) {
            body.classList.add(hpClass);
            if (gameContainer) gameContainer.classList.add(hpClass);
        }
        
        body.classList.add(isLandscape ? 'landscape' : 'portrait');
        
        // 상태 업데이트
        const prevBreakpoint = this.currentBreakpoint;
        this.currentBreakpoint = breakpoint;
        this.currentHeightClass = heightClass;
        this.isLandscape = isLandscape;
        
        // 변경 이벤트 발생
        this.onBreakpointChange(prevBreakpoint, breakpoint, heightClass, isLandscape);
        
        console.log(`[Responsive] ${this.breakpoints[breakpoint]?.name || breakpoint} (${window.innerWidth}x${window.innerHeight}) ${isLandscape ? '가로' : '세로'}`);
    },
    
    // ==========================================
    // 브레이크포인트 변경 콜백
    // ==========================================
    onBreakpointChange(prev, current, heightClass, isLandscape) {
        // 커스텀 이벤트 발생
        const event = new CustomEvent('breakpointChange', {
            detail: {
                previous: prev,
                current: current,
                heightClass: heightClass,
                isLandscape: isLandscape,
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
        window.dispatchEvent(event);
        
        // 레이아웃 재조정
        this.adjustLayout(current, heightClass, isLandscape);
        
        // 카드 재렌더링 (필요시)
        if (typeof renderHand === 'function') {
            setTimeout(() => renderHand(false), 50);
        }
        
        // 적 UI 업데이트
        if (typeof updateEnemiesUI === 'function') {
            setTimeout(() => updateEnemiesUI(), 50);
        }
    },
    
    // ==========================================
    // 레이아웃 동적 조정
    // ==========================================
    adjustLayout(breakpoint, heightClass, isLandscape) {
        const isMobile = ['tiny', 'mobileSm', 'mobile'].includes(breakpoint);
        const isTablet = breakpoint === 'tablet';
        const isSmallHeight = ['tiny', 'low'].includes(heightClass);
        
        // 손패 카드 배치 조정
        this.adjustHandLayout(isMobile, isTablet, isSmallHeight);
        
        // 전투 영역 조정
        this.adjustBattleArena(isMobile, isTablet, isLandscape);
        
        // UI 요소 조정
        this.adjustUIElements(isMobile, isSmallHeight);
    },
    
    // ==========================================
    // 손패 레이아웃 조정
    // ==========================================
    adjustHandLayout(isMobile, isTablet, isSmallHeight) {
        const hand = document.getElementById('hand');
        if (!hand) return;
        
        const cards = hand.querySelectorAll('.card');
        const cardCount = cards.length;
        
        if (cardCount === 0) return;
        
        // 모바일에서는 카드 간격 줄이기
        let overlap = 0;
        if (isMobile && cardCount > 4) {
            overlap = Math.min(30, (cardCount - 4) * 10);
        } else if (isTablet && cardCount > 5) {
            overlap = Math.min(20, (cardCount - 5) * 8);
        }
        
        // 카드에 마진 적용
        cards.forEach((card, index) => {
            if (overlap > 0 && index > 0) {
                card.style.marginLeft = `-${overlap}px`;
            } else {
                card.style.marginLeft = '';
            }
        });
        
        // 낮은 높이에서 카드 설명 숨기기
        if (isSmallHeight) {
            cards.forEach(card => {
                const desc = card.querySelector('.card-description');
                if (desc) desc.style.display = 'none';
            });
        }
    },
    
    // ==========================================
    // 전투 영역 조정
    // ==========================================
    adjustBattleArena(isMobile, isTablet, isLandscape) {
        const arena = document.querySelector('.battle-arena');
        if (!arena) return;
        
        // 세로 모드에서 플렉스 방향 변경
        if (!isLandscape || isMobile) {
            arena.style.flexDirection = 'column';
        } else {
            arena.style.flexDirection = 'row';
        }
        
        // 적 영역 순서 조정
        const enemySide = document.querySelector('.enemy-side');
        if (enemySide) {
            if (!isLandscape || isMobile) {
                enemySide.style.order = '-1';
            } else {
                enemySide.style.order = '';
            }
        }
    },
    
    // ==========================================
    // UI 요소 조정
    // ==========================================
    adjustUIElements(isMobile, isSmallHeight) {
        // 배틀 로그
        const battleLog = document.querySelector('.battle-log');
        if (battleLog) {
            if (isMobile || isSmallHeight) {
                battleLog.style.display = 'none';
            } else {
                battleLog.style.display = '';
            }
        }
        
        // 턴 인디케이터
        const turnIndicator = document.querySelector('.turn-indicator');
        if (turnIndicator) {
            if (isMobile) {
                turnIndicator.style.display = 'none';
            } else {
                turnIndicator.style.display = '';
            }
        }
    },
    
    // ==========================================
    // 유틸리티 함수
    // ==========================================
    
    // 현재 브레이크포인트 가져오기
    getBreakpoint() {
        return this.currentBreakpoint;
    },
    
    // 모바일 여부
    isMobile() {
        return ['tiny', 'mobileSm', 'mobile'].includes(this.currentBreakpoint);
    },
    
    // 태블릿 여부
    isTablet() {
        return this.currentBreakpoint === 'tablet';
    },
    
    // 데스크탑 여부
    isDesktop() {
        return ['laptop', 'desktop', 'large', 'xlarge', '4k'].includes(this.currentBreakpoint);
    },
    
    // 터치 디바이스 여부
    isTouchDevice() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches
        );
    },
    
    // 스케일 값 가져오기
    getScale() {
        const scales = {
            tiny: 0.5,
            mobileSm: 0.6,
            mobile: 0.7,
            tablet: 0.8,
            laptop: 0.85,
            desktop: 1,
            large: 1.1,
            xlarge: 1.25,
            '4k': 1.5
        };
        return scales[this.currentBreakpoint] || 1;
    },
    
    // CSS 변수 동적 설정
    setCSSVariable(name, value) {
        document.documentElement.style.setProperty(name, value);
    },
    
    // ==========================================
    // 디버그 모드
    // ==========================================
    enableDebug() {
        this.debugMode = true;
        document.body.classList.add('debug-responsive');
        this.detectResolution();
        console.log('[Responsive] 디버그 모드 활성화');
    },
    
    disableDebug() {
        this.debugMode = false;
        document.body.classList.remove('debug-responsive');
        console.log('[Responsive] 디버그 모드 비활성화');
    },
    
    updateDebugInfo(width, height, realWidth, realHeight, dpr) {
        const bp = this.breakpoints[this.currentBreakpoint];
        document.body.setAttribute('data-width', `${width}px`);
        document.body.setAttribute('data-height', `${height}px`);
        document.body.setAttribute('data-res-class', `${bp?.name || ''} (DPR: ${dpr})`);
    },
    
    // ==========================================
    // 강제 리프레시
    // ==========================================
    refresh() {
        this.currentBreakpoint = null;
        this.currentHeightClass = null;
        this.detectResolution();
    },
    
    // ==========================================
    // 뷰포트 정보
    // ==========================================
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: this.isLandscape ? 'landscape' : 'portrait',
            breakpoint: this.currentBreakpoint,
            breakpointName: this.breakpoints[this.currentBreakpoint]?.name,
            heightClass: this.currentHeightClass,
            scale: this.getScale(),
            isMobile: this.isMobile(),
            isTablet: this.isTablet(),
            isDesktop: this.isDesktop(),
            isTouchDevice: this.isTouchDevice()
        };
    },
    
    // ==========================================
    // 전체 화면 토글
    // ==========================================
    async toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                console.log('[Responsive] 전체 화면 모드');
            } else {
                await document.exitFullscreen();
                console.log('[Responsive] 전체 화면 해제');
            }
        } catch (err) {
            console.warn('[Responsive] 전체 화면 전환 실패:', err);
        }
    },
    
    // ==========================================
    // 화면 잠금 (모바일)
    // ==========================================
    async lockOrientation(orientation = 'landscape') {
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock(orientation);
                console.log(`[Responsive] 화면 방향 잠금: ${orientation}`);
            }
        } catch (err) {
            console.warn('[Responsive] 화면 방향 잠금 실패:', err);
        }
    }
};

// ==========================================
// 전역 접근
// ==========================================
window.ResponsiveSystem = ResponsiveSystem;

// ==========================================
// 자동 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    ResponsiveSystem.init();
});

// DOM 로드 전에도 즉시 초기 감지 (깜빡임 방지)
if (document.readyState === 'loading') {
    // DOM 로딩 중이면 기다림
} else {
    // 이미 로드됨
    ResponsiveSystem.init();
}

console.log('[ResponsiveSystem] 로드 완료');


