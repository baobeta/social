interface EditPostDialogProps {
  visible: boolean;
  content: string;
  loading?: boolean;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditPostDialog({
  visible,
  content,
  loading = false,
  onContentChange,
  onSave,
  onCancel,
}: EditPostDialogProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Post</h2>
        <div className="flex flex-col gap-4">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-0 rounded-xl transition-colors resize-none p-3"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!content.trim() || loading}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

