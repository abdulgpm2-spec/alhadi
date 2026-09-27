const { Client } = require("pg");

const passwords = ["", "postgres", "root", "admin", "123456", "Admin@123456", "password"];
const ports = [5432, 5433];

async function findWorkingConnection() {
  console.log("Testing PostgreSQL 18 connection...");
  for (const port of ports) {
    for (const password of passwords) {
      const client = new Client({
        user: "postgres",
        host: "localhost",
        database: "postgres",
        password: password,
        port: port,
        connectionTimeoutMillis: 2000,
      });

      try {
        await client.connect();
        const res = await client.query("SELECT version();");
        console.log(`\n✅ SUCCESS! Connected to PostgreSQL on port ${port} with password: "${password}"`);
        console.log(`Version: ${res.rows[0].version}`);
        
        // Create database alhadi_erp if not exists
        try {
          await client.query("CREATE DATABASE alhadi_erp;");
          console.log("✅ Database 'alhadi_erp' created successfully!");
        } catch (dbErr) {
          if (dbErr.code === "42P04") {
            console.log("ℹ️ Database 'alhadi_erp' already exists.");
          } else {
            console.log("Note during DB creation:", dbErr.message);
          }
        }

        await client.end();
        return { port, password };
      } catch (err) {
        // failed attempt
        try { await client.end(); } catch (e) {}
      }
    }
  }
  console.log("❌ Could not connect with standard default passwords. Need password.");
  return null;
}

findWorkingConnection();
