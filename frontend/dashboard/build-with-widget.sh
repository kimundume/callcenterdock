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
    else
        echo "Warning: Widget source directory not found!"
    fi
    
    echo "Build completed successfully!"
else
    echo "Build failed!"
    exit 1
fi 