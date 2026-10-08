@echo off
setlocal

echo ==================================================
echo   package-lock.json Fix Script
echo ==================================================
echo.

echo [1/7] Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js first, then run again.
  pause
  exit /b 1
)

echo [2/7] Checking git...
where git >nul 2>&1
if errorlevel 1 (
  echo ERROR: git not found. Install Git first, then run again.
  pause
  exit /b 1
)

echo [3/7] Checking that this folder is a git repo with package.json...
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo ERROR: This folder is not a git repository. Put this file in your project root.
  pause
  exit /b 1
)
if not exist package.json (
  echo ERROR: package.json not found here. Put this file in your project root.
  pause
  exit /b 1
)

echo [4/7] Checking that .gitignore is not blocking the lock file...
git check-ignore -q package-lock.json
if not errorlevel 1 (
  echo ERROR: package-lock.json is ignored by git.
  echo Remove the package-lock.json line from .gitignore, then run this again.
  pause
  exit /b 1
)

echo [5/7] Generating package-lock.json with npm install...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed. Fix the error shown above, then run again.
  pause
  exit /b 1
)
if not exist package-lock.json (
  echo ERROR: package-lock.json was not generated.
  pause
  exit /b 1
)

echo [6/7] Staging and committing...
git add package-lock.json
git diff --cached --quiet -- package-lock.json
if not errorlevel 1 (
  echo package-lock.json is already committed and unchanged. Nothing to commit.
  echo If the workflow still fails, the problem is somewhere else. Check the job log.
  pause
  exit /b 0
)
git commit -m "Add package-lock.json" -- package-lock.json
if errorlevel 1 (
  echo ERROR: git commit failed.
  pause
  exit /b 1
)

echo [7/7] Pushing to remote...
git push
if errorlevel 1 (
  echo ERROR: git push failed. Check your login or branch upstream, then run: git push
  pause
  exit /b 1
)

echo.
echo DONE. Now re-run the GitHub Actions workflow.
pause
endlocal
