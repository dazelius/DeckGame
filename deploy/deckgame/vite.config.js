import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    // 루트 디렉토리
    root: '.',
    
    // Firebase 서브 경로 배포용 base 설정
    base: '/deckgame/',
    
    // 빌드 설정
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        // 모든 JS/CSS를 번들링하지 않고 그대로 복사
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
            },
            output: {
                // 에셋 파일명 유지
                assetFileNames: 'assets/[name].[ext]',
                chunkFileNames: '[name].js',
                entryFileNames: '[name].js'
            }
        }
    },
    
    // 개발 서버
    server: {
        port: 5173,
        open: false  // Electron에서 열기 때문에 자동 열기 비활성화
    },
    
    // 경로 별칭
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@types': path.resolve(__dirname, './src/types'),
        }
    },
    
    // 정적 파일 없음 (루트에서 직접 로드)
    publicDir: false,
    
    // CSS
    css: {
        devSourcemap: true
    }
});

