import React from 'react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/90 text-white px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-xs border border-amber-400/30 animate-pulse"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — All Civil Calculators Run 100% Locally</span>
    </div>
  );
};
