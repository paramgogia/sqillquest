import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuestCard } from "@/components/QuestCard";
import { GraduationCap, BookOpen, Scroll, Check, Crown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Education = () => {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState("silver");

  const educationLevels = [
    {
      id: "12th",
      title: "12th Student",
      icon: BookOpen,
      level: "12th",
    },
    {
      id: "undergraduate",
      title: "Undergraduate",
      icon: GraduationCap,
      level: "undergraduate",
    },
    {
      id: "postgraduate",
      title: "Postgraduate",
      icon: Scroll,
      level: "postgraduate",
    },
  ];

  const pricingTiers = [
    {
      id: "silver",
      name: "SILVER",
      icon: Sparkles,
      price: "Free",
      color: "from-gray-400 to-gray-600",
      borderColor: "border-gray-400",
      bgGlow: "bg-gray-400/20",
      features: [
        "✓ 5 Lessons per skill",
        "✓ Basic exercises",
        "✓ Track progress",
        "✓ Community access",
        "✗ Mock tests",
        "✗ Personalized feedback",
        "✗ Certificate",
      ],
    },
    {
      id: "gold",
      name: "GOLD",
      icon: Crown,
      price: "$9.99/mo",
      color: "from-yellow-400 to-orange-500",
      borderColor: "border-yellow-400",
      bgGlow: "bg-yellow-400/20",
      popular: true,
      features: [
        "✓ Unlimited lessons",
        "✓ All exercises unlocked",
        "✓ 10 Mock tests per skill",
        "✓ AI feedback",
        "✓ Progress analytics",
        "✓ Priority support",
        "✗ Certificate",
      ],
    },
    {
      id: "premium",
      name: "PREMIUM",
      icon: Zap,
      price: "$19.99/mo",
      color: "from-purple-500 to-pink-600",
      borderColor: "border-purple-400",
      bgGlow: "bg-purple-400/20",
      features: [
        "✓ Everything in Gold",
        "✓ Unlimited mock tests",
        "✓ 1-on-1 mentorship",
        "✓ Personalized study plan",
        "✓ Video lessons",
        "✓ Download resources",
        "✓ Verified certificate",
      ],
    },
  ];

  const handleSelect = (level) => {
    navigate(`/skills?level=${level}&tier=${selectedTier}`);
  };

  const handleUpgrade = (tierId) => {
    setSelectedTier(tierId);
    // Add your payment/upgrade logic here
  };

  return (
    <div className="min-h-screen bg-gradient-quest p-8 relative overflow-hidden">
      {/* Pixel decorative game elements */}
      <div className="absolute top-20 left-20 text-6xl animate-pixel-bounce text-primary">⭐</div>
      <div className="absolute top-40 right-32 text-5xl animate-glow text-secondary" style={{ animationDelay: '0.5s' }}>🏆</div>
      <div className="absolute bottom-32 left-40 text-7xl animate-flicker text-accent" style={{ animationDelay: '1s' }}>💎</div>
      <div className="absolute bottom-20 right-20 text-6xl animate-pixel-bounce text-pixel-orange" style={{ animationDelay: '1.5s' }}>🎯</div>
      <div className="absolute top-1/2 left-1/3 text-4xl animate-flicker text-pixel-blue" style={{ animationDelay: '2s' }}>✨</div>
      
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-primary border-2 border-primary mb-4 animate-flicker">
            <span className="text-[0.6rem] font-pixel text-primary-foreground">📍 QUEST SELECT</span>
          </div>
          <h1 className="text-4xl font-pixel text-primary animate-glow leading-relaxed">
            CHOOSE PATH
          </h1>
          <p className="text-xs text-muted-foreground font-pixel leading-relaxed">
            SELECT EDUCATION LEVEL & UPGRADE PLAN
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-accent border-2 border-accent">
              <span className="text-[0.6rem] font-pixel text-card">★ LVL {JSON.parse(localStorage.getItem("user") || '{"level":1}').level}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary border-2 border-secondary animate-flicker">
              <span className="text-[0.6rem] font-pixel text-secondary-foreground">🪙 {JSON.parse(localStorage.getItem("user") || '{"xp":0}').xp} XP</span>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="space-y-4">
          <h2 className="text-2xl font-pixel text-center text-primary animate-glow">
            ⚡ POWER-UP PLANS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedTier === tier.id;
              
              return (
                <div
                  key={tier.id}
                  className={`relative p-6 rounded-2xl border-4 transition-all duration-300 transform hover:scale-105 ${
                    isSelected ? "scale-105 shadow-2xl" : ""
                  } ${tier.borderColor} ${tier.bgGlow} backdrop-blur-sm`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[0.6rem] font-pixel rounded-full border-2 border-yellow-300 animate-pulse">
                        🔥 POPULAR
                      </span>
                    </div>
                  )}

                  <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${tier.color}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title & Price */}
                    <div>
                      <h3 className="text-xl font-pixel text-primary mb-2">{tier.name}</h3>
                      <div className={`text-3xl font-pixel bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                        {tier.price}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 text-left">
                      {tier.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className={`text-[0.65rem] font-pixel flex items-start gap-2 ${
                            feature.startsWith("✗") ? "text-muted-foreground line-through" : "text-foreground"
                          }`}
                        >
                          <span className="mt-0.5">{feature.startsWith("✓") ? "✓" : "✗"}</span>
                          <span>{feature.substring(2)}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleUpgrade(tier.id)}
                      className={`w-full font-pixel text-[0.65rem] rounded-full border-2 transition-all ${
                        isSelected
                          ? `bg-gradient-to-r ${tier.color} text-white ${tier.borderColor} scale-105`
                          : `bg-transparent ${tier.borderColor} text-primary hover:bg-gradient-to-r hover:${tier.color} hover:text-white`
                      }`}
                    >
                      {isSelected ? "✓ SELECTED" : tier.id === "silver" ? "START FREE" : "UPGRADE"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="text-center p-4 bg-primary/20 border-2 border-primary rounded-xl">
          <p className="text-[0.7rem] font-pixel text-primary">
            CURRENT PLAN: <span className="text-secondary animate-glow">{pricingTiers.find(t => t.id === selectedTier)?.name}</span>
          </p>
        </div>

        {/* Education Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-pixel text-center text-primary animate-glow">
            📚 SELECT EDUCATION LEVEL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {educationLevels.map((edu) => (
              <div key={edu.id} className="transform hover:scale-105 transition-all duration-300">
                <QuestCard
                  title={edu.title}
                  icon={edu.icon}
                  onClick={() => handleSelect(edu.level)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400 rounded-xl animate-pulse">
          <p className="text-sm font-pixel text-primary mb-2">🚀 READY TO LEVEL UP?</p>
          <p className="text-[0.65rem] font-pixel text-muted-foreground">
            Choose your plan and education level to start your learning quest!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Education;