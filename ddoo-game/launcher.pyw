#!/usr/bin/env python3
"""
🎮 DDOO Game Launcher
GUI로 로컬 서버 실행 & 게임/스튜디오 열기
"""

import tkinter as tk
from tkinter import ttk, messagebox
import http.server
import socketserver
import threading
import webbrowser
import os
import sys

class DDOOLauncher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🎮 DDOO Game Launcher")
        self.root.geometry("400x500")
        self.root.resizable(False, False)
        self.root.configure(bg="#1a1a2e")
        
        # 서버 상태
        self.server = None
        self.server_thread = None
        self.port = 3000
        self.is_running = False
        
        # 작업 디렉토리 설정
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        self.create_ui()
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
    def create_ui(self):
        # 스타일 설정
        style = ttk.Style()
        style.theme_use('clam')
        
        # 헤더
        header = tk.Frame(self.root, bg="#0f0f1a", height=80)
        header.pack(fill="x")
        header.pack_propagate(False)
        
        title = tk.Label(
            header, 
            text="🎮 DDOO Game", 
            font=("Segoe UI", 24, "bold"),
            fg="#fbbf24",
            bg="#0f0f1a"
        )
        title.pack(pady=20)
        
        # 메인 컨테이너
        main = tk.Frame(self.root, bg="#1a1a2e", padx=30, pady=20)
        main.pack(fill="both", expand=True)
        
        # 서버 상태
        self.status_frame = tk.Frame(main, bg="#252538", padx=15, pady=15)
        self.status_frame.pack(fill="x", pady=(0, 20))
        
        tk.Label(
            self.status_frame,
            text="서버 상태",
            font=("Segoe UI", 10),
            fg="#888",
            bg="#252538"
        ).pack(anchor="w")
        
        self.status_label = tk.Label(
            self.status_frame,
            text="⚫ 중지됨",
            font=("Segoe UI", 14, "bold"),
            fg="#ef4444",
            bg="#252538"
        )
        self.status_label.pack(anchor="w", pady=(5, 0))
        
        self.url_label = tk.Label(
            self.status_frame,
            text="",
            font=("Segoe UI", 10),
            fg="#60a5fa",
            bg="#252538",
            cursor="hand2"
        )
        self.url_label.pack(anchor="w", pady=(5, 0))
        self.url_label.bind("<Button-1>", lambda e: self.open_game())
        
        # 포트 설정
        port_frame = tk.Frame(main, bg="#1a1a2e")
        port_frame.pack(fill="x", pady=(0, 15))
        
        tk.Label(
            port_frame,
            text="포트:",
            font=("Segoe UI", 10),
            fg="#888",
            bg="#1a1a2e"
        ).pack(side="left")
        
        self.port_entry = tk.Entry(
            port_frame,
            font=("Segoe UI", 12),
            width=8,
            bg="#252538",
            fg="#fff",
            insertbackground="#fff",
            relief="flat",
            highlightthickness=1,
            highlightbackground="#3a3a5a"
        )
        self.port_entry.insert(0, "3000")
        self.port_entry.pack(side="left", padx=(10, 0))
        
        # 버튼들
        btn_style = {
            "font": ("Segoe UI", 12, "bold"),
            "width": 25,
            "height": 2,
            "relief": "flat",
            "cursor": "hand2"
        }
        
        # 서버 시작/중지 버튼
        self.server_btn = tk.Button(
            main,
            text="▶ 서버 시작",
            bg="#22c55e",
            fg="#fff",
            activebackground="#16a34a",
            activeforeground="#fff",
            command=self.toggle_server,
            **btn_style
        )
        self.server_btn.pack(pady=8)
        
        # 게임 열기 버튼
        self.game_btn = tk.Button(
            main,
            text="🎮 게임 열기",
            bg="#3b82f6",
            fg="#fff",
            activebackground="#2563eb",
            activeforeground="#fff",
            command=self.open_game,
            state="disabled",
            **btn_style
        )
        self.game_btn.pack(pady=8)
        
        # 액션 스튜디오 열기 버튼
        self.studio_btn = tk.Button(
            main,
            text="🎬 액션 스튜디오",
            bg="#a855f7",
            fg="#fff",
            activebackground="#9333ea",
            activeforeground="#fff",
            command=self.open_studio,
            state="disabled",
            **btn_style
        )
        self.studio_btn.pack(pady=8)
        
        # 렌더러 스튜디오 열기 버튼
        self.renderer_btn = tk.Button(
            main,
            text="🖼️ 렌더러 스튜디오",
            bg="#f472b6",
            fg="#fff",
            activebackground="#ec4899",
            activeforeground="#fff",
            command=self.open_renderer,
            state="disabled",
            **btn_style
        )
        self.renderer_btn.pack(pady=8)
        
        # 폴더 열기 버튼
        folder_btn = tk.Button(
            main,
            text="📁 프로젝트 폴더 열기",
            bg="#4a4a6a",
            fg="#fff",
            activebackground="#5a5a7a",
            activeforeground="#fff",
            command=self.open_folder,
            **btn_style
        )
        folder_btn.pack(pady=8)
        
        # 푸터
        footer = tk.Label(
            self.root,
            text="💀 Dark Souls Style Deck Builder",
            font=("Segoe UI", 9),
            fg="#555",
            bg="#1a1a2e"
        )
        footer.pack(pady=10)
        
    def toggle_server(self):
        if self.is_running:
            self.stop_server()
        else:
            self.start_server()
            
    def start_server(self):
        try:
            self.port = int(self.port_entry.get())
        except ValueError:
            messagebox.showerror("오류", "올바른 포트 번호를 입력하세요")
            return
            
        try:
            handler = http.server.SimpleHTTPRequestHandler
            handler.extensions_map.update({
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.mp3': 'audio/mpeg',
            })
            
            self.server = socketserver.TCPServer(("", self.port), handler)
            self.server_thread = threading.Thread(target=self.server.serve_forever)
            self.server_thread.daemon = True
            self.server_thread.start()
            
            self.is_running = True
            self.update_ui_running()
            
        except OSError as e:
            if "Address already in use" in str(e) or "10048" in str(e):
                messagebox.showerror("오류", f"포트 {self.port}이(가) 이미 사용 중입니다.\n다른 포트를 사용하세요.")
            else:
                messagebox.showerror("오류", f"서버 시작 실패: {e}")
                
    def stop_server(self):
        if self.server:
            self.server.shutdown()
            self.server = None
            
        self.is_running = False
        self.update_ui_stopped()
        
    def update_ui_running(self):
        self.status_label.config(text="🟢 실행 중", fg="#22c55e")
        self.url_label.config(text=f"http://localhost:{self.port}")
        self.server_btn.config(text="⏹ 서버 중지", bg="#ef4444", activebackground="#dc2626")
        self.game_btn.config(state="normal")
        self.studio_btn.config(state="normal")
        self.renderer_btn.config(state="normal")
        self.port_entry.config(state="disabled")
        
    def update_ui_stopped(self):
        self.status_label.config(text="⚫ 중지됨", fg="#ef4444")
        self.url_label.config(text="")
        self.server_btn.config(text="▶ 서버 시작", bg="#22c55e", activebackground="#16a34a")
        self.game_btn.config(state="disabled")
        self.studio_btn.config(state="disabled")
        self.renderer_btn.config(state="disabled")
        self.port_entry.config(state="normal")
        
    def open_game(self):
        if self.is_running:
            webbrowser.open(f"http://localhost:{self.port}")
            
    def open_studio(self):
        if self.is_running:
            webbrowser.open(f"http://localhost:{self.port}/studio.html")
            
    def open_renderer(self):
        if self.is_running:
            webbrowser.open(f"http://localhost:{self.port}/renderer.html")
            
    def open_folder(self):
        os.startfile(os.getcwd())
        
    def on_close(self):
        if self.is_running:
            self.stop_server()
        self.root.destroy()
        
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = DDOOLauncher()
    app.run()
