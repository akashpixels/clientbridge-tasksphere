
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request parameters
    const url = new URL(req.url);
    const forceRun = url.searchParams.get("force") === "true";
    
    // Create supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user has permission (in a real-world scenario)
    // This is a simplified version, you might want to add real authorization checks
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Call the SQL function to calculate and store monthly subscription usage
    // This function is now updated to properly handle INTERVAL data types
    const { data, error } = await supabaseClient.rpc(
      "calculate_monthly_subscription_usage"
    );

    if (error) {
      console.error("RPC error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Monthly subscription usage calculation completed successfully",
        data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
