// Offline Storage Manager
const STORAGE_KEYS = {
  JOBS: 'offline_jobs',
  TIME_ENTRIES: 'offline_time_entries',
  GPS_TRACKING: 'offline_gps_tracking',
  PENDING_SYNC: 'offline_pending_sync',
  LAST_SYNC: 'offline_last_sync',
};

export const OfflineStorage = {
  // Save data to local storage
  saveJobs: (jobs) => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    } catch (error) {
      console.error('Error saving jobs offline:', error);
    }
  },

  getJobs: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOBS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading jobs offline:', error);
      return [];
    }
  },

  saveTimeEntries: (entries) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving time entries offline:', error);
    }
  },

  getTimeEntries: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading time entries offline:', error);
      return [];
    }
  },

  saveGPSTracking: (tracking) => {
    try {
      const existing = OfflineStorage.getGPSTracking();
      existing.push(tracking);
      localStorage.setItem(STORAGE_KEYS.GPS_TRACKING, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving GPS tracking offline:', error);
    }
  },

  getGPSTracking: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GPS_TRACKING);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading GPS tracking offline:', error);
      return [];
    }
  },

  clearGPSTracking: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.GPS_TRACKING, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing GPS tracking:', error);
    }
  },

  // Queue operations for sync
  addPendingSync: (operation) => {
    try {
      const pending = OfflineStorage.getPendingSync();
      pending.push({
        ...operation,
        timestamp: new Date().toISOString(),
        id: `pending_${Date.now()}_${Math.random()}`,
      });
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending sync:', error);
    }
  },

  getPendingSync: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading pending sync:', error);
      return [];
    }
  },

  removePendingSync: (id) => {
    try {
      const pending = OfflineStorage.getPendingSync();
      const filtered = pending.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing pending sync:', error);
    }
  },

  clearPendingSync: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing pending sync:', error);
    }
  },

  setLastSync: (timestamp) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    } catch (error) {
      console.error('Error setting last sync:', error);
    }
  },

  getLastSync: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  },

  // Update local job status
  updateJobStatus: (jobId, newStatus) => {
    try {
      const jobs = OfflineStorage.getJobs();
      const updatedJobs = jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      );
      OfflineStorage.saveJobs(updatedJobs);
    } catch (error) {
      console.error('Error updating job status offline:', error);
    }
  },

  // Update entire job locally
  updateJob: (jobId, updates) => {
    try {
      const jobs = OfflineStorage.getJobs();
      const updatedJobs = jobs.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      );
      OfflineStorage.saveJobs(updatedJobs);
    } catch (error) {
      console.error('Error updating job offline:', error);
    }
  },

  // Add job notes offline
  addJobNote: (jobId, note) => {
    try {
      const jobs = OfflineStorage.getJobs();
      const updatedJobs = jobs.map(job => {
        if (job.id === jobId) {
          const logs = job.technician_logs || [];
          logs.push({
            note,
            timestamp: new Date().toISOString(),
            technician_name: job.technician_name,
          });
          return { ...job, technician_logs: logs };
        }
        return job;
      });
      OfflineStorage.saveJobs(updatedJobs);
    } catch (error) {
      console.error('Error adding job note offline:', error);
    }
  },

  // Add local time entry
  addTimeEntry: (entry) => {
    try {
      const entries = OfflineStorage.getTimeEntries();
      entries.unshift(entry);
      OfflineStorage.saveTimeEntries(entries);
    } catch (error) {
      console.error('Error adding time entry offline:', error);
    }
  },

  // Update local time entry
  updateTimeEntry: (entryId, updates) => {
    try {
      const entries = OfflineStorage.getTimeEntries();
      const updatedEntries = entries.map(entry =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      );
      OfflineStorage.saveTimeEntries(updatedEntries);
    } catch (error) {
      console.error('Error updating time entry offline:', error);
    }
  },
};

export default OfflineStorage;