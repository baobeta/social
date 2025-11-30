import { FormEvent } from 'react';

interface CreatePostFormProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  onSubmit: () => void;
}

export default function CreatePostForm({ value, onChange, loading = false, onSubmit }: CreatePostFormProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSubmit();
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 mb-8 shadow-lg hover:shadow-xl transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          placeholder="What's on your mind?"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-0 rounded-xl transition-colors resize-none p-3"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!value.trim() || loading}
            className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Posting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>📤</span>
                Post
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

