// database.js
// Uses sql.js (pure WASM — no native compilation needed)
// Exposes a synchronous API matching better-sqlite3 so all route/agent code
// works unchanged after calling await initDb() once at startup.

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.resolve(process.env.DB_PATH || './immigai.db');

let _sqlJs = null; // sql.js SQL object (loaded once)
let _db    = null; // sql.js Database instance

// ─── persistence ────────────────────────────────────────────────────────────
function _save() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ─── better-sqlite3-compatible wrapper ──────────────────────────────────────
function _makeProxy(db) {
  return {
    pragma(str) {
      db.run(`PRAGMA ${str}`);
    },

    exec(sql) {
      db.run(sql);
      _save();
    },

    // matches: db.prepare('SQL').run(p1, p2, ...)  OR  .run([p1, p2])
    prepare(sql) {
      return {
        run(...args) {
          const params = args.flat();
          db.run(sql, params.length ? params : undefined);
          _save();
          return { changes: 1, lastInsertRowid: 0 };
        },

        get(...args) {
          const params = args.flat();
          const stmt = db.prepare(sql);
          if (params.length) stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        },

        all(...args) {
          const params = args.flat();
          const stmt = db.prepare(sql);
          if (params.length) stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        }
      };
    }
  };
}

// ─── public API ─────────────────────────────────────────────────────────────

/** Must be awaited once before the server starts. */
async function initDb() {
  if (_db) return;

  if (!_sqlJs) {
    // sql.js ships its own WASM file; locate it inside node_modules
    const wasmPath = path.join(
      __dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'
    );
    _sqlJs = await require('sql.js')({
      locateFile: () => wasmPath
    });
  }

  let fileBuffer = null;
  try { fileBuffer = fs.readFileSync(DB_PATH); } catch { /* first run */ }

  _db = fileBuffer ? new _sqlJs.Database(fileBuffer) : new _sqlJs.Database();
}

/** Returns the synchronous proxy — call after initDb() has resolved. */
function getDb() {
  if (!_db) throw new Error('DB not ready — await initDb() first');
  return _makeProxy(_db);
}

module.exports = { initDb, getDb };
