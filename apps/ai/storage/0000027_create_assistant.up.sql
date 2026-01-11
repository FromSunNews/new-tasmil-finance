CREATE TABLE IF NOT EXISTS assistant (
	assistant_id uuid DEFAULT gen_random_uuid() NOT NULL,
	graph_id text NOT NULL,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	config jsonb DEFAULT '{}'::jsonb NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" int4 DEFAULT 1 NOT NULL,
	"name" text,
	CONSTRAINT assistant_pkey PRIMARY KEY (assistant_id)
);

CREATE TABLE IF NOT EXISTS assistant_versions (
	assistant_id uuid NOT NULL,
	"version" int4 DEFAULT 1 NOT NULL,
	graph_id text NOT NULL,
	config jsonb DEFAULT '{}'::jsonb NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT now(),
	CONSTRAINT assistant_versions_pkey PRIMARY KEY (assistant_id, version),
	CONSTRAINT assistant_versions_assistant_id_fkey FOREIGN KEY (assistant_id) REFERENCES assistant(assistant_id) ON DELETE CASCADE
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS assistant_graph_id_idx ON assistant USING btree (graph_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS assistant_metadata_idx ON assistant USING gin (metadata jsonb_path_ops);
