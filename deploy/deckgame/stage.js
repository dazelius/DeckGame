// ==========================================
// 스테이지 데이터
// ==========================================

const StageData = {
    // 스테이지 정보
    stages: {
        // 1스테이지: 고블린 소굴
        1: {
            name: "고블린 소굴",
            background: "bg.png",
            monsters: ['goblinRogue', 'goblinArcher', 'shadowSlime', 'direWolf', 'goblinShaman', 'fanatic', 'rageGolem'],
            elites: ['thornGuardian'],
            boss: 'goblinKing',
            enemyCount: { min: 1, max: 2 },
            // 잡혀있는 NPC
            capturedNpc: {
                npcId: 'hoodgirl',
                roomType: 'boss',
                chance: 1.0
            }
        },
        
        // 2스테이지: 어둠의 숲
        2: {
            name: "어둠의 숲",
            background: "bg.png",
            monsters: ['goblinRogue', 'goblinArcher', 'shadowSlime', 'direWolf', 'poisonSpider', 'goblinShaman', 'fanatic', 'fireElemental', 'rageGolem'],
            elites: ['thornGuardian', 'giantSpider'],
            boss: 'abyssLord',
            enemyCount: { min: 1, max: 3 },
            capturedNpc: {
                npcId: 'smith',
                roomType: 'boss',
                chance: 1.0
            }
        },
        
        // 3스테이지: 심연의 성
        3: {
            name: "심연의 성",
            background: "bg.png",
            monsters: ['shadowSlime', 'direWolf', 'poisonSpider', 'skeletonWarrior', 'fanatic', 'fireElemental', 'mimic', 'rageGolem'],
            elites: ['thornGuardian', 'giantSpider'],
            boss: 'fireKing',
            enemyCount: { min: 2, max: 3 }
        }
    },
    
    // 스테이지 정보 가져오기
    getStage(stageNum) {
        return this.stages[stageNum] || this.stages[1];
    },
    
    // 몬스터 랜덤 선택
    selectMonster(stageData) {
        if (!stageData || !stageData.monsters || stageData.monsters.length === 0) {
            return 'goblinRogue';
        }
        return stageData.monsters[Math.floor(Math.random() * stageData.monsters.length)];
    },
    
    // 엘리트 랜덤 선택
    selectElite(stageData) {
        if (!stageData || !stageData.elites || stageData.elites.length === 0) {
            return 'thornGuardian';
        }
        return stageData.elites[Math.floor(Math.random() * stageData.elites.length)];
    },
    
    // 보스 가져오기
    getBoss(stageData) {
        return stageData?.boss || 'goblinKing';
    }
};

// 가중치 기반 스테이지 데이터 (하위 호환성)
const stageData = {
    stage1: {
        name: "고블린 소굴",
        background: "bg.png",
        monsters: [
            { id: 'goblinRogue', weight: 25 },
            { id: 'goblinArcher', weight: 20 },
            { id: 'shadowSlime', weight: 15 },
            { id: 'direWolf', weight: 20 },
            { id: 'goblinShaman', weight: 8 },   // 고블린 샤먼 (힐러/마법)
            { id: 'fanatic', weight: 8 },         // 광신도 (자해)
            { id: 'rageGolem', weight: 9 }        // 분노의 골렘 (맞을수록 강해짐)
        ],
        elites: [
            { id: 'thornGuardian', weight: 50 },
            { id: 'goblinShaman', weight: 50 }
        ],
        bosses: [
            { id: 'goblinKing', weight: 60 },
            { id: 'giantSpider', weight: 40 }
        ],
        minEnemies: 1,
        maxEnemies: 2
    },
    
    stage2: {
        name: "어둠의 숲",
        background: "bg.png",
        monsters: [
            { id: 'goblinRogue', weight: 15 },
            { id: 'goblinArcher', weight: 15 },
            { id: 'shadowSlime', weight: 20 },
            { id: 'direWolf', weight: 20 },
            { id: 'poisonSpider', weight: 10 },
            { id: 'goblinShaman', weight: 7 },
            { id: 'fanatic', weight: 6 },
            { id: 'fireElemental', weight: 5 },
            { id: 'rageGolem', weight: 7 }
        ],
        elites: [
            { id: 'thornGuardian', weight: 40 },
            { id: 'giantSpider', weight: 60 }
        ],
        bosses: [
            { id: 'abyssLord', weight: 100 }
        ],
        minEnemies: 1,
        maxEnemies: 3
    },
    
    stage3: {
        name: "심연의 성",
        background: "bg.png",
        monsters: [
            { id: 'shadowSlime', weight: 20 },
            { id: 'direWolf', weight: 20 },
            { id: 'poisonSpider', weight: 20 },
            { id: 'skeletonWarrior', weight: 15 },
            { id: 'fanatic', weight: 8 },
            { id: 'fireElemental', weight: 8 },
            { id: 'mimic', weight: 5 },
            { id: 'rageGolem', weight: 9 }
        ],
        elites: [
            { id: 'thornGuardian', weight: 30 },
            { id: 'giantSpider', weight: 70 }
        ],
        bosses: [
            { id: 'fireKing', weight: 100 }
        ],
        minEnemies: 2,
        maxEnemies: 3
    }
};

// 가중치 기반 랜덤 선택
function weightedRandomSelect(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= item.weight;
        if (random <= 0) {
            return item.id;
        }
    }
    
    return items[items.length - 1].id;
}

// 스테이지에서 몬스터 선택
function selectMonsterFromStage(stageNum) {
    const stage = stageData[`stage${stageNum}`];
    if (!stage) return 'goblinRogue';
    
    return weightedRandomSelect(stage.monsters);
}

// 스테이지에서 엘리트 선택
function selectEliteFromStage(stageNum) {
    const stage = stageData[`stage${stageNum}`];
    if (!stage) return 'thornGuardian';
    
    return weightedRandomSelect(stage.elites);
}

// 스테이지에서 보스 선택
function selectBossFromStage(stageNum) {
    const stage = stageData[`stage${stageNum}`];
    if (!stage) return 'goblinKing';
    
    return weightedRandomSelect(stage.bosses);
}

// 스테이지 적 수 결정
function getEnemyCountForStage(stageNum) {
    const stage = stageData[`stage${stageNum}`];
    if (!stage) return 1;
    
    const min = stage.minEnemies || 1;
    const max = stage.maxEnemies || 2;
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 현재 스테이지 가져오기
function getCurrentStage() {
    if (typeof MapSystem !== 'undefined' && MapSystem.currentStage) {
        return MapSystem.currentStage;
    }
    return 1;
}

// 스테이지 정보 가져오기 (하위 호환성)
function getStageInfo(stageNum) {
    return stageData[`stage${stageNum}`] || stageData.stage1;
}

console.log('[Stage] 스테이지 데이터 로드 완료');
