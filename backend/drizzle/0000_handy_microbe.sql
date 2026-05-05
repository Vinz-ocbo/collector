CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"oracle_id" text NOT NULL,
	"game" text NOT NULL,
	"name" text NOT NULL,
	"set_code" text NOT NULL,
	"set_name" text NOT NULL,
	"collector_number" text NOT NULL,
	"rarity" text NOT NULL,
	"language" text NOT NULL,
	"image_small" text NOT NULL,
	"image_normal" text NOT NULL,
	"image_large" text NOT NULL,
	"image_png" text NOT NULL,
	"artist" text,
	"released_at" text NOT NULL,
	"price_eur" text,
	"price_usd" text,
	"prices_updated_at" timestamp with time zone NOT NULL,
	"meta" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" text PRIMARY KEY NOT NULL,
	"game" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"set_type" text NOT NULL,
	"card_count" integer NOT NULL,
	"printed_size" integer,
	"released_at" text,
	"digital" boolean NOT NULL,
	"icon_svg_uri" text NOT NULL,
	"block_code" text,
	"block" text,
	"parent_set_code" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cards_game_name_idx" ON "cards" USING btree ("game","name");--> statement-breakpoint
CREATE INDEX "cards_game_oracle_idx" ON "cards" USING btree ("game","oracle_id");--> statement-breakpoint
CREATE INDEX "cards_game_set_lang_idx" ON "cards" USING btree ("game","set_code","language");--> statement-breakpoint
CREATE INDEX "sets_game_code_idx" ON "sets" USING btree ("game","code");