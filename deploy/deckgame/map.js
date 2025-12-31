// ==========================================
// 던전 맵 시스템 (바인딩 오브 아이작 스타일)
// ==========================================

const MapSystem = {
    // 맵 상태
    currentStage: 1,
    currentFloor: 1,
    currentRoom: null,
    rooms: [],        // 2D 배열로 방 저장
    roomGrid: [],     // [y][x] 형태
    gridSize: 9,      // 기본 9x9 그리드 (BalanceSystem에서 동적으로 설정)
    
    // 게임 상태
    roomsCleared: 0,
    totalRooms: 0,
    isMapVisible: false,
    
    // 방 타입
    ROOM_TYPE: {
        NONE: 'none',
        START: 'start',
        MONSTER: 'monster',
        ELITE: 'elite',
        TREASURE: 'treasure',
        SHOP: 'shop',
        EVENT: 'event',
        CAMP: 'camp',      // 캠프 (휴식처)
        BOSS: 'boss',
        SECRET: 'secret'
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // MapUI 사용하여 다크소울 스타일 컨테이너 생성
        if (typeof MapUI !== 'undefined') {
            MapUI.createMapContainer();
        } else {
            this.createMapContainerFallback();
        }
        this.setupEventListeners();
        this.injectEnterEffectStyles();
        console.log('[Map] 던전 맵 시스템 초기화 완료');
    },
    
    // 입장 연출 스타일 주입 (다크소울 스타일)
    injectEnterEffectStyles() {
        if (document.getElementById('room-enter-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'room-enter-styles';
        style.textContent = `
            /* 다크소울 스타일 오버레이 */
            .ds-enter-overlay {
                position: fixed;
                inset: 0;
                z-index: 10000;
                pointer-events: none;
            }
            
            /* 전체 화면 딤 처리 */
            .ds-enter-dim {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, 
                    rgba(0, 0, 0, 0.7) 0%, 
                    rgba(0, 0, 0, 0.9) 100%);
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .ds-enter-overlay.letterbox-in .ds-enter-dim {
                opacity: 1;
            }
            
            .ds-enter-overlay.letterbox-out .ds-enter-dim {
                opacity: 0;
            }
            
            /* 레터박스 (상하 검은 바) */
            .ds-enter-letterbox {
                position: absolute;
                left: 0;
                right: 0;
                height: 0;
                background: #000;
                z-index: 2;
                transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .ds-enter-letterbox.top {
                top: 0;
                box-shadow: 0 10px 60px rgba(0, 0, 0, 0.8);
            }
            
            .ds-enter-letterbox.bottom {
                bottom: 0;
                box-shadow: 0 -10px 60px rgba(0, 0, 0, 0.8);
            }
            
            .ds-enter-overlay.letterbox-in .ds-enter-letterbox {
                height: 15%;
            }
            
            .ds-enter-overlay.letterbox-out .ds-enter-letterbox {
                height: 0;
            }
            
            /* 텍스트 컨테이너 */
            .ds-enter-text-container {
                position: absolute;
                bottom: 22%;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 40px;
                z-index: 3;
            }
            
            /* 장식 라인 */
            .ds-enter-line {
                width: 0;
                height: 1px;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(212, 175, 55, 0.8) 50%, 
                    transparent 100%);
                transition: width 0.8s ease;
            }
            
            .ds-enter-line.left {
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(212, 175, 55, 0.8) 100%);
            }
            
            .ds-enter-line.right {
                background: linear-gradient(90deg, 
                    rgba(212, 175, 55, 0.8) 0%, 
                    transparent 100%);
            }
            
            .ds-enter-overlay.text-in .ds-enter-line {
                width: 120px;
            }
            
            .ds-enter-overlay.text-out .ds-enter-line {
                width: 0;
            }
            
            /* 메인 텍스트 (다크소울 스타일) */
            .ds-enter-text {
                font-family: 'Cinzel', 'Cormorant Garamond', 'Times New Roman', serif;
                font-size: 3rem;
                font-weight: 400;
                letter-spacing: 14px;
                color: #e8dcc4;
                text-shadow: 
                    0 0 10px rgba(212, 175, 55, 0.8),
                    0 0 30px rgba(212, 175, 55, 0.5),
                    0 0 60px rgba(212, 175, 55, 0.3),
                    0 2px 4px rgba(0, 0, 0, 0.9);
                opacity: 0;
                transform: translateY(15px);
                transition: opacity 0.8s ease, transform 0.8s ease;
                white-space: nowrap;
            }
            
            .ds-enter-overlay.text-in .ds-enter-text {
                opacity: 1;
                transform: translateY(0);
            }
            
            .ds-enter-overlay.text-out .ds-enter-text {
                opacity: 0;
                transform: translateY(-15px);
            }
            
            /* 모바일 대응 */
            @media (max-width: 768px) {
                .ds-enter-overlay.letterbox-in .ds-enter-letterbox {
                    height: 12%;
                }
                
                .ds-enter-text-container {
                    bottom: 18%;
                    gap: 20px;
                }
                
                .ds-enter-text {
                    font-size: 2rem;
                    letter-spacing: 8px;
                }
                
                .ds-enter-overlay.text-in .ds-enter-line {
                    width: 60px;
                }
            }
            
            @media (max-width: 480px) {
                .ds-enter-text {
                    font-size: 1.5rem;
                    letter-spacing: 5px;
                }
                
                .ds-enter-overlay.text-in .ds-enter-line {
                    width: 40px;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 맵 컨테이너 생성 (폴백)
    // ==========================================
    createMapContainerFallback() {
        const existing = document.getElementById('map-screen');
        if (existing) existing.remove();
        
        const mapScreen = document.createElement('div');
        mapScreen.id = 'map-screen';
        mapScreen.className = 'map-screen room-based';
        mapScreen.innerHTML = `
            <div class="dungeon-header">
                <div class="dungeon-info">
                    <span class="dungeon-name" id="dungeon-name">고블린 둥지</span>
                    <span class="floor-info">B<span id="current-floor">1</span>F</span>
                </div>
                <div class="dungeon-stats">
                    <span class="stat-item">❤️ <span id="map-hp">35</span></span>
                    <span class="stat-item">💰 <span id="map-gold">0</span></span>
                    <span class="stat-item">🚪 <span id="rooms-cleared">0</span>/<span id="total-rooms">0</span></span>
                </div>
            </div>
            
            <div class="room-map-container">
                <div class="room-minimap" id="room-minimap"></div>
            </div>
            
            <div class="current-room-panel">
                <div class="current-room-display" id="current-room-display">
                    <div class="room-icon" id="room-icon">🚪</div>
                    <div class="room-info-text">
                        <div class="room-name" id="room-name">시작 방</div>
                        <div class="room-desc" id="room-desc">던전 탐험을 시작하세요!</div>
                    </div>
                </div>
                <div class="room-actions">
                    <button class="action-btn" id="btn-enter-room">🚪 방 입장</button>
                    <button class="action-btn secondary" id="btn-menu">⚙️ 메뉴</button>
                </div>
            </div>
            
            <div class="map-hint">클릭하여 인접한 방으로 이동</div>
        `;
        
        mapScreen.style.display = 'none';
        document.body.appendChild(mapScreen);
    },
    
    // ==========================================
    // 이벤트 리스너
    // ==========================================
    setupEventListeners() {
        // 방 입장
        document.getElementById('btn-enter-room')?.addEventListener('click', () => this.enterCurrentRoom());
        
        // 메뉴
        document.getElementById('btn-menu')?.addEventListener('click', () => this.showPauseMenu());
        
        // 키보드
        document.addEventListener('keydown', (e) => {
            if (!this.isMapVisible) return;
            if (document.querySelector('.event-modal')) return;
            
            switch(e.key.toLowerCase()) {
                case 'arrowup': case 'w': this.moveToRoom(0, -1); break;
                case 'arrowdown': case 's': this.moveToRoom(0, 1); break;
                case 'arrowleft': case 'a': this.moveToRoom(-1, 0); break;
                case 'arrowright': case 'd': this.moveToRoom(1, 0); break;
                case 'enter': case ' ': this.enterCurrentRoom(); break;
            }
        });
    },
    
    // 방 클릭으로 이동
    onRoomClick(room) {
        if (!room || room === this.currentRoom) return;
        
        // 인접한 방인지 확인
        const dx = room.x - this.currentRoom.x;
        const dy = room.y - this.currentRoom.y;
        
        // 상하좌우 인접한 방만 이동 가능
        if (Math.abs(dx) + Math.abs(dy) !== 1) {
            this.showMessage('인접한 방만 이동할 수 있습니다!');
            return;
        }
        
        this.moveToRoom(dx, dy);
    },
    
    // ==========================================
    // 새 게임 시작
    // ==========================================
    startGame() {
        this.currentStage = 1;
        this.currentFloor = 1;
        this.roomsCleared = 0;
        
        this.generateFloor();
        this.showMap();
    },
    
    // ==========================================
    // 층 생성
    // ==========================================
    generateFloor() {
        const stageData = StageData.getStage(this.currentStage);
        
        // BalanceSystem에서 맵 설정 가져오기
        let mapConfig = { gridSize: 9, roomCount: { min: 12, max: 16 } };
        if (typeof BalanceSystem !== 'undefined') {
            mapConfig = BalanceSystem.getMapConfig(this.currentFloor);
            this.gridSize = mapConfig.gridSize;
        }
        
        // 그리드 초기화
        this.roomGrid = [];
        this.rooms = [];
        
        for (let y = 0; y < this.gridSize; y++) {
            this.roomGrid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.roomGrid[y][x] = null;
            }
        }
        
        // 시작 방 (중앙)
        const startX = Math.floor(this.gridSize / 2);
        const startY = Math.floor(this.gridSize / 2);
        
        this.createRoom(startX, startY, this.ROOM_TYPE.START);
        
        // 방 생성 (BFS 방식으로 확장) - BalanceSystem 설정 사용
        const roomCount = this.randomRange(mapConfig.roomCount.min, mapConfig.roomCount.max);
        this.expandRooms(startX, startY, roomCount);
        
        // 특수 방 배치
        this.placeSpecialRooms(stageData);
        
        // 현재 방 설정
        this.currentRoom = this.roomGrid[startY][startX];
        this.currentRoom.visited = true;
        this.currentRoom.cleared = true;
        
        // 총 방 수 계산
        this.totalRooms = this.rooms.filter(r => 
            r.type !== this.ROOM_TYPE.START && 
            r.type !== this.ROOM_TYPE.NONE
        ).length;
        this.roomsCleared = 0;
        
        // 모든 방에 monsterId 미리 할당 (저장/불러오기 일관성 보장)
        this.rooms.forEach(room => {
            this.getRoomMonsterImage(room);
        });
        
        console.log(`[Map] ${stageData.name} B${this.currentFloor}F - ${this.rooms.length}개 방 생성 (그리드: ${this.gridSize}x${this.gridSize})`);
    },
    
    // ==========================================
    // 방 생성
    // ==========================================
    createRoom(x, y, type) {
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return null;
        if (this.roomGrid[y][x]) return this.roomGrid[y][x];
        
        const room = {
            x, y,
            type: type,
            visited: false,
            cleared: false,
            monster: null,
            event: null,
            connections: { up: false, down: false, left: false, right: false }
        };
        
        this.roomGrid[y][x] = room;
        this.rooms.push(room);
        
        return room;
    },
    
    // ==========================================
    // 방 확장
    // ==========================================
    expandRooms(startX, startY, targetCount) {
        const queue = [{ x: startX, y: startY }];
        const directions = [
            { dx: 0, dy: -1, dir: 'up', opposite: 'down' },
            { dx: 0, dy: 1, dir: 'down', opposite: 'up' },
            { dx: -1, dy: 0, dir: 'left', opposite: 'right' },
            { dx: 1, dy: 0, dir: 'right', opposite: 'left' }
        ];
        
        while (this.rooms.length < targetCount && queue.length > 0) {
            // 랜덤하게 큐에서 선택
            const idx = Math.floor(Math.random() * queue.length);
            const current = queue[idx];
            
            // 셔플된 방향으로 확장 시도
            const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
            let expanded = false;
            
            for (const { dx, dy, dir, opposite } of shuffledDirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                
                // 범위 체크 및 빈 공간 체크
                if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize && !this.roomGrid[ny][nx]) {
                    // 인접한 방이 너무 많으면 스킵 (2개 이하만)
                    if (this.countAdjacentRooms(nx, ny) <= 2) {
                        const newRoom = this.createRoom(nx, ny, this.ROOM_TYPE.MONSTER);
                        
                        // 연결 설정
                        this.roomGrid[current.y][current.x].connections[dir] = true;
                        newRoom.connections[opposite] = true;
                        
                        queue.push({ x: nx, y: ny });
                        expanded = true;
                        break;
                    }
                }
            }
            
            // 확장 못했으면 큐에서 제거
            if (!expanded) {
                queue.splice(idx, 1);
            }
        }
    },
    
    // 인접 방 개수
    countAdjacentRooms(x, y) {
        let count = 0;
        if (y > 0 && this.roomGrid[y-1][x]) count++;
        if (y < this.gridSize-1 && this.roomGrid[y+1][x]) count++;
        if (x > 0 && this.roomGrid[y][x-1]) count++;
        if (x < this.gridSize-1 && this.roomGrid[y][x+1]) count++;
        return count;
    },
    
    // ==========================================
    // 특수 방 배치
    // ==========================================
    placeSpecialRooms(stageData) {
        // 시작 방에서 가장 먼 방에 보스 배치
        let farthestRoom = null;
        let maxDist = 0;
        
        const startRoom = this.rooms.find(r => r.type === this.ROOM_TYPE.START);
        
        for (const room of this.rooms) {
            if (room.type === this.ROOM_TYPE.MONSTER) {
                const dist = Math.abs(room.x - startRoom.x) + Math.abs(room.y - startRoom.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    farthestRoom = room;
                }
            }
        }
        
        if (farthestRoom) {
            farthestRoom.type = this.ROOM_TYPE.BOSS;
        }
        
        // 나머지 특수 방 배치
        const monsterRooms = this.rooms.filter(r => r.type === this.ROOM_TYPE.MONSTER);
        const shuffled = [...monsterRooms].sort(() => Math.random() - 0.5);
        
        // 보물 방 (1층당 무조건 1개 - 최우선 배치)
        if (shuffled.length > 0) {
            const treasureRoom = shuffled.pop();
            treasureRoom.type = this.ROOM_TYPE.TREASURE;
            console.log(`[Map] 보물방 배치: (${treasureRoom.x}, ${treasureRoom.y})`);
        }
        
        // 상점 (1개)
        if (shuffled.length > 0) {
            shuffled.pop().type = this.ROOM_TYPE.SHOP;
        }
        
        // 이벤트 방 (1~2개)
        const eventCount = this.randomRange(1, 2);
        for (let i = 0; i < eventCount && shuffled.length > 0; i++) {
            shuffled.pop().type = this.ROOM_TYPE.EVENT;
        }
        
        // 캠프 방 (1개) - 휴식처
        if (shuffled.length > 0) {
            shuffled.pop().type = this.ROOM_TYPE.CAMP;
        }
        
        // 엘리트 방 (항상 1개)
        if (shuffled.length > 0) {
            shuffled.pop().type = this.ROOM_TYPE.ELITE;
        }
        
        // 나머지는 몬스터 방으로 유지
        // 몬스터 데이터 할당 (거리 기반 밸런싱)
        for (const room of this.rooms) {
            // 시작방에서의 거리 계산
            const distance = Math.abs(room.x - startRoom.x) + Math.abs(room.y - startRoom.y);
            room.distance = distance; // 방에 거리 정보 저장
            
            if (room.type === this.ROOM_TYPE.MONSTER) {
                room.monsters = this.getMonstersForRoom(stageData, false, room);
                room.monster = room.monsters[0]; // 하위 호환성
            } else if (room.type === this.ROOM_TYPE.ELITE) {
                room.monsters = this.getMonstersForRoom(stageData, true, room);
                room.monster = room.monsters[0]; // 하위 호환성
            } else if (room.type === this.ROOM_TYPE.BOSS) {
                room.monsters = [{ name: stageData.boss, isBoss: true }];
                room.monster = room.monsters[0]; // 하위 호환성
            }
        }
    },
    
    // 방용 몬스터들 가져오기 (여러 마리) - 거리 기반 밸런싱
    getMonstersForRoom(stageData, isElite, room = null) {
        if (isElite && stageData.elites.length > 0) {
            return [{
                name: stageData.elites[Math.floor(Math.random() * stageData.elites.length)],
                isElite: true
            }];
        }
        
        // 몬스터 수 결정 - BalanceSystem 사용
        let count = 1;
        if (typeof BalanceSystem !== 'undefined' && room) {
            count = BalanceSystem.getEnemyCountForRoom(room);
        } else {
            const countRange = stageData.enemyCount || { min: 1, max: 1 };
            count = this.randomRange(countRange.min, countRange.max);
        }
        
        const monsters = [];
        for (let i = 0; i < count; i++) {
            monsters.push({
                name: StageData.selectMonster(stageData),
                isElite: false
            });
        }
        
        return monsters;
    },
    
    // ==========================================
    // 방 이동
    // ==========================================
    moveToRoom(dx, dy) {
        const nx = this.currentRoom.x + dx;
        const ny = this.currentRoom.y + dy;
        
        // 연결 체크
        let canMove = false;
        if (dx === 0 && dy === -1) canMove = this.currentRoom.connections.up;
        if (dx === 0 && dy === 1) canMove = this.currentRoom.connections.down;
        if (dx === -1 && dy === 0) canMove = this.currentRoom.connections.left;
        if (dx === 1 && dy === 0) canMove = this.currentRoom.connections.right;
        
        if (!canMove) return;
        
        const targetRoom = this.roomGrid[ny]?.[nx];
        if (!targetRoom) return;
        
        // 현재 방이 클리어되지 않았으면 이동 불가 (시작 방 제외)
        if (!this.currentRoom.cleared && this.currentRoom.type !== this.ROOM_TYPE.START) {
            this.showMessage('현재 방을 먼저 클리어하세요!');
            return;
        }
        
        // 이동
        this.currentRoom = targetRoom;
        this.currentRoom.visited = true;
        
        this.updateUI();
        this.renderMinimap();
        
        // 캐릭터 중앙 정렬 스크롤
        this.scrollToCurrentRoom();
        
        // 클리어되지 않은 방이면 입장 연출 후 입장
        if (!targetRoom.cleared && targetRoom.type !== this.ROOM_TYPE.START) {
            this.playRoomEnterEffect(targetRoom, () => {
                this.enterCurrentRoom();
            });
        }
    },
    
    // ==========================================
    // 방 입장 연출 (다크소울 스타일)
    // ==========================================
    playRoomEnterEffect(room, callback) {
        // 방 타입별 텍스트
        const textData = {
            [this.ROOM_TYPE.MONSTER]: this.getMonsterNameForRoom(room) || '적 출현',
            [this.ROOM_TYPE.ELITE]: this.getMonsterNameForRoom(room) || '강적',
            [this.ROOM_TYPE.BOSS]: this.getMonsterNameForRoom(room) || '???',
            [this.ROOM_TYPE.TREASURE]: '보물 상자',
            [this.ROOM_TYPE.SHOP]: '떠돌이 상인',
            [this.ROOM_TYPE.EVENT]: '???',
            [this.ROOM_TYPE.CAMP]: '화톳불'
        };
        
        const mainText = textData[room.type] || '???';
        
        // 다크소울 스타일 연출 요소 생성
        const overlay = document.createElement('div');
        overlay.className = 'ds-enter-overlay';
        overlay.innerHTML = `
            <div class="ds-enter-dim"></div>
            <div class="ds-enter-letterbox top"></div>
            <div class="ds-enter-letterbox bottom"></div>
            <div class="ds-enter-text-container">
                <div class="ds-enter-line left"></div>
                <div class="ds-enter-text">${mainText}</div>
                <div class="ds-enter-line right"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 애니메이션 시퀀스
        requestAnimationFrame(() => {
            // 1. 레터박스 등장
            overlay.classList.add('letterbox-in');
            
            // 2. 텍스트 페이드인
            setTimeout(() => {
                overlay.classList.add('text-in');
            }, 400);
            
            // 3. 텍스트 유지 후 페이드아웃
            setTimeout(() => {
                overlay.classList.add('text-out');
            }, 1200);
            
            // 4. 레터박스 퇴장 & 콜백
            setTimeout(() => {
                overlay.classList.add('letterbox-out');
                setTimeout(() => {
                    overlay.remove();
                    if (callback) callback();
                }, 500);
            }, 1600);
        });
    },
    
    // 방에 배정된 몬스터 이름 가져오기
    getMonsterNameForRoom(room) {
        if (room.monsters && room.monsters.length > 0) {
            const monsterData = this.getSingleMonsterData(room.monsters[0].name);
            return monsterData?.name || null;
        }
        if (room.monster) {
            const monsterData = this.getSingleMonsterData(room.monster.name);
            return monsterData?.name || null;
        }
        return null;
    },
    
    // ==========================================
    // 전투 미리보기 모달
    // ==========================================
    showBattlePreviewModal(room) {
        const stageData = StageData.getStage(this.currentStage);
        const monstersData = this.getMonstersDisplayData(room, stageData);
        const capturedNpc = this.getCapturedNpcForRoom(room);
        
        let typeLabel = '일반 전투';
        let typeClass = 'normal';
        let typeIcon = '⚔️';
        
        if (room.type === this.ROOM_TYPE.ELITE) {
            typeLabel = '엘리트 전투';
            typeClass = 'elite';
            typeIcon = '💀';
        } else if (room.type === this.ROOM_TYPE.BOSS) {
            typeLabel = '보스 전투';
            typeClass = 'boss';
            typeIcon = '👑';
        }
        
        // 몬스터 미리보기 HTML 생성
        let monstersHtml = '';
        if (monstersData.length === 1) {
            // 단일 몬스터
            monstersHtml = `
                <div class="enemy-preview">
                    <img src="${monstersData[0].img}" alt="${monstersData[0].name}" class="enemy-preview-img" onerror="this.src='monster.png'">
                </div>
                <h2 class="enemy-name">${monstersData[0].name}</h2>
                <div class="enemy-stats-preview">
                    <div class="stat-preview">
                        <span class="stat-icon">❤️</span>
                        <span class="stat-value">${monstersData[0].hp}</span>
                    </div>
                </div>
            `;
        } else {
            // 다중 몬스터
            monstersHtml = `
                <div class="enemies-preview-list">
                    ${monstersData.map(m => `
                        <div class="enemy-preview-item">
                            <img src="${m.img}" alt="${m.name}" class="enemy-preview-img-small" onerror="this.src='monster.png'">
                            <div class="enemy-preview-info">
                                <span class="enemy-preview-name">${m.name}</span>
                                <span class="enemy-preview-hp">❤️ ${m.hp}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <h2 class="enemy-name">${monstersData.length}마리의 적</h2>
            `;
        }
        
        const modal = document.createElement('div');
        modal.className = `event-modal battle-preview-modal ${typeClass}`;
        modal.innerHTML = `
            <div class="event-content battle-preview">
                <div class="battle-type-badge ${typeClass}">
                    <span class="type-icon">${typeIcon}</span>
                    <span class="type-label">${typeLabel}</span>
                </div>
                
                ${monstersHtml}
                
                ${capturedNpc ? `
                <div class="captive-info">
                    <div class="captive-header">🆘 구출 대상</div>
                    <div class="captive-preview">
                        <img src="${capturedNpc.img}" alt="${capturedNpc.name}" class="captive-preview-img">
                        <span class="captive-name">${capturedNpc.name}</span>
                    </div>
                    <p class="captive-help">"${capturedNpc.helpText}"</p>
                </div>
                ` : ''}
                
                ${room.type === this.ROOM_TYPE.BOSS ? '<p class="boss-warning">⚠️ 강력한 보스입니다!</p>' : ''}
                ${room.type === this.ROOM_TYPE.ELITE ? '<p class="elite-warning">💎 승리 시 유물 보상!</p>' : ''}
                
                <button class="battle-enter-btn">
                    <span class="btn-icon">⚔️</span>
                    <span class="btn-text">전투 시작</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 전투 시작 버튼
        modal.querySelector('.battle-enter-btn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                this.startBattle(room);
            }, 300);
        });
    },
    
    // 몬스터 ID → 표시 데이터 매핑
    monsterMap: {
        'goblinRogue': { name: '고블린 도적', img: 'goblin.png', hp: 35 },
        'goblinArcher': { name: '고블린 궁수', img: 'goblinarcher.png', hp: 28 },
        'goblinShaman': { name: '고블린 샤먼', img: 'goblinshaman.png', hp: 32 },
        'thornGuardian': { name: '가시 수호자', img: 'spikemonster.png', hp: 80 },
        'poisonSpider': { name: '독 거미', img: 'spider.png', hp: 55 },
        'shadowSlime': { name: '그림자 슬라임', img: 'slime.png', hp: 50 },
        'fireElemental': { name: '불꽃 정령', img: 'burningmonster.png', hp: 45 },
        'skeletonWarrior': { name: '해골 전사', img: 'skeleton.png', hp: 45 },
        'direWolf': { name: '다이어 울프', img: 'wolf.png', hp: 48 },
        'goblinKing': { name: '고블린 킹', img: 'goblinking.png', hp: 120 },
        'spiderQueen': { name: '거미 여왕', img: 'spider.png', hp: 120 },
        'fireKing': { name: '화염왕', img: 'burningmonster.png', hp: 150 },
        'doppelganger': { name: '도플갱어', img: 'hero.png', hp: 120 },
        'mimic': { name: '미믹', img: 'mimic.png', hp: 65 },
        'reaper': { name: '사신', img: 'reaper.png', hp: 180 },
        'reaperShadow': { name: '사신의 분신', img: 'reaper.png', hp: 25 }
    },
    
    // 단일 몬스터 표시 데이터 가져오기
    getSingleMonsterData(monsterId) {
        if (this.monsterMap[monsterId]) {
            return this.monsterMap[monsterId];
        }
        
        // enemyDatabase에서 찾기
        if (typeof enemyDatabase !== 'undefined') {
            const found = enemyDatabase.find(e => e.id === monsterId || e.name === monsterId);
            if (found) {
                return { name: found.name, img: found.img || 'monster.png', hp: found.maxHp };
            }
        }
        
        // eliteDatabase에서 찾기
        if (typeof eliteDatabase !== 'undefined') {
            const found = eliteDatabase.find(e => e.id === monsterId || e.name === monsterId);
            if (found) {
                return { name: found.name, img: found.img || 'monster.png', hp: found.maxHp };
            }
        }
        
        // bossDatabase에서 찾기
        if (typeof bossDatabase !== 'undefined') {
            const found = bossDatabase.find(e => e.id === monsterId || e.name === monsterId);
            if (found) {
                return { name: found.name, img: found.img || 'monster.png', hp: found.maxHp };
            }
        }
        
        return { name: '알 수 없는 적', img: 'monster.png', hp: 30 };
    },
    
    // 여러 몬스터 표시 데이터 가져오기
    getMonstersDisplayData(room, stageData) {
        const monsters = room.monsters || (room.monster ? [room.monster] : []);
        
        return monsters.map(m => this.getSingleMonsterData(m.name));
    },
    
    // 단일 몬스터 표시 데이터 가져오기 (하위 호환성)
    getMonsterDisplayData(room, stageData) {
        if (room.monster) {
            return this.getSingleMonsterData(room.monster.name);
        }
        return { name: '알 수 없는 적', img: 'monster.png', hp: 30 };
    },
    
    // ==========================================
    // 방 입장
    // ==========================================
    enterCurrentRoom() {
        const room = this.currentRoom;
        
        if (room.cleared) {
            this.showMessage('이미 클리어한 방입니다!');
            return;
        }
        
        // 이벤트/보물 방 진입 시 즉시 모든 게임 UI 숨기기
        if (room.type === this.ROOM_TYPE.EVENT || room.type === this.ROOM_TYPE.TREASURE) {
            this.hideAllGameUI();
        }
        
        switch (room.type) {
            case this.ROOM_TYPE.MONSTER:
            case this.ROOM_TYPE.ELITE:
            case this.ROOM_TYPE.BOSS:
                this.startBattle(room);
                break;
            case this.ROOM_TYPE.TREASURE:
                this.openTreasure(room);
                break;
            case this.ROOM_TYPE.SHOP:
                this.openShop(room);
                break;
            case this.ROOM_TYPE.EVENT:
                this.triggerEvent(room);
                break;
            case this.ROOM_TYPE.CAMP:
                this.openCamp(room);
                break;
            case this.ROOM_TYPE.START:
                this.showMessage('시작 방입니다.');
                break;
        }
    },
    
    // 모든 게임 UI 숨기기 (이벤트/보물 방 진입 시)
    hideAllGameUI() {
        // 게임 컨테이너 숨기기
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
        }
        
        // Incantation System UI 숨기기
        const incantationUI = document.querySelector('.incantation-container');
        if (incantationUI) {
            incantationUI.style.visibility = 'hidden';
        }
        
        // 턴 표시 숨기기
        const turnDisplay = document.querySelector('.turn-display');
        if (turnDisplay) {
            turnDisplay.style.visibility = 'hidden';
        }
        
        // 에너지/덱 카운트 등 숨기기
        const battleUI = document.querySelectorAll('.energy-display, .deck-count, .discard-count');
        battleUI.forEach(el => {
            if (el) el.style.visibility = 'hidden';
        });
    },
    
    // ==========================================
    // 전투 시작
    // ==========================================
    startBattle(room) {
        this.hideMap();
        
        // 전투 타입 설정
        if (room.type === this.ROOM_TYPE.BOSS) {
            gameState.currentBattleType = 'boss';
        } else if (room.type === this.ROOM_TYPE.ELITE) {
            gameState.currentBattleType = 'elite';
        } else {
            gameState.currentBattleType = 'normal';
        }
        
        gameState.battleCount = this.currentFloor;
        
        // 방에 할당된 몬스터 정보 전달 (다중 몬스터 지원)
        if (room.monsters && room.monsters.length > 0) {
            gameState.assignedMonsters = room.monsters;
            gameState.assignedMonster = room.monsters[0]; // 하위 호환성
        } else if (room.monster) {
            gameState.assignedMonsters = [room.monster];
            gameState.assignedMonster = room.monster;
        } else {
            gameState.assignedMonsters = null;
            gameState.assignedMonster = null;
        }
        
        if (typeof startBattle === 'function') {
            startBattle();
        }
    },
    
    // ==========================================
    // 보물 방
    // ==========================================
    openTreasure(room) {
        // TreasureSystem 사용 (드래그 열기 방식)
        if (typeof TreasureSystem !== 'undefined') {
            TreasureSystem.open(room);
        } else {
            // 폴백: 기존 방식
            this.openTreasureFallback(room);
        }
    },
    
    // 폴백 보물 모달 (TreasureSystem 없을 때)
    openTreasureFallback(room) {
        const goldAmount = this.randomRange(30, 80);
        gameState.gold = (gameState.gold || 0) + goldAmount;
        
        if (typeof GoldSystem !== 'undefined') {
            GoldSystem.addGold(goldAmount);
        }
        
        const modal = document.createElement('div');
        modal.className = 'event-modal treasure-modal';
        modal.innerHTML = `
            <div class="event-content">
                <div class="event-icon">💎</div>
                <h2 class="event-title">보물 발견!</h2>
                <div class="treasure-rewards">
                    <div class="reward-item gold-reward">
                        <span class="reward-icon">💰</span>
                        <span class="reward-value">+${goldAmount}</span>
                    </div>
                </div>
                <button class="event-btn confirm">획득!</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        modal.querySelector('.event-btn').addEventListener('click', () => {
            room.cleared = true;
            this.roomsCleared++;
            
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                this.updateUI();
                this.renderMinimap();
                this.showMap();
            }, 300);
        });
    },
    
    // ==========================================
    // 캠프 (휴식처)
    // ==========================================
    openCamp(room) {
        // 맵 숨기기
        this.hideMap();
        
        // CampEvent 시작
        if (typeof CampEvent !== 'undefined') {
            CampEvent.start(room);
        } else {
            // 폴백: 간단한 HP 회복
            const healAmount = Math.floor(gameState.player.maxHp * 0.3);
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
            this.showMessage(`휴식: HP +${healAmount}`);
            room.cleared = true;
            this.roomsCleared++;
            this.showMap();
        }
    },
    
    // ==========================================
    // 상점
    // ==========================================
    openShop(room) {
        // ShopEvent 시스템 사용
        if (typeof ShopEvent !== 'undefined') {
            ShopEvent.open(room);
            return;
        }
        
        // 폴백: 기존 간단한 상점
        const modal = document.createElement('div');
        modal.className = 'event-modal shop-modal';
        modal.innerHTML = `
            <div class="event-content">
                <div class="event-icon">🏪</div>
                <h2 class="event-title">떠돌이 상인</h2>
                <p class="shop-greeting">"좋은 물건 있어요~"</p>
                <div class="shop-items">
                    <div class="shop-item" data-type="heal">
                        <span class="item-icon">❤️</span>
                        <span class="item-name">HP 회복 (30%)</span>
                        <span class="item-cost">💰 25</span>
                    </div>
                    <div class="shop-item" data-type="maxhp">
                        <span class="item-icon">💖</span>
                        <span class="item-name">최대 HP +5</span>
                        <span class="item-cost">💰 50</span>
                    </div>
                    <div class="shop-item" data-type="removecard">
                        <span class="item-icon">🗑️</span>
                        <span class="item-name">카드 제거</span>
                        <span class="item-cost">💰 75</span>
                    </div>
                </div>
                <button class="event-btn cancel">나가기</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 상점 아이템 클릭
        modal.querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const costs = { heal: 25, maxhp: 50, removecard: 75 };
                const cost = costs[type];
                
                const currentGold = (typeof GoldSystem !== 'undefined' ? GoldSystem.getGold() : gameState.gold) || 0;
                
                if (currentGold < cost) {
                    this.showMessage('골드가 부족합니다!');
                    return;
                }
                
                // 골드 차감
                if (typeof GoldSystem !== 'undefined') {
                    GoldSystem.spendGold(cost);
                }
                gameState.gold = (gameState.gold || 0) - cost;
                
                // 효과 적용
                switch(type) {
                    case 'heal':
                        const healAmount = Math.floor(gameState.player.maxHp * 0.3);
                        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
                        this.showMessage(`HP ${healAmount} 회복!`);
                        break;
                    case 'maxhp':
                        gameState.player.maxHp += 5;
                        gameState.player.hp += 5;
                        this.showMessage('최대 HP +5!');
                        break;
                    case 'removecard':
                        this.showMessage('카드 제거 기능 준비중...');
                        break;
                }
                
                item.classList.add('purchased');
                item.style.pointerEvents = 'none';
                this.updateUI();
            });
        });
        
        modal.querySelector('.event-btn').addEventListener('click', () => {
            room.cleared = true;
            this.roomsCleared++;
            
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                this.updateUI();
                this.renderMinimap();
                this.showMap();
            }, 300);
        });
    },
    
    // ==========================================
    // 이벤트 방
    // ==========================================
    triggerEvent(room) {
        const self = this;
        
        // 즉시 게임 화면 숨기기 (ENEMY TURN 등이 보이지 않도록)
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
        }
        
        // EventSystem 사용
        if (typeof EventSystem !== 'undefined') {
            const availableEvents = EventSystem.getAvailableEvents();
            
            // 등록된 이벤트가 없으면 방만 클리어
            if (availableEvents.length === 0) {
                self.showMessage('고요한 방이다... 아무 일도 일어나지 않았다.');
                room.cleared = true;
                self.roomsCleared++;
                self.updateUI();
                self.renderMinimap();
                return;
            }
            
            const selectedEvent = EventSystem.trigger(room, {
                onSelect: (event) => {
                    // 일반 이벤트 UI 표시
                    self.showEventModal(event, room);
                },
                onEmpty: () => {
                    self.showMessage('아무 일도 일어나지 않았다...');
                    room.cleared = true;
                    self.roomsCleared++;
                    self.updateUI();
                    self.renderMinimap();
                }
            });
            
            // 전체화면 이벤트인 경우 맵 숨기기
            if (selectedEvent && (selectedEvent.isFullscreen || selectedEvent.id === 'tarot')) {
                this.hideMap();
            }
            return;
        }
        
        // EventSystem 없으면 폴백
        this.showMessage('이벤트 시스템을 찾을 수 없습니다.');
        room.cleared = true;
        this.roomsCleared++;
    },
    
    // 일반 이벤트 모달 표시
    showEventModal(event, room) {
        const self = this;
        
        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="event-content">
                <div class="event-icon">${event.icon || '❓'}</div>
                <h2 class="event-title">${event.name}</h2>
                <p class="event-desc">${event.description}</p>
                <div class="event-buttons">
                    <button class="event-btn confirm" id="event-accept">수락</button>
                    <button class="event-btn cancel" id="event-skip">지나가기</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        const closeModal = (result) => {
            room.cleared = true;
            self.roomsCleared++;
            
            if (result) {
                self.showMessage(result);
            }
            
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                self.updateUI();
                self.renderMinimap();
            }, 300);
        };
        
        modal.querySelector('#event-accept').addEventListener('click', () => {
            event.execute(room, {
                onResult: (result) => closeModal(result)
            });
        });
        
        modal.querySelector('#event-skip').addEventListener('click', () => {
            closeModal(null);
        });
    },
    
    // ==========================================
    // 메시지 표시
    // ==========================================
    showMessage(text) {
        // MapUI 사용
        if (typeof MapUI !== 'undefined') {
            MapUI.showMessage(text);
            return;
        }
        
        // 폴백
        const msg = document.createElement('div');
        msg.className = 'map-message';
        msg.textContent = text;
        document.body.appendChild(msg);
        
        requestAnimationFrame(() => msg.classList.add('visible'));
        
        setTimeout(() => {
            msg.classList.remove('visible');
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    },
    
    // ==========================================
    // UI 업데이트
    // ==========================================
    updateUI() {
        // MapUI 사용
        if (typeof MapUI !== 'undefined') {
            MapUI.updateUI(this);
        } else {
            // 폴백
            const stageData = StageData.getStage(this.currentStage);
            
            const dungeonNameEl = document.getElementById('dungeon-name');
            const floorEl = document.getElementById('current-floor');
            const hpEl = document.getElementById('map-hp');
            const goldEl = document.getElementById('map-gold');
            const clearedEl = document.getElementById('rooms-cleared');
            const totalEl = document.getElementById('total-rooms');
            
            if (dungeonNameEl) dungeonNameEl.textContent = stageData?.name || '던전';
            if (floorEl) floorEl.textContent = this.currentFloor;
            if (hpEl) hpEl.textContent = gameState.player?.hp || 35;
            if (goldEl) goldEl.textContent = (typeof GoldSystem !== 'undefined' ? GoldSystem.getGold() : gameState.gold) || 0;
            if (clearedEl) clearedEl.textContent = this.roomsCleared;
            if (totalEl) totalEl.textContent = this.totalRooms;
        }
        
        // 현재 방 정보
        this.updateRoomDisplay();
    },
    
    // 현재 방 정보 표시
    updateRoomDisplay() {
        const room = this.currentRoom;
        if (!room) return;
        
        const roomInfo = this.getRoomInfo(room);
        
        // MapUI 사용
        if (typeof MapUI !== 'undefined') {
            MapUI.updateRoomDisplay(this, room, roomInfo);
        }
        
        // 공통 로직: 버튼 상태 업데이트
        const iconEl = document.getElementById('room-icon');
        const nameEl = document.getElementById('room-name');
        const descEl = document.getElementById('room-desc');
        const enterBtn = document.getElementById('btn-enter-room');
        const displayEl = document.getElementById('current-room-display');
        
        if (iconEl) iconEl.textContent = roomInfo.icon;
        if (nameEl) nameEl.textContent = roomInfo.name;
        if (descEl) descEl.textContent = room.cleared ? '✓ 클리어 완료' : roomInfo.desc;
        
        // 방 타입에 따른 색상
        if (displayEl) {
            displayEl.className = `ds-room-display current-room-display type-${room.type}`;
            if (room.cleared) displayEl.classList.add('cleared');
        }
        
        // 전투 방은 모달로 처리하므로 버튼 숨김
        const isBattleRoom = room.type === this.ROOM_TYPE.MONSTER || 
                            room.type === this.ROOM_TYPE.ELITE || 
                            room.type === this.ROOM_TYPE.BOSS;
        
        if (enterBtn) {
            if (isBattleRoom && !room.cleared) {
                enterBtn.style.display = 'none';
            } else if (room.cleared || room.type === this.ROOM_TYPE.START) {
                enterBtn.style.display = 'inline-flex';
                enterBtn.disabled = true;
                enterBtn.innerHTML = room.cleared 
                    ? '<span class="btn-icon">✓</span><span class="btn-text">클리어</span>' 
                    : '<span class="btn-icon">🏠</span><span class="btn-text">시작점</span>';
            } else {
                enterBtn.style.display = 'inline-flex';
                enterBtn.disabled = false;
                enterBtn.innerHTML = '<span class="btn-glow"></span><span class="btn-icon">⚔️</span><span class="btn-text">입장</span>';
            }
        }
    },
    
    // 방 정보
    getRoomInfo(room) {
        const info = {
            [this.ROOM_TYPE.START]: { icon: '🏠', name: '시작 방', desc: '여기서 시작했습니다.' },
            [this.ROOM_TYPE.MONSTER]: { icon: '👹', name: '몬스터 방', desc: '적이 기다리고 있습니다!' },
            [this.ROOM_TYPE.ELITE]: { icon: '💀', name: '엘리트 방', desc: '강력한 적이 있습니다!' },
            [this.ROOM_TYPE.BOSS]: { icon: '👑', name: '보스 방', desc: '이 층의 보스입니다!' },
            [this.ROOM_TYPE.TREASURE]: { icon: '💎', name: '보물 방', desc: '보물이 있습니다!' },
            [this.ROOM_TYPE.SHOP]: { icon: '🏪', name: '상점', desc: '떠돌이 상인이 있습니다.' },
            [this.ROOM_TYPE.EVENT]: { icon: '❓', name: '이벤트 방', desc: '무언가 있습니다...' },
            [this.ROOM_TYPE.CAMP]: { icon: '🏕️', name: '휴식처', desc: '잠시 쉬어갈 수 있습니다.' },
            [this.ROOM_TYPE.SECRET]: { icon: '🔒', name: '비밀 방', desc: '???' }
        };
        
        return info[room.type] || { icon: '?', name: '???', desc: '???' };
    },
    
    // ==========================================
    // 미니맵 렌더링
    // ==========================================
    renderMinimap() {
        const minimapEl = document.getElementById('room-minimap');
        if (!minimapEl) return;
        
        const cellSize = 160; // 방 간격 (통로 포함)
        const roomSize = 110; // 실제 방 크기
        
        // MapUI 사용하여 렌더링
        if (typeof MapUI !== 'undefined') {
            const html = MapUI.renderMinimap(this, cellSize, roomSize);
            minimapEl.innerHTML = html;
        } else {
            // 폴백 렌더링
            this.renderMinimapFallback(minimapEl, cellSize, roomSize);
        }
        
        // 클릭 이벤트 추가
        minimapEl.querySelectorAll('.minimap-room, .ds-room').forEach(el => {
            el.addEventListener('click', () => {
                const x = parseInt(el.dataset.roomX);
                const y = parseInt(el.dataset.roomY);
                const room = this.roomGrid[y]?.[x];
                if (room) this.onRoomClick(room);
            });
        });
    },
    
    // 미니맵 폴백 렌더링
    renderMinimapFallback(minimapEl, cellSize, roomSize) {
        const mapSize = this.gridSize * cellSize;
        
        minimapEl.style.width = `${mapSize}px`;
        minimapEl.style.height = `${mapSize}px`;
        
        let html = '';
        
        // 연결선
        html += `<svg class="minimap-connections" viewBox="0 0 ${mapSize} ${mapSize}">`;
        for (const room of this.rooms) {
            const cx = room.x * cellSize + cellSize / 2;
            const cy = room.y * cellSize + cellSize / 2;
            
            if (room.connections.right) {
                html += `<line x1="${cx}" y1="${cy}" x2="${cx + cellSize}" y2="${cy}" class="room-connection ${room.visited ? 'visited' : ''}"/>`;
            }
            if (room.connections.down) {
                html += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + cellSize}" class="room-connection ${room.visited ? 'visited' : ''}"/>`;
            }
        }
        html += '</svg>';
        
        // 방 그리기
        const roomOffset = (cellSize - roomSize) / 2;
        
        for (const room of this.rooms) {
            const isCurrent = room === this.currentRoom;
            const canMoveTo = this.isAdjacentToCurrent(room) && this.canMoveToRoom(room);
            const info = this.getRoomInfo(room);
            const monsterImg = this.getRoomMonsterImage(room);
            
            let roomClass = 'minimap-room';
            if (isCurrent) roomClass += ' current';
            if (room.visited) roomClass += ' visited';
            if (room.cleared) roomClass += ' cleared';
            if (canMoveTo) roomClass += ' accessible';
            roomClass += ` type-${room.type}`;
            
            html += `
                <div class="${roomClass}" 
                     style="left:${room.x * cellSize + roomOffset}px;top:${room.y * cellSize + roomOffset}px;width:${roomSize}px;height:${roomSize}px"
                     data-room-x="${room.x}" 
                     data-room-y="${room.y}">
                    ${monsterImg ? `<img src="${monsterImg}" class="room-monster-img" onerror="this.style.display='none'">` : `<span class="room-type-icon">${info.icon}</span>`}
                    ${isCurrent ? '<img src="hero.png" class="room-hero" alt="You">' : ''}
                </div>
            `;
        }
        
        minimapEl.innerHTML = html;
    },
    
    // 방의 이미지 가져오기 (몬스터 또는 특수 방)
    getRoomMonsterImage(room) {
        // 캠프 방이면 camp.png
        if (room.type === this.ROOM_TYPE.CAMP) {
            return 'camp.png';
        }
        
        // 전투 방이 아니면 null
        if (room.type !== this.ROOM_TYPE.MONSTER && 
            room.type !== this.ROOM_TYPE.ELITE && 
            room.type !== this.ROOM_TYPE.BOSS) {
            return null;
        }
        
        // 이미 저장된 monsterId가 있으면 해당 몬스터 이미지 반환
        if (room.monsterId) {
            const monsterData = this.getSingleMonsterData(room.monsterId);
            return monsterData?.img || null;
        }
        
        // 방에 할당된 몬스터 정보가 있으면 사용
        if (room.monsters && room.monsters.length > 0) {
            const monsterData = this.getSingleMonsterData(room.monsters[0].name);
            room.monsterId = room.monsters[0].name; // 저장
            return monsterData?.img || null;
        }
        if (room.monster) {
            const monsterData = this.getSingleMonsterData(room.monster.name);
            room.monsterId = room.monster.name; // 저장
            return monsterData?.img || null;
        }
        
        // 스테이지 기본 몬스터
        const stageData = StageData.getStage(this.currentStage);
        if (!stageData) return null;
        
        if (room.type === this.ROOM_TYPE.BOSS && stageData.boss) {
            room.monsterId = stageData.boss; // 저장
            const bossData = typeof bossDatabase !== 'undefined' 
                ? bossDatabase.find(b => b.id === stageData.boss) 
                : null;
            return bossData?.img || null;
        }
        
        if (room.type === this.ROOM_TYPE.ELITE && stageData.elites?.length > 0) {
            // 방 위치 기반으로 고정된 엘리트 선택 (매번 같은 이미지 표시)
            const eliteIndex = (room.x + room.y) % stageData.elites.length;
            const eliteId = stageData.elites[eliteIndex];
            room.monsterId = eliteId; // 저장
            const eliteData = typeof eliteDatabase !== 'undefined'
                ? eliteDatabase.find(e => e.id === eliteId)
                : null;
            return eliteData?.img || null;
        }
        
        if (stageData.monsters?.length > 0) {
            // 방 위치 기반으로 고정된 몬스터 선택
            const monsterIndex = (room.x * 3 + room.y * 7) % stageData.monsters.length;
            const monsterId = stageData.monsters[monsterIndex];
            room.monsterId = monsterId; // 저장
            const monsterData = typeof enemyDatabase !== 'undefined'
                ? enemyDatabase.find(m => m.id === monsterId)
                : null;
            return monsterData?.img || null;
        }
        
        return null;
    },
    
    
    // 현재 방으로 스크롤 (캐릭터 중앙 정렬)
    scrollToCurrentRoom(instant = false) {
        const mapContainer = document.querySelector('.ds-map-inner') || document.querySelector('.room-map-container');
        const minimapEl = document.getElementById('room-minimap');
        
        if (!mapContainer || !minimapEl || !this.currentRoom) return;
        
        // 아이소메트릭 좌표 계산 (MapUI와 동일한 값 사용)
        const tileWidth = 240;
        const tileHeight = 200;
        const spacing = 40;
        const cellWidth = tileWidth + spacing;
        const cellHeight = tileHeight + spacing * 0.5;
        const offsetX = this.gridSize * (cellWidth / 2);
        const offsetY = 30;
        
        // 아이소메트릭 변환
        const isoX = (this.currentRoom.x - this.currentRoom.y) * (cellWidth / 2) + offsetX + tileWidth / 2;
        const isoY = (this.currentRoom.x + this.currentRoom.y) * (cellHeight / 2) + offsetY + tileHeight / 2;
        
        const containerRect = mapContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // 현재 방이 정확히 중앙에 오도록 스크롤
        const scrollX = isoX - containerWidth / 2;
        const scrollY = isoY - containerHeight / 2;
        
        mapContainer.scrollTo({
            left: Math.max(0, scrollX),
            top: Math.max(0, scrollY),
            behavior: instant ? 'instant' : 'smooth'
        });
    },
    
    // 방이 현재 방과 인접한지 확인
    isAdjacentToCurrent(room) {
        if (!this.currentRoom) return false;
        const dx = Math.abs(room.x - this.currentRoom.x);
        const dy = Math.abs(room.y - this.currentRoom.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    },
    
    // 해당 방으로 이동 가능한지 확인
    canMoveToRoom(room) {
        if (!this.currentRoom) return false;
        
        // 현재 방이 클리어되지 않았으면 이동 불가
        if (!this.currentRoom.cleared && this.currentRoom.type !== this.ROOM_TYPE.START) {
            return false;
        }
        
        // 연결되어 있는지 확인
        const dx = room.x - this.currentRoom.x;
        const dy = room.y - this.currentRoom.y;
        
        if (dx === 0 && dy === -1) return this.currentRoom.connections.up;
        if (dx === 0 && dy === 1) return this.currentRoom.connections.down;
        if (dx === -1 && dy === 0) return this.currentRoom.connections.left;
        if (dx === 1 && dy === 0) return this.currentRoom.connections.right;
        
        return false;
    },
    
    // 방이 접근 가능한지 (클리어 또는 현재 방)
    isRoomAccessible(room) {
        if (!room) return false;
        return room === this.currentRoom || room.cleared;
    },
    
    // 방에 잡혀있는 NPC 확인
    getCapturedNpcForRoom(room) {
        if (!room || room.cleared) return null;
        
        const stageData = StageData.getStage(this.currentStage);
        if (!stageData) return null;
        
        // 확인할 NPC 설정들
        const npcConfigs = [];
        if (stageData.capturedNpc) npcConfigs.push(stageData.capturedNpc);
        if (stageData.eliteCapturedNpc) npcConfigs.push(stageData.eliteCapturedNpc);
        
        for (const capturedConfig of npcConfigs) {
            const npcId = capturedConfig.npcId;
            
            // 이미 구출된 NPC는 표시하지 않음
            if (typeof RescueSystem !== 'undefined' && RescueSystem.isRescued(npcId)) {
                continue;
            }
            
            const npc = typeof NPCDatabase !== 'undefined' ? NPCDatabase[npcId] : null;
            if (!npc) continue;
            
            // roomType 설정에 따라 확인
            // 보스 방에 잡혀있는 경우
            if ((capturedConfig.roomType === 'boss' || capturedConfig.requireBoss) && room.type === this.ROOM_TYPE.BOSS) {
                return npc;
            }
            
            // 엘리트 방에 잡혀있는 경우
            if (capturedConfig.roomType === 'elite' && room.type === this.ROOM_TYPE.ELITE) {
                return npc;
            }
            
            // 일반 몬스터 방에 잡혀있는 경우
            if (capturedConfig.roomType === 'monster' && room.type === this.ROOM_TYPE.MONSTER) {
                // 첫 번째 몬스터 방에만 표시
                const monsterRooms = this.rooms.filter(r => r.type === this.ROOM_TYPE.MONSTER);
                if (monsterRooms.length > 0 && monsterRooms[0] === room) {
                    return npc;
                }
            }
        }
        
        return null;
    },
    
    // ==========================================
    // 맵 표시/숨기기
    // ==========================================
    showMap() {
        const mapScreen = document.getElementById('map-screen');
        const gameContainer = document.querySelector('.game-container');
        
        if (mapScreen) {
            mapScreen.style.display = 'flex';
            this.isMapVisible = true;
            this.updateUI();
            this.renderMinimap();
            
            // 맵 표시 시 캐릭터 중앙 정렬 (즉시)
            setTimeout(() => this.scrollToCurrentRoom(true), 50);
        }
        
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        // TopBar 표시 및 업데이트
        if (typeof TopBar !== 'undefined') {
            TopBar.show();
            document.body.classList.add('has-topbar');
        }
    },
    
    hideMap() {
        const mapScreen = document.getElementById('map-screen');
        const gameContainer = document.querySelector('.game-container');
        
        if (mapScreen) {
            mapScreen.style.display = 'none';
            this.isMapVisible = false;
        }
        
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
        
        // TopBar 업데이트 (전투 중에도 계속 표시)
        if (typeof TopBar !== 'undefined') {
            TopBar.update();
        }
    },
    
    // ==========================================
    // 전투 승리 후
    // ==========================================
    onBattleWin() {
        // 현재 방 클리어 처리
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
            this.roomsCleared++;
        }
        
        const stageData = StageData.getStage(this.currentStage);
        
        // 이벤트 보스 (사신 등) - 층 이동 없음, 맵으로 복귀
        if (gameState.currentBattleType === 'event_boss' || gameState.isEventBoss) {
            console.log('[Map] 이벤트 보스 처치 완료 - 맵으로 복귀');
            gameState.isEventBoss = false; // 플래그 초기화
            this.showMap();
            return;
        }
        
        // 맵의 보스 방에서 보스 클리어 시에만 다음 층으로
        if (gameState.currentBattleType === 'boss' && 
            this.currentRoom?.type === this.ROOM_TYPE.BOSS) {
            // NPC 구출 체크
            if (stageData.capturedNpc && !RescueSystem.isRescued(stageData.capturedNpc.npcId)) {
                NPCDisplaySystem.showRescueEvent(stageData.capturedNpc.npcId, () => {
                    this.onStageClear();
                });
                return;
            }
            
            this.onStageClear();
            return;
        }
        
        // 일반/엘리트 전투 후 맵으로
        this.showMap();
    },
    
    // 스테이지 클리어
    onStageClear() {
        if (this.currentStage < 3) {
            this.showStageClearModal(() => {
                this.currentStage++;
                this.currentFloor = 1;
                this.generateFloor();
                this.showMap();
            });
        } else {
            this.showGameClearModal();
        }
    },
    
    // 스테이지 클리어 모달
    showStageClearModal(callback) {
        const stageData = StageData.getStage(this.currentStage);
        const nextStageData = StageData.getStage(this.currentStage + 1);
        
        const modal = document.createElement('div');
        modal.className = 'event-modal stage-clear-modal';
        modal.innerHTML = `
            <div class="event-content">
                <div class="event-icon">🏆</div>
                <h2 class="event-title">${stageData.name} 클리어!</h2>
                <p class="event-desc">다음 지역: ${nextStageData?.name || '???'}</p>
                <button class="event-btn confirm">계속하기</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        modal.querySelector('.event-btn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                callback();
            }, 300);
        });
    },
    
    // 게임 클리어 모달
    showGameClearModal() {
        const modal = document.createElement('div');
        modal.className = 'event-modal game-clear-modal';
        modal.innerHTML = `
            <div class="event-content">
                <div class="event-icon">👑</div>
                <h2 class="event-title">VICTORY!</h2>
                <p class="event-desc">모든 던전을 정복했습니다!</p>
                <button class="event-btn confirm">타이틀로</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        modal.querySelector('.event-btn').addEventListener('click', () => {
            modal.remove();
            location.reload();
        });
    },
    
    // 일시정지 메뉴
    showPauseMenu() {
        const modal = document.createElement('div');
        modal.className = 'event-modal pause-modal';
        modal.innerHTML = `
            <div class="event-content">
                <h2 class="event-title">⚙️ 메뉴</h2>
                <div class="pause-buttons">
                    <button class="pause-btn primary" id="pause-town">마을로 돌아가기</button>
                    <button class="pause-btn" id="pause-resume">계속 탐험하기</button>
                    <button class="pause-btn debug" id="pause-test">🧪 몬스터 테스트</button>
                    <button class="pause-btn danger" id="pause-quit">포기하기</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        modal.querySelector('#pause-resume').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('#pause-town').addEventListener('click', () => {
            modal.remove();
            this.showDungeonSettlement();
        });
        
        modal.querySelector('#pause-test').addEventListener('click', () => {
            modal.remove();
            this.showMonsterTestMenu();
        });
        
        modal.querySelector('#pause-quit').addEventListener('click', () => {
            if (confirm('정말 포기하시겠습니까?\n\n진행 상황이 모두 초기화됩니다.')) {
                location.reload();
            }
        });
    },
    
    // ==========================================
    // 던전 정산 & 마을 귀환
    // ==========================================
    showDungeonSettlement() {
        // 정산 정보 수집
        const clearedRooms = this.roomsCleared || 0;
        const totalRooms = this.totalRooms || 0;
        const currentFloor = this.currentFloor || 1;
        const currentStage = this.currentStage || 1;
        const stageName = StageData.getStage(currentStage)?.name || '던전';
        
        // 골드 보상 계산
        const goldFromRooms = clearedRooms * 5;
        const floorBonus = (currentFloor - 1) * 20;
        const explorationBonus = goldFromRooms + floorBonus;
        
        // 던전에서 획득한 골드
        const dungeonGoldEarned = (typeof GoldSystem !== 'undefined') ? GoldSystem.getDungeonGold() : 0;
        const totalGoldReward = dungeonGoldEarned + explorationBonus;
        
        // 현재 플레이어 상태
        const playerGold = gameState?.gold || 0;
        const playerHp = gameState?.player?.hp || 0;
        const playerMaxHp = gameState?.player?.maxHp || 50;
        
        // 이번 던전에서 구출한 NPC 목록
        const dungeonRescuedNpcs = typeof RescueSystem !== 'undefined' ? RescueSystem.getDungeonRescuedData() : [];
        const rescuedCount = dungeonRescuedNpcs.length;
        
        const modal = document.createElement('div');
        modal.className = 'event-modal settlement-modal';
        modal.innerHTML = `
            <div class="event-content settlement-content">
                <h2 class="settlement-title">귀환</h2>
                <p class="settlement-subtitle">${stageName} B${currentFloor}F</p>
                
                <div class="settlement-summary">
                    <div class="summary-row">
                        <span>클리어</span>
                        <span>${clearedRooms}/${totalRooms}</span>
                    </div>
                    <div class="summary-row">
                        <span>HP</span>
                        <span>${playerHp}/${playerMaxHp}</span>
                    </div>
                    ${dungeonRescuedNpcs.length > 0 ? `
                    <div class="summary-row rescued">
                        <span>구출</span>
                        <span>${dungeonRescuedNpcs.map(npc => npc.name).join(', ')}</span>
                    </div>
                    ` : ''}
                    <div class="summary-row gold">
                        <span>골드</span>
                        <span>+${totalGoldReward}</span>
                    </div>
                </div>
                
                ${dungeonRescuedNpcs.length > 0 ? `
                <div class="npc-dialogue-box">
                    ${dungeonRescuedNpcs.map(npc => `
                    <div class="npc-say">
                        <img src="${npc.img}" class="npc-mini-avatar" onerror="this.style.display='none'">
                        <span>"${RescueSystem.getEscapeDialogue(npc.id)}"</span>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <p class="warning-text">* 사망 시 골드와 구출이 무효됩니다</p>
                
                <div class="settlement-buttons">
                    <button class="settlement-btn cancel" id="settlement-cancel">계속</button>
                    <button class="settlement-btn confirm" id="settlement-confirm">귀환</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 계속 탐험
        modal.querySelector('#settlement-cancel').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
        
        // 마을로 귀환
        modal.querySelector('#settlement-confirm').addEventListener('click', () => {
            // 💰 던전 탈출 성공 - 골드 영구 저장
            if (typeof GoldSystem !== 'undefined') {
                // 탐험 보너스 골드 추가 후 영구 저장
                GoldSystem.addGold(explorationBonus);
                GoldSystem.escapeDungeon();
            }
            
            // 👥 던전 탈출 성공 - NPC 구출 영구 저장
            if (typeof RescueSystem !== 'undefined') {
                RescueSystem.escapeDungeon();
            }
            
            // ❤️ HP 회복 - 마을 귀환 시 체력 완전 회복
            if (typeof gameState !== 'undefined' && gameState.player) {
                gameState.player.hp = gameState.player.maxHp;
                console.log(`[Map] 마을 귀환 - HP 완전 회복: ${gameState.player.hp}/${gameState.player.maxHp}`);
            }
            
            // 던전 상태 리셋
            this.resetDungeon();
            
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                this.hideMap();
                
                // 마을로 이동
                if (typeof TownSystem !== 'undefined') {
                    TownSystem.show();
                }
            }, 300);
        });
        
        // CSS 주입
        this.injectSettlementStyles();
    },
    
    // 던전 상태 리셋
    resetDungeon() {
        console.log('[Map] 던전 상태 리셋');
        
        // 맵 데이터 초기화
        this.rooms = [];
        this.roomGrid = [];
        this.currentRoom = null;
        this.roomsCleared = 0;
        this.totalRooms = 0;
        this.currentFloor = 1;
        // currentStage는 유지 (마지막으로 플레이한 스테이지)
        
        // 플레이어 상태 부분 리셋 (HP는 마을에서 회복)
        if (typeof gameState !== 'undefined') {
            gameState.deck = [];
            gameState.drawPile = [];
            gameState.discardPile = [];
            gameState.hand = [];
            gameState.exhaustPile = [];
            gameState.enemies = [];
        }
        
        console.log('[Map] 던전 리셋 완료 - 다음 입장 시 새 던전 생성');
    },
    
    // 정산 모달 CSS
    injectSettlementStyles() {
        if (document.getElementById('settlement-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'settlement-styles';
        style.textContent = `
            .settlement-modal .settlement-content {
                max-width: 320px;
                text-align: center;
                padding: 20px;
            }
            
            .settlement-title {
                font-size: 1.4rem;
                color: #fbbf24;
                margin-bottom: 2px;
            }
            
            .settlement-subtitle {
                color: #64748b;
                font-size: 0.85rem;
                margin-bottom: 15px;
            }
            
            .settlement-summary {
                background: rgba(0, 0, 0, 0.4);
                border-radius: 8px;
                padding: 10px 15px;
                margin-bottom: 12px;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 0.9rem;
                color: #94a3b8;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            
            .summary-row:last-child {
                border-bottom: none;
            }
            
            .summary-row span:last-child {
                color: #fff;
                font-weight: 600;
            }
            
            .summary-row.rescued span:last-child {
                color: #4ade80;
            }
            
            .summary-row.gold span:last-child {
                color: #fbbf24;
            }
            
            .npc-dialogue-box {
                background: rgba(74, 222, 128, 0.1);
                border: 1px solid rgba(74, 222, 128, 0.3);
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 12px;
            }
            
            .npc-say {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.85rem;
                color: #a7f3d0;
                font-style: italic;
            }
            
            .npc-mini-avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .warning-text {
                font-size: 0.75rem;
                color: #f87171;
                margin-bottom: 15px;
            }
            
            /* 골드 획득 애니메이션 */
            #map-gold.gold-earned {
                animation: goldEarnedPulse 0.5s ease-out;
                color: #fbbf24 !important;
            }
            
            @keyframes goldEarnedPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); color: #fef08a; }
                100% { transform: scale(1); }
            }
            
            @keyframes goldLostPop {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            .settlement-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            .settlement-btn {
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }
            
            .settlement-btn.cancel {
                background: rgba(100, 116, 139, 0.3);
                color: #94a3b8;
                border: 1px solid #64748b;
            }
            
            .settlement-btn.cancel:hover {
                background: rgba(100, 116, 139, 0.5);
                color: #fff;
            }
            
            .settlement-btn.confirm {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                color: #1a1a2e;
            }
            
            .settlement-btn.confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(251, 191, 36, 0.4);
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 몬스터 테스트 메뉴
    // ==========================================
    showMonsterTestMenu() {
        // 모든 몬스터 목록 가져오기
        const allMonsters = [
            { category: '일반 몬스터', monsters: typeof enemyDatabase !== 'undefined' ? enemyDatabase.filter(e => !e.isSplitForm) : [] },
            { category: '엘리트 몬스터', monsters: typeof eliteDatabase !== 'undefined' ? eliteDatabase : [] },
            { category: '보스 몬스터', monsters: typeof bossDatabase !== 'undefined' ? bossDatabase : [] }
        ];
        
        // 다중 적 프리셋
        const multiEnemyPresets = [
            { name: '고블린 습격', monsters: ['goblinRogue', 'goblinRogue', 'goblinArcher'], type: 'normal', icon: '👺👺🏹' },
            { name: '고블린 주술단', monsters: ['goblinShaman', 'goblinRogue', 'goblinArcher'], type: 'normal', icon: '🧙‍♂️👺🏹' },
            { name: '슬라임 웨이브', monsters: ['shadowSlime', 'shadowSlime', 'shadowSlime'], type: 'normal', icon: '🟢🟢🟢' },
            { name: '혼합 무리', monsters: ['goblinRogue', 'shadowSlime', 'skeletonWarrior'], type: 'normal', icon: '👹🟢💀' },
            { name: '해골 부대', monsters: ['skeletonWarrior', 'skeletonWarrior'], type: 'normal', icon: '💀💀' },
            { name: '야수 팩', monsters: ['direWolf', 'direWolf', 'direWolf'], type: 'normal', icon: '🐺🐺🐺' },
            { name: '독거미 둥지', monsters: ['poisonSpider', 'poisonSpider'], type: 'normal', icon: '🕷️🕷️' },
            { name: '불꽃 군단', monsters: ['fireElemental', 'fireElemental', 'fireElemental'], type: 'normal', icon: '🔥🔥🔥' },
            { name: '엘리트 도전', monsters: ['thornGuardian', 'doppelganger'], type: 'elite', icon: '⭐⭐' },
            { name: '거미 여왕 보스', monsters: ['spiderQueen'], type: 'boss', icon: '🕷️👑' },
            { name: '고블린 왕 보스', monsters: ['goblinKing'], type: 'boss', icon: '👺👑' },
            { name: '화염왕 보스', monsters: ['fireKing'], type: 'boss', icon: '🔥👑' },
        ];
        
        let monstersHtml = '';
        
        // === 다중 적 프리셋 섹션 ===
        monstersHtml += `
            <div class="test-category multi-enemy-section">
                <h3 class="category-title">⚔️ 다중 적 전투</h3>
                <div class="monster-list preset-list">
        `;
        
        multiEnemyPresets.forEach((preset, idx) => {
            monstersHtml += `
                <button class="monster-test-btn multi-preset" 
                        data-preset-idx="${idx}">
                    <span class="monster-icon">${preset.icon}</span>
                    <span class="monster-name">${preset.name}</span>
                    <span class="monster-hp">${preset.monsters.length}마리</span>
                </button>
            `;
        });
        
        monstersHtml += `</div></div>`;
        
        // === 커스텀 다중 적 섹션 ===
        monstersHtml += `
            <div class="test-category custom-multi-section">
                <h3 class="category-title">🎮 커스텀 다중 적</h3>
                <div class="custom-multi-controls">
                    <select id="custom-monster-select" class="custom-select">
                        <option value="">-- 몬스터 선택 --</option>
        `;
        
        allMonsters.forEach(category => {
            if (category.monsters.length === 0) return;
            monstersHtml += `<optgroup label="${category.category}">`;
            category.monsters.forEach(m => {
                monstersHtml += `<option value="${m.id}">${m.name} (HP: ${m.maxHp})</option>`;
            });
            monstersHtml += `</optgroup>`;
        });
        
        monstersHtml += `
                    </select>
                    <button class="add-monster-btn" id="add-monster-btn">+ 추가</button>
                </div>
                <div class="selected-monsters" id="selected-monsters">
                    <span class="placeholder">몬스터를 추가하세요 (최대 5마리)</span>
                </div>
                <button class="start-custom-btn" id="start-custom-battle" disabled>
                    🗡️ 커스텀 전투 시작
                </button>
            </div>
        `;
        
        // === 단일 몬스터 섹션 ===
        allMonsters.forEach(category => {
            if (category.monsters.length === 0) return;
            
            monstersHtml += `<div class="test-category">
                <h3 class="category-title">${category.category}</h3>
                <div class="monster-list">`;
            
            category.monsters.forEach(m => {
                const isBoss = category.category === '보스 몬스터';
                const isElite = category.category === '엘리트 몬스터';
                monstersHtml += `
                    <button class="monster-test-btn ${isBoss ? 'boss' : ''} ${isElite ? 'elite' : ''}" 
                            data-monster-id="${m.id}"
                            data-battle-type="${isBoss ? 'boss' : isElite ? 'elite' : 'normal'}">
                        <span class="monster-icon">${isBoss ? '👑' : isElite ? '⭐' : '👹'}</span>
                        <span class="monster-name">${m.name}</span>
                        <span class="monster-hp">HP: ${m.maxHp}</span>
                    </button>
                `;
            });
            
            monstersHtml += `</div></div>`;
        });
        
        const modal = document.createElement('div');
        modal.className = 'event-modal monster-test-modal';
        modal.innerHTML = `
            <div class="event-content test-content">
                <h2 class="event-title">🧪 몬스터 테스트</h2>
                <p class="test-desc">테스트할 몬스터를 선택하세요</p>
                <div class="test-monsters-container">
                    ${monstersHtml}
                </div>
                <button class="pause-btn secondary" id="test-cancel">닫기</button>
            </div>
        `;
        
        // 스타일 추가
        this.injectTestModalStyles();
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 커스텀 다중 적 상태
        const customMonsters = [];
        const selectedMonstersEl = modal.querySelector('#selected-monsters');
        const startCustomBtn = modal.querySelector('#start-custom-battle');
        
        const updateCustomUI = () => {
            if (customMonsters.length === 0) {
                selectedMonstersEl.innerHTML = '<span class="placeholder">몬스터를 추가하세요 (최대 5마리)</span>';
                startCustomBtn.disabled = true;
            } else {
                selectedMonstersEl.innerHTML = customMonsters.map((m, i) => `
                    <span class="selected-monster-tag" data-idx="${i}">
                        ${m.name} <button class="remove-monster">×</button>
                    </span>
                `).join('');
                startCustomBtn.disabled = false;
                
                // 삭제 버튼
                selectedMonstersEl.querySelectorAll('.remove-monster').forEach((btn, i) => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        customMonsters.splice(i, 1);
                        updateCustomUI();
                    });
                });
            }
        };
        
        // 몬스터 추가 버튼
        modal.querySelector('#add-monster-btn').addEventListener('click', () => {
            const select = modal.querySelector('#custom-monster-select');
            const monsterId = select.value;
            if (!monsterId) return;
            if (customMonsters.length >= 5) {
                alert('최대 5마리까지 추가 가능합니다!');
                return;
            }
            
            // 몬스터 이름 찾기
            let monsterName = monsterId;
            allMonsters.forEach(cat => {
                const found = cat.monsters.find(m => m.id === monsterId);
                if (found) monsterName = found.name;
            });
            
            customMonsters.push({ id: monsterId, name: monsterName });
            select.value = '';
            updateCustomUI();
        });
        
        // 커스텀 전투 시작
        startCustomBtn.addEventListener('click', () => {
            if (customMonsters.length === 0) return;
            modal.remove();
            this.startMultiEnemyBattle(customMonsters.map(m => m.id), 'normal');
        });
        
        // 프리셋 버튼 클릭
        modal.querySelectorAll('.multi-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.presetIdx);
                const preset = multiEnemyPresets[idx];
                modal.remove();
                this.startMultiEnemyBattle(preset.monsters, preset.type);
            });
        });
        
        // 단일 몬스터 버튼 클릭
        modal.querySelectorAll('.monster-test-btn:not(.multi-preset)').forEach(btn => {
            btn.addEventListener('click', () => {
                const monsterId = btn.dataset.monsterId;
                const battleType = btn.dataset.battleType;
                if (!monsterId) return;
                modal.remove();
                this.startTestBattle(monsterId, battleType);
            });
        });
        
        // 닫기 버튼
        modal.querySelector('#test-cancel').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
    },
    
    // 다중 적 전투 시작
    startMultiEnemyBattle(monsterIds, battleType) {
        console.log(`[Map Test] 다중 적 테스트 시작:`, monsterIds, battleType);
        
        // 맵 숨기기
        this.hideMap();
        
        // gameState 설정
        if (typeof gameState !== 'undefined') {
            gameState.currentBattleType = battleType;
            gameState.assignedMonsters = monsterIds.map(id => ({
                name: id,
                isBoss: battleType === 'boss',
                isElite: battleType === 'elite'
            }));
            
            // 전투 시작
            if (typeof startBattle === 'function') {
                startBattle();
            } else {
                alert('startBattle 함수를 찾을 수 없습니다!');
            }
        } else {
            alert('gameState를 찾을 수 없습니다!');
        }
    },
    
    // 테스트 모달 스타일 주입
    injectTestModalStyles() {
        if (document.getElementById('map-test-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'map-test-modal-styles';
        style.textContent = `
            .multi-enemy-section, .custom-multi-section {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
            }
            
            .multi-enemy-section .category-title,
            .custom-multi-section .category-title {
                color: #ef4444;
            }
            
            .preset-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 10px;
            }
            
            .multi-preset {
                background: linear-gradient(145deg, #3a1a1a 0%, #2a1010 100%) !important;
                border-color: #ef4444 !important;
            }
            
            .multi-preset:hover {
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.5) !important;
            }
            
            .custom-multi-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .custom-select {
                flex: 1;
                padding: 10px;
                background: #1a1a2e;
                border: 2px solid #4a4a6a;
                border-radius: 8px;
                color: #fff;
                font-size: 0.9rem;
            }
            
            .custom-select:focus {
                outline: none;
                border-color: #fbbf24;
            }
            
            .add-monster-btn {
                padding: 10px 20px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .add-monster-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
            }
            
            .selected-monsters {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 12px;
                min-height: 50px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .selected-monsters .placeholder {
                color: #6b7280;
                font-style: italic;
            }
            
            .selected-monster-tag {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border-radius: 20px;
                font-size: 0.85rem;
                color: #fff;
                animation: tagAppear 0.2s ease-out;
            }
            
            @keyframes tagAppear {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            .remove-monster {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                color: #fff;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .remove-monster:hover {
                background: #ef4444;
            }
            
            .start-custom-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border: 2px solid #f87171;
                border-radius: 10px;
                color: #fff;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .start-custom-btn:disabled {
                background: #374151;
                border-color: #4b5563;
                color: #6b7280;
                cursor: not-allowed;
            }
            
            .start-custom-btn:not(:disabled):hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(239, 68, 68, 0.5);
            }
        `;
        document.head.appendChild(style);
    },
    
    // 테스트 전투 시작 (단일)
    startTestBattle(monsterId, battleType) {
        console.log(`[Test] 몬스터 테스트 시작: ${monsterId} (${battleType})`);
        
        // 몬스터 데이터 찾기
        const monsterData = findEnemyByName(monsterId);
        if (!monsterData) {
            alert(`몬스터를 찾을 수 없습니다: ${monsterId}`);
            return;
        }
        
        // 맵 숨기기
        this.hideMap();
        
        // gameState 설정
        if (typeof gameState !== 'undefined') {
            gameState.currentBattleType = battleType;
            gameState.assignedMonsters = [{
                name: monsterId,
                isBoss: battleType === 'boss',
                isElite: battleType === 'elite'
            }];
            
            // 전투 시작
            if (typeof startBattle === 'function') {
                startBattle();
            } else {
                alert('startBattle 함수를 찾을 수 없습니다!');
            }
        } else {
            alert('gameState를 찾을 수 없습니다!');
        }
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    randomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// 전역 접근
window.MapSystem = MapSystem;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    MapSystem.init();
});

console.log('[Map] 룸 기반 던전 시스템 로드 완료');
