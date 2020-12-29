:: Remove the build directory if it already exists
rmdir /s /q "dist"

:: Build
call .\node_modules\.bin\electron-packager . --platform=win32 --archx64 --no-prune

echo "Done"
pause