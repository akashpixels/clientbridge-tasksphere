
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Initialize Supabase client with service role key for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log("Processing request to update task status");

  try {
    // Call the database function to update tasks with missing start times
    const { data, error } = await supabase.rpc("update_in_progress_tasks");

    if (error) {
      console.error("Error updating task status:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Task status updated successfully:", data);
    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Exception while updating task status:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
