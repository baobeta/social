import { useEffect, useRef, ReactNode } from 'react';
import type { Post } from '@/types/post';

interface PostsListProps {
  posts: Post[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  hasMore?: boolean;
  emptyMessage?: string;
  onRetry: () => void;
  onLoadMore: () => void;
  renderPost: (post: Post) => ReactNode;
}

function LoadingComponent() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );
}

function ErrorComponent({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <div className="text-center">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">{error}</div>
      <button onClick={onRetry} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Try again</button>
    </div>
  );
}

function EmptyComponent({ emptyMessage }: { emptyMessage: string }) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p className="mt-4 text-gray-500">{emptyMessage}</p>
    </div>
  );
}

function LoadMoreComponent({ loadingMore, hasMore }: { loadingMore: boolean, hasMore: boolean }) {
  return (
    <div className="py-6 flex justify-center">
      {loadingMore ? <LoadingComponent /> : hasMore ? <p className="text-gray-400 text-sm">Scroll for more posts...</p> : <p className="text-gray-400 text-sm">You've reached the end</p>}
    </div>
  );
}


export default function PostsList({
  posts,
  loading = false,
  loadingMore = false,
  error = null,
  hasMore = false,
  emptyMessage = 'No posts yet. Be the first to post!',
  onRetry,
  onLoadMore,
  renderPost,
}: PostsListProps) {
  // template ref
  const loadMoreTrigger = useRef<HTMLDivElement>(null);
  // Storing data that persists across renders
  const observerRef = useRef<IntersectionObserver | null>(null);

  // WTF is this with React?
  // This is equal with onMounted, watch, onUnmount in Vue3
  useEffect(() => {
    if (!loadMoreTrigger.current) return;

    // intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // if the element is intersecting with the viewport and there are more posts to load and the loading more is not loading
        if (entry && entry.isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(loadMoreTrigger.current);

    return () => {
      // onUnmounted
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <ErrorComponent error={error} onRetry={onRetry} />;
  }

  if (posts.length > 0) {
    return (
      <div className="space-y-6">
        {posts.map((post) => renderPost(post))}
        <div ref={loadMoreTrigger} className="py-6 flex justify-center">
          <LoadMoreComponent loadingMore={loadingMore} hasMore={hasMore} />
        </div>
      </div>
    );
  }

  return <EmptyComponent emptyMessage={emptyMessage} />;
}

