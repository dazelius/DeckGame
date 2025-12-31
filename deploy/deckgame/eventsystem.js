// ==========================================
// Shadow Deck - Event System (이벤트 관리 시스템)
// ==========================================

const EventSystem = {
    // 등록된 이벤트들
    events: {},
    
    // 이벤트 가중치 (확률 조정)
    weights: {},
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[EventSystem] 이벤트 시스템 초기화');
        this.registerDefaultEvents();
    },
    
    // ==========================================
    // 기본 이벤트 등록
    // ==========================================
    registerDefaultEvents() {
        // 점성술사 이벤트는 event1.js에서 자동 등록됨
        // 여기서는 기본값만 설정 (event1.js 로드 전 폴백)
        
        console.log(`[EventSystem] 기본 이벤트 등록 대기 (개별 이벤트 파일에서 등록)`);
    },
    
    // ==========================================
    // 이벤트 등록
    // ==========================================
    register(id, eventData) {
        if (!id || !eventData) {
            console.error('[EventSystem] 이벤트 등록 실패: ID 또는 데이터 없음');
            return false;
        }
        
        this.events[id] = {
            id: id,
            name: eventData.name || '알 수 없는 이벤트',
            description: eventData.description || '',
            icon: eventData.icon || '❓',
            weight: eventData.weight || 10,
            condition: eventData.condition || (() => true),
            execute: eventData.execute || (() => {}),
            isFullscreen: eventData.isFullscreen || false, // 전체화면 이벤트 여부
            ...eventData
        };
        
        console.log(`[EventSystem] 이벤트 등록: ${id} (${eventData.name})`);
        return true;
    },
    
    // ==========================================
    // 이벤트 등록 해제
    // ==========================================
    unregister(id) {
        if (this.events[id]) {
            delete this.events[id];
            console.log(`[EventSystem] 이벤트 해제: ${id}`);
            return true;
        }
        return false;
    },
    
    // ==========================================
    // 조건을 만족하는 이벤트 목록
    // ==========================================
    getAvailableEvents() {
        return Object.values(this.events).filter(event => {
            try {
                return event.condition();
            } catch (e) {
                console.error(`[EventSystem] 조건 체크 실패: ${event.id}`, e);
                return false;
            }
        });
    },
    
    // ==========================================
    // 가중치 기반 랜덤 이벤트 선택
    // ==========================================
    selectRandomEvent() {
        const available = this.getAvailableEvents();
        
        if (available.length === 0) {
            console.warn('[EventSystem] 사용 가능한 이벤트 없음');
            return null;
        }
        
        // 전체 가중치 합계
        const totalWeight = available.reduce((sum, event) => sum + event.weight, 0);
        
        // 랜덤 값
        let random = Math.random() * totalWeight;
        
        // 가중치 기반 선택
        for (const event of available) {
            random -= event.weight;
            if (random <= 0) {
                return event;
            }
        }
        
        // 폴백
        return available[0];
    },
    
    // ==========================================
    // 이벤트 실행
    // ==========================================
    trigger(room, callbacks) {
        const event = this.selectRandomEvent();
        
        if (!event) {
            console.warn('[EventSystem] 실행할 이벤트 없음');
            callbacks?.onEmpty?.();
            return null;
        }
        
        console.log(`[EventSystem] 이벤트 실행: ${event.id} (${event.name})`);
        
        // 전체화면 이벤트인 경우 (점성술사 등)
        if (event.isFullscreen || event.id === 'tarot') {
            try {
                event.execute(room, callbacks);
            } catch (e) {
                console.error(`[EventSystem] 이벤트 실행 오류: ${event.id}`, e);
            }
            return event;
        }
        
        // 일반 이벤트는 콜백으로 UI 처리 위임
        callbacks?.onSelect?.(event);
        
        return event;
    },
    
    // ==========================================
    // 특정 이벤트 직접 실행
    // ==========================================
    triggerById(id, room, callbacks) {
        const event = this.events[id];
        
        if (!event) {
            console.error(`[EventSystem] 이벤트 없음: ${id}`);
            return null;
        }
        
        console.log(`[EventSystem] 이벤트 직접 실행: ${id}`);
        
        try {
            event.execute(room, callbacks);
        } catch (e) {
            console.error(`[EventSystem] 이벤트 실행 오류: ${id}`, e);
        }
        
        return event;
    },
    
    // ==========================================
    // 이벤트 목록 조회
    // ==========================================
    listEvents() {
        return Object.values(this.events).map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            weight: e.weight,
            available: e.condition()
        }));
    },
    
    // ==========================================
    // 이벤트 가중치 조정
    // ==========================================
    setWeight(id, weight) {
        if (this.events[id]) {
            this.events[id].weight = Math.max(0, weight);
            console.log(`[EventSystem] 가중치 변경: ${id} = ${weight}`);
            return true;
        }
        return false;
    },
    
    // ==========================================
    // 디버그: 이벤트 정보 출력
    // ==========================================
    debug() {
        console.log('=== EventSystem Debug ===');
        console.log('등록된 이벤트:', Object.keys(this.events).length);
        this.listEvents().forEach(e => {
            console.log(`  [${e.available ? '✓' : '✗'}] ${e.id}: ${e.name} (가중치: ${e.weight})`);
        });
        console.log('========================');
    }
};

// 전역 노출
window.EventSystem = EventSystem;

// 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EventSystem.init());
} else {
    EventSystem.init();
}

console.log('[EventSystem] eventsystem.js 로드 완료');

