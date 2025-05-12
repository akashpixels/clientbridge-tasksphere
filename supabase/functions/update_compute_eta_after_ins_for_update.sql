
CREATE OR REPLACE FUNCTION public.compute_eta_after_ins_for_update(task_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    task_record RECORD;
    base_time    timestamptz;
    gap_time     interval;
    delta        interval;
    start_delay  interval;
    actual_queue_pos integer;
BEGIN
    -- Get task data first
    SELECT * INTO task_record
    FROM tasks
    WHERE id = task_id;
    
    IF task_record IS NULL THEN
        RAISE EXCEPTION 'Task with ID % not found', task_id;
        RETURN;
    END IF;
    
    -- Fetch the nominal start_delay for this priority
    SELECT COALESCE(priority_levels.start_delay, interval '0')
      INTO start_delay
      FROM priority_levels
     WHERE priority_levels.id = task_record.priority_level_id;

    -- Use the task's queue position directly - now that all tasks have queue positions
    actual_queue_pos := task_record.queue_position;
    
    -- Log the values for debugging
    RAISE NOTICE 'Task ID: %, actual_queue_pos: %', 
                 task_id, actual_queue_pos;

    -- Anchor inside agency working hours (queue aware!)
    base_time := calculate_base_time(
                   task_record.project_id,
                   COALESCE(actual_queue_pos, 0)
                 );
    
    -- Log the calculated base time
    RAISE NOTICE 'Calculated base_time: %', base_time;

    -- Credit already-elapsed working hours
    gap_time := calculate_gap_time(task_record.created_at, base_time);
    
    -- Log the calculated gap time
    RAISE NOTICE 'Calculated gap_time: %', gap_time;

    -- Effective delay (≥ 30 min)
    delta := calculate_delta(start_delay, gap_time);
    
    -- Log the calculated delta
    RAISE NOTICE 'Calculated delta: %', delta;

    -- Final ETA
    UPDATE tasks
    SET 
        est_start = calculate_working_timestamp(base_time, delta),
        est_end = calculate_working_timestamp(
                    calculate_working_timestamp(base_time, delta),
                    task_record.est_duration + COALESCE(task_record.total_blocked_duration, interval '0')
                  )
    WHERE id = task_id;
    
    -- Log final calculated values
    RAISE NOTICE 'Updated est_start and est_end for task %', task_id;
END;
$function$;
