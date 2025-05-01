
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing request to update task status");

    // Get active tasks that are in progress
    const { data: activeTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("current_status_id", 4) // In Progress status
      .is("completed_at", null);

    if (tasksError) {
      throw new Error(`Error fetching active tasks: ${tasksError.message}`);
    }

    console.log(`Found ${activeTasks?.length || 0} active tasks to update`);

    // Process each task
    for (const task of activeTasks || []) {
      // Update task logic here - e.g., update durations, check deadlines, etc.
      console.log(`Processing task: ${task.id}`);
      
      // Example: Update actual_duration for in-progress tasks
      if (task.started_at) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({
            actual_duration: `${Math.floor((Date.now() - new Date(task.started_at).getTime()) / 1000)} seconds`
          })
          .eq("id", task.id);
        
        if (updateError) {
          console.error(`Error updating task ${task.id}:`, updateError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Updated ${activeTasks?.length || 0} tasks` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error updating task status:", error.message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
