CREATE TABLE IF NOT EXISTS thread (
	thread_id uuid DEFAULT gen_random_uuid() NOT NULL,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	status text DEFAULT 'idle'::text NOT NULL,
	config jsonb DEFAULT '{}'::jsonb NOT NULL,
	"values" jsonb,
	interrupts jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT thread_pkey PRIMARY KEY (thread_id)
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS thread_metadata_idx ON thread USING gin (metadata jsonb_path_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thread_status_idx ON thread USING btree (status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thread_values_idx ON thread USING gin ("values" jsonb_path_ops);
