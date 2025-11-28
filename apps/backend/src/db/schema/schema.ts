import { pgTable, uuid, varchar, timestamp, pgEnum, text, boolean, index, customType } from 'drizzle-orm/pg-core';
import { sql, type SQL } from 'drizzle-orm';

// Custom tsvector type for full-text search
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

// ============================================================================
// USERS TABLE
// ============================================================================

// User role enum: admin or user
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // bcrypt hashed
  fullName: varchar('full_name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }), // For UC-04: Edit profile
  role: userRoleEnum('role').notNull().default('user'),

  // Full-text search vector (automatically updated via generated column)
  searchVector: tsvector('search_vector')
    .generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, '') || ' ' || coalesce(display_name, ''))`
    ),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Index for full-text search
  searchIdx: index('users_search_idx').using('gin', table.searchVector),
}));

// ============================================================================
// POSTS TABLE
// ============================================================================

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Soft delete fields (UC-09, UC-17)
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id), // Track who deleted it

  // Edit tracking (UC-08, UC-18)
  isEdited: boolean('is_edited').notNull().default(false),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  editedBy: uuid('edited_by').references(() => users.id), // Track who edited it (for admin edits)

  // Full-text search vector (automatically updated via generated column)
  searchVector: tsvector('search_vector')
    .generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', coalesce(content, ''))`
    ),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance (UC-06: timeline sorting, UC-10: search)
  authorIdIdx: index('posts_author_id_idx').on(table.authorId),
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt),
  isDeletedIdx: index('posts_is_deleted_idx').on(table.isDeleted),

  // GIN index for full-text search (replaces the simple content index)
  searchIdx: index('posts_search_idx').using('gin', table.searchVector),
}));

// ============================================================================
// COMMENTS TABLE
// ============================================================================

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),

  // Relationships
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Threaded replies (UC-14: Reply to a comment)
  // If parentCommentId is null, it's a top-level comment
  // If parentCommentId is set, it's a reply to another comment
  parentCommentId: uuid('parent_comment_id').references((): any => comments.id, { onDelete: 'cascade' }),

  // Soft delete fields (UC-16, UC-19)
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id), // Track who deleted it

  // Edit tracking (UC-15, UC-20)
  isEdited: boolean('is_edited').notNull().default(false),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  editedBy: uuid('edited_by').references(() => users.id), // Track who edited it (for admin edits)

  // Full-text search vector (automatically updated via generated column)
  searchVector: tsvector('search_vector')
    .generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', coalesce(content, ''))`
    ),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance (UC-12: View comments, prevent N+1 queries)
  postIdIdx: index('comments_post_id_idx').on(table.postId),
  authorIdIdx: index('comments_author_id_idx').on(table.authorId),
  parentCommentIdIdx: index('comments_parent_comment_id_idx').on(table.parentCommentId),
  createdAtIdx: index('comments_created_at_idx').on(table.createdAt),
  isDeletedIdx: index('comments_is_deleted_idx').on(table.isDeleted),

  // GIN index for full-text search
  searchIdx: index('comments_search_idx').using('gin', table.searchVector),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
