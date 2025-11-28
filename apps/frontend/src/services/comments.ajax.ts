import { apiClient } from './api';
import type {
  CommentsResponse,
  CommentResponse,
  CreateCommentData,
  UpdateCommentData,
} from '@/types/post';

export async function getComments(postId: string): Promise<CommentsResponse> {
  const response = await apiClient.get(`/posts/${postId}/comments`);
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
