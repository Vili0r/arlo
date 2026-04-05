const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://cc4af83119f56e20df895b9d445f92d4e109aa81f7a90c2ba68d7a0d31de98ce:sk_JxI7CT2NPnATRw94M93g4@db.prisma.io:5432/postgres?sslmode=require'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM entry_points WHERE key='onboarding_home' AND project_id='cmmxoj3sn0000w09knsx940vn'");
  console.log('Results:', res.rows);
  const flows = await client.query("SELECT * FROM flows");
  console.log('Flows:', flows.rows);
  await client.end();
}
run().catch(console.error);
