// ==========================================
// Shadow Deck - 사운드 시스템
// ==========================================

const SoundSystem = {
    sounds: {},
    volume: 0.5,
    enabled: true,
    initialized: false,
    
    // 사운드 초기화
    init() {
        if (this.initialized) return;
        
        // ==========================================
        // 모든 사운드 프리로드
        // ==========================================
        
        // 기본 효과음
        this.preload('hit', 'sound/hit.mp3');
        this.preload('hit_blood', 'sound/hit_blood.mp3');
        this.preload('select', 'sound/select.mp3');
        this.preload('laser', 'sound/laser.mp3');
        this.preload('magic', 'sound/magic_casting.mp3');
        this.preload('knife_swish', 'sound/knife_swish.mp3');
        
        // 카드 관련
        this.preload('card_draw', 'sound/card_draw.mp3');
        this.preload('card_use', 'sound/card_use.mp3');
        
        // 방어/쉴드 관련
        this.preload('shield', 'sound/shield.mp3');
        this.preload('shield_hit', 'sound/shield_hit.mp3');
        this.preload('shield_break', 'sound/shield_break.mp3');
        
        // 전투 관련
        this.preload('evade', 'sound/evade.mp3');
        this.preload('hide', 'sound/hide.mp3');
        this.preload('ready', 'sound/ready.mp3');
        this.preload('battlestart', 'sound/battlestart.mp3');
        this.preload('battleintro', 'sound/battleintro.mp3');
        this.preload('ambush', 'sound/ambush.mp3');
        
        // 갬블러 관련
        this.preload('revolver_spin', 'sound/revolver-spin.mp3');
        this.preload('gun_shot', 'sound/retro-gun-shot.mp3');
        this.preload('empty_gun', 'sound/empty-gun-shot.mp3');
        
        // 필드 관련
        this.preload('field', 'sound/magic_casting.mp3');  // 필드 효과 활성화 (마법 사운드 재사용)
        
        // 전역 클릭 이벤트에 선택 사운드 연결
        this.bindSelectSound();
        
        this.initialized = true;
        console.log('[Sound] 사운드 시스템 초기화 완료 - 총', Object.keys(this.sounds).length, '개 사운드 로드');
    },
    
    // 선택 사운드 바인딩
    bindSelectSound() {
        document.addEventListener('click', (e) => {
            // 클릭 가능한 요소들
            const clickable = e.target.closest('button, .card, .choice-btn, .ds-button, .debug-btn, .reward-choice, .shop-card-slot, .shop-relic-slot, .ds-job-item, .worldmap-location, .menu-item, .tab, .debug-tab, .relic-item, .upgrade-card-btn, [onclick], .clickable');
            
            if (clickable && !clickable.disabled) {
                this.playSelect();
            }
        }, true);
    },
    
    // 사운드 프리로드
    preload(name, path) {
        try {
            const audio = new Audio(path);
            audio.volume = this.volume;
            audio.preload = 'auto';
            this.sounds[name] = {
                path: path,
                instances: [audio]
            };
            console.log(`[Sound] 프리로드: ${name}`);
        } catch (e) {
            console.warn(`[Sound] 프리로드 실패: ${name}`, e);
        }
    },
    
    // 사운드 재생 (다중 재생 지원)
    play(name, options = {}) {
        if (!this.enabled) return;
        
        const sound = this.sounds[name];
        if (!sound) {
            // 동적 로드 시도
            console.warn(`[Sound] 사운드 없음: ${name}, 동적 로드 시도...`);
            this.preload(name, `sound/${name}.mp3`);
            return;
        }
        
        // 재생 가능한 인스턴스 찾기
        let audio = sound.instances.find(a => a.paused || a.ended);
        
        // 없으면 새 인스턴스 생성 (최대 5개)
        if (!audio && sound.instances.length < 5) {
            audio = new Audio(sound.path);
            sound.instances.push(audio);
        }
        
        // 여전히 없으면 첫 번째 인스턴스 재사용
        if (!audio) {
            audio = sound.instances[0];
            audio.currentTime = 0;
        }
        
        // 볼륨 설정
        audio.volume = Math.min(1, (options.volume !== undefined ? options.volume : this.volume));
        
        // 피치 변화 (약간의 랜덤성)
        if (options.randomPitch) {
            audio.playbackRate = 0.9 + Math.random() * 0.2;
        } else {
            audio.playbackRate = options.pitch || 1.0;
        }
        
        // 재생
        audio.currentTime = 0;
        audio.play().catch(e => {
            // 사용자 상호작용 필요한 경우 무시
            if (e.name !== 'NotAllowedError') {
                console.warn('[Sound] 재생 실패:', e);
            }
        });
    },
    
    // ==========================================
    // 히트 사운드 재생 (타격 강도에 따라)
    // ==========================================
    playHit(intensity = 'normal') {
        const options = {
            randomPitch: true
        };
        
        switch (intensity) {
            case 'light':
                options.volume = this.volume * 0.6;
                break;
            case 'heavy':
                options.volume = this.volume * 1.2;
                options.pitch = 0.85;
                break;
            case 'critical':
                options.volume = this.volume * 1.5;
                options.pitch = 0.75;
                // 크리티컬 시 피 튀는 소리도 같이 재생
                this.play('hit_blood', { volume: this.volume * 0.6, randomPitch: true });
                break;
            default:
                options.volume = this.volume;
        }
        
        // 현재 직업의 추가 공격 사운드가 있으면 먼저 재생 (휘두르는 소리)
        if (typeof JobSystem !== 'undefined') {
            const currentJob = JobSystem.getCurrentJob();
            if (currentJob && currentJob.attackSound) {
                this.play(currentJob.attackSound, {
                    volume: this.volume * 1.0,
                    randomPitch: true
                });
            }
        }
        
        // 공용 타격 사운드 재생 (약간 딜레이)
        setTimeout(() => {
            this.play('hit', options);
        }, 80);
    },
    
    // ==========================================
    // 카드 사운드
    // ==========================================
    playCardDraw() {
        this.play('card_draw', {
            volume: this.volume * 0.6,
            randomPitch: true
        });
    },
    
    playCardUse() {
        this.play('card_use', {
            volume: this.volume * 0.7,
            randomPitch: true
        });
    },
    
    // ==========================================
    // 방어/쉴드 사운드
    // ==========================================
    playShield() {
        this.play('shield', {
            volume: this.volume * 0.7
        });
    },
    
    playShieldHit() {
        this.play('shield_hit', {
            volume: this.volume * 0.8,
            randomPitch: true
        });
    },
    
    playShieldBreak() {
        this.play('shield_break', {
            volume: this.volume * 1.0
        });
    },
    
    // ==========================================
    // 전투 관련 사운드
    // ==========================================
    playEvade() {
        this.play('evade', {
            volume: this.volume * 0.7
        });
    },
    
    playHide() {
        this.play('hide', {
            volume: this.volume * 0.6
        });
    },
    
    playReady() {
        this.play('ready', {
            volume: this.volume * 0.7
        });
    },
    
    playBattleStart() {
        this.play('battlestart', {
            volume: this.volume * 0.8
        });
    },
    
    playBattleIntro() {
        this.play('battleintro', {
            volume: this.volume * 0.6
        });
    },
    
    // 🌑 도적 기습 사운드
    playAmbush() {
        this.play('ambush', {
            volume: this.volume * 0.8
        });
    },
    
    // ==========================================
    // 갬블러 전용 사운드
    // ==========================================
    playRevolverSpin() {
        this.play('revolver_spin', {
            volume: this.volume * 0.8
        });
    },
    
    playGunShot() {
        this.play('gun_shot', {
            volume: this.volume * 0.9
        });
    },
    
    playEmptyGun() {
        this.play('empty_gun', {
            volume: this.volume * 0.7
        });
    },
    
    // ==========================================
    // 기존 사운드 함수들
    // ==========================================
    
    // 칼 휘두르는 사운드 재생 (도적용)
    playKnifeSwish() {
        this.play('knife_swish', {
            volume: this.volume * 0.8,
            randomPitch: true
        });
    },
    
    // 선택 사운드 재생
    playSelect() {
        this.play('select', {
            volume: this.volume * 0.7,
            randomPitch: true
        });
    },
    
    // 레이저 사운드 재생
    playLaser() {
        this.play('laser', {
            volume: this.volume * 0.8
        });
    },
    
    // 마법 시전 사운드 재생
    playMagic() {
        this.play('magic', {
            volume: this.volume * 0.8
        });
    },
    
    // ==========================================
    // 볼륨 및 설정
    // ==========================================
    
    // 볼륨 설정
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        console.log(`[Sound] 볼륨: ${Math.round(this.volume * 100)}%`);
    },
    
    // 사운드 활성화/비활성화
    toggle() {
        this.enabled = !this.enabled;
        console.log(`[Sound] ${this.enabled ? '활성화' : '비활성화'}`);
        return this.enabled;
    },
    
    // 음소거
    mute() {
        this.enabled = false;
    },
    
    // 음소거 해제
    unmute() {
        this.enabled = true;
    }
};

// 전역 등록
window.SoundSystem = SoundSystem;

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SoundSystem.init());
} else {
    SoundSystem.init();
}

console.log('[SoundSystem] 사운드 시스템 로드됨');
