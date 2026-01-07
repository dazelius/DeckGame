// =====================================================
// Save - 저장/불러오기 시스템
// =====================================================

const Save = {
    // ========== 설정 ==========
    config: {
        storageKey: 'ddoo_save',
        version: '1.0.0',
        autoSaveInterval: 60000  // 1분
    },
    
    // ========== 상태 ==========
    state: {
        initialized: false,
        autoSaveTimer: null,
        lastSave: null
    },
    
    // ========== 초기화 ==========
    init(options = {}) {
        if (this.state.initialized) return this;
        
        Object.assign(this.config, options);
        
        this.state.initialized = true;
        console.log('[Save] ✅ 초기화 완료');
        return this;
    },
    
    // ========== 저장 ==========
    
    /**
     * 게임 상태 저장
     * @param {object} gameState - 저장할 게임 상태
     * @returns {boolean} 성공 여부
     */
    save(gameState) {
        try {
            const saveData = {
                meta: {
                    version: this.config.version,
                    timestamp: Date.now(),
                    playtime: gameState.playtime || 0
                },
                data: gameState
            };
            
            const json = JSON.stringify(saveData);
            localStorage.setItem(this.config.storageKey, json);
            
            this.state.lastSave = Date.now();
            console.log('[Save] ✅ 저장 완료');
            return true;
        } catch (e) {
            console.error('[Save] ❌ 저장 실패:', e);
            return false;
        }
    },
    
    /**
     * 게임 상태 불러오기
     * @returns {object|null} 저장된 게임 상태
     */
    load() {
        try {
            const json = localStorage.getItem(this.config.storageKey);
            if (!json) {
                console.log('[Save] 저장 데이터 없음');
                return null;
            }
            
            const saveData = JSON.parse(json);
            
            // 버전 체크
            if (saveData.meta?.version !== this.config.version) {
                console.warn('[Save] ⚠️ 버전 불일치:', saveData.meta?.version);
                // 마이그레이션 로직 추가 가능
            }
            
            console.log('[Save] ✅ 불러오기 완료');
            return saveData.data;
        } catch (e) {
            console.error('[Save] ❌ 불러오기 실패:', e);
            return null;
        }
    },
    
    /**
     * 저장 데이터 존재 여부
     */
    exists() {
        return localStorage.getItem(this.config.storageKey) !== null;
    },
    
    /**
     * 저장 데이터 삭제
     */
    clear() {
        localStorage.removeItem(this.config.storageKey);
        console.log('[Save] 🗑️ 데이터 삭제됨');
    },
    
    // ========== 자동 저장 ==========
    
    /**
     * 자동 저장 시작
     * @param {function} getState - 현재 게임 상태를 반환하는 함수
     */
    startAutoSave(getState) {
        this.stopAutoSave();
        
        this.state.autoSaveTimer = setInterval(() => {
            const state = getState();
            if (state) {
                this.save(state);
                console.log('[Save] 🔄 자동 저장');
            }
        }, this.config.autoSaveInterval);
        
        console.log('[Save] ⏰ 자동 저장 시작');
    },
    
    /**
     * 자동 저장 중지
     */
    stopAutoSave() {
        if (this.state.autoSaveTimer) {
            clearInterval(this.state.autoSaveTimer);
            this.state.autoSaveTimer = null;
            console.log('[Save] ⏹️ 자동 저장 중지');
        }
    },
    
    // ========== 슬롯 저장 (다중 세이브) ==========
    
    /**
     * 특정 슬롯에 저장
     * @param {number} slot - 슬롯 번호 (0-2)
     * @param {object} gameState - 저장할 상태
     */
    saveToSlot(slot, gameState) {
        const key = `${this.config.storageKey}_slot${slot}`;
        try {
            const saveData = {
                meta: {
                    version: this.config.version,
                    timestamp: Date.now(),
                    slot: slot
                },
                data: gameState
            };
            localStorage.setItem(key, JSON.stringify(saveData));
            console.log(`[Save] ✅ 슬롯 ${slot} 저장 완료`);
            return true;
        } catch (e) {
            console.error(`[Save] ❌ 슬롯 ${slot} 저장 실패:`, e);
            return false;
        }
    },
    
    /**
     * 특정 슬롯에서 불러오기
     * @param {number} slot - 슬롯 번호
     */
    loadFromSlot(slot) {
        const key = `${this.config.storageKey}_slot${slot}`;
        try {
            const json = localStorage.getItem(key);
            if (!json) return null;
            return JSON.parse(json).data;
        } catch (e) {
            console.error(`[Save] ❌ 슬롯 ${slot} 불러오기 실패:`, e);
            return null;
        }
    },
    
    /**
     * 모든 슬롯 정보 가져오기
     */
    getSlotInfo() {
        const slots = [];
        for (let i = 0; i < 3; i++) {
            const key = `${this.config.storageKey}_slot${i}`;
            try {
                const json = localStorage.getItem(key);
                if (json) {
                    const data = JSON.parse(json);
                    slots.push({
                        slot: i,
                        timestamp: data.meta?.timestamp,
                        exists: true
                    });
                } else {
                    slots.push({ slot: i, exists: false });
                }
            } catch (e) {
                slots.push({ slot: i, exists: false });
            }
        }
        return slots;
    },
    
    // ========== 정리 ==========
    
    dispose() {
        this.stopAutoSave();
        this.state.initialized = false;
        console.log('[Save] 🗑️ 정리 완료');
    }
};

// 전역 노출
window.Save = Save;

console.log('[Save] 스크립트 로드됨');
