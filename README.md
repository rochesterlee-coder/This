# GameCade

GameCade is an Electron-based educational mini-game arcade.

## Included games
- Snake Battle with AI opponents and Easy, Hard, and Devil difficulty
- 2048
- Brick Breaker
- Grammar Rush
- Settings for FPS, a connection/ping estimate, an estimated 0–10 internet responsiveness score, audio controls, and display preferences

## Build the Windows installer using GitHub Actions
1. Upload all files and folders in this repository to a GitHub repository named `GameCade` (or your preferred repository name).
2. Make sure the default branch is `main`.
3. Open the **Actions** tab. The workflow in `.github/workflows/build.yml` runs on every push to `main`.
4. Wait for the run to finish successfully.
5. Open the completed run and download the `GameCade-Windows` artifact. Extract the downloaded ZIP to find the Windows `.exe` installer.

You do not need to run `npm start` locally to build the installer.

## Run locally (optional)
Install Node.js, then run `npm install` and `npm start`.

## Notes
- Snake opponents are computer-controlled, not online multiplayer.
- FPS is measured locally. The connection check and 0–10 score are estimates, not a full bandwidth speed test.
- This project has not been runtime-tested as part of this ZIP creation.
