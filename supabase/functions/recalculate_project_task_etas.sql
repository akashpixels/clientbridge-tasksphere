
-- SQL function to recalculate ETAs for all tasks in a project, respecting dependencies
CREATE OR REPLACE FUNCTION public.recalculate_project_task_etas(project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    in_queue_status_id INTEGER;
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
    
    -- Get active status IDs (excluding In Queue)
    SELECT ARRAY_AGG(id) INTO active_status_ids
    FROM task_statuses
    WHERE type = 'active' AND id != in_queue_status_id;
    
    -- Default active status IDs if not found
    active_status_ids := COALESCE(active_status_ids, ARRAY[3, 4, 5, 6, 7]);
    
    RAISE NOTICE 'Starting recalculation of ETAs for project %', project_id_param;
    
    -- First, recalculate est_end for active tasks (preserving est_start)
    FOR task_record IN 
        SELECT * FROM tasks 
        WHERE project_id = project_id_param
        AND current_status_id = ANY(active_status_ids)
        AND est_start IS NOT NULL
        AND est_duration IS NOT NULL
        AND completed_at IS NULL
        ORDER BY est_start
    LOOP
        UPDATE tasks
        SET est_end = calculate_working_timestamp(
                        task_record.est_start,
                        task_record.est_duration + COALESCE(task_record.total_blocked_duration, interval '0')
                      )
        WHERE id = task_record.id;
        
        RAISE NOTICE 'Updated est_end for active task %', task_record.id;
    END LOOP;
    
    -- Second, recalculate both est_start and est_end for queued tasks
    FOR task_record IN 
        SELECT * FROM tasks 
        WHERE project_id = project_id_param
        AND current_status_id = in_queue_status_id 
        ORDER BY queue_position 
    LOOP
        -- For queued tasks, update both est_start and est_end
        PERFORM compute_eta_after_ins_for_update(task_record.id);
        RAISE NOTICE 'Recalculated ETAs for queued task % with queue position %', 
                    task_record.id, task_record.queue_position;
    END LOOP;
    
    RAISE NOTICE 'Completed recalculation of all ETAs for project %', project_id_param;
END;
$function$;

