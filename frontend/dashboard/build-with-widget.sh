#!/bin/bash

# Build script for CallDocker Dashboard with Widget
echo "Building CallDocker Dashboard..."

# Build the dashboard
npm run build

if [ $? -eq 0 ]; then
    echo "Dashboard built successfully!"
    
    # Copy widget files to dist directory
    echo "Copying widget files..."
    WIDGET_SOURCE="../widget/*"
    WIDGET_DEST="dist/"
    
    if [ -d "../widget" ]; then
        cp -r $WIDGET_SOURCE $WIDGET_DEST
        echo "Widget files copied successfully!"
        
        # Force copy widget.js to ensure it's always updated
        cp ../widget/widget.js dist/widget.js
        echo "Widget.js force copied!"
    else
        echo "Warning: Widget source directory not found!"
    fi
    
    echo "Build completed successfully!"
else
    echo "Build failed!"
    exit 1
fi 