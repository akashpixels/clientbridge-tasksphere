
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0'
import { Database } from '../_shared/database.types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonthlyUsage {
  allocated_duration: number;
  used_duration: number;
}

interface RequestParams {
  projectId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  // Create Supabase client with Deno built-in fetch
  const supabaseClient = createClient<Database>(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { 
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
      auth: { persistSession: false }
    }
  )

  // Extract parameters
  let params: RequestParams;
  try {
    params = await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`Calculating monthly usage for project: ${params.projectId}`);

    // Get current active subscription for the project
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('project_subscriptions')
      .select('*')
      .eq('project_id', params.projectId)
      .eq('subscription_status', 'active')
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error('Error fetching subscription:', subscriptionError);
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the current billing period
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Get or create subscription usage record
    let { data: usageData, error: usageError } = await supabaseClient
      .from('subscription_usage')
      .select('*')
      .eq('project_id', params.projectId)
      .eq('subscription_id', subscriptionData.id)
      .eq('billing_period', currentMonth)
      .single();

    if (usageError && usageError.code === 'PGRST116') {
      // Record doesn't exist, create it
      console.log('Creating new usage record for billing period:', currentMonth);
      const { data: newUsageData, error: createError } = await supabaseClient
        .from('subscription_usage')
        .insert({
          project_id: params.projectId,
          subscription_id: subscriptionData.id,
          billing_period: currentMonth,
          status: 'active',
          allocated_duration: subscriptionData.allocated_duration,
          used_duration: '00:00:00', // Start with zero
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating usage record:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create usage record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      usageData = newUsageData;
    } else if (usageError) {
      console.error('Error fetching usage data:', usageError);
      return new Response(JSON.stringify({ error: 'Failed to fetch usage data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate total logged duration for the current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: tasksData, error: tasksError } = await supabaseClient.rpc(
      'calculate_monthly_usage',
      { 
        p_project_id: params.projectId,
        p_start_date: startOfMonth.toISOString(),
        p_end_date: now.toISOString()
      }
    );

    if (tasksError) {
      console.error('Error calculating task duration:', tasksError);
      return new Response(JSON.stringify({ error: 'Failed to calculate task durations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If we have data from the RPC function, use it
    if (tasksData && tasksData.length > 0) {
      const totalUsedDurationSeconds = tasksData[0].total_logged_duration || 0;
      const usedDurationInterval = `${Math.floor(totalUsedDurationSeconds / 3600)}:${Math.floor((totalUsedDurationSeconds % 3600) / 60)}:${totalUsedDurationSeconds % 60}`;
      
      // Update the usage record with the calculated used_duration
      const { error: updateError } = await supabaseClient
        .from('subscription_usage')
        .update({
          used_duration: usedDurationInterval
        })
        .eq('id', usageData.id);
      
      if (updateError) {
        console.error('Error updating usage record:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update usage record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Return the formatted monthly usage
      return new Response(JSON.stringify({
        allocated_duration: subscriptionData.allocated_duration,
        used_duration: usedDurationInterval
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Return current values from subscription usage if RPC didn't return data
      return new Response(JSON.stringify({
        allocated_duration: usageData.allocated_duration,
        used_duration: usageData.used_duration
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
