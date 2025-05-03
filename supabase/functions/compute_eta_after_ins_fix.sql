
-- SQL to modify the compute_eta_after_ins function to query for the latest queue position
CREATE OR REPLACE FUNCTION public.compute_eta_after_ins()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    base_time    timestamptz;
    gap_time     interval;
    delta        interval;
    start_delay  interval;
    actual_queue_pos integer;  -- Added new variable for fetching queue position
BEGIN
    -- Fetch the nominal start_delay for this priority
    SELECT COALESCE(priority_levels.start_delay, interval '0')
      INTO start_delay
      FROM priority_levels
     WHERE priority_levels.id = NEW.priority_level_id;

    -- Explicitly query for the current queue position instead of using NEW.queue_position
    SELECT queue_position INTO actual_queue_pos
    FROM tasks 
    WHERE id = NEW.id;
    
    -- Log the values for debugging
    RAISE NOTICE 'Task ID: %, NEW.queue_position: %, actual_queue_pos: %', 
                 NEW.id, NEW.queue_position, actual_queue_pos;

    -- Anchor inside agency working hours (queue aware!)
    base_time := calculate_base_time(
                   NEW.project_id,
                   actual_queue_pos  -- Use the fetched queue position
                 );
    
    -- Log the calculated base time
    RAISE NOTICE 'Calculated base_time: %', base_time;

    -- Credit already-elapsed working hours
    gap_time := calculate_gap_time(NEW.created_at, base_time);
    
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
                    NEW.est_duration + COALESCE(NEW.total_blocked_duration, interval '0')
                  )
    WHERE id = NEW.id;
    
    -- Log final calculated values
    RAISE NOTICE 'Updated est_start and est_end for task %', NEW.id;

    RETURN NEW;
END;
$function$;
