import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { HardDrive, Database, Server, RefreshCw, AlertCircle, Cloud } from 'lucide-react';

export function AdminStorage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === null || bytes === undefined) return 'Not available';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchStorageData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const response = await api.getStorageUsage();
      if (response.success) {
        setData(response);
      } else {
        setError('Failed to load storage usage data.');
      }
    } catch (err) {
      console.error('Error fetching storage stats:', err);
      setError('Unable to load storage usage.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchStorageData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
        <p>Loading storage statistics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-900 font-medium">{error}</p>
        <button 
          onClick={() => fetchStorageData()} 
          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { database, fileStorage, collections, generatedAt, atlasCapacity } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-[#FA7848]" />
            Storage Usage
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor MongoDB database and file storage consumption.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {generatedAt && (
            <span className="text-xs text-gray-400 font-medium">
              Last updated: {new Date(generatedAt).toLocaleString()}
            </span>
          )}
          <button 
            onClick={() => fetchStorageData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FA7848]' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MongoDB Storage Used */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">MongoDB Storage Used</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {database ? formatBytes(database.storageSizeBytes) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Physical collection storage</p>
        </div>

        {/* Card 2: MongoDB Data Size */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">MongoDB Data Size</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {database ? formatBytes(database.dataSizeBytes) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Logical/uncompressed data</p>
        </div>

        {/* Card 3: MongoDB Index Size */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">MongoDB Index Size</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {database ? formatBytes(database.indexSizeBytes) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Storage used by indexes</p>
        </div>

        {/* Card 4: MongoDB Atlas Remaining */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-[#FA7848] rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">MongoDB Atlas Remaining</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {atlasCapacity && atlasCapacity.remainingBytes !== null ? formatBytes(atlasCapacity.remainingBytes) : 'Not available'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {atlasCapacity && atlasCapacity.tier === 'FREE' ? 'Remaining Free cluster storage' : 'Remaining Atlas quota'}
          </p>
        </div>
      </div>

      {/* Database Summary & File Storage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Database Summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Database Collection Summary
            </h2>
          </div>
          
          <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-100">
             <div className="flex flex-wrap gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Database</p>
                  <p className="text-sm font-medium text-gray-900">{database?.name || 'unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Collections</p>
                  <p className="text-sm font-medium text-gray-900">{database?.collections || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Documents</p>
                  <p className="text-sm font-medium text-gray-900">{database?.documents?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Data Size</p>
                  <p className="text-sm font-medium text-gray-900">{database ? formatBytes(database.dataSizeBytes) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Storage Size</p>
                  <p className="text-sm font-medium text-gray-900">{database ? formatBytes(database.storageSizeBytes) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Index Size</p>
                  <p className="text-sm font-medium text-gray-900">{database ? formatBytes(database.indexSizeBytes) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Size</p>
                  <p className="text-sm font-medium text-gray-900">{database ? formatBytes(database.totalSizeBytes) : 'N/A'}</p>
                </div>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Collection</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Size</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Storage Size</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Index Size</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Size</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {collections && collections.length > 0 ? (
                  collections.map((coll, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{coll.name}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{coll.documents.toLocaleString()}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatBytes(coll.dataSize)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right font-medium">{formatBytes(coll.storageSize)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatBytes(coll.indexSize)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{formatBytes(coll.totalSize)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                      No collections found or unable to fetch collection stats.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Right Sidebar: Storage Info */}
        <div className="space-y-6">
          {/* File Storage Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                File / Object Storage
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 mb-4">
                Database storage represents the space used by MongoDB data. File storage represents uploaded files/images/documents. These may have separate quotas depending on the hosting provider.
              </p>
              
              {fileStorage?.available ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Provider</span>
                    <span className="text-sm font-medium text-gray-900">{fileStorage.provider || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Used Storage</span>
                    <span className="text-sm font-bold text-gray-900">{formatBytes(fileStorage.usedBytes)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Quota</span>
                    <span className="text-sm font-medium text-gray-900">
                      {fileStorage.quotaBytes !== null ? formatBytes(fileStorage.quotaBytes) : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Remaining</span>
                    <span className="text-sm font-medium text-gray-900">
                      {fileStorage.remainingBytes !== null ? formatBytes(fileStorage.remainingBytes) : 'Not available'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Provider</span>
                    <span className="text-sm font-medium text-gray-900">Not configured</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Used Storage</span>
                    <span className="text-sm font-medium text-gray-900">Not available</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Quota</span>
                    <span className="text-sm font-medium text-gray-900">Not available</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Remaining</span>
                    <span className="text-sm font-medium text-gray-900">Not available</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Database Capacity / Quota */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                MongoDB Atlas Capacity
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Provider</span>
                <span className="text-sm font-medium text-gray-900">
                  {atlasCapacity?.provider || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-medium text-gray-900">
                  {atlasCapacity?.tier || 'Unknown'}
                </span>
              </div>
              
              {atlasCapacity?.status === 'available' ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Storage Provided</span>
                    <span className="text-sm font-medium text-gray-900">
                      {atlasCapacity.quotaBytes !== null ? formatBytes(atlasCapacity.quotaBytes) : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Storage Used</span>
                    <span className="text-sm font-medium text-gray-900">
                      {atlasCapacity.usedBytes !== null ? formatBytes(atlasCapacity.usedBytes) : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Remaining</span>
                    <span className="text-sm font-medium text-gray-900">
                      {atlasCapacity.remainingBytes !== null ? formatBytes(atlasCapacity.remainingBytes) : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Usage</span>
                    <span className="text-sm font-medium text-gray-900">
                      {atlasCapacity.usagePercentage !== null ? `${atlasCapacity.usagePercentage.toFixed(2)}%` : 'Not available'}
                    </span>
                  </div>
                  
                  {atlasCapacity.quotaBytes && atlasCapacity.usagePercentage !== null && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-medium text-gray-700">Used: {formatBytes(atlasCapacity.usedBytes)} / {formatBytes(atlasCapacity.quotaBytes)}</span>
                        <span className="text-xs font-bold text-gray-900">{atlasCapacity.usagePercentage.toFixed(2)}% used</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${atlasCapacity.usagePercentage > 85 ? 'bg-red-500' : (atlasCapacity.usagePercentage > 70 ? 'bg-yellow-500' : 'bg-[#FA7848]')}`} 
                          style={{ width: `${Math.min(atlasCapacity.usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center border border-gray-200 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Atlas usage unavailable</p>
                  <p className="text-xs text-gray-500 font-mono bg-white inline-block px-2 py-1 rounded border border-gray-200">
                    STATUS: {atlasCapacity?.status || 'Unknown error'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Storage Explanation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Storage Breakdown
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase">Data Size</h4>
                <p className="text-xs text-gray-500 mt-1">Logical amount of stored MongoDB data.</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase">Storage Size</h4>
                <p className="text-xs text-gray-500 mt-1">Physical storage allocated for MongoDB collections.</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase">Index Size</h4>
                <p className="text-xs text-gray-500 mt-1">Storage used by MongoDB indexes.</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase">Total Size</h4>
                <p className="text-xs text-gray-500 mt-1">Overall MongoDB storage represented by the returned database statistics.</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase">Atlas Quota Usage</h4>
                <p className="text-xs text-gray-500 mt-1">Data + indexes counted toward the Atlas Free/Flex storage limit.</p>
              </div>
              
              {database && database.totalSizeBytes > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-medium text-gray-700">Index share of total MongoDB size</span>
                    <span className="text-xs font-bold text-gray-900">
                      {((database.indexSizeBytes / database.totalSizeBytes) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2 flex overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${(database.storageSizeBytes / database.totalSizeBytes) * 100}%` }}
                      title="Storage Size"
                    ></div>
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${(database.indexSizeBytes / database.totalSizeBytes) * 100}%` }}
                      title="Index Size"
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
