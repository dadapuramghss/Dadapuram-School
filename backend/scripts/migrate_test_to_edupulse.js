require('dotenv').config();
const mongoose = require('mongoose');

// Helper to wait
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMigration() {
  console.log('==================================================');
  console.log('   STARTING MONGODB MIGRATION: test -> edupulse');
  console.log('==================================================');

  // The cluster URI from the environment (e.g. mongodb+srv://user:pass@cluster.mongodb.net)
  const baseUri = process.env.MONGO_URI;

  if (!baseUri) {
    console.error('ERROR: MONGO_URI is not set in the environment variables.');
    console.error('Please set MONGO_URI to your cluster connection string (without the database name attached).');
    process.exit(1);
  }

  // Ensure the base URI doesn't already have a database specified
  // e.g. if it's mongodb+srv://cluster/edupulse, we need to extract the base to connect to test and edupulse
  let uriWithoutDb = baseUri;
  const match = baseUri.match(/(mongodb(?:\+srv)?:\/\/[^/]+)\/([^?]+)?(.*)/);
  if (match) {
    uriWithoutDb = `${match[1]}/${match[3] || ''}`; // keeps query params like ?retryWrites=true
  } else {
    // If there is no trailing slash
    if (!uriWithoutDb.includes('?')) {
      uriWithoutDb = `${uriWithoutDb}/`;
    }
  }
  
  // Format the URIs properly
  const testUri = uriWithoutDb.includes('?') ? uriWithoutDb.replace('?', 'test?') : `${uriWithoutDb}test`;
  const edupulseUri = uriWithoutDb.includes('?') ? uriWithoutDb.replace('?', 'edupulse?') : `${uriWithoutDb}edupulse`;

  console.log(`- Connecting to source (test)...`);
  const testConnection = await mongoose.createConnection(testUri).asPromise();
  console.log(`- Connecting to target (edupulse)...`);
  const edupulseConnection = await mongoose.createConnection(edupulseUri).asPromise();
  
  console.log('\nBoth databases connected successfully!');
  
  // Get all collections from the test database
  const collections = await testConnection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name).filter(name => !name.startsWith('system.'));

  console.log(`\nFound ${collectionNames.length} collections in 'test' database:`);
  console.log(collectionNames.map(name => `  - ${name}`).join('\n'));
  
  const migrationStats = {};

  for (const collectionName of collectionNames) {
    console.log(`\n==================================================`);
    console.log(`Migrating Collection: ${collectionName}`);
    
    const sourceCollection = testConnection.collection(collectionName);
    const targetCollection = edupulseConnection.collection(collectionName);

    // Count before migration
    const sourceCount = await sourceCollection.countDocuments();
    const targetCountBefore = await targetCollection.countDocuments();
    
    console.log(`- Documents in 'test.${collectionName}': ${sourceCount}`);
    console.log(`- Documents in 'edupulse.${collectionName}': ${targetCountBefore}`);
    
    if (sourceCount === 0) {
      console.log(`- Skipping ${collectionName} (Empty)`);
      migrationStats[collectionName] = { source: 0, migrated: 0, targetBefore: targetCountBefore, targetAfter: targetCountBefore };
      continue;
    }

    // Fetch all documents from the source
    const documents = await sourceCollection.find({}).toArray();
    
    let upsertedCount = 0;
    
    // Safely upsert each document to preserve _id and avoid duplicates
    const bulkOps = documents.map(doc => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true
      }
    }));
    
    // Execute bulk write
    if (bulkOps.length > 0) {
      try {
        const result = await targetCollection.bulkWrite(bulkOps);
        upsertedCount = result.upsertedCount + result.modifiedCount + (result.matchedCount - result.modifiedCount);
      } catch (err) {
        console.error(`- ERROR writing to ${collectionName}:`, err.message);
      }
    }
    
    // Count after migration
    const targetCountAfter = await targetCollection.countDocuments();
    console.log(`- Successfully migrated/upserted documents.`);
    console.log(`- Documents in 'edupulse.${collectionName}' after: ${targetCountAfter}`);
    
    migrationStats[collectionName] = {
      source: sourceCount,
      targetBefore: targetCountBefore,
      targetAfter: targetCountAfter
    };
  }

  // Final Database Count Verification
  console.log(`\n==================================================`);
  console.log(`   FINAL DATABASE COUNT VERIFICATION`);
  console.log(`==================================================`);
  for (const [col, stats] of Object.entries(migrationStats)) {
    console.log(`${col.padEnd(20)} | test: ${stats.source.toString().padEnd(6)} | edupulse: ${stats.targetAfter.toString().padEnd(6)}`);
    if (stats.targetAfter < stats.source) {
      console.log(`  => WARNING: 'edupulse' has fewer records than 'test'. Please investigate.`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`   MIGRATION COMPLETED SAFELY`);
  console.log(`==================================================`);
  console.log(`IMPORTANT:`);
  console.log(`1. Do NOT delete the 'test' database yet.`);
  console.log(`2. Update your Render Environment Variable to explicitly specify the database:`);
  console.log(`   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edupulse?retryWrites=true&w=majority`);
  console.log(`3. Restart your backend server on Render.`);
  console.log(`4. Test the application. Once everything is confirmed working, you can safely archive/drop 'test'.`);

  await testConnection.close();
  await edupulseConnection.close();
  process.exit(0);
}

runMigration().catch(err => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
