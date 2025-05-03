
CREATE OR REPLACE FUNCTION public.compute_eta_after_ins_for_update(task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    base_time    timestamptz;
    gap_time     interval;
    delta        interval;
    start_delay  interval;
    actual_queue_pos integer;
    task_data    record;
    active_status_ids INTEGER[];
BEGIN
    -- Get active status IDs (excluding In Queue status)
    SELECT ARRAY_AGG(id) INTO active_status_ids
    FROM task_statuses
    WHERE type = 'active' AND name != 'In Queue';
    
    -- Default to common active status IDs if not found
    active_status_ids := COALESCE(active_status_ids, ARRAY[3, 4, 5, 6, 7]);
    
    -- Get task data
    SELECT * INTO task_data
    FROM tasks
    WHERE id = task_id;
    
    IF task_data IS NULL THEN
        RAISE NOTICE 'Task % not found', task_id;
        RETURN;
    END IF;
    
    -- Add a delay to ensure queue position updates are committed
    PERFORM pg_sleep(0.1);
    
    -- Fetch the nominal start_delay for this priority
    SELECT COALESCE(priority_levels.start_delay, interval '0')
      INTO start_delay
      FROM priority_levels
     WHERE priority_levels.id = task_data.priority_level_id;

    -- Get the latest queue position directly from the database
    SELECT queue_position INTO actual_queue_pos
    FROM tasks 
    WHERE id = task_id;
    
    -- Log the values for debugging
    RAISE NOTICE 'Task ID: %, queue_position: %', 
                 task_id, actual_queue_pos;

    -- Anchor inside agency working hours (queue aware!)
    base_time := calculate_base_time(
                   task_data.project_id,
                   actual_queue_pos
                 );
    
    -- Log the calculated base time
    RAISE NOTICE 'Calculated base_time: %', base_time;

    -- Credit already-elapsed working hours
    gap_time := calculate_gap_time(task_data.created_at, base_time);
    
    -- Log the calculated gap time
    RAISE NOTICE 'Calculated gap_time: %', gap_time;

    -- Effective delay (≥ 30 min)
    delta := calculate_delta(start_delay, gap_time);
    
    -- Log the calculated delta
    RAISE NOTICE 'Calculated delta: %', delta;

    -- Final ETA update - conditional update based on task status
    -- Only update est_start for non-active tasks (i.e., queued tasks)
    IF task_data.current_status_id = ANY(active_status_ids) THEN
        -- For active tasks, only update est_end
        UPDATE tasks
        SET est_end = calculate_working_timestamp(
                        est_start,
                        task_data.est_duration + COALESCE(task_data.total_blocked_duration, interval '0')
                      )
        WHERE id = task_id;
        
        RAISE NOTICE 'Updated ONLY est_end for active task %', task_id;
    ELSE
        -- For queued tasks, update both est_start and est_end
        UPDATE tasks
        SET 
            est_start = calculate_working_timestamp(base_time, delta),
            est_end = calculate_working_timestamp(
                        calculate_working_timestamp(base_time, delta),
                        task_data.est_duration + COALESCE(task_data.total_blocked_duration, interval '0')
                      )
        WHERE id = task_id;
        
        RAISE NOTICE 'Updated est_start and est_end for queued task %', task_id;
    END IF;
END;
$function$;

