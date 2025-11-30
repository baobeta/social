interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-300 text-sm text-green-700 mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span>Live interactions happening now</span>
      </div>

      <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
        <span className="bg-gradient-to-r from-gray-800 to-green-600 bg-clip-text text-transparent">Connect.</span>
        <br />
        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Create.</span>
        <br />
        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Collaborate.</span>
      </h1>

      <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
        The social platform where ideas flow freely. Post, interact, and build together with a global community in real-time.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={onGetStarted}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-8 py-3 text-lg font-semibold hover:shadow-xl transition-shadow rounded-full"
        >
          Start Posting Free →
        </button>
      </div>
    </div>
  );
}

