
-- Update manage_task_etas() function to use calculate_base_time() everywhere instead of NOW()
CREATE OR REPLACE FUNCTION public.manage_task_etas()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    in_queue_status_id INTEGER;
    active_status_ids INTEGER[];
    is_active_task BOOLEAN;
    debug_info TEXT;
    proper_start_time TIMESTAMPTZ;
BEGIN
    -- Get the ID for the "In Queue" status
    SELECT id INTO in_queue_status_id 
    FROM task_statuses 
    WHERE name = 'Queue' 
    LIMIT 1;
    
    -- Default to 2 if the status is not found
    in_queue_status_id := COALESCE(in_queue_status_id, 2);
    
    -- Get active status IDs (excluding In Queue)
    SELECT ARRAY_AGG(id) INTO active_status_ids
    FROM task_statuses
    WHERE type = 'active';
    
    -- Default active status IDs if not found
    active_status_ids := COALESCE(active_status_ids, ARRAY[3, 6, 7, 8, 9]);
    
    debug_info := format('Operation: %s, Task ID: %s, Status: %s, Active statuses: %s', 
                        TG_OP, COALESCE(NEW.id::text, 'NULL'), NEW.current_status_id, active_status_ids);
    RAISE LOG 'ETA DEBUG: %', debug_info;
    
    -- Check if the task is an active task
    is_active_task := NEW.current_status_id = ANY(active_status_ids);
    
    IF TG_OP = 'INSERT' THEN
        RAISE LOG 'ETA DEBUG: Processing INSERT for task %', NEW.id;
        
        -- For new active tasks, set ETAs
        IF is_active_task THEN
            -- Use calculate_base_time instead of NOW()
            proper_start_time := calculate_base_time(NEW.project_id, 0);
            NEW.est_start := proper_start_time;
            
            -- Calculate est_end based on est_duration
            IF NEW.est_duration IS NOT NULL THEN
                NEW.est_end := calculate_working_timestamp(
                    NEW.est_start,
                    NEW.est_duration + COALESCE(NEW.total_blocked_duration, interval '0')
                );
                
                RAISE LOG 'ETA DEBUG: Set ETAs for new active task %: start=%, end=%', 
                    NEW.id, NEW.est_start, NEW.est_end;
            ELSE
                -- If est_duration is NULL, get default duration from task type
                DECLARE
                    default_task_duration INTERVAL;
                    complexity_multiplier NUMERIC;
                    estimated_duration INTERVAL;
                BEGIN
                    -- Get default duration for task type
                    SELECT default_duration INTO default_task_duration
                    FROM task_types
                    WHERE id = NEW.task_type_id;
                    
                    -- Get complexity multiplier
                    SELECT multiplier INTO complexity_multiplier
                    FROM complexity_levels
                    WHERE id = COALESCE(NEW.complexity_level_id, 3);
                    
                    -- Use default values if not found
                    complexity_multiplier := COALESCE(complexity_multiplier, 1);
                    default_task_duration := COALESCE(default_task_duration, interval '2 hours');
                    
                    -- Calculate estimated duration
                    estimated_duration := complexity_multiplier * default_task_duration;
                    
                    -- Calculate est_end
                    NEW.est_end := calculate_working_timestamp(
                        NEW.est_start,
                        estimated_duration + COALESCE(NEW.total_blocked_duration, interval '0')
                    );
                    
                    RAISE LOG 'ETA DEBUG: Set ETAs for new active task % using estimated duration %: start=%, end=%', 
                        NEW.id, estimated_duration, NEW.est_start, NEW.est_end;
                END;
            END IF;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        RAISE LOG 'ETA DEBUG: Processing UPDATE for task %', NEW.id;
        
        -- Handle status change to active
        IF is_active_task AND NOT (OLD.current_status_id = ANY(active_status_ids)) AND NEW.est_start IS NULL THEN
            -- Use calculate_base_time instead of NOW() for respecting working hours
            proper_start_time := calculate_base_time(NEW.project_id, 0);
            NEW.est_start := proper_start_time;
            
            -- Calculate est_end based on est_duration
            IF NEW.est_duration IS NOT NULL THEN
                NEW.est_end := calculate_working_timestamp(
                    NEW.est_start,
                    NEW.est_duration + COALESCE(NEW.total_blocked_duration, interval '0')
                );
                
                RAISE LOG 'ETA DEBUG: Updated ETAs for task % changing to active status: start=%, end=%', 
                    NEW.id, NEW.est_start, NEW.est_end;
            ELSE
                -- If est_duration is NULL, get default duration
                DECLARE
                    default_task_duration INTERVAL;
                    complexity_multiplier NUMERIC;
                    estimated_duration INTERVAL;
                BEGIN
                    -- Get default duration for task type
                    SELECT default_duration INTO default_task_duration
                    FROM task_types
                    WHERE id = NEW.task_type_id;
                    
                    -- Get complexity multiplier
                    SELECT multiplier INTO complexity_multiplier
                    FROM complexity_levels
                    WHERE id = COALESCE(NEW.complexity_level_id, 3);
                    
                    -- Use default values if not found
                    complexity_multiplier := COALESCE(complexity_multiplier, 1);
                    default_task_duration := COALESCE(default_task_duration, interval '2 hours');
                    
                    -- Calculate estimated duration
                    estimated_duration := complexity_multiplier * default_task_duration;
                    
                    -- Calculate est_end
                    NEW.est_end := calculate_working_timestamp(
                        NEW.est_start,
                        estimated_duration + COALESCE(NEW.total_blocked_duration, interval '0')
                    );
                    
                    RAISE LOG 'ETA DEBUG: Updated ETAs for task % changing to active status using estimated duration %: start=%, end=%', 
                        NEW.id, estimated_duration, NEW.est_start, NEW.est_end;
                END;
            END IF;
        -- Handle active tasks with missing ETAs (could be due to previous bugs)
        ELSIF is_active_task AND NEW.est_start IS NULL THEN
            -- Use calculate_base_time instead of NOW() for respecting working hours
            proper_start_time := calculate_base_time(NEW.project_id, 0);
            NEW.est_start := proper_start_time;
            
            -- Calculate est_end based on est_duration
            IF NEW.est_duration IS NOT NULL THEN
                NEW.est_end := calculate_working_timestamp(
                    NEW.est_start,
                    NEW.est_duration + COALESCE(NEW.total_blocked_duration, interval '0')
                );
                
                RAISE LOG 'ETA DEBUG: Fixed missing ETAs for active task %: start=%, end=%', 
                    NEW.id, NEW.est_start, NEW.est_end;
            ELSE
                -- Calculate estimated duration if est_duration is NULL
                DECLARE
                    default_task_duration INTERVAL;
                    complexity_multiplier NUMERIC;
                    estimated_duration INTERVAL;
                BEGIN
                    SELECT default_duration, multiplier INTO default_task_duration, complexity_multiplier
                    FROM task_types t
                    JOIN complexity_levels c ON c.id = COALESCE(NEW.complexity_level_id, 3)
                    WHERE t.id = NEW.task_type_id;
                    
                    -- Use default values if not found
                    complexity_multiplier := COALESCE(complexity_multiplier, 1);
                    default_task_duration := COALESCE(default_task_duration, interval '2 hours');
                    
                    -- Calculate estimated duration
                    estimated_duration := complexity_multiplier * default_task_duration;
                    
                    -- Calculate est_end
                    NEW.est_end := calculate_working_timestamp(
                        NEW.est_start,
                        estimated_duration + COALESCE(NEW.total_blocked_duration, interval '0')
                    );
                    
                    RAISE LOG 'ETA DEBUG: Fixed missing ETAs for active task % using estimated duration %: start=%, end=%', 
                        NEW.id, estimated_duration, NEW.est_start, NEW.est_end;
                END;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix any existing tasks with missing ETAs using the updated approach
DO $$
DECLARE
    active_status_ids INTEGER[];
    task_record RECORD;
    updated_count INTEGER := 0;
    proper_start_time TIMESTAMPTZ;
BEGIN
    -- Get active status IDs
    SELECT ARRAY_AGG(id) INTO active_status_ids
    FROM task_statuses
    WHERE type = 'active';
    
    -- Default active status IDs if not found
    active_status_ids := COALESCE(active_status_ids, ARRAY[3, 6, 7, 8, 9]);
    
    -- Find active tasks with missing ETAs
    FOR task_record IN 
        SELECT * FROM tasks 
        WHERE current_status_id = ANY(active_status_ids)
        AND (est_start IS NULL OR est_end IS NULL)
    LOOP
        -- Update the task with ETAs using calculate_base_time
        proper_start_time := calculate_base_time(task_record.project_id, 0);
        
        UPDATE tasks
        SET 
          est_start = proper_start_time,
            est_end = calculate_working_timestamp(
                proper_start_time,
                COALESCE(est_duration, interval '2 hours') + 
                COALESCE(total_blocked_duration, interval '0')
            )
        WHERE id = task_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Fixed ETAs for % existing active tasks', updated_count;
END;
$$;
