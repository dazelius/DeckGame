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
    // 🎯 기준 해상도 (모든 좌표 계산의 기준)
    // ==========================================
    baseWidth: 1920,
    baseHeight: 1080,
    baseAspect: 16 / 9,
    
    // 현재 화면 정보
    screen: {
        width: 1920,
        height: 1080,
        scale: 1,
        aspect: 16 / 9
    },
    
    // 게임 영역 (종횡비 유지 시 레터박스 적용)
    gameArea: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        scale: 1
    },
    
    // 설정
    layoutConfig: {
        maintainAspect: false,     // 종횡비 강제 유지 (레터박스)
        targetAspect: 16 / 9,      // 목표 종횡비
        minScale: 0.5,
        maxScale: 2.0
    },
    
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
        this.updateGameArea();
        
        // 리사이즈 이벤트 리스너 (디바운스 적용)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.detectResolution();
                this.updateGameArea();
                this.notifyRenderers();
            }, 100);
        });
        
        // 방향 변경 이벤트
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.detectResolution();
                this.updateGameArea();
                this.notifyRenderers();
            }, 100);
        });
        
        // 풀스크린 변경 이벤트
        document.addEventListener('fullscreenchange', () => {
            this.detectResolution();
            this.updateGameArea();
            this.notifyRenderers();
        });
        
        console.log('[Responsive] 초기화 완료');
    },
    
    // ==========================================
    // 🎯 게임 영역 계산
    // ==========================================
    updateGameArea() {
        this.screen.width = window.innerWidth;
        this.screen.height = window.innerHeight;
        this.screen.aspect = this.screen.width / this.screen.height;
        
        if (this.layoutConfig.maintainAspect) {
            // 종횡비 유지 모드 (레터박스/필러박스)
            const targetAspect = this.layoutConfig.targetAspect;
            let width, height, x, y;
            
            if (this.screen.aspect > targetAspect) {
                // 화면이 더 넓음 → 좌우 필러박스
                height = this.screen.height;
                width = height * targetAspect;
                x = (this.screen.width - width) / 2;
                y = 0;
            } else {
                // 화면이 더 높음 → 상하 레터박스
                width = this.screen.width;
                height = width / targetAspect;
                x = 0;
                y = (this.screen.height - height) / 2;
            }
            
            this.gameArea = { x, y, width, height };
        } else {
            // 전체 화면 사용
            this.gameArea = {
                x: 0,
                y: 0,
                width: this.screen.width,
                height: this.screen.height
            };
        }
        
        // 스케일 계산 (기준 해상도 대비)
        this.gameArea.scale = Math.min(
            this.gameArea.width / this.baseWidth,
            this.gameArea.height / this.baseHeight
        );
        this.gameArea.scale = Math.max(
            this.layoutConfig.minScale,
            Math.min(this.layoutConfig.maxScale, this.gameArea.scale)
        );
        
        this.screen.scale = this.gameArea.scale;
        
        // CSS 변수 업데이트
        const root = document.documentElement;
        root.style.setProperty('--game-scale', this.gameArea.scale);
        root.style.setProperty('--game-width', `${this.gameArea.width}px`);
        root.style.setProperty('--game-height', `${this.gameArea.height}px`);
    },
    
    // ==========================================
    // 🎯 렌더러 알림
    // ==========================================
    notifyRenderers() {
        // 🎯 1. Background3D 먼저! (arena 캐시 무효화)
        if (typeof Background3D !== 'undefined' && Background3D.handleResize) {
            Background3D.handleResize();
        }
        
        // 🎯 2. PixiJS 렌더러들 (캔버스 리사이즈)
        if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.handleResize) {
            EnemyRenderer.handleResize();
        }
        if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.handleResize) {
            PlayerRenderer.handleResize();
        }
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.resize) {
            PixiRenderer.resize();
        }
        
        // 🎯 3. 추가 딜레이 후 한번 더 갱신 (레이아웃 완전 안정화 후)
        setTimeout(() => {
            if (typeof Background3D !== 'undefined' && Background3D.forceUpdateAllCharacters) {
                Background3D.forceUpdateAllCharacters();
            }
        }, 50);
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
    // 🎯 좌표 변환 유틸리티
    // ==========================================
    
    /**
     * 기준 좌표(1920x1080)를 현재 화면 좌표로 변환
     * @param {number} x - 기준 해상도 기준 X (0~1920)
     * @param {number} y - 기준 해상도 기준 Y (0~1080)
     * @returns {{x: number, y: number}} 화면 좌표
     */
    toScreenCoords(x, y) {
        return {
            x: this.gameArea.x + (x / this.baseWidth) * this.gameArea.width,
            y: this.gameArea.y + (y / this.baseHeight) * this.gameArea.height
        };
    },
    
    /**
     * 화면 좌표를 기준 좌표로 변환
     * @param {number} screenX - 화면 X
     * @param {number} screenY - 화면 Y
     * @returns {{x: number, y: number}} 기준 해상도 좌표 (0~1920, 0~1080)
     */
    toBaseCoords(screenX, screenY) {
        return {
            x: ((screenX - this.gameArea.x) / this.gameArea.width) * this.baseWidth,
            y: ((screenY - this.gameArea.y) / this.gameArea.height) * this.baseHeight
        };
    },
    
    /**
     * 기준 크기를 현재 화면 크기로 스케일링
     * @param {number} size - 기준 해상도 기준 크기
     * @returns {number} 화면 크기
     */
    scaleSize(size) {
        return size * this.screen.scale;
    },
    
    /**
     * 비율 기반 X 좌표 (0~1 → 화면 X)
     */
    percentX(percent) {
        return this.gameArea.x + this.gameArea.width * percent;
    },
    
    /**
     * 비율 기반 Y 좌표 (0~1 → 화면 Y)
     */
    percentY(percent) {
        return this.gameArea.y + this.gameArea.height * percent;
    },
    
    /**
     * battle-arena 영역 정보 반환
     */
    getBattleArea() {
        const arena = document.querySelector('.battle-arena');
        if (arena) {
            const rect = arena.getBoundingClientRect();
            return {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                scale: this.screen.scale
            };
        }
        // 폴백: 게임 영역의 상단 60%
        return {
            x: this.gameArea.x,
            y: this.gameArea.y,
            width: this.gameArea.width,
            height: this.gameArea.height * 0.6,
            scale: this.screen.scale
        };
    },
    
    /**
     * 게임 영역 정보 반환
     */
    getGameArea() {
        return { ...this.gameArea };
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


