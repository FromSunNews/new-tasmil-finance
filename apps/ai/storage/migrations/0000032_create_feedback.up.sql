DO $$
BEGIN
    CREATE TYPE feedback_rating AS ENUM ('thumbs_up', 'thumbs_down');
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

CREATE TABLE IF NOT EXISTS feedback (
	run_id uuid NOT NULL,
	thread_id uuid NOT NULL,
	human_message text NOT NULL,
    ai_message text NOT NULL,
    rating feedback_rating NOT NULL,
    feedback_text TEXT,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	metadata jsonb,
	CONSTRAINT feedback_pkey PRIMARY KEY (run_id),
	CONSTRAINT feedback_run_id_fkey FOREIGN KEY (run_id) REFERENCES run(run_id) ON DELETE CASCADE,
	CONSTRAINT feedback_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES thread(thread_id) ON DELETE CASCADE
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS feedback_rating_idx ON feedback USING btree (rating);
