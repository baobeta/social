import { apiClient } from './api';
import type {
  CommentsResponse,
  CommentResponse,
  CreateCommentData,
  UpdateCommentData,
} from '@/types/post';

export interface GetCommentsOptions {
  limit?: number;
  offset?: number;
}

export async function getComments(
  postId: string,
  options?: GetCommentsOptions
): Promise<CommentsResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));

  const queryString = params.toString();
  const url = `/posts/${postId}/comments${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get(url);
  return response.data;
}

export async function createComment(data: CreateCommentData): Promise<CommentResponse> {
  const response = await apiClient.post(`/posts/${data.postId}/comments`, data);
  return response.data;
}

export async function updateComment(id: string, data: UpdateCommentData): Promise<CommentResponse> {
  const response = await apiClient.patch(`/comments/${id}`, data);
  return response.data;
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient.delete(`/comments/${id}`);
}
