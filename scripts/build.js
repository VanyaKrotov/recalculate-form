const esbuild = require("esbuild");
const path = require("path");
const { emptyDir, copy } = require("fs-extra");
const { nodeExternalsPlugin } = require("esbuild-node-externals");
const { exec } = require("child_process");

const root = path.resolve(__dirname, "..");
const tsconfig = path.resolve(root, "tsconfig.json");
const entry = path.resolve(root, "src/index.ts");
const outdir = path.resolve(root, "dist");

const common = {
  bundle: true,
  sourcemap: true,
  format: "esm",
  tsconfig,
  outdir,
  plugins: [nodeExternalsPlugin({ allowList: ["projectx.state"] })],
};

async function main() {
  await emptyDir(outdir);
  await copy(path.resolve(root, "public"), outdir);

  try {
    await esbuild.build({
      entryPoints: {
        "production.min": entry,
      },
      minify: true,
      ...common,
    });

    await esbuild.build({
      entryPoints: {
        dev: entry,
      },
      minify: false,
      ...common,
    });

    await exec("tsc --emitDeclarationOnly");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
