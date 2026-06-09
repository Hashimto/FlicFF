import os
import sys
import re
import math
import json
import urllib.request
import zipfile
import shutil
import threading
import subprocess
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# Simple Drag and Drop handling using tkinter runtime drop if tkinterdnd2 is available, 
# otherwise fall back to clicking the selection panel.
try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    HAS_DND = True
except ImportError:
    HAS_DND = False

# Version information
VERSION = "1.0.0"

# Application Settings and Translations
TRANSLATIONS = {
    "en": {
        "title": "FlicFF Audio/Video Converter",
        "audio_tab": "Audio Output",
        "video_tab": "Video Output",
        "drop_area": "Select or\nDrop Files",
        "drop_area_active": "Drop Files Here",
        "delete_input": "Delete input file",
        "always_on_top": "Always on top",
        "quality_preset": "Quality Presets",
        "quality_low": "Low Quality (Fast)",
        "quality_normal": "Normal Quality",
        "quality_cd": "CD Quality (High)",
        "quality_studio": "Studio Quality (Ultra)",
        "about": "About FlicFF",
        "lang_switch": "日本語 (Japanese)",
        "no_ffmpeg": "FFmpeg not found! Would you like to auto-download standard FFmpeg to the application directory?",
        "downloading": "Downloading FFmpeg...",
        "download_done": "FFmpeg download and configuration completed successfully!",
        "download_failed": "Failed to auto-download FFmpeg. Please install it manually and add it to your system PATH.",
        "converting": "Converting: {percent}%",
        "success": "Conversion completed successfully!",
        "error_audio_video": "Cannot convert Audio files to Video output.",
        "progress_speed": "Speed: {speed} | Time: {time}",
        "done": "Done!",
        "theme_dark": "Dark Mode",
        "theme_light": "Light Mode",
        "error_proc": "Error occurred during conversion:\n{error}",
        "no_file_err": "Please select or drop a valid file first."
    },
    "ja": {
        "title": "FlicFF",
        "audio_tab": "音声出力",
        "video_tab": "映像出力",
        "drop_area": "ファイルを選択\nまたはドロップ",
        "drop_area_active": "ここにドロップ",
        "delete_input": "変換後に元のファイルを削除",
        "always_on_top": "常に最前面に表示",
        "quality_preset": "品質プリセット",
        "quality_low": "低品質 (高速)",
        "quality_normal": "標準品質",
        "quality_cd": "CD品質 (高音質/高画質)",
        "quality_studio": "スタジオ品質 (超高音質/超高画質)",
        "about": "FlicFFについて",
        "lang_switch": "English (英語)",
        "no_ffmpeg": "FFmpegが見つかりませんでした。アプリケーションフォルダにFFmpegを自動ダウンロードして配置しますか？",
        "downloading": "FFmpegを自動ダウンロード中...",
        "download_done": "FFmpegのダウンロードと配置が完了しました！",
        "download_failed": "FFmpegの自動ダウンロードに失敗しました。お手数ですが手動でPATHを通すか、同じフォルダに配置してください。",
        "converting": "変換中: {percent}%",
        "success": "変換が正常に完了しました！",
        "error_audio_video": "音声ファイルを映像出力フォーマットに変換することはできません。",
        "progress_speed": "速度: {speed} | 経過時間: {time}",
        "done": "完了！",
        "theme_dark": "ダークモード",
        "theme_light": "ライトモード",
        "error_proc": "変換中にエラーが発生しました:\n{error}",
        "no_file_err": "有効なファイルを選択またはドロップしてください。"
    }
}

# Theme Color palettes
THEMES = {
    "light": {
        "bg": "#F5F5F7",
        "card": "#FFFFFF",
        "text": "#1D1D1F",
        "text_sec": "#86868B",
        "accent": "#0071E3",
        "accent_hover": "#0077ED",
        "border": "#D2D2D7",
        "btn_bg": "#E8E8ED",
        "btn_fg": "#1D1D1F",
        "progress_bg": "#E5E5EA",
        "progress_bar": "#34C759"
    },
    "dark": {
        "bg": "#1E1E1E",
        "card": "#2D2D2D",
        "text": "#E3E3E3",
        "text_sec": "#9A9A9A",
        "accent": "#0071E3",
        "accent_hover": "#0077ED",
        "border": "#424242",
        "btn_bg": "#3A3A3D",
        "btn_fg": "#FFFFFF",
        "progress_bg": "#2C2C2E",
        "progress_bar": "#30D158"
    }
}

class FlicFFApp:
    def __init__(self, root):
        self.root = root
        
        # Default Settings
        self.lang = "ja"  # Default to Japanese (User intent / Japanese prompt)
        self.theme = "dark" # Default modern Dark Mode
        self.always_on_top = tk.BooleanVar(value=True)
        self.delete_input = tk.BooleanVar(value=False)
        self.current_tab = "audio" # 'audio' or 'video'
        
        # Audio & Video parameters
        self.selected_file_path = ""
        self.quality = "cd" # low, normal, cd, studio
        self.converting = False
        
        # Window attributes
        self.root.title(TRANSLATIONS[self.lang]["title"])
        self.root.geometry("340x480")
        self.root.resizable(False, False)
        self.root.call('wm', 'attributes', '.', '-topmost', self.always_on_top.get())
        
        # Locate ffmpeg
        self.ffmpeg_path = self.find_ffmpeg()
        
        # Create UI Parts
        self.setup_ui_styles()
        self.create_widgets()
        
        # Bind events
        self.always_on_top.trace_add("write", self.on_topmost_changed)
        
        # Bind DnD if available
        if HAS_DND:
            self.root.drop_target_register(DND_FILES)
            self.root.dnd_bind('<<Drop>>', self.on_file_drop)
            
        # Draw initial interface
        self.apply_theme()
        self.update_ui_strings()

        # Check FFmpeg on launch in background thread to avoid block
        if not self.ffmpeg_path:
            self.root.after(1000, self.prompt_ffmpeg_download)

    def find_ffmpeg(self):
        """Attempts to find FFmpeg in PATH or relative paths."""
        # 1. Check in PATH
        path_ffmpeg = shutil.which("ffmpeg")
        if path_ffmpeg:
            return path_ffmpeg
            
        # 2. Check local directories (for packaged standalone installation)
        app_dir = os.path.dirname(os.path.abspath(__file__))
        ext = ".exe" if sys.platform.startswith("win") else ""
        local_ffmpeg = os.path.join(app_dir, "ffmpeg" + ext)
        if os.path.exists(local_ffmpeg):
            return local_ffmpeg
            
        local_bin_ffmpeg = os.path.join(app_dir, "bin", "ffmpeg" + ext)
        if os.path.exists(local_bin_ffmpeg):
            return local_bin_ffmpeg
            
        return None

    def prompt_ffmpeg_download(self):
        """Asks user to download FFmpeg automatically if not found."""
        msg = TRANSLATIONS[self.lang]["no_ffmpeg"]
        if messagebox.askyesno("FFmpeg Required", msg):
            threading.Thread(target=self.download_ffmpeg, daemon=True).start()

    def download_ffmpeg(self):
        """Downloads static ffmpeg build depending on OS."""
        self.root.after(0, lambda: self.show_progress_info(TRANSLATIONS[self.lang]["downloading"], 0))
        
        try:
            app_dir = os.path.dirname(os.path.abspath(__file__))
            temp_zip = os.path.join(app_dir, "ffmpeg_temp.zip")
            
            # Decide URL
            if sys.platform.startswith("win"):
                # Windows 64-bit static build download URL
                url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
            elif sys.platform.startswith("darwin"):
                # Mac OS 64-bit static build (Evermeet static builds)
                url = "https://evermeet.cx/ffmpeg/getrelease/zip"
            else:
                # Linux static
                url = "https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz"
                temp_zip = os.path.join(app_dir, "ffmpeg_temp.tar.xz")

            # Perform Download
            urllib.request.urlretrieve(url, temp_zip)
            
            # Extract
            if temp_zip.endswith(".zip"):
                with zipfile.ZipFile(temp_zip, "r") as zip_ref:
                    # Find and extract ffmpeg.exe / ffmpeg
                    for file_info in zip_ref.infolist():
                        if file_info.filename.endswith("ffmpeg.exe") or file_info.filename.endswith("ffmpeg"):
                            file_info.filename = os.path.basename(file_info.filename)
                            zip_ref.extract(file_info, app_dir)
                            break
            
            # Cleanup temp zip
            if os.path.exists(temp_zip):
                os.remove(temp_zip)
                
            # Set executable permissions for Mac/Linux
            ext = ".exe" if sys.platform.startswith("win") else ""
            self.ffmpeg_path = os.path.join(app_dir, "ffmpeg" + ext)
            if os.path.exists(self.ffmpeg_path) and not sys.platform.startswith("win"):
                os.chmod(self.ffmpeg_path, 0o755)
                
            self.root.after(0, lambda: messagebox.showinfo("FFmpeg", TRANSLATIONS[self.lang]["download_done"]))
            self.root.after(0, lambda: self.show_progress_info(TRANSLATIONS[self.lang]["done"], 100))
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Error", TRANSLATIONS[self.lang]["download_failed"] + f"\nDetails: {e}"))
            self.root.after(0, lambda: self.show_progress_info(TRANSLATIONS[self.lang]["download_failed"], 0))

    def setup_ui_styles(self):
        style = ttk.Style()
        style.theme_use("clam")
        
        # Standard custom flat styling templates
        style.configure("TNotebook", borderwidth=0, highlightthickness=0)
        style.configure("TNotebook.Tab", padding=[15, 6], font=("Helvetica", 10, "bold"))
        style.configure("TCheckbutton", font=("Helvetica", 9))
        style.configure("TCombobox", padding=5, font=("Helvetica", 9))

    def create_widgets(self):
        # 1. Top Options & Menubar
        self.menubar = tk.Menu(self.root)
        self.root.config(menu=self.menubar)
        
        self.option_menu = tk.Menu(self.menubar, tearoff=0)
        self.menubar.add_cascade(label="Menu / 設定", menu=self.option_menu)
        
        # Settings submenu
        self.option_menu.add_command(label="English", command=lambda: self.switch_language("en"))
        self.option_menu.add_command(label="日本語", command=lambda: self.switch_language("ja"))
        self.option_menu.add_separator()
        self.option_menu.add_command(label="Dark Mode", command=lambda: self.switch_theme("dark"))
        self.option_menu.add_command(label="Light Mode", command=lambda: self.switch_theme("light"))
        self.option_menu.add_separator()
        self.option_menu.add_command(label="FFmpeg Path...", command=self.browse_ffmpeg)
        self.option_menu.add_command(label="About", command=self.show_about)

        # Main Layout Container
        self.main_container = tk.Frame(self.root, padx=12, pady=12)
        self.main_container.pack(fill=tk.BOTH, expand=True)

        # Segmented Tab Selector for Output Mode
        self.tab_frame = tk.Frame(self.main_container)
        self.tab_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.btn_tab_audio = tk.Button(self.tab_frame, text="Audio Output", font=("Helvetica", 10, "bold"), bd=0, relief=tk.FLAT, command=lambda: self.set_output_tab("audio"), height=2)
        self.btn_tab_audio.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        self.btn_tab_video = tk.Button(self.tab_frame, text="Video Output", font=("Helvetica", 10, "bold"), bd=0, relief=tk.FLAT, command=lambda: self.set_output_tab("video"), height=2)
        self.btn_tab_video.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # FlicFlac-Style Core Box: Drop Zone (Left) and Formats (Right)
        self.flicflac_body = tk.Frame(self.main_container)
        self.flicflac_body.pack(fill=tk.BOTH, expand=True)

        # Left Drag and Drop Zone Card
        self.drop_card = tk.Label(
            self.flicflac_body, 
            text="Select or\nDrop Files", 
            font=("Helvetica", 11, "bold"),
            relief=tk.FLAT, 
            bd=0,
            cursor="hand2"
        )
        self.drop_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 6))
        self.drop_card.bind("<Button-1>", self.browse_input_file)

        # Right Action Buttons Stack (Format conversion actions)
        self.formats_container = tk.Frame(self.flicflac_body, width=120)
        self.formats_container.pack(side=tk.RIGHT, fill=tk.Y)

        # Right buttons will be populated dynamically based on Selected Tab (audio or video output)
        self.buttons_list = []
        
        # Preset Options Area (Dropdown with presets matching FlicFlac right-click preset functionality)
        self.quality_frame = tk.Frame(self.main_container)
        self.quality_frame.pack(fill=tk.X, pady=(10, 8))
        
        self.lbl_quality = tk.Label(self.quality_frame, text="Quality Presets:", font=("Helvetica", 9, "bold"))
        self.lbl_quality.pack(side=tk.LEFT, padx=(0, 6))

        self.quality_var = tk.StringVar(value="cd")
        self.quality_combo = ttk.Combobox(
            self.quality_frame, 
            textvariable=self.quality_var, 
            state="readonly",
            values=["low", "normal", "cd", "studio"]
        )
        self.quality_combo.pack(side=tk.LEFT, fill=tk.X, expand=True)
        self.quality_combo.bind("<<ComboboxSelected>>", self.on_quality_selected)

        # Real-time Progress Bar & Speed Status Section
        self.progress_frame = tk.Frame(self.main_container)
        self.progress_frame.pack(fill=tk.X, pady=(5, 5))
        
        self.lbl_status = tk.Label(self.progress_frame, text="Ready", font=("Helvetica", 9), anchor="w")
        self.lbl_status.pack(fill=tk.X, pady=(0, 2))

        # Real modern continuous horizontal progress canvas
        self.progress_canvas = tk.Canvas(self.progress_frame, height=8, width=100, highlightthickness=0, bd=0)
        self.progress_canvas.pack(fill=tk.X)
        self.draw_progress_bar(0)

        # Bottom Utilities Rail: Options matching the UI in the FlicFlac app image
        self.checkbox_rail = tk.Frame(self.main_container)
        self.checkbox_rail.pack(fill=tk.X, pady=(10, 0))

        self.chk_delete_input = ttk.Checkbutton(self.checkbox_rail, text="Delete input file", variable=self.delete_input, style="TCheckbutton")
        self.chk_delete_input.pack(side=tk.LEFT)

        self.chk_always_top = ttk.Checkbutton(self.checkbox_rail, text="Always on top", variable=self.always_on_top, style="TCheckbutton")
        self.chk_always_top.pack(side=tk.RIGHT)

    def draw_progress_bar(self, percentage):
        """Draws flat progress line using TK Canvas."""
        self.progress_canvas.delete("all")
        theme_colors = THEMES[self.theme]
        self.progress_canvas.config(bg=theme_colors["progress_bg"])
        
        w = self.progress_canvas.winfo_width()
        if w < 10: w = 310 # default fallback width
        
        fill_w = (percentage / 100.0) * w
        self.progress_canvas.create_rectangle(0, 0, fill_w, 8, fill=theme_colors["progress_bar"], width=0)

    def set_output_tab(self, tab):
        self.current_tab = tab
        self.update_action_buttons()
        self.apply_theme()

    def update_action_buttons(self):
        """Re-populates the right-side layout buttons according to selected output tab."""
        for btn in self.buttons_list:
            btn.destroy()
        self.buttons_list.clear()

        theme_colors = THEMES[self.theme]
        
        if self.current_tab == "audio":
            # Output Audio targets
            formats = ["to MP3", "to WAV", "to FLAC", "to OGG", "to M4A"]
        else:
            # Output Video targets
            formats = ["to MP4", "to MKV", "to WebM", "to AVI"]

        for fmt in formats:
            btn = tk.Button(
                self.formats_container, 
                text=fmt, 
                font=("Helvetica", 10, "bold"),
                bd=0,
                bg=theme_colors["btn_bg"],
                fg=theme_colors["btn_fg"],
                activebackground=theme_colors["accent"],
                activeforeground="#FFFFFF",
                cursor="hand2",
                pady=6,
                command=lambda f=fmt: self.start_conversion_process(f)
            )
            # Add dynamic hover feedback matching macOS styles
            btn.bind("<Enter>", lambda e, b=btn: b.config(bg=theme_colors["accent"], fg="#FFFFFF"))
            btn.bind("<Leave>", lambda e, b=btn: b.config(bg=theme_colors["btn_bg"], fg=theme_colors["btn_fg"]))
            
            btn.pack(side=tk.TOP, fill=tk.X, pady=(0, 4))
            self.buttons_list.append(btn)

    def on_topmost_changed(self, *args):
        self.root.call('wm', 'attributes', '.', '-topmost', self.always_on_top.get())

    def on_file_drop(self, event):
        """Triggers file path retrieval on system file drag of FlicFlac application."""
        file_path = event.data
        if file_path.startswith('{') and file_path.endswith('}'):
            file_path = file_path[1:-1] # Strip potential windows wrapper blocks
        self.set_selected_file(file_path)

    def browse_input_file(self, event=None):
        if self.converting: return
        file_path = filedialog.askopenfilename(
            title="Select File to Convert",
            filetypes=[("All Files", "*.*")]
        )
        if file_path:
            self.set_selected_file(file_path)

    def set_selected_file(self, file_path):
        self.selected_file_path = file_path
        filename = os.path.basename(file_path)
        # Squeeze title to fit compact space
        if len(filename) > 16:
            display_name = filename[:12] + "..." + filename[-4:]
        else:
            display_name = filename
            
        self.drop_card.config(text=f"Selected:\n{display_name}")
        self.show_progress_info(f"Loaded: {filename}", 0)

    def browse_ffmpeg(self):
        file_path = filedialog.askopenfilename(
            title="Browse FFmpeg Executable",
            filetypes=[("FFmpeg", "ffmpeg*"), ("All Files", "*.*")]
        )
        if file_path:
            self.ffmpeg_path = file_path
            messagebox.showinfo("FFmpeg Path Updated", f"FFmpeg path set to: {self.ffmpeg_path}")

    def on_quality_selected(self, event):
        # Trigger any specific preview updates
        pass

    def start_conversion_process(self, format_action):
        """Dispatches active background thread to convert file securely via FFmpeg."""
        if not self.ffmpeg_path:
            self.prompt_ffmpeg_download()
            return
            
        if not self.selected_file_path or not os.path.exists(self.selected_file_path):
            messagebox.showwarning("Warning", TRANSLATIONS[self.lang]["no_file_err"])
            return

        if self.converting:
            return

        # Target output format extension (e.g. "mp3", "wav", "mp4")
        target_ext = format_action.replace("to ", "").lower()
        
        # Audio vs Video validation rules
        input_is_video = self.detect_is_video_file(self.selected_file_path)
        
        # Restriction: Cannot convert Audio to Video output!
        if not input_is_video and self.current_tab == "video":
            messagebox.showerror("Validation Error", TRANSLATIONS[self.lang]["error_audio_video"])
            return

        # Start conversion in thread
        self.converting = True
        self.toggle_widgets_state(tk.DISABLED)
        
        threading.Thread(
            target=self.run_ffmpeg_conversion,
            args=(self.selected_file_path, target_ext),
            daemon=True
        ).start()

    def detect_is_video_file(self, filepath):
        """Uses extension checks to detect if input is a video format."""
        vid_extensions = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".wmv", ".m4v"]
        ext = os.path.splitext(filepath.lower())[1]
        return ext in vid_extensions

    def get_input_file_duration(self, filepath):
        """Extracts input full audio/video length using quick FFmpeg inspect."""
        try:
            # Query info
            cmd = [self.ffmpeg_path, "-i", filepath]
            # FFmpeg returns info in stderr on failure/inspection
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="ignore", creationflags=subprocess.CREATE_NO_WINDOW if sys.platform.startswith("win") else 0)
            
            # Look for Duration: 00:01:23.45 in stderr
            match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", result.stderr)
            if match:
                hours = int(match.group(1))
                minutes = int(match.group(2))
                seconds = float(match.group(3))
                return hours * 3600 + minutes * 60 + seconds
        except Exception:
            pass
        return 100.0 # Default fallback duration to prevent division by zero

    def run_ffmpeg_conversion(self, input_path, out_fmt):
        """Calls subprocess CLI to run FFmpeg with parameters, tracking real-time status updates."""
        try:
            total_duration = self.get_input_file_duration(input_path)
            
            # Create unique output path
            dir_name = os.path.dirname(input_path)
            base_name = os.path.splitext(os.path.basename(input_path))[0]
            output_file = os.path.join(dir_name, f"{base_name}_converted.{out_fmt}")
            
            # Resolve Bitrate/CRF parameters based on Preset levels
            codec_args = []
            
            if self.current_tab == "audio":
                # Video -> Audio (extracts -vn) or Audio -> Audio
                codec_args.append("-vn")
                
                if out_fmt == "mp3":
                    bitrates = {"low": "96k", "normal": "128k", "cd": "192k", "studio": "320k"}
                    codec_args.extend(["-c:a", "libmp3lame", "-b:a", bitrates[self.quality]])
                elif out_fmt == "m4a":
                    bitrates = {"low": "96k", "normal": "128k", "cd": "192k", "studio": "320k"}
                    codec_args.extend(["-c:a", "aac", "-b:a", bitrates[self.quality]])
                elif out_fmt == "wav":
                    # WAV is PCM, preset governs bit depth/stereo mix
                    codec_args.extend(["-c:a", "pcm_s16le"])
                elif out_fmt == "flac":
                    # FLAC compression levels (compression levels 0-8)
                    compr = {"low": "3", "normal": "5", "cd": "5", "studio": "8"}
                    codec_args.extend(["-c:a", "flac", "-compression_level", compr[self.quality]])
                elif out_fmt == "ogg":
                    q_levels = {"low": "2", "normal": "4", "cd": "6", "studio": "9"}
                    codec_args.extend(["-c:a", "libvorbis", "-q:a", q_levels[self.quality]])
            else:
                # Video -> Video Conversion
                if out_fmt == "mp4":
                    crf_levels = {"low": "28", "normal": "23", "cd": "20", "studio": "17"}
                    codec_args.extend(["-c:v", "libx264", "-crf", crf_levels[self.quality], "-preset", "medium", "-c:a", "aac", "-b:a", "192k"])
                elif out_fmt == "mkv":
                    crf_levels = {"low": "28", "normal": "23", "cd": "20", "studio": "17"}
                    codec_args.extend(["-c:v", "libx264", "-crf", crf_levels[self.quality], "-c:a", "flac"])
                elif out_fmt == "webm":
                    crf_levels = {"low": "36", "normal": "30", "cd": "24", "studio": "18"}
                    codec_args.extend(["-c:v", "libvpx-vp9", "-crf", crf_levels[self.quality], "-b:v", "0", "-c:a", "libopus"])
                elif out_fmt == "avi":
                    # Classic compatibility avi encoding
                    codec_args.extend(["-c:v", "mpeg4", "-q:v", "5", "-c:a", "libmp3lame"])

            # Setup FFmpeg exec command (overwrite input `-y`)
            cmd = [self.ffmpeg_path, "-y", "-i", input_path] + codec_args + [output_file]
            
            # Start process, grabbing stderr for real-time progress bar output
            startupinfo = None
            if sys.platform.startswith("win"):
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                errors="ignore",
                startupinfo=startupinfo
            )
            
            # Parse FFmpeg stderr output lines in real-time
            while True:
                line = proc.stderr.readline()
                if not line:
                    break
                
                # Parse duration match (time=00:00:10.05)
                time_match = re.search(r"time=(\d+):(\d+):(\d+\.\d+)", line)
                speed_match = re.search(r"speed=\s*(\d+\.\d+x)", line)
                
                if time_match:
                    h, m, s = int(time_match.group(1)), int(time_match.group(2)), float(time_match.group(3))
                    elapsed = h * 3600 + m * 60 + s
                    percent = min(100, int((elapsed / total_duration) * 100))
                    
                    speed_val = speed_match.group(1) if speed_match else "1.00x"
                    time_display = f"{m:02d}:{int(s):02d}"
                    
                    # Send update to main thread
                    lbl_txt = TRANSLATIONS[self.lang]["converting"].format(percent=percent) + " " + TRANSLATIONS[self.lang]["progress_speed"].format(speed=speed_val, time=time_display)
                    self.root.after(0, lambda p=percent, text=lbl_txt: self.show_progress_info(text, p))

            proc.wait()
            
            if proc.returncode == 0:
                # Successfully finished
                self.root.after(0, lambda: self.show_progress_info(TRANSLATIONS[self.lang]["success"], 100))
                
                # Option: Delete original file
                if self.delete_input.get() and os.path.exists(input_path):
                    try:
                        os.remove(input_path)
                    except Exception:
                        pass
                
                self.root.after(0, lambda: messagebox.showinfo("FlicFF", TRANSLATIONS[self.lang]["success"]))
            else:
                stderr_all = proc.stderr.read()
                err_text = TRANSLATIONS[self.lang]["error_proc"].format(error=stderr_all[:200])
                self.root.after(0, lambda: messagebox.showerror("Error", err_text))
                self.root.after(0, lambda: self.show_progress_info("Failed", 0))

        except Exception as e:
            err_text = TRANSLATIONS[self.lang]["error_proc"].format(error=str(e))
            self.root.after(0, lambda: messagebox.showerror("Error", err_text))
            self.root.after(0, lambda: self.show_progress_info("Failed", 0))
        finally:
            self.converting = False
            self.root.after(0, lambda: self.toggle_widgets_state(tk.NORMAL))

    def show_progress_info(self, text, percentage):
        self.lbl_status.config(text=text)
        self.draw_progress_bar(percentage)

    def toggle_widgets_state(self, state):
        """Enables/disables buttons and drop area controls during conversion."""
        self.quality_combo.config(state="disabled" if state == tk.DISABLED else "readonly")
        self.drop_card.config(state=state)
        for btn in self.buttons_list:
            btn.config(state=state)
        # Tab toggles during converters
        self.btn_tab_audio.config(state=state)
        self.btn_tab_video.config(state=state)

    def switch_language(self, lang):
        self.lang = lang
        self.update_ui_strings()
        self.apply_theme()

    def update_ui_strings(self):
        """Translates Tkinter UI dynamically based on language choice."""
        trans = TRANSLATIONS[self.lang]
        self.root.title(trans["title"])
        
        self.btn_tab_audio.config(text=trans["audio_tab"])
        self.btn_tab_video.config(text=trans["video_tab"])
        
        if not self.selected_file_path:
            self.drop_card.config(text=trans["drop_area"])
        
        self.lbl_quality.config(text=trans["quality_preset"] + ":")
        
        # Translate presets inside Combobox list
        preset_labels = [
            trans["quality_low"],
            trans["quality_normal"],
            trans["quality_cd"],
            trans["quality_studio"]
        ]
        self.quality_combo.config(values=preset_labels)
        
        # Set Combobox text according to state
        preset_map = {"low": 0, "normal": 1, "cd": 2, "studio": 3}
        self.quality_combo.current(preset_map[self.quality])
        
        self.chk_delete_input.config(text=trans["delete_input"])
        self.chk_always_top.config(text=trans["always_on_top"])
        
        # Update Menu item labels
        self.menubar.entryconfig(1, label="Menu / 設定" if self.lang == "ja" else "Menu / Settings")
        self.option_menu.entryconfig(0, label="English (英語)" if self.lang == "ja" else "English")
        self.option_menu.entryconfig(1, label="日本語" if self.lang == "ja" else "Japanese")
        self.option_menu.entryconfig(3, label="ダークモード" if self.lang == "ja" else "Dark Mode")
        self.option_menu.entryconfig(4, label="ライトモード" if self.lang == "ja" else "Light Mode")
        self.option_menu.entryconfig(6, label="FFmpegへのパスを指定..." if self.lang == "ja" else "FFmpeg Binary Path...")
        self.option_menu.entryconfig(7, label="このアプリについて" if self.lang == "ja" else "About FlicFF")

    def switch_theme(self, theme):
        self.theme = theme
        self.apply_theme()

    def apply_theme(self):
        """Applies flat, borderless styling to standard python frames."""
        colors = THEMES[self.theme]
        
        self.root.config(bg=colors["bg"])
        self.main_container.config(bg=colors["bg"])
        self.tab_frame.config(bg=colors["bg"])
        self.flicflac_body.config(bg=colors["bg"])
        self.quality_frame.config(bg=colors["bg"])
        self.progress_frame.config(bg=colors["bg"])
        self.checkbox_rail.config(bg=colors["bg"])
        
        # Segmented Tabs styling (active vs inactive selection)
        tab_bg_audio = colors["card"] if self.current_tab == "audio" else colors["btn_bg"]
        tab_fg_audio = colors["accent"] if self.current_tab == "audio" else colors["text_sec"]
        self.btn_tab_audio.config(bg=tab_bg_audio, fg=tab_fg_audio, activebackground=colors["card"])
        
        tab_bg_video = colors["card"] if self.current_tab == "video" else colors["btn_bg"]
        tab_fg_video = colors["accent"] if self.current_tab == "video" else colors["text_sec"]
        self.btn_tab_video.config(bg=tab_bg_video, fg=tab_fg_video, activebackground=colors["card"])
 
        # Drag area colors
        self.drop_card.config(bg=colors["card"], fg=colors["text"])
        self.formats_container.config(bg=colors["bg"])
        
        # Quality labels & buttons
        self.lbl_quality.config(bg=colors["bg"], fg=colors["text"])
        self.lbl_status.config(bg=colors["bg"], fg=colors["text_sec"])
        
        # Checkboxes and Canvas redraw
        style = ttk.Style()
        style.configure("TCheckbutton", background=colors["bg"], foreground=colors["text"])
        self.draw_progress_bar(0)
        
        # Sync dynamic action list buttons
        self.update_action_buttons()

    def show_about(self):
        text_ja = f"""FlicFF 音声・映像変換ソフト v{VERSION}
----------------------------------------
FFmpegを利用した超軽量・コンパクトな
ドラッグ＆ドロップ対応変換ユーティリティです。

特長：
・FlicFFをリスペクトした伝統UI
・MP3, WAV, FLAC, OGG, M4A 変換 (音声)
・MP4, MKV, WebM, AVI 変換 (映像)
・映像からの音声抽出を自動実行
・FFmpegの進捗・速度リアルタイム表示
・ビルド & インストーラー同梱
"""
        text_en = f"""FlicFF Audio/Video Converter v{VERSION}
----------------------------------------
A lightweight, high-performance, and ultra-compact 
drag-and-drop file converter powered by FFmpeg.

Features:
- Minimalist FlicFF-inspired classic layout
- Audio conversion: MP3, WAV, FLAC, OGG, M4A
- Video conversion: MP4, MKV, WebM, AVI
- Superfast audio extraction from video
- Smooth multithreaded GUI with live progress
- Bundled platform deployment scripts
"""
        msg = text_ja if self.lang == "ja" else text_en
        messagebox.showinfo("About FlicFF", msg)


if __name__ == "__main__":
    # Initialize main window frame
    if HAS_DND:
        root = TkinterDnD.Tk()
    else:
        root = tk.Tk()
        
    app = FlicFFApp(root)
    root.mainloop()
