param(
  [Parameter(Mandatory=$true)][string]$Source,
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$dest = Join-Path $ProjectRoot 'public\brand'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$src = [System.Drawing.Bitmap]::FromFile($Source)
try {
 if ($src.Width -lt 512 -or $src.Height -lt 512) { throw 'Logo source too small for app icons.' }
 function Save-Icon([int]$size,[double]$fraction,[bool]$solid,[string]$name) {
   $bmp = [System.Drawing.Bitmap]::new($size,$size,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
   $g = [System.Drawing.Graphics]::FromImage($bmp)
   $clip = [System.Drawing.Drawing2D.GraphicsPath]::new()
   try {
     $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
     $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
     $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
     $g.Clear([System.Drawing.Color]::Transparent)
     if ($solid) { $g.Clear([System.Drawing.Color]::FromArgb(15,45,82)) }
     $diam = [int][Math]::Round($size*$fraction)
     $start = [int][Math]::Floor(($size-$diam)/2)
     $inset = [int][Math]::Max(1,[Math]::Round($diam*0.012))
     $clip.AddEllipse($start+$inset,$start+$inset,$diam-2*$inset,$diam-2*$inset)
     $g.SetClip($clip)
     $g.DrawImage($src,[System.Drawing.Rectangle]::new($start,$start,$diam,$diam))
     $g.ResetClip()
     $path = Join-Path $dest $name
     $bmp.Save($path,[System.Drawing.Imaging.ImageFormat]::Png)
     Write-Output ("ASSET "+$name+" "+(Get-Item $path).Length)
   } finally { $clip.Dispose(); $g.Dispose(); $bmp.Dispose() }
 }
 Save-Icon 512 1.00 $false 'logo-atp.png'
 Save-Icon 16 1.00 $false 'favicon-16.png'
 Save-Icon 32 1.00 $false 'favicon-32.png'
 Save-Icon 48 1.00 $false 'favicon-48.png'
 Save-Icon 180 0.94 $true 'apple-touch-icon.png'
 Save-Icon 192 0.92 $true 'icon-192.png'
 Save-Icon 512 0.90 $true 'icon-512.png'
 Save-Icon 512 0.65 $true 'icon-512-maskable.png'
 # OpenGraph: preserve actual emblem, create an optimized wide sharing image.
 $og = [System.Drawing.Bitmap]::new(1200,630,[System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
 $g = [System.Drawing.Graphics]::FromImage($og)
 $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
 try {
   $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
   $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
   $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
   $g.Clear([System.Drawing.Color]::FromArgb(15,45,82))
   $blue = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30,90,168))
   $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(200,162,77))
   $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
   $pale = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(226,235,247))
   $f1 = [System.Drawing.Font]::new('Segoe UI',[single]67,[System.Drawing.FontStyle]::Bold)
   $f2 = [System.Drawing.Font]::new('Segoe UI',[single]27,[System.Drawing.FontStyle]::Regular)
   $f3 = [System.Drawing.Font]::new('Segoe UI',[single]21,[System.Drawing.FontStyle]::Bold)
   try {
     $g.FillRectangle($blue,[System.Drawing.Rectangle]::new(0,584,1200,46))
     $g.FillRectangle($gold,[System.Drawing.Rectangle]::new(545,188,550,5))
     $path.AddEllipse(70,89,445,445)
     $g.SetClip($path)
     $g.DrawImage($src,[System.Drawing.Rectangle]::new(70,89,445,445))
     $g.ResetClip()
     $g.DrawString('ATPCursos',$f1,$white,[single]535,[single]210)
     $g.DrawString('Materiais em PDF para concursos',$f2,$pale,[single]542,[single]325)
     $g.DrawString('Seu material. Seu ritmo. Sua posse.',$f3,$gold,[single]544,[single]393)
     $g.DrawString('SIMULADOS  |  MAPAS MENTAIS  |  APOSTILAS',$f3,$pale,[single]542,[single]483)
     $ogPath=Join-Path $dest 'og-atpcursos.jpg'
     $og.Save($ogPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
     Write-Output ("ASSET og-atpcursos.jpg "+(Get-Item $ogPath).Length)
   } finally {$f1.Dispose();$f2.Dispose();$f3.Dispose();$pale.Dispose();$white.Dispose();$gold.Dispose();$blue.Dispose()}
 } finally {$path.Dispose();$g.Dispose();$og.Dispose()}
 # Windows .ico with 16, 32 and 48 PNG entries.
 $sizes=@(16,32,48)
 $ms=[System.IO.MemoryStream]::new()
 $bw=[System.IO.BinaryWriter]::new($ms)
 try {
  $bw.Write([UInt16]0);$bw.Write([UInt16]1);$bw.Write([UInt16]$sizes.Length)
  $offset=6+16*$sizes.Length
  $bytesList=@()
  foreach($size in $sizes) { $bytes=[System.IO.File]::ReadAllBytes((Join-Path $dest ("favicon-"+$size+".png")));$bytesList+=,$bytes
   $bw.Write([byte]$size);$bw.Write([byte]$size);$bw.Write([byte]0);$bw.Write([byte]0)
   $bw.Write([UInt16]1);$bw.Write([UInt16]32);$bw.Write([UInt32]$bytes.Length);$bw.Write([UInt32]$offset);$offset+=$bytes.Length
  }
  foreach($bytes in $bytesList){$bw.Write($bytes)}
  [System.IO.File]::WriteAllBytes((Join-Path $dest 'favicon.ico'),$ms.ToArray())
  Write-Output ("ASSET favicon.ico "+(Get-Item (Join-Path $dest 'favicon.ico')).Length)
 } finally {$bw.Dispose();$ms.Dispose()}
} finally {$src.Dispose()}
