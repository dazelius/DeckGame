// ==========================================
// Shadow Deck - Electron Preload 스크립트
// ==========================================

const { contextBridge, ipcRenderer } = require('electron');

// 게임에서 사용할 수 있는 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 세이브/로드
    saveGame: (saveData) => ipcRenderer.invoke('save-game', saveData),
    loadGame: () => ipcRenderer.invoke('load-game'),
    
    // 앱 정보
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // 화면
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    
    // 플랫폼 확인
    isElectron: true,
    platform: process.platform
});

console.log('[Electron] Preload 스크립트 로드됨');

