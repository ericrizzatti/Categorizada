Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

pasta = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = pasta

' Primeira vez: instala as dependencias (aqui a janela aparece, para voce ver o progresso)
If Not fso.FolderExists(pasta & "\node_modules") Then
  MsgBox "Primeira vez: vou instalar as dependencias. Pode demorar um pouco.", 64, "Meus Tecidos"
  If sh.Run("cmd /c npm install", 1, True) <> 0 Then
    MsgBox "Erro na instalacao. Abra o cmd na pasta do projeto e rode npm install para ver o erro.", 16, "Meus Tecidos"
    WScript.Quit
  End If
End If

' Se ja estiver rodando (porta 3001 ocupada), so abre o navegador
Set exec = sh.Exec("cmd /c netstat -ano | findstr "":3001 "" | findstr LISTENING")
If exec.StdOut.ReadAll() <> "" Then
  sh.Run "http://localhost:5173"
  WScript.Quit
End If

' Liga o encerramento automatico e roda tudo escondido (0 = janela oculta)
sh.Environment("Process")("AUTO_ENCERRAR") = "1"

sh.Run "cmd /c node server/index.js > api.log 2>&1", 0, False
sh.Run "cmd /c npm run dev -- --open --strictPort > site.log 2>&1", 0, False