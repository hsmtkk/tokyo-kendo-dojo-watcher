$accessToken = $env:BAND_ACCESS_TOKEN
if (-not $accessToken) {
    Write-Error "環境変数 BAND_ACCESS_TOKEN が設定されていません。"
    exit 1
}

$url = "https://openapi.band.us/v2.1/bands?access_token=$accessToken"
try {
    $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Output $response.Content
}
catch {
    Write-Error "APIリクエストに失敗しました: $_"
    exit 1
}
