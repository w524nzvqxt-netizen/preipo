@echo off
rem Каталог репозитория берём относительно самого .cmd (scripts\..), а не хардкодом —
rem чтобы запланированная задача работала независимо от того, где лежит проект.
cd /d "%~dp0.."
call node_modules\.bin\tsx.cmd prisma\gen-news.ts >> backups\gen-news.log 2>&1
