import { useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as postsService from '@/services/posts.ajax';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/timeline/SearchBar';
import CreatePostForm from '@/components/timeline/CreatePostForm';
import PostsList from '@/components/timeline/PostsList';
import PostCard from '@/components/posts/PostCard';
import EditPostDialog from '@/components/timeline/EditPostDialog';
import DeletePostDialog from '@/components/timeline/DeletePostDialog';
import type { Post } from '@/types/post';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function TimelineView() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

  const {
    data: postsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts', { includeDeleted: isAdmin, search: debouncedSearchQuery }],
    queryFn: async ({ pageParam = 0 }) => {
      if (debouncedSearchQuery.trim()) {
        const response = await postsService.searchPosts(debouncedSearchQuery);
        return {
          posts: response.data.posts,
          pagination: response.data.pagination,
          nextOffset: null,
        };
      }
      const response = await postsService.getPosts({
        limit: 20,
        offset: pageParam as number,
        includeDeleted: isAdmin,
      });
      return {
        posts: response.data.posts,
        pagination: response.data.pagination,
        nextOffset: response.data.pagination
          ? (pageParam as number) + response.data.pagination.limit < response.data.pagination.total
            ? (pageParam as number) + response.data.pagination.limit
            : null
          : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
  });

  const posts = useMemo(() => postsData?.pages.flatMap((page) => page.posts) || [], [postsData]);

  const createPostMutation = useMutation({
    mutationFn: postsService.createPost,
    onSuccess: () => {
      setNewPostContent('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { content: string } }) =>
      postsService.updatePost(id, data),
    onSuccess: () => {
      setEditingPostId(null);
      setEditContent('');
      setIsEditDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: postsService.deletePost,
    onSuccess: () => {
      setDeletingPostId(null);
      setIsDeleteDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  function handleCreatePost() {
    if (!newPostContent.trim()) return;
    createPostMutation.mutate({ content: newPostContent });
  }

  function startEditPost(post: Post) {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setIsEditDialogVisible(true);
  }

  function cancelEdit() {
    setEditingPostId(null);
    setEditContent('');
    setIsEditDialogVisible(false);
  }

  // NOTE: we will refresh all list page after edit or delete post successfully
  // We can consider using optimistic update to update the post in the list without refetching the entire list
  // In Vue3, I already handle this case with optimistic update, but in React we will handle later
  function saveEdit() {
    if (!editingPostId || !editContent.trim()) return;
    updatePostMutation.mutate({ id: editingPostId, data: { content: editContent } });
  }

  function handleDeletePost(post: Post) {
    setDeletingPostId(post.id);
    setIsDeleteDialogVisible(true);
  }

  function confirmDelete() {
    if (deletingPostId) {
      deletePostMutation.mutate(deletingPostId);
    }
  }

  function cancelDelete() {
    setDeletingPostId(null);
    setIsDeleteDialogVisible(false);
  }

  function handleLoadMore() {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <CreatePostForm
          value={newPostContent}
          onChange={setNewPostContent}
          loading={createPostMutation.isPending}
          onSubmit={handleCreatePost}
        />
        <PostsList
          posts={posts}
          loading={isLoading}
          loadingMore={isFetchingNextPage}
          error={error ? (error as Error).message : null}
          hasMore={hasNextPage || false}
          emptyMessage={debouncedSearchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to post!'}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
          onLoadMore={handleLoadMore}
          renderPost={(post) => (
            <PostCard
              key={post.id}
              post={post}
              loading={editingPostId === post.id || (deletingPostId === post.id && deletePostMutation.isPending)}
              onEdit={() => startEditPost(post)}
              onDelete={() => handleDeletePost(post)}
            />
          )}
        />
      </div>
      <EditPostDialog
        visible={isEditDialogVisible}
        content={editContent}
        loading={updatePostMutation.isPending}
        onContentChange={setEditContent}
        onSave={saveEdit}
        onCancel={cancelEdit}
      />
      <DeletePostDialog
        visible={isDeleteDialogVisible}
        loading={deletePostMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

