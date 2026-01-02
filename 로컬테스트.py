#!/usr/bin/env python3
"""
Shadow Deck - 로컬 테스트 서버 (GUI)
CORS 허용, 텍스처/모델 로드 지원
"""

import http.server
import socketserver
import threading
import webbrowser
import tkinter as tk
from tkinter import ttk
import os

PORT = 8000
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))

class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SERVER_DIR, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # GUI에 로그 표시
        if hasattr(self, 'server') and hasattr(self.server, 'log_callback'):
            self.server.log_callback(f"{args[0]}")


class ServerGUI:
    def __init__(self):
        self.server = None
        self.server_thread = None
        self.running = False
        
        # 윈도우 생성
        self.root = tk.Tk()
        self.root.title("Shadow Deck - 로컬 서버")
        self.root.geometry("450x350")
        self.root.resizable(False, False)
        self.root.configure(bg='#1a1a2e')
        
        self.setup_ui()
        
    def setup_ui(self):
        # 스타일
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('Title.TLabel', 
                       background='#1a1a2e', 
                       foreground='#ffd700',
                       font=('맑은 고딕', 16, 'bold'))
        style.configure('Info.TLabel',
                       background='#1a1a2e',
                       foreground='#a0a0b0',
                       font=('맑은 고딕', 10))
        style.configure('Status.TLabel',
                       background='#1a1a2e',
                       foreground='#60a0ff',
                       font=('맑은 고딕', 11))
        style.configure('Start.TButton',
                       font=('맑은 고딕', 11, 'bold'),
                       padding=10)
        style.configure('Stop.TButton',
                       font=('맑은 고딕', 11),
                       padding=10)
        
        # 제목
        title = ttk.Label(self.root, text="⚔️ Shadow Deck Server", style='Title.TLabel')
        title.pack(pady=(20, 5))
        
        subtitle = ttk.Label(self.root, text="CORS 허용 로컬 테스트 서버", style='Info.TLabel')
        subtitle.pack(pady=(0, 20))
        
        # URL 프레임
        url_frame = tk.Frame(self.root, bg='#252540', padx=15, pady=10)
        url_frame.pack(fill='x', padx=20)
        
        url_label = tk.Label(url_frame, text="접속 주소:", bg='#252540', fg='#808090', 
                            font=('맑은 고딕', 9))
        url_label.pack(anchor='w')
        
        self.url_var = tk.StringVar(value=f"http://localhost:{PORT}")
        url_entry = tk.Entry(url_frame, textvariable=self.url_var, 
                            font=('Consolas', 12), bg='#1a1a2e', fg='#60ff60',
                            relief='flat', state='readonly', width=35)
        url_entry.pack(pady=(5, 0), fill='x')
        
        # 상태
        self.status_var = tk.StringVar(value="● 서버 대기 중")
        status_label = ttk.Label(self.root, textvariable=self.status_var, style='Status.TLabel')
        status_label.pack(pady=15)
        
        # 버튼 프레임
        btn_frame = tk.Frame(self.root, bg='#1a1a2e')
        btn_frame.pack(pady=10)
        
        self.start_btn = tk.Button(btn_frame, text="▶ 서버 시작", 
                                   command=self.start_server,
                                   bg='#2d5a2d', fg='white',
                                   font=('맑은 고딕', 11, 'bold'),
                                   width=12, height=2,
                                   relief='flat', cursor='hand2')
        self.start_btn.pack(side='left', padx=5)
        
        self.stop_btn = tk.Button(btn_frame, text="■ 서버 중지",
                                  command=self.stop_server,
                                  bg='#5a2d2d', fg='white',
                                  font=('맑은 고딕', 11),
                                  width=12, height=2,
                                  relief='flat', cursor='hand2',
                                  state='disabled')
        self.stop_btn.pack(side='left', padx=5)
        
        self.browser_btn = tk.Button(btn_frame, text="🌐 브라우저",
                                     command=self.open_browser,
                                     bg='#2d4a5a', fg='white',
                                     font=('맑은 고딕', 11),
                                     width=12, height=2,
                                     relief='flat', cursor='hand2',
                                     state='disabled')
        self.browser_btn.pack(side='left', padx=5)
        
        # 로그
        log_label = tk.Label(self.root, text="최근 요청:", bg='#1a1a2e', fg='#606070',
                            font=('맑은 고딕', 9))
        log_label.pack(anchor='w', padx=20, pady=(15, 0))
        
        self.log_text = tk.Text(self.root, height=4, bg='#0a0a15', fg='#505060',
                               font=('Consolas', 9), relief='flat', state='disabled')
        self.log_text.pack(fill='x', padx=20, pady=(5, 15))
        
        # 종료 시 서버 중지
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
    def log(self, message):
        self.log_text.configure(state='normal')
        self.log_text.insert('end', f"{message}\n")
        self.log_text.see('end')
        # 최대 100줄 유지
        lines = int(self.log_text.index('end-1c').split('.')[0])
        if lines > 100:
            self.log_text.delete('1.0', '2.0')
        self.log_text.configure(state='disabled')
        
    def start_server(self):
        if self.running:
            return
            
        try:
            self.server = socketserver.TCPServer(("", PORT), CORSHandler)
            self.server.log_callback = self.log
            self.server_thread = threading.Thread(target=self.server.serve_forever)
            self.server_thread.daemon = True
            self.server_thread.start()
            
            self.running = True
            self.status_var.set("● 서버 실행 중")
            self.start_btn.configure(state='disabled', bg='#404040')
            self.stop_btn.configure(state='normal', bg='#8b3030')
            self.browser_btn.configure(state='normal', bg='#3080a0')
            self.log(f"서버 시작: http://localhost:{PORT}")
            
        except OSError as e:
            self.status_var.set(f"● 오류: 포트 {PORT} 사용 중")
            self.log(f"오류: {e}")
            
    def stop_server(self):
        if not self.running:
            return
            
        self.server.shutdown()
        self.running = False
        self.status_var.set("● 서버 중지됨")
        self.start_btn.configure(state='normal', bg='#2d5a2d')
        self.stop_btn.configure(state='disabled', bg='#5a2d2d')
        self.browser_btn.configure(state='disabled', bg='#2d4a5a')
        self.log("서버 중지")
        
    def open_browser(self):
        webbrowser.open(f"http://localhost:{PORT}")
        self.log("브라우저 열기")
        
    def on_close(self):
        if self.running:
            self.stop_server()
        self.root.destroy()
        
    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    app = ServerGUI()
    app.run()
