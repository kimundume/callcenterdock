# Build script for CallDocker Dashboard with Widget
Write-Host "Building CallDocker Dashboard..." -ForegroundColor Green

# Build the dashboard
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dashboard built successfully!" -ForegroundColor Green
    
    # Copy widget files to dist directory
    Write-Host "Copying widget files..." -ForegroundColor Yellow
    $widgetSource = "..\widget\*"
    $widgetDest = "dist\"
    
    if (Test-Path $widgetSource) {
        Copy-Item -Path $widgetSource -Destination $widgetDest -Recurse -Force
        Write-Host "Widget files copied successfully!" -ForegroundColor Green
        
        # Force copy widget.js to ensure it's always updated
        Copy-Item -Path "..\widget\widget.js" -Destination "dist\widget.js" -Force
        Write-Host "Widget.js force copied!" -ForegroundColor Green
    } else {
        Write-Host "Warning: Widget source directory not found!" -ForegroundColor Yellow
    }
    
    Write-Host "Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
} 