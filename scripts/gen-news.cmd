@echo off
cd /d "C:\Users\user\Desktop\preipo-platform"
call node_modules\.bin\tsx.cmd prisma\gen-news.ts >> backups\gen-news.log 2>&1
