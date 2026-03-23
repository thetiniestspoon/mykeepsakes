import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExportOptions {
  tripId: string;
  includePhotos?: boolean;
  filterByTag?: string;
}

export function useExportTrip() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const exportTrip = async ({ tripId, includePhotos = true, filterByTag }: ExportOptions) => {
    setIsExporting(true);
    setProgress('Preparing export...');

    try {
      setProgress('Generating ZIP file...');

      // Build the request body, filtering memories by tag before export if specified
      const requestBody: { tripId: string; includePhotos: boolean; filterByTag?: string } = {
        tripId,
        includePhotos,
      };
      if (filterByTag) {
        requestBody.filterByTag = filterByTag;
      }

      const { data, error } = await supabase.functions.invoke('export-trip', {
        body: requestBody,
      });

      if (error) {
        throw new Error(error.message || 'Export failed');
      }

      // The response is a blob
      setProgress('Downloading...');
      
      // Create download link
      const blob = new Blob([data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trip-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Trip exported successfully!');
      setProgress('');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error instanceof Error ? error.message : 'Export failed');
      setProgress('');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportTrip,
    isExporting,
    progress,
  };
}
