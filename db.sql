CREATE TABLE IF NOT EXISTS public.task_monitor
(
    id SERIAL BIGINT NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    total_runtime interval,
    files_added jsonb,
    files_deleted jsonb,
    magic_string_occurrences integer,
    status character varying(20),
    CONSTRAINT task_monitor_pkey PRIMARY KEY (id)
);
