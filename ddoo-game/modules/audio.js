// =====================================================
// Audio - 사운드 시스템
// =====================================================

const Audio = {
    // ========== 설정 ==========
    config: {
        bgmVolume: 0.5,
        sfxVolume: 0.7,
        enabled: true,
        basePath: 'sound/'
    },
    
    // ========== 상태 ==========
    state: {
        initialized: false,
        sounds: new Map(),
        currentBGM: null,
        bgmName: null
    },
    
    // ========== 초기화 ==========
    init(options = {}) {
        if (this.state.initialized) return this;
        
        Object.assign(this.config, options);
        
        // 볼륨 설정 로드
        this._loadSettings();
        
        this.state.initialized = true;
        console.log('[Audio] ✅ 초기화 완료');
        return this;
    },
    
    // ========== SFX ==========
    
    /**
     * 효과음 재생
     * @param {string} name - 사운드 파일명 (확장자 제외)
     * @param {object} options - { volume, loop, rate }
     */
    play(name, options = {}) {
        if (!this.config.enabled) return null;
        
        const path = `${this.config.basePath}${name}.mp3`;
        const audio = new window.Audio(path);
        
        audio.volume = (options.volume ?? 1) * this.config.sfxVolume;
        audio.loop = options.loop ?? false;
        audio.playbackRate = options.rate ?? 1;
        
        audio.play().catch(e => {
            console.warn(`[Audio] 재생 실패: ${name}`, e.message);
        });
        
        return audio;
    },
    
    /**
     * 효과음 프리로드
     * @param {string[]} names - 사운드 파일명 배열
     */
    preload(names) {
        names.forEach(name => {
            const path = `${this.config.basePath}${name}.mp3`;
            const audio = new window.Audio();
            audio.preload = 'auto';
            audio.src = path;
            this.state.sounds.set(name, audio);
        });
        console.log(`[Audio] ${names.length}개 사운드 프리로드`);
    },
    
    // ========== BGM ==========
    
    /**
     * BGM 재생
     * @param {string} name - BGM 파일명
     * @param {number} fadeIn - 페이드인 시간 (ms)
     */
    playBGM(name, fadeIn = 1000) {
        if (this.state.bgmName === name) return;
        
        // 이전 BGM 정지
        this.stopBGM(500);
        
        setTimeout(() => {
            const path = `${this.config.basePath}${name}.mp3`;
            const bgm = new window.Audio(path);
            bgm.loop = true;
            bgm.volume = 0;
            
            bgm.play().then(() => {
                this.state.currentBGM = bgm;
                this.state.bgmName = name;
                
                // 페이드인
                this._fadeVolume(bgm, this.config.bgmVolume, fadeIn);
                console.log(`[Audio] 🎵 BGM 재생: ${name}`);
            }).catch(e => {
                console.warn(`[Audio] BGM 재생 실패: ${name}`, e.message);
            });
        }, 500);
    },
    
    /**
     * BGM 정지
     * @param {number} fadeOut - 페이드아웃 시간 (ms)
     */
    stopBGM(fadeOut = 500) {
        if (!this.state.currentBGM) return;
        
        const bgm = this.state.currentBGM;
        this._fadeVolume(bgm, 0, fadeOut, () => {
            bgm.pause();
            bgm.currentTime = 0;
        });
        
        this.state.currentBGM = null;
        this.state.bgmName = null;
    },
    
    /**
     * BGM 일시정지/재개
     */
    toggleBGM() {
        if (!this.state.currentBGM) return;
        
        if (this.state.currentBGM.paused) {
            this.state.currentBGM.play();
        } else {
            this.state.currentBGM.pause();
        }
    },
    
    // ========== 볼륨 제어 ==========
    
    setBGMVolume(volume) {
        this.config.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.state.currentBGM) {
            this.state.currentBGM.volume = this.config.bgmVolume;
        }
        this._saveSettings();
    },
    
    setSFXVolume(volume) {
        this.config.sfxVolume = Math.max(0, Math.min(1, volume));
        this._saveSettings();
    },
    
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (!enabled && this.state.currentBGM) {
            this.state.currentBGM.pause();
        } else if (enabled && this.state.currentBGM) {
            this.state.currentBGM.play();
        }
        this._saveSettings();
    },
    
    // ========== 내부 메서드 ==========
    
    _fadeVolume(audio, targetVolume, duration, onComplete) {
        const startVolume = audio.volume;
        const startTime = performance.now();
        
        const fade = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            audio.volume = startVolume + (targetVolume - startVolume) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        fade();
    },
    
    _saveSettings() {
        try {
            localStorage.setItem('ddoo_audio', JSON.stringify({
                bgmVolume: this.config.bgmVolume,
                sfxVolume: this.config.sfxVolume,
                enabled: this.config.enabled
            }));
        } catch (e) {}
    },
    
    _loadSettings() {
        try {
            const saved = localStorage.getItem('ddoo_audio');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(this.config, settings);
            }
        } catch (e) {}
    },
    
    // ========== 정리 ==========
    
    dispose() {
        this.stopBGM(0);
        this.state.sounds.clear();
        this.state.initialized = false;
        console.log('[Audio] 🗑️ 정리 완료');
    }
};

// 전역 노출
window.Audio = Audio;

console.log('[Audio] 스크립트 로드됨');
