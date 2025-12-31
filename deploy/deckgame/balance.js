// ==========================================
// Shadow Deck - 밸런스 시스템
// 거리 기반 난이도 스케일링
// ==========================================

const BalanceSystem = {
    // ==========================================
    // 기본 설정
    // ==========================================
    config: {
        // 거리당 스케일링 (시작방에서 1칸 멀어질 때마다) - 완화됨
        distanceScaling: {
            hpMultiplier: 0.04,        // HP +4% per distance (완화: 8% → 4%)
            damageMultiplier: 0.03,    // 공격력 +3% per distance (완화: 5% → 3%)
            goldMultiplier: 0.10,      // 골드 보상 +10% per distance
        },
        
        // 층별 스케일링 - 완화됨
        floorScaling: {
            hpMultiplier: 0.15,        // 층당 HP +15% (완화: 25% → 15%)
            damageMultiplier: 0.10,    // 층당 공격력 +10% (완화: 15% → 10%)
            goldMultiplier: 0.20,      // 층당 골드 +20%
        },
        
        // 스테이지별 기본 배율 - 완화됨
        stageMultiplier: {
            1: 1.0,     // 1스테이지 기본
            2: 1.3,     // 2스테이지 1.3배 (완화: 1.5 → 1.3)
            3: 1.6,     // 3스테이지 1.6배 (완화: 2.0 → 1.6)
        },
        
        // 방 타입별 보너스 - 엘리트/보스 완화
        roomTypeBonus: {
            monster: { hp: 1.0, damage: 1.0, gold: 1.0 },
            elite: { hp: 1.2, damage: 1.1, gold: 2.0 },   // (완화: hp 1.3→1.2, dmg 1.2→1.1)
            boss: { hp: 1.3, damage: 1.2, gold: 3.0 },    // (완화: hp 1.5→1.3, dmg 1.3→1.2)
        },
        
        // 맵 규모 설정 (층별)
        mapSize: {
            1: { gridSize: 9, roomCount: { min: 12, max: 16 } },  // 1층: 넓은 맵
            2: { gridSize: 7, roomCount: { min: 10, max: 14 } },  // 2층: 중간
            3: { gridSize: 7, roomCount: { min: 8, max: 12 } },   // 3층: 집중된 맵
        },
        
        // 적 수 스케일링 (거리에 따라) - 점진적 증가
        enemyCountByDistance: {
            0: { min: 1, max: 1 },     // 시작 바로 옆: 1마리
            1: { min: 1, max: 1 },     // 1칸: 1마리
            2: { min: 1, max: 1 },     // 2칸: 1마리
            3: { min: 1, max: 2 },     // 3칸: 1~2마리
            4: { min: 1, max: 2 },     // 4칸: 1~2마리
            5: { min: 2, max: 2 },     // 5칸: 2마리
            6: { min: 2, max: 3 },     // 6칸 이상: 2~3마리
        },
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[Balance] 밸런스 시스템 초기화');
    },
    
    // ==========================================
    // 거리 계산
    // ==========================================
    
    // 시작방에서의 맨해튼 거리 계산
    getDistanceFromStart(room, mapSystem) {
        if (!room || !mapSystem) return 0;
        
        const startRoom = mapSystem.rooms?.find(r => r.type === mapSystem.ROOM_TYPE?.START);
        if (!startRoom) return 0;
        
        return Math.abs(room.x - startRoom.x) + Math.abs(room.y - startRoom.y);
    },
    
    // 현재 방의 거리 가져오기
    getCurrentDistance() {
        if (typeof MapSystem === 'undefined') return 0;
        return this.getDistanceFromStart(MapSystem.currentRoom, MapSystem);
    },
    
    // ==========================================
    // 스케일링 계산
    // ==========================================
    
    // 종합 배율 계산
    getScaling(distance, floor = 1, stage = 1, roomType = 'monster') {
        const cfg = this.config;
        
        // 기본 배율
        const stageBase = cfg.stageMultiplier[stage] || 1.0;
        const roomBonus = cfg.roomTypeBonus[roomType] || cfg.roomTypeBonus.monster;
        
        // 거리 기반 스케일링
        const distanceHp = 1 + (distance * cfg.distanceScaling.hpMultiplier);
        const distanceDmg = 1 + (distance * cfg.distanceScaling.damageMultiplier);
        const distanceGold = 1 + (distance * cfg.distanceScaling.goldMultiplier);
        
        // 층 기반 스케일링
        const floorHp = 1 + ((floor - 1) * cfg.floorScaling.hpMultiplier);
        const floorDmg = 1 + ((floor - 1) * cfg.floorScaling.damageMultiplier);
        const floorGold = 1 + ((floor - 1) * cfg.floorScaling.goldMultiplier);
        
        return {
            hp: stageBase * roomBonus.hp * distanceHp * floorHp,
            damage: stageBase * roomBonus.damage * distanceDmg * floorDmg,
            gold: stageBase * roomBonus.gold * distanceGold * floorGold,
            distance: distance,
            floor: floor,
            stage: stage,
        };
    },
    
    // 현재 상황에서의 스케일링
    getCurrentScaling(roomType = 'monster') {
        const distance = this.getCurrentDistance();
        const floor = typeof MapSystem !== 'undefined' ? MapSystem.currentFloor : 1;
        const stage = typeof MapSystem !== 'undefined' ? MapSystem.currentStage : 1;
        
        return this.getScaling(distance, floor, stage, roomType);
    },
    
    // ==========================================
    // 몬스터 스탯 조정
    // ==========================================
    
    // 몬스터 HP 조정
    scaleMonsterHp(baseHp, room) {
        const distance = typeof MapSystem !== 'undefined' 
            ? this.getDistanceFromStart(room, MapSystem) 
            : 0;
        const floor = typeof MapSystem !== 'undefined' ? MapSystem.currentFloor : 1;
        const stage = typeof MapSystem !== 'undefined' ? MapSystem.currentStage : 1;
        const roomType = room?.type === 'elite' ? 'elite' : room?.type === 'boss' ? 'boss' : 'monster';
        
        const scaling = this.getScaling(distance, floor, stage, roomType);
        const scaledHp = Math.round(baseHp * scaling.hp);
        
        console.log(`[Balance] HP 스케일링: ${baseHp} → ${scaledHp} (거리: ${distance}, 배율: ${scaling.hp.toFixed(2)})`);
        
        return scaledHp;
    },
    
    // 몬스터 공격력 조정
    scaleMonsterDamage(baseDamage, room) {
        const distance = typeof MapSystem !== 'undefined' 
            ? this.getDistanceFromStart(room, MapSystem) 
            : 0;
        const floor = typeof MapSystem !== 'undefined' ? MapSystem.currentFloor : 1;
        const stage = typeof MapSystem !== 'undefined' ? MapSystem.currentStage : 1;
        const roomType = room?.type === 'elite' ? 'elite' : room?.type === 'boss' ? 'boss' : 'monster';
        
        const scaling = this.getScaling(distance, floor, stage, roomType);
        const scaledDamage = Math.round(baseDamage * scaling.damage);
        
        return scaledDamage;
    },
    
    // ==========================================
    // 적 수 결정
    // ==========================================
    
    // 거리 기반 적 수 결정
    getEnemyCountForRoom(room) {
        const distance = typeof MapSystem !== 'undefined' 
            ? this.getDistanceFromStart(room, MapSystem) 
            : 0;
        
        // 거리 구간 결정 (최대 6으로 제한)
        const distanceKey = Math.min(distance, 6);
        const countRange = this.config.enemyCountByDistance[distanceKey] 
            || this.config.enemyCountByDistance[6];
        
        const count = Math.floor(Math.random() * (countRange.max - countRange.min + 1)) + countRange.min;
        
        console.log(`[Balance] 적 수 결정: 거리 ${distance} → ${count}마리 (범위: ${countRange.min}~${countRange.max})`);
        
        return count;
    },
    
    // ==========================================
    // 보상 조정
    // ==========================================
    
    // 골드 보상 조정
    scaleGoldReward(baseGold, room) {
        const distance = typeof MapSystem !== 'undefined' 
            ? this.getDistanceFromStart(room, MapSystem) 
            : 0;
        const floor = typeof MapSystem !== 'undefined' ? MapSystem.currentFloor : 1;
        const stage = typeof MapSystem !== 'undefined' ? MapSystem.currentStage : 1;
        const roomType = room?.type === 'elite' ? 'elite' : room?.type === 'boss' ? 'boss' : 'monster';
        
        const scaling = this.getScaling(distance, floor, stage, roomType);
        const scaledGold = Math.round(baseGold * scaling.gold);
        
        console.log(`[Balance] 골드 스케일링: ${baseGold} → ${scaledGold} (거리: ${distance})`);
        
        return scaledGold;
    },
    
    // ==========================================
    // 맵 규모 설정
    // ==========================================
    
    // 층에 맞는 맵 설정 가져오기
    getMapConfig(floor = 1) {
        return this.config.mapSize[floor] || this.config.mapSize[1];
    },
    
    // 그리드 크기 가져오기
    getGridSize(floor = 1) {
        return this.getMapConfig(floor).gridSize;
    },
    
    // 방 개수 범위 가져오기
    getRoomCountRange(floor = 1) {
        return this.getMapConfig(floor).roomCount;
    },
    
    // ==========================================
    // 난이도 표시 (UI용)
    // ==========================================
    
    // 거리에 따른 난이도 레벨 (1~5)
    getDifficultyLevel(distance) {
        if (distance <= 1) return 1;  // ★
        if (distance <= 2) return 2;  // ★★
        if (distance <= 3) return 3;  // ★★★
        if (distance <= 4) return 4;  // ★★★★
        return 5;                      // ★★★★★
    },
    
    // 난이도 표시 문자열
    getDifficultyString(distance) {
        const level = this.getDifficultyLevel(distance);
        return '★'.repeat(level) + '☆'.repeat(5 - level);
    },
    
    // 난이도 색상
    getDifficultyColor(distance) {
        const level = this.getDifficultyLevel(distance);
        const colors = {
            1: '#4ade80',  // 초록
            2: '#fbbf24',  // 노랑
            3: '#f97316',  // 주황
            4: '#ef4444',  // 빨강
            5: '#a855f7',  // 보라
        };
        return colors[level] || '#ffffff';
    },
    
    // ==========================================
    // 디버그
    // ==========================================
    
    // 현재 밸런스 상태 출력
    debug() {
        const distance = this.getCurrentDistance();
        const scaling = this.getCurrentScaling();
        
        console.log('=== Balance Debug ===');
        console.log(`거리: ${distance}`);
        console.log(`층: ${scaling.floor}`);
        console.log(`스테이지: ${scaling.stage}`);
        console.log(`HP 배율: ${scaling.hp.toFixed(2)}`);
        console.log(`데미지 배율: ${scaling.damage.toFixed(2)}`);
        console.log(`골드 배율: ${scaling.gold.toFixed(2)}`);
        console.log(`난이도: ${this.getDifficultyString(distance)}`);
        console.log('====================');
        
        return scaling;
    },
};

// 전역 접근
window.BalanceSystem = BalanceSystem;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    BalanceSystem.init();
});

console.log('[Balance] 밸런스 시스템 로드 완료');

