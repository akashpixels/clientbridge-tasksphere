
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { Database } from '../_shared/types.ts'

// Define types for monthly usage calculation
interface MonthlyUsage {
  allocated_duration: number;  // in seconds
  used_duration: number;       // in seconds
}

// Environment variables should be set in Supabase Dashboard
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize the Supabase client with service role for admin access
const adminClient = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
);

Deno.serve(async (req) => {
  try {
    // Get project ID from request, if provided
    const { projectId } = await req.json().catch(() => ({ projectId: null }));
    
    console.log(`Processing monthly usage calculation${projectId ? ` for project: ${projectId}` : ' for all projects'}`);
    
    // Create query to get active subscriptions
    let query = adminClient
      .from('project_subscriptions')
      .select(`
        id,
        project_id,
        allocated_duration,
        subscription_status,
        next_renewal_date
      `)
      .eq('subscription_status', 'active');
    
    // If projectId is provided, filter by that specific project
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data: subscriptions, error: subscriptionsError } = await query;
    
    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscriptions', details: subscriptionsError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${subscriptions.length} active subscriptions`);
    
    const results = [];
    
    // Process each subscription
    for (const subscription of subscriptions) {
      // Get the current month and year for the billing period
      const now = new Date();
      const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      try {
        // Calculate the total logged_duration from completed tasks in the current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const { data: tasks, error: tasksError } = await adminClient
          .from('tasks')
          .select('logged_duration, completed_at')
          .eq('project_id', subscription.project_id)
          .not('completed_at', 'is', null)
          .gte('completed_at', startOfMonth.toISOString())
          .lte('completed_at', endOfMonth.toISOString());
        
        if (tasksError) {
          console.error(`Error fetching tasks for project ${subscription.project_id}:`, tasksError);
          results.push({
            project_id: subscription.project_id,
            error: 'Error fetching tasks',
            details: tasksError
          });
          continue;
        }
        
        // Calculate total used duration in seconds
        let totalUsedDurationSeconds = 0;
        
        for (const task of tasks || []) {
          // Handle different formats of logged_duration (string, object, etc.)
          if (task.logged_duration) {
            let durationInSeconds = 0;
            
            if (typeof task.logged_duration === 'string') {
              // Handle PostgreSQL interval string format like "2 hours 30 mins"
              if (task.logged_duration.includes('hour')) {
                const hoursMatch = task.logged_duration.match(/(\d+)\s+hours?/);
                const minutesMatch = task.logged_duration.match(/(\d+)\s+mins?/);
                
                const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
                const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
                
                durationInSeconds = (hours * 3600) + (minutes * 60);
              } 
              // Handle HH:MM:SS format
              else if (task.logged_duration.includes(':')) {
                const parts = task.logged_duration.split(':');
                if (parts.length === 3) {
                  durationInSeconds = parseInt(parts[0], 10) * 3600 + 
                    parseInt(parts[1], 10) * 60 + 
                    parseInt(parts[2], 10);
                }
              }
            } 
            else if (typeof task.logged_duration === 'object' && task.logged_duration !== null) {
              // Handle PostgreSQL interval object
              const interval = task.logged_duration;
              if (interval.hours) durationInSeconds += interval.hours * 3600;
              if (interval.minutes) durationInSeconds += interval.minutes * 60;
              if (interval.seconds) durationInSeconds += interval.seconds;
            }
            else if (typeof task.logged_duration === 'number') {
              // Assume this is already in seconds
              durationInSeconds = task.logged_duration;
            }
            
            totalUsedDurationSeconds += durationInSeconds;
          }
        }
        
        // Convert allocated_duration to seconds for consistent comparison
        let allocatedDurationSeconds = 0;
        
        if (subscription.allocated_duration) {
          const allocatedDuration = subscription.allocated_duration;
          
          if (typeof allocatedDuration === 'string') {
            // Handle PostgreSQL interval string format
            if (allocatedDuration.includes('hour')) {
              const hoursMatch = allocatedDuration.match(/(\d+)\s+hours?/);
              const minutesMatch = allocatedDuration.match(/(\d+)\s+mins?/);
              
              const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
              const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
              
              allocatedDurationSeconds = (hours * 3600) + (minutes * 60);
            } 
            // Handle HH:MM:SS format
            else if (allocatedDuration.includes(':')) {
              const parts = allocatedDuration.split(':');
              if (parts.length === 3) {
                allocatedDurationSeconds = parseInt(parts[0], 10) * 3600 + 
                  parseInt(parts[1], 10) * 60 + 
                  parseInt(parts[2], 10);
              }
            }
          } 
          else if (typeof allocatedDuration === 'object' && allocatedDuration !== null) {
            // Handle PostgreSQL interval object
            if (allocatedDuration.hours) allocatedDurationSeconds += allocatedDuration.hours * 3600;
            if (allocatedDuration.minutes) allocatedDurationSeconds += allocatedDuration.minutes * 60;
            if (allocatedDuration.seconds) allocatedDurationSeconds += allocatedDuration.seconds;
          }
          else if (typeof allocatedDuration === 'number') {
            // Assume this is already in seconds
            allocatedDurationSeconds = allocatedDuration;
          }
        }
        
        // Check if there's already a subscription_usage record for this period
        const { data: existingUsage, error: existingUsageError } = await adminClient
          .from('subscription_usage')
          .select('id')
          .eq('subscription_id', subscription.id)
          .eq('billing_period', billingPeriod)
          .single();
        
        // Prepare the usage data
        const usageData = {
          subscription_id: subscription.id,
          project_id: subscription.project_id,
          billing_period: billingPeriod,
          allocated_duration: `${Math.floor(allocatedDurationSeconds / 3600)} hours ${Math.floor((allocatedDurationSeconds % 3600) / 60)} mins`,
          used_duration: `${Math.floor(totalUsedDurationSeconds / 3600)} hours ${Math.floor((totalUsedDurationSeconds % 3600) / 60)} mins`,
          status: subscription.subscription_status,
          metadata: {
            calculation_timestamp: new Date().toISOString(),
            allocated_seconds: allocatedDurationSeconds,
            used_seconds: totalUsedDurationSeconds
          }
        };
        
        let result;
        
        if (existingUsage && !existingUsageError) {
          // Update existing usage record
          const { data, error } = await adminClient
            .from('subscription_usage')
            .update(usageData)
            .eq('id', existingUsage.id)
            .select()
            .single();
          
          if (error) {
            console.error(`Error updating usage for subscription ${subscription.id}:`, error);
            result = {
              subscription_id: subscription.id,
              project_id: subscription.project_id,
              error: 'Error updating usage record',
              details: error
            };
          } else {
            console.log(`Updated usage record for subscription ${subscription.id}`);
            result = data;
          }
        } else {
          // Insert new usage record
          const { data, error } = await adminClient
            .from('subscription_usage')
            .insert(usageData)
            .select()
            .single();
          
          if (error) {
            console.error(`Error creating usage for subscription ${subscription.id}:`, error);
            result = {
              subscription_id: subscription.id,
              project_id: subscription.project_id,
              error: 'Error creating usage record',
              details: error
            };
          } else {
            console.log(`Created new usage record for subscription ${subscription.id}`);
            result = data;
          }
        }
        
        results.push(result);
      } catch (err) {
        console.error(`Error processing subscription ${subscription.id}:`, err);
        results.push({
          subscription_id: subscription.id,
          project_id: subscription.project_id,
          error: 'Processing error',
          details: err.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({ message: 'Monthly usage calculation completed', results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
