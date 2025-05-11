
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
        current_status_id,
        project_id
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

    // Get active status IDs
    const { data: activeStatusData } = await supabaseAdmin
      .from('task_statuses')
      .select('id')
      .eq('type', 'active')

    const activeStatusIds = activeStatusData?.map(status => status.id) || []
    const isActiveStatus = activeStatusIds.includes(statusId)
    const wasActiveStatus = activeStatusIds.includes(taskData.current_status_id)

    // Handle status update
    const updatePayload: any = {
      current_status_id: statusId,
      last_status_id: taskData.current_status_id,
    }

    // Special handling for completed statuses
    if (statusData.type === 'completed') {
      updatePayload.completed_at = new Date().toISOString()
    }

    // Special handling for active status when coming from non-active status
    if (isActiveStatus && !wasActiveStatus) {
      // Calculate base time using database function instead of using NOW()
      const { data: baseTimeData } = await supabaseAdmin
        .rpc('calculate_base_time', { 
          p_project_id: taskData.project_id, 
          p_queue_pos: 0 
        })

      if (baseTimeData) {
        updatePayload.est_start = baseTimeData
        
        // Also fetch est_duration and complexity info for est_end calculation
        const { data: taskDetails } = await supabaseAdmin
          .from('tasks')
          .select(`
            est_duration,
            complexity_level_id,
            task_type_id,
            total_blocked_duration
          `)
          .eq('id', taskId)
          .single()
          
        if (taskDetails) {
          if (taskDetails.est_duration) {
            // We have est_duration, use it directly
            const { data: estEndData } = await supabaseAdmin
              .rpc('calculate_working_timestamp', {
                start_time: baseTimeData,
                work_hours: taskDetails.est_duration + (taskDetails.total_blocked_duration || '0')
              })
              
            if (estEndData) {
              updatePayload.est_end = estEndData
            }
          } else {
            // No est_duration, calculate from complexity and task type
            const { data: complexityData } = await supabaseAdmin
              .from('complexity_levels')
              .select('multiplier')
              .eq('id', taskDetails.complexity_level_id || 3)
              .single()
              
            const { data: taskTypeData } = await supabaseAdmin
              .from('task_types')
              .select('default_duration')
              .eq('id', taskDetails.task_type_id)
              .single()
              
            if (complexityData && taskTypeData) {
              const multiplier = complexityData.multiplier || 1
              const defaultDuration = taskTypeData.default_duration || '2 hours'
              
              // Calculate est_end using the estimated duration
              const { data: estEndData } = await supabaseAdmin
                .rpc('calculate_working_timestamp', {
                  start_time: baseTimeData,
                  work_hours: `${multiplier * (parseInt(defaultDuration) || 2)} hours` + (taskDetails.total_blocked_duration || '0')
                })
                
              if (estEndData) {
                updatePayload.est_end = estEndData
              }
            }
          }
        }
      }
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
