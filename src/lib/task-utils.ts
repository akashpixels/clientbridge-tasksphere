
import { supabase } from "@/integrations/supabase/client";

// Function to mark a specific task as done
export const markTaskAsDone = async (taskCode: string, projectId: string) => {
  try {
    // First, query to get the task by task_code
    const { data: tasks, error: queryError } = await supabase
      .from('tasks')
      .select('id, current_status_id')
      .eq('task_code', taskCode)
      .eq('project_id', projectId)
      .limit(1);
      
    if (queryError) {
      throw queryError;
    }
    
    if (!tasks || tasks.length === 0) {
      throw new Error(`Task ${taskCode} not found in this project`);
    }
    
    const taskId = tasks[0].id;
    
    // Skip update if task is already done
    if (tasks[0].current_status_id === 8) {
      console.log(`Task ${taskCode} is already marked as done`);
      return { success: true, message: 'Task is already marked as done' };
    }
    
    // Update task status to "Done" (status_id = 8)
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ current_status_id: 8 })
      .eq('id', taskId);
      
    if (updateError) {
      throw updateError;
    }
    
    return { success: true, message: `Task ${taskCode} marked as done successfully` };
  } catch (error) {
    console.error('Error marking task as done:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Function to find task by code in a project
export const findTaskByCode = async (taskCode: string, projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id, 
        task_code, 
        details,
        current_status_id,
        status:task_statuses!tasks_current_status_id_fkey(name, color_hex)
      `)
      .eq('task_code', taskCode)
      .eq('project_id', projectId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return { success: true, task: data };
  } catch (error) {
    console.error('Error finding task:', error);
    return { 
      success: false, 
      task: null,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
