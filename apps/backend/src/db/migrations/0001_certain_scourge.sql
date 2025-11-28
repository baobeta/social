ALTER TABLE "users" ADD COLUMN "initials" varchar(10) DEFAULT '' NOT NULL;--> statement-breakpoint

-- Backfill initials for existing users
-- Generate initials from full_name: First letter of first word + First letter of last word
UPDATE "users"
SET "initials" = CASE
  -- Single word name: take first character
  WHEN TRIM(full_name) !~ '\s' THEN UPPER(LEFT(TRIM(full_name), 1))
  -- Multiple words: first character of first word + first character of last word
  ELSE
    UPPER(LEFT(SPLIT_PART(TRIM(full_name), ' ', 1), 1)) ||
    UPPER(LEFT(SPLIT_PART(TRIM(full_name), ' ', ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(full_name), ' '), 1)), 1))
END
WHERE "initials" = '' OR "initials" IS NULL;
