// ==========================================
// Shadow Deck - 애니메이션 로더
// JSON 기반 애니메이션 데이터 관리
// ==========================================

const AnimLoader = {
    // 로드된 애니메이션 캐시
    cache: new Map(),
    
    // 로딩 상태
    loading: new Map(),
    
    // 기본 경로
    basePath: 'anim/',
    
    // 사전 로드할 애니메이션 목록
    preloadList: [
        // 플레이어
        'player.attack',
        'player.stab',
        'player.hit',
        'player.dash',
        'player.defend',
        'player.return',
        // 적
        'enemy.attack',
        'enemy.hit',
        'enemy.dash',
        // 카드
        'card.strike',
        'card.bash',
        'card.flurry',
        'card.flurryP'
    ],
    
    // ==========================================
    // 초기화 - 사전 로드
    // ==========================================
    async init() {
        console.log('[AnimLoader] 🎬 애니메이션 로더 초기화');
        
        const startTime = performance.now();
        let loaded = 0;
        let failed = 0;
        
        // 병렬 로드
        const promises = this.preloadList.map(async (id) => {
            try {
                await this.load(id);
                loaded++;
            } catch (e) {
                console.warn(`[AnimLoader] ⚠️ 로드 실패: ${id}`);
                failed++;
            }
        });
        
        await Promise.all(promises);
        
        const elapsed = (performance.now() - startTime).toFixed(1);
        console.log(`[AnimLoader] ✅ 로드 완료: ${loaded}개 성공, ${failed}개 실패 (${elapsed}ms)`);
        
        // AnimationSystem에 등록
        this.registerToSystem();
        
        return { loaded, failed };
    },
    
    // ==========================================
    // 단일 애니메이션 로드
    // ==========================================
    async load(id) {
        // 캐시 확인
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        
        // 중복 로딩 방지
        if (this.loading.has(id)) {
            return this.loading.get(id);
        }
        
        // 로딩 시작
        const loadPromise = this.fetchAnimation(id);
        this.loading.set(id, loadPromise);
        
        try {
            const anim = await loadPromise;
            this.cache.set(id, anim);
            this.loading.delete(id);
            return anim;
        } catch (e) {
            this.loading.delete(id);
            throw e;
        }
    },
    
    // ==========================================
    // JSON 파일 가져오기
    // ==========================================
    async fetchAnimation(id) {
        const url = `${this.basePath}${id}.json`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // 유효성 검사
            if (!data.id) {
                data.id = id;
            }
            
            console.log(`[AnimLoader] 📂 로드됨: ${id}`);
            return data;
            
        } catch (e) {
            console.error(`[AnimLoader] ❌ 로드 실패: ${url}`, e.message);
            throw e;
        }
    },
    
    // ==========================================
    // 캐시에서 가져오기 (동기)
    // ==========================================
    get(id) {
        return this.cache.get(id) || null;
    },
    
    // ==========================================
    // 캐시 확인
    // ==========================================
    has(id) {
        return this.cache.has(id);
    },
    
    // ==========================================
    // AnimationSystem에 등록
    // ==========================================
    registerToSystem() {
        if (typeof AnimationSystem === 'undefined') {
            console.warn('[AnimLoader] AnimationSystem 없음, 등록 스킵');
            return;
        }
        
        let count = 0;
        
        this.cache.forEach((anim, id) => {
            // AnimationSystem 형식으로 변환
            const converted = this.convertToSystemFormat(anim);
            AnimationSystem.register(id, converted);
            count++;
        });
        
        console.log(`[AnimLoader] 📝 AnimationSystem에 ${count}개 등록`);
    },
    
    // ==========================================
    // 시스템 형식 변환
    // ==========================================
    convertToSystemFormat(anim) {
        const result = {
            name: anim.name || anim.id,
            target: anim.target || 'player',
            type: anim.type || 'once',
            priority: anim.priority || 0,
            duration: anim.duration,
            returnToBase: anim.returnToBase || false
        };
        
        // 키프레임
        if (anim.keyframes) {
            result.keyframes = anim.keyframes.map(kf => {
                const frame = { ...kf };
                // tint 문자열 → 숫자 변환
                if (typeof frame.tint === 'string') {
                    frame.tint = parseInt(frame.tint.replace('0x', ''), 16);
                }
                return frame;
            });
        }
        
        // 시퀀스 스텝
        if (anim.steps) {
            result.steps = anim.steps;
        }
        
        // 이벤트
        if (anim.events) {
            result.events = anim.events;
        }
        
        // VFX 설정
        if (anim.vfx) {
            result.vfx = anim.vfx;
        }
        
        return result;
    },
    
    // ==========================================
    // 동적 로드 후 재생
    // ==========================================
    async loadAndPlay(id, options = {}) {
        // 로드 안됐으면 로드
        if (!this.has(id)) {
            try {
                await this.load(id);
                this.registerToSystem();
            } catch (e) {
                console.error(`[AnimLoader] 재생 실패: ${id}`, e);
                return Promise.resolve();
            }
        }
        
        // AnimationSystem으로 재생
        if (typeof AnimationSystem !== 'undefined') {
            return AnimationSystem.play(id, options);
        }
        
        return Promise.resolve();
    },
    
    // ==========================================
    // 카드 애니메이션 가져오기
    // ==========================================
    getCardAnimation(cardId) {
        // card. 접두사 추가
        const animId = cardId.startsWith('card.') ? cardId : `card.${cardId}`;
        return this.get(animId);
    },
    
    // ==========================================
    // 카드 애니메이션 재생
    // ==========================================
    async playCardAnimation(cardId, options = {}) {
        const animId = cardId.startsWith('card.') ? cardId : `card.${cardId}`;
        return this.loadAndPlay(animId, options);
    },
    
    // ==========================================
    // 캐시 클리어
    // ==========================================
    clearCache() {
        this.cache.clear();
        console.log('[AnimLoader] 🗑️ 캐시 클리어');
    },
    
    // ==========================================
    // 디버그 정보
    // ==========================================
    getDebugInfo() {
        return {
            cached: this.cache.size,
            loading: this.loading.size,
            list: Array.from(this.cache.keys())
        };
    },
    
    // ==========================================
    // 모든 애니메이션 목록
    // ==========================================
    listAll() {
        const list = {
            player: [],
            enemy: [],
            card: [],
            other: []
        };
        
        this.cache.forEach((anim, id) => {
            if (id.startsWith('player.')) {
                list.player.push(id);
            } else if (id.startsWith('enemy.')) {
                list.enemy.push(id);
            } else if (id.startsWith('card.')) {
                list.card.push(id);
            } else {
                list.other.push(id);
            }
        });
        
        return list;
    }
};

// 전역 노출
window.AnimLoader = AnimLoader;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    // AnimationSystem 로드 후 초기화
    setTimeout(() => {
        AnimLoader.init();
    }, 100);
});

// 즉시 실행 (이미 로드된 경우)
if (document.readyState !== 'loading') {
    setTimeout(() => {
        AnimLoader.init();
    }, 100);
}

