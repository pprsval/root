param([string]$Root = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
$Root = [IO.Path]::GetFullPath($Root)
$utf8 = New-Object System.Text.UTF8Encoding($false)
# Match JavaScript whitespace, including the BOM, but excluding .NET-only U+0085.
$space = '[\u0009-\u000D\u0020\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]'
function Trim-Text([string]$Text) {
    return [regex]::Replace($Text, "^$space+|$space+$", '')
}
function Clean-Title([string]$Name) {
    $text = [regex]::Replace($Name, '\.[^/.]+$', '') -replace '[-_]', ' '
    return Trim-Text ([regex]::Replace($text, "$space+", ' '))
}
function Get-Meta([string]$Html, [string]$Name) {
    $pattern = '<meta' + $space + '+[^>]*name=["'']' + [regex]::Escape($Name) + '["''][^>]*content=["'']([^"'']*)["''][^>]*>'
    $match = [regex]::Match($Html, $pattern, 'IgnoreCase,CultureInvariant')
    if ($match.Success) { return Trim-Text $match.Groups[1].Value }
    return ''
}
foreach ($name in @('cad', 'photo', 'drawings', 'writings')) {
    $folder = Join-Path $Root "assets/$name"
    if (-not [IO.Directory]::Exists($folder)) {
        Write-Warning "Folder not found: assets/$name"
        continue
    }
    $items = New-Object 'System.Collections.Generic.List[object]'
    foreach ($fullPath in [IO.Directory]::GetFileSystemEntries($folder)) {
        $entry = [IO.Path]::GetFileName($fullPath)
        if ($entry.StartsWith('.')) { continue }
        $stat = Get-Item -LiteralPath $fullPath -Force
        $date = $stat.LastWriteTimeUtc.ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
        if ($stat.PSIsContainer) {
            $indexPath = Join-Path $fullPath 'index.html'
            if (-not [IO.File]::Exists($indexPath)) { continue }
            $html = [IO.File]::ReadAllText($indexPath, $utf8)
            $title = Get-Meta $html 'post-title'
            if (-not $title) { $title = Clean-Title $entry }
            $metaDate = Get-Meta $html 'post-date'
            if ($metaDate) { $date = $metaDate -replace '^([0-9]{4})\.([0-9]{2})\.([0-9]{2})$', '$1-$2-$3' }
            $type = Get-Meta $html 'post-type'
            if (-not $type) { $type = 'Műhelynapló' }
            $thumb = Get-Meta $html 'post-thumb'
            $cover = $null
            if ($thumb) { $cover = "$entry/$thumb" }
            $items.Add([ordered]@{
                title = $title; file = "$entry/index.html"; date = $date
                type = $type; description = (Get-Meta $html 'post-description')
                cover = $cover; tags = @($name, 'blog')
            })
        } elseif ($entry -match '\.(png|jpg|jpeg|webp|pdf)$') {
            $items.Add([ordered]@{ title = (Clean-Title $entry); file = $entry; date = $date; tags = @($name) })
        }
    }
    $items.Sort([System.Comparison[object]]{
        param($a, $b)
        $order = [StringComparer]::Ordinal.Compare($b.date, $a.date)
        if ($order -eq 0) { $order = [StringComparer]::Ordinal.Compare($a.file, $b.file) }
        return $order
    })
    $output = Join-Path $Root 'data'
    [void][IO.Directory]::CreateDirectory($output)
    # -InputObject preserves arrays for zero and one item on Windows PowerShell 5.1.
    $json = ConvertTo-Json -InputObject @($items.ToArray()) -Depth 10
    [IO.File]::WriteAllText((Join-Path $output "$name.json"), $json, $utf8)
    Write-Host "$name.json updated ($($items.Count) items)"
}