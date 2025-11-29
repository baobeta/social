import { apiClient } from './api';
import type {
  PostsResponse,
  PostResponse,
  CreatePostData,
  UpdatePostData,
} from '@/types/post';
import type { SearchParams } from '@/types/api';

export async function getPosts(params?: SearchParams): Promise<PostsResponse> {
  const response = await apiClient.get('/posts', { params });
  return response.data;
}

export async function getPost(id: string): Promise<PostResponse> {
  const response = await apiClient.get(`/posts/${id}`);
  return response.data;
}

export async function createPost(data: CreatePostData): Promise<PostResponse> {
  const response = await apiClient.post('/posts', data);
  return response.data;
}

export async function updatePost(id: string, data: UpdatePostData): Promise<PostResponse> {
  const response = await apiClient.patch(`/posts/${id}`, data);
  return response.data;
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/posts/${id}`);
}

export async function searchPosts(query: string): Promise<PostsResponse> {
  const response = await apiClient.get('/search/posts', { params: { q: query } });
  return response.data;
}
