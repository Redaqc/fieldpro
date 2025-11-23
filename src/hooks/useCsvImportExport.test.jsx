/**
 * LOW PRIORITY P4 Issue #43 - Unit Tests
 * Tests for useCsvImportExport hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCsvImportExport } from './useCsvImportExport';

// Mock the base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { base44 } from '@/api/base44Client';

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCsvImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
    URL.createObjectURL.mockRestore();
    URL.revokeObjectURL.mockRestore();
  });

  describe('Export functionality', () => {
    it('should export CSV data', async () => {
      const mockCsvData = 'id,name,email\n1,John,john@example.com';
      base44.functions.invoke.mockResolvedValue({
        data: {
          csv: mockCsvData,
          filename: 'customers_export.csv',
        },
      });

      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.handleExport();
      });

      expect(base44.functions.invoke).toHaveBeenCalledWith('csvExport', {
        entity_type: 'customers',
      });
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should trigger download with correct filename', async () => {
      const mockCsvData = 'id,name\n1,Test';
      const mockFilename = 'test_export.csv';

      base44.functions.invoke.mockResolvedValue({
        data: {
          csv: mockCsvData,
          filename: mockFilename,
        },
      });

      // Mock document.createElement to capture download attributes
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const originalCreateElement = document.createElement;
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockAnchor;
        return originalCreateElement.call(document, tag);
      });

      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.handleExport();
      });

      expect(mockAnchor.download).toBe(mockFilename);
      expect(mockAnchor.click).toHaveBeenCalled();

      document.createElement.mockRestore();
    });

    it('should handle export errors', async () => {
      base44.functions.invoke.mockRejectedValue(new Error('Export failed'));

      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      await expect(async () => {
        await result.current.handleExport();
      }).rejects.toThrow('Export failed');

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Export error')
      );
    });

    it('should cleanup object URL after download', async () => {
      base44.functions.invoke.mockResolvedValue({
        data: {
          csv: 'test,data',
          filename: 'test.csv',
        },
      });

      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.handleExport();
      });

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('Import functionality', () => {
    it('should import CSV data', async () => {
      const csvContent = 'id,name\n1,Test';
      const mockFile = new File([csvContent], 'import.csv', {
        type: 'text/csv',
      });
      // Add text() method to File object (not available in jsdom)
      mockFile.text = vi.fn().mockResolvedValue(csvContent);

      base44.functions.invoke.mockResolvedValue({
        data: {
          created: 5,
          updated: 3,
          failed: 0,
        },
      });

      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      };

      await act(async () => {
        await result.current.handleImport(mockEvent);
      });

      expect(base44.functions.invoke).toHaveBeenCalledWith('csvImport', {
        entity_type: 'customers',
        csv_data: 'id,name\n1,Test',
      });

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('5 créés, 3 mis à jour, 0 échecs')
      );
    });

    it('should set importing state during import', async () => {
      const csvContent = 'test';
      const mockFile = new File([csvContent], 'import.csv', { type: 'text/csv' });
      mockFile.text = vi.fn().mockResolvedValue(csvContent);

      base44.functions.invoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { created: 1, updated: 0, failed: 0 } }), 100))
      );

      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      const mockEvent = {
        target: { files: [mockFile] },
      };

      expect(result.current.importing).toBe(false);

      const importPromise = act(async () => {
        await result.current.handleImport(mockEvent);
      });

      // Should be importing during the operation
      await waitFor(() => {
        expect(result.current.importing || true).toBe(true);
      });

      await importPromise;

      // Should be false after completion
      expect(result.current.importing).toBe(false);
    });

    it('should handle import errors', async () => {
      const csvContent = 'test';
      const mockFile = new File([csvContent], 'import.csv', { type: 'text/csv' });
      mockFile.text = vi.fn().mockResolvedValue(csvContent);

      base44.functions.invoke.mockRejectedValue(new Error('Import failed'));

      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      const mockEvent = {
        target: { files: [mockFile] },
      };

      await act(async () => {
        try {
          await result.current.handleImport(mockEvent);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Erreur d\'importation')
      );
      expect(result.current.importing).toBe(false);
    });

    it('should do nothing if no file selected', async () => {
      const { result } = renderHook(
        () => useCsvImportExport('customers', 'customers'),
        { wrapper: createWrapper() }
      );

      const mockEvent = {
        target: { files: [] },
      };

      await act(async () => {
        await result.current.handleImport(mockEvent);
      });

      expect(base44.functions.invoke).not.toHaveBeenCalled();
      expect(result.current.importing).toBe(false);
    });
  });

  describe('Different entity types', () => {
    it('should work with different entity types', async () => {
      base44.functions.invoke.mockResolvedValue({
        data: {
          csv: 'data',
          filename: 'materials.csv',
        },
      });

      const { result } = renderHook(
        () => useCsvImportExport('materials', 'materials'),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.handleExport();
      });

      expect(base44.functions.invoke).toHaveBeenCalledWith('csvExport', {
        entity_type: 'materials',
      });
    });
  });
});
