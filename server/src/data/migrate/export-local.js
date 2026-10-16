import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Reconstruct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = "mongodb://127.0.0.1:27017/wls-portal-db";
const outputDir = path.join(__dirname, "mongo_backup");

async function exportCollections() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collections = ["categories", "lectures", "ayats"];

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const colName of collections) {
      const data = await db.collection(colName).find({}).toArray();
      const filePath = path.join(outputDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(
        `Successfully exported ${data.length} documents to ${colName}.json`,
      );
    }
  } catch (err) {
    console.error("Export failed:", err);
  } finally {
    await client.close();
  }
}

exportCollections();
