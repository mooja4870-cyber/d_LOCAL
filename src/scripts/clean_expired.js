const fs = require('fs');
const path = require('path');
const { isStrictlyActiveContestOrBenefit } = require('../lib/contestFilter');
const { run, get, all } = require('../db/sqlite');
const sqlite3 = require('sqlite3');

async function cleanSnapshotAndDb() {
  // 1. Clean snapshot file
  const snapshotPath = path.join(__dirname, '../../data/brief_snapshot.json');
  if (fs.existsSync(snapshotPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      if (Array.isArray(data.items)) {
        const before = data.items.length;
        data.items = data.items.filter(isStrictlyActiveContestOrBenefit);
        const after = data.items.length;
        fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`[Snapshot] Cleaned items: ${before} -> ${after}`);
      }
    } catch (err) {
      console.error('Snapshot clean error:', err);
    }
  }

  // 2. Clean sqlite database if exists
  const dbPath = path.join(__dirname, '../../data/brief.db');
  if (fs.existsSync(dbPath)) {
    const db = new sqlite3.Database(dbPath);
    try {
      db.all("SELECT id, json FROM daily_briefs", [], (err, rows) => {
        if (err || !rows) return;
        let updated = 0;
        for (const row of rows) {
          try {
            const parsed = JSON.parse(row.json);
            if (Array.isArray(parsed.items)) {
              const b = parsed.items.length;
              parsed.items = parsed.items.filter(isStrictlyActiveContestOrBenefit);
              if (parsed.items.length !== b) {
                db.run("UPDATE daily_briefs SET json = ? WHERE id = ?", [JSON.stringify(parsed), row.id]);
                updated++;
              }
            }
          } catch {
            // ignore
          }
        }
        console.log(`[Database] Updated ${updated} daily_brief rows`);
      });

      // Also clean articles table
      db.all("SELECT id, title, source FROM articles", [], (err, rows) => {
        if (err || !rows) return;
        let removed = 0;
        for (const row of rows) {
          if (!isStrictlyActiveContestOrBenefit({ title: row.title, summary: '' })) {
            db.run("DELETE FROM articles WHERE id = ?", [row.id]);
            removed++;
          }
        }
        console.log(`[Database] Removed ${removed} invalid/expired articles from articles table`);
      });
    } catch (err) {
      console.error('Database clean error:', err);
    }
  }
}

cleanSnapshotAndDb();
