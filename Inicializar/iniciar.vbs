Option Explicit
Dim sh, fso, scriptDir, pasta, logs, url,urlApi, perfil, flag, navegador, iniciou, inicio, i

Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)   ' ...\inicializacao
pasta = fso.GetParentFolderName(scriptDir)                    ' raiz do projeto
logs = scriptDir & "\logs"
sh.CurrentDirectory = pasta

url = "http://localhost:5173"
urlApi = "http://localhost:3001/api/pronto"

perfil = sh.ExpandEnvironmentStrings("%LocalAppData%") & "\MeusTecidos"
flag = sh.ExpandEnvironmentStrings("%TEMP%") & "\meustecidos_fechar.flag"
If Not fso.FolderExists(perfil) Then fso.CreateFolder perfil
If Not fso.FolderExists(logs) Then fso.CreateFolder logs
iniciou = False

Function Responde(endereco)
  Dim http
  Responde = False
  On Error Resume Next
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 500, 500, 500, 500
  http.open "GET", endereco, False
  http.send
  If Err.Number = 0 Then Responde = (http.Status = 200)
  Err.Clear
  On Error GoTo 0
End Function

Function AchaNavegador()
  Dim lista, c
  lista = Array( _
    sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe", _
    sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe", _
    sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe", _
    sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe", _
    sh.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe")
  AchaNavegador = ""
  For Each c In lista
    If fso.FileExists(c) Then
      AchaNavegador = c
      Exit Function
    End If
  Next
End Function

Sub ApagaFlag()
  On Error Resume Next
  If fso.FileExists(flag) Then fso.DeleteFile flag, True
  On Error GoTo 0
End Sub

Sub AbreSplash()
  On Error Resume Next
  If fso.FileExists(scriptDir & "\abrindo.ps1") Then
    sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "\abrindo.ps1""", 0, False
  End If
  On Error GoTo 0
End Sub

Sub FechaSplash()
  On Error Resume Next
  fso.CreateTextFile(flag, True).Close
  On Error GoTo 0
End Sub

' Primeira vez: instala as dependencias
If Not fso.FolderExists(pasta & "\node_modules") Then
  MsgBox "Primeira vez: vou instalar as dependencias. Pode demorar um pouco.", 64, "Meus Tecidos"
  If sh.Run("cmd /c npm install", 1, True) <> 0 Then
    MsgBox "Erro na instalacao. Abra o cmd na pasta do projeto e rode npm install para ver o erro.", 16, "Meus Tecidos"
    WScript.Quit
  End If
End If

ApagaFlag

' Liga servidor e site ANTES do splash, para trabalharem em paralelo.
' O Vite e chamado direto pelo node (sem passar pelo npm, que e lento).
If Not Responde("http://localhost:3001/api/estado") Then
  iniciou = True
  sh.Environment("Process")("AUTO_ENCERRAR") = "1"
  sh.Run "cmd /c node server/index.js > """ & logs & "\api.log"" 2>&1", 0, False
  sh.Run "cmd /c node node_modules/vite/bin/vite.js --strictPort > """ & logs & "\site.log"" 2>&1", 0, False
End If

AbreSplash

' 1) Espera o back (e o banco) ficarem prontos (ate uns 30 segundos)
For i = 1 To 150
  If Responde(urlApi) Then Exit For
  WScript.Sleep 200
Next
If Not Responde(urlApi) Then
  FechaSplash
  If iniciou Then sh.Run "cmd /c """ & scriptDir & "\parar.bat""", 0, True
  MsgBox "O servidor ou o banco de dados nao respondeu. Veja inicializacao\logs\api.log e confira se o PostgreSQL esta rodando.", 16, "Meus Tecidos"
  WScript.Quit
End If

' 2) Espera o site (ate uns 40 segundos)
For i = 1 To 200
  If Responde(url) Then Exit For
  WScript.Sleep 200
Next
If Not Responde(url) Then
  FechaSplash
  If iniciou Then sh.Run "cmd /c """ & scriptDir & "\parar.bat""", 0, True
  MsgBox "O site nao iniciou. Veja os arquivos em inicializacao\logs.", 16, "Meus Tecidos"
  WScript.Quit
End If