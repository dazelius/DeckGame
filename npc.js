// ==========================================
// NPC 시스템 (구출 가능한 NPC 관리)
// ==========================================

// NPC 데이터베이스
const NPCDatabase = {
    hoodgirl: {
        id: 'hoodgirl',
        name: '후드 소녀',
        img: 'hoodgirl.png',
        capturedAt: 'goblin',  // 고블린 도적 스테이지 (1층)
        capturedFloor: 1,
        capturedType: 'monster', // 일반 전투
        helpText: '살려주세요...!',
        rescueMessage: '감사합니다! 마을에서 당신을 도울게요.',
        townRole: '캐릭터 강화',
        icon: '👧'
    },
    blacksmith: {
        id: 'blacksmith',
        name: '대장장이',
        img: 'blacksmith.png',
        capturedAt: 'thornGuardian',  // 가시 수호자 스테이지 (엘리트)
        capturedFloor: null, // 특정 층이 아닌 엘리트 전투
        capturedType: 'elite',
        capturedEnemy: '가시 수호자',
        helpText: '이 괴물을 처치해주시오!',
        rescueMessage: '고맙소! 마을에서 무기를 만들어 드리리다.',
        townRole: '장비 강화',
        icon: '🔨'
    }
};

// ==========================================
// NPC 구출 시스템 (던전 중 구출 → 탈출 시 영구 저장)
// ==========================================
const RescueSystem = {
    storageKey: 'lordofnight_rescued',
    dungeonRescued: [],  // 던전에서 구출한 NPC (탈출해야 영구 저장)
    isInDungeon: false,
    
    // NPC 탈출 다이얼로그
    escapeDialogues: {
        hoodgirl: [
            "마을에서 만나요! 💕",
            "고마워요, 용사님!",
            "빨리 여기서 나가요!",
            "마을에서 기다릴게요~"
        ],
        blacksmith: [
            "고맙소, 젊은이!",
            "마을에서 무기를 벼려드리리다!",
            "어서 빠져나가시오!",
            "훌륭한 용사로군!"
        ],
        default: [
            "감사합니다!",
            "마을에서 봐요!",
            "살았다...!"
        ]
    },
    
    // 영구 저장된 NPC 목록 가져오기
    getRescued() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {};
    },
    
    // 던전에서 구출한 NPC 목록 가져오기
    getDungeonRescued() {
        return this.dungeonRescued;
    },
    
    // 던전에서 구출한 NPC 데이터 가져오기
    getDungeonRescuedData() {
        return this.dungeonRescued.map(npcId => ({
            id: npcId,
            ...NPCDatabase[npcId]
        })).filter(npc => npc.name);
    },
    
    // NPC 구출 (던전 중)
    rescue(npcId) {
        if (this.isInDungeon) {
            // 던전 중이면 임시 저장
            if (!this.dungeonRescued.includes(npcId)) {
                this.dungeonRescued.push(npcId);
                console.log(`[NPC] ${npcId} 던전에서 구출! (탈출 시 영구 저장)`);
            }
        } else {
            // 던전 밖이면 바로 영구 저장
            this.saveRescue(npcId);
        }
    },
    
    // 영구 저장
    saveRescue(npcId) {
        const rescued = this.getRescued();
        rescued[npcId] = true;
        localStorage.setItem(this.storageKey, JSON.stringify(rescued));
        console.log(`[NPC] ${npcId} 영구 구출!`);
    },
    
    // NPC 구출 여부 확인 (영구 + 던전)
    isRescued(npcId) {
        // 영구 구출됨
        if (this.getRescued()[npcId]) return true;
        // 던전에서 구출됨 (아직 영구 저장 안됨)
        if (this.dungeonRescued.includes(npcId)) return true;
        return false;
    },
    
    // 던전 입장
    enterDungeon() {
        this.isInDungeon = true;
        this.dungeonRescued = [];
        console.log('[NPC] 던전 진입 - 구출 목록 초기화');
    },
    
    // 던전 탈출 성공 (구출 NPC 영구 저장)
    escapeDungeon() {
        if (this.dungeonRescued.length > 0) {
            console.log(`[NPC] 던전 탈출! ${this.dungeonRescued.length}명 영구 구출`);
            this.dungeonRescued.forEach(npcId => this.saveRescue(npcId));
        }
        this.dungeonRescued = [];
        this.isInDungeon = false;
    },
    
    // 던전에서 사망 (구출 NPC 상실)
    dieInDungeon() {
        if (this.dungeonRescued.length > 0) {
            console.log(`[NPC] 던전에서 사망! ${this.dungeonRescued.length}명 구출 실패`);
        }
        this.dungeonRescued = [];
        this.isInDungeon = false;
    },
    
    // 탈출 다이얼로그 가져오기
    getEscapeDialogue(npcId) {
        const dialogues = this.escapeDialogues[npcId] || this.escapeDialogues.default;
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    },
    
    // 모든 NPC 구출 상태 리셋 (디버그용)
    resetAll() {
        localStorage.removeItem(this.storageKey);
        this.dungeonRescued = [];
        console.log('[NPC] 모든 구출 상태 리셋됨');
    }
};

// ==========================================
// NPC 표시 시스템
// ==========================================
const NPCDisplaySystem = {
    // 현재 전투에서 잡혀있는 NPC 확인
    getCapturedNpcForBattle(enemyName, battleType, floor) {
        // stage.js의 설정 사용
        if (typeof StageData !== 'undefined' && typeof MapSystem !== 'undefined') {
            const currentStage = MapSystem.currentStage || 1;
            const stageData = StageData.getStage(currentStage);
            
            if (stageData) {
                // 확인할 NPC 설정들
                const npcConfigs = [];
                if (stageData.capturedNpc) npcConfigs.push(stageData.capturedNpc);
                if (stageData.eliteCapturedNpc) npcConfigs.push(stageData.eliteCapturedNpc);
                
                for (const capturedConfig of npcConfigs) {
                    const npcId = capturedConfig.npcId;
                    
                    // 이미 구출된 NPC는 표시하지 않음
                    if (RescueSystem.isRescued(npcId)) continue;
                    
                    const npc = NPCDatabase[npcId];
                    if (!npc) continue;
                    
                    // roomType에 따라 확인 (monster -> normal, elite -> elite, boss -> boss)
                    const roomTypeMap = {
                        'monster': 'normal',
                        'elite': 'elite',
                        'boss': 'boss'
                    };
                    const expectedBattleType = roomTypeMap[capturedConfig.roomType] || capturedConfig.roomType;
                    
                    // 보스 방에 잡혀있는 경우
                    if (capturedConfig.requireBoss && battleType === 'boss') {
                        return npc;
                    }
                    
                    // roomType 설정에 따라 확인
                    if (expectedBattleType === battleType) {
                        return npc;
                    }
                }
            }
        }
        
        // 폴백: NPCDatabase의 설정 사용
        for (const [npcId, npc] of Object.entries(NPCDatabase)) {
            // 이미 구출된 NPC는 표시하지 않음
            if (RescueSystem.isRescued(npcId)) continue;
            
            // 특정 적에게 잡혀있는 경우
            if (npc.capturedEnemy && npc.capturedEnemy === enemyName) {
                return npc;
            }
        }
        return null;
    },
    
    // 잡힌 NPC 표시
    showCapturedNpc(npcId) {
        const npc = NPCDatabase[npcId];
        if (!npc) return;
        
        // 이미 표시된 경우 제거
        const existing = document.getElementById('captured-npc');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'captured-npc';
        container.className = 'captured-npc';
        container.innerHTML = `
            <div class="captured-cage">
                <img src="${npc.img}" alt="${npc.name}" class="captured-npc-img">
                <img src="cage.png" alt="감옥" class="cage-img">
            </div>
            <div class="captured-help-bubble">${npc.helpText}</div>
        `;
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(container);
        }
    },
    
    // 잡힌 NPC 제거
    removeCapturedNpc() {
        const capturedNpc = document.getElementById('captured-npc');
        if (capturedNpc) capturedNpc.remove();
    },
    
    // 구출 이벤트 표시
    showRescueEvent(npcId, callback) {
        const npc = NPCDatabase[npcId];
        if (!npc) {
            if (callback) callback();
            return;
        }
        
        // NPC 구출 저장
        RescueSystem.rescue(npcId);
        
        const modal = document.createElement('div');
        modal.className = 'rescue-modal';
        modal.innerHTML = `
            <div class="rescue-content">
                <div class="rescue-icon">🎉</div>
                <h2 class="rescue-title">${npc.name} 구출!</h2>
                <div class="rescued-npc-display">
                    <img src="${npc.img}" alt="${npc.name}" class="rescued-npc-img">
                </div>
                <p class="rescue-message">"${npc.rescueMessage}"</p>
                <p class="rescue-unlock">💡 마을에서 <strong>${npc.townRole}</strong>이 가능합니다!</p>
                <button class="rescue-continue-btn">계속하기</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });
        
        modal.querySelector('.rescue-continue-btn').addEventListener('click', () => {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.remove();
                if (callback) callback();
            }, 500);
        });
    },
    
    // 전투 시작 시 잡힌 NPC 체크 및 표시
    checkAndShowCapturedNpc(enemyName, battleType, floor) {
        const capturedNpc = this.getCapturedNpcForBattle(enemyName, battleType, floor);
        if (capturedNpc) {
            this.showCapturedNpc(capturedNpc.id);
            return capturedNpc;
        }
        return null;
    },
    
    // 전투 승리 시 구출 체크
    checkRescueOnVictory(enemyName, battleType, floor) {
        console.log(`[NPC] checkRescueOnVictory: enemyName=${enemyName}, battleType=${battleType}, floor=${floor}`);
        
        // stage.js의 설정 사용
        if (typeof StageData !== 'undefined' && typeof MapSystem !== 'undefined') {
            const currentStage = MapSystem.currentStage || 1;
            const stageData = StageData.getStage(currentStage);
            console.log(`[NPC] currentStage=${currentStage}, stageData=`, stageData);
            
            if (stageData) {
                // 확인할 NPC 설정들
                const npcConfigs = [];
                if (stageData.capturedNpc) npcConfigs.push(stageData.capturedNpc);
                if (stageData.eliteCapturedNpc) npcConfigs.push(stageData.eliteCapturedNpc);
                console.log(`[NPC] npcConfigs=`, npcConfigs);
                
                for (const capturedConfig of npcConfigs) {
                    const npcId = capturedConfig.npcId;
                    console.log(`[NPC] Checking config: npcId=${npcId}, roomType=${capturedConfig.roomType}`);
                    
                    // 이미 구출된 NPC는 무시
                    if (RescueSystem.isRescued(npcId)) {
                        console.log(`[NPC] ${npcId} already rescued, skip`);
                        continue;
                    }
                    
                    // roomType에 따라 확인
                    const roomTypeMap = {
                        'monster': 'normal',
                        'elite': 'elite',
                        'boss': 'boss'
                    };
                    const expectedBattleType = roomTypeMap[capturedConfig.roomType] || capturedConfig.roomType;
                    console.log(`[NPC] expectedBattleType=${expectedBattleType}, battleType=${battleType}`);
                    
                    // 보스 방에 잡혀있는 경우
                    if (capturedConfig.requireBoss && battleType === 'boss') {
                        console.log(`[NPC] MATCH (requireBoss): ${npcId}`);
                        return npcId;
                    }
                    
                    // roomType 설정에 따라 확인
                    if (expectedBattleType === battleType) {
                        console.log(`[NPC] MATCH (roomType): ${npcId}`);
                        return npcId;
                    }
                }
            }
        }
        
        // 폴백: NPCDatabase의 설정 사용
        console.log('[NPC] Fallback to NPCDatabase');
        for (const [npcId, npc] of Object.entries(NPCDatabase)) {
            // 이미 구출된 NPC는 무시
            if (RescueSystem.isRescued(npcId)) continue;
            
            // 특정 적에게 잡혀있던 경우
            if (npc.capturedEnemy && npc.capturedEnemy === enemyName) {
                console.log(`[NPC] MATCH (capturedEnemy): ${npcId}`);
                return npcId;
            }
        }
        console.log('[NPC] No rescue NPC found');
        return null;
    }
};

// ==========================================
// 맵에서 NPC 마커 표시
// ==========================================
const NPCMapMarker = {
    // 노드에 NPC 마커 정보 가져오기
    getMarkerForNode(node) {
        for (const [npcId, npc] of Object.entries(NPCDatabase)) {
            const isRescued = RescueSystem.isRescued(npcId);
            
            // 특정 층에 잡혀있는 NPC
            if (npc.capturedFloor && 
                node.floor === npc.capturedFloor && 
                node.type && 
                node.type.id === npc.capturedType) {
                return {
                    npcId: npcId,
                    icon: isRescued ? '💜' : '🔒',
                    rescued: isRescued,
                    npcIcon: npc.icon
                };
            }
            
            // 엘리트/보스 노드에 잡혀있는 NPC (특정 적)
            if (npc.capturedType === 'elite' && 
                node.type && 
                node.type.id === 'elite' &&
                !npc.capturedFloor) {
                // 엘리트 노드에 대장장이 마커
                if (npcId === 'blacksmith') {
                    return {
                        npcId: npcId,
                        icon: isRescued ? '💜' : '🔨',
                        rescued: isRescued,
                        npcIcon: npc.icon
                    };
                }
            }
        }
        return null;
    }
};

// 전역 함수들 (기존 코드 호환성)
function showCapturedNpc(npcId) {
    NPCDisplaySystem.showCapturedNpc(npcId);
}

function showRescueEvent(npcId) {
    NPCDisplaySystem.showRescueEvent(npcId, () => {
        // 구출 후 승리 보상으로 진행
        if (typeof victory === 'function') {
            // victory()가 다시 호출되면 구출 이벤트는 건너뜀
            victory();
        }
    });
}

// 전역 접근용
window.NPCDatabase = NPCDatabase;
window.RescueSystem = RescueSystem;
window.NPCDisplaySystem = NPCDisplaySystem;
window.NPCMapMarker = NPCMapMarker;

console.log('[NPC] NPC 시스템 로드 완료');

