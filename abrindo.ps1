# Telinha de abertura sem barra de titulo.
# Fecha quando o iniciar.vbs cria o arquivo de sinal (ou apos 60 segundos, por seguranca).
$log  = Join-Path $env:TEMP 'meustecidos_splash.log'
$flag = Join-Path $env:TEMP 'meustecidos_fechar.flag'

try {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  [System.Windows.Forms.Application]::EnableVisualStyles()

  $tinta = [System.Drawing.ColorTranslator]::FromHtml('#23224a')
  $suave = [System.Drawing.ColorTranslator]::FromHtml('#6b6a85')
  $papel = [System.Drawing.ColorTranslator]::FromHtml('#eeedf3')
  $linha = [System.Drawing.ColorTranslator]::FromHtml('#b9b7cc')
  $trilho = [System.Drawing.ColorTranslator]::FromHtml('#d6d4e0')
  $miolo = [System.Drawing.ColorTranslator]::FromHtml('#7f7cd6')
  $fio   = [System.Drawing.ColorTranslator]::FromHtml('#625fbe')

  $inicio = Get-Date
  $limite = $inicio.AddSeconds(60)

  $script:form = New-Object System.Windows.Forms.Form
  $form.FormBorderStyle = 'None'
  $form.StartPosition   = 'CenterScreen'
  $form.ClientSize      = New-Object System.Drawing.Size(420, 260)
  $form.BackColor       = $papel
  $form.ShowInTaskbar   = $false
  $form.TopMost         = $true
  $form.Cursor          = [System.Windows.Forms.Cursors]::AppStarting   # cursor de "ocupado"

  # Evita piscar ao redesenhar
  [System.Windows.Forms.Form].GetProperty('DoubleBuffered', [System.Reflection.BindingFlags]'Instance,NonPublic').SetValue($form, $true, $null)

  $form.Add_Paint({
    param($s, $e)
    try {
      $g = $e.Graphics
      $g.SmoothingMode = 'AntiAlias'
      $g.TextRenderingHint = 'ClearTypeGridFit'
      $g.Clear($papel)

      # Funcao local para retangulo arredondado
      $arredondado = {
        param($g, $brush, $x, $y, $w, $h, $r)
        $p = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $r * 2
        $p.AddArc($x, $y, $d, $d, 180, 90)
        $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
        $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
        $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
        $p.CloseFigure()
        $g.FillPath($brush, $p)
        $p.Dispose()
      }

      # --- Logo (carretel), desenhado em uma grade de 100x100 ---
      $g.TranslateTransform(170, 30)
      $g.ScaleTransform(0.8, 0.8)
      $bTinta = New-Object System.Drawing.SolidBrush($tinta)
      $bPapel = New-Object System.Drawing.SolidBrush($papel)
      $bMiolo = New-Object System.Drawing.SolidBrush($miolo)
      & $arredondado $g $bTinta 0 0 100 100 22
      & $arredondado $g $bPapel 25 17 50 11 4
      & $arredondado $g $bPapel 25 73 50 11 4
      $g.FillRectangle($bMiolo, 31, 28, 38, 45)
      $pFio = New-Object System.Drawing.Pen($fio, 2.5)
      $g.DrawLine($pFio, 31, 38, 69, 40)
      $g.DrawLine($pFio, 31, 48, 69, 50)
      $g.DrawLine($pFio, 31, 58, 69, 60)
      $pAgulha = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2.5)
      $g.DrawLine($pAgulha, 76, 22, 55, 44)
      $g.ResetTransform()
      $bTinta.Dispose(); $bPapel.Dispose(); $bMiolo.Dispose(); $pFio.Dispose(); $pAgulha.Dispose()

      # --- Textos ---
      $centro = New-Object System.Drawing.StringFormat
      $centro.Alignment = 'Center'
      $fTitulo = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
      $fMsg    = New-Object System.Drawing.Font('Segoe UI', 10)
      $bT = New-Object System.Drawing.SolidBrush($tinta)
      $bS = New-Object System.Drawing.SolidBrush($suave)
      $g.DrawString('Meus Tecidos', $fTitulo, $bT, (New-Object System.Drawing.RectangleF(0, 124, 420, 34)), $centro)
      $g.DrawString('Iniciando o sistema, aguarde...', $fMsg, $bS, (New-Object System.Drawing.RectangleF(0, 160, 420, 24)), $centro)
      $fTitulo.Dispose(); $fMsg.Dispose(); $bT.Dispose(); $bS.Dispose(); $centro.Dispose()

      # --- Barra de progresso animada ---
      $bTrilho = New-Object System.Drawing.SolidBrush($trilho)
      $g.FillRectangle($bTrilho, 100, 204, 220, 6)
      $ms  = ((Get-Date) - $inicio).TotalMilliseconds
      $pos = (($ms % 1300) / 1300) * (220 + 88) - 88
      $g.SetClip((New-Object System.Drawing.Rectangle(100, 204, 220, 6)))
      $bBarra = New-Object System.Drawing.SolidBrush($tinta)
      $g.FillRectangle($bBarra, (100 + $pos), 204, 88, 6)
      $g.ResetClip()
      $bTrilho.Dispose(); $bBarra.Dispose()

      # --- Borda ---
      $pBorda = New-Object System.Drawing.Pen($linha)
      $g.DrawRectangle($pBorda, 0, 0, $form.Width - 1, $form.Height - 1)
      $pBorda.Dispose()
    } catch {
      Add-Content -Path $log -Value ("[Paint] " + $_.Exception.ToString())
    }
  })

  # Anima a barra
  $anim = New-Object System.Windows.Forms.Timer
  $anim.Interval = 33
  $anim.Add_Tick({ $script:form.Invalidate((New-Object System.Drawing.Rectangle(90, 196, 240, 24))) })

  # Confere se deve fechar (sinal do iniciar.vbs ou tempo limite)
  $checa = New-Object System.Windows.Forms.Timer
  $checa.Interval = 300
  $checa.Add_Tick({
    try {
      if ((Test-Path $flag) -or ((Get-Date) -gt $limite)) { $script:form.Close() }
    } catch {
      Add-Content -Path $log -Value ("[Checa] " + $_.Exception.ToString())
    }
  })

  $form.Add_Shown({ $anim.Start(); $checa.Start() })
  $form.Add_FormClosed({
    $anim.Stop(); $checa.Stop()
    Remove-Item $flag -ErrorAction SilentlyContinue
  })

  [System.Windows.Forms.Application]::Run($form)
}
catch {
  Add-Content -Path $log -Value ("[Geral] " + $_.Exception.ToString())
}