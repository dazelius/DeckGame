// ==========================================
// Shadow Deck - 세이브 시스템
// localStorage를 이용한 던전 진행 저장/복원
// ==========================================

const SaveSystem = {
    SAVE_KEY: 'shadowDeck_dungeonSave',
    AUTO_SAVE_INTERVAL: 30000, // 30초마다 자동 저장
    autoSaveTimer: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[SaveSystem] 세이브 시스템 초기화');
        
        // 자동 저장 시작
        this.startAutoSave();
        
        // 페이지 언로드 시 저장
        window.addEventListener('beforeunload', () => {
            this.save();
        });
    },
    
    // ==========================================
    // 자동 저장 시작
    // ==========================================
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (this.canSave()) {
                this.save();
                console.log('[SaveSystem] 자동 저장 완료');
            }
        }, this.AUTO_SAVE_INTERVAL);
    },
    
    // ==========================================
    // 저장 가능 여부 확인
    // ==========================================
    canSave() {
        // 던전 진행 중일 때만 저장
        if (typeof MapSystem === 'undefined') return false;
        if (!MapSystem.currentFloor) return false;
        if (!MapSystem.rooms || MapSystem.rooms.length === 0) return false;
        
        // 전투 중에는 저장하지 않음
        if (typeof gameState !== 'undefined' && gameState.inBattle) return false;
        
        return true;
    },
    
    // ==========================================
    // 저장
    // ==========================================
    save() {
        if (!this.canSave()) {
            console.log('[SaveSystem] 저장 불가 상태');
            return false;
        }
        
        try {
            const saveData = {
                version: 1,
                timestamp: Date.now(),
                
                // 플레이어 정보
                player: {
                    hp: gameState.player?.hp || 50,
                    maxHp: gameState.player?.maxHp || 50,
                    block: gameState.player?.block || 0,
                    buffs: gameState.player?.buffs || [],
                    debuffs: gameState.player?.debuffs || [],
                },
                
                // 덱
                deck: (gameState.deck || []).map(card => ({
                    id: card.id,
                    name: card.name,
                    cost: card.cost ?? 1, // undefined 방지
                    type: card.type?.id || card.type,
                    description: card.description,
                    icon: card.icon,
                    iconImg: card.iconImg,
                    damage: card.damage,
                    block: card.block,
                    rarity: card.rarity?.id || card.rarity,
                    effect: card.effect?.toString() || null,
                    upgraded: card.upgraded || false,
                })),
                
                // 골드
                gold: (typeof GoldSystem !== 'undefined') 
                    ? GoldSystem.getTotalGold() 
                    : (gameState.gold || 0),
                
                // 유물 (RelicSystem.ownedRelics에서 가져옴)
                relics: (typeof RelicSystem !== 'undefined' && RelicSystem.ownedRelics) 
                    ? RelicSystem.ownedRelics.map(r => r.id) 
                    : [],
                
                // 맵 정보
                map: {
                    currentFloor: MapSystem.currentFloor || 1,
                    currentStage: MapSystem.currentStage || 1,
                    currentRoom: MapSystem.currentRoom ? {
                        x: MapSystem.currentRoom.x,
                        y: MapSystem.currentRoom.y,
                    } : null,
                    roomsCleared: MapSystem.roomsCleared || 0,
                    rooms: (MapSystem.rooms || []).map(room => ({
                        x: room.x,
                        y: room.y,
                        type: room.type,
                        cleared: room.cleared || false,
                        visited: room.visited || false,
                        distance: room.distance || 0,
                        connections: room.connections || [],
                        monsterId: room.monsterId,
                        // 몬스터 정보 저장 (전투 일관성 보장)
                        monsters: room.monsters ? room.monsters.map(m => ({
                            name: m.name,
                            isBoss: m.isBoss || false,
                            isElite: m.isElite || false
                        })) : null,
                        monster: room.monster ? {
                            name: room.monster.name,
                            isBoss: room.monster.isBoss || false,
                            isElite: room.monster.isElite || false
                        } : null,
                    })),
                    gridSize: MapSystem.gridSize || 9,
                },
                
                // 전투 카운트
                battleCount: gameState.battleCount || 0,
                
                // 캠프 사용 여부
                campState: (typeof CampEvent !== 'undefined') ? {
                    usedRest: CampEvent.usedRest || false,
                    usedForge: CampEvent.usedForge || false,
                } : null,
            };
            
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            console.log('[SaveSystem] 저장 완료', saveData);
            
            return true;
        } catch (e) {
            console.error('[SaveSystem] 저장 실패:', e);
            return false;
        }
    },
    
    // ==========================================
    // 불러오기
    // ==========================================
    load() {
        try {
            const saveString = localStorage.getItem(this.SAVE_KEY);
            if (!saveString) {
                console.log('[SaveSystem] 저장된 데이터 없음');
                return null;
            }
            
            const saveData = JSON.parse(saveString);
            console.log('[SaveSystem] 저장 데이터 로드:', saveData);
            
            return saveData;
        } catch (e) {
            console.error('[SaveSystem] 불러오기 실패:', e);
            return null;
        }
    },
    
    // ==========================================
    // 저장 데이터 존재 여부
    // ==========================================
    hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    },
    
    // ==========================================
    // 저장 데이터 삭제
    // ==========================================
    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log('[SaveSystem] 저장 데이터 삭제됨');
    },
    
    // ==========================================
    // 게임 상태 복원
    // ==========================================
    restore() {
        const saveData = this.load();
        if (!saveData) return false;
        
        try {
            // 플레이어 복원
            if (typeof gameState !== 'undefined') {
                gameState.player = {
                    hp: saveData.player.hp,
                    maxHp: saveData.player.maxHp,
                    block: saveData.player.block,
                    buffs: saveData.player.buffs || [],
                    debuffs: saveData.player.debuffs || [],
                };
                
                // 덱 복원 (cardDatabase에서 실제 카드 객체 가져오기)
                gameState.deck = saveData.deck.map(savedCard => {
                    // cardDatabase에서 원본 카드 찾기
                    let originalCard = null;
                    if (typeof cardDatabase !== 'undefined' && cardDatabase[savedCard.id]) {
                        originalCard = { ...cardDatabase[savedCard.id] };
                    }
                    
                    if (originalCard) {
                        // 업그레이드 상태 반영
                        if (savedCard.upgraded && typeof upgradedCardDatabase !== 'undefined') {
                            const upgradedVersion = upgradedCardDatabase[savedCard.id];
                            if (upgradedVersion) {
                                return { ...originalCard, ...upgradedVersion, upgraded: true };
                            }
                        }
                        return originalCard;
                    }
                    
                    // 원본이 없으면 저장된 데이터 사용 (cost 보장)
                    return {
                        id: savedCard.id,
                        name: savedCard.name || '알 수 없는 카드',
                        cost: savedCard.cost ?? 1, // undefined면 1로 기본값
                        type: savedCard.type || 'attack',
                        description: savedCard.description || '',
                        icon: savedCard.icon || '❓',
                        iconImg: savedCard.iconImg,
                        damage: savedCard.damage,
                        block: savedCard.block,
                        effect: null, // 함수는 복원 불가
                        upgraded: savedCard.upgraded || false,
                    };
                });
                
                // 골드 복원
                gameState.gold = saveData.gold;
                if (typeof GoldSystem !== 'undefined') {
                    GoldSystem.setGold(saveData.gold);
                }
                
                // 유물 복원 (RelicSystem에 추가)
                gameState.relics = saveData.relics || [];
                if (typeof RelicSystem !== 'undefined') {
                    RelicSystem.ownedRelics = []; // 초기화
                    saveData.relics.forEach(relicId => {
                        // relicDatabase에서 유물 데이터 가져오기
                        if (typeof relicDatabase !== 'undefined' && relicDatabase[relicId]) {
                            RelicSystem.ownedRelics.push({ ...relicDatabase[relicId] });
                        }
                    });
                    RelicSystem.updateRelicUI();
                    console.log(`[SaveSystem] 유물 복원: ${RelicSystem.ownedRelics.length}개`);
                }
                
                // 전투 카운트
                gameState.battleCount = saveData.battleCount || 0;
            }
            
            // 맵 복원
            if (typeof MapSystem !== 'undefined' && saveData.map) {
                MapSystem.currentFloor = saveData.map.currentFloor;
                MapSystem.currentStage = saveData.map.currentStage;
                MapSystem.roomsCleared = saveData.map.roomsCleared;
                MapSystem.gridSize = saveData.map.gridSize || 9;
                MapSystem.rooms = saveData.map.rooms;
                
                // roomGrid 복원
                MapSystem.roomGrid = [];
                for (let y = 0; y < MapSystem.gridSize; y++) {
                    MapSystem.roomGrid[y] = [];
                    for (let x = 0; x < MapSystem.gridSize; x++) {
                        MapSystem.roomGrid[y][x] = null;
                    }
                }
                // rooms를 roomGrid에 배치
                for (const room of MapSystem.rooms) {
                    if (room.x >= 0 && room.x < MapSystem.gridSize && 
                        room.y >= 0 && room.y < MapSystem.gridSize) {
                        MapSystem.roomGrid[room.y][room.x] = room;
                    }
                }
                
                // 현재 방 복원
                if (saveData.map.currentRoom) {
                    MapSystem.currentRoom = MapSystem.rooms.find(
                        r => r.x === saveData.map.currentRoom.x && 
                             r.y === saveData.map.currentRoom.y
                    );
                }
                
                // 총 방 수 계산
                MapSystem.totalRooms = MapSystem.rooms.filter(r => 
                    r.type !== MapSystem.ROOM_TYPE.START && 
                    r.type !== MapSystem.ROOM_TYPE.NONE
                ).length;
            }
            
            // 캠프 상태 복원
            if (typeof CampEvent !== 'undefined' && saveData.campState) {
                CampEvent.usedRest = saveData.campState.usedRest;
                CampEvent.usedForge = saveData.campState.usedForge;
            }
            
            // TopBar 업데이트
            if (typeof TopBar !== 'undefined') {
                TopBar.update();
            }
            
            console.log('[SaveSystem] 게임 상태 복원 완료');
            return true;
        } catch (e) {
            console.error('[SaveSystem] 복원 실패:', e);
            return false;
        }
    },
    
    // ==========================================
    // 저장된 게임 이어하기
    // ==========================================
    continueGame() {
        if (!this.hasSave()) {
            console.log('[SaveSystem] 이어할 저장 데이터 없음');
            return false;
        }
        
        // 복원
        if (!this.restore()) {
            return false;
        }
        
        // 맵 화면 표시
        if (typeof MapSystem !== 'undefined') {
            // 타이틀 숨기기
            const titleScreen = document.getElementById('title-screen');
            if (titleScreen) titleScreen.style.display = 'none';
            
            // 타운 숨기기
            if (typeof TownSystem !== 'undefined') {
                TownSystem.hide();
            }
            
            // 맵 표시
            MapSystem.showMap();
            
            // TopBar 표시
            if (typeof TopBar !== 'undefined') {
                TopBar.show();
                TopBar.update('dungeon', `B${MapSystem.currentFloor}F`, MapSystem.currentFloor);
            }
        }
        
        console.log('[SaveSystem] 게임 이어하기 완료');
        return true;
    },
    
    // ==========================================
    // 저장 시간 포맷
    // ==========================================
    getSaveTimeString() {
        const saveData = this.load();
        if (!saveData || !saveData.timestamp) return null;
        
        const date = new Date(saveData.timestamp);
        const now = new Date();
        const diff = now - date;
        
        // 1분 미만
        if (diff < 60000) {
            return '방금 전';
        }
        // 1시간 미만
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}분 전`;
        }
        // 24시간 미만
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}시간 전`;
        }
        // 그 이상
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // ==========================================
    // 저장 정보 요약
    // ==========================================
    getSaveSummary() {
        const saveData = this.load();
        if (!saveData) return null;
        
        return {
            floor: saveData.map?.currentFloor || 1,
            roomsCleared: saveData.map?.roomsCleared || 0,
            hp: saveData.player?.hp || 0,
            maxHp: saveData.player?.maxHp || 50,
            gold: saveData.gold || 0,
            deckSize: saveData.deck?.length || 0,
            relicCount: saveData.relics?.length || 0,
            timeString: this.getSaveTimeString(),
        };
    }
};

// 전역 접근
window.SaveSystem = SaveSystem;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    SaveSystem.init();
});

console.log('[SaveSystem] 세이브 시스템 로드 완료');

