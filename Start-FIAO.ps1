$ErrorActionPreference = "Stop"

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:8765/")

$contentTypes = @{
  ".avif" = "image/avif"
  ".css" = "text/css; charset=utf-8"
  ".gif" = "image/gif"
  ".html" = "text/html; charset=utf-8"
  ".ico" = "image/x-icon"
  ".jpeg" = "image/jpeg"
  ".jpg" = "image/jpeg"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".svg" = "image/svg+xml"
  ".webp" = "image/webp"
  ".woff2" = "font/woff2"
}

try {
  $listener.Start()
} catch {
  Write-Error "No se pudo iniciar FIA'O en localhost:8765. Cierra la ventana anterior de FIA'O e inténtalo otra vez. $($_.Exception.Message)"
  exit 1
}

$url = "http://127.0.0.1:8765/index.html"
Write-Host "FIA'O está disponible en $url"
Write-Host "Deja esta ventana abierta mientras usas la aplicación."
Start-Process $url

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    $response.Headers["X-Content-Type-Options"] = "nosniff"
    $response.Headers["Cache-Control"] = "no-store"

    if ($context.Request.HttpMethod -notin @("GET", "HEAD")) {
      $response.StatusCode = 405
      $response.Close()
      continue
    }

    $relativePath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
      $relativePath = "index.html"
    }
    $relativePath = $relativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relativePath))
    if (-not $filePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or -not [System.IO.File]::Exists($filePath)) {
      $response.StatusCode = 404
      $response.Close()
      continue
    }

    $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    if ($contentTypes.ContainsKey($extension)) {
      $response.ContentType = $contentTypes[$extension]
    } else {
      $response.ContentType = "application/octet-stream"
    }
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $response.ContentLength64 = $bytes.Length
    if ($context.Request.HttpMethod -eq "GET") {
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $response.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
