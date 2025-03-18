
// This function calculates the monthly usage for all active project subscriptions
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
    console.log('Starting monthly subscription usage calculation');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Calculate dates for the previous month
    const currentDate = new Date();
    const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayPrevMonth = new Date(firstDayCurrentMonth);
    lastDayPrevMonth.setDate(lastDayPrevMonth.getDate() - 1);
    const firstDayPrevMonth = new Date(lastDayPrevMonth.getFullYear(), lastDayPrevMonth.getMonth(), 1);
    
    const prevMonthFormat = `${firstDayPrevMonth.getFullYear()}-${String(firstDayPrevMonth.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`Calculating usage for month: ${prevMonthFormat}`);
    
    // Get all active project subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabaseClient
      .from('project_subscriptions')
      .select('id, project_id, allocated_duration')
      .eq('subscription_status', 'active');
    
    if (subscriptionError) {
      console.error('Error fetching subscriptions:', subscriptionError);
      throw subscriptionError;
    }
    
    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);
    
    // Process each subscription
    for (const subscription of subscriptions || []) {
      try {
        // Calculate total hours spent in the previous month
        const { data: tasks, error: tasksError } = await supabaseClient
          .from('tasks')
          .select('logged_duration, actual_duration')
          .eq('project_id', subscription.project_id)
          .gte('created_at', firstDayPrevMonth.toISOString())
          .lt('created_at', firstDayCurrentMonth.toISOString());
        
        if (tasksError) {
          console.error(`Error fetching tasks for project ${subscription.project_id}:`, tasksError);
          continue; // Skip to next subscription
        }
        
        // Calculate total hours spent - first try logged_duration, then fall back to actual_duration
        let totalHoursSpent = 0;
        tasks?.forEach(task => {
          // First try to use logged_duration if available
          if (task.logged_duration) {
            // Convert PostgreSQL interval to hours
            const hoursMatch = String(task.logged_duration).match(/(\d+)\s+hour/i);
            const minutesMatch = String(task.logged_duration).match(/(\d+)\s+min/i);
            
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            
            totalHoursSpent += hours + (minutes / 60);
          } 
          // Fall back to actual_duration if logged_duration is not available
          else if (task.actual_duration) {
            // Convert PostgreSQL interval to hours
            const hoursMatch = String(task.actual_duration).match(/(\d+)\s+hour/i);
            const minutesMatch = String(task.actual_duration).match(/(\d+)\s+min/i);
            
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            
            totalHoursSpent += hours + (minutes / 60);
          }
        });
        
        console.log(`Project ${subscription.project_id} used ${totalHoursSpent} hours in ${prevMonthFormat}`);
        
        // Convert hours allotted from interval to hours
        let hoursAllotted = 0;
        if (subscription.allocated_duration) {
          const hoursMatch = String(subscription.allocated_duration).match(/(\d+)\s+hour/i);
          const minutesMatch = String(subscription.allocated_duration).match(/(\d+)\s+min/i);
          
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
          const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
          
          hoursAllotted = hours + (minutes / 60);
        }
        
        // Create or update subscription usage record
        const { error: upsertError } = await supabaseClient
          .from('subscription_usage')
          .upsert({
            project_id: subscription.project_id,
            subscription_id: subscription.id,
            month_year: prevMonthFormat,
            allocated_duration: `${hoursAllotted} hours`,
            used_duration: `${totalHoursSpent} hours`, // Using used_duration instead of hours_spent
            status: 'completed',
            notes: `Automatically calculated on ${currentDate.toISOString()}`,
            updated_at: new Date().toISOString()
          });
        
        if (upsertError) {
          console.error(`Error updating usage for project ${subscription.project_id}:`, upsertError);
        } else {
          console.log(`Usage record created/updated for project ${subscription.project_id}`);
        }
        
      } catch (projError) {
        console.error(`Error processing project ${subscription.project_id}:`, projError);
        // Continue with other subscriptions
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monthly subscription usage calculation completed',
        monthProcessed: prevMonthFormat,
        subscriptionsProcessed: subscriptions?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in calculate-monthly-usage function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
