:: Remove any modules that already exist
rmdir /s /q node_modules

:: Install modules listed in package.json
call npm i
call ./node_modules/.bin/electron-rebuild
echo "Done"
pause