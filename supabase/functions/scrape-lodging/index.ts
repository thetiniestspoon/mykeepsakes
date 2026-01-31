const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Schema for extracting lodging details
const lodgingSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Property title or name" },
    description: { type: "string", description: "Property description, including highlights and features" },
    address: { type: "string", description: "Full location or address including city and state" },
    price_per_night: { type: "number", description: "Nightly price in USD (just the number)" },
    bedrooms: { type: "integer", description: "Number of bedrooms" },
    bathrooms: { type: "number", description: "Number of bathrooms (can be decimal like 1.5)" },
    max_guests: { type: "integer", description: "Maximum number of guests allowed" },
    amenities: { 
      type: "array", 
      items: { type: "string" },
      description: "List of amenities like WiFi, Kitchen, Pool, etc." 
    },
    photos: {
      type: "array",
      items: { type: "string" },
      description: "URLs of property photos (first 5)"
    }
  },
  required: ["name"]
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping service not configured. Please connect Firecrawl.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping lodging URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          { 
            type: 'json', 
            schema: lodgingSchema,
            prompt: 'Extract rental property listing details including the property name, description, location, nightly price, number of bedrooms and bathrooms, maximum guest count, and list of amenities. Also extract up to 5 photo URLs.'
          }
        ],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content to load
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      
      // Check for blocklist error and provide user-friendly message
      const errorMessage = data.error || `Failed to scrape listing (status ${response.status})`;
      const isBlocklisted = errorMessage.includes('blocklisted');
      
      const userFriendlyError = isBlocklisted 
        ? 'This rental site cannot be scraped due to their terms of service. Please enter the property details manually.'
        : errorMessage;
      
      return new Response(
        JSON.stringify({ success: false, error: userFriendlyError }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JSON data from the response
    const extractedData = data.data?.json || data.json || {};
    
    console.log('Extracted lodging data:', extractedData);

    // Return the extracted data along with the original URL
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...extractedData,
          url: formattedUrl,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping lodging:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape listing';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
