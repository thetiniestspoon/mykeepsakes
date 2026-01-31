import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  tripId: string;
  includePhotos?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tripId, includePhotos = true }: ExportRequest = await req.json();

    if (!tripId) {
      return new Response(
        JSON.stringify({ error: 'tripId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting export for trip: ${tripId}, includePhotos: ${includePhotos}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch trip data
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      console.error('Trip not found:', tripError);
      return new Response(
        JSON.stringify({ error: 'Trip not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found trip: ${trip.title}`);

    // Fetch itinerary days
    const { data: days, error: daysError } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('trip_id', tripId)
      .order('sort_index', { ascending: true });

    if (daysError) {
      console.error('Error fetching days:', daysError);
      throw daysError;
    }

    // Fetch itinerary items with locations
    const { data: items, error: itemsError } = await supabase
      .from('itinerary_items')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('trip_id', tripId)
      .order('sort_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }

    // Fetch locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('trip_id', tripId);

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      throw locationsError;
    }

    // Fetch memories with media
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select(`
        *,
        media:memory_media(*)
      `)
      .eq('trip_id', tripId);

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError);
      throw memoriesError;
    }

    console.log(`Data fetched: ${days?.length || 0} days, ${items?.length || 0} items, ${memories?.length || 0} memories`);

    // Create ZIP file
    const zip = new JSZip();

    // Add trip metadata
    zip.file('trip.json', JSON.stringify(trip, null, 2));
    zip.file('itinerary-days.json', JSON.stringify(days || [], null, 2));
    zip.file('itinerary-items.json', JSON.stringify(items || [], null, 2));
    zip.file('locations.json', JSON.stringify(locations || [], null, 2));
    zip.file('memories.json', JSON.stringify(memories || [], null, 2));

    // Create human-readable itinerary
    let itineraryText = `# ${trip.title}\n`;
    itineraryText += `Location: ${trip.location_name || 'N/A'}\n`;
    itineraryText += `Dates: ${trip.start_date} to ${trip.end_date}\n\n`;
    itineraryText += '---\n\n';

    const itemsByDay = (items || []).reduce((acc: Record<string, typeof items>, item: any) => {
      if (!acc[item.day_id]) acc[item.day_id] = [];
      acc[item.day_id].push(item);
      return acc;
    }, {});

    (days || []).forEach((day: any, index: number) => {
      const dayItems = itemsByDay[day.id] || [];
      itineraryText += `## Day ${index + 1}: ${day.date}\n`;
      if (day.title) itineraryText += `### ${day.title}\n`;
      itineraryText += '\n';

      dayItems.forEach((item: any) => {
        const time = item.start_time ? `[${item.start_time.slice(0, 5)}] ` : '';
        itineraryText += `- ${time}**${item.title}**`;
        if (item.description) itineraryText += ` - ${item.description}`;
        itineraryText += '\n';
        
        if (item.location) {
          itineraryText += `  📍 ${item.location.name}`;
          if (item.location.address) itineraryText += ` (${item.location.address})`;
          itineraryText += '\n';
        }
        if (item.notes) itineraryText += `  📝 ${item.notes}\n`;
      });
      
      itineraryText += '\n';
    });

    zip.file('itinerary.md', itineraryText);

    // Download and add photos if requested
    if (includePhotos && memories && memories.length > 0) {
      const photosFolder = zip.folder('photos');
      let photoCount = 0;

      for (const memory of memories) {
        const media = (memory as any).media || [];
        for (const file of media) {
          try {
            const { data: fileData, error: fileError } = await supabase.storage
              .from('trip-photos')
              .download(file.storage_path);

            if (fileError) {
              console.error(`Error downloading ${file.storage_path}:`, fileError);
              continue;
            }

            const fileName = file.storage_path.split('/').pop() || `photo_${photoCount}.jpg`;
            const arrayBuffer = await fileData.arrayBuffer();
            photosFolder?.file(fileName, arrayBuffer);
            photoCount++;
            console.log(`Added photo: ${fileName}`);
          } catch (err) {
            console.error(`Error processing photo ${file.storage_path}:`, err);
          }
        }
      }
      console.log(`Added ${photoCount} photos to ZIP`);
    }

    // Generate ZIP
    console.log('Generating ZIP file...');
    const zipContent = await zip.generateAsync({ type: 'arraybuffer' });
    console.log(`ZIP generated, size: ${zipContent.byteLength} bytes`);

    // Return ZIP file
    const fileName = `${trip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-export.zip`;
    
    return new Response(zipContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Export failed';
    console.error('Export error:', err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
