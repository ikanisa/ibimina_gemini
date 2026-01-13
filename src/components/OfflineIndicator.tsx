/**
 * Offline Status Indicator
 * Shows when the app is offline and when sync is in progress
 */

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';
import { getQueuedActionsCount } from '../lib/offline/queue';

interface OfflineIndicatorProps {
  className?: string;
  position?: 'top' | 'bottom';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  position = 'top',
}) => {
  const { isOnline, wasOffline, isSyncing, sync } = useOffline();
  const [queuedCount, setQueuedCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Update queued count periodically
  useEffect(() => {
    const updateCount = () => {
      setQueuedCount(getQueuedActionsCount());
    };

    updateCount();
    const interval = setInterval(updateCount, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't show if online and nothing to sync
  if (isOnline && !wasOffline && queuedCount === 0 && !isSyncing) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'top-0 left-0 right-0'
    : 'bottom-0 left-0 right-0';

  return (
    <div
      className={`fixed ${positionClasses} z-50 transition-transform duration-300 ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`
          mx-auto max-w-7xl px-4 py-2
          transition-all duration-300
          ${
            isOnline
              ? isSyncing
                ? 'bg-blue-600 text-white'
                : queuedCount > 0
                ? 'bg-yellow-600 text-white'
                : wasOffline
                ? 'bg-green-600 text-white'
                : 'hidden'
              : 'bg-red-600 text-white'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              isSyncing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="text-sm font-medium">
                    Syncing {queuedCount > 0 ? `${queuedCount} action${queuedCount !== 1 ? 's' : ''}` : 'changes'}...
                  </span>
                </>
              ) : queuedCount > 0 ? (
                <>
                  <Wifi size={18} />
                  <span className="text-sm font-medium">
                    {queuedCount} action{queuedCount !== 1 ? 's' : ''} pending sync
                  </span>
                </>
              ) : wasOffline ? (
                <>
                  <Wifi size={18} />
                  <span className="text-sm font-medium">Back online - All changes synced</span>
                </>
              ) : null
            ) : (
              <>
                <WifiOff size={18} />
                <div className="flex-1">
                  <span className="text-sm font-medium">You're offline</span>
                  {queuedCount > 0 && (
                    <span className="ml-2 text-xs opacity-90">
                      ({queuedCount} action{queuedCount !== 1 ? 's' : ''} queued)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {isOnline && queuedCount > 0 && !isSyncing && (
            <button
              onClick={sync}
              className="text-sm font-medium underline hover:no-underline"
              aria-label="Sync now"
            >
              Sync now
            </button>
          )}

          {wasOffline && isOnline && queuedCount === 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs opacity-75 hover:opacity-100"
              aria-label="Toggle details"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          )}
        </div>

        {showDetails && wasOffline && isOnline && (
          <div className="mt-2 text-xs opacity-90">
            Your changes were saved while offline and have been synced with the server.
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact offline indicator (for header/navbar)
 */
export const CompactOfflineIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, isSyncing } = useOffline();
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setQueuedCount(getQueuedActionsCount());
    };

    updateCount();
    const interval = setInterval(updateCount, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isOnline && queuedCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      {isOnline ? (
        isSyncing ? (
          <>
            <RefreshCw size={16} className="animate-spin text-blue-600" />
            <span className="text-xs text-slate-600">{queuedCount}</span>
          </>
        ) : queuedCount > 0 ? (
          <>
            <Wifi size={16} className="text-yellow-600" />
            <span className="text-xs text-slate-600">{queuedCount}</span>
          </>
        ) : null
      ) : (
        <WifiOff size={16} className="text-red-600" />
      )}
    </div>
  );
};
