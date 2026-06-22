# Start MongoDB (portable installation)
$mongodPath = "C:\Users\nerij\mongodb\mongodb-win32-x86_64-windows-8.0.12\bin\mongod.exe"
$dataPath   = "C:\Users\nerij\mongodb-data"
$logPath    = "$dataPath\mongod.log"

New-Item -ItemType Directory -Path $dataPath -Force | Out-Null

$proc = Get-Process mongod -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "MongoDB is already running (PID $($proc.Id))"
} else {
    Start-Process -FilePath $mongodPath `
        -ArgumentList "--dbpath `"$dataPath`" --port 27017 --logpath `"$logPath`" --logappend" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "MongoDB started. Data: $dataPath | Log: $logPath"
}
