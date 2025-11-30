interface FinalCTAProps {
  activeUsers: number;
  onGetStarted: () => void;
}

export default function FinalCTA({ activeUsers, onGetStarted }: FinalCTAProps) {
  return (
    <div className="text-center py-16">
      <h2 className="text-5xl font-bold text-gray-800 mb-4">Ready to join?</h2>
      <p className="text-xl text-gray-600 mb-8">
        Join {activeUsers.toLocaleString()}+ creators sharing ideas right now
      </p>
      <button
        onClick={onGetStarted}
        className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white border-0 px-10 py-4 text-lg font-semibold hover:shadow-2xl transition-shadow rounded-full"
      >
        Create Your Account
      </button>
    </div>
  );
}

