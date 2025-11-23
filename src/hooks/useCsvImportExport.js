import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * AUDIT FIX: MEDIUM Priority Issue #20 - Refactor Duplicate CSV Patterns
 *
 * Reusable hook for CSV export/import functionality
 * Eliminates code duplication across Customers, Team, Materials, Assets pages
 *
 * @param {string} entityType - The entity type to export/import (e.g., 'customers', 'team', 'materials', 'assets')
 * @param {string} queryKey - The React Query cache key to invalidate after import (e.g., 'customers', 'technicians', 'materials', 'assets')
 * @returns {object} - { handleExport, handleImport, importing }
 */
export function useCsvImportExport(entityType, queryKey) {
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Export entities to CSV file
   * Automatically triggers browser download
   */
  const handleExport = async () => {
    try {
      const { data } = await base44.functions.invoke('csvExport', {
        entity_type: entityType
      });

      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export error: ' + error.message);
      throw error;
    }
  };

  /**
   * Import entities from CSV file
   * @param {Event} e - File input change event
   */
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const { data } = await base44.functions.invoke('csvImport', {
        entity_type: entityType,
        csv_data: text
      });

      // Show success message with import statistics
      alert(
        `Import réussi: ${data.created} créés, ${data.updated} mis à jour, ${data.failed} échecs`
      );

      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    } catch (error) {
      alert('Erreur d\'importation: ' + error.message);
      throw error;
    } finally {
      setImporting(false);
    }
  };

  return {
    handleExport,
    handleImport,
    importing
  };
}
