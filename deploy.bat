@echo off
echo [NEXUS] Starting Cloud Build...
call gcloud builds submit --tag us-central1-docker.pkg.dev/lumen-vpromptwars/nexus-repo/nexus-app .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed. Aborting deployment.
    pause
    exit /b %ERRORLEVEL%
)

echo [NEXUS] Deploying to Cloud Run...
call gcloud run deploy nexus-app --image us-central1-docker.pkg.dev/lumen-vpromptwars/nexus-repo/nexus-app --platform managed --allow-unauthenticated --region us-central1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Deployment failed.
    pause
    exit /b %ERRORLEVEL%
)

echo [NEXUS] Deployment Complete!
pause
