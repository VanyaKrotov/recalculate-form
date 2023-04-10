const esbuild = require("esbuild");

const { runServer } = require("./server");

esbuild
  .context({
    entryPoints: ["./dev/index.tsx"],
    outfile: "build/index.js",
    target: "es2015",
    bundle: true,
    sourcemap: true,
    minify: false,
    tsconfig: "./tsconfig.json",
  })
  .then((ctx) => ctx.watch())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() =>
    runServer({
      outDir: "build",
    })
  );
