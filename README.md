# FlicFlac Audio/Video Converter (音声・映像 相互変換ソフト)

A modern, ultra-compact, and lightweight drag-and-drop file converter inspired by the classic **FlicFlac** design. Powered by FFmpeg, it supports superfast high-quality conversions for both Windows and macOS.

FlicFlac をリスペクトした、シンプルで極めてコンパクトな「音声・映像ファイル相互変換ソフトウェア」です。FFmpegをインテリジェントにバックグラウンド制御し、スムーズで超軽量なドラッグ＆ドロップファイル変換（多言語・ダークモード・進捗バー完備）を実現します。

---

## 🎨 Preview & Layout (特徴とレイアウト)

- **FlicFlac Classic Minimal Style:** Drop area on the left, action format trigger buttons on the right.
- **Bi-channel Toggle:** "Audio Output" (音声出力) and "Video Output" (映像出力) tabs.
- **Multilingual Support:** Instant toggle between 日本語 (Japanese) and English from the settings menu.
- **Modern Themes:** Slate Dark Mode (default) and High-Contrast Light Mode.
- **Quality Presets:** 4 customized levels (Low Quality, Normal, CD Quality, Studio Quality) with corresponding FFmpeg parameters.
- **Continuous Progress Analytics:** Real-time speed indicator, elapsed duration, extraction progress parse, and horizontal responsive status bars.
- **Smart FFmpeg Management:** Automatically detects system PATHs, local executables, and supports **one-click automated standard secure download and extract** if missing.

---

## 📁 Repository File Structure (リポジトリ構成)

- `flicflac_converter.py` : Core Python application code using cross-platform Tkinter.
- `requirements.txt` : Pip requirements file. Includes PyInstaller.
- `installer_windows.iss` : Professional Inno Setup installer script for Windows. Bundles executable and auto-registers system PATH.
- `install_mac.sh` : Deploy, brew download, virtual-env configure, and packaging compiler helper shell script for macOS path integration.
- `.github/workflows/build.yml` : GitHub Actions automated building script that compiles release files for Windows and macOS upon pushing!

---

## 🚀 How to Run Locally (ローカル開発環境での起動方法)

### Prerequisites (前提要件)
- Python 3.8+ installed on your system.

### Steps (手順):

1. **Clone or Download the Workspace (リポジトリのダウンロード/エクスポート)**:
   You can easily download this entire workspace folder as a ZIP file or export directly to GitHub using the AI Studio settings menu.
   AI Studio の設定メニューから、このワークスペースをZIPでダウンロードするか、直接GitHubにエクスポートできます。

2. **Navigate and Install Dependencies (依存ライブラリのインストール)**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Application (アプリケーションの実行)**:
   ```bash
   python flicflac_converter.py
   ```
   *(If FFmpeg is not found, the app will prompt to automatically download and unpack a trusted static FFmpeg bundle into your workspace context directory in one click!)*

---

## 📦 How to Compile & Package (コンパイルとパッケージ配布方法)

### For Windows (WINDOWSでのコンパイル):

1. **Compile EXE using PyInstaller**:
   ```cmd
   pip install pyinstaller
   pyinstaller --noconsole --onefile --name="FlicFlac_Converter" flicflac_converter.py
   ```
   This generates a stand-alone single executable `dist/FlicFlac_Converter.exe`!

2. **Create Installer Exe (Inno Setup)**:
   - Download and open [Inno Setup Compiler](https://jrsoftware.org/isinfo.php).
   - Load `installer_windows.iss` and click **Compile** to pack into `FlicFlac_Converter_Setup_Windows.exe`.

### For macOS (macOSでのコンパイル):

1. **Make Script Executable + Run**:
   ```bash
   chmod +x install_mac.sh
   ./install_mac.sh
   ```
   This automatically checks for/installs `ffmpeg` via Homebrew, builds a virtual env, installs dependencies, and packages `dist/FlicFlac Converter` (a double-clickable Apple binary format app package).

---

## 🔒 Security & Performance Features (セキュリティと信頼性)
- **Multi-Threaded Conversion:** Running FFmpeg converts on secondary background worker pool loops, ensuring the GUI remains 100% interactive, never freezing during bulk file operations.
- **Safe Bitrate Controls:** Disallows invalid conversions, such as converting Audio streams into a Video file container container, prompting friendly input warning guards while handling Video Extract options cleanly.
