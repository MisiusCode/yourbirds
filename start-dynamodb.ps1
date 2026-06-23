# Start DynamoDB Local via Docker (replaces start-mongodb.ps1)
# First time: docker pull amazon/dynamodb-local
# Requires Docker Desktop to be running

$running = docker ps --filter "name=dynamodb-local" --format "{{.Names}}" 2>$null
if ($running -eq "dynamodb-local") {
    Write-Host "DynamoDB Local is already running on port 8000"
} else {
    $exists = docker ps -a --filter "name=dynamodb-local" --format "{{.Names}}" 2>$null
    if ($exists -eq "dynamodb-local") {
        Write-Host "Starting existing DynamoDB Local container..."
        docker start dynamodb-local
    } else {
        Write-Host "Creating and starting DynamoDB Local container..."
        docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local
    }
    Write-Host "DynamoDB Local is running at http://localhost:8000"
    Write-Host ""
    Write-Host "First time only — create tables:"
    Write-Host "  node backend/scripts/setupLocalTables.js"
    Write-Host "  node backend/scripts/seedBirdNames.js"
}
