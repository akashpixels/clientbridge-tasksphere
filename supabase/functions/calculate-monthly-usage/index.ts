
// Calculate-monthly-usage edge function 
// This function is not directly related to ETA calculation but included for completeness
// We're not modifying its core functionality

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { projectId, billingPeriod } = await req.json();
    
    if (!projectId || !billingPeriod) {
      return new Response(
        JSON.stringify({ error: "Project ID and Billing Period are required" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Query all tasks with actual_duration for the specified period
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('id, actual_duration, completed_at')
      .eq('project_id', projectId)
      .not('actual_duration', 'is', null)
      .gte('completed_at', `${billingPeriod}-01`)
      .lte('completed_at', `${billingPeriod}-31`);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return new Response(
        JSON.stringify({ error: tasksError.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Calculate total used duration for all tasks in the period
    let totalDuration = 0;
    tasks.forEach(task => {
      // Parse actual_duration - could be stored in various formats
      let hours = 0;
      if (typeof task.actual_duration === 'string') {
        if (task.actual_duration.includes(':')) {
          const parts = task.actual_duration.split(':');
          hours = parseInt(parts[0]) + (parseInt(parts[1]) / 60);
        } else {
          hours = parseFloat(task.actual_duration);
        }
      } else if (typeof task.actual_duration === 'number') {
        hours = task.actual_duration;
      }
      totalDuration += hours;
    });

    // Update or create subscription usage record
    const { data, error } = await supabaseClient
      .from('subscription_usage')
      .upsert({
        project_id: projectId,
        billing_period: billingPeriod,
        used_duration: `${Math.floor(totalDuration)} hours ${Math.round((totalDuration % 1) * 60)} minutes`,
        status: 'calculated'
      }, {
        onConflict: 'project_id,billing_period'
      })
      .select();
    
    if (error) {
      console.error("Error updating subscription usage:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data,
        totalDuration,
        taskCount: tasks.length 
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in calculate-monthly-usage function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
