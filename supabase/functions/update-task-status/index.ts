
// Update Task Status Edge Function
// This function handles updating a task's status and managing ETAs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { taskId, statusId, userId } = await req.json()
    
    if (!taskId || !statusId) {
      return new Response(
        JSON.stringify({ error: 'Task ID and Status ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the task's current status
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        current_status_id
      `)
      .eq('id', taskId)
      .single()

    if (taskError) {
      console.error('Error fetching task:', taskError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch task information' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get status information
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('task_statuses')
      .select(`
        id,
        name,
        type
      `)
      .eq('id', statusId)
      .single()

    if (statusError) {
      console.error('Error fetching status:', statusError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch status information' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Handle status update
    const updatePayload: any = {
      current_status_id: statusId,
      last_status_id: taskData.current_status_id,
    }

    // Special handling for completed statuses
    if (statusData.type === 'completed') {
      updatePayload.completed_at = new Date().toISOString()
    }

    // Update task status
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update task status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Log the status change
    const { error: logError } = await supabaseAdmin
      .from('activity_log')
      .insert({
        entity_id: taskId,
        entity_type: 'task',
        entity_name: `Task ${taskId}`,
        action: 'status_change',
        description: `Status changed to ${statusData.name}`,
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        updated_fields: {
          current_status_id: {
            old: taskData.current_status_id,
            new: statusId
          }
        }
      })

    if (logError) {
      console.error('Error logging activity:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Task status updated successfully', 
        task: updatedTask 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
