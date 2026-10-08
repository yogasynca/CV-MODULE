import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://cqbquovaqukczctergjr.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYnF1b3ZhcXVrY3pjdGVyZ2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTA3MjMxMywiZXhwIjoyMTA2NjQ4MzEzfQ.PmmnQu2WIxqxNepVl0_J_93hiOOqNnp4Q6SxnyV6XmA";

const sqlContent = readFileSync("C:/Users/DELL/YogaSyncai/supabase/schema.sql", "utf-8");

async function run() {
  console.log("Attempting to execute schema.sql on Supabase via pg SQL endpoint...");

  // Try pg-meta or query endpoint
  const endpoints = [
    `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
    `${SUPABASE_URL}/pg/query`,
    `https://api.supabase.com/v1/projects/cqbquovaqukczctergjr/database/query`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: sqlContent, sql: sqlContent })
      });
      const text = await res.text();
      console.log(`Response status: ${res.status}, body: ${text.substring(0, 200)}`);
      if (res.ok) {
        console.log("SQL executed successfully!");
        return;
      }
    } catch (e) {
      console.error(`Error with ${endpoint}:`, e.message);
    }
  }
}

run();
