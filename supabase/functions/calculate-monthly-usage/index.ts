
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// Define CORS headers
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
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request parameters
    const { month_year, project_id } = await req.json();
    
    // Validate request
    if (!month_year) {
      console.error("Missing required parameter: month_year");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: month_year" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse month_year
    const [year, month] = month_year.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JS
    const endDate = new Date(year, month, 0); // Get last day of the month
    
    console.log(`Calculating usage for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Execute database query
    let query = supabase
      .from("projects")
      .select(`
        id,
        name,
        project_subscriptions(id, hours_allotted, subscription_status)
      `);
    
    // Filter by project_id if provided
    if (project_id) {
      query = query.eq("id", project_id);
      console.log(`Processing single project: ${project_id}`);
    } else {
      console.log("Processing all active projects");
    }

    const { data: projects, error: projectsError } = await query;
    
    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch projects", details: projectsError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`Found ${projects.length} projects to process`);
    
    // Process each project
    const results = [];
    for (const project of projects) {
      // Skip projects without active subscriptions
      if (!project.project_subscriptions || project.project_subscriptions.length === 0) {
        console.log(`Project ${project.id} has no subscriptions, skipping`);
        results.push({
          project_id: project.id,
          status: "skipped",
          reason: "No active subscription"
        });
        continue;
      }

      const subscription = project.project_subscriptions[0];
      
      // Calculate hours spent for the month
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("actual_hours_spent")
        .eq("project_id", project.id)
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());
      
      if (tasksError) {
        console.error(`Error fetching tasks for project ${project.id}:`, tasksError);
        results.push({
          project_id: project.id,
          status: "error",
          message: "Failed to fetch tasks"
        });
        continue;
      }
      
      // Calculate total hours
      const hours_spent = tasks.reduce((sum, task) => sum + (task.actual_hours_spent || 0), 0);
      
      // Store in subscription_usage table
      const { data: usageData, error: usageError } = await supabase
        .from("subscription_usage")
        .upsert({
          project_id: project.id,
          subscription_id: subscription.id,
          month_year: month_year,
          hours_allotted: subscription.hours_allotted,
          hours_spent: hours_spent,
          status: "manually_calculated",
          notes: `Manually calculated via admin function on ${new Date().toISOString()}`,
          updated_at: new Date().toISOString()
        }, { onConflict: "project_id,month_year" })
        .select()
        .single();
      
      if (usageError) {
        console.error(`Error storing subscription usage for project ${project.id}:`, usageError);
        results.push({
          project_id: project.id,
          status: "error",
          message: "Failed to store usage data"
        });
        continue;
      }
      
      console.log(`Successfully processed project ${project.id}: ${hours_spent}/${subscription.hours_allotted} hours`);
      results.push({
        project_id: project.id,
        status: "success",
        usage: usageData
      });
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
