"use client";

import React, { useState, useEffect } from 'react';

export function LocalStorageViewer() {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [savedReelsData, setSavedReelsData] = useState<any[]>([]);

  useEffect(() => {
    // Get all localStorage data
    const allData: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(allData);

    // Specifically get saved-reels data
    const savedReels = localStorage.getItem('saved-reels');
    if (savedReels) {
      try {
        const parsed = JSON.parse(savedReels);
        setSavedReelsData(parsed);
      } catch (error) {
        console.error('Error parsing saved-reels:', error);
      }
    }
  }, []);

  const handleClearSavedReels = () => {
    localStorage.removeItem('saved-reels');
    setSavedReelsData([]);
    setLocalStorageData((prev: any) => {
      const newData = { ...prev };
      delete newData['saved-reels'];
      return newData;
    });
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setSavedReelsData([]);
    setLocalStorageData({});
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(localStorageData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'localStorage-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">LocalStorage Data Viewer</h1>
        
        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Export All Data
          </button>
          <button
            onClick={handleClearSavedReels}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Clear Saved Reels
          </button>
          <button
            onClick={handleClearAllData}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
          >
            Clear All Data
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Saved Reels Specific */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Saved Reels Data ({savedReelsData.length} items)</h2>
          {savedReelsData.length > 0 ? (
            <div className="space-y-4">
              {savedReelsData.map((reel, index) => (
                <div key={reel.id || index} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">{reel.title || 'No Title'}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">ID:</span> {reel.id}
                    </div>
                    <div>
                      <span className="text-gray-400">Views:</span> {reel.viewCount || reel.views || 0}
                    </div>
                    <div>
                      <span className="text-gray-400">Likes:</span> {reel.likes || 0}
                    </div>
                    <div>
                      <span className="text-gray-400">Category:</span> {reel.category || 'N/A'}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Video URL:</span> 
                      <div className="text-xs text-blue-300 break-all mt-1">{reel.videoUrl}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Thumbnail URL:</span> 
                      <div className="text-xs text-blue-300 break-all mt-1">{reel.thumbnailUrl}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Description:</span> 
                      <div className="text-sm mt-1">{reel.description || 'No description'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No saved reels found</p>
          )}
        </div>

        {/* All LocalStorage Data */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-green-400">All LocalStorage Data</h2>
          <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            {JSON.stringify(localStorageData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
