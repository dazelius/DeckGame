// ==========================================
// Shadow Deck - 던전 맵 UI 시스템 (다크소울 테마)
// ==========================================

const MapUI = {
    // 초기화 여부
    initialized: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        if (this.initialized) return;
        this.injectStyles();
        this.initialized = true;
        console.log('[MapUI] 다크소울 테마 UI 시스템 초기화 완료');
    },
    
    // ==========================================
    // 맵 컨테이너 생성 (다크소울 스타일)
    // ==========================================
    createMapContainer() {
        const existing = document.getElementById('map-screen');
        if (existing) existing.remove();
        
        const mapScreen = document.createElement('div');
        mapScreen.id = 'map-screen';
        mapScreen.className = 'map-screen ds-map-screen';
        mapScreen.innerHTML = `
            <!-- 상단 바 -->
            <div class="ds-map-header">
                <div class="ds-dungeon-info">
                    <span class="ds-dungeon-name" id="dungeon-name">고블린 둥지</span>
                    <span class="ds-floor">B<span id="current-floor">1</span>F</span>
                </div>
                <div class="ds-player-stats">
                    <span class="ds-stat">❤️ <span id="map-hp">35</span></span>
                    <span class="ds-stat gold">💰 <span id="map-gold">0</span></span>
                    <span class="ds-stat">🚪 <span id="rooms-cleared">0</span>/<span id="total-rooms">0</span></span>
                </div>
            </div>
            
            <!-- 미니맵 -->
            <div class="ds-map-container room-map-container">
                <div class="ds-map-inner">
                    <div class="room-minimap" id="room-minimap"></div>
                </div>
                <button class="ds-menu-btn action-btn" id="btn-menu">⚙️</button>
            </div>
            
            <!-- 힌트 -->
            <div class="ds-map-hint map-hint">WASD 이동 · Enter/클릭 입장</div>
            
            <!-- 숨김 (호환성) -->
            <div style="display:none">
                <div id="current-room-display"></div>
                <div id="room-icon"></div>
                <div id="room-name"></div>
                <div id="room-desc"></div>
                <button id="btn-enter-room"></button>
            </div>
        `;
        
        mapScreen.style.display = 'none';
        document.body.appendChild(mapScreen);
        
        return mapScreen;
    },
    
    // ==========================================
    // UI 업데이트
    // ==========================================
    updateUI(mapSystem) {
        const stageData = StageData.getStage(mapSystem.currentStage);
        
        // 던전 정보
        const dungeonNameEl = document.getElementById('dungeon-name');
        const floorEl = document.getElementById('current-floor');
        
        if (dungeonNameEl) dungeonNameEl.textContent = stageData?.name || '던전';
        if (floorEl) floorEl.textContent = mapSystem.currentFloor;
        
        // HP
        const hp = gameState.player?.hp || 35;
        const maxHp = gameState.player?.maxHp || 50;
        const hpEl = document.getElementById('map-hp');
        if (hpEl) hpEl.textContent = `${hp}/${maxHp}`;
        
        // 골드
        const gold = (typeof GoldSystem !== 'undefined' ? GoldSystem.getTotalGold() : gameState.gold) || 0;
        const goldEl = document.getElementById('map-gold');
        if (goldEl) goldEl.textContent = gold.toLocaleString();
        
        // 방 클리어 현황
        const clearedEl = document.getElementById('rooms-cleared');
        const totalEl = document.getElementById('total-rooms');
        if (clearedEl) clearedEl.textContent = mapSystem.roomsCleared;
        if (totalEl) totalEl.textContent = mapSystem.totalRooms;
    },
    
    // ==========================================
    // 현재 방 정보 표시
    // ==========================================
    updateRoomDisplay(mapSystem, room, roomInfo) {
        const iconEl = document.getElementById('room-icon');
        const nameEl = document.getElementById('room-name');
        const descEl = document.getElementById('room-desc');
        const displayEl = document.getElementById('current-room-display');
        
        if (iconEl) iconEl.textContent = roomInfo.icon;
        if (nameEl) nameEl.textContent = roomInfo.name;
        if (descEl) descEl.textContent = room.cleared ? '✓ 클리어 완료' : roomInfo.desc;
        
        // 방 타입에 따른 스타일
        if (displayEl) {
            displayEl.className = `ds-room-display current-room-display type-${room.type}`;
            if (room.cleared) displayEl.classList.add('cleared');
        }
    },
    
    // ==========================================
    // 아이소메트릭 좌표 변환
    // ==========================================
    toIsometric(x, y, tileWidth, tileHeight) {
        return {
            isoX: (x - y) * (tileWidth / 2),
            isoY: (x + y) * (tileHeight / 2)
        };
    },
    
    // ==========================================
    // 미니맵 렌더링 (아이소메트릭 - 던전 타일 이미지 사용)
    // ==========================================
    renderMinimap(mapSystem, cellSize, roomSize) {
        const minimapEl = document.getElementById('room-minimap');
        if (!minimapEl) return '';
        
        // 던전 타일 비율에 맞춘 크기 (2배 확대 + 간격)
        const tileWidth = 240;  // 타일 너비
        const tileHeight = 200; // 타일 높이 (아이소메트릭 비율)
        const spacing = 40;     // 타일 간 간격
        
        // 아이소메트릭 맵 크기 계산 (간격 포함)
        const gridSize = mapSystem.gridSize;
        const cellWidth = tileWidth + spacing;
        const cellHeight = tileHeight + spacing * 0.5;
        const isoMapWidth = (gridSize + gridSize) * (cellWidth / 2) + tileWidth;
        const isoMapHeight = (gridSize + gridSize) * (cellHeight / 2) + tileHeight + 50;
        
        // 오프셋 (중앙 정렬용)
        const offsetX = gridSize * (cellWidth / 2);
        const offsetY = 30;
        
        minimapEl.style.width = `${isoMapWidth}px`;
        minimapEl.style.height = `${isoMapHeight}px`;
        minimapEl.classList.add('isometric-map');
        
        let html = '';
        
        // 연결선(통로) SVG 먼저 그리기
        html += `<svg class="iso-connections" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;">`;
        
        for (const room of mapSystem.rooms) {
            const pos = this.toIsometric(room.x, room.y, cellWidth, cellHeight);
            const cx = pos.isoX + offsetX + tileWidth / 2;
            const cy = pos.isoY + offsetY + tileHeight * 0.6; // 타일 바닥 중앙
            
            // 연결 상태 확인
            const isCurrentOrAdjacent = room === mapSystem.currentRoom || mapSystem.isAdjacentToCurrent(room);
            const isAccessible = mapSystem.isRoomAccessible(room);
            
            // 오른쪽 연결
            if (room.connections.right) {
                const rightPos = this.toIsometric(room.x + 1, room.y, cellWidth, cellHeight);
                const rx = rightPos.isoX + offsetX + tileWidth / 2;
                const ry = rightPos.isoY + offsetY + tileHeight * 0.6;
                
                const rightRoom = mapSystem.rooms.find(r => r.x === room.x + 1 && r.y === room.y);
                const isActive = isCurrentOrAdjacent || (rightRoom && mapSystem.isAdjacentToCurrent(rightRoom));
                
                html += `<line x1="${cx}" y1="${cy}" x2="${rx}" y2="${ry}" 
                         class="iso-path ${isActive ? 'active' : ''} ${isAccessible ? 'accessible' : ''}"/>`;
            }
            
            // 아래쪽 연결
            if (room.connections.down) {
                const downPos = this.toIsometric(room.x, room.y + 1, cellWidth, cellHeight);
                const dx = downPos.isoX + offsetX + tileWidth / 2;
                const dy = downPos.isoY + offsetY + tileHeight * 0.6;
                
                const downRoom = mapSystem.rooms.find(r => r.x === room.x && r.y === room.y + 1);
                const isActive = isCurrentOrAdjacent || (downRoom && mapSystem.isAdjacentToCurrent(downRoom));
                
                html += `<line x1="${cx}" y1="${cy}" x2="${dx}" y2="${dy}" 
                         class="iso-path ${isActive ? 'active' : ''} ${isAccessible ? 'accessible' : ''}"/>`;
            }
        }
        html += '</svg>';
        
        // 방 렌더링 (아이소메트릭 - dungeon_tile.png 사용)
        // 뒤에서 앞으로 그려야 올바른 z-order
        const sortedRooms = [...mapSystem.rooms].sort((a, b) => {
            return (a.x + a.y) - (b.x + b.y);
        });
        
        for (const room of sortedRooms) {
            const isCurrent = room === mapSystem.currentRoom;
            const isAdjacent = mapSystem.isAdjacentToCurrent(room);
            const canMoveTo = isAdjacent && mapSystem.canMoveToRoom(room);
            const roomInfo = mapSystem.getRoomInfo(room);
            
                    // NPC 구출 체크
                    const capturedNpc = mapSystem.getCapturedNpcForRoom(room);
                    const hasCaptive = capturedNpc && !room.cleared;
                    
                    // 몬스터 이미지 및 수
                    const monsterImg = mapSystem.getRoomMonsterImage(room);
                    const monsterCount = room.monsters ? room.monsters.length : 1;
            
            // 아이소메트릭 좌표 (간격 포함)
            const pos = this.toIsometric(room.x, room.y, cellWidth, cellHeight);
            const isoX = pos.isoX + offsetX;
            const isoY = pos.isoY + offsetY;
            const zIndex = room.x + room.y + 1;
            
            let roomClass = 'minimap-room ds-room iso-tile-room';
            if (isCurrent) roomClass += ' current';
            if (room.visited) roomClass += ' visited';
            if (room.cleared) roomClass += ' cleared';
            if (canMoveTo) roomClass += ' accessible';
            if (hasCaptive) roomClass += ' has-captive';
            roomClass += ` type-${room.type}`;
            
            // 연결 표시 (인접한 방과 연결되어 있는지)
            const hasRight = room.connections.right;
            const hasDown = room.connections.down;
            const hasLeft = room.connections.left;
            const hasUp = room.connections.up;
            
            html += `
                <div class="${roomClass}" 
                     style="left:${isoX}px;top:${isoY}px;width:${tileWidth}px;height:${tileHeight}px;z-index:${zIndex}"
                     data-room-x="${room.x}" 
                     data-room-y="${room.y}">
                    <!-- 던전 타일 이미지 -->
                    <img src="dungeon_tile.png" class="iso-tile-img" alt="Room">
                    
                    <!-- 컨텐츠 (아이콘, 몬스터) -->
                        <div class="iso-tile-content">
                            ${monsterImg ? `
                                <div class="iso-tile-monster-wrapper">
                                    <img src="${monsterImg}" class="iso-tile-monster" alt="Monster" onerror="this.style.display='none'">
                                    ${monsterCount > 1 ? `<span class="iso-tile-monster-count">x${monsterCount}</span>` : ''}
                                </div>
                            ` : `
                                <span class="iso-tile-icon">${roomInfo.icon}</span>
                            `}
                        </div>
                    
                    <!-- 플레이어 -->
                    ${isCurrent ? '<img src="hero.png" class="iso-tile-hero" alt="You">' : ''}
                    
                    <!-- 클리어 표시 -->
                    ${room.cleared ? '<div class="iso-tile-cleared">✓</div>' : ''}
                    
                    <!-- 구출 대상 -->
                    ${hasCaptive ? '<div class="iso-tile-captive">🆘</div>' : ''}
                </div>
            `;
        }
        
        return html;
    },
    
    // ==========================================
    // 메시지 표시
    // ==========================================
    showMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'map-message ds-map-message';
        msg.innerHTML = `<span class="msg-text">${text}</span>`;
        document.body.appendChild(msg);
        
        requestAnimationFrame(() => msg.classList.add('visible'));
        
        setTimeout(() => {
            msg.classList.remove('visible');
            setTimeout(() => msg.remove(), 400);
        }, 2000);
    },
    
    // ==========================================
    // 다크소울 테마 스타일
    // ==========================================
    injectStyles() {
        if (document.getElementById('map-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'map-ui-styles';
        style.textContent = `
            /* 맵 스크린 */
            .ds-map-screen {
                position: fixed;
                inset: 0;
                background: #08080c;
                display: flex;
                flex-direction: column;
                font-family: 'Noto Sans KR', sans-serif;
                z-index: 1000;
            }
            
            /* TopBar가 있을 때 맵 위치 조정 */
            body.has-topbar .ds-map-screen {
                top: 48px;
            }
            
            @media (max-width: 768px) {
                body.has-topbar .ds-map-screen {
                    top: 44px;
                }
            }
            
            /* 상단 바 (TopBar 사용 시 숨김) */
            .ds-map-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background: rgba(0,0,0,0.6);
            }
            
            body.has-topbar .ds-map-header {
                display: none;
            }
            
            .ds-dungeon-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .ds-dungeon-name {
                font-size: 1.3rem;
                color: #d4af37;
                font-family: 'Cinzel', serif;
                letter-spacing: 2px;
            }
            
            .ds-floor {
                color: #666;
                font-size: 1rem;
            }
            
            .ds-floor span {
                color: #d4af37;
                font-weight: bold;
            }
            
            .ds-player-stats {
                display: flex;
                gap: 20px;
            }
            
            .ds-stat {
                color: #888;
                font-size: 0.95rem;
            }
            
            .ds-stat span {
                color: #f5e6c4;
                font-weight: 600;
            }
            
            .ds-stat.gold span {
                color: #fbbf24;
            }
            
            /* 미니맵 영역 */
            .ds-map-container {
                flex: 1;
                position: relative;
                overflow: hidden;
            }
            
            .ds-map-inner {
                width: 100%;
                height: 100%;
                overflow: auto;
                padding: 20px;
            }
            
            .ds-map-inner::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            
            .ds-map-inner::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.15);
                border-radius: 3px;
            }
            
            /* 메뉴 버튼 */
            .ds-menu-btn {
                position: absolute;
                bottom: 15px;
                right: 15px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 1px solid #333;
                background: rgba(0,0,0,0.7);
                color: #888;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.2s;
                z-index: 100;
            }
            
            .ds-menu-btn:hover {
                background: rgba(212, 175, 55, 0.15);
                border-color: #d4af37;
                color: #d4af37;
            }
            
            /* 연결선 */
            .ds-map-connections {
                position: absolute;
                inset: 0;
                pointer-events: none;
            }
            
            .ds-connection {
                stroke: #1a1a24;
                stroke-width: 4;
                stroke-linecap: round;
            }
            
            .ds-connection.visited { stroke: #2a2a34; }
            .ds-connection.accessible { stroke: rgba(212, 175, 55, 0.3); }
            
            /* 아이소메트릭 맵 컨테이너 */
            .isometric-map {
                position: relative;
                margin: 0 auto;
            }
            
            /* 맵 배경 */
            .ds-map-inner {
                background: radial-gradient(ellipse at center, rgba(8, 8, 12, 0.8) 0%, rgba(5, 5, 8, 0.98) 100%);
                background-color: #050508;
            }
            
            /* ===== 통로 연결선 ===== */
            .iso-connections {
                overflow: visible;
            }
            
            /* 비활성 통로 */
            .iso-path {
                stroke: rgba(60, 55, 45, 0.4);
                stroke-width: 12;
                stroke-linecap: round;
                stroke-dasharray: 20 15;
                fill: none;
            }
            
            /* 활성화된 통로 (현재 방 또는 인접한 방) */
            .iso-path.active {
                stroke: rgba(180, 150, 80, 0.6);
                stroke-width: 16;
                stroke-dasharray: none;
                filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.3));
            }
            
            /* 이동 가능한 통로 - 굵고 밝게 + 흐르는 애니메이션 */
            .iso-path.active.accessible {
                stroke: rgba(255, 215, 100, 0.9);
                stroke-width: 20;
                stroke-dasharray: 30 15;
                filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.7)) drop-shadow(0 0 30px rgba(212, 175, 55, 0.4));
                animation: pathFlow 1s linear infinite, pathGlow 2s ease-in-out infinite;
            }
            
            /* 통로 흐르는 애니메이션 (이동 방향 표시) */
            @keyframes pathFlow {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -45; }
            }
            
            @keyframes pathGlow {
                0%, 100% { 
                    stroke: rgba(255, 215, 100, 0.8);
                    filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 25px rgba(212, 175, 55, 0.3));
                }
                50% { 
                    stroke: rgba(255, 230, 130, 1);
                    filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.9)) drop-shadow(0 0 40px rgba(212, 175, 55, 0.5));
                }
            }
            
            /* ========================================== */
            /* 던전 타일 기반 아이소메트릭 방 스타일 */
            /* ========================================== */
            
            .iso-tile-room {
                position: absolute;
                cursor: pointer;
                transition: transform 0.3s ease, filter 0.3s ease;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                outline: none !important;
            }
            
            .iso-tile-room:hover,
            .iso-tile-room:focus,
            .iso-tile-room.current,
            .iso-tile-room.accessible {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                outline: none !important;
            }
            
            /* 던전 타일 이미지 */
            .iso-tile-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
                transition: filter 0.3s ease, transform 0.3s ease;
            }
            
            /* 방 타입별 색조 - 이미지 필터로 적용 */
            .iso-tile-room.type-monster .iso-tile-img { filter: sepia(0.2) hue-rotate(-10deg) saturate(1.2); }
            .iso-tile-room.type-elite .iso-tile-img { filter: sepia(0.3) hue-rotate(20deg) saturate(1.3) brightness(1.05); }
            .iso-tile-room.type-boss .iso-tile-img { filter: sepia(0.3) hue-rotate(-20deg) saturate(1.4) brightness(0.95); }
            .iso-tile-room.type-treasure .iso-tile-img { filter: sepia(0.15) hue-rotate(60deg) saturate(1.1); }
            .iso-tile-room.type-shop .iso-tile-img { filter: sepia(0.2) hue-rotate(180deg) saturate(0.9); }
            .iso-tile-room.type-event .iso-tile-img { filter: sepia(0.25) hue-rotate(240deg) saturate(1.1); }
            .iso-tile-room.type-start .iso-tile-img { filter: sepia(0.1) hue-rotate(80deg) saturate(1.1) brightness(1.1); }
            .iso-tile-room.type-camp .iso-tile-img { filter: sepia(0.3) hue-rotate(30deg) saturate(1.3) brightness(1.1); }
            .iso-tile-room.type-rest .iso-tile-img { filter: sepia(0.3) hue-rotate(30deg) saturate(1.2) brightness(1.05); }
            
            /* 오버레이 제거 */
            .iso-tile-overlay {
                display: none;
            }
            
            /* 컨텐츠 영역 (아이콘, 몬스터, 플레이어) - 타일 중앙에 배치 */
            .iso-tile-content {
                position: absolute;
                top: 25%;
                left: 50%;
                transform: translateX(-50%);
                width: 50%;
                height: 40%;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            }
            
            /* 방 타입 아이콘 */
            .iso-tile-icon {
                font-size: 2.5rem;
                filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.9));
                opacity: 0.8;
            }
            
            .iso-tile-room.visited .iso-tile-icon {
                opacity: 1;
            }
            
            /* 몬스터 래퍼 */
            .iso-tile-monster-wrapper {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }
            
            /* 몬스터 이미지 */
            .iso-tile-monster {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
                filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.95));
                opacity: 0.9;
            }
            
            .iso-tile-room.visited .iso-tile-monster {
                opacity: 1;
            }
            
            /* 몬스터 수 표시 */
            .iso-tile-monster-count {
                position: absolute;
                bottom: -8px;
                right: -12px;
                background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
                color: #fff;
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 10px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7), 0 0 10px rgba(239, 68, 68, 0.5);
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                z-index: 10;
                animation: countPulse 2s ease-in-out infinite;
            }
            
            @keyframes countPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            /* 난이도 표시 (거리 기반) */
            .iso-tile-difficulty {
                position: absolute;
                top: 8%;
                right: 8%;
                font-size: 0.75rem;
                color: #fbbf24;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
                z-index: 5;
            }
            
            /* 플레이어 히어로 - 타일 바닥 중앙에 배치 */
            .iso-tile-hero {
                position: absolute;
                bottom: 28%;
                left: 50%;
                transform: translateX(-50%);
                width: 48px;
                height: 48px;
                image-rendering: pixelated;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.9));
                z-index: 10;
                animation: heroFloat 2s ease-in-out infinite;
            }
            
            @keyframes heroFloat {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(-6px); }
            }
            
            /* 클리어 표시 - 타일 상단 */
            .iso-tile-cleared {
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.85rem;
                font-weight: bold;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.6);
                z-index: 5;
            }
            
            /* 구출 대상 */
            .iso-tile-captive {
                position: absolute;
                top: 8%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.5rem;
                filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.8));
                animation: captivePulse 1s ease-in-out infinite;
                z-index: 5;
            }
            
            @keyframes captivePulse {
                0%, 100% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.2); }
            }
            
            /* ===== 현재 위치 (가장 밝음) ===== */
            .iso-tile-room.current .iso-tile-img {
                filter: brightness(1.4) saturate(1.2) drop-shadow(0 0 25px rgba(212, 175, 55, 0.8)) drop-shadow(0 0 50px rgba(212, 175, 55, 0.4));
                animation: currentTileGlow 2s ease-in-out infinite;
            }
            
            .iso-tile-room.current .iso-tile-content {
                filter: brightness(1.1);
            }
            
            @keyframes currentTileGlow {
                0%, 100% { 
                    filter: brightness(1.4) saturate(1.2) drop-shadow(0 0 25px rgba(212, 175, 55, 0.8)) drop-shadow(0 0 50px rgba(212, 175, 55, 0.4));
                }
                50% { 
                    filter: brightness(1.5) saturate(1.25) drop-shadow(0 0 35px rgba(212, 175, 55, 1)) drop-shadow(0 0 60px rgba(212, 175, 55, 0.5));
                }
            }
            
            /* ===== 인접한 방 (중간 밝기) ===== */
            .iso-tile-room.accessible:not(.current) .iso-tile-img {
                filter: brightness(0.75) saturate(0.85);
            }
            
            .iso-tile-room.accessible:not(.current) .iso-tile-monster,
            .iso-tile-room.accessible:not(.current) .iso-tile-icon {
                filter: brightness(1.1) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.9));
                opacity: 0.9;
            }
            
            .iso-tile-room.accessible:not(.current):hover .iso-tile-img {
                filter: brightness(1) saturate(1) drop-shadow(0 0 15px rgba(212, 175, 55, 0.6));
            }
            
            .iso-tile-room.accessible:not(.current):hover .iso-tile-monster,
            .iso-tile-room.accessible:not(.current):hover .iso-tile-icon {
                filter: brightness(1.2) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.9));
                opacity: 1;
            }
            
            /* 호버 효과 */
            .iso-tile-room.accessible:not(.current):hover {
                transform: translateY(-8px) scale(1.02);
            }
            
            .iso-tile-room.accessible:not(.current):hover .iso-tile-img {
                filter: brightness(1.3) drop-shadow(0 0 20px rgba(212, 175, 55, 0.8));
            }
            
            /* 클리어된 방 */
            .iso-tile-room.cleared .iso-tile-img {
                filter: brightness(0.5) saturate(0.4) grayscale(0.3);
            }
            
            .iso-tile-room.cleared .iso-tile-content {
                opacity: 0.6;
            }
            
            /* ===== 비활성화 방 (가장 어두움) ===== */
            .iso-tile-room:not(.visited):not(.current):not(.accessible) .iso-tile-img {
                filter: brightness(0.25) saturate(0.1) grayscale(0.7);
            }
            
            .iso-tile-room:not(.visited):not(.current):not(.accessible) .iso-tile-content {
                opacity: 1;
            }
            
            .iso-tile-room:not(.visited):not(.current):not(.accessible) .iso-tile-icon {
                opacity: 0.7;
                filter: grayscale(1) brightness(0.7) drop-shadow(0 3px 8px rgba(0, 0, 0, 0.95));
            }
            
            .iso-tile-room:not(.visited):not(.current):not(.accessible) .iso-tile-monster {
                opacity: 0.65;
                filter: grayscale(1) brightness(0.65) drop-shadow(0 5px 10px rgba(0, 0, 0, 0.95));
            }
            
            /* 인접하지만 미방문인 방 (중간) */
            .iso-tile-room.accessible:not(.visited):not(.current) .iso-tile-icon {
                filter: grayscale(0.7) brightness(0.95) drop-shadow(0 3px 8px rgba(0, 0, 0, 0.9));
            }
            
            .iso-tile-room.accessible:not(.visited):not(.current) .iso-tile-monster {
                filter: grayscale(0.7) brightness(0.9) drop-shadow(0 5px 10px rgba(0, 0, 0, 0.9));
            }
            
            /* 구출 대상 있는 방 */
            .iso-tile-room.has-captive .iso-tile-img {
                filter: brightness(1) sepia(0.3) hue-rotate(80deg);
            }
            
            /* 보스방 특별 효과 */
            .iso-tile-room.type-boss.visited .iso-tile-img {
                animation: bossTilePulse 3s ease-in-out infinite;
            }
            
            @keyframes bossTilePulse {
                0%, 100% { filter: sepia(0.3) hue-rotate(-20deg) saturate(1.4) brightness(0.95); }
                50% { filter: sepia(0.3) hue-rotate(-20deg) saturate(1.6) brightness(1.1) drop-shadow(0 0 15px rgba(200, 50, 50, 0.5)); }
            }
            
            /* 아이소메트릭 타일 방 - 모든 기존 스타일 무시 */
            .iso-tile-room.ds-room,
            .iso-tile-room.ds-room.current,
            .iso-tile-room.ds-room.accessible,
            .iso-tile-room.ds-room.visited,
            .iso-tile-room.ds-room.cleared,
            .iso-tile-room.ds-room:hover {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                outline: none !important;
                border-radius: 0 !important;
            }
            
            /* 기존 방 스타일 (비-아이소메트릭용) */
            .ds-room:not(.iso-tile-room) {
                position: absolute;
                border: 1px solid #222;
                border-radius: 8px;
                background: #12121a;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .ds-room:not(.iso-tile-room).current {
                border-color: #d4af37;
                box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
            }
            
            .ds-room:not(.iso-tile-room).accessible:not(.current) {
                border-color: rgba(212, 175, 55, 0.6);
            }
            
            .ds-room:not(.iso-tile-room).accessible:not(.current):hover {
                transform: scale(1.03);
                box-shadow: 0 0 12px rgba(212, 175, 55, 0.5);
            }
            
            /* 구출 대상 */
            .ds-room.has-captive { border-color: #22c55e; }
            
            .ds-captive-marker {
                position: absolute;
                top: -8px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1rem;
            }
            
            /* 하단 힌트 */
            .ds-map-hint {
                text-align: center;
                padding: 8px;
                color: #333;
                font-size: 0.75rem;
            }
            
            /* 메시지 */
            .ds-map-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                padding: 15px 30px;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #d4af37;
                border-radius: 6px;
                color: #f5e6c4;
                font-size: 1rem;
                opacity: 0;
                transition: all 0.3s;
                z-index: 10000;
            }
            
            .ds-map-message.visible {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            /* 반응형 */
            @media (max-width: 768px) {
                .ds-map-header {
                    flex-direction: column;
                    gap: 8px;
                    padding: 10px;
                }
                
                .ds-player-stats {
                    gap: 15px;
                }
                
                .ds-dungeon-name {
                    font-size: 1.1rem;
                }
                
                .ds-menu-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 1rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 접근
window.MapUI = MapUI;

// DOMContentLoaded 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    MapUI.init();
});

console.log('[MapUI] 다크소울 테마 UI 시스템 로드 완료');
