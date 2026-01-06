// ==========================================
// Image Preloader - 게임 시작 전 이미지 프리로드
// ==========================================

const ImagePreloader = {
    // 로드할 이미지 목록
    images: [],
    loadedCount: 0,
    totalCount: 0,
    isLoaded: false,
    
    // 프리로드할 이미지 경로들 (모든 게임 이미지)
    imagePaths: [
        // 캐릭터
        'hero.png',
        'hero_slash.png',
        'hero_mage.png',
        'hero_mage_slash.png',
        'hero_ninja.png',
        'hero_ninja_slash.png',
        
        // 몬스터
        'goblin.png',
        'goblinarcher.png',
        'goblinking.png',
        'goblinshaman.png',
        'skeleton.png',
        'slime.png',
        'minislime.png',
        'spider.png',
        'giantspider.png',
        'wolf.png',
        'spikemonster.png',
        'burningmonster.png',
        'phoenix.png',
        'elderelf.png',
        
        // 카드 아이콘
        'energybolt.png',
        'arcanebolt.png',
        'etherarrow.png',
        'magicdef.png',
        'magicT.png',
        'medi.png',
        'time.png',
        'basicattack.png',
        'slash.png',
        'dagger.png',
        'shield.png',
        'mastersword.png',
        'chakramthrow.png',
        'combo.png',
        'critical.png',
        'highattack.png',
        'threepower.png',
        'bleed.png',
        'dando.png',
        'gangta.png',
        'gangtal.png',
        'skill_biyul.png',
        
        // NPC/동료
        'ally_archer.png',
        'hoodgirl.png',
        'blacksmith.png',
        'cage.png',
        'magic_girl.png',
        'magic_girl_potrait.png',
        
        // 배경
        'bg.png',
        'bg-sky.png',
        'bg-floor.png',
        'bg-wall.png',
        'intro.bg.png',
        'town.png',
        'camp.png',
        
        // 기타
        'meat.png',
        'overkill.png',
        'diamond.png',
        'monster.png',
        
        // 보물상자 & 미믹
        'mimic.png',
        'chest.png',
        'chest_open.png'
    ],
    
    // 프리로드 시작
    preload(onProgress, onComplete) {
        console.log('[ImagePreloader] 이미지 프리로드 시작...');
        
        this.loadedCount = 0;
        this.totalCount = this.imagePaths.length;
        this.isLoaded = false;
        this.images = [];
        
        if (this.totalCount === 0) {
            this.isLoaded = true;
            if (onComplete) onComplete();
            return;
        }
        
        this.imagePaths.forEach((path, index) => {
            const img = new Image();
            
            img.onload = () => {
                this.loadedCount++;
                console.log(`[ImagePreloader] 로드 완료 (${this.loadedCount}/${this.totalCount}): ${path}`);
                
                if (onProgress) {
                    onProgress(this.loadedCount, this.totalCount, path);
                }
                
                if (this.loadedCount >= this.totalCount) {
                    this.isLoaded = true;
                    console.log('[ImagePreloader] ✅ 모든 이미지 로드 완료!');
                    if (onComplete) onComplete();
                }
            };
            
            img.onerror = () => {
                this.loadedCount++;
                console.warn(`[ImagePreloader] 로드 실패: ${path}`);
                
                if (onProgress) {
                    onProgress(this.loadedCount, this.totalCount, path);
                }
                
                if (this.loadedCount >= this.totalCount) {
                    this.isLoaded = true;
                    console.log('[ImagePreloader] ✅ 이미지 로드 완료 (일부 실패)');
                    if (onComplete) onComplete();
                }
            };
            
            img.src = path;
            this.images.push(img);
        });
    },
    
    // 진행률 (0~100)
    getProgress() {
        if (this.totalCount === 0) return 100;
        return Math.floor((this.loadedCount / this.totalCount) * 100);
    },
    
    // 몬스터 이미지 동적 추가
    addMonsterImages(monsterIds) {
        const newPaths = [];
        
        monsterIds.forEach(id => {
            const path = `${id}.png`;
            if (!this.imagePaths.includes(path)) {
                this.imagePaths.push(path);
                newPaths.push(path);
            }
        });
        
        // 새로운 이미지만 추가 로드
        newPaths.forEach(path => {
            const img = new Image();
            img.src = path;
            this.images.push(img);
        });
    }
};

// 전역 노출
window.ImagePreloader = ImagePreloader;

console.log('[ImagePreloader] image-preloader.js 로드 완료');

