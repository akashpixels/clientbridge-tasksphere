
CREATE OR REPLACE FUNCTION public.handle_task_queue_management()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    in_queue_status_id INTEGER;
    completed_status_ids INTEGER[];
    project_id_var UUID;
    active_status_ids INTEGER[];
    task_record RECORD;
BEGIN
    -- Get the ID for the "In Queue" status
    SELECT id INTO in_queue_status_id 
    FROM task_statuses 
    WHERE name = 'In Queue' 
    LIMIT 1;
    
    -- Default to 2 if the status is not found
    in_queue_status_id := COALESCE(in_queue_status_id, 2);
    
    -- Get IDs of completed statuses (Completed, Approved, etc.)
    SELECT ARRAY_AGG(id) INTO completed_status_ids
    FROM task_statuses
    WHERE type = 'completed';
    
    -- Get active status IDs (excluding In Queue)
    SELECT ARRAY_AGG(id) INTO active_status_ids
    FROM task_statuses
    WHERE type = 'active' AND id != in_queue_status_id;
    
    -- Default completed status IDs if not found
    completed_status_ids := COALESCE(completed_status_ids, ARRAY[8, 9, 10]);
    active_status_ids := COALESCE(active_status_ids, ARRAY[3, 4, 5, 6, 7]);
    
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- If a new task is added with "In Queue" status, update queue positions
        IF NEW.current_status_id = in_queue_status_id THEN
            PERFORM assign_task_queue_positions();
        END IF;
        RETURN NEW;
    END IF;
    
    -- For UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- If status changed from "In Queue" to any other status, clear queue position
        IF OLD.current_status_id = in_queue_status_id AND NEW.current_status_id != in_queue_status_id THEN
            NEW.queue_position := NULL;
            RAISE NOTICE 'Cleared queue position for task % as status changed from In Queue to %', 
                NEW.id, NEW.current_status_id;
        END IF;
        
        -- If priority changed or complexity changed or est_duration changed or status changed to "In Queue", update queue positions
        IF (OLD.priority_level_id != NEW.priority_level_id) OR 
           (OLD.complexity_level_id != NEW.complexity_level_id) OR
           (OLD.est_duration IS DISTINCT FROM NEW.est_duration) OR
           (OLD.current_status_id != in_queue_status_id AND NEW.current_status_id = in_queue_status_id) THEN
            
            -- Update queue positions first
            PERFORM assign_task_queue_positions();
            
            -- Add a delay to ensure queue positions are updated before recalculating ETAs
            PERFORM pg_sleep(0.5);
            
            -- For any changes that affect task timing, recalculate all ETAs for the project
            -- This ensures that changes to one task properly propagate to all dependent tasks
            PERFORM recalculate_project_task_etas(NEW.project_id);
            
            RAISE NOTICE 'Recalculated ETAs for all tasks in project % due to changes to task %', 
                NEW.project_id, NEW.id;
        END IF;
        
        -- If a task changed from active to completed status, try to activate a new task
        IF OLD.current_status_id != ANY(completed_status_ids) AND 
           NEW.current_status_id = ANY(completed_status_ids) THEN
            project_id_var := NEW.project_id;
            
            RAISE NOTICE 'Task % completed. Checking for next task to activate for project %', 
                NEW.id, project_id_var;
                
            PERFORM activate_next_queued_task(project_id_var);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$function$;
