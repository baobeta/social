import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  loading?: boolean;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}

export default function PostCard({ post, loading = false, onEdit, onDelete }: PostCardProps) {
  const { user, isAdmin, getInitials } = useAuth();
  const canEdit = user?.id === post.authorId || isAdmin;
  const canDelete = user?.id === post.authorId || isAdmin;

  return (
    <div
      className={`bg-white rounded-xl border shadow-md hover:shadow-lg transition-shadow p-6 ${
        post.isDeleted ? 'border-red-200 bg-red-50' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
            {getInitials(post.author.fullName)}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{post.author.fullName}</div>
            <div className="text-xs text-gray-500">@{post.author.username}</div>
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => onEdit(post)}
                disabled={loading}
                className="px-3 py-1 text-sm text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
              >
                ✏️ Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(post)}
                disabled={loading}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        {post.isDeleted ? (
          <p className="text-gray-400 italic">This post has been deleted</p>
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Date(post.createdAt).toLocaleString()}</span>
        {post.commentsCount !== undefined && (
          <span>{post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}</span>
        )}
      </div>
    </div>
  );
}

