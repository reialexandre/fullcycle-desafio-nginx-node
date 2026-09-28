const http = require("node:http");
const mysql = require("mysql2/promise");

const {
  MYSQL_HOST = "db",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "root",
  MYSQL_DATABASE = "fullcycle",
  PORT = "3000",
} = process.env;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function hhmmss(date) {
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  return `${hh}${mm}${ss}`;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDb() {
  // Mantém simples: tenta até o MySQL estar pronto.
  // Evita depender de scripts externos e atende o "docker compose up" direto.
  for (;;) {
    try {
      const conn = await mysql.createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
      });
      await conn.ping();
      await conn.end();
      return;
    } catch {
      await sleep(500);
    }
  }
}

async function ensureSchema(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS people (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )
  `);
}

function renderHtml(names) {
  const items = names.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Full Cycle</title>
  </head>
  <body>
    <h1>Full Cycle Rocks!</h1>
    <ul>
      ${items}
    </ul>
  </body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function main() {
  await waitForDb();

  const server = http.createServer(async (_req, res) => {
    let conn;
    try {
      conn = await mysql.createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
      });

      await ensureSchema(conn);

      const name = `Alexandre-${hhmmss(new Date())}`;
      await conn.execute("INSERT INTO people(name) VALUES (?)", [name]);

      const [rows] = await conn.execute("SELECT name FROM people ORDER BY id ASC");
      const names = rows.map((r) => r.name);

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(renderHtml(names));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Erro interno");
    } finally {
      if (conn) {
        try {
          await conn.end();
        } catch {
          // ignora
        }
      }
    }
  });

  server.listen(Number(PORT), "0.0.0.0");
}

main().catch(() => {
  process.exitCode = 1;
});

