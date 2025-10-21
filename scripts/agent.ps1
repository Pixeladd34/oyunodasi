param(
  [string]$ApiBase = "https://<projeniz>.vercel.app",
  [string]$DeviceId = "$env:COMPUTERNAME",
  [string]$Secret = "<UPLOAD_SECRET>"
)

$ErrorActionPreference = "Stop"

function Capture-Screenshot {
  param([string]$Path)
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  $bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
  $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object {$_.MimeType -eq "image/jpeg"}
  $enc = New-Object System.Drawing.Imaging.EncoderParameters 1
  $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 60L
  $bitmap.Save($Path, $jpegCodec, $enc)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$work = Join-Path $env:TEMP ("shot_"+[Guid]::NewGuid().ToString()+".jpg")
try {
  Capture-Screenshot -Path $work

  $uri = "$ApiBase/api/upload?deviceId=$([uri]::EscapeDataString($DeviceId))"
  $headers = @{
    "Authorization" = "Bearer $Secret"
    "x-hostname"    = $env:COMPUTERNAME
    "Content-Type"  = "image/jpeg"
  }

  Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -InFile $work | Out-Null
}
finally {
  if (Test-Path $work) { Remove-Item $work -Force }
}

