// ==========================================
// Language System - 다국어 지원
// ==========================================

const LanguageSystem = {
    // 현재 언어 설정 ('en' 또는 'kr')
    currentLang: 'en',
    
    // ==========================================
    // 언어 변경
    // ==========================================
    setLanguage(lang) {
        if (lang !== 'en' && lang !== 'kr') {
            console.warn(`[Language] Invalid language: ${lang}`);
            return;
        }
        
        this.currentLang = lang;
        localStorage.setItem('gameLanguage', lang);
        console.log(`[Language] Changed to: ${lang}`);
        
        // UI 업데이트
        this.updateAllUI();
    },
    
    // ==========================================
    // 언어 토글
    // ==========================================
    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'kr' : 'en';
        this.setLanguage(newLang);
        return newLang;
    },
    
    // ==========================================
    // 저장된 언어 불러오기
    // ==========================================
    loadSavedLanguage() {
        const saved = localStorage.getItem('gameLanguage');
        if (saved === 'en' || saved === 'kr') {
            this.currentLang = saved;
        }
        console.log(`[Language] Loaded: ${this.currentLang}`);
    },
    
    // ==========================================
    // 텍스트 가져오기 (객체에서)
    // ==========================================
    getText(obj, field) {
        if (!obj) return '';
        
        const krField = field + '_kr';
        
        if (this.currentLang === 'kr' && obj[krField]) {
            return obj[krField];
        }
        
        return obj[field] || '';
    },
    
    // ==========================================
    // 이름 가져오기
    // ==========================================
    getName(obj) {
        return this.getText(obj, 'name');
    },
    
    // ==========================================
    // 설명 가져오기
    // ==========================================
    getDescription(obj) {
        return this.getText(obj, 'description');
    },
    
    // ==========================================
    // 모든 UI 업데이트
    // ==========================================
    updateAllUI() {
        // 유물 UI 업데이트
        if (typeof RelicSystem !== 'undefined') {
            RelicSystem.updateRelicUI();
        }
        
        // 손패 카드 업데이트
        if (typeof renderHand === 'function') {
            renderHand();
        }
        
        // 언어 버튼 업데이트
        this.updateLanguageButton();
    },
    
    // ==========================================
    // 언어 버튼 업데이트
    // ==========================================
    updateLanguageButton() {
        const btn = document.getElementById('language-toggle-btn');
        if (btn) {
            btn.textContent = this.currentLang.toUpperCase();
            btn.title = this.currentLang === 'en' ? 'Switch to Korean' : 'Switch to English';
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.loadSavedLanguage();
        this.createLanguageToggle();
        console.log('[Language] Initialized');
    },
    
    // ==========================================
    // 언어 토글 버튼 생성
    // ==========================================
    createLanguageToggle() {
        // 이미 존재하면 스킵
        if (document.getElementById('language-toggle-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'language-toggle-btn';
        btn.className = 'language-toggle';
        btn.textContent = this.currentLang.toUpperCase();
        btn.title = this.currentLang === 'en' ? 'Switch to Korean' : 'Switch to English';
        btn.onclick = () => {
            this.toggleLanguage();
        };
        
        document.body.appendChild(btn);
    }
};

// ==========================================
// CSS 스타일 주입
// ==========================================
const languageStyles = document.createElement('style');
languageStyles.textContent = `
    .language-toggle {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        background: rgba(20, 20, 30, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #aaa;
        font-size: 0.7rem;
        font-weight: bold;
        cursor: pointer;
        z-index: 99999;
        transition: all 0.2s;
        font-family: 'Segoe UI', sans-serif;
    }
    
    .language-toggle:hover {
        background: rgba(40, 40, 60, 0.95);
        border-color: rgba(255, 255, 255, 0.4);
        color: #fff;
        transform: scale(1.05);
    }
`;
document.head.appendChild(languageStyles);

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    LanguageSystem.init();
});

console.log('[Language] Loaded');

