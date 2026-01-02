// ==========================================
// 디버그 시스템
// ==========================================
const DebugSystem = {
    isOpen: false,
    containerDebugEnabled: false, // 컨테이너 디버그 모드
    containerDebugLevel: 'main', // 'main' | 'detail' | 'all'
    
    // 디버그 패널 열기
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        
        this.injectStyles();
        this.createPanel();
        this.refresh();
    },
    
    // 디버그 패널 닫기
    close() {
        this.isOpen = false;
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.classList.add('closing');
            setTimeout(() => panel.remove(), 300);
        }
    },
    
    // 패널 생성
    createPanel() {
        const existing = document.getElementById('debug-panel');
        if (existing) existing.remove();
        
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.innerHTML = `
            <div class="debug-header">
                <h2>🔧 디버그 패널</h2>
                <button class="debug-close" onclick="DebugSystem.close()">×</button>
            </div>
            
            <div class="debug-tabs">
                <button class="debug-tab active" data-tab="overview">개요</button>
                <button class="debug-tab" data-tab="deck">덱</button>
                <button class="debug-tab" data-tab="relics">유물</button>
                <button class="debug-tab" data-tab="storage">저장소</button>
                <button class="debug-tab" data-tab="tools">도구</button>
            </div>
            
            <div class="debug-content" id="debug-content">
                <!-- 동적으로 채워짐 -->
            </div>
            
            <div class="debug-footer">
                <button class="debug-btn refresh" onclick="DebugSystem.refresh()">🔄 새로고침</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 탭 이벤트
        panel.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                panel.querySelectorAll('.debug-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.showTab(tab.dataset.tab);
            });
        });
        
        // ESC 키로 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },
    
    // 탭 내용 표시
    showTab(tabName) {
        const content = document.getElementById('debug-content');
        if (!content) return;
        
        switch (tabName) {
            case 'overview':
                content.innerHTML = this.renderOverview();
                break;
            case 'deck':
                content.innerHTML = this.renderDeck();
                break;
            case 'relics':
                content.innerHTML = this.renderRelics();
                break;
            case 'storage':
                content.innerHTML = this.renderStorage();
                break;
            case 'tools':
                content.innerHTML = this.renderTools();
                break;
        }
    },
    
    refresh() {
        const activeTab = document.querySelector('.debug-tab.active');
        if (activeTab) {
            this.showTab(activeTab.dataset.tab);
        } else {
            this.showTab('overview');
        }
    },
    
    // ==========================================
    // 개요 탭
    // ==========================================
    renderOverview() {
        const gold = typeof GoldSystem !== 'undefined' ? GoldSystem.getGold() : 0;
        const dungeonGold = typeof GoldSystem !== 'undefined' ? GoldSystem.getDungeonGold() : 0;
        
        // 플레이어 정보
        let playerInfo = '없음';
        if (typeof gameState !== 'undefined' && gameState.player) {
            const p = gameState.player;
            playerInfo = `HP: ${p.hp}/${p.maxHp}, 방어: ${p.block || 0}`;
        }
        
        // 현재 직업
        let jobInfo = '미선택';
        const savedJob = localStorage.getItem('selectedJob');
        if (savedJob) {
            try {
                const job = JSON.parse(savedJob);
                jobInfo = job.name || job.id || savedJob;
            } catch {
                jobInfo = savedJob;
            }
        }
        
        // 덱 크기
        let deckSize = 0;
        if (typeof gameState !== 'undefined' && gameState.deck) {
            deckSize = gameState.deck.length;
        }
        
        // 유물 수
        let relicCount = 0;
        if (typeof RelicSystem !== 'undefined' && RelicSystem.playerRelics) {
            relicCount = RelicSystem.playerRelics.length;
        }
        
        // 맵 진행 상황
        let mapInfo = '없음';
        if (typeof MapSystem !== 'undefined') {
            mapInfo = `층: ${MapSystem.currentFloor || 1}, 클리어: ${MapSystem.roomsCleared || 0}`;
        }
        
        return `
            <div class="debug-section">
                <h3>💰 골드</h3>
                <div class="debug-grid">
                    <div class="debug-item">
                        <span class="debug-label">영구 골드</span>
                        <span class="debug-value gold">${gold.toLocaleString()}</span>
                    </div>
                    <div class="debug-item">
                        <span class="debug-label">던전 골드</span>
                        <span class="debug-value">${dungeonGold.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>👤 캐릭터</h3>
                <div class="debug-grid">
                    <div class="debug-item">
                        <span class="debug-label">직업</span>
                        <span class="debug-value">${jobInfo}</span>
                    </div>
                    <div class="debug-item">
                        <span class="debug-label">상태</span>
                        <span class="debug-value">${playerInfo}</span>
                    </div>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>📊 게임 상태</h3>
                <div class="debug-grid">
                    <div class="debug-item">
                        <span class="debug-label">덱 크기</span>
                        <span class="debug-value">${deckSize}장</span>
                    </div>
                    <div class="debug-item">
                        <span class="debug-label">유물 수</span>
                        <span class="debug-value">${relicCount}개</span>
                    </div>
                    <div class="debug-item">
                        <span class="debug-label">맵 진행</span>
                        <span class="debug-value">${mapInfo}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ==========================================
    // 덱 탭
    // ==========================================
    renderDeck() {
        let deckHtml = '<div class="debug-empty">덱 데이터 없음</div>';
        
        // 저장된 덱 확인
        const savedDeck = localStorage.getItem('playerDeck');
        let deck = [];
        
        if (savedDeck) {
            try {
                deck = JSON.parse(savedDeck);
            } catch (e) {
                console.error('[Debug] 덱 파싱 실패:', e);
            }
        }
        
        // gameState.deck도 확인
        if (typeof gameState !== 'undefined' && gameState.deck && gameState.deck.length > 0) {
            deck = gameState.deck;
        }
        
        if (deck.length > 0) {
            // 카드별 개수 집계
            const cardCounts = {};
            deck.forEach(card => {
                const key = card.id || card.name;
                if (!cardCounts[key]) {
                    cardCounts[key] = { card, count: 0 };
                }
                cardCounts[key].count++;
            });
            
            deckHtml = `
                <div class="debug-deck-info">총 ${deck.length}장</div>
                <div class="debug-card-list">
                    ${Object.values(cardCounts).map(({ card, count }) => `
                        <div class="debug-card-item ${card.type || ''}">
                            <span class="debug-card-cost">${card.cost ?? '?'}</span>
                            <span class="debug-card-name">${card.name}</span>
                            <span class="debug-card-count">x${count}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="debug-section">
                <h3>🃏 현재 덱</h3>
                ${deckHtml}
            </div>
        `;
    },
    
    // ==========================================
    // 유물 탭
    // ==========================================
    renderRelics() {
        let relicsHtml = '<div class="debug-empty">유물 없음</div>';
        
        if (typeof RelicSystem !== 'undefined' && RelicSystem.playerRelics && RelicSystem.playerRelics.length > 0) {
            relicsHtml = `
                <div class="debug-relic-list">
                    ${RelicSystem.playerRelics.map(relic => `
                        <div class="debug-relic-item">
                            <span class="debug-relic-icon">${relic.isImageIcon ? `<img src="${relic.icon}" alt="">` : relic.icon}</span>
                            <div class="debug-relic-info">
                                <div class="debug-relic-name">${relic.name_kr || relic.name}</div>
                                <div class="debug-relic-desc">${relic.description_kr || relic.description || ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="debug-section">
                <h3>💎 보유 유물</h3>
                ${relicsHtml}
            </div>
        `;
    },
    
    // ==========================================
    // 저장소 탭
    // ==========================================
    renderStorage() {
        const storageItems = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('lordofnight') || key === 'playerDeck' || key === 'selectedJob' || key === 'playerRelics') {
                let value = localStorage.getItem(key);
                let displayValue = value;
                
                // JSON 파싱 시도
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        displayValue = `[배열: ${parsed.length}개]`;
                    } else if (typeof parsed === 'object') {
                        displayValue = `{객체: ${Object.keys(parsed).length}키}`;
                    }
                } catch {
                    if (value && value.length > 50) {
                        displayValue = value.substring(0, 50) + '...';
                    }
                }
                
                storageItems.push({ key, displayValue, value });
            }
        }
        
        return `
            <div class="debug-section">
                <h3>💾 LocalStorage</h3>
                <div class="debug-storage-list">
                    ${storageItems.length > 0 ? storageItems.map(item => `
                        <div class="debug-storage-item">
                            <span class="debug-storage-key">${item.key}</span>
                            <span class="debug-storage-value">${item.displayValue}</span>
                            <button class="debug-btn-small" onclick="DebugSystem.deleteStorageItem('${item.key}')">🗑️</button>
                        </div>
                    `).join('') : '<div class="debug-empty">저장된 데이터 없음</div>'}
                </div>
            </div>
        `;
    },
    
    deleteStorageItem(key) {
        if (confirm(`"${key}" 데이터를 삭제하시겠습니까?`)) {
            localStorage.removeItem(key);
            this.refresh();
        }
    },
    
    // ==========================================
    // 도구 탭
    // ==========================================
    renderTools() {
        return `
            <div class="debug-section">
                <h3>🧠 메모리 시스템</h3>
                <div class="debug-info-row">
                    <span>메모리:</span>
                    <span id="debug-memory-amount" style="color: #a78bfa; font-weight: bold;">
                        ${typeof MemoryVisual !== 'undefined' ? MemoryVisual.memoryAmount : 0}
                    </span>
                    <span style="color: #666;">/ 레벨</span>
                    <span id="debug-memory-level" style="color: #c4b5fd; font-weight: bold;">
                        ${typeof MemoryVisual !== 'undefined' ? MemoryVisual.level : 0}
                    </span>
                </div>
                <div class="debug-tool-row">
                    <button class="debug-btn" onclick="DebugSystem.addMemory(1000)">+1000</button>
                    <button class="debug-btn" onclick="DebugSystem.addMemory(5000)">+5000</button>
                    <button class="debug-btn" onclick="DebugSystem.addMemory(10000)">+10000</button>
                </div>
                <div class="debug-tool-row">
                    <button class="debug-btn danger" onclick="DebugSystem.setMemoryAmount(0)">리셋</button>
                    <button class="debug-btn" onclick="DebugSystem.removeMemory(1000)">-1000</button>
                </div>
                <div class="debug-tool-row" style="align-items: center; margin-top: 5px;">
                    <span style="font-size: 0.8rem; color: #888;">레벨 직접 설정:</span>
                    <input type="range" min="0" max="10" value="${typeof MemoryVisual !== 'undefined' ? MemoryVisual.level : 0}" 
                        id="memory-level-slider" 
                        style="flex: 1; margin: 0 10px;"
                        oninput="DebugSystem.setMemoryLevel(this.value)">
                    <span id="memory-level-display" style="min-width: 20px; text-align: center; color: #a78bfa;">
                        ${typeof MemoryVisual !== 'undefined' ? MemoryVisual.level : 0}
                    </span>
                </div>
                <div class="debug-hint">1000 메모리 = 레벨 1 (최대 레벨 10)</div>
                <div class="debug-tool-row" style="margin-top: 8px;">
                    <button class="debug-btn" onclick="DebugSystem.revealAllIntents()">의도 전체 공개</button>
                    <button class="debug-btn" onclick="DebugSystem.hideAllIntents()">의도 감추기</button>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>🎮 이벤트 테스트</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn event" onclick="DebugSystem.testTarotEvent()">🎴 타로 이벤트</button>
                    <button class="debug-btn event" onclick="DebugSystem.testTreasure()">📦 보물상자</button>
                    <button class="debug-btn event" onclick="DebugSystem.testGachaEvent()">🎰 가챠</button>
                    <button class="debug-btn event" onclick="DebugSystem.testShop()">🏪 상점</button>
                    <button class="debug-btn event" onclick="DebugSystem.testCampEvent()">🏕️ 캠프</button>
                    <button class="debug-btn event" onclick="DebugSystem.testGamblerEvent()">👻 도박꾼</button>
                    <button class="debug-btn event" onclick="DebugSystem.testElfRescueEvent()">🧝 엘프 구출</button>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>💰 골드 조작</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn" onclick="DebugSystem.addGold(100)">+100 골드</button>
                    <button class="debug-btn" onclick="DebugSystem.addGold(1000)">+1000 골드</button>
                    <button class="debug-btn" onclick="DebugSystem.addGold(10000)">+10000 골드</button>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>🃏 카드 추가</h3>
                <div class="debug-card-list">
                    ${this.getCardButtons()}
                </div>
            </div>
            
            <div class="debug-section">
                <h3>💎 유물 추가</h3>
                <div class="debug-tool-row">
                    <select id="debug-relic-select" class="debug-select">
                        ${this.getRelicOptions()}
                    </select>
                    <button class="debug-btn" onclick="DebugSystem.addRelic()">추가</button>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>📚 튜토리얼</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn" onclick="if(typeof Tutorial !== 'undefined') { Tutorial.reset(); alert('튜토리얼 리셋됨!'); }">튜토리얼 리셋</button>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>👥 NPC 구출</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn npc ${this.isNpcRescued('blacksmith') ? 'rescued' : ''}" onclick="DebugSystem.rescueNpc('blacksmith')">
                        🔨 대장장이 ${this.isNpcRescued('blacksmith') ? '✅' : '🔒'}
                    </button>
                    <button class="debug-btn npc ${this.isNpcRescued('hoodgirl') ? 'rescued' : ''}" onclick="DebugSystem.rescueNpc('hoodgirl')">
                        👤 후드 소녀 ${this.isNpcRescued('hoodgirl') ? '✅' : '🔒'}
                    </button>
                </div>
                <div class="debug-tool-row">
                    <button class="debug-btn success" onclick="DebugSystem.rescueAllNpcs()">🔓 모두 구출</button>
                    <button class="debug-btn danger" onclick="DebugSystem.lockAllNpcs()">🔒 모두 잠금</button>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>🎰 직업 언락</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn npc ${this.isGamblerUnlocked() ? 'rescued' : ''}" onclick="DebugSystem.toggleGamblerUnlock()">
                        🎰 겜블러 ${this.isGamblerUnlocked() ? '✅' : '🔒'}
                    </button>
                </div>
            </div>
            
            <div class="debug-section">
                <h3>📦 컨테이너 디버그</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn ${this.containerDebugEnabled ? 'active' : ''}" onclick="DebugSystem.toggleContainerDebug()">
                        ${this.containerDebugEnabled ? '🟢 ON' : '⚪ OFF'}
                    </button>
                    <select class="debug-select" id="container-level-select" onchange="DebugSystem.changeContainerLevel(this.value)" ${!this.containerDebugEnabled ? 'disabled' : ''}>
                        <option value="main" ${this.containerDebugLevel === 'main' ? 'selected' : ''}>🔷 주요 컨테이너</option>
                        <option value="detail" ${this.containerDebugLevel === 'detail' ? 'selected' : ''}>🔶 상세 (카드 제외)</option>
                        <option value="all" ${this.containerDebugLevel === 'all' ? 'selected' : ''}>🔴 전체 (카드 포함)</option>
                    </select>
                </div>
                <div class="debug-hint">레벨: 주요=큰 영역만, 상세=세부 요소, 전체=카드 포함</div>
            </div>
            
            <div class="debug-section">
                <h3>🎯 3D 위치 디버그</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn ${typeof Background3D !== 'undefined' && Background3D.debugMarkers?.length > 0 ? 'active' : ''}" onclick="DebugSystem.toggle3DMarkers()">
                        ${typeof Background3D !== 'undefined' && Background3D.debugMarkers?.length > 0 ? '🟢 마커 ON' : '⚪ 마커 OFF'}
                    </button>
                    <button class="debug-btn" onclick="DebugSystem.debug3DPositions()">📊 좌표 출력</button>
                </div>
                <div class="debug-tool-row">
                    <span style="font-size: 0.8rem; color: #888;">플레이어 Y:</span>
                    <input type="range" min="-2" max="5" step="0.5" 
                        value="${typeof Background3D !== 'undefined' ? Background3D.worldPositions?.player?.y || 0 : 0}" 
                        id="player-y-slider" 
                        style="flex: 1; margin: 0 10px;"
                        oninput="DebugSystem.setPlayerY(this.value)">
                    <span id="player-y-display" style="min-width: 30px; text-align: center; color: #3498db;">
                        ${typeof Background3D !== 'undefined' ? Background3D.worldPositions?.player?.y || 0 : 0}
                    </span>
                </div>
                <div class="debug-tool-row">
                    <span style="font-size: 0.8rem; color: #888;">플레이어 Z:</span>
                    <input type="range" min="-2" max="12" step="0.5" 
                        value="${typeof Background3D !== 'undefined' ? Background3D.worldPositions?.player?.z || 0.5 : 0.5}" 
                        id="player-z-slider" 
                        style="flex: 1; margin: 0 10px;"
                        oninput="DebugSystem.setPlayerZ(this.value)">
                    <span id="player-z-display" style="min-width: 30px; text-align: center; color: #3498db;">
                        ${typeof Background3D !== 'undefined' ? Background3D.worldPositions?.player?.z || 0.5 : 0.5}
                    </span>
                </div>
                <div class="debug-tool-row">
                    <button class="debug-btn ${typeof Background3D !== 'undefined' && Background3D.autoZoom?.enabled ? 'active' : ''}" onclick="DebugSystem.toggleAutoZoom()">
                        🎥 자동줌 ${typeof Background3D !== 'undefined' && Background3D.autoZoom?.enabled ? 'ON' : 'OFF'}
                    </button>
                    <span style="font-size: 0.8rem; color: #888; margin-left: 10px;">수동 줌:</span>
                    <input type="range" min="0.5" max="2" step="0.1" value="1" 
                        id="camera-zoom-slider" 
                        style="flex: 1; margin: 0 10px;"
                        oninput="DebugSystem.setManualZoom(this.value)">
                </div>
                <div class="debug-hint">파란색=플레이어, 빨간색=적 | 자동줌: 적 수에 따라 카메라 거리 조절</div>
            </div>
            
            <div class="debug-section">
                <h3>💥 전투 동작 테스트</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn" onclick="DebugSystem.testPlayerDash()" style="background: linear-gradient(135deg, #3498db, #2980b9);">
                        🏃 플레이어 대시
                    </button>
                    <button class="debug-btn" onclick="DebugSystem.testAOEKnockback()" style="background: linear-gradient(135deg, #e74c3c, #c0392b);">
                        💣 AOE 넉백
                    </button>
                    <button class="debug-btn" onclick="DebugSystem.testResetPositions()">
                        ↩️ 원위치
                    </button>
                </div>
                <div class="debug-tool-row">
                    <span style="font-size: 0.8rem; color: #888;">넉백 강도:</span>
                    <input type="range" min="0.5" max="4" step="0.5" value="2" 
                        id="aoe-strength-slider" 
                        style="flex: 1; margin: 0 10px;"
                        oninput="document.getElementById('aoe-strength-display').textContent = this.value">
                    <span id="aoe-strength-display" style="min-width: 30px; text-align: center; color: #e74c3c;">2</span>
                </div>
                <div class="debug-tool-row">
                    <button class="debug-btn" onclick="DebugSystem.testSingleKnockback(0)" style="font-size: 0.75rem;">
                        적1 넉백
                    </button>
                    <button class="debug-btn" onclick="DebugSystem.testSingleKnockback(1)" style="font-size: 0.75rem;">
                        적2 넉백
                    </button>
                    <button class="debug-btn" onclick="DebugSystem.testSingleKnockback(2)" style="font-size: 0.75rem;">
                        적3 넉백
                    </button>
                </div>
                <div class="debug-hint">LOL 장판 스타일! 적 위치 실제 변위 테스트</div>
            </div>
            
            <div class="debug-section">
                <h3>⚠️ 위험 도구</h3>
                <div class="debug-tool-row">
                    <button class="debug-btn danger" onclick="DebugSystem.resetAllData()">전체 데이터 초기화</button>
                </div>
            </div>
        `;
    },
    
    // 이벤트 테스트 함수들
    testTarotEvent() {
        this.close();
        if (typeof TarotEvent !== 'undefined') {
            TarotEvent.open({ type: 'event', cleared: false });
        } else {
            alert('TarotEvent가 로드되지 않았습니다.');
        }
    },
    
    testCampEvent() {
        this.close();
        if (typeof CampEvent !== 'undefined') {
            CampEvent.start({ type: 'camp', cleared: false });
        } else {
            alert('CampEvent가 로드되지 않았습니다.');
        }
    },
    
    testGamblerEvent() {
        this.close();
        if (typeof GamblerEvent !== 'undefined') {
            GamblerEvent.start({ type: 'event', cleared: false });
        } else {
            alert('GamblerEvent가 로드되지 않았습니다.');
        }
    },
    
    testElfRescueEvent() {
        this.close();
        if (typeof ElfRescueEvent !== 'undefined') {
            ElfRescueEvent.start();
        } else {
            alert('ElfRescueEvent가 로드되지 않았습니다.');
        }
    },
    
    testGachaEvent() {
        this.close();
        if (typeof GachaEvent !== 'undefined') {
            GachaEvent.show();
        } else {
            alert('GachaEvent가 로드되지 않았습니다.');
        }
    },
    
    testTreasure() {
        this.close();
        if (typeof TreasureSystem !== 'undefined') {
            TreasureSystem.open({ type: 'treasure', cleared: false });
        } else {
            alert('TreasureSystem이 로드되지 않았습니다.');
        }
    },
    
    testShop() {
        this.close();
        if (typeof MapSystem !== 'undefined' && MapSystem.openShop) {
            MapSystem.openShop({ type: 'shop', cleared: false });
        } else {
            alert('상점 시스템이 로드되지 않았습니다.');
        }
    },
    
    // ==========================================
    // NPC 구출 시스템
    // ==========================================
    isNpcRescued(npcId) {
        const saved = localStorage.getItem('lordofnight_rescued');
        const rescued = saved ? JSON.parse(saved) : {};
        return rescued[npcId] || false;
    },
    
    rescueNpc(npcId) {
        const saved = localStorage.getItem('lordofnight_rescued');
        const rescued = saved ? JSON.parse(saved) : {};
        
        // 토글 (이미 구출됐으면 잠금, 아니면 구출)
        rescued[npcId] = !rescued[npcId];
        
        localStorage.setItem('lordofnight_rescued', JSON.stringify(rescued));
        
        const npcNames = {
            'blacksmith': '대장장이',
            'hoodgirl': '후드 소녀'
        };
        
        const action = rescued[npcId] ? '구출' : '잠금';
        console.log(`[Debug] ${npcNames[npcId] || npcId} ${action} 완료!`);
        
        // UI 새로고침
        this.refresh();
        
        // 마을 UI도 업데이트 (마을에 있으면)
        if (typeof TownSystem !== 'undefined' && typeof TownSystem.updateSingleNpcStatus === 'function') {
            TownSystem.updateSingleNpcStatus(npcId);
        }
    },
    
    rescueAllNpcs() {
        const rescued = {
            'blacksmith': true,
            'hoodgirl': true
        };
        
        localStorage.setItem('lordofnight_rescued', JSON.stringify(rescued));
        console.log('[Debug] 모든 NPC 구출 완료!');
        
        this.refresh();
        
        // 마을 UI도 업데이트
        if (typeof TownSystem !== 'undefined') {
            if (typeof TownSystem.updateSingleNpcStatus === 'function') {
                TownSystem.updateSingleNpcStatus('blacksmith');
                TownSystem.updateSingleNpcStatus('hoodgirl');
            }
        }
    },
    
    lockAllNpcs() {
        const rescued = {
            'blacksmith': false,
            'hoodgirl': false
        };
        
        localStorage.setItem('lordofnight_rescued', JSON.stringify(rescued));
        console.log('[Debug] 모든 NPC 잠금!');
        
        this.refresh();
        
        // 마을 UI도 업데이트
        if (typeof TownSystem !== 'undefined') {
            if (typeof TownSystem.updateSingleNpcStatus === 'function') {
                TownSystem.updateSingleNpcStatus('blacksmith');
                TownSystem.updateSingleNpcStatus('hoodgirl');
            }
        }
    },
    
    // 겜블러 언락 상태 확인
    isGamblerUnlocked() {
        return localStorage.getItem('lordofnight_gambler_unlocked') === 'true';
    },
    
    // 겜블러 언락 토글
    toggleGamblerUnlock() {
        const current = this.isGamblerUnlocked();
        const newState = !current;
        
        localStorage.setItem('lordofnight_gambler_unlocked', newState ? 'true' : 'false');
        
        // JobSystem 업데이트
        if (typeof JobSystem !== 'undefined' && JobSystem.jobs && JobSystem.jobs.gambler) {
            JobSystem.jobs.gambler.unlocked = newState;
        }
        
        console.log(`[Debug] 겜블러 ${newState ? '언락' : '잠금'}!`);
        this.refresh();
    },
    
    getCardOptions() {
        if (typeof cardDatabase === 'undefined') return '<option>카드 데이터 없음</option>';
        
        return Object.entries(cardDatabase)
            .map(([id, card]) => `<option value="${id}">${card.name} (${card.cost})</option>`)
            .join('');
    },
    
    getCardButtons() {
        let cards = [];
        
        // cardDatabase에서 카드 수집
        if (typeof cardDatabase !== 'undefined') {
            Object.entries(cardDatabase).forEach(([id, card]) => {
                if (card && card.name && typeof card.effect === 'function') {
                    cards.push({ id, ...card });
                }
            });
        }
        
        // GamblerCardList에서 추가
        if (typeof GamblerCardList !== 'undefined') {
            Object.entries(GamblerCardList).forEach(([id, card]) => {
                if (card && card.name && !cards.find(c => c.id === id)) {
                    cards.push({ id, ...card });
                }
            });
        }
        
        if (cards.length === 0) return '<div>카드 데이터 없음</div>';
        
        // 타입별로 그룹화
        const groups = {
            attack: { name: '⚔️ 공격', cards: [] },
            skill: { name: '🛡️ 스킬', cards: [] },
            power: { name: '💫 파워', cards: [] },
            other: { name: '📦 기타', cards: [] }
        };
        
        cards.forEach(card => {
            const type = card.type?.toLowerCase() || 'other';
            if (groups[type]) {
                groups[type].cards.push(card);
            } else {
                groups.other.cards.push(card);
            }
        });
        
        let html = '';
        Object.entries(groups).forEach(([type, group]) => {
            if (group.cards.length === 0) return;
            
            html += `<div class="debug-card-group">
                <div class="debug-card-group-title">${group.name}</div>
                <div class="debug-card-buttons">`;
            
            group.cards.forEach(card => {
                const icon = card.icon || '🃏';
                const typeClass = type === 'attack' ? 'attack' : type === 'skill' ? 'skill' : type === 'power' ? 'power' : '';
                html += `<button class="debug-card-btn ${typeClass}" onclick="DebugSystem.addCardById('${card.id}')" title="${card.description?.replace(/<[^>]*>/g, '') || ''}">${icon} ${card.name}</button>`;
            });
            
            html += `</div></div>`;
        });
        
        return html;
    },
    
    addCardById(cardId) {
        let card = null;
        
        // cardDatabase에서 찾기
        if (typeof cardDatabase !== 'undefined' && cardDatabase[cardId]) {
            card = { ...cardDatabase[cardId], id: cardId };
        }
        // GamblerCardList에서 찾기
        else if (typeof GamblerCardList !== 'undefined' && GamblerCardList[cardId]) {
            card = { ...GamblerCardList[cardId], id: cardId };
        }
        
        if (!card) {
            console.warn(`[Debug] 카드를 찾을 수 없음: ${cardId}`);
            return;
        }
        
        // gameState에 추가
        if (typeof gameState !== 'undefined') {
            if (!gameState.deck) gameState.deck = [];
            gameState.deck.push(card);
            if (gameState.drawPile) gameState.drawPile.push(card);
            if (gameState.fullDeck) gameState.fullDeck.push(card);
        }
        
        // localStorage에 ID 저장
        const savedDeck = localStorage.getItem('playerDeck');
        let deckIds = [];
        try {
            const parsed = JSON.parse(savedDeck);
            if (Array.isArray(parsed)) {
                deckIds = parsed.map(c => typeof c === 'string' ? c : c.id);
            }
        } catch {}
        deckIds.push(cardId);
        localStorage.setItem('playerDeck', JSON.stringify(deckIds));
        
        // 손패 갱신
        if (typeof renderHand === 'function') {
            renderHand();
        }
        
        console.log(`[Debug] 카드 추가: ${card.name}`);
    },
    
    getRelicOptions() {
        if (typeof relicDatabase === 'undefined') return '<option>유물 데이터 없음</option>';
        
        return Object.entries(relicDatabase)
            .map(([id, relic]) => `<option value="${id}">${relic.name_kr || relic.name}</option>`)
            .join('');
    },
    
    // ==========================================
    // 메모리 시스템 디버그
    // ==========================================
    setMemoryLevel(level) {
        const lv = parseInt(level);
        if (typeof MemoryVisual !== 'undefined') {
            // 레벨에 맞는 메모리량으로 설정
            MemoryVisual.setMemory(lv * MemoryVisual.memoryPerLevel);
        }
        
        this.updateMemoryDisplay();
        console.log(`[Debug] 메모리 레벨: ${lv}`);
    },
    
    addMemory(amount) {
        if (typeof MemoryVisual !== 'undefined') {
            MemoryVisual.addMemory(amount);
        }
        this.updateMemoryDisplay();
        this.refresh();
    },
    
    removeMemory(amount) {
        if (typeof MemoryVisual !== 'undefined') {
            MemoryVisual.removeMemory(amount);
        }
        this.updateMemoryDisplay();
        this.refresh();
    },
    
    setMemoryAmount(amount) {
        if (typeof MemoryVisual !== 'undefined') {
            MemoryVisual.setMemory(amount);
        }
        this.updateMemoryDisplay();
        this.refresh();
    },
    
    updateMemoryDisplay() {
        const amountEl = document.getElementById('debug-memory-amount');
        const levelEl = document.getElementById('debug-memory-level');
        const sliderEl = document.getElementById('memory-level-slider');
        const displayEl = document.getElementById('memory-level-display');
        
        if (typeof MemoryVisual !== 'undefined') {
            if (amountEl) amountEl.textContent = MemoryVisual.memoryAmount;
            if (levelEl) levelEl.textContent = MemoryVisual.level;
            if (sliderEl) sliderEl.value = MemoryVisual.level;
            if (displayEl) displayEl.textContent = MemoryVisual.level;
        }
    },
    
    revealAllIntents() {
        if (typeof MemoryIntent !== 'undefined') {
            MemoryIntent.revealAllIntents();
        }
    },
    
    hideAllIntents() {
        if (typeof MemoryIntent !== 'undefined') {
            MemoryIntent.hideAllIntents();
        }
    },
    
    addGold(amount) {
        // GoldSystem의 addGold 사용 (던전 상황에 맞게 자동 처리)
        if (typeof GoldSystem !== 'undefined') {
            GoldSystem.addGold(amount);
        }
        
        // TopBar 업데이트
        if (typeof TopBar !== 'undefined') {
            TopBar.updateGold();
        }
        
        this.refresh();
        console.log(`[Debug] 골드 +${amount} (총: ${GoldSystem?.getTotalGold()})`);
    },
    
    addCard() {
        const select = document.getElementById('debug-card-select');
        if (!select) return;
        
        const cardId = select.value;
        if (typeof cardDatabase !== 'undefined' && cardDatabase[cardId]) {
            const card = { ...cardDatabase[cardId] };
            
            // gameState.deck에 추가
            if (typeof gameState !== 'undefined') {
                if (!gameState.deck) gameState.deck = [];
                gameState.deck.push(card);
                if (gameState.fullDeck) gameState.fullDeck.push(card);
            }
            
            // localStorage에도 저장
            const savedDeck = localStorage.getItem('playerDeck');
            let deck = savedDeck ? JSON.parse(savedDeck) : [];
            deck.push(card);
            localStorage.setItem('playerDeck', JSON.stringify(deck));
            
            console.log(`[Debug] 카드 추가: ${card.name}`);
            this.refresh();
        }
    },
    
    // 겜블러 카드 고정 추가
    addGamblerCard(cardId) {
        let card = null;
        
        // GamblerCardList에서 먼저 찾기
        if (typeof GamblerCardList !== 'undefined' && GamblerCardList[cardId]) {
            card = { ...GamblerCardList[cardId] };
        }
        // cardDatabase에서 찾기
        else if (typeof cardDatabase !== 'undefined' && cardDatabase[cardId]) {
            card = { ...cardDatabase[cardId] };
        }
        
        if (!card) {
            console.warn(`[Debug] 겜블러 카드를 찾을 수 없음: ${cardId}`);
            return;
        }
        
        // gameState.deck에 추가
        if (typeof gameState !== 'undefined') {
            if (!gameState.deck) gameState.deck = [];
            gameState.deck.push(card);
            if (gameState.drawPile) gameState.drawPile.push(card);
            if (gameState.fullDeck) gameState.fullDeck.push(card);
        }
        
        // localStorage에 ID만 저장
        const savedDeck = localStorage.getItem('playerDeck');
        let deckIds = [];
        try {
            const parsed = JSON.parse(savedDeck);
            if (Array.isArray(parsed)) {
                deckIds = parsed.map(c => typeof c === 'string' ? c : c.id);
            }
        } catch {}
        deckIds.push(cardId);
        localStorage.setItem('playerDeck', JSON.stringify(deckIds));
        
        // 손패 갱신 (전투 중이면)
        if (typeof renderHand === 'function') {
            renderHand();
        }
        
        console.log(`[Debug] 겜블러 카드 추가: ${card.name}`);
        this.refresh();
    },
    
    addRelic() {
        const select = document.getElementById('debug-relic-select');
        if (!select) return;
        
        const relicId = select.value;
        if (typeof RelicSystem !== 'undefined' && typeof RelicSystem.addRelic === 'function') {
            RelicSystem.addRelic(relicId);
            console.log(`[Debug] 유물 추가: ${relicId}`);
            this.refresh();
        }
    },
    
    resetAllData() {
        if (confirm('⚠️ 모든 게임 데이터가 삭제됩니다!\n정말 초기화하시겠습니까?')) {
            // 관련 localStorage 항목 삭제
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('lordofnight') || key === 'playerDeck' || key === 'selectedJob' || key === 'playerRelics')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            console.log('[Debug] 전체 데이터 초기화 완료');
            alert('데이터가 초기화되었습니다.\n페이지를 새로고침합니다.');
            location.reload();
        }
    },
    
    // ==========================================
    // 3D 위치 디버그 시스템
    // ==========================================
    toggle3DMarkers() {
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            alert('Background3D가 초기화되지 않았습니다.');
            return;
        }
        
        Background3D.toggleDebugMarkers();
        this.refresh();
    },
    
    debug3DPositions() {
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            alert('Background3D가 초기화되지 않았습니다.');
            return;
        }
        
        Background3D.debugPositions();
    },
    
    setPlayerY(value) {
        const y = parseFloat(value);
        if (typeof Background3D !== 'undefined' && Background3D.worldPositions) {
            Background3D.worldPositions.player.y = y;
            Background3D.worldPositions.enemies.y = y;  // 적도 같은 높이로
            
            // 디스플레이 업데이트
            const display = document.getElementById('player-y-display');
            if (display) display.textContent = y;
            
            // 마커가 켜져있으면 업데이트
            if (Background3D.debugMarkers?.length > 0) {
                Background3D.showDebugMarkers();
            }
        }
    },
    
    setPlayerZ(value) {
        const z = parseFloat(value);
        if (typeof Background3D !== 'undefined' && Background3D.worldPositions) {
            Background3D.worldPositions.player.z = z;
            Background3D.worldPositions.enemies.z = z;  // 적도 같은 Z로
            
            // 디스플레이 업데이트
            const display = document.getElementById('player-z-display');
            if (display) display.textContent = z;
            
            // 마커가 켜져있으면 업데이트
            if (Background3D.debugMarkers?.length > 0) {
                Background3D.showDebugMarkers();
            }
        }
    },
    
    toggleAutoZoom() {
        if (typeof Background3D !== 'undefined' && Background3D.autoZoom) {
            Background3D.autoZoom.enabled = !Background3D.autoZoom.enabled;
            console.log(`[Debug] 자동 줌: ${Background3D.autoZoom.enabled ? 'ON' : 'OFF'}`);
            this.refresh();
        }
    },
    
    setManualZoom(value) {
        const zoom = parseFloat(value);
        if (typeof Background3D !== 'undefined') {
            Background3D.setZoom(zoom);
        }
    },
    
    // ==========================================
    // 전투 동작 테스트 시스템
    // ==========================================
    
    testPlayerDash() {
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            alert('Background3D가 초기화되지 않았습니다. 전투 중에 테스트하세요!');
            return;
        }
        
        // 가장 가까운 살아있는 적 찾기
        const enemies = gameState?.enemies || [];
        let targetIndex = -1;
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i] && enemies[i].hp > 0) {
                targetIndex = i;
                break;
            }
        }
        
        console.log(`[Debug] 🏃 플레이어 대시 테스트, 타겟: ${targetIndex}`);
        
        // 3D 대시!
        Background3D.dashPlayer(targetIndex, () => {
            console.log('[Debug] 대시 히트!');
            // 히트 시 이펙트
            if (typeof VFX !== 'undefined' && VFX.impact) {
                const targetPos = targetIndex >= 0 ? Background3D.getEnemyScreenPosition(targetIndex) : null;
                if (targetPos) {
                    VFX.impact(targetPos.screenX, targetPos.screenY, { color: '#3498db', size: 60 });
                }
            }
        });
    },
    
    testAOEKnockback() {
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            alert('Background3D가 초기화되지 않았습니다. 전투 중에 테스트하세요!');
            return;
        }
        
        // 강도 슬라이더에서 값 가져오기
        const strengthSlider = document.getElementById('aoe-strength-slider');
        const strength = strengthSlider ? parseFloat(strengthSlider.value) : 2;
        
        // 플레이어 위치 기준으로 AOE 넉백
        const playerPos = Background3D.worldPositions.player;
        const centerX = playerPos.x + 6;  // 플레이어 오른쪽 (적들 사이)
        const centerZ = playerPos.z;
        
        // AOE 넉백 실행!
        Background3D.aoeKnockback(centerX, centerZ, strength, 15);
        
        // 이펙트 (있으면)
        if (typeof VFX !== 'undefined' && VFX.explosion) {
            const screenPos = Background3D.project3DToScreen(centerX, 0, centerZ);
            if (screenPos) {
                VFX.explosion(screenPos.screenX, screenPos.screenY, { 
                    color: '#ff4444', 
                    count: 30 
                });
            }
        }
        
        console.log(`[Debug] 💣 AOE 넉백 테스트: 중심(${centerX.toFixed(1)}, ${centerZ.toFixed(1)}), 강도: ${strength}`);
    },
    
    testPushAll() {
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            alert('Background3D가 초기화되지 않았습니다. 전투 중에 테스트하세요!');
            return;
        }
        
        const enemyCount = gameState?.enemies?.length || 0;
        
        for (let i = 0; i < enemyCount; i++) {
            const enemy = gameState.enemies[i];
            if (!enemy || enemy.hp <= 0) continue;
            
            const pos = Background3D.getEnemyWorldPosition(i);
            if (!pos) continue;
            
            // 뒤로 밀어내기
            Background3D.pushEnemyTo(i, pos.x, pos.z - 3, 0.4);
        }
        
        // 1.5초 후 원위치
        setTimeout(() => {
            Background3D.resetAllEnemyPositions(0.6);
        }, 1500);
        
        console.log('[Debug] 🌊 모든 적 밀어내기 테스트');
    },
    
    testResetPositions() {
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            alert('Background3D가 초기화되지 않았습니다.');
            return;
        }
        
        Background3D.resetAllPositions(0.5);
        console.log('[Debug] ↩️ 모든 캐릭터 원위치로 복귀');
    },
    
    testSingleKnockback(index) {
        if (typeof Background3D === 'undefined' || !Background3D.isInitialized) {
            alert('Background3D가 초기화되지 않았습니다. 전투 중에 테스트하세요!');
            return;
        }
        
        const enemy = gameState?.enemies?.[index];
        if (!enemy || enemy.hp <= 0) {
            alert(`적 ${index + 1}이(가) 없거나 사망했습니다.`);
            return;
        }
        
        // 강도 슬라이더에서 값 가져오기
        const strengthSlider = document.getElementById('aoe-strength-slider');
        const damage = strengthSlider ? parseFloat(strengthSlider.value) * 10 : 20;
        
        Background3D.knockbackEnemy(index, damage);
        
        console.log(`[Debug] 적 ${index + 1} 흔들림: 강도=${damage}`);
    },
    
    // ==========================================
    // 컨테이너 디버그 시스템
    // ==========================================
    toggleContainerDebug() {
        this.containerDebugEnabled = !this.containerDebugEnabled;
        
        if (this.containerDebugEnabled) {
            this.enableContainerDebug();
        } else {
            this.disableContainerDebug();
        }
        
        // UI 새로고침
        this.refresh();
    },
    
    changeContainerLevel(level) {
        this.containerDebugLevel = level;
        if (this.containerDebugEnabled) {
            this.disableContainerDebug();
            this.enableContainerDebug();
        }
        console.log(`[Debug] 컨테이너 레벨 변경: ${level}`);
    },
    
    enableContainerDebug() {
        console.log(`[Debug] 컨테이너 디버그 모드 활성화 (레벨: ${this.containerDebugLevel})`);
        
        // 디버그 스타일 주입
        this.injectContainerDebugStyles();
        
        // 모든 주요 컨테이너에 디버그 표시 추가
        const containers = this.getDebugContainers();
        
        containers.forEach(({ selector, name, color, pos }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el, idx) => {
                if (!el) return;
                
                // 기존 디버그 오버레이가 있으면 스킵
                if (el.querySelector('.debug-container-overlay')) return;
                
                // 컨테이너에 디버그 클래스 추가
                el.classList.add('debug-container-highlight');
                el.style.setProperty('--debug-color', color);
                
                // 위치 클래스 결정
                const posClass = `debug-pos-${pos || 'top-left'}`;
                
                // 이름 라벨 추가
                const label = document.createElement('div');
                label.className = `debug-container-overlay ${posClass}`;
                
                // 인덱스 표시 (여러 개일 때만)
                const indexText = elements.length > 1 ? `[${idx}]` : '';
                
                label.innerHTML = `
                    <span class="debug-container-name" style="background: ${color};">
                        ${name}${indexText}
                    </span>
                `;
                el.appendChild(label);
            });
        });
        
        // body에 디버그 모드 클래스 추가
        document.body.classList.add('container-debug-mode');
    },
    
    disableContainerDebug() {
        console.log('[Debug] 컨테이너 디버그 모드 비활성화');
        
        // 모든 디버그 오버레이 제거
        document.querySelectorAll('.debug-container-overlay').forEach(el => el.remove());
        
        // 디버그 클래스 제거
        document.querySelectorAll('.debug-container-highlight').forEach(el => {
            el.classList.remove('debug-container-highlight');
            el.style.removeProperty('--debug-color');
        });
        
        // body 클래스 제거
        document.body.classList.remove('container-debug-mode');
    },
    
    // 디버그할 컨테이너 목록 (레벨별 분리)
    getDebugContainers() {
        const level = this.containerDebugLevel;
        
        // 🔷 주요 컨테이너 (항상 표시)
        const mainContainers = [
            { selector: '.game-container', name: 'GAME', color: '#ef4444', pos: 'top-left' },
            { selector: '#title-screen', name: 'TITLE', color: '#f59e0b', pos: 'top-left' },
            { selector: '#map-screen', name: 'MAP', color: '#10b981', pos: 'top-left' },
            { selector: '.battle-arena', name: 'ARENA', color: '#3b82f6', pos: 'top-center' },
            { selector: '.player-side', name: 'PLAYER-SIDE', color: '#22c55e', pos: 'top-left' },
            { selector: '.enemy-area', name: 'ENEMY-AREA', color: '#ec4899', pos: 'top-right' },
            { selector: '.bottom-area', name: 'BOTTOM', color: '#0891b2', pos: 'bottom-center' },
            { selector: '.hand-area', name: 'HAND', color: '#06b6d4', pos: 'top-center' },
            { selector: '.top-bar', name: 'TOPBAR', color: '#a855f7', pos: 'top-left' },
            { selector: '.town-container', name: 'TOWN', color: '#ca8a04', pos: 'top-left' },
            { selector: '.ds-map-screen', name: 'MAP-UI', color: '#0d9488', pos: 'top-left' },
        ];
        
        if (level === 'main') return mainContainers;
        
        // 🔶 상세 컨테이너 (카드 제외)
        const detailContainers = [
            // 플레이어/적
            { selector: '#player', name: 'player', color: '#22c55e', pos: 'bottom-left' },
            { selector: '.enemy-unit', name: 'enemy', color: '#ef4444', pos: 'bottom-right' },
            { selector: '.enemies-container', name: 'enemies', color: '#f43f5e', pos: 'top-right' },
            
            // 덱 딜링
            { selector: '#energy-container', name: 'energy', color: '#fbbf24', pos: 'center' },
            { selector: '.draw-pile', name: 'draw', color: '#22d3ee', pos: 'bottom-center' },
            { selector: '.discard-pile', name: 'discard', color: '#f472b6', pos: 'bottom-center' },
            { selector: '#end-turn-btn', name: 'END', color: '#f97316', pos: 'center' },
            { selector: '.hand', name: 'hand', color: '#0ea5e9', pos: 'bottom-center' },
            
            // UI 패널
            { selector: '.battle-log', name: 'log', color: '#d946ef', pos: 'top-right' },
            { selector: '.relic-container', name: 'relics', color: '#f97316', pos: 'top-left' },
            
            // 모달
            { selector: '.modal', name: 'modal', color: '#fcd34d', pos: 'top-center' },
            { selector: '.event-modal', name: 'event', color: '#fbbf24', pos: 'top-center' },
        ];
        
        if (level === 'detail') return [...mainContainers, ...detailContainers];
        
        // 🔴 전체 (카드 포함)
        const allContainers = [
            { selector: '.card', name: 'card', color: '#6366f1', pos: 'top-left' },
        ];
        
        return [...mainContainers, ...detailContainers, ...allContainers];
    },
    
    // 컨테이너 디버그 스타일 주입
    injectContainerDebugStyles() {
        if (document.getElementById('container-debug-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'container-debug-styles';
        style.textContent = `
            .container-debug-mode .debug-container-highlight {
                outline: 2px dashed var(--debug-color, #ef4444) !important;
                outline-offset: -2px;
                position: relative;
            }
            
            .debug-container-overlay {
                position: absolute;
                z-index: 99999;
                pointer-events: none;
            }
            
            .debug-pos-top-left { top: 0; left: 0; }
            .debug-pos-top-center { top: 0; left: 50%; transform: translateX(-50%); }
            .debug-pos-top-right { top: 0; right: 0; }
            .debug-pos-center { top: 50%; left: 50%; transform: translate(-50%, -50%); }
            .debug-pos-bottom-left { bottom: 0; left: 0; }
            .debug-pos-bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); }
            .debug-pos-bottom-right { bottom: 0; right: 0; }
            
            .debug-container-name {
                display: inline-block;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: bold;
                color: white;
                border-radius: 2px;
                font-family: monospace;
                text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('debug-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'debug-styles';
        style.textContent = `
            #debug-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 600px;
                max-width: 90vw;
                max-height: 80vh;
                background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
                border: 2px solid #d4af37;
                border-radius: 12px;
                z-index: 100000;
                display: flex;
                flex-direction: column;
                animation: debugAppear 0.3s ease-out;
                box-shadow: 0 0 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.3);
                font-family: 'Noto Sans KR', sans-serif;
            }
            
            #debug-panel.closing {
                animation: debugClose 0.3s ease-out forwards;
            }
            
            @keyframes debugAppear {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes debugClose {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
            
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #333;
                background: rgba(212, 175, 55, 0.1);
            }
            
            .debug-header h2 {
                margin: 0;
                color: #d4af37;
                font-size: 1.2rem;
                font-family: 'Cinzel', serif;
            }
            
            .debug-close {
                background: none;
                border: none;
                color: #888;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 5px 10px;
                transition: color 0.2s;
            }
            
            .debug-close:hover {
                color: #ff6b6b;
            }
            
            .debug-tabs {
                display: flex;
                gap: 5px;
                padding: 10px;
                border-bottom: 1px solid #333;
                background: rgba(0, 0, 0, 0.3);
            }
            
            .debug-tab {
                flex: 1;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid #444;
                border-radius: 6px;
                color: #888;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .debug-tab:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ccc;
            }
            
            .debug-tab.active {
                background: rgba(212, 175, 55, 0.2);
                border-color: #d4af37;
                color: #d4af37;
            }
            
            .debug-content {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }
            
            .debug-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .debug-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }
            
            .debug-content::-webkit-scrollbar-thumb {
                background: #444;
                border-radius: 4px;
            }
            
            .debug-section {
                margin-bottom: 20px;
            }
            
            .debug-section h3 {
                color: #d4af37;
                font-size: 1rem;
                margin: 0 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid #333;
            }
            
            .debug-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .debug-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
            }
            
            .debug-label {
                color: #888;
                font-size: 0.85rem;
            }
            
            .debug-value {
                color: #f5e6c4;
                font-weight: bold;
            }
            
            .debug-value.gold {
                color: #ffd700;
            }
            
            .debug-empty {
                text-align: center;
                color: #666;
                padding: 20px;
                font-style: italic;
            }
            
            /* 덱 카드 리스트 */
            .debug-deck-info {
                color: #888;
                margin-bottom: 10px;
                font-size: 0.9rem;
            }
            
            .debug-card-list {
                display: flex;
                flex-direction: column;
                gap: 5px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .debug-card-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 6px 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                border-left: 3px solid #666;
            }
            
            .debug-card-item.attack {
                border-left-color: #ff6b6b;
            }
            
            .debug-card-item.skill {
                border-left-color: #4dabf7;
            }
            
            .debug-card-cost {
                width: 24px;
                height: 24px;
                background: #333;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffd700;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .debug-card-name {
                flex: 1;
                color: #f5e6c4;
                font-size: 0.9rem;
            }
            
            .debug-card-count {
                color: #888;
                font-size: 0.8rem;
            }
            
            /* 유물 리스트 */
            .debug-relic-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .debug-relic-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
            }
            
            .debug-relic-icon {
                font-size: 2rem;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(212, 175, 55, 0.2);
                border-radius: 8px;
            }
            
            .debug-relic-icon img {
                width: 40px;
                height: 40px;
                object-fit: contain;
            }
            
            .debug-relic-info {
                flex: 1;
            }
            
            .debug-relic-name {
                color: #d4af37;
                font-weight: bold;
                margin-bottom: 3px;
            }
            
            .debug-relic-desc {
                color: #888;
                font-size: 0.8rem;
            }
            
            /* 저장소 */
            .debug-storage-list {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .debug-storage-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .debug-storage-key {
                color: #4dabf7;
                font-family: monospace;
                font-size: 0.85rem;
                flex: 1;
            }
            
            .debug-storage-value {
                color: #888;
                font-size: 0.8rem;
                max-width: 150px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            /* 도구 */
            .debug-tool-row {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .debug-btn {
                padding: 8px 16px;
                background: rgba(212, 175, 55, 0.2);
                border: 1px solid #d4af37;
                border-radius: 6px;
                color: #d4af37;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.9rem;
            }
            
            .debug-btn:hover {
                background: rgba(212, 175, 55, 0.4);
            }
            
            .debug-btn.danger {
                background: rgba(255, 107, 107, 0.2);
                border-color: #ff6b6b;
                color: #ff6b6b;
            }
            
            .debug-btn.danger:hover {
                background: rgba(255, 107, 107, 0.4);
            }
            
            .debug-btn.success {
                background: rgba(34, 197, 94, 0.2);
                border-color: #22c55e;
                color: #86efac;
            }
            
            .debug-btn.success:hover {
                background: rgba(34, 197, 94, 0.4);
            }
            
            .debug-btn.npc {
                background: rgba(59, 130, 246, 0.2);
                border-color: #3b82f6;
                color: #93c5fd;
            }
            
            .debug-btn.npc:hover {
                background: rgba(59, 130, 246, 0.4);
            }
            
            .debug-btn.npc.rescued {
                background: rgba(34, 197, 94, 0.2);
                border-color: #22c55e;
                color: #86efac;
            }
            
            .debug-btn.event {
                background: rgba(139, 92, 246, 0.2);
                border-color: #8b5cf6;
                color: #c4b5fd;
            }
            
            .debug-btn.event:hover {
                background: rgba(139, 92, 246, 0.4);
                color: #f5f5f5;
            }
            
            .debug-card-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .debug-card-group {
                margin-bottom: 12px;
            }
            
            .debug-card-group-title {
                font-size: 0.85rem;
                font-weight: bold;
                color: #94a3b8;
                margin-bottom: 6px;
                padding-bottom: 4px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .debug-card-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }
            
            .debug-card-btn {
                padding: 4px 8px;
                font-size: 0.7rem;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 4px;
                background: rgba(255,255,255,0.05);
                color: #e2e8f0;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            
            .debug-card-btn:hover {
                background: rgba(255,255,255,0.15);
                transform: translateY(-1px);
            }
            
            .debug-card-btn.attack {
                border-color: rgba(239, 68, 68, 0.5);
                color: #fca5a5;
            }
            .debug-card-btn.attack:hover {
                background: rgba(239, 68, 68, 0.3);
            }
            
            .debug-card-btn.skill {
                border-color: rgba(59, 130, 246, 0.5);
                color: #93c5fd;
            }
            .debug-card-btn.skill:hover {
                background: rgba(59, 130, 246, 0.3);
            }
            
            .debug-card-btn.power {
                border-color: rgba(168, 85, 247, 0.5);
                color: #d8b4fe;
            }
            .debug-card-btn.power:hover {
                background: rgba(168, 85, 247, 0.3);
            }
            
            .debug-btn-small {
                padding: 4px 8px;
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                font-size: 0.8rem;
            }
            
            .debug-btn-small:hover {
                color: #ff6b6b;
            }
            
            .debug-select {
                flex: 1;
                padding: 8px 12px;
                background: #1a1a2e;
                border: 1px solid #444;
                border-radius: 6px;
                color: #f5e6c4;
                font-size: 0.9rem;
            }
            
            .debug-footer {
                padding: 10px;
                border-top: 1px solid #333;
                display: flex;
                justify-content: flex-end;
            }
            
            .debug-footer .debug-btn.refresh {
                background: rgba(255, 255, 255, 0.1);
                border-color: #666;
                color: #888;
            }
            
            .debug-footer .debug-btn.refresh:hover {
                background: rgba(255, 255, 255, 0.2);
                color: #ccc;
            }
            
            /* 타이틀 디버그 버튼 */
            .title-debug-btn {
                position: absolute;
                bottom: 20px;
                right: 20px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #666;
                border-radius: 6px;
                color: #888;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
                z-index: 100;
            }
            
            .title-debug-btn:hover {
                background: rgba(212, 175, 55, 0.2);
                border-color: #d4af37;
                color: #d4af37;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 타이틀에 디버그 버튼 추가
    addTitleButton() {
        const titleScreen = document.getElementById('title-screen');
        if (!titleScreen) return;
        
        // 이미 있으면 스킵
        if (titleScreen.querySelector('.title-debug-btn')) return;
        
        const btn = document.createElement('button');
        btn.className = 'title-debug-btn';
        btn.innerHTML = '🔧 Debug';
        btn.onclick = () => DebugSystem.open();
        
        titleScreen.appendChild(btn);
    }
};

// 타이틀 화면 로드 시 버튼 추가
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => DebugSystem.addTitleButton(), 500);
});

// 전역 단축키 (Ctrl + D)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (DebugSystem.isOpen) {
            DebugSystem.close();
        } else {
            DebugSystem.open();
        }
    }
});

