// =====================================================
// Constants - 게임 전역 상수 정의
// 매직 넘버 대신 이 파일의 상수를 사용하세요!
// =====================================================

const GameConstants = {
    
    // ==========================================
    // 게임 컨테이너 설정
    // ==========================================
    GAME_CONTAINER: {
        SCALE: 1.25,           // gameWorld 컨테이너 스케일
        OFFSET_Y: 60,          // gameWorld Y 오프셋
    },

    // ==========================================
    // 카드 드래그 설정
    // ==========================================
    CARD_DRAG: {
        // 기본 드래그 상태 (커서 끝에 대롱대롱)
        NORMAL: {
            SCALE: 1.15,
            ROTATE: -5,        // deg
            OFFSET_X: 5,       // 커서 오른쪽으로
            OFFSET_Y: 10,      // 커서 아래로
        },
        
        // 타겟 호버 상태 (빨려들어가는 느낌)
        HOVER: {
            SCALE: 0.5,
            ROTATE: 0,
            OFFSET_X: -40,     // 커서 왼쪽으로 (중앙 정렬)
            OFFSET_Y: -50,     // 커서 위로
        },
        
        // 사용 준비 상태 (위로 드래그)
        READY: {
            SCALE: 0.75,
            ROTATE: 0,
            OFFSET_X: -60,
            OFFSET_Y: -70,
        },
        
        // 드래그 활성화 임계값
        ACTIVATE_THRESHOLD: 100,  // 위로 100px 드래그하면 사용 준비
        
        // 시작 시 원본 카드 스타일
        ORIGINAL_CARD: {
            OPACITY: 0.3,
            SCALE: 0.9,
        },
    },

    // ==========================================
    // 그리드 설정
    // ==========================================
    GRID: {
        WIDTH: 10,             // X축 셀 수
        DEPTH: 3,              // Z축 셀 수 (레인 수)
        PLAYER_ZONE_X: 5,      // 플레이어 영역 경계 (0~4가 플레이어)
    },

    // ==========================================
    // 쉴드 이펙트 설정
    // ==========================================
    SHIELD: {
        // 3D 쉴드
        DEFAULT_RADIUS: 60,
        DEFAULT_COLOR: 0x00aaff,
        DEFAULT_DURATION: 1000,
        BLOCK_GAIN_DURATION: 2000,
        
        // 피격 이펙트
        HIT: {
            FRAGMENT_COUNT_MIN: 3,
            FRAGMENT_COUNT_MULTIPLIER: 3,
            FRAGMENT_SIZE_MIN: 8,
            FRAGMENT_SIZE_MAX: 23,
            FRAGMENT_SPEED_MIN: 8,
            FRAGMENT_SPEED_MAX: 20,
            COLORS: [0xffffff, 0x88ddff, 0x00ccff, 0x44ffff, 0x00aaff],
        },
    },

    // ==========================================
    // 카드 테두리 색상
    // ==========================================
    CARD_BORDER: {
        DEFAULT: '#666',
        ATTACK_TARGET: '#ff4444',
        SKILL_TARGET: '#44aaff',
        SUMMON_VALID: '#44ff44',
        READY: '#44ff44',
    },

    // ==========================================
    // 레인 Y 위치 비율 (스피어 타겟팅용)
    // ==========================================
    LANE_Y_RATIO: {
        TOP: 0.35,             // 상단 35% 이하 → 0번 레인
        BOTTOM: 0.65,          // 하단 65% 이상 → 2번 레인
        // 그 사이 → 1번 레인 (중앙)
    },

    // ==========================================
    // 유닛 히트 테스트
    // ==========================================
    HIT_TEST: {
        PADDING: 50,           // 히트박스 여유 픽셀
        DEFAULT_WIDTH: 80,     // 기본 스프라이트 너비
        DEFAULT_HEIGHT: 100,   // 기본 스프라이트 높이
    },
};

// ==========================================
// 헬퍼 함수
// ==========================================

/**
 * 카드 드래그 스타일 문자열 생성
 * @param {string} state - 'NORMAL' | 'HOVER' | 'READY'
 */
GameConstants.getCardTransform = function(state) {
    const config = this.CARD_DRAG[state] || this.CARD_DRAG.NORMAL;
    return `scale(${config.SCALE}) rotate(${config.ROTATE}deg)`;
};

/**
 * 카드 위치 계산
 * @param {number} clientX - 마우스 X
 * @param {number} clientY - 마우스 Y
 * @param {string} state - 'NORMAL' | 'HOVER' | 'READY'
 */
GameConstants.getCardPosition = function(clientX, clientY, state) {
    const config = this.CARD_DRAG[state] || this.CARD_DRAG.NORMAL;
    return {
        left: clientX + config.OFFSET_X,
        top: clientY + config.OFFSET_Y,
    };
};

/**
 * 고스트 카드 스타일 적용
 * @param {HTMLElement} ghost - 고스트 요소
 * @param {number} clientX - 마우스 X
 * @param {number} clientY - 마우스 Y
 * @param {string} state - 'NORMAL' | 'HOVER' | 'READY'
 * @param {string} borderColor - 테두리 색상 (optional)
 */
GameConstants.applyGhostStyle = function(ghost, clientX, clientY, state, borderColor) {
    const pos = this.getCardPosition(clientX, clientY, state);
    ghost.style.transform = this.getCardTransform(state);
    ghost.style.left = pos.left + 'px';
    ghost.style.top = pos.top + 'px';
    
    if (borderColor) {
        const dragCard = ghost.querySelector('.drag-card');
        if (dragCard) dragCard.style.borderColor = borderColor;
    }
};

// 전역 접근용 단축 참조
const GC = GameConstants;

console.log('[GameConstants] 상수 모듈 로드 완료');
