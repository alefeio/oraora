const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4180);
const root = path.resolve(__dirname);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/" || u === "") u = "/explorations/ui-04/index.html";
  if (u.endsWith("/")) u += "index.html";
  const file = path.resolve(root, "." + u);
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    return res.end("forbidden");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("not found: " + u);
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
    });
    res.end(data);
  });
});

server.on("error", (err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`READY http://127.0.0.1:${port}/explorations/ui-04/\n`);
});
