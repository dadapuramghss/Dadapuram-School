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
    const readyState = mongoose.connection.readyState;
    
    if (readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is not ready' });
    }

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
          totalSize: collStats.totalSize || (collStats.storageSize + collStats.totalIndexSize)
        });
      } catch (err) {
        console.error(`Error fetching stats for collection ${coll.name}:`, err.message);
      }
    }
    
    // Sort collections by storage size descending
    collections.sort((a, b) => b.storageSize - a.storageSize);

    // 3. Get Atlas stats
    let atlasData = null;
    let atlasErrorReason = null;
    
    try {
      atlasData = await db.command({ atlasSize: 1 });
    } catch (err) {
      // Determine error category
      const msg = err.message || '';
      const code = err.code || err.codeName || '';
      
      console.error(`Atlas Size Command Error: [${code}] ${msg}`);
      
      if (msg.includes('not supported') || msg.includes('no such command') || code === 'CommandNotFound' || code === 59) {
        atlasErrorReason = 'COMMAND_UNSUPPORTED';
      } else if (msg.includes('not authorized') || code === 13 || code === 'Unauthorized') {
        atlasErrorReason = 'AUTHORIZATION_ERROR';
      } else if (msg.includes('connection') || msg.includes('network') || code === 'ECONNREFUSED') {
        atlasErrorReason = 'CONNECTION_ERROR';
      } else {
        atlasErrorReason = 'TEMPORARY_DATABASE_ERROR';
      }
    }

    let isAtlasFree = process.env.MONGODB_ATLAS_TIER === 'FREE';
    let atlasQuota = isAtlasFree ? 512 * 1024 * 1024 : (parseInt(process.env.MONGODB_ATLAS_STORAGE_LIMIT_BYTES) || null);
    
    let atlasCapacity = null;
    if (atlasData && atlasData.atlasSize !== undefined) {
      const usedBytes = atlasData.atlasSize;
      const remainingBytes = atlasQuota ? Math.max(0, atlasQuota - usedBytes) : null;
      const usagePercentage = atlasQuota ? (usedBytes / atlasQuota) * 100 : null;

      atlasCapacity = {
        provider: "MongoDB Atlas",
        tier: process.env.MONGODB_ATLAS_TIER || "Unknown",
        quotaBytes: atlasQuota,
        usedBytes: usedBytes,
        dataSizeBytes: atlasData.totals?.dataSize || null,
        indexSizeBytes: atlasData.totals?.indexSize || null,
        remainingBytes: remainingBytes,
        usagePercentage: usagePercentage,
        status: "available"
      };
    } else {
      atlasCapacity = {
        provider: "MongoDB Atlas",
        tier: process.env.MONGODB_ATLAS_TIER || "Unknown",
        quotaBytes: atlasQuota,
        usedBytes: null,
        dataSizeBytes: null,
        indexSizeBytes: null,
        remainingBytes: null,
        usagePercentage: null,
        status: atlasErrorReason || "unavailable"
      };
    }

    // 4. Assemble response payload
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
      atlasCapacity: atlasCapacity,
      collections: collections
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    res.status(500).json({ error: 'Failed to retrieve storage statistics' });
  }
};
