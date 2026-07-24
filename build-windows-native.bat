@echo off
chcp 65001 >nul
title InteriorFlow - Dong goi ban Windows native (.exe)
color 0f
echo ==================================================================
echo    InteriorFlow  -  Dong goi ung dung Windows NATIVE (.exe)
echo ==================================================================
echo.
echo  File nay chay 1 lan tren may Windows de tao ra bo cai .exe.
echo  Sau khi xong, ban chi can double-click file Setup trong thu muc
echo  "dist-installer" de cai nhu mot phan mem binh thuong (co icon, Start Menu,
echo  khong can trinh duyet, khong can go lenh gi nua).
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [!] Chua co Node.js tren may.
  echo      Tai ban LTS o  https://nodejs.org  -^> cai (Next -^> Next -^> Finish)
  echo      roi double-click lai file nay.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo  Node.js: %%v
echo.

echo  [1/3] Cai thu vien (lan dau co the lau 3-8 phut, can mang)...
call npm install
if errorlevel 1 ( echo. & echo  [X] npm install that bai. Kiem tra mang roi thu lai. & pause & exit /b 1 )
echo.

echo  [2/3] Build Next.js + dong goi .exe bang electron-builder...
echo        (buoc nay nang, may co the quay quat vai phut - binh thuong)
call npm run electron:build
if errorlevel 1 ( echo. & echo  [X] Build that bai. Chup man hinh loi gui lai. & pause & exit /b 1 )
echo.

echo ==================================================================
echo    XONG! Bo cai nam trong thu muc  dist-installer\
echo ==================================================================
if exist dist-installer (dir /b dist-installer\*.exe)
echo.
echo  -^> Double-click file  "InteriorFlow Setup x.x.x.exe"  trong dist-installer de CAI.
echo.
pause
