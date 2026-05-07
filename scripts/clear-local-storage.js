// Script to clear all localStorage data
// Run this in the browser console or as part of the app

export function clearAllLocalStorage() {
  // Clear all localStorage data
  localStorage.clear();
  console.log('All localStorage data cleared');
}

export function clearSpecificKeys() {
  // Clear specific keys that the app uses
  const keysToRemove = [
    'saved-reels',
    'age-confirmed', 
    'categories-selected',
    'selected-categories',
    'target-reel-id'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Cleared: ${key}`);
  });
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  clearSpecificKeys();
}
