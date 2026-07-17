import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';

export function FilePreviewModal({ isOpen, onClose, fileUrl, fileType, fileName }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (isOpen && fileUrl) {
      if (fileUrl.startsWith('data:')) {
        try {
          const arr = fileUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          return () => URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error creating blob from base64:", error);
          setBlobUrl(fileUrl);
        }
      } else {
        setBlobUrl(fileUrl);
      }
    }
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  const isImage = fileType === 'image' || (fileUrl && fileUrl.startsWith('data:image'));
  const isPdf = fileType === 'application/pdf' || (fileUrl && fileUrl.startsWith('data:application/pdf')) || (fileName && fileName.toLowerCase().endsWith('.pdf'));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-gray-900 font-bold truncate text-lg">
              {fileName || 'File Preview'}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 relative">
          {isImage ? (
            <img 
              src={blobUrl || fileUrl} 
              alt={fileName || 'Preview'} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : isPdf ? (
            <iframe 
              src={blobUrl} 
              className="w-full h-full rounded-lg border-0 bg-white"
              title="PDF Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-indigo-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No Preview Available</h4>
              <p className="text-gray-500 mb-8">
                This document type ({fileName?.split('.').pop()?.toUpperCase() || 'File'}) cannot be previewed directly in the browser. 
                Please download it to view its contents.
              </p>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
              >
                <Download className="w-5 h-5" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
