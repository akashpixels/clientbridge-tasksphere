
// This function will update task ETAs based on priority, complexity, and working hours
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Updating task ETAs...');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Get tasks that need ETAs updated
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select(`
        id, 
        task_type_id, 
        complexity_level_id,
        priority_level_id,
        started_at,
        est_end
      `)
      .is('completed_at', null)
      .not('is_onhold', 'eq', true)   // Not on hold
      .not('is_awaiting_input', 'eq', true)  // Not awaiting input
      .order('priority_level_id', { ascending: true }); // Process highest priority first
    
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }
    
    console.log(`Found ${tasks?.length || 0} tasks to update ETAs`);
    
    // Process each task
    const updates = [];
    for (const task of tasks || []) {
      try {
        // Get task complexity and task type data to calculate duration
        const { data: complexityLevel } = await supabaseClient
          .from('complexity_levels')
          .select('multiplier')
          .eq('id', task.complexity_level_id)
          .single();
        
        const { data: taskType } = await supabaseClient
          .from('task_types')
          .select('default_duration')
          .eq('id', task.task_type_id)
          .single();
        
        const { data: priorityLevel } = await supabaseClient
          .from('priority_levels')
          .select('start_delay')
          .eq('id', task.priority_level_id)
          .single();
        
        // If we have valid data, calculate new ETA
        if (complexityLevel && taskType && taskType.default_duration) {
          const multiplier = complexityLevel.multiplier || 1;
          
          // Calculate new ETA using database function
          const { data: result } = await supabaseClient.rpc(
            'calculate_working_timestamp',
            {
              start_time: task.started_at || new Date().toISOString(),
              work_hours: `${taskType.default_duration.hours * multiplier} hours`
            }
          );
          
          if (result) {
            updates.push({
              id: task.id,
              est_end: result
            });
            
            console.log(`Updated ETA for task ${task.id} to ${result}`);
          }
        }
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        // Continue with other tasks
      }
    }
    
    // Bulk update the ETAs
    if (updates.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('tasks')
        .upsert(updates);
      
      if (updateError) {
        console.error('Error updating task ETAs:', updateError);
        throw updateError;
      }
      
      console.log(`Successfully updated ETAs for ${updates.length} tasks`);
    }
    
    return new Response(
      JSON.stringify({ success: true, updated: updates.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in update-task-etas function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
