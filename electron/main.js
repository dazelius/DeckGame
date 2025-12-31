// ==========================================
// Shadow Deck - Electron 메인 프로세스
// ==========================================

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 개발 모드 확인
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 600,
        
        // 프레임 설정
        frame: true,
        titleBarStyle: 'default',
        
        // 아이콘
        icon: path.join(__dirname, '../assets/icon.png'),
        
        // 웹 환경 설정
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        
        // 배경색
        backgroundColor: '#0a0a0f',
        
        // 로딩 중 보이지 않음
        show: false
    });

    // 개발 모드: localhost, 프로덕션: 패키징된 파일
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // 패키징된 앱에서는 루트의 index.html 로드
        mainWindow.loadFile(path.join(__dirname, '../index.html'));
    }

    // 준비되면 표시
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 전체화면 토글 (F11)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11') {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 앱 준비 완료
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 모든 창 닫힘
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ==========================================
// IPC 핸들러 (게임 ↔ Electron 통신)
// ==========================================

// 세이브 파일 저장
ipcMain.handle('save-game', async (event, saveData) => {
    const fs = require('fs');
    const savePath = path.join(app.getPath('userData'), 'save.json');
    
    try {
        fs.writeFileSync(savePath, JSON.stringify(saveData, null, 2));
        return { success: true, path: savePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 세이브 파일 로드
ipcMain.handle('load-game', async () => {
    const fs = require('fs');
    const savePath = path.join(app.getPath('userData'), 'save.json');
    
    try {
        if (fs.existsSync(savePath)) {
            const data = fs.readFileSync(savePath, 'utf-8');
            return { success: true, data: JSON.parse(data) };
        }
        return { success: false, error: 'No save file' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 앱 버전 가져오기
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// 전체화면 토글
ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        return mainWindow.isFullScreen();
    }
    return false;
});

