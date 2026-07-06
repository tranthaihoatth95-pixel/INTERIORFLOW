@echo off
chcp 65001 >nul
title InteriorFlow - Setup
echo ============================================
echo    InteriorFlow  -  Cai dat may Windows
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] CHUA CO Node.js.
  echo     Tai ban LTS tai:  https://nodejs.org
  echo     Cai xong, chay lai file setup-windows.bat nay.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [OK] Node %%v
echo.

echo [1/4] Cai thu vien (npm install) - co the vai phut...
call npm install
if errorlevel 1 ( echo [X] Loi npm install & pause & exit /b 1 )
echo.

echo [2/4] Tao file cau hinh (.env) neu chua co...
if not exist ".env" (
  > .env echo DATABASE_URL="file:./prisma/dev.db"
  >> .env echo AUTH_SECRET="if-%RANDOM%%RANDOM%%RANDOM%%RANDOM%-doi-chuoi-nay"
  echo     Da tao .env
)
if not exist ".env.local" (
  > .env.local echo COMFYUI_URL=http://127.0.0.1:8188
  echo     Da tao .env.local (tro ComfyUI local - de render FLUX ngay tren may nay)
)
echo.

echo [3/4] Tao database (Prisma)...
call npx prisma generate
call npx prisma db push
echo.

echo ============================================
echo   XONG! Dang khoi dong app...
echo   Mo trinh duyet:  http://localhost:3000
echo   (Dang ky tai khoan dau tien = admin)
echo   Export Deck: tai duoc ca PDF va PowerPoint (.pptx)
echo   Tat app: dong cua so nay hoac Ctrl+C
echo ============================================
echo.
call npm run dev
pause
