import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_DIR = "dist";
const ASSETS_DIR = join(DIST_DIR, "assets");
const MAIN_JS_MAX_BYTES = 500 * 1024;
const MAIN_JS_GZIP_MAX_BYTES = 120 * 1024;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KiB`;
};

if (!existsSync(ASSETS_DIR)) {
  console.error(`Bundle budget check failed: ${ASSETS_DIR} does not exist. Run npm run build first.`);
  process.exit(1);
}

const assets = readdirSync(ASSETS_DIR)
  .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
  .map((file) => {
    const path = join(ASSETS_DIR, file);
    const contents = readFileSync(path);
    return {
      file,
      bytes: contents.byteLength,
      gzipBytes: gzipSync(contents).byteLength,
      type: file.endsWith(".css") ? "css" : "js",
    };
  })
  .sort((a, b) => b.bytes - a.bytes);

const mainChunk = assets.find((asset) => asset.type === "js" && /^index-[\w-]+\.js$/.test(asset.file));

if (!mainChunk) {
  console.error("Bundle budget check failed: could not find the main index JavaScript chunk.");
  process.exit(1);
}

const report = {
  budgets: {
    mainJsMaxBytes: MAIN_JS_MAX_BYTES,
    mainJsGzipMaxBytes: MAIN_JS_GZIP_MAX_BYTES,
  },
  mainChunk,
  assets,
};

writeFileSync(join(DIST_DIR, "bundle-report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log("Bundle budget report");
console.log(`Main JS: ${mainChunk.file} ${formatBytes(mainChunk.bytes)} (${formatBytes(mainChunk.gzipBytes)} gzip)`);
console.log(`Budget:  ${formatBytes(MAIN_JS_MAX_BYTES)} (${formatBytes(MAIN_JS_GZIP_MAX_BYTES)} gzip)`);

const failures = [];
if (mainChunk.bytes > MAIN_JS_MAX_BYTES) {
  failures.push(`main JS is ${formatBytes(mainChunk.bytes)}, above ${formatBytes(MAIN_JS_MAX_BYTES)}`);
}
if (mainChunk.gzipBytes > MAIN_JS_GZIP_MAX_BYTES) {
  failures.push(`main JS gzip is ${formatBytes(mainChunk.gzipBytes)}, above ${formatBytes(MAIN_JS_GZIP_MAX_BYTES)}`);
}

if (failures.length > 0) {
  console.error(`Bundle budget check failed: ${failures.join("; ")}.`);
  process.exit(1);
}

console.log("Bundle budget check passed.");
