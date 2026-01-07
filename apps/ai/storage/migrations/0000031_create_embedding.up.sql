CREATE TABLE langchain_pg_collection (
	"uuid" uuid NOT NULL,
	"name" varchar NOT NULL,
	cmetadata json,
	CONSTRAINT langchain_pg_collection_name_key UNIQUE (name),
	CONSTRAINT langchain_pg_collection_pkey PRIMARY KEY (uuid)
);

CREATE TABLE langchain_pg_embedding (
	id varchar NOT NULL,
	collection_id uuid,
	embedding text, -- Changed from 'vector' to 'text' for Azure PostgreSQL compatibility
	"document" varchar,
	cmetadata jsonb,
	CONSTRAINT langchain_pg_embedding_pkey PRIMARY KEY (id),
	CONSTRAINT langchain_pg_embedding_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES langchain_pg_collection("uuid") ON DELETE CASCADE
);

CREATE TABLE langchain_key_value_stores (
	"namespace" varchar NOT NULL,
	"key" varchar NOT NULL,
	value bytea NOT NULL,
	CONSTRAINT langchain_key_value_stores_pkey PRIMARY KEY (namespace, key)
);

-- Modified indexes for Azure PostgreSQL compatibility
-- Removed GIN index on cmetadata as it may require btree_gin extension
CREATE INDEX ix_cmetadata_btree ON langchain_pg_embedding USING btree ((cmetadata->>'key')); -- Example btree index
CREATE INDEX ix_langchain_key_value_stores_key ON langchain_key_value_stores USING btree (key);
CREATE INDEX ix_langchain_key_value_stores_namespace ON langchain_key_value_stores USING btree (namespace);
