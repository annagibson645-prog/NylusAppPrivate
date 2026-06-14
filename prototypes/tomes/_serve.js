// Tiny static server for viewing the Tomes prototypes locally.
// Usage: node prototypes/tomes/_serve.js   (serves this folder on :4488)
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const PORT = 4488;
const TYPES = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript" };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const fp = path.join(root, p);
  if (!fp.startsWith(root)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(fp)] || "text/plain" });
    res.end(d);
  });
}).listen(PORT, () => console.log(`tomes prototypes on http://localhost:${PORT}`));
