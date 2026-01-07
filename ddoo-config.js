// =====================================================
// DDOO 전역 설정
// =====================================================

const DDOOConfig = {
    // 이미지 경로 프리픽스
    imagePath: 'image/',
    
    // 이미지 경로 변환
    getImagePath(filename) {
        // 이미 전체 경로면 그대로 반환
        if (filename.startsWith('http') || filename.startsWith('data:') || filename.startsWith(this.imagePath)) {
            return filename;
        }
        return this.imagePath + filename;
    },
    
    // 설정 변경
    setImagePath(path) {
        this.imagePath = path.endsWith('/') ? path : path + '/';
        console.log(`[DDOOConfig] 이미지 경로: ${this.imagePath}`);
    }
};

// 전역 노출
window.DDOOConfig = DDOOConfig;

console.log(`[DDOOConfig] ✅ 전역 설정 로드됨 (이미지 경로: ${DDOOConfig.imagePath})`);
