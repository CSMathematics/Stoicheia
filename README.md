# Stoicheia

Interactive Euclidean geometry workspace built with Tauri, React and TypeScript.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Development

```bash
npm install
npm run tauri dev
```

Useful checks before a release:

```bash
npm test -- --run
npm run build
```

## LaTeX compilation requirements

Stoicheia includes its default TikZ document template in the application bundle. It does not need project-root files after installation.

For the fast built-in preview, no external LaTeX distribution is required.

For full LaTeX compilation, the target system must have a TeX distribution installed. Stoicheia can compile with `lualatex`, `pdflatex` or `xelatex`; the selected engine and optional executable paths are configured from **Settings → Preview canvas → LaTeX compiler / Engine executable paths**. Leave an engine path empty to auto-detect it from `PATH` and common TeX Live locations.

Required tools/packages:

- one of `lualatex`, `pdflatex` or `xelatex`
- `dvisvgm`
- TikZ/PGF
- `tkz-euclide`

The default template uses the standard `article` class to avoid requiring `standalone.cls`. Existing documents that use `\\documentclass{standalone}` still need the standalone package installed.

Recommended installations:

- Windows: MiKTeX or TeX Live
- Linux: TeX Live; on Arch Linux, install the TeX Live collections that provide `lualatex`, `dvisvgm`, TikZ/PGF and `tkz-euclide`
- macOS: MacTeX or BasicTeX with the required packages

If LaTeX compilation works in `npm run tauri dev` but fails in the installed AppImage, the AppImage was probably launched from a desktop environment that did not inherit your terminal `PATH`. Stoicheia checks common TeX Live locations automatically, but you can also set explicit engine executable paths in Settings, launch the AppImage from a terminal, or install TeX Live in a standard system path.

Application settings are stored locally by the app and can be reset from the Settings page.

## Release build

Stoicheia uses Tauri 2. The release version is controlled in:

- `package.json`
- `package-lock.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/tauri.conf.json`

The application icon source is `public/stoicheia-logo.svg`. Native app icons are generated into `src-tauri/icons/` with:

```bash
npm run tauri icon public/stoicheia-logo.svg
```

### Windows installer / `.exe`

Run on Windows:

```powershell
npm ci
npm test -- --run
npm run tauri build -- --bundles nsis
```

The `.exe` installer is created under:

```text
src-tauri/target/release/bundle/nsis/
```

For a full Windows bundle set, run:

```powershell
npm run tauri build
```

### Linux bundles

Install the Linux build dependencies first. On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf libwebkit2gtk-4.1-dev
```

Then build:

```bash
npm ci
npm test -- --run
npm run tauri:build:linux
```

`tauri:build:linux` sets `NO_STRIP=1` before Tauri calls `linuxdeploy`. This avoids AppImage failures on modern rolling Linux distributions where the `strip` bundled inside `linuxdeploy` cannot read newer ELF `.relr.dyn` sections. If you only need the AppImage locally, use:

```bash
npm run tauri:build:appimage
```

If you call Tauri directly on Linux and request AppImage output, set the same environment variable manually:

```bash
NO_STRIP=1 npm run tauri build -- --bundles appimage
```

Bundles are created under:

```text
src-tauri/target/release/bundle/
```

Depending on the target, expect outputs such as `.AppImage`, `.deb` and `.rpm`.

### macOS bundles

Run on macOS:

```bash
npm ci
npm test -- --run
npm run tauri build
```

For separate Apple Silicon and Intel builds:

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
npm run tauri build -- --target aarch64-apple-darwin
npm run tauri build -- --target x86_64-apple-darwin
```

Bundles are created under:

```text
src-tauri/target/release/bundle/
```

For public distribution on macOS, use an Apple Developer certificate and notarization. For unsigned test builds, the GitHub workflow uses ad-hoc signing.

## GitHub release

The workflow `.github/workflows/release.yml` builds a draft GitHub Release for Windows, Linux and macOS. It runs one matrix job per platform/architecture and uploads the Tauri bundles as release assets.

Expected assets include:

- Linux: `.AppImage`, `.deb`, `.rpm`
- Windows: `.exe` / NSIS installer and `.msi` when produced by the configured Tauri target set
- macOS Apple Silicon: `.dmg` and `.app.tar.gz`
- macOS Intel: `.dmg` and `.app.tar.gz`
- GitHub's automatic source archives: `.zip` and `.tar.gz`

The Linux release job sets `NO_STRIP=1` so AppImage bundling works on modern Linux libraries that contain `.relr.dyn` sections.

To create/update a draft release from the release branch:

```bash
git checkout -b release
git push origin release
```

You can also create a version tag and push it:

```bash
git tag stoicheia-v1.2.1
git push origin stoicheia-v1.2.1
```

Or run the workflow manually from GitHub:

```text
Repository → Actions → Release Stoicheia → Run workflow
```

The workflow creates a draft GitHub Release named `Stoicheia v__VERSION__`, where `__VERSION__` is read from the Tauri app version.

Before making the draft public:

1. Wait for all matrix jobs to finish.
2. Confirm the assets are present for Linux, Windows and both macOS architectures.
3. Download and test the installer for each platform you can access.
4. Edit release notes if needed.
5. Publish the draft from the GitHub Releases page.
