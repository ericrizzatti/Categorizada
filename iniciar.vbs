Option Explicit
Dim sh, fso, pasta, url, perfil, navegador, iniciou, inicio, i

Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
pasta = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = pasta
url = "http://localhost:5173"
perfil = sh.ExpandEnvironmentStrings("%LocalAppData%") & "\MeusTecidos"
If Not fso.FolderExists(perfil) Then fso.CreateFolder perfil
iniciou = False

' Testa se um endereco responde (sem abrir janela nenhuma)
Function Responde(endereco)
  Dim http
  On Error Resume Next
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 1000, 1000, 1000, 1000
  http.open "GET", endereco, False
  http.send
  Responde = (Err.Number = 0)
  Err.Clear
  On Error GoTo 0
End Function

' Procura Edge ou Chrome instalados
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

' Janela de abertura (se der qualquer problema, segue sem ela)
Sub AbreSplash()
  On Error Resume Next
  If fso.FileExists(pasta & "\abrindo.ps1") Then
    ' Apaga um sinal de fechamento antigo, se tiver sobrado
    If fso.FileExists(sh.ExpandEnvironmentStrings("%TEMP%") & "\meustecidos_fechar.flag") Then
      fso.DeleteFile sh.ExpandEnvironmentStrings("%TEMP%") & "\meustecidos_fechar.flag", True
    End If
    sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & pasta & "\abrindo.ps1""", 0, False
  End If
  On Error GoTo 0
End Sub

' Pede para a telinha fechar (usado quando algo da errado)
Sub FechaSplash()
  On Error Resume Next
  fso.CreateTextFile(sh.ExpandEnvironmentStrings("%TEMP%") & "\meustecidos_fechar.flag", True).Close
  On Error GoTo 0
End Sub

Sub FechaSplashDepois()
  On Error Resume Next
  sh.Run "cmd /c ping -n 6 127.0.0.1 >nul & type nul > """ & sh.ExpandEnvironmentStrings("%TEMP%") & "\meustecidos_fechar.flag""", 0, False
  On Error GoTo 0
End Sub

' Primeira vez: instala as dependencias (aqui a janela aparece, para ver o progresso)
If Not fso.FolderExists(pasta & "\node_modules") Then
  MsgBox "Primeira vez: vou instalar as dependencias. Pode demorar um pouco.", 64, "Meus Tecidos"
  If sh.Run("cmd /c npm install", 1, True) <> 0 Then
    MsgBox "Erro na instalacao. Abra o cmd na pasta do projeto e rode npm install para ver o erro.", 16, "Meus Tecidos"
    WScript.Quit
  End If
End If

AbreSplash

' Se o sistema ainda nao esta rodando, liga tudo escondido
If Not Responde("http://localhost:3001/api/estado") Then
  iniciou = True
  sh.Environment("Process")("AUTO_ENCERRAR") = "1"
  sh.Run "cmd /c node server/index.js > api.log 2>&1", 0, False
  sh.Run "cmd /c npm run dev -- --strictPort > site.log 2>&1", 0, False
End If

' Espera o site ficar pronto (ate uns 40 segundos)
For i = 1 To 80
  If Responde(url) Then Exit For
  WScript.Sleep 500
Next
If Not Responde(url) Then
  FechaSplash
  MsgBox "O site nao iniciou. Veja os arquivos api.log e site.log na pasta do projeto.", 16, "Meus Tecidos"
  WScript.Quit
End If

navegador = AchaNavegador()
If navegador = "" Then
  ' Sem Edge/Chrome: abre no navegador padrao (o ping do servidor encerra depois)
  FechaSplashDepois
  sh.Run url
  WScript.Quit
End If

' Abre a janela de aplicativo e espera ela ser fechada
FechaSplashDepois
inicio = Timer
sh.Run """" & navegador & """ --app=" & url & " --user-data-dir=""" & perfil & """ --window-size=1200,800 --no-first-run --no-default-browser-check", 1, True

' Janela fechada: desliga tudo (so se foi este script que ligou, e se a espera foi de verdade)
If iniciou And Abs(Timer - inicio) > 5 Then
  sh.Run "cmd /c parar.bat", 0, True
End If