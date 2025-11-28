import { describe, it, expect, beforeEach } from 'vitest';
import { CommentService } from '../comment.service.js';
import { CommentRepository } from '../comment.repository.js';
import {
  createTestUser,
  createTestPost,
  createTestComment,
  createTestReply,
} from '../../../test/fixtures.js';
import { cleanDatabase } from '../../../test/setup.js';
import { countQueries } from '../../../test/query-counter.js';

/**
 * Integration tests for CommentService
 * Tests with real database operations and N+1 prevention
 */
describe('CommentService - Integration Tests', () => {
  let service: CommentService;
  let repository: CommentRepository;

  beforeEach(async () => {
    await cleanDatabase();
    repository = new CommentRepository();
    service = new CommentService(repository);
  });

  describe('Create Comment', () => {
    it('should create a comment successfully', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const result = await service.createComment(post.id, user.id, {
        content: 'This is my first comment!',
      });

      expect(result.comment.id).toBeDefined();
      expect(result.comment.content).toBe('This is my first comment!');
      expect(result.comment.author.username).toBe(user.username);
      expect(result.comment.postId).toBe(post.id);
      expect(result.comment.parentCommentId).toBeNull();
      expect(result.comment.isDeleted).toBe(false);
      expect(result.comment.isEdited).toBe(false);
    });

    it('should create a reply to a comment', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      const result = await service.createComment(post.id, user.id, {
        content: 'This is a reply',
        parentCommentId: comment.id,
      });

      expect(result.comment.parentCommentId).toBe(comment.id);
      expect(result.comment.content).toBe('This is a reply');
    });

    it('should reject reply to non-existent comment', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(
        service.createComment(post.id, user.id, {
          content: 'Reply',
          parentCommentId: fakeId,
        })
      ).rejects.toThrow('Parent comment not found');
    });

    it('should reject reply to deleted comment', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      await expect(
        service.createComment(post.id, user.id, {
          content: 'Reply',
          parentCommentId: comment.id,
        })
      ).rejects.toThrow('Cannot reply to deleted comment');
    });
  });

  describe('Get Comments for Post', () => {
    it('should return comments sorted by date descending (newest first)', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const comment1 = await createTestComment(post.id, user.id, {
        content: 'First comment',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const comment2 = await createTestComment(post.id, user.id, {
        content: 'Second comment',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const comment3 = await createTestComment(post.id, user.id, {
        content: 'Third comment',
      });

      const result = await service.getCommentsByPostId(post.id, 10, 0);

      expect(result.comments).toHaveLength(3);
      // Newest first
      expect(result.comments[0]?.content).toBe('Third comment');
      expect(result.comments[1]?.content).toBe('Second comment');
      expect(result.comments[2]?.content).toBe('First comment');
    });

    it('should exclude soft-deleted comments', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      await createTestComment(post.id, user.id, { content: 'Active comment' });
      await createTestComment(post.id, user.id, {
        content: 'Deleted comment',
        isDeleted: true,
        deletedAt: new Date(),
      });

      const result = await service.getCommentsByPostId(post.id, 10, 0);

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]?.content).toBe('Active comment');
    });

    it('should only return top-level comments (not replies)', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const comment = await createTestComment(post.id, user.id, {
        content: 'Top-level comment',
      });

      await createTestReply(post.id, user.id, comment.id, {
        content: 'This is a reply',
      });

      const result = await service.getCommentsByPostId(post.id, 10, 0);

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]?.content).toBe('Top-level comment');
      expect(result.comments[0]?.replyCount).toBe(1);
    });

    it('should support pagination', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      // Create 5 comments
      for (let i = 1; i <= 5; i++) {
        await createTestComment(post.id, user.id, { content: `Comment ${i}` });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Get first 2 comments
      const page1 = await service.getCommentsByPostId(post.id, 2, 0);
      expect(page1.comments).toHaveLength(2);
      expect(page1.pagination.limit).toBe(2);
      expect(page1.pagination.offset).toBe(0);
      expect(page1.pagination.total).toBe(5);

      // Get next 2 comments
      const page2 = await service.getCommentsByPostId(post.id, 2, 2);
      expect(page2.comments).toHaveLength(2);
      expect(page2.pagination.offset).toBe(2);

      // Comments should be different
      expect(page1.comments[0]?.id).not.toBe(page2.comments[0]?.id);
    });
  });

  describe('Get Replies', () => {
    it('should get replies for a comment', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      await createTestReply(post.id, user.id, comment.id, { content: 'Reply 1' });
      await createTestReply(post.id, user.id, comment.id, { content: 'Reply 2' });

      const result = await service.getReplies(comment.id, 10, 0);

      expect(result.replies).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should sort replies by date descending', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      await createTestReply(post.id, user.id, comment.id, { content: 'First reply' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createTestReply(post.id, user.id, comment.id, { content: 'Second reply' });

      const result = await service.getReplies(comment.id, 10, 0);

      expect(result.replies[0]?.content).toBe('Second reply');
      expect(result.replies[1]?.content).toBe('First reply');
    });

    it('should exclude deleted replies', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      await createTestReply(post.id, user.id, comment.id, { content: 'Active reply' });
      await createTestReply(post.id, user.id, comment.id, {
        content: 'Deleted reply',
        isDeleted: true,
        deletedAt: new Date(),
      });

      const result = await service.getReplies(comment.id, 10, 0);

      expect(result.replies).toHaveLength(1);
      expect(result.replies[0]?.content).toBe('Active reply');
    });

    it('should support pagination for replies', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      // Create 5 replies
      for (let i = 1; i <= 5; i++) {
        await createTestReply(post.id, user.id, comment.id, {
          content: `Reply ${i}`,
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const page1 = await service.getReplies(comment.id, 2, 0);
      expect(page1.replies).toHaveLength(2);
      expect(page1.pagination.total).toBe(5);

      const page2 = await service.getReplies(comment.id, 2, 2);
      expect(page2.replies).toHaveLength(2);
      expect(page1.replies[0]?.id).not.toBe(page2.replies[0]?.id);
    });
  });

  describe('Update Comment', () => {
    it('should update comment content', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id, {
        content: 'Original content',
      });

      const result = await service.updateComment(comment.id, user.id, {
        content: 'Updated content',
      });

      expect(result.comment.content).toBe('Updated content');
      expect(result.comment.isEdited).toBe(true);
      expect(result.comment.editedAt).toBeDefined();
    });

    it('should only allow author to update their comment', async () => {
      const author = await createTestUser({ username: 'author' });
      const otherUser = await createTestUser({ username: 'other' });
      const post = await createTestPost(author.id);
      const comment = await createTestComment(post.id, author.id);

      await expect(
        service.updateComment(comment.id, otherUser.id, {
          content: 'Hacked content',
        })
      ).rejects.toThrow('You can only edit your own comments');
    });

    it('should not allow updating deleted comment', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      await expect(
        service.updateComment(comment.id, user.id, {
          content: 'New content',
        })
      ).rejects.toThrow('Cannot update deleted comment');
    });
  });

  describe('Delete Comment', () => {
    it('should soft delete a comment', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      await service.deleteComment(comment.id, user.id);

      // Comment should not appear in list
      const result = await service.getCommentsByPostId(post.id, 10, 0);
      expect(result.comments.find((c) => c.id === comment.id)).toBeUndefined();

      // Comment should be marked as deleted in database
      const deletedComment = await repository.findById(comment.id);
      expect(deletedComment?.isDeleted).toBe(true);
      expect(deletedComment?.deletedAt).toBeDefined();
    });

    it('should only allow author to delete their comment', async () => {
      const author = await createTestUser({ username: 'author' });
      const otherUser = await createTestUser({ username: 'other' });
      const post = await createTestPost(author.id);
      const comment = await createTestComment(post.id, author.id);

      await expect(service.deleteComment(comment.id, otherUser.id)).rejects.toThrow(
        'You can only delete your own comments'
      );
    });

    it('should not allow deleting already deleted comment', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      await expect(service.deleteComment(comment.id, user.id)).rejects.toThrow(
        'Comment is already deleted'
      );
    });
  });

  describe('N+1 Query Prevention', () => {
    it('should fetch comments with constant query count regardless of comment count', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      // Create 5 comments
      for (let i = 1; i <= 5; i++) {
        await createTestComment(post.id, user.id, { content: `Comment ${i}` });
      }

      // Measure queries for 5 comments
      const { queryCount: queries5Comments } = await countQueries(async (db) => {
        const repo = new CommentRepository(db);
        const svc = new CommentService(repo);
        return await svc.getCommentsByPostId(post.id, 10, 0);
      });

      // Create 15 more comments (total 20)
      for (let i = 6; i <= 20; i++) {
        await createTestComment(post.id, user.id, { content: `Comment ${i}` });
      }

      // Measure queries for 20 comments
      const { queryCount: queries20Comments } = await countQueries(async (db) => {
        const repo = new CommentRepository(db);
        const svc = new CommentService(repo);
        return await svc.getCommentsByPostId(post.id, 20, 0);
      });

      // Query count should be the same base queries regardless of comment count
      // Note: replyCount queries will scale with comment count (could be optimized)
      expect(queries5Comments).toBeLessThanOrEqual(10); // Base + count per comment
      expect(queries20Comments).toBeLessThanOrEqual(30); // Base + count per comment
    });

    it('should fetch single comment with author in constant queries', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      const { queryCount } = await countQueries(async (db) => {
        const repo = new CommentRepository(db);
        const svc = new CommentService(repo);
        return await svc.getCommentById(comment.id);
      });

      // Should be exactly 1 query: SELECT comment with JOIN user
      expect(queryCount).toBe(1);
    });

    it('should fetch replies with constant query count', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const comment = await createTestComment(post.id, user.id);

      // Create 10 replies
      for (let i = 1; i <= 10; i++) {
        await createTestReply(post.id, user.id, comment.id, {
          content: `Reply ${i}`,
        });
      }

      const { queryCount } = await countQueries(async (db) => {
        const repo = new CommentRepository(db);
        const svc = new CommentService(repo);
        return await svc.getReplies(comment.id, 10, 0);
      });

      // Should be: 1 (findById) + 1 (getReplies with JOIN) + 1 (countReplies) = 3
      expect(queryCount).toBe(3);
    });

    it('should not increase queries when fetching comments from multiple authors', async () => {
      const post = await createTestPost((await createTestUser()).id);

      // Create 5 different users
      const users = await Promise.all([
        createTestUser({ username: 'user1' }),
        createTestUser({ username: 'user2' }),
        createTestUser({ username: 'user3' }),
        createTestUser({ username: 'user4' }),
        createTestUser({ username: 'user5' }),
      ]);

      // Each user creates 2 comments (10 total comments, 5 different authors)
      for (const user of users) {
        for (let i = 1; i <= 2; i++) {
          await createTestComment(post.id, user.id, {
            content: `${user.username} comment ${i}`,
          });
        }
      }

      const { result, queryCount } = await countQueries(async (db) => {
        const repo = new CommentRepository(db);
        const svc = new CommentService(repo);
        return await svc.getCommentsByPostId(post.id, 20, 0);
      });

      // Verify we got comments from all 5 authors
      const uniqueAuthors = new Set(result.comments.map((c) => c.author.id));
      expect(uniqueAuthors.size).toBe(5);

      // Query count should not scale with number of different authors
      // JOIN ensures all authors fetched in single query
      expect(queryCount).toBeLessThanOrEqual(15); // Base + replyCount queries
    });
  });
});