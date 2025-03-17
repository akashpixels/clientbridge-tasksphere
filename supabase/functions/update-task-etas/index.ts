
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers to ensure the function can be called from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role key for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log("Processing request to update task ETAs");

  try {
    // Create a database function to recalculate ETAs
    const { data: fnData, error: fnError } = await supabase.rpc("create_update_task_etas_function", {}, { count: "exact" });
    
    if (fnError) {
      console.error("Error creating or checking update_task_etas function:", fnError.message);
    }

    // Call the database function to update tasks ETAs
    const { data, error } = await supabase.rpc("update_task_etas");

    if (error) {
      console.error("Error updating task ETAs:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Task ETAs updated successfully:", data);
    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Exception while updating task ETAs:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
