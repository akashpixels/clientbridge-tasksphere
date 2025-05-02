
// Update-task-status edge function - this is a placeholder for the function
// This would typically contain code to interact with the database and update task statuses
// We're not modifying its core functionality but ensuring it doesn't depend on extra_details

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

    // Update task status
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({ current_status_id: statusId })
      .eq('id', taskId)
      .select();
    
    if (error) {
      console.error("Error updating task status:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log status change to debug history instead of updating extra_details
    await supabaseClient
      .from('task_eta_debug_history')
      .insert({
        task_id: taskId,
        debug_data: {
          status_update_time: new Date().toISOString(),
          new_status_id: statusId,
          previous_status_id: data?.[0]?.last_status_id || null
        }
      });
    
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
