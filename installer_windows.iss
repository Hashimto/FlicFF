; FlicFF Audio/Video Converter Inno Setup Configuration Script
; This script compiles a professional Windows Installer (.exe) that bundles the application and auto-configures paths.

[Setup]
AppId={{C52F1EA0-891E-47C2-AF3F-CF7344BBF3AC}
AppName=FlicFF
AppVersion=1.0.0
AppPublisher=FlicFF Team
DefaultDirName={autopf}\FlicFF
DefaultGroupName=FlicFF
AllowNoIcons=yes
OutputDir=.
OutputBaseFilename=FlicFF_Setup_Windows
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "envpath"; Description: "Add FFmpeg bin to System PATH environment variables"; GroupDescription: "System Integration:"

[Files]
; Compile python first using: pyinstaller --noconsole --onefile flicff_converter.py
Source: "dist\flicff_converter.exe"; DestDir: "{app}"; Flags: ignoreversion
; Optional: If user puts ffmpeg binary locally, we bundle it!
Source: "ffmpeg.exe"; DestDir: "{app}"; Flags: skipifsourcedoesntexist

[Icons]
Name: "{group}\FlicFF"; Filename: "{app}\flicff_converter.exe"
Name: "{group}\{cm:UninstallProgram,FlicFF}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\FlicFF"; Filename: "{app}\flicff_converter.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\flicff_converter.exe"; Description: "{cm:LaunchProgram,FlicFF}"; Flags: nowait postinstall skipifsilent

[Code]
// Pascal routine check during installation to look for FFmpeg or install path modifications
procedure CurStepChanged(CurStep: TSetupStep);
var
  PathVar: String;
  AppDirectory: String;
begin
  if (CurStep = ssPostInstall) and IsTaskSelected('envpath') then
  begin
    AppDirectory := ExpandConstant('{app}');
    // Query Registry system PATH values
    if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', PathVar) then
    begin
      // Append if directory path isn't present
      if Pos(AppDirectory, PathVar) = 0 then
      begin
        RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', PathVar + ';' + AppDirectory);
      end;
    end
    else if RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'PATH', PathVar) then
    begin
      if Pos(AppDirectory, PathVar) = 0 then
      begin
        RegWriteStringValue(HKEY_CURRENT_USER, 'Environment', 'PATH', PathVar + ';' + AppDirectory);
      end;
    end;
  end;
end;
