
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { taskId, statusId } = await req.json();
    
    if (!taskId || !statusId) {
      return new Response(
        JSON.stringify({ error: "Task ID and Status ID are required" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    // First, get the current task data
    const { data: taskData, error: taskError } = await supabaseClient
      .from('tasks')
      .select('current_status_id, project_id')
      .eq('id', taskId)
      .single();
      
    if (taskError) {
      console.error("Error fetching task:", taskError);
      return new Response(
        JSON.stringify({ error: taskError.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // We're updating the status here
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({ current_status_id: statusId, last_status_id: taskData.current_status_id })
      .eq('id', taskId)
      .select();
    
    if (error) {
      console.error("Error updating task status:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in update-task-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
