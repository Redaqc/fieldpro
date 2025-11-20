import { base44 } from "@/api/base44Client";
import OfflineStorage from "./OfflineStorage";

export class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  onSyncStatusChange(callback) {
    this.syncCallbacks.push(callback);
  }

  notifyStatusChange(status, pendingCount) {
    this.syncCallbacks.forEach(cb => cb(status, pendingCount));
  }

  async syncPendingOperations() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    const pending = OfflineStorage.getPendingSync();
    
    if (pending.length === 0) {
      this.isSyncing = false;
      this.notifyStatusChange('synced', 0);
      return;
    }

    this.notifyStatusChange('syncing', pending.length);

    for (const operation of pending) {
      try {
        await this.executeOperation(operation);
        OfflineStorage.removePendingSync(operation.id);
        this.notifyStatusChange('syncing', OfflineStorage.getPendingSync().length);
      } catch (error) {
        console.error('Error syncing operation:', error);
        // Continue with next operation
      }
    }

    // Sync GPS tracking data
    await this.syncGPSTracking();

    OfflineStorage.setLastSync(new Date().toISOString());
    this.isSyncing = false;
    this.notifyStatusChange('synced', 0);
  }

  async executeOperation(operation) {
    const { type, entity, data, method } = operation;

    switch (method) {
      case 'create':
        await base44.entities[entity].create(data);
        break;
      case 'update':
        await base44.entities[entity].update(data.id, data);
        break;
      case 'delete':
        await base44.entities[entity].delete(data.id);
        break;
      default:
        console.warn('Unknown operation method:', method);
    }
  }

  async syncGPSTracking() {
    const gpsData = OfflineStorage.getGPSTracking();
    
    if (gpsData.length === 0) return;

    try {
      // Batch create GPS tracking entries
      for (const tracking of gpsData) {
        await base44.entities.GPSTracking.create(tracking);
      }
      OfflineStorage.clearGPSTracking();
    } catch (error) {
      console.error('Error syncing GPS data:', error);
    }
  }

  async refreshData(currentUser) {
    if (!navigator.onLine || !currentUser) return;

    try {
      // Fetch latest jobs
      const jobs = await base44.entities.Job.list();
      OfflineStorage.saveJobs(jobs);

      // Fetch latest time entries
      const timeEntries = await base44.entities.TimeEntry.list('-clock_in', 50);
      OfflineStorage.saveTimeEntries(timeEntries);

      OfflineStorage.setLastSync(new Date().toISOString());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }
}

export const syncManager = new SyncManager();

// Auto-sync when coming online
window.addEventListener('online', () => {
  syncManager.syncPendingOperations();
});

export default syncManager;