use std::{
    env,
    ffi::OsString,
    path::{Path, PathBuf},
    process::Output,
    sync::{Mutex, OnceLock},
    time::Duration,
};
use tokio::fs;
use tokio::process::Command;
use tokio::time::timeout;

#[derive(Clone, PartialEq, Eq, serde::Deserialize, Default)]
pub struct LatexEnginePaths {
    pub lualatex: Option<String>,
    pub pdflatex: Option<String>,
    pub xelatex: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
pub struct CompileResult {
    pub success: bool,
    pub svg: Option<String>,
    pub error_log: Option<String>,
}

const LATEX_PROCESS_TIMEOUT: Duration = Duration::from_secs(45);
const TIKZPICTURE_END: &str = "\\end{tikzpicture}";
const STOICHEIA_ANCHORS: &str = r#"
% Stoicheia Anchors
\node[inner sep=0pt, outer sep=0pt] at (0,0) {\special{dvisvgm:raw <g id="ITZ_ORIGIN" data-dvi-x="{?x}" data-dvi-y="{?y}" data-matrix="{?matrix}" />}};
\node[inner sep=0pt, outer sep=0pt] at (1,0) {\special{dvisvgm:raw <g id="ITZ_UNIT_X" data-dvi-x="{?x}" data-dvi-y="{?y}" data-matrix="{?matrix}" />}};
\node[inner sep=0pt, outer sep=0pt] at (0,1) {\special{dvisvgm:raw <g id="ITZ_UNIT_Y" data-dvi-x="{?x}" data-dvi-y="{?y}" data-matrix="{?matrix}" />}};
\end{tikzpicture}"#;

#[derive(Clone, PartialEq, Eq)]
struct CompileCacheKey {
    source: String,
    compiler: &'static str,
    configured_compiler_path: Option<String>,
    tex_runtime_path: Option<String>,
}

impl CompileCacheKey {
    fn new(
        source: String,
        compiler: &'static str,
        configured_compiler_path: Option<String>,
    ) -> Self {
        Self {
            source,
            compiler,
            configured_compiler_path,
            tex_runtime_path: tex_runtime_path().map(|path| path.to_string_lossy().into_owned()),
        }
    }
}

fn compile_cache() -> &'static Mutex<Option<(CompileCacheKey, CompileResult)>> {
    static CACHE: OnceLock<Mutex<Option<(CompileCacheKey, CompileResult)>>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(None))
}

fn cached_compile_result(key: &CompileCacheKey) -> Option<CompileResult> {
    compile_cache()
        .lock()
        .ok()
        .and_then(|cache| match cache.as_ref() {
            Some((cached_key, result)) if cached_key == key => Some(result.clone()),
            _ => None,
        })
}

fn remember_compile_result(key: &CompileCacheKey, result: CompileResult) -> CompileResult {
    if let Ok(mut cache) = compile_cache().lock() {
        *cache = Some((key.clone(), result.clone()));
    }
    result
}

#[cfg(test)]
fn clear_compile_cache() {
    if let Ok(mut cache) = compile_cache().lock() {
        *cache = None;
    }
}

struct TempWorkspace {
    path: PathBuf,
}

impl TempWorkspace {
    async fn create() -> Result<Self, String> {
        let path = env::temp_dir().join(format!("stoicheia_{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&path).await.map_err(|e| e.to_string())?;
        Ok(Self { path })
    }

    fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for TempWorkspace {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.path);
    }
}

fn tex_runtime_path() -> Option<OsString> {
    let mut paths: Vec<PathBuf> = env::var_os("PATH")
        .map(|path| env::split_paths(&path).collect())
        .unwrap_or_default();

    // Desktop-launched AppImages often do not inherit the interactive shell PATH.
    // Add common TeX Live locations so a full TeX installation is still found.
    for path in [
        "/usr/local/texlive/2026/bin/x86_64-linux",
        "/usr/local/texlive/2025/bin/x86_64-linux",
        "/usr/local/texlive/2024/bin/x86_64-linux",
        "/usr/local/texlive/2023/bin/x86_64-linux",
        "/opt/texlive/2026/bin/x86_64-linux",
        "/opt/texlive/2025/bin/x86_64-linux",
        "/opt/texlive/2024/bin/x86_64-linux",
        "/Library/TeX/texbin",
    ] {
        let candidate = PathBuf::from(path);
        if candidate.is_dir() && !paths.iter().any(|existing| existing == &candidate) {
            paths.push(candidate);
        }
    }

    env::join_paths(paths).ok()
}

fn command_with_tex_path(program: &str) -> Command {
    let mut command = Command::new(program);
    if let Some(path) = tex_runtime_path() {
        command.env("PATH", path);
    }
    sanitize_external_process_env(&mut command);
    command
}

fn appimage_runtime_detected() -> bool {
    env::var_os("APPIMAGE").is_some() || env::var_os("APPDIR").is_some()
}

fn sanitize_external_process_env(command: &mut Command) {
    if !appimage_runtime_detected() {
        return;
    }

    match env::var_os("APPIMAGE_ORIGINAL_LD_LIBRARY_PATH") {
        Some(path) if !path.is_empty() => {
            command.env("LD_LIBRARY_PATH", path);
        }
        _ => {
            command.env_remove("LD_LIBRARY_PATH");
        }
    }

    command.env_remove("LD_PRELOAD");
}

async fn run_command_output(
    mut command: Command,
    timeout_duration: Duration,
    timeout_error: String,
    spawn_error: impl FnOnce(std::io::Error) -> String,
) -> Result<Output, String> {
    command.kill_on_drop(true);
    match timeout(timeout_duration, command.output()).await {
        Ok(result) => result.map_err(spawn_error),
        Err(_) => Err(timeout_error),
    }
}

fn latex_error_hint(log: &str) -> Option<&'static str> {
    if log.contains("standalone.cls") {
        Some("\n\nStoicheia note: The selected LaTeX compiler was found, but your TeX installation is missing standalone.cls. Install the standalone package/class, or use Stoicheia's default article-based template.")
    } else if log.contains("tkz-euclide.sty") {
        Some("\n\nStoicheia note: The selected LaTeX compiler was found, but tkz-euclide is missing. Install the tkz-euclide package in your TeX distribution.")
    } else if log.contains("tikz.sty") || log.contains("pgf.sty") {
        Some("\n\nStoicheia note: The selected LaTeX compiler was found, but TikZ/PGF is missing. Install the PGF/TikZ packages in your TeX distribution.")
    } else {
        None
    }
}

fn with_latex_hint(log: String) -> String {
    match latex_error_hint(&log) {
        Some(hint) => format!("{log}{hint}"),
        None => log,
    }
}

fn normalize_latex_compiler(compiler: Option<String>) -> Result<&'static str, String> {
    match compiler.as_deref().unwrap_or("lualatex") {
        "lualatex" => Ok("lualatex"),
        "pdflatex" => Ok("pdflatex"),
        "xelatex" => Ok("xelatex"),
        other => Err(format!(
            "Unsupported LaTeX compiler: {other}. Use lualatex, pdflatex, or xelatex."
        )),
    }
}

fn latex_command_args(compiler: &str) -> (&'static str, [&'static str; 2]) {
    match compiler {
        "xelatex" => ("document.xdv", ["--interaction=nonstopmode", "-no-pdf"]),
        _ => (
            "document.dvi",
            ["--interaction=nonstopmode", "--output-format=dvi"],
        ),
    }
}

fn configured_engine_path<'a>(
    compiler: &str,
    engine_paths: Option<&'a LatexEnginePaths>,
) -> Option<&'a str> {
    let path = match compiler {
        "lualatex" => engine_paths?.lualatex.as_deref(),
        "pdflatex" => engine_paths?.pdflatex.as_deref(),
        "xelatex" => engine_paths?.xelatex.as_deref(),
        _ => None,
    }?;
    let trimmed = path.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

fn inject_stoicheia_anchors(source: &str) -> String {
    source.replacen(TIKZPICTURE_END, STOICHEIA_ANCHORS, 1)
}

#[tauri::command]
pub async fn compile_latex(
    source: String,
    compiler: Option<String>,
    engine_paths: Option<LatexEnginePaths>,
) -> Result<CompileResult, String> {
    let compiler = normalize_latex_compiler(compiler)?;
    let configured_compiler_path =
        configured_engine_path(compiler, engine_paths.as_ref()).map(str::to_owned);
    let cache_key =
        CompileCacheKey::new(source.clone(), compiler, configured_compiler_path.clone());
    if let Some(result) = cached_compile_result(&cache_key) {
        return Ok(result);
    }

    let temp_workspace = TempWorkspace::create().await?;
    let temp_dir = temp_workspace.path();

    let injected_source = inject_stoicheia_anchors(&source);

    let tex_path = temp_dir.join("document.tex");
    fs::write(&tex_path, &injected_source)
        .await
        .map_err(|e| e.to_string())?;

    // Run the selected LaTeX compiler.
    let (dvisvgm_input, compiler_args) = latex_command_args(compiler);
    let mut compiler_command = match configured_compiler_path.as_deref() {
        Some(path) => Command::new(path),
        None => command_with_tex_path(compiler),
    };
    sanitize_external_process_env(&mut compiler_command);
    compiler_command
        .current_dir(&temp_dir)
        .args(compiler_args)
        .arg("document.tex");
    let compiler_output = run_command_output(
        compiler_command,
        LATEX_PROCESS_TIMEOUT,
        format!("{compiler} timed out after {} seconds.", LATEX_PROCESS_TIMEOUT.as_secs()),
        |e| match configured_compiler_path.as_deref() {
            Some(path) => format!("Failed to execute {compiler} at {path}: {e}. Check the configured executable path in Stoicheia Settings."),
            None => format!("Failed to execute {compiler}: {e}. Stoicheia needs {compiler} in PATH. If it works from `npm run tauri dev` but not from AppImage, launch the AppImage from a terminal, set an explicit engine path in Settings, or install TeX Live/MiKTeX in a standard system path."),
        },
    )
    .await?;

    if !compiler_output.status.success() {
        let stdout = String::from_utf8_lossy(&compiler_output.stdout);
        let stderr = String::from_utf8_lossy(&compiler_output.stderr);
        let log = with_latex_hint(format!("{stdout}{stderr}"));
        let result = CompileResult {
            success: false,
            svg: None,
            error_log: Some(log),
        };
        return Ok(remember_compile_result(&cache_key, result));
    }

    // Run dvisvgm.
    let mut dvisvgm_command = command_with_tex_path("dvisvgm");
    dvisvgm_command
        .current_dir(&temp_dir)
        .arg("--no-fonts")
        .arg("--exact-bbox")
        .arg(dvisvgm_input);
    let dvisvgm_output = run_command_output(
        dvisvgm_command,
        LATEX_PROCESS_TIMEOUT,
        format!(
            "dvisvgm timed out after {} seconds.",
            LATEX_PROCESS_TIMEOUT.as_secs()
        ),
        |e| format!("Failed to execute dvisvgm: {e}. Stoicheia needs dvisvgm in PATH for LaTeX SVG preview."),
    )
    .await?;

    if !dvisvgm_output.status.success() {
        let log = String::from_utf8_lossy(&dvisvgm_output.stderr).to_string();
        let result = CompileResult {
            success: false,
            svg: None,
            error_log: Some(log),
        };
        return Ok(remember_compile_result(&cache_key, result));
    }

    // Read SVG
    let svg_path = temp_dir.join("document.svg");
    let svg_content = fs::read_to_string(&svg_path)
        .await
        .map_err(|e| e.to_string())?;

    let result = CompileResult {
        success: true,
        svg: Some(svg_content),
        error_log: None,
    };
    Ok(remember_compile_result(&cache_key, result))
}

#[cfg(test)]
mod tests {
    use super::{
        clear_compile_cache, command_with_tex_path, compile_latex, inject_stoicheia_anchors,
        run_command_output, LatexEnginePaths,
    };
    use std::{
        collections::BTreeSet,
        env,
        ffi::OsString,
        fs,
        sync::{Mutex, OnceLock},
        time::Duration,
    };
    use tokio::process::Command;

    #[cfg(unix)]
    use std::os::unix::fs::PermissionsExt;

    fn compiler_test_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    fn stoicheia_temp_dirs() -> BTreeSet<String> {
        fs::read_dir(env::temp_dir())
            .ok()
            .into_iter()
            .flatten()
            .filter_map(Result::ok)
            .filter_map(|entry| entry.file_name().into_string().ok())
            .filter(|name| name.starts_with("stoicheia_"))
            .collect()
    }

    fn restore_env_var(name: &str, value: Option<OsString>) {
        match value {
            Some(value) => env::set_var(name, value),
            None => env::remove_var(name),
        }
    }

    #[test]
    fn injects_svg_anchors_only_into_first_tikzpicture() {
        let source =
            "\\begin{tikzpicture}\n\\end{tikzpicture}\n\\begin{tikzpicture}\n\\end{tikzpicture}";
        let injected = inject_stoicheia_anchors(source);

        assert_eq!(injected.matches("ITZ_ORIGIN").count(), 1);
        assert_eq!(injected.matches("Stoicheia Anchors").count(), 1);
        assert_eq!(injected.matches("\\end{tikzpicture}").count(), 2);
    }

    #[test]
    fn appimage_child_commands_restore_original_library_path() {
        let _guard = compiler_test_lock().lock().unwrap();
        let original_appimage = env::var_os("APPIMAGE");
        let original_appdir = env::var_os("APPDIR");
        let original_ld_library_path = env::var_os("LD_LIBRARY_PATH");
        let original_appimage_ld_library_path = env::var_os("APPIMAGE_ORIGINAL_LD_LIBRARY_PATH");

        env::set_var("APPIMAGE", "/tmp/Stoicheia.AppImage");
        env::set_var("APPDIR", "/tmp/.mount_stoicheia");
        env::set_var("LD_LIBRARY_PATH", "/tmp/.mount_stoicheia/usr/lib");
        env::set_var("APPIMAGE_ORIGINAL_LD_LIBRARY_PATH", "/usr/lib");

        let command = command_with_tex_path("dvisvgm");
        let ld_library_path = command
            .as_std()
            .get_envs()
            .find(|(key, _)| *key == "LD_LIBRARY_PATH")
            .and_then(|(_, value)| value.map(|value| value.to_os_string()));

        restore_env_var("APPIMAGE", original_appimage);
        restore_env_var("APPDIR", original_appdir);
        restore_env_var("LD_LIBRARY_PATH", original_ld_library_path);
        restore_env_var(
            "APPIMAGE_ORIGINAL_LD_LIBRARY_PATH",
            original_appimage_ld_library_path,
        );

        assert_eq!(ld_library_path, Some(OsString::from("/usr/lib")));
    }

    #[test]
    fn appimage_child_commands_remove_bundled_library_path_without_original() {
        let _guard = compiler_test_lock().lock().unwrap();
        let original_appimage = env::var_os("APPIMAGE");
        let original_appdir = env::var_os("APPDIR");
        let original_ld_library_path = env::var_os("LD_LIBRARY_PATH");
        let original_appimage_ld_library_path = env::var_os("APPIMAGE_ORIGINAL_LD_LIBRARY_PATH");

        env::set_var("APPIMAGE", "/tmp/Stoicheia.AppImage");
        env::set_var("APPDIR", "/tmp/.mount_stoicheia");
        env::set_var("LD_LIBRARY_PATH", "/tmp/.mount_stoicheia/usr/lib");
        env::remove_var("APPIMAGE_ORIGINAL_LD_LIBRARY_PATH");

        let command = command_with_tex_path("dvisvgm");
        let ld_library_path = command
            .as_std()
            .get_envs()
            .find(|(key, _)| *key == "LD_LIBRARY_PATH")
            .and_then(|(_, value)| value.map(|value| value.to_os_string()));

        restore_env_var("APPIMAGE", original_appimage);
        restore_env_var("APPDIR", original_appdir);
        restore_env_var("LD_LIBRARY_PATH", original_ld_library_path);
        restore_env_var(
            "APPIMAGE_ORIGINAL_LD_LIBRARY_PATH",
            original_appimage_ld_library_path,
        );

        assert_eq!(ld_library_path, None);
    }

    #[tokio::test(flavor = "current_thread")]
    async fn compile_cleans_temp_workspace_when_compiler_cannot_start() {
        let _guard = compiler_test_lock().lock().unwrap();
        clear_compile_cache();

        let before = stoicheia_temp_dirs();
        let result = compile_latex(
            "\\begin{tikzpicture}\\end{tikzpicture}".to_string(),
            Some("lualatex".to_string()),
            Some(LatexEnginePaths {
                lualatex: Some("/definitely/missing/stoicheia-lualatex".to_string()),
                ..Default::default()
            }),
        )
        .await;
        let after = stoicheia_temp_dirs();

        assert!(result.is_err());
        assert_eq!(after, before);
    }

    #[tokio::test]
    async fn command_output_times_out_and_returns_error() {
        let mut command = Command::new("sh");
        command.arg("-c").arg("sleep 5");

        let result = run_command_output(
            command,
            Duration::from_millis(20),
            "process timed out".to_string(),
            |error| error.to_string(),
        )
        .await;

        assert_eq!(result.unwrap_err(), "process timed out");
    }

    #[cfg(unix)]
    #[tokio::test(flavor = "current_thread")]
    async fn compile_reuses_cached_result_for_identical_request() {
        let _guard = compiler_test_lock().lock().unwrap();
        clear_compile_cache();

        let test_dir =
            env::temp_dir().join(format!("stoicheia-cache-test-{}", uuid::Uuid::new_v4()));
        let bin_dir = test_dir.join("bin");
        fs::create_dir_all(&bin_dir).unwrap();

        let count_path = test_dir.join("compiler-count");
        let compiler_path = bin_dir.join("fake-lualatex");
        let dvisvgm_path = bin_dir.join("dvisvgm");

        fs::write(
            &compiler_path,
            format!(
                "#!/bin/sh\ncount=$(cat '{}' 2>/dev/null || echo 0)\ncount=$((count + 1))\nprintf '%s' \"$count\" > '{}'\ntouch document.dvi\n",
                count_path.display(),
                count_path.display()
            ),
        )
        .unwrap();
        fs::write(
            &dvisvgm_path,
            "#!/bin/sh\nprintf '<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>' > document.svg\n",
        )
        .unwrap();

        fs::set_permissions(&compiler_path, fs::Permissions::from_mode(0o755)).unwrap();
        fs::set_permissions(&dvisvgm_path, fs::Permissions::from_mode(0o755)).unwrap();

        let original_path = env::var_os("PATH");
        let mut paths = vec![bin_dir.clone()];
        if let Some(path) = original_path.as_ref() {
            paths.extend(env::split_paths(path));
        }
        env::set_var("PATH", env::join_paths(paths).unwrap());

        let source = "\\begin{tikzpicture}\\end{tikzpicture}".to_string();
        let engine_paths = || LatexEnginePaths {
            lualatex: Some(compiler_path.to_string_lossy().into_owned()),
            ..Default::default()
        };

        let first = compile_latex(
            source.clone(),
            Some("lualatex".to_string()),
            Some(engine_paths()),
        )
        .await
        .unwrap();
        let second = compile_latex(source, Some("lualatex".to_string()), Some(engine_paths()))
            .await
            .unwrap();

        if let Some(path) = original_path {
            env::set_var("PATH", path);
        } else {
            env::remove_var("PATH");
        }
        clear_compile_cache();
        let count = fs::read_to_string(&count_path).unwrap();
        let _ = fs::remove_dir_all(&test_dir);

        assert!(first.success);
        assert_eq!(first, second);
        assert_eq!(count, "1");
    }
}
