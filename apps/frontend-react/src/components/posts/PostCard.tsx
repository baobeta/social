import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/post';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);


interface PostCardProps {
  post: Post;
  loading?: boolean;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}

function EditButton({ post, loading, onEdit }: { post: Post, loading: boolean, onEdit: (post: Post) => void }) {
  return (
    <button
      onClick={() => onEdit(post)}
      disabled={loading}
      className="px-3 py-1 text-sm text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
    >
      ✏️ Edit
    </button>
  );
}

function DeleteButton({ post, loading, onDelete }: { post: Post, loading: boolean, onDelete: (post: Post) => void }) {
  return (
    <button
      onClick={() => onDelete(post)}
      disabled={loading}
      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      🗑️ Delete
    </button>
  );
}

function formatRelativeTime(date: string) {
  return dayjs(date).fromNow();
}

function PostActions(
  { post, loading, onEdit, onDelete }:
  { post: Post, loading: boolean, onEdit: (post: Post) => void, onDelete: (post: Post) => void }) {
  return (
    <div className="flex items-center justify-end">
      <div className="flex gap-2">
        <EditButton post={post} loading={loading} onEdit={onEdit} />
        <DeleteButton post={post} loading={loading} onDelete={onDelete} />
      </div>
    </div>
  );
}

function PostCardFooter({ post }: { post: Post }) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span>{formatRelativeTime(post.createdAt)}</span>
      {post.commentsCount !== undefined && (
        <span>{post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}</span>
      )}
    </div>
  );
}

function PostCardContent({ post }: { post: Post }) {
  return (
    <div className="mb-4">
      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
    </div>
  );
}

function PostCardHeader({ post, getInitials }: { post: Post, getInitials: (name: string) => string }) {
  return (
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
      <div className="flex items-center gap-2">
        {post.isDeleted && <div className="rounded-full bg-red-500 text-white px-2 py-1 text-xs">Deleted</div>}
        {post.editedByAdmin && <div className="rounded-full bg-blue-500 text-white px-2 py-1 text-xs">Edited by admin</div>}
        {post.isEdited && <div className="rounded-full bg-yellow-500 text-white px-2 py-1 text-xs">Edited</div>}
      </div>
    </div>
  );
}


export default function PostCard({ post, loading = false, onEdit, onDelete }: PostCardProps) {
  const { user, isAdmin, getInitials } = useAuth();
  const canEdit = user?.id === post.author.id || isAdmin;
  const canDelete = user?.id === post.author.id || isAdmin;
  // If the post is deleted, don't show the actions
  const allowShowActions = !post.isDeleted && (canEdit || canDelete);
  const deletedClass = post.isDeleted ? 'border-red-200 bg-red-50' : 'border-gray-100';


  return (
    <div
      className={`bg-white rounded-xl border shadow-md hover:shadow-lg transition-shadow p-6 ${deletedClass}`}
    >
      <PostCardHeader post={post} getInitials={getInitials} />
      {allowShowActions && <PostActions post={post} loading={loading} onEdit={onEdit} onDelete={onDelete} /> }
      <PostCardContent post={post} />
      <PostCardFooter post={post} />
    </div>
  );
}

