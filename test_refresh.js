const { refreshBrief } = require('./src/jobs/refresh');
const { openDb } = require('./src/db/sqlite');
const { initSchema } = require('./src/db/init');
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/brief.db');

async function run() {
  console.log('Testing refreshBrief...');
  let db;
  try {
    db = await openDb(dbPath);
    await initSchema(db);
    const today = new Date().toISOString().split('T')[0];
    const result = await refreshBrief({ date: today, itemCount: 15 }, db);
    console.log('Refresh result:', JSON.stringify(result, null, 2));
  } catch(e) {
    console.error('Error:', e);
  } finally {
    if (db) await db.close();
  }
}

run();

