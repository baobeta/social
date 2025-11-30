interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  isHovered: boolean;
  onHover: (isHovered: boolean) => void;
}

export default function FeatureCard({ icon, title, description, isHovered, onHover }: FeatureCardProps) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-green-300 transition-all cursor-pointer group ${
        isHovered ? 'border-green-300' : ''
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
          isHovered
            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        <span className="text-xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

