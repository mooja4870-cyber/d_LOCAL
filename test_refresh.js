const { refreshBrief } = require('./src/jobs/refresh');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/brief.db');
const db = new sqlite3.Database(dbPath);

async function run() {
  console.log('Testing refreshBrief...');
  try {
    const today = new Date().toISOString().split('T')[0];
    await refreshBrief({ date: today, itemCount: 15 }, db);
    console.log('Done!');
  } catch(e) {
    console.error('Error:', e);
  } finally {
    db.close();
  }
}

run();
