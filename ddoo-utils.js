// =====================================================
// DDOO Utils - 유틸리티 함수 모음
// =====================================================

const DDOOUtils = {
    // 랜덤 값 계산 (배열 [min, max] 또는 단일 값)
    getRandValue(val) {
        if (Array.isArray(val)) {
            return val[0] + Math.random() * (val[1] - val[0]);
        }
        return val || 0;
    },
    
    // Promise 기반 딜레이
    delay(ms, speed = 1.0) {
        return new Promise(resolve => setTimeout(resolve, ms / speed));
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOUtils = DDOOUtils;
}

console.log('[DDOOUtils] 유틸리티 모듈 로드됨');
