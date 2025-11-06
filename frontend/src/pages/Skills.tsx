import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QuestCard } from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, TrendingUp, Code, FileSpreadsheet, Palette } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const Skills = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const level = searchParams.get("level") || "unknown";
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const skillIcons: any = {
    ielts: MessageCircle,
    sat: TrendingUp,
    python: Code,
    excel: FileSpreadsheet,
    canva: Palette,
  };

  useEffect(() => {
    fetchSkills();
  }, [level]);

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/skills?educationLevel=${level}`
      );
      setSkills(response.data.skills);
    } catch (error: any) {
      console.error("Error fetching skills:", error);
      toast.error("Failed to load skills");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillSelect = async (skillId: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/skills/${skillId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update user XP and level in localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.xp = response.data.xp;
      user.level = response.data.level;
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(`${response.data.skill.skillName} started! +50 XP`);
      navigate(`/skills/${skillId}/start`);
    } catch (error: any) {
      console.error("Error starting skill:", error);
      toast.error(error.response?.data?.error || "Failed to start skill");
    }
  };

  const handleBack = () => {
    navigate("/education");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-quest flex items-center justify-center">
        <p className="font-pixel text-primary animate-glow">LOADING QUESTS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-quest p-8 relative overflow-hidden">
      {/* Pixel decoration elements */}
      <div className="absolute top-10 right-10 text-5xl animate-glow text-primary">🎮</div>
      <div className="absolute top-1/3 left-10 text-6xl animate-pixel-bounce text-secondary" style={{ animationDelay: '0.5s' }}>⚡</div>
      <div className="absolute bottom-20 right-1/4 text-7xl animate-flicker text-accent" style={{ animationDelay: '1s' }}>🌟</div>
      <div className="absolute bottom-1/3 left-1/4 text-5xl animate-pixel-bounce text-pixel-orange" style={{ animationDelay: '1.5s' }}>🗡️</div>
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} className="group border-0">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-pixel text-[0.65rem]">BACK</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-primary border-2 border-primary animate-flicker">
              <span className="text-[0.6rem] font-pixel text-primary-foreground">🎯 QUEST BOARD</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-pixel text-primary animate-glow flex items-center justify-center gap-4 leading-relaxed">
            <span className="text-4xl">⚔️</span>
            CHOOSE QUEST
            <span className="text-4xl">🗡️</span>
          </h1>
          <p className="text-xs text-muted-foreground font-pixel leading-relaxed">
            PICK A SKILL AS{" "}
            <span className="px-3 py-2 bg-primary border-2 border-primary font-pixel text-primary-foreground inline-block text-[0.6rem]">
              {level.toUpperCase()}
            </span>
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="px-4 py-2 bg-accent border-2 border-accent animate-pixel-bounce">
              <span className="text-[0.6rem] font-pixel text-card">💪 {skills.length} QUESTS</span>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skill: any) => (
            <div key={skill.skillId} className="transform hover:scale-105 transition-all duration-300">
              <QuestCard
                title={skill.title}
                icon={skillIcons[skill.skillId] || Code}
                onClick={() => handleSkillSelect(skill.skillId)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skills;