"use client";

import React from "react";

interface ErrorFallbackProps {
  message: string;
  onRetry?: () => void;
  onSavedReels?: () => void;
}

export function ErrorFallback({ message, onRetry, onSavedReels }: ErrorFallbackProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-black text-white p-10 text-center">
      <div className="max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Unable to load reels</h1>
        <p className="text-white/70 mb-6">{message}</p>
        <div className="space-y-3">
          <button
            onClick={onRetry || (() => window.location.reload())}
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onSavedReels || (() => window.location.href = '/saved-reels')}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            View Saved Reels
          </button>
        </div>
        <p className="text-white/50 text-sm mt-6">
          The service may be temporarily unavailable. Please try again in a few minutes.
        </p>
      </div>
    </div>
  );
}
