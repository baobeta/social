import type { User } from './auth';

export interface Post {
  id: string;
  content: string;
  authorId: string;
  author: User;
  parentId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  editedAt: string | null;
  editedByAdmin: boolean;
  replies?: Post[];
  commentsCount?: number;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  postId: string;
  parentId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  editedByAdmin: boolean;
  replies?: Comment[];
}

export interface CreatePostData {
  content: string;
  parentId?: string | null;
}

export interface UpdatePostData {
  content: string;
}

export interface CreateCommentData {
  content: string;
  postId: string;
  parentId?: string | null;
}

export interface UpdateCommentData {
  content: string;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
}

export interface PostsResponse {
  success: boolean;
  data: {
    posts: Post[];
    pagination?: PaginationMeta;
    total?: number;
  };
  error: string | null;
}

export interface PostResponse {
  success: boolean;
  data: {
    post: Post;
  };
  error: string | null;
}

export interface CommentsResponse {
  success: boolean;
  data: {
    comments: Comment[];
    pagination?: PaginationMeta;
    total?: number;
  };
  error: string | null;
}

export interface CommentResponse {
  success: boolean;
  data: {
    comment: Comment;
  };
  error: string | null;
}

