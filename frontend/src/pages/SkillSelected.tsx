import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const SkillSelected = () => {
  const navigate = useNavigate();
  const { skillName } = useParams();
  const [skillProgress, setSkillProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formattedSkillName = skillName
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Unknown Skill";

  useEffect(() => {
    fetchSkillProgress();
  }, [skillName]);

  const fetchSkillProgress = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/skills/${skillName}/progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSkillProgress(response.data);
    } catch (error: any) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    console.log("Continue quest clicked");
  };

  const handleLessonsClick = () => {
    navigate(`/lessons/${skillName}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-quest flex items-center justify-center">
        <p className="font-pixel text-primary animate-glow">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-quest p-8 relative overflow-hidden">
      {/* Pixel celebration background */}
      <div className="absolute top-20 left-20 text-7xl animate-pixel-bounce text-primary">🎉</div>
      <div className="absolute top-40 right-20 text-6xl animate-glow text-secondary" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-40 left-1/4 text-8xl animate-flicker text-accent" style={{ animationDelay: '1s' }}>🏅</div>
      <div className="absolute bottom-20 right-1/3 text-6xl animate-pixel-bounce text-pixel-orange" style={{ animationDelay: '1.5s' }}>🎊</div>
      <div className="absolute top-1/2 right-1/4 text-5xl animate-glow text-pixel-blue" style={{ animationDelay: '2s' }}>⭐</div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Back Button */}
        <div>
          <Button variant="ghost" onClick={handleBack} className="group border-0">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-pixel text-[0.65rem]">BACK</span>
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Success Badge */}
          <div className="flex justify-center">
            <div className="p-6 bg-gradient-treasure border-4 border-pixel-orange shadow-glow-gold animate-glow">
              <Trophy className="w-16 h-16 text-card" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-accent border-2 border-accent mb-2 animate-pixel-bounce">
              <span className="text-[0.6rem] font-pixel text-card">
                {skillProgress?.started ? "🎊 CONTINUE!" : "🎊 UNLOCKED!"}
              </span>
            </div>
            <h1 className="text-3xl font-pixel text-primary animate-glow leading-relaxed">
              {formattedSkillName.toUpperCase()} {skillProgress?.started ? "IN PROGRESS" : "STARTED"}!
            </h1>
            <p className="text-xs text-muted-foreground font-pixel leading-relaxed">
              JOURNEY {skillProgress?.started ? "CONTINUES" : "BEGUN"} IN{" "}
              <span className="px-3 py-2 bg-primary border-2 border-primary font-pixel text-primary-foreground inline-block text-[0.6rem]">
                {formattedSkillName.toUpperCase()}
              </span>
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <div className="px-4 py-2 bg-secondary border-2 border-secondary animate-flicker">
                <span className="text-[0.6rem] font-pixel text-secondary-foreground">
                  {skillProgress?.started ? `${skillProgress.progress}% Complete` : "+50 XP"}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="shadow-quest border-4 border-primary relative overflow-hidden">
            {/* Pixel corner elements */}
            <div className="absolute top-2 right-2 w-3 h-3 bg-primary animate-flicker" />
            <div className="absolute top-2 left-2 w-3 h-3 bg-secondary animate-flicker" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-accent animate-flicker" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-pixel-orange animate-flicker" style={{ animationDelay: '1.5s' }} />

            <CardHeader className="relative">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-pixel">
                  🎯 PROGRESS
                </span>
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="px-3 py-2 bg-muted border-2 border-border text-[0.6rem] font-pixel">
                    {skillProgress?.progress || 0}%
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              <div className="relative border-4 border-border bg-muted p-2">
                <Progress value={skillProgress?.progress || 0} className="h-8 border-2 border-border" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[0.6rem] font-pixel text-primary animate-flicker">
                    {skillProgress?.started ? "CONTINUE ADVENTURE" : "START ADVENTURE"}
                  </span>
                </div>
              </div>

              <div className="bg-muted p-6 space-y-4 border-4 border-border">
                <h3 className="font-pixel text-xs flex items-center gap-2 text-primary">
                  <span>🗺️</span> JOURNEY {skillProgress?.started ? "CONTINUES" : "START"}
                </h3>
                <p className="text-muted-foreground text-[0.65rem] font-pixel leading-relaxed">
                  COMPLETE CHALLENGES, EARN REWARDS, MASTER SKILLS!
                </p>
                <ul className="space-y-3">
                  <li
                    className="flex items-center gap-3 p-3 bg-background border-2 border-border cursor-pointer hover:bg-muted transition"
                    onClick={handleLessonsClick}
                  >
                    <div className="w-8 h-8 bg-primary border-2 border-primary flex items-center justify-center animate-flicker">
                      <span className="text-[0.6rem]">📚</span>
                    </div>
                    <span className="font-pixel text-[0.6rem] text-foreground">LESSONS</span>
                  </li>

                  <li className="flex items-center gap-3 p-3 bg-background border-2 border-border">
                    <div className="w-8 h-8 bg-secondary border-2 border-secondary flex items-center justify-center animate-flicker" style={{ animationDelay: '0.5s' }}>
                      <span className="text-[0.6rem]">🏆</span>
                    </div>
                    <span className="font-pixel text-[0.6rem] text-foreground">BADGES</span>
                  </li>
                  <li className="flex items-center gap-3 p-3 bg-background border-2 border-border">
                    <div className="w-8 h-8 bg-accent border-2 border-accent flex items-center justify-center animate-flicker" style={{ animationDelay: '1s' }}>
                      <span className="text-[0.6rem]">📊</span>
                    </div>
                    <span className="font-pixel text-[0.6rem] text-foreground">PROGRESS</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="quest" size="xl" className="flex-1" onClick={handleContinue}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  <span className="font-pixel text-xs">CONTINUE</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SkillSelected;