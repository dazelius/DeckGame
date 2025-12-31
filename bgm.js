// ==========================================
// Shadow Deck - BGM 시스템
// ==========================================

const BGMSystem = {
    // 메인 오디오
    audio: null,
    
    // 크로스페이드용 보조 오디오
    audioB: null,
    activeAudio: 'A', // 'A' or 'B'
    
    // 현재 재생 중인 트랙
    currentTrack: null,
    
    // 메모리 레이어 (크로스페이드)
    memoryAudio: null,
    memoryVolume: 0,
    memoryTrack: null,
    
    // 볼륨 (0.0 ~ 1.0)
    volume: 0.3,
    
    // 페이드 시간 (ms)
    fadeTime: 1000,
    crossfadeTime: 2000, // 크로스페이드용
    
    // 트랙 목록
    tracks: {
        battle: 'sound/Epic Clash of Fates.mp3',
        memory: 'sound/Loop of Fallen Kings.mp3',  // 메모리 레벨 높을 때 크로스페이드
        // 추후 추가 가능
        // title: 'sound/title.mp3',
        // map: 'sound/map.mp3',
        // boss: 'sound/boss.mp3',
    },
    
    // 음소거 상태
    isMuted: false,
    
    // 메모리 레벨
    memoryLevel: 0,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // 메인 오디오 요소 생성
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = this.volume;
        this.audio.preservesPitch = false; // 속도 변경 시 피치도 변경
        
        // 크로스페이드용 보조 오디오
        this.audioB = new Audio();
        this.audioB.loop = true;
        this.audioB.volume = 0;
        this.audioB.preservesPitch = false; // 속도 변경 시 피치도 변경
        
        // 메모리 레이어 오디오 (공포 효과용)
        this.memoryAudio = new Audio();
        this.memoryAudio.loop = true;
        this.memoryAudio.volume = 0;
        
        // 저장된 설정 로드
        this.loadSettings();
        
        // UI 생성
        this.createUI();
        
        console.log('[BGM] 시스템 초기화 완료');
    },
    
    // ==========================================
    // 설정 저장/로드
    // ==========================================
    loadSettings() {
        const saved = localStorage.getItem('bgm_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.volume = settings.volume ?? 0.3;
                this.isMuted = settings.isMuted ?? false;
                if (this.audio) {
                    this.audio.volume = this.isMuted ? 0 : this.volume;
                }
            } catch (e) {
                console.warn('[BGM] 설정 로드 실패:', e);
            }
        }
    },
    
    saveSettings() {
        localStorage.setItem('bgm_settings', JSON.stringify({
            volume: this.volume,
            isMuted: this.isMuted
        }));
    },
    
    // ==========================================
    // 재생 컨트롤
    // ==========================================
    play(trackName = 'battle') {
        if (!this.audio) this.init();
        
        const trackPath = this.tracks[trackName];
        if (!trackPath) {
            console.warn(`[BGM] 트랙 없음: ${trackName}`);
            return;
        }
        
        // 같은 트랙이면 무시
        if (this.currentTrack === trackName && !this.audio.paused) {
            return;
        }
        
        // 다른 트랙이면 페이드 아웃 후 변경
        if (this.currentTrack && this.currentTrack !== trackName && !this.audio.paused) {
            this.fadeOut(() => {
                this.loadAndPlay(trackPath, trackName);
            });
        } else {
            this.loadAndPlay(trackPath, trackName);
        }
    },
    
    loadAndPlay(trackPath, trackName) {
        this.audio.src = trackPath;
        this.currentTrack = trackName;
        
        // 페이드 인
        this.audio.volume = 0;
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`[BGM] 재생 시작: ${trackName}`);
                this.fadeIn();
                this.updateUI();
            }).catch(err => {
                console.warn('[BGM] 자동 재생 차단됨 (사용자 상호작용 필요):', err);
                // 사용자 상호작용 대기
                this.waitForInteraction(trackPath, trackName);
            });
        }
    },
    
    waitForInteraction(trackPath, trackName) {
        const handler = () => {
            this.audio.src = trackPath;
            this.currentTrack = trackName;
            this.audio.volume = 0;
            this.audio.play().then(() => {
                this.fadeIn();
                this.updateUI();
            }).catch(() => {});
            
            document.removeEventListener('click', handler);
            document.removeEventListener('keydown', handler);
        };
        
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('keydown', handler, { once: true });
    },
    
    stop() {
        if (!this.audio) return;
        
        // 메모리 효과 정지
        this.stopMemoryPulse();
        this.memoryLevel = 0;
        this.memoryTrackActive = false;
        
        this.fadeOut(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.playbackRate = 1.0;
            if (this.audioB) {
                this.audioB.pause();
                this.audioB.currentTime = 0;
                this.audioB.playbackRate = 1.0;
            }
            this.currentTrack = null;
            this.activeAudio = 'A';
            this.updateUI();
        });
    },
    
    pause() {
        if (!this.audio) return;
        this.audio.pause();
        this.updateUI();
    },
    
    resume() {
        if (!this.audio || !this.currentTrack) return;
        this.audio.play();
        this.updateUI();
    },
    
    // ==========================================
    // 페이드 효과
    // ==========================================
    fadeIn(callback) {
        if (!this.audio) return;
        
        const targetVolume = this.isMuted ? 0 : this.volume;
        const step = targetVolume / (this.fadeTime / 50);
        
        const fade = setInterval(() => {
            if (this.audio.volume < targetVolume - step) {
                this.audio.volume = Math.min(targetVolume, this.audio.volume + step);
            } else {
                this.audio.volume = targetVolume;
                clearInterval(fade);
                if (callback) callback();
            }
        }, 50);
    },
    
    fadeOut(callback) {
        if (!this.audio) {
            if (callback) callback();
            return;
        }
        
        const step = this.audio.volume / (this.fadeTime / 50);
        
        const fade = setInterval(() => {
            if (this.audio.volume > step) {
                this.audio.volume = Math.max(0, this.audio.volume - step);
            } else {
                this.audio.volume = 0;
                clearInterval(fade);
                if (callback) callback();
            }
        }, 50);
    },
    
    // ==========================================
    // 볼륨 조절
    // ==========================================
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.audio && !this.isMuted) {
            this.audio.volume = this.volume;
        }
        this.saveSettings();
        this.updateUI();
    },
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.audio) {
            this.audio.volume = this.isMuted ? 0 : this.volume;
        }
        if (this.memoryAudio) {
            this.memoryAudio.volume = this.isMuted ? 0 : this.memoryVolume;
        }
        this.saveSettings();
        this.updateUI();
    },
    
    // ==========================================
    // 메모리 레벨 기반 오디오 효과
    // ==========================================
    memoryTrackActive: false,
    
    setMemoryLevel(level) {
        const oldLevel = this.memoryLevel;
        this.memoryLevel = Math.max(0, Math.min(10, level));
        
        if (oldLevel === this.memoryLevel) return;
        
        // 메인 오디오 효과 적용
        this.applyMemoryEffects(oldLevel);
        
        console.log(`[BGM] 메모리 레벨: ${this.memoryLevel}`);
    },
    
    applyMemoryEffects(oldLevel) {
        if (this.isMuted) return;
        
        const level = this.memoryLevel;
        const activeAudio = this.activeAudio === 'A' ? this.audio : this.audioB;
        
        // 레벨 5 이상이면 메모리 트랙으로 크로스페이드
        if (level >= 5 && !this.memoryTrackActive && this.currentTrack !== 'memory') {
            this.memoryTrackActive = true;
            this.crossfadeTo('memory', 3000);
            console.log('[BGM] 메모리 트랙으로 크로스페이드 시작');
        }
        // 레벨 4 이하로 내려가면 원래 트랙으로 복귀
        else if (level < 5 && this.memoryTrackActive && this.currentTrack !== 'battle') {
            this.memoryTrackActive = false;
            this.crossfadeTo('battle', 3000);
            console.log('[BGM] 배틀 트랙으로 크로스페이드 복귀');
        }
        
        // 재생 속도 및 피치 효과 (preservesPitch = false이므로 속도 = 피치)
        // 속도가 낮아지면 피치도 낮아져서 어둡고 불안한 느낌
        if (level === 0) {
            // 정상 상태
            if (activeAudio) activeAudio.playbackRate = 1.0;
            this.stopMemoryPulse();
        } else if (level <= 4) {
            // 약간 느려짐 + 피치 다운
            if (activeAudio) activeAudio.playbackRate = 1.0 - (level * 0.03); // 0.97 ~ 0.88
            this.stopMemoryPulse();
        } else if (level <= 7) {
            // 더 느려지고 펄스 시작 + 피치 더 다운
            if (activeAudio) activeAudio.playbackRate = 0.88 - ((level - 4) * 0.04); // 0.84 ~ 0.72
            this.startMemoryPulse(0.12);
        } else {
            // 심하게 느려지고 강한 펄스 + 매우 낮은 피치
            if (activeAudio) activeAudio.playbackRate = 0.72 - ((level - 7) * 0.06); // 0.66 ~ 0.54
            this.startMemoryPulse(0.25);
        }
    },
    
    // 메모리 펄스 (볼륨이 불규칙하게 변동)
    memoryPulseInterval: null,
    
    startMemoryPulse(intensity) {
        this.stopMemoryPulse();
        
        const baseVolume = this.volume;
        
        this.memoryPulseInterval = setInterval(() => {
            const activeAudio = this.activeAudio === 'A' ? this.audio : this.audioB;
            if (!activeAudio || this.isMuted) return;
            
            // 랜덤 변동
            const variation = (Math.random() - 0.5) * 2 * intensity;
            const newVolume = Math.max(0.1, Math.min(1, baseVolume + (baseVolume * variation)));
            
            // 부드럽게 변경
            this.smoothVolumeChange(activeAudio, newVolume, 200);
            
        }, 300 + Math.random() * 400);
    },
    
    stopMemoryPulse() {
        if (this.memoryPulseInterval) {
            clearInterval(this.memoryPulseInterval);
            this.memoryPulseInterval = null;
            
            // 원래 볼륨으로 복귀
            const activeAudio = this.activeAudio === 'A' ? this.audio : this.audioB;
            if (activeAudio && !this.isMuted) {
                this.smoothVolumeChange(activeAudio, this.volume, 500);
                activeAudio.playbackRate = 1.0;
            }
        }
    },
    
    smoothVolumeChange(audioEl, targetVolume, duration) {
        if (!audioEl) return;
        
        const startVolume = audioEl.volume;
        const diff = targetVolume - startVolume;
        const steps = duration / 50;
        const stepValue = diff / steps;
        let currentStep = 0;
        
        const interval = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                audioEl.volume = targetVolume;
                clearInterval(interval);
            } else {
                audioEl.volume = Math.max(0, Math.min(1, startVolume + (stepValue * currentStep)));
            }
        }, 50);
    },
    
    // 크로스페이드 (두 트랙 간 전환)
    crossfadeTo(trackName, duration = 2000) {
        if (!this.audio) return;
        
        const trackPath = this.tracks[trackName];
        if (!trackPath) return;
        
        // 현재 활성 오디오와 비활성 오디오 결정
        const fromAudio = this.activeAudio === 'A' ? this.audio : this.audioB;
        const toAudio = this.activeAudio === 'A' ? this.audioB : this.audio;
        
        // 새 트랙 로드
        toAudio.src = trackPath;
        toAudio.volume = 0;
        toAudio.preservesPitch = false; // 피치 효과 적용
        toAudio.playbackRate = fromAudio.playbackRate; // 메모리 효과 유지
        
        // 현재 재생 위치 동기화 (가능한 경우)
        if (fromAudio.duration && !isNaN(fromAudio.duration)) {
            toAudio.currentTime = fromAudio.currentTime % (toAudio.duration || fromAudio.duration);
        }
        
        toAudio.play().then(() => {
            // 크로스페이드 실행
            const steps = duration / 50;
            const volumeStep = this.volume / steps;
            let currentStep = 0;
            
            const fade = setInterval(() => {
                currentStep++;
                
                const progress = currentStep / steps;
                fromAudio.volume = Math.max(0, this.volume * (1 - progress));
                toAudio.volume = Math.min(this.volume, this.volume * progress);
                
                if (currentStep >= steps) {
                    clearInterval(fade);
                    fromAudio.pause();
                    this.activeAudio = this.activeAudio === 'A' ? 'B' : 'A';
                    this.currentTrack = trackName;
                }
            }, 50);
        }).catch(err => {
            console.warn('[BGM] 크로스페이드 실패:', err);
        });
    },
    
    // ==========================================
    // UI
    // ==========================================
    createUI() {
        // 기존 UI 제거
        const existing = document.getElementById('bgm-control');
        if (existing) existing.remove();
        
        // BGM 컨트롤 버튼 생성
        const control = document.createElement('div');
        control.id = 'bgm-control';
        control.innerHTML = `
            <button class="bgm-toggle-btn" title="BGM 켜기/끄기">
                <span class="bgm-icon">🔊</span>
            </button>
            <div class="bgm-volume-slider">
                <input type="range" min="0" max="100" value="${this.volume * 100}" class="bgm-slider">
            </div>
        `;
        
        document.body.appendChild(control);
        
        // 스타일 주입
        this.injectStyles();
        
        // 이벤트 바인딩
        const toggleBtn = control.querySelector('.bgm-toggle-btn');
        const slider = control.querySelector('.bgm-slider');
        
        toggleBtn.addEventListener('click', () => this.toggleMute());
        
        slider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // 호버 시 슬라이더 표시
        control.addEventListener('mouseenter', () => {
            control.classList.add('expanded');
        });
        control.addEventListener('mouseleave', () => {
            control.classList.remove('expanded');
        });
        
        this.updateUI();
    },
    
    updateUI() {
        const control = document.getElementById('bgm-control');
        if (!control) return;
        
        const icon = control.querySelector('.bgm-icon');
        const slider = control.querySelector('.bgm-slider');
        
        if (icon) {
            if (this.isMuted || this.volume === 0) {
                icon.textContent = '🔇';
            } else if (this.volume < 0.3) {
                icon.textContent = '🔈';
            } else if (this.volume < 0.7) {
                icon.textContent = '🔉';
            } else {
                icon.textContent = '🔊';
            }
        }
        
        if (slider) {
            slider.value = this.volume * 100;
        }
        
        // 재생 중 표시
        if (this.audio && !this.audio.paused) {
            control.classList.add('playing');
        } else {
            control.classList.remove('playing');
        }
    },
    
    injectStyles() {
        if (document.getElementById('bgm-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'bgm-styles';
        style.textContent = `
            #bgm-control {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9999;
                display: none; /* 임시 숨김 - 설정 메뉴로 이동 예정 */
                align-items: center;
                gap: 10px;
                background: rgba(20, 20, 30, 0.9);
                border: 1px solid rgba(139, 115, 85, 0.5);
                border-radius: 25px;
                padding: 8px 12px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            }
            
            #bgm-control:hover {
                border-color: rgba(139, 115, 85, 0.8);
                box-shadow: 0 4px 20px rgba(139, 115, 85, 0.3);
            }
            
            #bgm-control.playing {
                border-color: rgba(76, 175, 80, 0.6);
            }
            
            #bgm-control.playing .bgm-toggle-btn {
                animation: bgmPulse 2s ease-in-out infinite;
            }
            
            @keyframes bgmPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .bgm-toggle-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: transparent;
                cursor: pointer;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .bgm-toggle-btn:hover {
                background: rgba(139, 115, 85, 0.3);
            }
            
            .bgm-icon {
                font-size: 1.4rem;
            }
            
            .bgm-volume-slider {
                width: 0;
                overflow: hidden;
                transition: width 0.3s ease;
            }
            
            #bgm-control.expanded .bgm-volume-slider {
                width: 100px;
            }
            
            .bgm-slider {
                width: 100px;
                height: 6px;
                -webkit-appearance: none;
                appearance: none;
                background: rgba(139, 115, 85, 0.3);
                border-radius: 3px;
                outline: none;
                cursor: pointer;
            }
            
            .bgm-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                background: #8b7355;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .bgm-slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                background: #a08060;
            }
            
            .bgm-slider::-moz-range-thumb {
                width: 14px;
                height: 14px;
                background: #8b7355;
                border-radius: 50%;
                cursor: pointer;
                border: none;
            }
        `;
        document.head.appendChild(style);
    }
};

// ==========================================
// 전투 시작/종료 시 BGM 자동 재생
// ==========================================

// 전투 시작 감지
function onBattleStart() {
    BGMSystem.play('battle');
}

// 전투 종료 감지
function onBattleEnd() {
    BGMSystem.fadeOut();
}

// ==========================================
// 초기화
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        BGMSystem.init();
    });
} else {
    BGMSystem.init();
}

// 전역 접근
window.BGMSystem = BGMSystem;
window.onBattleStart = onBattleStart;
window.onBattleEnd = onBattleEnd;

console.log('[BGM] BGM 시스템 로드됨');

