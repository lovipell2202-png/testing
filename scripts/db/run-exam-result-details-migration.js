const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',
  server: 'localhost',
  port: 1433,
  database: 'NSB_Training',
  options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

async function run() {
  const pool = await sql.connect(dbConfig);
  console.log('✅ Connected');
  const sqlFile = fs.readFileSync(path.join(__dirname, '../../sql/ADD_EXAM_RESULT_DETAILS.sql'), 'utf8');
  // Run each statement separated by blank lines
  const statements = sqlFile.split(/\n(?=IF|ALTER|PRINT)/g).filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try { await pool.request().query(stmt); } catch(e) { console.log('Note:', e.message); }
    }
  }
  console.log('✅ Migration complete');
  await pool.close();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
