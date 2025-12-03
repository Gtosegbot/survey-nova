import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineSyncStatus() {
  const { pendingCount, isOnline, isSyncing, syncAll } = useOfflineSync();

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      {/* Connection Status */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Badge variant="destructive" className="flex items-center gap-2 px-3 py-1.5">
              <WifiOff className="h-4 w-4" />
              Sem conexão
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Sync Badge */}
      <AnimatePresence>
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Badge 
              variant="secondary" 
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
            >
              {isOnline ? (
                <Cloud className="h-4 w-4" />
              ) : (
                <CloudOff className="h-4 w-4" />
              )}
              {pendingCount} resposta{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
            
            {isOnline && !isSyncing && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncAll}
                className="h-8 px-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            
            {isSyncing && (
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando...
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online indicator when connected and no pending */}
      <AnimatePresence>
        {isOnline && pendingCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5 text-green-600">
              <Wifi className="h-4 w-4" />
              Online
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
