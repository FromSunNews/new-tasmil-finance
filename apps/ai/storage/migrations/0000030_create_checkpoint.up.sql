CREATE TABLE checkpoints (
	thread_id uuid NOT NULL,
	checkpoint_id uuid NOT NULL,
	run_id uuid NULL,
	parent_checkpoint_id uuid NULL,
	"checkpoint" jsonb NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	checkpoint_ns text DEFAULT ''::text NOT NULL,
	CONSTRAINT checkpoints_pkey PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id),
	CONSTRAINT checkpoints_run_id_fkey FOREIGN KEY (run_id) REFERENCES run(run_id) ON DELETE CASCADE,
	CONSTRAINT checkpoints_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES thread(thread_id) ON DELETE CASCADE
);

CREATE TABLE checkpoint_writes (
	thread_id uuid NOT NULL,
	checkpoint_id uuid NOT NULL,
	task_id uuid NOT NULL,
	idx int4 NOT NULL,
	channel text NOT NULL,
	"type" text NOT NULL,
	"blob" bytea NOT NULL,
	checkpoint_ns text DEFAULT ''::text NOT NULL,
	CONSTRAINT checkpoint_writes_pkey PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx),
	CONSTRAINT checkpoint_writes_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES thread(thread_id) ON DELETE CASCADE
);

CREATE TABLE checkpoint_blobs (
	thread_id uuid NOT NULL,
	channel text NOT NULL,
	"version" text NOT NULL,
	"type" text NOT NULL,
	"blob" bytea,
	checkpoint_ns text DEFAULT ''::text NOT NULL,
	CONSTRAINT checkpoint_blobs_pkey PRIMARY KEY (thread_id, checkpoint_ns, channel, version),
	CONSTRAINT checkpoint_blobs_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES thread(thread_id) ON DELETE CASCADE
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS checkpoints_checkpoint_id_idx ON checkpoints USING btree (thread_id, checkpoint_id DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS checkpoints_run_id_idx ON checkpoints USING btree (run_id);
