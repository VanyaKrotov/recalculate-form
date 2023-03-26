const http = require("http");
const fs = require("fs");
const path = require("path");

const MINE = {
  ".html": "text/html",
  ".css": "text/css",
};

function runServer({ port = 4000, includes = [], prefix = "../", outDir }) {
  const server = http.createServer((req, res) => {
    const filename = req.url !== "/" ? req.url : "index.html";
    const dirPath = includes.some((inc) => filename.startsWith(inc))
      ? ""
      : outDir;

    const filepath = path.join(__dirname, prefix, dirPath, filename);
    if (fs.existsSync(filepath)) {
      let result;
      try {
        const file = fs.readFileSync(filepath);

        const type =
          MINE[path.parse(filepath).ext] || "application/octet-stream";

        res.writeHead(200, { "content-type": type });

        result = {
          content: file.toString(),
          code: 200,
        };
      } catch (err) {
        res.writeHead(500, err.name);

        result = {
          content: JSON.stringify(err),
          code: 500,
        };
      }

      console.log(`${req.method} ${req.url} => ${result.code} ${filepath}`);

      res.end(result.content);
    } else {
      console.log(`File [${filename}] not found from path ${filepath}`);

      res.writeHead(404, `File ${filename} not found`);
      res.end(`File [${filename}] not found from path ${filepath}`);
    }
  });

  server.listen(port, () => {
    console.log(`Served on http://localhost:${port}`);
  });
}

module.exports = {
  runServer,
};
