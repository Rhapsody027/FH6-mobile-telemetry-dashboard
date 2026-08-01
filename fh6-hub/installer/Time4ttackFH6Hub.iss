#define AppName "Time4ttack FH6 Hub"
#define AppVersion "0.1.0"
#define AppPublisher "Time4ttack"
#define AppExeName "Time4ttack-FH6-Hub.exe"
#define AppId "{{D3B1E7A8-2D4A-4E67-9D98-5B8D6F8A1F07}"

#ifndef SourceDir
  #define SourceDir "..\out\windows-installer\hub"
#endif

#ifndef OutputDir
  #define OutputDir "..\out\installer"
#endif

#ifndef AppVersionOverride
  #define AppVersionOverride AppVersion
#endif

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersionOverride}
AppVerName={#AppName} {#AppVersionOverride}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\Time4ttack\FH6 Hub
DefaultGroupName=Time4ttack FH6 Hub
DisableProgramGroupPage=yes
DisableDirPage=no
OutputDir={#OutputDir}
OutputBaseFilename=Time4ttack-FH6-Hub-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#AppExeName}
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked
Name: "startup_hub"; Description: "Start hub when Windows signs in"; GroupDescription: "Startup behavior:"; Flags: exclusive
Name: "startup_watcher"; Description: "Start only when Forza Horizon is running (launch watcher at sign-in)"; GroupDescription: "Startup behavior:"; Flags: exclusive unchecked

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "Time4ttack_FH6_Hub"; ValueData: """{app}\{#AppExeName}"""; Flags: uninsdeletevalue; Tasks: startup_hub
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "Time4ttack_FH6_Hub_Watcher"; ValueData: """{app}\Time4ttack-FH6-Watcher.exe"" --hub-exe ""{app}\{#AppExeName}"""; Flags: uninsdeletevalue; Tasks: startup_watcher

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Launch {#AppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[UninstallRun]
Filename: "{cmd}"; Parameters: "/C taskkill /IM Time4ttack-FH6-Watcher.exe /F >NUL 2>&1"; Flags: runhidden
Filename: "{cmd}"; Parameters: "/C taskkill /IM Time4ttack-FH6-Hub.exe /F >NUL 2>&1"; Flags: runhidden
Filename: "{cmd}"; Parameters: "/C del /F /Q ""%TEMP%\time4ttack-fh6-pairing-qr.png"" >NUL 2>&1"; Flags: runhidden

[Code]
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    RegDeleteValue(HKCU, 'Software\Microsoft\Windows\CurrentVersion\Run', 'Time4ttack_FH6_Hub');
    RegDeleteValue(HKCU, 'Software\Microsoft\Windows\CurrentVersion\Run', 'Time4ttack_FH6_Hub_Watcher');
  end;
end;