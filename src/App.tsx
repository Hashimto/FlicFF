import React, { useState, useEffect, useRef } from "react";
import { 
  FileAudio, 
  FileVideo, 
  Download, 
  Check, 
  Copy, 
  Settings, 
  Languages, 
  Sparkles, 
  ArrowRight, 
  HardDrive, 
  Play, 
  RefreshCw, 
  Terminal, 
  AlertCircle, 
  Info,
  Layers,
  Moon,
  Sun,
  Github,
  Laptop
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Translations mapping
const TRANS_REACT = {
  ja: {
    heroTitle: "FlicFF 音声・映像変換ソフト デベロッパーハブ",
    heroSubtitle: "FlicFFをリスペクトした極めて軽量なデスクトップファイル変換ツール。この画面でローカル環境をシミュレートし、1クリックでリポジトリをZIP出力・GitHub連携できます。",
    hintTitle: "💡 パッケージのダウンロード方法",
    hintText: "右上の設定アイコンから「Export as ZIP」をクリックするかGitHubにプッシュすることで、以下の Python/Inno Setup/Workflow など、デスクトップアプリ全ソースコードをフォルダ構造ごと直接ダウンロード可能です！",
    tabSim: "アプリ・シミュレーター",
    tabSrc: "ソースコード・配備ファイル",
    simTitle: "デスクトップ UI シミュレータ",
    simSubtitle: "Windows 11 / macOS 環境での画面と処理動作をリアルタイムで体験できます。",
    selectedFileText: "読み込まれたファイル",
    presetLabel: "品質プリセット",
    presetLow: "低品質 (Fast) - 96kbps / CRF 28",
    presetNormal: "一般品質 - 128kbps / CRF 23",
    presetCd: "CD音質 (標準) - 192kbps / CRF 20",
    presetStudio: "スタジオ品質 (最高画質) - 320kbps / CRF 17",
    deleteOrig: "変換後に元のファイルを削除",
    topmost: "常に最前面に表示",
    dragBoxTitle: "ファイルを選択またはドロップ",
    dragBoxSubtitle: "もしくは下のプリセットから選択",
    readyLabel: "変換待機中",
    convertingLabel: "変換中:",
    completedLabel: "変換完了！",
    errAudioToVideo: "検証エラー: 音声ファイルを映像出力フォーマットに変換することはできません。",
    terminalTitle: "FFmpeg リアルタイム実行ログ",
    terminalHint: "Python側でバックグラウンド実行されるFFmpegコマンドと進捗情報の生出力です。",
    speedLabel: "速度",
    timeLabel: "経過時間",
    sourceExplain: "以下のファイルはすべてワークスペースのルートに即時格納されています。すぐにローカル環境にてコンパイル、実行可能です。",
    copied: "クリップボードにコピーしました！",
    copyCode: "コードをコピー",
    setupDoc: "導入・ビルドマニュアル",
    sampleFilesTitle: "検証用サンプルファイル (シミュレーション用)",
    simButtonTip: "ファイルを選択し、右の action ボタンをクリックして FFmpeg 変換をシミュレートしてください。"
  },
  en: {
    heroTitle: "FlicFF Audio/Video Converter Hub",
    heroSubtitle: "An ultra-compact and lightweight desktop file converter inspired by classic FlicFlac (now FlicFF). Simulate operations, and export the comprehensive Python packaging scripts in 1-click.",
    hintTitle: "💡 How to Download the Project Packages",
    hintText: "Click 'Export as ZIP' or push to GitHub via the settings menu in the top right. This packages all Python scripts, Inno Setup builders, and automated installer scripts directly for you!",
    tabSim: "Live GUI Simulator",
    tabSrc: "Source Code & Dist Scripts",
    simTitle: "Desktop UI Simulator",
    simSubtitle: "Experience the real-time conversion speed, templates, and UI behaviors on Windows or macOS.",
    selectedFileText: "Loaded File",
    presetLabel: "Quality Presets",
    presetLow: "Low Quality (Fast) - 96kbps / CRF 28",
    presetNormal: "Normal Quality - 128kbps / CRF 23",
    presetCd: "CD Quality (High) - 192kbps / CRF 20",
    presetStudio: "Studio Quality (Ultra) - 320kbps / CRF 17",
    deleteOrig: "Delete input file after convert",
    topmost: "Always on top",
    dragBoxTitle: "Select or Drop Files",
    dragBoxSubtitle: "or click a mock sample file below",
    readyLabel: "Ready",
    convertingLabel: "Converting:",
    completedLabel: "Success!",
    errAudioToVideo: "Validation Error: Cannot convert Audio files into Video output format containers.",
    terminalTitle: "FFmpeg Real-time Subprocess Logs",
    terminalHint: "Outputs the identical command structure and parsing stderr streams invoked by Python.",
    speedLabel: "Speed",
    timeLabel: "Time",
    sourceExplain: "These files are located in your active directory. Download them or connect via git to compile and deploy on your local machine instantly.",
    copied: "Copied to clipboard!",
    copyCode: "Copy Code",
    setupDoc: "Setup & Build Guide",
    sampleFilesTitle: "Simulator Mock Files",
    simButtonTip: "Load a mock file, then click a format button on the right to start."
  }
};

// Mock Files for Simulator
const MOCK_FILES = [
  { name: "recording_interview.wav", type: "audio", size: "38.5 MB", duration: 180 },
  { name: "lofi_background_beat.mp3", type: "audio", size: "12.4 MB", duration: 240 },
  { name: "vacation_vlog.mp4", type: "video", size: "142.0 MB", duration: 60 },
  { name: "lecture_screencast.mkv", type: "video", size: "320.1 MB", duration: 120 }
];

const formatDuration = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return [
    h > 0 ? String(h).padStart(2, "0") : "00",
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0")
  ].join(":");
};

export default function App() {
  const [currentLang, setCurrentLang] = useState<"ja" | "en">("ja");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"simulator" | "code">("simulator");
  
  // Real-time FlicFlac GUI State
  const [simLang, setSimLang] = useState<"ja" | "en">("ja");
  const [simTheme, setSimTheme] = useState<"dark" | "light">("dark");
  const [simTab, setSimTab] = useState<"audio" | "video">("audio");
  const [selectedFile, setSelectedFile] = useState<typeof MOCK_FILES[0] | null>(null);
  const [quality, setQuality] = useState<"low" | "normal" | "cd" | "studio">("cd");
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [deleteInput, setDeleteInput] = useState(false);
  
  // Simulation Running State
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState("0.0x");
  const [elapsed, setElapsed] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [simError, setSimError] = useState<string | null>(null);
  
  // Selected Code File Reader State
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>("flicff_converter.py");
  const [copiedText, setCopiedText] = useState(false);

  // Auto-align Simulator language with core app language initially
  useEffect(() => {
    setSimLang(currentLang);
  }, [currentLang]);

  // Handle Copy Notification
  const triggerCopyNotice = () => {
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const t = TRANS_REACT[currentLang];

  // Raw file contents dictionary to support syntax browsing
  const CODE_FILES: Record<string, { desc: string; lang: string; content: string }> = {
    "flicff_converter.py": {
      desc: "Python application code incorporating Tkinter, multi-threading, custom styling, dynamic language toggles, and seamless FFmpeg logs compilation parsing.",
      lang: "python",
      content: `import os
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

try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    HAS_DND = True
except ImportError:
    HAS_DND = False

VERSION = "1.0.0"

TRANSLATIONS = {
    "en": {
        "title": "FlicFF Audio/Video Converter",
        "audio_tab": "Audio Output",
        "video_tab": "Video Output",
        "drop_area": "Select or\\nDrop Files",
        "drop_area_active": "Drop Files Here",
        "delete_input": "Delete input file",
        "always_on_top": "Always on top",
        "quality_preset": "Quality Presets",
        "quality_low": "Low Quality (Fast)",
        "quality_normal": "Normal Quality",
        "quality_cd": "CD Quality (High)",
        "quality_studio": "Studio Quality (Ultra)",
        "converting": "Converting: {percent}%",
        "success": "Conversion completed successfully!",
        "error_audio_video": "Cannot convert Audio files to Video output.",
        "progress_speed": "Speed: {speed} | Time: {time}",
        "done": "Done!",
        "theme_dark": "Dark Mode",
        "theme_light": "Light Mode",
        "no_file_err": "Please select or drop a valid file first."
    },
    "ja": {
        "title": "FlicFF 音声・映像変換器",
        "audio_tab": "音声出力",
        "video_tab": "映像出力",
        "drop_area": "ファイルを選択\\nまたはドロップ",
        "drop_area_active": "ここにドロップ",
        "delete_input": "変換後に元のファイルを削除",
        "always_on_top": "常に最前面に表示",
        "quality_preset": "品質プリセット",
        "quality_low": "低品質 (高速)",
        "quality_normal": "標準品質",
        "quality_cd": "CD品質 (高音質/高画質)",
        "quality_studio": "スタジオ品質 (超高音質/超高画質)",
        "converting": "変換中: {percent}%",
        "success": "変換が正常に完了しました！",
        "error_audio_video": "音声ファイルを映像出力フォーマットに変換することはできません。",
        "progress_speed": "速度: {speed} | 経過時間: {time}",
        "done": "完了！",
        "theme_dark": "ダークモード",
        "theme_light": "ライトモード",
        "no_file_err": "有効なファイルを選択またはドロップしてください。"
    }
}

# (Theme styling configurations option, threads initialization and FFmpeg parsing)
# Run locally with: python flicff_converter.py`
    },
    "installer_windows.iss": {
      desc: "Windows script compilation schema using Inno Setup Compiler. Integrates build files and handles PATH environment mapping.",
      lang: "pascal",
      content: `; FlicFF Audio/Video Converter Inno Setup Configuration Script
[Setup]
AppId={{C52F1EA0-891E-47C2-AF3F-CF7344BBF3AC}
AppName=FlicFF
AppVersion=1.0.0
AppPublisher=FlicFF Team
DefaultDirName={autopf}\\FlicFF
DefaultGroupName=FlicFF
AllowNoIcons=yes
OutputDir=.
OutputBaseFilename=FlicFF_Setup_Windows
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "envpath"; Description: "Add FFmpeg bin to System PATH environment variables"

[Files]
Source: "dist\\flicff_converter.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "ffmpeg.exe"; DestDir: "{app}"; Flags: skipifsourcedoesntexist`
    },
    "install_mac.sh": {
      desc: "Self-installing macOS execution bash workflow script. Downloads ffmpeg dependency through brew, links paths, sets python environment, wraps PyInstaller applets as DMG.",
      lang: "bash",
      content: `#!/usr/bin/env bash
# macOS deployment automation file for FlicFF
set -e

echo "=== System Check ==="
if ! command -v brew &>/dev/null; then
    echo "[-] Homebrew missing. Visit https://brew.sh/"
else
    if ! command -v ffmpeg &>/dev/null; then
        echo "[*] Installing FFmpeg..."
        brew install ffmpeg
    fi
fi

# PyInstaller Applet Packaging & hdiutil DMG creation
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pyinstaller --noconsole --onefile --name="FlicFF" flicff_converter.py`
    },
    ".github/workflows/build.yml": {
      desc: "CI/CD execution pipelines for automatic packaging when pushing changes to GitHub.",
      lang: "yaml",
      content: `name: Package Desktop Converter Bundles
on: [push, pull_request]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: |
          pip install -r requirements.txt
          pyinstaller --noconsole --onefile --name="FlicFF" flicff_converter.py
`
    }
  };

  // Run Simulated Conversion Process
  const handleSimulateConversion = (format: string) => {
    if (!selectedFile) {
      setSimError(simLang === "ja" ? "ファイルが選択されていません。" : "Please load a file first.");
      return;
    }
    
    // Safety check: Cannot convert Audio to Video output!
    if (selectedFile.type === "audio" && simTab === "video") {
      const errText = simLang === "ja" ? TRANS_REACT.ja.errAudioToVideo : TRANS_REACT.en.errAudioToVideo;
      setSimError(errText);
      setLogs(prev => [
        `[validate] ERROR: Invalid mapping exception context.`,
        `[validate] ${errText}`,
        ...prev
      ]);
      return;
    }

    setSimError(null);
    setConverting(true);
    setProgress(0);
    setElapsed(0);
    
    const inputExt = selectedFile.name.split('.').pop() || "";
    const targetExt = format.replace("to ", "").toLowerCase();
    const isExtraction = selectedFile.type === "video" && simTab === "audio";
    
    // Determine simulated ffmpeg command parameters
    let cmdStr = `fftpeg -y -i ${selectedFile.name} `;
    if (simTab === "audio") {
      cmdStr += `-vn `; // strip video if audio output target
      if (targetExt === "mp3") cmdStr += `-c:a libmp3lame -b:a ${quality === "low" ? "96k" : quality === "normal" ? "128k" : quality === "cd" ? "192k" : "320k"}`;
      else if (targetExt === "m4a") cmdStr += `-c:a aac -b:a ${quality === "low" ? "96k" : quality === "normal" ? "128k" : quality === "cd" ? "192k" : "320k"}`;
      else if (targetExt === "wav") cmdStr += `-c:a pcm_s16le`;
      else if (targetExt === "flac") cmdStr += `-c:a flac`;
      else if (targetExt === "ogg") cmdStr += `-c:a libvorbis`;
    } else {
      // Video conversion
      const crf = quality === "low" ? "28" : quality === "normal" ? "23" : quality === "cd" ? "20" : "17";
      if (targetExt === "mp4") cmdStr += `-c:v libx264 -crf ${crf} -preset medium -c:a aac -b:a 192k`;
      else if (targetExt === "mkv") cmdStr += `-c:v libx264 -crf ${crf} -c:a flac`;
      else if (targetExt === "webm") cmdStr += `-c:v libvpx-vp9 -crf ${crf} -b:v 0 -c:a libopus`;
      else if (targetExt === "avi") cmdStr += `-c:v mpeg4 -q:v 5 -c:a libmp3lame`;
    }
    
    const outputName = `${selectedFile.name.split('.')[0]}_converted.${targetExt}`;
    cmdStr += ` ${outputName}`;

    // Initialize state log
    setLogs([
      `$ ${cmdStr}`,
      `[ffmpeg] ffmpeg version 6.1-static Copyright (c) 2000-2026 the FFmpeg developers`,
      `[ffmpeg] Input #0, ${selectedFile.name.toUpperCase()} format, from '${selectedFile.name}':`,
      `[ffmpeg]   Duration: ${formatDuration(selectedFile.duration)}, start: 0.000000, bitrate: 1411 kb/s`,
      selectedFile.type === "video" ? `[ffmpeg]   Stream #0:0: Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1920x1080` : `[ffmpeg]   Stream #0:0: Audio: pcm_s16le ([1][0][0][0] / 0x0001), 44100 Hz, stereo, s16, 1411 kb/s`,
      isExtraction ? `[ffmpeg] [ExtractMode] Detected audio extraction. Output will contain audio stream only.` : `[ffmpeg] Mapping stream channels for target compilation...`,
      `[ffmpeg] Stream mapping:`,
      `[ffmpeg]   Stream #0:0 -> ${simTab === "audio" ? "Audio extraction channel" : "Video track container"}`
    ]);

    // Fast speed simulated increment
    const conversionInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(conversionInterval);
          setConverting(false);
          setProgressText(simLang === "ja" ? TRANS_REACT.ja.completedLabel : TRANS_REACT.en.completedLabel);
          
          setLogs(prevLogs => [
            `[ffmpeg] frame= ${selectedFile.duration * 30} fps= 92 q=-1.0 Lsize= 11204kB time=00:03:00.00 bitrate=192.0kbits/s speed= 9.4x`,
            `[ffmpeg] video:0kB audio:11152kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 0.46%`,
            `[system] SUCCESS: File output saved at ${outputName}`,
            deleteInput ? `[system] CLEANUP: Deleted source input file ${selectedFile.name}` : `[system] Keep original option checked.`,
            `[system] Process terminates with exit code 0`,
            ...prevLogs
          ]);
          return 100;
        }

        const increment = Math.floor(Math.random() * 12) + 6;
        const nextProgress = Math.min(prev + increment, 100);
        const secsSpend = Math.floor((nextProgress / 100) * (selectedFile.duration / 4));
        setElapsed(secsSpend);
        const speedVal = (Math.random() * 2 + 10).toFixed(1) + "x";
        setCurrentSpeed(speedVal);

        const currentPercentText = simLang === "ja"
          ? TRANS_REACT.ja.convertingLabel + ` ${nextProgress}%`
          : TRANS_REACT.en.convertingLabel + ` ${nextProgress}%`;
        setProgressText(currentPercentText);

        const curFrameNum = Math.floor((nextProgress / 100) * selectedFile.duration * 30);
        setLogs(prevLogs => [
          `[ffmpeg] frame= ${curFrameNum} fps= 90 q=20.0 size= ${Math.floor((nextProgress / 100) * parseFloat(selectedFile.size) * 0.82)}kB time=${formatDuration(secsSpend)} bitrate=192kbits/s speed=${speedVal}`,
          ...prevLogs
        ]);

        return nextProgress;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
      
      {/* 🚀 Top Navigation / Branding Hub */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-2.5 rounded-xl shadow-lg shadow-amber-500/10">
            <Layers className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              FlicFF <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full">v1.0.0 Desktop Core</span>
            </h1>
            <p className="text-xs text-zinc-400">Lightweight FFmpeg Batch Processor Workspace</p>
          </div>
        </div>
        
        {/* Languages Selection & Export Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-850">
            <button 
              onClick={() => setCurrentLang("ja")} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentLang === 'ja' ? 'bg-amber-500 text-black shadow font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              日本語
            </button>
            <button 
              onClick={() => setCurrentLang("en")} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentLang === 'en' ? 'bg-amber-500 text-black shadow font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              English
            </button>
          </div>

          <div className="flex items-center bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-300 gap-2">
            <Laptop className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-mono text-[11px]">Win / macOS Ready</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* 💡 Exporter Guide Banner */}
        <section className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden shadow-xl shadow-black/35 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl shrink-0">
            <Info className="h-6 w-6 text-amber-400" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-semibold text-white text-sm md:text-base flex items-center gap-1.5">
              {t.hintTitle} <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-4xl">
              {t.hintText}
            </p>
          </div>
          <div className="flex gap-2 self-start md:self-center shrink-0">
            <div className="bg-zinc-950 border border-zinc-900 text-[11px] font-mono text-zinc-400 px-3 py-1.5 rounded-lg">
              Settings Menu → Export ZIP / Commit
            </div>
          </div>
        </section>

        {/* Workspace Mode Selection */}
        <div className="flex border-b border-zinc-900">
          <button
            onClick={() => setActiveWorkspaceTab("simulator")}
            className={`border-b-2 px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeWorkspaceTab === "simulator"
                ? "border-amber-500 text-amber-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <Play className="h-4 w-4" />
            {t.tabSim}
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("code")}
            className={`border-b-2 px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeWorkspaceTab === "code"
                ? "border-amber-500 text-amber-400 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <Terminal className="h-4 w-4" />
            {t.tabSrc}
          </button>
        </div>

        {/* WORKSPACE CONTENT PANELS */}
        <AnimatePresence mode="wait">
          {activeWorkspaceTab === "simulator" ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Interactive FlicFF GUI frame */}
              <div className="lg:col-span-5 flex flex-col items-center justify-start py-4">
                <div className="w-full max-w-[340px] text-left">
                  <div className="mb-2 text-xs font-semibold text-zinc-500 px-1">
                    {t.simTitle}
                  </div>
                  
                  {/* Outer Window Container Mocking FlicFF exactly */}
                  <div className={`w-full rounded-xl overflow-hidden border shadow-2xl transition-all duration-300 ${
                    simTheme === "dark" 
                      ? "bg-[#141416] border-zinc-850 text-zinc-100" 
                      : "bg-zinc-100 border-zinc-350 text-zinc-900"
                  }`}>
                    
                    {/* OS Soft title bar */}
                    <div className={`px-4 py-3 flex items-center justify-between border-b ${
                      simTheme === "dark" ? "bg-zinc-900/90 border-zinc-850/60" : "bg-zinc-200 border-zinc-3000"
                    }`}>
                      <div className="flex items-center space-x-2">
                        {/* Windows Red/Close mock dots */}
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-xs font-semibold tracking-wide truncate max-w-[170px] font-display">
                          {simLang === "ja" ? "FlicFF 変換器 v1.0" : "FlicFF Audio/Video"}
                        </span>
                      </div>
                      
                      {/* Titlebar In-App Menu Toggles (Language & Theme shortcut overrides) */}
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => setSimLang(prev => prev === "ja" ? "en" : "ja")} 
                          className={`p-1 rounded hover:bg-zinc-700/40 transition text-xs`}
                          title="Change Language"
                        >
                          <Languages className="h-3.5 w-3.5 opacity-60" />
                        </button>
                        <button 
                          onClick={() => setSimTheme(prev => prev === "dark" ? "light" : "dark")} 
                          className="p-1 rounded hover:bg-zinc-700/40 transition"
                          title="Change Theme Skin"
                        >
                          {simTheme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-505" />}
                        </button>
                      </div>
                    </div>

                    {/* Window Core layout */}
                    <div className="p-4 space-y-4">
                      
                      {/* SEGMENTED TAB SELECTOR (Audio output formats vs Video output formats) */}
                      <div className="flex p-0.5 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                        <button
                          onClick={() => setSimTab("audio")}
                          disabled={converting}
                          className={`flex-1 py-1.5 text-xs font-badge rounded-md transition ${
                            simTab === "audio" 
                              ? (simTheme === "dark" ? "bg-zinc-800 text-amber-400 font-bold" : "bg-white text-zinc-900 shadow font-bold") 
                              : "text-zinc-500 hover:text-zinc-400 opacity-85"
                          }`}
                        >
                          {simLang === "ja" ? "音声出力" : "Audio Output"}
                        </button>
                        <button
                          onClick={() => setSimTab("video")}
                          disabled={converting}
                          className={`flex-1 py-1.5 text-xs font-badge rounded-md transition ${
                            simTab === "video" 
                              ? (simTheme === "dark" ? "bg-zinc-800 text-amber-400 font-bold" : "bg-white text-zinc-900 shadow font-bold") 
                              : "text-zinc-500 hover:text-zinc-400 opacity-85"
                          }`}
                        >
                          {simLang === "ja" ? "映像出力" : "Video Output"}
                        </button>
                      </div>

                      {/* FLICFLAC GRID CONTAINER BODY */}
                      <div className="grid grid-cols-12 gap-3 min-h-[160px]">
                        
                        {/* Drag & Drop File Zone (Left 7-columns) */}
                        <div 
                          className={`col-span-7 border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                            simTheme === "dark" 
                              ? "border-zinc-800 hover:border-amber-500/80 hover:bg-amber-500/[0.02]" 
                              : "border-zinc-300 hover:border-amber-600/85 hover:bg-zinc-200/50"
                          } ${selectedFile ? "border-amber-500/50" : ""}`}
                          onClick={() => {
                            if (converting) return;
                            // select first sample as default helper if none loaded
                            if (!selectedFile) setSelectedFile(MOCK_FILES[0]);
                          }}
                        >
                          {selectedFile ? (
                            <div className="space-y-1.5 max-w-full">
                              <div className={`p-2 rounded-lg inline-block ${simTheme === "dark" ? "bg-zinc-850" : "bg-zinc-200"}`}>
                                {selectedFile.type === "video" ? (
                                  <FileVideo className="h-6 w-6 text-amber-450" />
                                ) : (
                                  <FileAudio className="h-6 w-6 text-amber-450" />
                                )}
                              </div>
                              <div className="text-[11px] font-bold line-clamp-2 px-1 break-all">
                                {selectedFile.name}
                              </div>
                              <div className="text-[9px] opacity-60 font-mono">
                                {selectedFile.size} • {selectedFile.duration}s
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 text-zinc-500">
                              <Download className="h-5 w-5 mx-auto opacity-70 animate-bounce text-zinc-400" />
                              <p className="text-[10px] font-bold leading-tight">
                                {simLang === "ja" ? TRANS_REACT.ja.dragBoxTitle : TRANS_REACT.en.dragBoxTitle}
                              </p>
                              <span className="text-[8px] block opacity-60">
                                {simLang === "ja" ? TRANS_REACT.ja.dragBoxSubtitle : TRANS_REACT.en.dragBoxSubtitle}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Format Target Buttons (Right 5-columns) */}
                        <div className="col-span-5 flex flex-col space-y-1.5">
                          {simTab === "audio" ? (
                            ["to MP3", "to WAV", "to FLAC", "to OGG", "to M4A"].map((fmt) => (
                              <button
                                key={fmt}
                                disabled={converting}
                                onClick={() => handleSimulateConversion(fmt)}
                                className={`py-1.5 px-2 text-left rounded font-mono text-[11px] font-bold border transition duration-150 ${
                                  simTheme === "dark" 
                                    ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-amber-500 hover:border-amber-500 hover:text-black"
                                    : "bg-white border-zinc-300 text-zinc-800 hover:bg-amber-605 hover:border-amber-605 hover:text-white shadow-xs"
                                } disabled:opacity-40 disabled:hover:pointer-events-none`}
                              >
                                {fmt}
                              </button>
                            ))
                          ) : (
                            ["to MP4", "to MKV", "to WebM", "to AVI"].map((fmt) => (
                              <button
                                key={fmt}
                                disabled={converting}
                                onClick={() => handleSimulateConversion(fmt)}
                                className={`py-1.5 px-2 text-left rounded font-mono text-[11px] font-bold border transition duration-150 ${
                                  simTheme === "dark" 
                                    ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-amber-500 hover:border-amber-500 hover:text-black"
                                    : "bg-white border-zinc-300 text-zinc-800 hover:bg-amber-605 hover:border-amber-605 hover:text-white shadow-xs"
                                } disabled:opacity-40 disabled:hover:pointer-events-none`}
                              >
                                {fmt}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Presets dropdown option */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-65 text-zinc-400">
                          {simLang === "ja" ? TRANS_REACT.ja.presetLabel : TRANS_REACT.en.presetLabel}
                        </label>
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value as any)}
                          className={`w-full py-1.5 px-2 text-[11px] font-medium rounded border outline-none ${
                            simTheme === "dark" 
                              ? "bg-zinc-900 border-zinc-805 text-zinc-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25" 
                              : "bg-white border-zinc-350 text-zinc-800 focus:border-amber-500"
                          }`}
                        >
                          <option value="low">{simLang === "ja" ? TRANS_REACT.ja.presetLow : TRANS_REACT.en.presetLow}</option>
                          <option value="normal">{simLang === "ja" ? TRANS_REACT.ja.presetNormal : TRANS_REACT.en.presetNormal}</option>
                          <option value="cd">{simLang === "ja" ? TRANS_REACT.ja.presetCd : TRANS_REACT.en.presetCd}</option>
                          <option value="studio">{simLang === "ja" ? TRANS_REACT.ja.presetStudio : TRANS_REACT.en.presetStudio}</option>
                        </select>
                      </div>

                      {/* Simulated continuous linear progress line bar */}
                      <div className="pt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className={`${simTheme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                            {converting ? progressText : progress === 100 ? (simLang === "ja" ? TRANS_REACT.ja.completedLabel : TRANS_REACT.en.completedLabel) : (simLang === "ja" ? TRANS_REACT.ja.readyLabel : TRANS_REACT.en.readyLabel)}
                          </span>
                          {converting && (
                            <span className="font-mono">
                              {currentLang === "ja" ? "速度:" : "Speed:"} {currentSpeed}
                            </span>
                          )}
                        </div>
                        
                        {/* Custom continuous loading canvas rendering bar */}
                        <div className={`h-2 rounded-full overflow-hidden relative ${simTheme === "dark" ? "bg-zinc-900" : "bg-zinc-200"}`}>
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Utilities Rail Checkboxes matching exactly */}
                      <div className="pt-1 flex items-center justify-between text-[10px] font-medium opacity-85 gap-3 border-t border-zinc-850/60">
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={deleteInput} 
                            onChange={(e) => setDeleteInput(e.target.checked)}
                            className="rounded accent-amber-500" 
                          />
                          <span>{simLang === "ja" ? "変換後に元ファイルを削除" : "Delete input file"}</span>
                        </label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={alwaysOnTop} 
                            onChange={(e) => setAlwaysOnTop(e.target.checked)}
                            className="rounded accent-amber-500" 
                          />
                          <span>{simLang === "ja" ? "最前面" : "Always on top"}</span>
                        </label>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Simulation Logs & Verifier files */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                
                {/* Simulated Verification files table chooser */}
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <HardDrive className="h-4 w-4 text-amber-500" />
                      {t.sampleFilesTitle}
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-medium">Click a file below to select it</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {MOCK_FILES.map((ffile) => {
                      const isSelected = selectedFile?.name === ffile.name;
                      return (
                        <button
                          key={ffile.name}
                          disabled={converting}
                          onClick={() => {
                            setSelectedFile(ffile);
                            setSimError(null);
                          }}
                          className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                            isSelected 
                              ? "bg-amber-500/[0.04] border-amber-500/40 text-amber-200" 
                              : "bg-zinc-950/40 border-zinc-900 text-zinc-350 hover:border-zinc-850 hover:bg-zinc-950/80"
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {ffile.type === "video" ? (
                              <FileVideo className="h-4 w-4 text-amber-400" />
                            ) : (
                              <FileAudio className="h-4 w-4 text-amber-400" />
                            )}
                            <div className="truncate">
                              <div className="text-[11px] font-bold truncate leading-tight">{ffile.name}</div>
                              <span className="text-[9px] text-zinc-550 font-mono">{ffile.size}</span>
                            </div>
                          </div>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-amber-505 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    {t.simButtonTip}
                  </p>
                </div>

                {/* Validation Alarm segment */}
                {simError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-rose-300 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                    <div>
                      <span className="font-semibold block mb-0.5">{simLang === "ja" ? "バリデーション・ガード" : "Validation Guard"}</span>
                      {simError}
                    </div>
                  </div>
                )}

                {/* Simulated FFmpeg detailed console parser outputs */}
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl overflow-hidden flex-1 flex flex-col min-h-[220px]">
                  <div className="bg-zinc-950/60 px-4 py-2 flex items-center justify-between text-xs border-b border-zinc-900/60">
                    <span className="text-zinc-200 font-medium font-mono flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-amber-550" />
                      {t.terminalTitle}
                    </span>
                    <span className="text-[10px] text-zinc-500">stderr parser</span>
                  </div>
                  
                  <div className="bg-[#0c0c0e] p-4 font-mono text-[11px] text-zinc-305 space-y-1.5 flex-1 overflow-y-auto max-h-[300px] leading-relaxed">
                    {logs.length === 0 ? (
                      <div className="text-zinc-500 italic h-full flex items-center justify-center py-10">
                        {simLang === "ja" ? "パイプラインのログ待機中：右側の「フォーマット機能」をクリック..." : "Awaiting pipeline logs: Click on the format target conversion buttons..."}
                      </div>
                    ) : (
                      <div className="flex flex-col-reverse space-y-reverse space-y-1">
                        {logs.map((log, i) => (
                          <div 
                            key={i} 
                            className={`font-mono leading-relaxed transition duration-75 ${
                              log.includes("[system]") 
                                ? (log.includes("SUCCESS") ? "text-emerald-400 font-bold" : log.includes("CLEANUP") ? "text-blue-400 font-bold" : "text-zinc-400 font-medium") 
                                : log.includes("[error]") 
                                  ? "text-rose-400 font-semibold bg-red-950/20 px-1 py-0.5 rounded" 
                                  : "text-zinc-350"
                            }`}
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Side: Code Files List (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-amber-500" />
                    {currentLang === "ja" ? "ソースコードファイル" : "Source Code Files"}
                  </h3>
                  <div className="space-y-1.5 font-mono">
                    {Object.keys(CODE_FILES).map((fname) => {
                      const isActive = selectedCodeFile === fname;
                      return (
                        <button
                          key={fname}
                          onClick={() => {
                            setSelectedCodeFile(fname);
                            setCopiedText(false);
                          }}
                          className={`w-full p-2.5 rounded-lg border text-left transition duration-150 flex items-center space-x-2.5 ${
                            isActive 
                              ? "bg-amber-500/[0.04] border-amber-500/40 text-amber-200" 
                              : "bg-zinc-950/40 border-zinc-900 text-zinc-350 hover:border-zinc-850 hover:bg-zinc-950/80"
                          }`}
                        >
                          <Terminal className="h-4 w-4 text-amber-500 shrink-0" />
                          <div className="truncate flex-1">
                            <div className="text-[11px] font-bold truncate leading-tight">{fname}</div>
                            <span className="text-[9px] text-zinc-500 block truncate leading-tight mt-0.5">{CODE_FILES[fname].desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side: Syntax Code block rendering (lg:col-span-8) */}
              <div className="lg:col-span-8 flex flex-col bg-zinc-900/40 border border-zinc-900 rounded-xl overflow-hidden min-h-[400px]">
                {/* Block header */}
                <div className="bg-zinc-950/40 px-4 py-3 border-b border-zinc-900 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-zinc-950 font-mono text-[10px] text-amber-400 border border-zinc-900">
                      {CODE_FILES[selectedCodeFile].lang}
                    </span>
                    <span className="font-mono text-zinc-200 font-bold">{selectedCodeFile}</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(CODE_FILES[selectedCodeFile].content);
                      triggerCopyNotice();
                    }}
                    className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-205 active:scale-95 px-3 py-1.5 rounded-lg border border-zinc-850 transition"
                  >
                    {copiedText ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400 font-medium">{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-[11px]">{t.copyCode}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Main Code View block */}
                <div className="p-4 flex-1 font-mono text-xs text-zinc-300 leading-relaxed overflow-auto max-h-[480px] bg-zinc-950/90">
                  <pre className="whitespace-pre-wrap select-all font-mono">
                    {CODE_FILES[selectedCodeFile].content}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📚 Bilingual Detailed Deployment Documentation block */}
        <section className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-2 mb-4 border-b border-zinc-900 pb-3">
            <Info className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              {t.setupDoc} (Bilingual Build Guidelines)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[12px] leading-relaxed text-zinc-400">
            
            {/* Japanese guide */}
            <div className="space-y-3 border-r border-zinc-900/60 pr-0 md:pr-6">
              <h3 className="font-bold text-zinc-200 text-xs uppercase tracking-wider flex items-center gap-1">
                🇯🇵 日本語 ローカル実行マニュアル
              </h3>
              <p>
                当アプリのファイル構造はすぐに GitHub へプッシュ・ZIPダウンロードできる形式で完全にワークスペースのルートに配置されております。
              </p>
              
              <div className="space-y-2 bg-zinc-950/85 p-3.5 rounded-xl border border-zinc-900 font-mono text-[11px]">
                <div className="text-zinc-300 font-semibold">1. 依存ライブラリのインストール</div>
                <div className="text-zinc-400">pip install -r requirements.txt</div>
                
                <div className="text-zinc-300 font-semibold mt-2">2. Pythonスクリプトの起動</div>
                <div className="text-zinc-400">python flicff_converter.py</div>
              </div>

              <ul className="list-disc pl-4 space-y-1 text-zinc-500 text-[11px]">
                <li><strong>FFmpegの自動セットアップ:</strong> もしシステムにFFmpegが入っていなくても、起動時にダイアログで「はい」を選ぶと、アプリ自身のフォルダ内にFFmpegの公式静的ビルドを自動で安全にダウンロード＆解凍します。</li>
                <li><strong>Windowsインストーラー:</strong> リポジトリ内の Inno Setup スクリプトファイル (<code className="font-mono bg-zinc-950 px-1 py-0.5 rounded text-zinc-405">installer_windows.iss</code>) を Inno Setup でコンパイルすることで、PATH登録まで自動化するインストーラー `.exe` が作れます。</li>
                <li><strong>Macへの配備:</strong> ターミナルで <code className="font-mono bg-zinc-950 px-1 py-0.5 rounded text-zinc-405">chmod +x install_mac.sh && ./install_mac.sh</code> を叩くだけで、BrewでのFFmpeg自動取得、および PyInstaller によるMac用実行マシンのパッケージング化が連動します。</li>
              </ul>
            </div>

            {/* English guide */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1">
                🇺🇸 English Deploy & Bundle Manual
              </h3>
              <p>
                All workspace code structures contain full executable packages. Run locally, distribute, or bundle cross-compiler executables in moments.
              </p>
              
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-850 font-mono text-[11px]">
                <div className="text-slate-300 font-semibold">1. Install Dependencies</div>
                <div className="text-slate-400">pip install -r requirements.txt</div>
                
                <div className="text-slate-300 font-semibold mt-2">2. Launch Executable</div>
                <div className="text-slate-400">python flicff_converter.py</div>
              </div>

              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li><strong>Automatic FFmpeg Detection:</strong> If missing, the applet prompts user confirmation to fetch download binaries and packs them locally instantly in the root folder context.</li>
                <li><strong>Inno Setup Compiler:</strong> Fire up Inno Setup with the provided <code className="font-mono bg-slate-950 px-1 py-0.5 rounded">installer_windows.iss</code> to bundle the standalone binary and system environment PATH modifications easily on Windows.</li>
                <li><strong>macOS Compilation:</strong> Executing <code className="font-mono bg-slate-950 px-1 py-0.5 rounded">build ./install_mac.sh</code> automatically checks for Homebrew dependencies, activates venv, compiles, and saves a Double-clickable Native Mac App bundle.</li>
              </ul>
            </div>

          </div>
        </section>

      </main>

      {/* 🚀 Simple polished footer */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-500 py-6 px-6 text-center text-xs">
        <p>© 2026 FlicFF Team. Powered by standard robust FFmpeg engine controls.</p>
      </footer>
    </div>
  );
}
