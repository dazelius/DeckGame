// ==========================================
// Shadow Deck - 직업(잡체인지) 시스템
// ==========================================

const JobSystem = {
    // 현재 직업
    currentJob: 'warrior',
    
    // ==========================================
    // 직업 데이터베이스
    // ==========================================
    jobs: {
        // 전사 (기본 직업)
        warrior: {
            id: 'warrior',
            name: '전사',
            nameEn: 'Warrior',
            icon: '⚔️',
            color: '#ef4444',
            description: '균형 잡힌 공격과 방어. 브레이브로 에너지를 당겨씀.',
            lore: '검과 방패로 전장을 누비는 용맹한 전사. 브레이브 시스템으로 다음 턴 에너지를 미리 사용할 수 있다.',
            sprite: 'hero.png',           // 기본 스프라이트
            spriteScale: 1.0,             // 기본 스프라이트 스케일
            slashSprite: 'hero_slash.png', // 공격 이펙트 스프라이트
            slashSpriteScale: 1.3,        // 공격 스프라이트 스케일
            stats: {
                maxHp: 80,
                energy: 3,
                drawCount: 5
            },
            starterDeck: {
                attacks: {
                    strike: 4,
                    bash: 1,
                    battleOpening: 1,
                    shieldBash: 1
                },
                skills: {
                    defend: 4,
                    braveCry: 2
                }
            },
            starterRelics: [],
            unlocked: true,
            specialSystem: 'brave'
        },
        
        // 도적
        rogue: {
            id: 'rogue',
            name: '도적',
            nameEn: 'Rogue',
            icon: '🗡️',
            color: '#22c55e',
            description: '빠른 연속 공격과 독 특화. 낮은 체력.',
            lore: '그림자 속에서 움직이며 치명적인 일격을 가하는 암살자. 속도가 생명.',
            sprite: 'hero_rogue.png',
            spriteScale: 1.0,
            slashSprite: 'hero_rogue_slash.png',
            slashSpriteScale: 1.3,
            attackSound: 'knife_swish',         // 도적 공격 사운드
            stats: {
                maxHp: 60,
                energy: 3,
                drawCount: 6
            },
            starterDeck: {
                attacks: {
                    strike: 3,
                    flurry: 2,
                    dirtyStrike: 2,
                    battleOpening: 1
                },
                skills: {
                    defend: 3,
                    dodge: 2,
                    dagger: 1
                }
            },
            starterRelics: ['relentlessAttack'],
            unlocked: true,
            specialSystem: 'stealth'
        },
        
        // 마법사
        mage: {
            id: 'mage',
            name: '마법사',
            nameEn: 'Mage',
            icon: '🔮',
            color: '#8b5cf6',
            description: '영창을 축적하여 대마법 발동. 체력이 낮음.',
            lore: '고대의 주문을 다루는 신비로운 마법사. 마력을 모아 파괴적인 대마법을 시전한다.',
            sprite: 'hero_mage.png',
            spriteScale: 1.0,
            slashSprite: 'hero_mage_slash.png',
            slashSpriteScale: 1.5,        // 마법진 이펙트가 작아서 확대
            stats: {
                maxHp: 50,
                energy: 3,  // 4 → 3 너프 (시작 유물로 +1 = 4)
                drawCount: 5
            },
            starterDeck: {
                attacks: {
                    arcaneBolt: 3,
                    etherArrow: 1
                },
                skills: {
                    energyBolt: 2,
                    manaFocus: 2,
                    meditation: 2,
                    magicBarrier: 2,
                    timeWarp: 1
                }
            },
            starterRelics: ['energyCrystal'],
            unlocked: true,
            // 마법사 전용 시스템
            specialSystem: 'incantation'
        },
        
        // 기사
        knight: {
            id: 'knight',
            name: '기사',
            nameEn: 'Knight',
            icon: '🛡️',
            color: '#3b82f6',
            description: '높은 체력과 방어력. 공격이 약함.',
            lore: '철갑으로 무장한 수호자. 아군을 지키는 것이 사명.',
            sprite: 'hero.png',           // TODO: knight.png 로 교체
            spriteScale: 1.0,
            slashSprite: 'hero_slash.png',
            slashSpriteScale: 1.3,
            stats: {
                maxHp: 100,
                energy: 3,
                drawCount: 4
            },
            starterDeck: {
                attacks: {
                    strike: 3,
                    bash: 2
                },
                skills: {
                    defend: 6,
                    shrugItOff: 2
                }
            },
            starterRelics: [],
            unlocked: true,
            specialSystem: 'block'
        },
        
        // 광전사
        berserker: {
            id: 'berserker',
            name: '광전사',
            nameEn: 'Berserker',
            icon: '🪓',
            color: '#f97316',
            description: '높은 공격력. 방어가 약하고 자해 효과.',
            lore: '분노로 이성을 잃은 전사. 적과 함께 자신도 파괴한다.',
            sprite: 'hero.png',           // TODO: berserker.png 로 교체
            spriteScale: 1.0,
            slashSprite: 'hero_slash.png',
            slashSpriteScale: 1.3,
            stats: {
                maxHp: 70,
                energy: 3,
                drawCount: 5
            },
            starterDeck: {
                attacks: {
                    strike: 4,
                    bash: 2,
                    heavyBlow: 2,
                    finisher: 1,
                    battleOpening: 1
                },
                skills: {
                    defend: 3
                }
            },
            starterRelics: ['deepWound'],
            unlocked: false,  // 잠금
            unlockCondition: '던전 1회 클리어',
            specialSystem: 'rage'
        },
        
        // 성기사
        paladin: {
            id: 'paladin',
            name: '성기사',
            nameEn: 'Paladin',
            icon: '✨',
            color: '#eab308',
            description: '균형 잡힌 능력치와 회복 특화.',
            lore: '신성한 힘을 부여받은 기사. 빛으로 적을 정화한다.',
            sprite: 'hero.png',           // TODO: paladin.png 로 교체
            spriteScale: 1.0,
            slashSprite: 'hero_slash.png',
            slashSpriteScale: 1.3,
            stats: {
                maxHp: 85,
                energy: 3,
                drawCount: 5
            },
            starterDeck: {
                attacks: {
                    strike: 4,
                    bash: 1,
                    battleOpening: 1
                },
                skills: {
                    defend: 4,
                    secondWind: 2,
                    lifeDrain: 1
                }
            },
            starterRelics: ['phoenixFeather'],
            unlocked: false,
            unlockCondition: '보스 처치'
        },
        
        // 닌자
        ninja: {
            id: 'ninja',
            name: '닌자',
            nameEn: 'Ninja',
            icon: '🌀',
            color: '#6366f1',
            description: '차크람과 투척 무기 특화.',
            lore: '바람처럼 빠르게 움직이는 그림자의 전사.',
            sprite: 'hero_ninja.png',
            spriteScale: 1.0,
            slashSprite: 'hero_ninja_slash.png',
            slashSpriteScale: 1.25,       // 닌자 슬래시 스프라이트 스케일
            stats: {
                maxHp: 55,
                energy: 3,
                drawCount: 6
            },
            starterDeck: {
                attacks: {
                    shadowSlash: 3,
                    shurikenBarrage: 2,
                    shadowExplosion: 1
                },
                skills: {
                    shadowClone: 2,
                    smokeBomb: 2,
                    infiltrate: 1,
                    defend: 2
                }
            },
            starterRelics: [],
            unlocked: true,
            unlockCondition: '도적으로 던전 클리어'
        }
    },
    
    // ==========================================
    // 직업 관리
    // ==========================================
    
    // 현재 직업 가져오기
    getCurrentJob() {
        return this.jobs[this.currentJob] || this.jobs.warrior;
    },
    
    // 직업 변경
    changeJob(jobId) {
        const job = this.jobs[jobId];
        if (!job) {
            console.error(`[Job] 존재하지 않는 직업: ${jobId}`);
            return false;
        }
        
        if (!job.unlocked) {
            console.warn(`[Job] 잠긴 직업: ${jobId}`);
            return false;
        }
        
        this.currentJob = jobId;
        this.saveToStorage();
        
        // 스탯 적용
        this.applyJobStats();
        
        // 덱 적용
        this.applyJobDeck();
        
        // 유물 적용
        this.applyJobRelics();
        
        // 스프라이트 적용
        this.applyJobSprite();
        
        console.log(`[Job] 직업 변경 완료: ${job.name}`);
        return true;
    },
    
    // 직업 스프라이트 적용
    applyJobSprite() {
        const job = this.getCurrentJob();
        const sprite = job.sprite || 'hero.png';
        const slashSprite = job.slashSprite || 'hero_slash.png';
        const spriteScale = job.spriteScale || 1.0;
        const slashScale = job.slashSpriteScale || 1.0;
        
        // localStorage에 저장 (게임 로드 시 사용)
        localStorage.setItem('lordofnight_player_sprite', sprite);
        localStorage.setItem('lordofnight_slash_sprite', slashSprite);
        localStorage.setItem('lordofnight_sprite_scale', spriteScale.toString());
        localStorage.setItem('lordofnight_slash_scale', slashScale.toString());
        
        // 현재 화면의 플레이어 스프라이트 업데이트
        const playerSpriteEl = document.getElementById('player-sprite');
        if (playerSpriteEl) {
            playerSpriteEl.src = sprite;
            // 기본 스프라이트 스케일 적용
            this.applyPlayerSpriteScale(false);
            console.log(`[Job] 플레이어 스프라이트 변경: ${sprite} (스케일: ${spriteScale})`);
        }
        
        // 맵의 히어로 이미지도 업데이트
        const mapHeroImgs = document.querySelectorAll('.room-hero');
        mapHeroImgs.forEach(img => {
            img.src = sprite;
        });
        
        // 타이틀/선택 화면의 히어로 이미지도 업데이트
        const starterHeroImg = document.querySelector('.starter-hero-img');
        if (starterHeroImg) {
            starterHeroImg.src = sprite;
        }
        
        console.log(`[Job] 스프라이트 저장 완료 - 기본: ${sprite}(${spriteScale}), 공격: ${slashSprite}(${slashScale})`);
    },
    
    // 현재 직업의 스프라이트 가져오기
    getCurrentSprite() {
        const saved = localStorage.getItem('lordofnight_player_sprite');
        if (saved) return saved;
        
        const job = this.getCurrentJob();
        return job.sprite || 'hero.png';
    },
    
    // 현재 직업의 공격 스프라이트 가져오기
    getCurrentSlashSprite() {
        const saved = localStorage.getItem('lordofnight_slash_sprite');
        if (saved) return saved;
        
        const job = this.getCurrentJob();
        return job.slashSprite || 'hero_slash.png';
    },
    
    // 현재 직업의 기본 스프라이트 스케일 가져오기
    getCurrentSpriteScale() {
        const job = this.getCurrentJob();
        return job.spriteScale || 1.0;
    },
    
    // 현재 직업의 공격 스프라이트 스케일 가져오기
    getCurrentSlashSpriteScale() {
        const job = this.getCurrentJob();
        return job.slashSpriteScale || 1.0;
    },
    
    // 플레이어 스프라이트에 스케일 적용
    applyPlayerSpriteScale(isSlash = false) {
        const playerSpriteEl = document.getElementById('player-sprite');
        if (!playerSpriteEl) return;
        
        const scale = isSlash ? this.getCurrentSlashSpriteScale() : this.getCurrentSpriteScale();
        playerSpriteEl.style.transform = `scale(${scale})`;
        playerSpriteEl.style.transformOrigin = 'center bottom';
        
        console.log(`[Job] 스프라이트 스케일 적용: ${scale} (${isSlash ? '슬래시' : '기본'})`);
    },
    
    // 직업 스탯 적용
    applyJobStats() {
        const job = this.getCurrentJob();
        
        if (typeof gameState !== 'undefined') {
            gameState.player.maxHp = job.stats.maxHp;
            gameState.player.hp = job.stats.maxHp;
            gameState.player.maxEnergy = job.stats.energy;
            gameState.player.energy = job.stats.energy;
            gameState.drawCount = job.stats.drawCount;
            console.log(`[Job] 스탯 적용 - HP: ${job.stats.maxHp}, 에너지: ${job.stats.energy}, 드로우: ${job.stats.drawCount}`);
        }
        
        if (typeof PlayerStats !== 'undefined') {
            PlayerStats.maxHp = job.stats.maxHp;
            PlayerStats.maxEnergy = job.stats.energy;
            PlayerStats.drawCount = job.stats.drawCount;
        }
    },
    
    // 직업 덱 적용
    applyJobDeck() {
        const job = this.getCurrentJob();
        const starterDeck = job.starterDeck;
        
        console.log(`[Job] 덱 적용 시작: ${job.name}`);
        
        if (!starterDeck) {
            console.warn(`[Job] ${job.name}의 시작 덱이 없습니다`);
            return;
        }
        
        // createCard 함수 확인
        if (typeof createCard !== 'function') {
            console.error('[Job] createCard 함수가 없습니다! cards.js가 로드되지 않았을 수 있습니다.');
            // 카드 ID만 저장하여 나중에 game.js에서 생성하도록 함
            const deckIds = [];
            if (starterDeck.attacks) {
                for (const [cardId, count] of Object.entries(starterDeck.attacks)) {
                    for (let i = 0; i < count; i++) {
                        deckIds.push(cardId);
                    }
                }
            }
            if (starterDeck.skills) {
                for (const [cardId, count] of Object.entries(starterDeck.skills)) {
                    for (let i = 0; i < count; i++) {
                        deckIds.push(cardId);
                    }
                }
            }
            if (starterDeck.powers) {
                for (const [cardId, count] of Object.entries(starterDeck.powers)) {
                    for (let i = 0; i < count; i++) {
                        deckIds.push(cardId);
                    }
                }
            }
            localStorage.setItem('lordofnight_player_deck', JSON.stringify(deckIds));
            console.log(`[Job] 카드 ID만 저장: ${deckIds.join(', ')}`);
            return;
        }
        
        // 덱 생성
        const newDeck = [];
        
        // 공격 카드 추가
        if (starterDeck.attacks) {
            for (const [cardId, count] of Object.entries(starterDeck.attacks)) {
                console.log(`[Job] 공격 카드 생성 시도: ${cardId} x${count}`);
                for (let i = 0; i < count; i++) {
                    const card = createCard(cardId);
                    if (card) {
                        newDeck.push(card);
                    } else {
                        console.warn(`[Job] 카드 생성 실패: ${cardId}`);
                    }
                }
            }
        }
        
        // 스킬 카드 추가
        if (starterDeck.skills) {
            for (const [cardId, count] of Object.entries(starterDeck.skills)) {
                console.log(`[Job] 스킬 카드 생성 시도: ${cardId} x${count}`);
                for (let i = 0; i < count; i++) {
                    const card = createCard(cardId);
                    if (card) {
                        newDeck.push(card);
                    } else {
                        console.warn(`[Job] 카드 생성 실패: ${cardId}`);
                    }
                }
            }
        }
        
        // 파워 카드 추가
        if (starterDeck.powers) {
            for (const [cardId, count] of Object.entries(starterDeck.powers)) {
                console.log(`[Job] 파워 카드 생성 시도: ${cardId} x${count}`);
                for (let i = 0; i < count; i++) {
                    const card = createCard(cardId);
                    if (card) {
                        newDeck.push(card);
                    } else {
                        console.warn(`[Job] 카드 생성 실패: ${cardId}`);
                    }
                }
            }
        }
        
        console.log(`[Job] 생성된 카드 수: ${newDeck.length}`);
        
        // gameState에 덱 적용
        if (typeof gameState !== 'undefined') {
            gameState.deck = [...newDeck];
            gameState.fullDeck = [...newDeck];
            gameState.drawPile = [];
            gameState.discardPile = [];
            gameState.hand = [];
            console.log(`[Job] gameState에 덱 적용 완료: ${newDeck.length}장`);
        } else {
            console.warn('[Job] gameState가 정의되지 않음');
        }
        
        // localStorage에 덱 저장 (game.js의 loadPlayerDeck과 동일한 키 사용)
        try {
            const deckIds = newDeck.map(card => card.id);
            localStorage.setItem('lordofnight_player_deck', JSON.stringify(deckIds));
            console.log(`[Job] localStorage에 덱 저장 완료: ${deckIds.join(', ')}`);
        } catch (e) {
            console.error('[Job] 덱 저장 실패:', e);
        }
    },
    
    // 직업 유물 적용 (보관소 시스템과 연동)
    applyJobRelics() {
        const job = this.getCurrentJob();
        const starterRelics = job.starterRelics || [];
        
        // RelicLoadoutSystem이 있으면 보관소에 추가 (권장)
        if (typeof RelicLoadoutSystem !== 'undefined') {
            console.log(`[Job] 보관소 시스템 연동 - 직업 변경 시 유물 리셋`);
            
            // 1. 시작 유물 해금
            starterRelics.forEach(relicId => {
                if (!RelicLoadoutSystem.isUnlocked(relicId)) {
                    RelicLoadoutSystem.unlockRelic(relicId);
                    console.log(`[Job] 유물 해금: ${relicId}`);
                }
            });
            
            // 2. 기존 장착 유물 초기화 후 시작 유물로 교체
            RelicLoadoutSystem.equippedRelics = [];
            
            // 슬롯 수만큼만 장착 (시작 유물이 슬롯보다 많으면 슬롯 수만큼만)
            const toEquip = starterRelics.slice(0, Math.max(RelicLoadoutSystem.currentSlots, starterRelics.length));
            
            // 슬롯이 부족하면 임시로 확장
            if (starterRelics.length > RelicLoadoutSystem.currentSlots) {
                RelicLoadoutSystem.currentSlots = starterRelics.length;
                RelicLoadoutSystem.saveSlots();
                console.log(`[Job] 슬롯 확장: ${RelicLoadoutSystem.currentSlots}개`);
            }
            
            RelicLoadoutSystem.equippedRelics = [...starterRelics];
            
            // 3. 저장
            RelicLoadoutSystem.saveEquipped();
            RelicLoadoutSystem.saveUnlocked();
            
            console.log(`[Job] 전직 완료 - 장착 유물: ${RelicLoadoutSystem.equippedRelics.join(', ') || '없음'}`);
            return;
        }
        
        // RelicLoadoutSystem이 없으면 직접 RelicSystem에 추가 (폴백)
        if (typeof RelicSystem === 'undefined') {
            console.warn('[Job] RelicSystem이 로드되지 않았습니다');
            return;
        }
        
        // 기존 유물 초기화
        if (typeof RelicSystem.clearAllRelics === 'function') {
            RelicSystem.clearAllRelics();
            console.log('[Job] 기존 유물 초기화 완료');
        }
        
        // 시작 유물 지급
        if (starterRelics.length > 0) {
            console.log(`[Job] 시작 유물 지급 시작: ${starterRelics.length}개`);
            
            starterRelics.forEach(relicId => {
                RelicSystem.addRelic(relicId, true); // silent mode
                console.log(`[Job] 유물 지급: ${relicId}`);
            });
            
            // UI 업데이트
            if (typeof RelicSystem.updateRelicUI === 'function') {
                RelicSystem.updateRelicUI();
            }
        } else {
            console.log(`[Job] ${job.name}의 시작 유물이 없습니다`);
        }
    },
    
    // 직업 덱 가져오기
    getJobDeck() {
        const job = this.getCurrentJob();
        return job.starterDeck;
    },
    
    // 직업 유물 가져오기
    getJobRelics() {
        const job = this.getCurrentJob();
        return job.starterRelics || [];
    },
    
    // 직업 해금
    unlockJob(jobId) {
        const job = this.jobs[jobId];
        if (job) {
            job.unlocked = true;
            this.saveToStorage();
            console.log(`[Job] 직업 해금: ${job.name}`);
        }
    },
    
    // ==========================================
    // 저장/로드
    // ==========================================
    
    saveToStorage() {
        const data = {
            currentJob: this.currentJob,
            unlockedJobs: Object.keys(this.jobs).filter(id => this.jobs[id].unlocked)
        };
        localStorage.setItem('shadowDeck_jobs', JSON.stringify(data));
    },
    
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('shadowDeck_jobs'));
            if (data) {
                this.currentJob = data.currentJob || 'warrior';
                
                // 해금 상태 복원
                if (data.unlockedJobs) {
                    data.unlockedJobs.forEach(jobId => {
                        if (this.jobs[jobId]) {
                            this.jobs[jobId].unlocked = true;
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('[Job] 저장 데이터 로드 실패');
        }
    },
    
    // ==========================================
    // UI: 현자 NPC 대화창
    // ==========================================
    
    // 선택된 직업 인덱스
    selectedJobIndex: 0,
    
    openJobChangeUI() {
        // 기존 UI 제거
        const existing = document.getElementById('job-change-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'job-change-modal';
        modal.className = 'ds-job-modal';
        
        const currentJob = this.getCurrentJob();
        const jobs = Object.values(this.jobs);
        this.selectedJobIndex = jobs.findIndex(j => j.id === this.currentJob) || 0;
        
        modal.innerHTML = `
            <div class="ds-backdrop"></div>
            <div class="ds-container">
                <!-- 왼쪽: 직업 리스트 -->
                <div class="ds-left-panel">
                    <div class="ds-title">
                        <span class="ds-title-line"></span>
                        <h1>전직</h1>
                        <span class="ds-title-line"></span>
                    </div>
                    <div class="ds-job-list" id="ds-job-list">
                        ${this.renderDSJobList()}
                    </div>
                    <div class="ds-hint">
                        <span>↑↓ 선택</span>
                        <span>ENTER 확인</span>
                        <span>ESC 닫기</span>
                    </div>
                </div>
                
                <!-- 오른쪽: 상세 정보 -->
                <div class="ds-right-panel" id="ds-job-detail">
                    ${this.renderDSJobDetail(currentJob)}
                </div>
            </div>
            
            <!-- 닫기 버튼 -->
            <button class="ds-close" onclick="JobSystem.closeJobChangeUI()">
                <span>×</span>
            </button>
        `;
        
        document.body.appendChild(modal);
        this.injectJobStyles();
        
        // 키보드 이벤트
        this.keyHandler = (e) => this.handleKeyPress(e);
        document.addEventListener('keydown', this.keyHandler);
        
        // 애니메이션
        requestAnimationFrame(() => {
            modal.classList.add('active');
            this.bindJobListEvents();  // 클릭 이벤트 바인딩
            this.selectDSJob(this.selectedJobIndex);
        });
    },
    
    closeJobChangeUI() {
        const modal = document.getElementById('job-change-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 400);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    },
    
    handleKeyPress(e) {
        const jobs = Object.values(this.jobs);  // 전체 직업 배열 사용
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectedJobIndex = Math.max(0, this.selectedJobIndex - 1);
                this.selectDSJob(this.selectedJobIndex);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectedJobIndex = Math.min(jobs.length - 1, this.selectedJobIndex + 1);
                this.selectDSJob(this.selectedJobIndex);
                break;
            case 'Enter':
                e.preventDefault();
                const job = jobs[this.selectedJobIndex];
                if (job && job.unlocked && job.id !== this.currentJob) {
                    this.confirmJobChange(job.id);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.closeJobChangeUI();
                break;
        }
    },
    
    renderDSJobList() {
        const jobs = Object.values(this.jobs);
        return jobs.map((job, index) => {
            const isCurrentJob = job.id === this.currentJob;
            const isLocked = !job.unlocked;
            
            return `
                <div class="ds-job-item ${isCurrentJob ? 'equipped' : ''} ${isLocked ? 'locked' : ''}"
                     data-index="${index}"
                     data-job="${job.id}">
                    <span class="ds-job-icon" style="color: ${job.color}">${isLocked ? '?' : job.icon}</span>
                    <span class="ds-job-name">${isLocked ? '???' : job.name}</span>
                    ${isCurrentJob ? '<span class="ds-equipped-mark">●</span>' : ''}
                </div>
            `;
        }).join('');
    },
    
    // 직업 리스트 이벤트 바인딩
    bindJobListEvents() {
        const jobList = document.getElementById('ds-job-list');
        if (!jobList) {
            console.error('[JobSystem] ds-job-list를 찾을 수 없습니다.');
            return;
        }
        
        // 이벤트 위임 방식으로 변경
        jobList.addEventListener('click', (e) => {
            const item = e.target.closest('.ds-job-item');
            if (!item) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const index = parseInt(item.dataset.index);
            console.log('[JobSystem] 클릭 감지 - index:', index);
            this.selectDSJob(index);
        });
        
        jobList.addEventListener('dblclick', (e) => {
            const item = e.target.closest('.ds-job-item');
            if (!item) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const jobId = item.dataset.job;
            const job = this.jobs[jobId];
            console.log('[JobSystem] 더블클릭 감지 - jobId:', jobId);
            
            if (job && job.unlocked && job.id !== this.currentJob) {
                this.confirmJobChange(jobId);
            }
        });
        
        console.log('[JobSystem] 이벤트 바인딩 완료');
    },
    
    selectDSJob(index) {
        const jobs = Object.values(this.jobs);
        const job = jobs[index];
        if (!job) return;
        
        this.selectedJobIndex = index;
        
        // 리스트 선택 표시
        document.querySelectorAll('.ds-job-item').forEach((el, i) => {
            el.classList.toggle('selected', i === index);
        });
        
        // 상세 정보 업데이트
        const detail = document.getElementById('ds-job-detail');
        if (detail && job.unlocked) {
            detail.innerHTML = this.renderDSJobDetail(job);
        } else if (detail) {
            detail.innerHTML = this.renderDSLockedDetail(job);
        }
    },
    
    selectJob(jobId) {
        const jobs = Object.values(this.jobs);
        const index = jobs.findIndex(j => j.id === jobId);
        if (index >= 0) {
            this.selectDSJob(index);
        }
    },
    
    renderDSJobDetail(job) {
        const isCurrentJob = job.id === this.currentJob;
        const deckInfo = this.getDeckSummary(job.starterDeck);
        const cardList = this.getDetailedCardList(job.starterDeck);
        const allCards = [...cardList.attacks, ...cardList.skills];
        
        // 직업 기믹 정보
        const gimmickInfo = this.getJobGimmickInfo(job);
        
        return `
            <div class="ds-detail-content">
                <!-- 상단: 캐릭터 이미지 + 정보 -->
                <div class="ds-detail-top">
                    <!-- 캐릭터 스프라이트 -->
                    <div class="ds-character-display">
                        <img src="${job.sprite}" alt="${job.name}" class="ds-character-img">
                    </div>
                    
                    <!-- 직업 정보 -->
                    <div class="ds-job-info-panel">
                        <!-- 직업 헤더 -->
                        <div class="ds-job-header">
                            <span class="ds-big-icon" style="color: ${job.color}">${job.icon}</span>
                            <div class="ds-job-title">
                                <h2>${job.name}</h2>
                                <span class="ds-job-en">${job.nameEn}</span>
                            </div>
                        </div>
                        
                        <!-- 구분선 -->
                        <div class="ds-divider"></div>
                        
                        <!-- 설명 -->
                        <p class="ds-description">${job.description}</p>
                        
                        <!-- 직업 기믹 (있으면) -->
                        ${gimmickInfo ? `
                            <div class="ds-gimmick">
                                <span class="ds-gimmick-icon">${gimmickInfo.icon}</span>
                                <div class="ds-gimmick-info">
                                    <span class="ds-gimmick-name">${gimmickInfo.name}</span>
                                    <span class="ds-gimmick-desc">${gimmickInfo.description}</span>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- 스탯 -->
                        <div class="ds-stats">
                            <div class="ds-stat">
                                <span class="ds-stat-icon">♥</span>
                                <span class="ds-stat-label">체력</span>
                                <span class="ds-stat-value">${job.stats.maxHp}</span>
                            </div>
                            <div class="ds-stat">
                                <span class="ds-stat-icon">◆</span>
                                <span class="ds-stat-label">에너지</span>
                                <span class="ds-stat-value">${job.stats.energy}</span>
                            </div>
                            <div class="ds-stat">
                                <span class="ds-stat-icon">▣</span>
                                <span class="ds-stat-label">드로우</span>
                                <span class="ds-stat-value">${job.stats.drawCount}</span>
                            </div>
                        </div>
                        
                        <!-- 유물 -->
                        ${job.starterRelics.length > 0 ? `
                            <div class="ds-relics">
                                <span class="ds-relic-label">시작 유물</span>
                                ${job.starterRelics.map(r => this.renderRelicIcon(r)).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- 덱 카드 리스트 (딜링창 스타일) -->
                <div class="ds-deck-section">
                    <div class="ds-deck-header">
                        <span class="ds-deck-label">기본 덱</span>
                        <span class="ds-deck-count">${deckInfo.total}장</span>
                    </div>
                    <div class="ds-card-fan">
                        ${allCards.map((card, i) => this.renderDSMiniCard(card, i, allCards.length)).join('')}
                    </div>
                </div>
                
                <!-- 전직 버튼 -->
                <button class="ds-confirm-btn ${isCurrentJob ? 'current' : ''}" 
                        onclick="JobSystem.confirmJobChange('${job.id}')"
                        ${isCurrentJob ? 'disabled' : ''}>
                    ${isCurrentJob ? '현재 직업' : '전직하기'}
                </button>
            </div>
        `;
    },
    
    // 유물 아이콘 렌더링
    renderRelicIcon(relicId) {
        const relic = typeof relicDatabase !== 'undefined' ? relicDatabase[relicId] : null;
        if (!relic) {
            return `<span class="ds-relic">🏆 ${relicId}</span>`;
        }
        
        const name = relic.name_kr || relic.name || relicId;
        const desc = relic.description_kr || relic.description || '';
        
        // 이미지 아이콘인 경우
        if (relic.isImageIcon && relic.icon) {
            return `
                <span class="ds-relic" data-tooltip="${desc}">
                    <img src="${relic.icon}" alt="${name}" class="ds-relic-icon-img">
                    ${name}
                    <span class="ds-relic-tooltip">${desc}</span>
                </span>
            `;
        }
        
        // 이모지 아이콘인 경우
        return `
            <span class="ds-relic" data-tooltip="${desc}">
                ${relic.icon || '🏆'} ${name}
                <span class="ds-relic-tooltip">${desc}</span>
            </span>
        `;
    },
    
    // 직업 기믹 정보 가져오기
    getJobGimmickInfo(job) {
        const gimmicks = {
            incantation: {
                icon: '✨',
                name: '영창 시스템',
                description: '[영창] 카드 사용 시 영창 스택 축적. 3스택 시 과부하 폭발!'
            },
            stealth: {
                icon: '🌑',
                name: '은신 시스템',
                description: '카드 6장 사용 시 은신 획득. 은신은 피해를 감소시키고, 공격 시 추가 데미지!'
            },
            poison: {
                icon: '☠️',
                name: '독 시스템',
                description: '독을 중첩시켜 턴 종료 시 지속 피해를 입힙니다.'
            },
            rage: {
                icon: '🔥',
                name: '분노 시스템',
                description: '피해를 받을 때마다 분노 축적. 분노량에 비례해 공격력 증가.'
            },
            block: {
                icon: '🛡️',
                name: '수호 시스템',
                description: '방어도가 다음 턴으로 이월됩니다.'
            }
        };
        
        if (job.specialSystem && gimmicks[job.specialSystem]) {
            return gimmicks[job.specialSystem];
        }
        return null;
    },
    
    // 딜링창 스타일 미니 카드 렌더링
    renderDSMiniCard(card, index, total) {
        const isAttack = card.type === 'attack' || (typeof cardDatabase !== 'undefined' && cardDatabase[card.id]?.type === CardType?.ATTACK);
        const borderColor = isAttack ? '#b54a4a' : '#4a6ab5';
        const iconHtml = card.icon?.includes('<img') 
            ? card.icon.replace('class="card-icon-img"', 'class="ds-mini-card-icon-img"')
            : `<span>${card.icon || '❓'}</span>`;
        
        // 부채꼴 배치 계산
        const fanAngle = Math.min(5, 50 / total);
        const rotation = (index - (total - 1) / 2) * fanAngle;
        const offsetY = Math.abs(index - (total - 1) / 2) * 3;
        
        return `
            <div class="ds-mini-card" 
                 style="--card-border: ${borderColor}; --rotation: ${rotation}deg; --offset-y: ${offsetY}px;"
                 title="${card.name}: ${this.stripHtml(card.description || '')}">
                <div class="ds-mini-card-cost">${card.cost}</div>
                <div class="ds-mini-card-body">
                    <div class="ds-mini-card-icon">${iconHtml}</div>
                    <div class="ds-mini-card-name">${card.name}</div>
                </div>
                ${card.count > 1 ? `<div class="ds-mini-card-count">×${card.count}</div>` : ''}
            </div>
        `;
    },
    
    // 다크소울 스타일 카드 아이템 렌더링
    renderDSCardItem(card) {
        const isAttack = card.type === 'attack' || (typeof cardDatabase !== 'undefined' && cardDatabase[card.id]?.type === CardType?.ATTACK);
        const typeColor = isAttack ? '#b54a4a' : '#4a6ab5';
        const typeLabel = isAttack ? '공격' : '스킬';
        const iconHtml = card.icon?.includes('<img') 
            ? `<span class="ds-card-icon">${card.icon}</span>`
            : `<span class="ds-card-icon">${card.icon || '❓'}</span>`;
        
        return `
            <div class="ds-card-item" style="--type-color: ${typeColor}">
                <div class="ds-card-cost">${card.cost}</div>
                ${iconHtml}
                <div class="ds-card-info">
                    <span class="ds-card-name">${card.name}</span>
                    <span class="ds-card-desc">${this.stripHtml(card.description || '')}</span>
                </div>
                <span class="ds-card-count">×${card.count}</span>
            </div>
        `;
    },
    
    renderDSLockedDetail(job) {
        return `
            <div class="ds-detail-content ds-locked">
                <div class="ds-locked-icon">🔒</div>
                <h2>???</h2>
                <p class="ds-unlock-hint">${job.unlockCondition || '해금 조건을 만족하세요'}</p>
            </div>
        `;
    },
    
    // 상세 카드 리스트 생성
    getDetailedCardList(deck) {
        const attacks = [];
        const skills = [];
        
        // 공격 카드
        if (deck.attacks) {
            for (const [cardId, count] of Object.entries(deck.attacks)) {
                const cardData = this.getCardData(cardId);
                if (cardData) {
                    attacks.push({ ...cardData, count });
                }
            }
        }
        
        // 스킬 카드
        if (deck.skills) {
            for (const [cardId, count] of Object.entries(deck.skills)) {
                const cardData = this.getCardData(cardId);
                if (cardData) {
                    skills.push({ ...cardData, count });
                }
            }
        }
        
        return { attacks, skills };
    },
    
    // 카드 데이터 가져오기
    getCardData(cardId) {
        if (typeof cardDatabase !== 'undefined' && cardDatabase[cardId]) {
            return cardDatabase[cardId];
        }
        // 폴백 데이터
        const fallbackCards = {
            strike: { name: '베기', cost: 1, icon: '⚔️', description: '6 데미지' },
            defend: { name: '방어', cost: 1, icon: '🛡️', description: '5 방어도' },
            bash: { name: '강타', cost: 2, icon: '💥', description: '15 데미지' },
            flurry: { name: '연속 찌르기', cost: 1, icon: '🗡️', description: '2×3 데미지' },
            dirtyStrike: { name: '비열한 일격', cost: 1, icon: '💀', description: '4 데미지 + 취약' },
            dodge: { name: '닷지', cost: 0, icon: '💨', description: '3 방어도 + 1 드로우' },
            dagger: { name: '검무', cost: 1, icon: '🗡️', description: '단도 투척 3장' },
            energyBolt: { name: '에너지 볼트', cost: 1, icon: '<img src="energybolt.png" class="card-icon-img">', description: '턴 종료 시 3 데미지' },
            energize: { name: '충전', cost: 0, icon: '⚡', description: '+1 에너지' },
            generalStore: { name: '만물상', cost: 1, icon: '🎁', description: '3장 드로우' },
            battleOpening: { name: '전투 개막', cost: 0, icon: '💥', description: '8 데미지 (소멸)' },
            finisher: { name: '처형의 칼날', cost: 1, icon: '<img src="deadlySword.png" class="card-icon-img">', description: '공격 수×5 데미지' },
            concentratedStrike: { name: '응집된 일격', cost: 3, icon: '<img src="chargeAttack.png" alt="Concentrated Strike" class="card-icon-img">', description: '12 데미지' },
            shrugItOff: { name: '견디기', cost: 1, icon: '💪', description: '8 방어도' },
            secondWind: { name: '재기', cost: 1, icon: '🌬️', description: '5 방어도 + 3 회복' },
            lifeDrain: { name: '생명력 흡수', cost: 2, icon: '🩸', description: '8 HP 회복' },
            heavyBlow: { name: '묵직한 일격', cost: 2, icon: '🔱', description: '14 데미지' },
            chakramThrow: { name: '차크람 던지기', cost: 1, icon: '💫', description: '전체 4 데미지' },
            quickSlash: { name: '빠른 베기', cost: 0, icon: '💨', description: '4 데미지' },
            plunder: { name: '강탈', cost: 1, icon: '💰', description: '8 데미지 (취약 시 +2 에너지)' }
        };
        return fallbackCards[cardId] || { name: cardId, cost: '?', icon: '❓', description: '' };
    },
    
    // 미니 카드 렌더링 (딜링 스타일)
    renderMiniCard(card, index, total) {
        const isAttack = card.type === 'attack' || cardDatabase[card.id]?.type === CardType?.ATTACK;
        const borderColor = isAttack ? '#ef4444' : '#3b82f6';
        const iconHtml = card.icon?.includes('<img') ? card.icon : `<span class="mini-card-icon">${card.icon || '❓'}</span>`;
        
        // 카드 배치 계산 (부채꼴)
        const fanAngle = Math.min(4, 40 / total); // 카드 수에 따라 각도 조정
        const rotation = (index - (total - 1) / 2) * fanAngle;
        const offsetY = Math.abs(index - (total - 1) / 2) * 2;
        
        return `
            <div class="mini-card" 
                 style="--card-border: ${borderColor}; --rotation: ${rotation}deg; --offset-y: ${offsetY}px;"
                 title="${card.name}: ${this.stripHtml(card.description || '')}">
                <div class="mini-card-cost">${card.cost}</div>
                <div class="mini-card-body">
                    ${iconHtml}
                    <div class="mini-card-name">${card.name}</div>
                </div>
                ${card.count > 1 ? `<div class="mini-card-count">×${card.count}</div>` : ''}
            </div>
        `;
    },
    
    // HTML 태그 제거
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    },
    
    // 유물 뱃지 렌더링
    renderRelicBadge(relicId) {
        const relicData = this.getRelicData(relicId);
        return `
            <div class="relic-badge" title="${relicData.effect}">
                <span class="relic-badge-icon">${relicData.icon}</span>
                <span class="relic-badge-name">${relicData.name}</span>
            </div>
        `;
    },
    
    getRelicData(relicId) {
        const relics = {
            'criticalStrike': { name: '회심', icon: '💥', effect: '7번째 공격 크리티컬' },
            'relentlessAttack': { name: '거침없는 공격', icon: '⚡', effect: '연속 공격 보너스 데미지' },
            'deepWound': { name: '후벼파기', icon: '🩸', effect: '같은 적 2회 공격 시 출혈' },
            'phoenixFeather': { name: '불사조 깃털', icon: '🔥', effect: '사망 시 30% HP로 부활' },
            'energyCrystal': { name: '에너지 결정', icon: '💎', effect: '매 턴 +1 에너지' }
        };
        return relics[relicId] || { name: relicId, icon: '❓', effect: '' };
    },
    
    getDeckSummary(deck) {
        let attacks = 0, skills = 0;
        
        if (deck.attacks) {
            attacks = Object.values(deck.attacks).reduce((a, b) => a + b, 0);
        }
        if (deck.skills) {
            skills = Object.values(deck.skills).reduce((a, b) => a + b, 0);
        }
        
        return { attacks, skills, total: attacks + skills };
    },
    
    confirmJobChange(jobId) {
        const job = this.jobs[jobId];
        if (!job || job.id === this.currentJob) return;
        
        // 바로 전직 (자유롭게 변경 가능)
        this.changeJob(jobId);
        this.closeJobChangeUI();
        
        // 마을 UI 업데이트
        if (typeof TownSystem !== 'undefined') {
            TownSystem.updatePlayerStatus();
        }
        
        // 알림
        this.showJobChangeNotification(job);
    },
    
    showJobChangeNotification(job) {
        const notification = document.createElement('div');
        notification.className = 'job-change-notification';
        notification.innerHTML = `
            <div class="notif-icon" style="color: ${job.color}">${job.icon}</div>
            <span class="notif-title">전직 완료</span>
            <span class="notif-job">${job.name}</span>
        `;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 600);
        }, 2500);
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectJobStyles() {
        if (document.getElementById('job-system-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'job-system-styles';
        style.textContent = `
            /* ============================================
               다크소울 스타일 전직소 UI
               ============================================ */
            
            .ds-job-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            
            .ds-job-modal.active {
                opacity: 1;
            }
            
            .ds-backdrop {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%);
                pointer-events: none;
                z-index: 0;
            }
            
            .ds-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                padding: 60px 80px;
                box-sizing: border-box;
                z-index: 1;
            }
            
            /* ========== 왼쪽 패널: 직업 리스트 ========== */
            .ds-left-panel {
                width: 320px;
                display: flex;
                flex-direction: column;
                padding-right: 60px;
                border-right: 1px solid rgba(180, 160, 120, 0.3);
            }
            
            .ds-title {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 50px;
            }
            
            .ds-title h1 {
                margin: 0;
                font-family: 'Cinzel', 'Times New Roman', serif;
                font-size: 1.8rem;
                font-weight: 400;
                color: #c8b896;
                letter-spacing: 8px;
                text-transform: uppercase;
            }
            
            .ds-title-line {
                flex: 1;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(180, 160, 120, 0.5), transparent);
            }
            
            .ds-job-list {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
                position: relative;
                z-index: 10;
            }
            
            .ds-job-item {
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
                z-index: 11;
                padding: 14px 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-left: 2px solid transparent;
                position: relative;
            }
            
            .ds-job-item:hover:not(.locked) {
                background: rgba(255, 255, 255, 0.03);
            }
            
            .ds-job-item.selected {
                background: rgba(255, 255, 255, 0.05);
                border-left-color: #d4af37;
            }
            
            .ds-job-item.selected .ds-job-name {
                color: #f5e6c4;
            }
            
            .ds-job-item.locked {
                opacity: 0.35;
                cursor: not-allowed;
            }
            
            .ds-job-item.equipped .ds-job-name {
                color: #d4af37;
            }
            
            .ds-job-icon {
                font-size: 1.6rem;
                width: 36px;
                text-align: center;
            }
            
            .ds-job-name {
                flex: 1;
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                font-weight: 400;
                color: #a09080;
                letter-spacing: 2px;
                transition: color 0.2s;
            }
            
            .ds-equipped-mark {
                color: #d4af37;
                font-size: 0.6rem;
            }
            
            .ds-hint {
                margin-top: auto;
                padding-top: 30px;
                display: flex;
                gap: 24px;
                font-size: 0.75rem;
                color: #5a5040;
                font-family: 'Cinzel', serif;
                letter-spacing: 1px;
            }
            
            /* ========== 오른쪽 패널: 상세 정보 ========== */
            .ds-right-panel {
                flex: 1;
                padding-left: 60px;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                overflow-y: auto;
            }
            
            .ds-detail-content {
                width: 100%;
                max-width: 700px;
                padding: 20px 0;
            }
            
            /* 상단 영역: 캐릭터 + 정보 */
            .ds-detail-top {
                display: flex;
                gap: 40px;
                margin-bottom: 30px;
            }
            
            .ds-character-display {
                flex-shrink: 0;
                width: 180px;
                height: 220px;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                background: radial-gradient(ellipse at bottom, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            }
            
            .ds-character-img {
                max-width: 160px;
                max-height: 200px;
                image-rendering: pixelated;
                image-rendering: crisp-edges;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
            }
            
            .ds-job-info-panel {
                flex: 1;
            }
            
            .ds-job-header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 16px;
            }
            
            .ds-big-icon {
                font-size: 3rem;
                filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.3));
            }
            
            .ds-job-title h2 {
                margin: 0;
                font-family: 'Cinzel', serif;
                font-size: 1.8rem;
                font-weight: 400;
                color: #f5e6c4;
                letter-spacing: 4px;
            }
            
            .ds-job-en {
                display: block;
                margin-top: 4px;
                font-family: 'Cinzel', serif;
                font-size: 0.8rem;
                color: #6a6050;
                letter-spacing: 3px;
                text-transform: uppercase;
            }
            
            .ds-divider {
                height: 1px;
                background: linear-gradient(90deg, rgba(180, 160, 120, 0.5), transparent);
                margin: 16px 0;
            }
            
            .ds-description {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 0.95rem;
                color: #a09080;
                line-height: 1.6;
                margin: 0 0 20px;
            }
            
            .ds-stats {
                display: flex;
                gap: 30px;
                margin-bottom: 16px;
            }
            
            .ds-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
            }
            
            .ds-stat-icon {
                font-size: 1rem;
                color: #d4af37;
            }
            
            .ds-stat-label {
                font-size: 0.7rem;
                color: #6a6050;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            
            .ds-stat-value {
                font-family: 'Cinzel', serif;
                font-size: 1.4rem;
                color: #f5e6c4;
            }
            
            /* ========== 직업 기믹 표시 ========== */
            .ds-gimmick {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 16px;
                margin-bottom: 16px;
                background: rgba(212, 175, 55, 0.08);
                border: 1px solid rgba(212, 175, 55, 0.25);
                border-radius: 4px;
            }
            
            .ds-gimmick-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .ds-gimmick-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .ds-gimmick-name {
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                color: #d4af37;
                letter-spacing: 1px;
            }
            
            .ds-gimmick-desc {
                font-size: 0.8rem;
                color: #a09080;
                line-height: 1.4;
            }
            
            /* ========== 덱 카드 리스트 섹션 ========== */
            .ds-deck-section {
                margin-top: 20px;
                border-top: 1px solid rgba(180, 160, 120, 0.2);
                padding-top: 16px;
            }
            
            .ds-deck-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            
            .ds-deck-label {
                font-size: 0.85rem;
                color: #6a6050;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            
            .ds-deck-count {
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                color: #c8b896;
                background: rgba(212, 175, 55, 0.1);
                padding: 4px 12px;
                border: 1px solid rgba(212, 175, 55, 0.3);
            }
            
            /* 딜링창 스타일 카드 배치 */
            .ds-card-fan {
                display: flex;
                justify-content: center;
                align-items: flex-end;
                padding: 20px 0 30px;
                perspective: 1000px;
                min-height: 140px;
            }
            
            .ds-mini-card {
                width: 70px;
                height: 100px;
                background: linear-gradient(160deg, #252535 0%, #15151f 100%);
                border: 2px solid var(--card-border, #4a4a6a);
                border-radius: 6px;
                position: relative;
                margin: 0 -10px;
                transform: rotate(var(--rotation, 0deg)) translateY(var(--offset-y, 0px));
                transform-origin: bottom center;
                transition: all 0.25s ease;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
                flex-shrink: 0;
            }
            
            .ds-mini-card:hover {
                transform: rotate(0deg) translateY(-25px) scale(1.4);
                z-index: 100;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7), 0 0 20px var(--card-border);
            }
            
            .ds-mini-card-cost {
                position: absolute;
                top: -8px;
                left: -8px;
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
                color: #1a1a1a;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
                font-family: 'Cinzel', serif;
            }
            
            .ds-mini-card-body {
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 10px 6px 6px;
                gap: 4px;
            }
            
            .ds-mini-card-icon {
                font-size: 1.6rem;
            }
            
            .ds-mini-card-icon-img {
                width: 32px;
                height: 32px;
            }
            
            .ds-mini-card-name {
                font-size: 0.55rem;
                color: #c8b896;
                font-weight: 600;
                text-align: center;
                line-height: 1.2;
                max-height: 28px;
                overflow: hidden;
                word-break: keep-all;
            }
            
            .ds-mini-card-count {
                position: absolute;
                bottom: -8px;
                right: -8px;
                background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
                color: #1a1a1a;
                font-size: 0.65rem;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 10px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
                font-family: 'Cinzel', serif;
            }
            
            .ds-relics {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .ds-relic-label {
                font-size: 0.85rem;
                color: #6a6050;
                letter-spacing: 2px;
            }
            
            .ds-relic {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 0.9rem;
                color: #d4af37;
                background: rgba(212, 175, 55, 0.1);
                padding: 6px 12px;
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 4px;
                position: relative;
                cursor: help;
                transition: all 0.2s ease;
            }
            
            .ds-relic:hover {
                background: rgba(212, 175, 55, 0.2);
                border-color: rgba(212, 175, 55, 0.5);
            }
            
            .ds-relic-icon-img {
                width: 20px;
                height: 20px;
                image-rendering: pixelated;
            }
            
            /* 유물 툴팁 */
            .ds-relic-tooltip {
                position: absolute;
                bottom: calc(100% + 10px);
                left: 50%;
                transform: translateX(-50%);
                background: rgba(20, 18, 15, 0.98);
                border: 1px solid rgba(212, 175, 55, 0.5);
                color: #c8b896;
                padding: 10px 14px;
                border-radius: 4px;
                font-size: 0.85rem;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                z-index: 1000;
                pointer-events: none;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }
            
            .ds-relic-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 6px solid transparent;
                border-top-color: rgba(212, 175, 55, 0.5);
            }
            
            .ds-relic:hover .ds-relic-tooltip {
                opacity: 1;
                visibility: visible;
            }
            
            .ds-confirm-btn {
                width: 100%;
                padding: 18px 32px;
                margin-top: 24px;
                background: transparent;
                border: 1px solid rgba(212, 175, 55, 0.5);
                color: #c8b896;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                letter-spacing: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .ds-confirm-btn:hover:not(:disabled) {
                background: rgba(212, 175, 55, 0.1);
                border-color: #d4af37;
                color: #f5e6c4;
                box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
            }
            
            .ds-confirm-btn:disabled,
            .ds-confirm-btn.current {
                opacity: 0.4;
                cursor: not-allowed;
                border-color: rgba(100, 90, 70, 0.3);
            }
            
            /* 잠긴 직업 상세 */
            .ds-detail-content.ds-locked {
                text-align: center;
            }
            
            .ds-locked-icon {
                font-size: 4rem;
                margin-bottom: 24px;
                opacity: 0.5;
            }
            
            .ds-locked h2 {
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #6a6050;
                margin: 0 0 16px;
            }
            
            .ds-unlock-hint {
                font-size: 0.95rem;
                color: #5a5040;
                font-style: italic;
            }
            
            /* 닫기 버튼 */
            .ds-close {
                position: absolute;
                top: 30px;
                right: 40px;
                width: 50px;
                height: 50px;
                background: transparent;
                border: 1px solid rgba(180, 160, 120, 0.3);
                color: #6a6050;
                font-size: 2rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ds-close:hover {
                border-color: #d4af37;
                color: #c8b896;
            }
            
            /* 반응형 - 태블릿 */
            @media (max-width: 1024px) {
                .ds-container {
                    padding: 40px;
                    flex-direction: column;
                    overflow-y: auto;
                }
                
                .ds-left-panel {
                    width: 100%;
                    border-right: none;
                    border-bottom: 1px solid rgba(180, 160, 120, 0.3);
                    padding-right: 0;
                    padding-bottom: 30px;
                    margin-bottom: 30px;
                }
                
                .ds-job-list {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .ds-job-item {
                    padding: 10px 16px;
                    border-left: none;
                    border-bottom: 2px solid transparent;
                }
                
                .ds-job-item.selected {
                    border-bottom-color: #d4af37;
                }
                
                .ds-title {
                    margin-bottom: 24px;
                }
                
                .ds-hint {
                    display: none;
                }
                
                .ds-right-panel {
                    padding-left: 0;
                    overflow-y: visible;
                }
                
                .ds-detail-top {
                    gap: 30px;
                }
                
                .ds-character-display {
                    width: 150px;
                    height: 180px;
                }
                
                .ds-character-img {
                    max-width: 130px;
                    max-height: 160px;
                }
                
                .ds-card-fan {
                    min-height: 120px;
                    padding: 15px 0 25px;
                }
                
                .ds-mini-card {
                    width: 60px;
                    height: 85px;
                    margin: 0 -8px;
                }
                
                .ds-mini-card-icon {
                    font-size: 1.3rem;
                }
                
                .ds-mini-card-name {
                    font-size: 0.5rem;
                }
                
                .ds-gimmick {
                    padding: 10px 12px;
                }
            }
            
            /* 반응형 - 모바일 */
            @media (max-width: 600px) {
                .ds-container {
                    padding: 20px;
                    padding-top: 60px;
                }
                
                .ds-title h1 {
                    font-size: 1.3rem;
                    letter-spacing: 4px;
                }
                
                .ds-job-item {
                    padding: 8px 12px;
                    gap: 10px;
                }
                
                .ds-job-icon {
                    font-size: 1.2rem;
                    width: 28px;
                }
                
                .ds-job-name {
                    font-size: 0.9rem;
                }
                
                .ds-detail-top {
                    flex-direction: column;
                    gap: 20px;
                    align-items: center;
                }
                
                .ds-character-display {
                    width: 120px;
                    height: 150px;
                }
                
                .ds-character-img {
                    max-width: 100px;
                    max-height: 130px;
                }
                
                .ds-job-info-panel {
                    text-align: center;
                }
                
                .ds-job-header {
                    justify-content: center;
                }
                
                .ds-job-title h2 {
                    font-size: 1.4rem;
                }
                
                .ds-big-icon {
                    font-size: 2rem;
                }
                
                .ds-divider {
                    margin: 12px auto;
                    width: 80%;
                }
                
                .ds-stats {
                    justify-content: center;
                    gap: 24px;
                }
                
                .ds-stat-value {
                    font-size: 1.2rem;
                }
                
                .ds-relics {
                    justify-content: center;
                }
                
                .ds-gimmick {
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 10px;
                }
                
                .ds-card-fan {
                    min-height: 100px;
                    padding: 10px 0 20px;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .ds-mini-card {
                    width: 50px;
                    height: 70px;
                    margin: 0 -6px;
                    transform: rotate(0deg) translateY(0px);
                }
                
                .ds-mini-card:hover {
                    transform: translateY(-15px) scale(1.3);
                }
                
                .ds-mini-card-cost {
                    width: 18px;
                    height: 18px;
                    font-size: 0.65rem;
                    top: -6px;
                    left: -6px;
                }
                
                .ds-mini-card-icon {
                    font-size: 1.1rem;
                }
                
                .ds-mini-card-icon-img {
                    width: 24px;
                    height: 24px;
                }
                
                .ds-mini-card-name {
                    font-size: 0.45rem;
                }
                
                .ds-mini-card-count {
                    font-size: 0.55rem;
                    padding: 1px 4px;
                    bottom: -6px;
                    right: -6px;
                }
                
                .ds-close {
                    top: 15px;
                    right: 15px;
                    width: 40px;
                    height: 40px;
                    font-size: 1.5rem;
                }
            }
            
            /* ============================================
               전직 알림 (기존 스타일 유지)
               ============================================ */
            .job-change-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                padding: 40px 60px;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid rgba(212, 175, 55, 0.5);
                z-index: 20000;
                opacity: 0;
                transition: all 0.5s ease;
            }
            
            .job-change-notification.show {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .notif-icon {
                font-size: 3rem;
                filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
            }
            
            .notif-title {
                display: block;
                color: #6a6050;
                font-size: 0.9rem;
                letter-spacing: 4px;
                text-transform: uppercase;
            }
            
            .notif-job {
                display: block;
                color: #f5e6c4;
                font-family: 'Cinzel', serif;
                font-size: 1.8rem;
                font-weight: 400;
                letter-spacing: 4px;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 초기화
    init() {
        this.loadFromStorage();
        this.initSprite();
        console.log(`[Job] 직업 시스템 초기화: ${this.getCurrentJob().name}`);
    },
    
    // 스프라이트 초기화 (저장된 값 또는 기본값 적용)
    initSprite() {
        const job = this.getCurrentJob();
        const savedSprite = localStorage.getItem('lordofnight_player_sprite');
        const sprite = savedSprite || job.sprite || 'hero.png';
        
        // DOM 로드 후 스프라이트 적용
        setTimeout(() => {
            const playerSpriteEl = document.getElementById('player-sprite');
            if (playerSpriteEl) {
                playerSpriteEl.src = sprite;
                // 기본 스프라이트 스케일 적용
                this.applyPlayerSpriteScale(false);
                console.log(`[Job] 스프라이트 초기화: ${sprite} (스케일: ${this.getCurrentSpriteScale()})`);
            }
        }, 100);
    }
};

// 전역 접근
window.JobSystem = JobSystem;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    JobSystem.init();
});

