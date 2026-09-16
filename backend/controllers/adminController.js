const mongoose = require('mongoose');

exports.getStorageUsage = async (req, res) => {
  try {
    // Strict Admin authorization check (redundant but safe)
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized for admin endpoints' });
    }

    // Connect to actual database check
    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    
    if (dbName !== 'edupulse') {
      return res.status(500).json({ error: 'Server is connected to an incorrect database' });
    }

    // 1. Get database stats
    const dbStats = await db.command({ dbStats: 1 });
    
    // 2. Get collection stats
    const collectionsCursor = await db.listCollections().toArray();
    const collections = [];
    
    for (const coll of collectionsCursor) {
      if (coll.type === 'view') continue; // Skip views
      try {
        const collStats = await db.command({ collStats: coll.name });
        collections.push({
          name: coll.name,
          documents: collStats.count,
          storageSize: collStats.storageSize,
          dataSize: collStats.size,
          indexSize: collStats.totalIndexSize,
          totalSize: collStats.totalSize
        });
      } catch (err) {
        console.error(`Error fetching stats for collection ${coll.name}:`, err.message);
      }
    }
    
    // Sort collections by storage size descending
    collections.sort((a, b) => b.storageSize - a.storageSize);

    // 3. Assemble response payload
    const responseData = {
      success: true,
      generatedAt: new Date().toISOString(),
      database: {
        name: dbName,
        usedBytes: dbStats.storageSize,
        dataSizeBytes: dbStats.dataSize,
        storageSizeBytes: dbStats.storageSize,
        indexSizeBytes: dbStats.indexSize,
        totalSizeBytes: dbStats.totalSize || (dbStats.storageSize + dbStats.indexSize),
        collections: dbStats.collections,
        documents: dbStats.objects,
        quotaBytes: null,       // No hardcoded quota assumed
        remainingBytes: null,
        usagePercentage: null
      },
      fileStorage: {
        available: false,
        provider: null,
        usedBytes: null,
        quotaBytes: null,
        remainingBytes: null,
        usagePercentage: null
      },
      collections: collections
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    res.status(500).json({ error: 'Failed to retrieve storage statistics' });
  }
};
