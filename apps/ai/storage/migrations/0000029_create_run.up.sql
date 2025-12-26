CREATE TABLE IF NOT EXISTS run (
	run_id uuid DEFAULT gen_random_uuid() NOT NULL,
	thread_id uuid NOT NULL,
	assistant_id uuid NOT NULL,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	kwargs jsonb NOT NULL,
	multitask_strategy text DEFAULT 'reject'::text NOT NULL,
	CONSTRAINT run_pkey PRIMARY KEY (run_id),
	CONSTRAINT run_assistant_id_fkey FOREIGN KEY (assistant_id) REFERENCES assistant(assistant_id) ON DELETE CASCADE,
	CONSTRAINT run_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES thread(thread_id) ON DELETE CASCADE
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS run_assistant_id_idx ON run USING btree (assistant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS run_metadata_idx ON run USING gin (metadata jsonb_path_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS run_pending_idx ON run USING btree (created_at) WHERE (status = 'pending'::text);
CREATE INDEX CONCURRENTLY IF NOT EXISTS run_thread_id_status_idx ON run USING btree (thread_id, status);
