import { useState, useEffect, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import FeatureCard from '@/components/landing/FeatureCard';
import FinalCTA from '@/components/landing/FinalCTA';
import BackgroundEffects from '@/components/landing/BackgroundEffects';

const features = [
  { icon: '👥', title: 'Real-time Collaboration', desc: 'Connect with thousands instantly' },
  { icon: '⚡', title: 'Lightning Fast', desc: 'Posts sync in milliseconds' },
  { icon: '🌍', title: 'Global Community', desc: 'Join creators worldwide' },
];

export default function HomeView() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [activeUsers, setActiveUsers] = useState(12847);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    setMousePos({ x: e.clientX, y: e.clientY });
  }

  function handleSignIn() {
    navigate('/login');
  }

  async function handleSignOut() {
    await logout();
    navigate('/');
  }

  function handleGetStarted() {
    if (isAuthenticated) {
      navigate('/timeline');
    } else {
      navigate('/register');
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >
      <BackgroundEffects mousePos={mousePos} />
      <LandingNavbar
        activeUsers={activeUsers}
        isAuthenticated={isAuthenticated}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
      <main className="relative z-10 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <HeroSection onGetStarted={handleGetStarted} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.desc}
                isHovered={hoveredCard === index}
                onHover={(isHovered) => setHoveredCard(isHovered ? index : null)}
              />
            ))}
          </div>
          <FinalCTA activeUsers={activeUsers} onGetStarted={handleGetStarted} />
        </div>
      </main>
    </div>
  );
}

