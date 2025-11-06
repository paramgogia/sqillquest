import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuestCard } from "@/components/QuestCard";
import { GraduationCap, BookOpen, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

// SAFE env (works in Vite/Next/CRA without crashing)
const API_BASE =
  
  "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

const Education = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ level?: number; xp?: number; subscription?: string; educationLevel?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const educationLevels = [
    { id: "12th", title: "12th Student", icon: BookOpen, level: "12th" },
    { id: "undergraduate", title: "Undergraduate", icon: GraduationCap, level: "undergraduate" },
    { id: "postgraduate", title: "Postgraduate", icon: Scroll, level: "postgraduate" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("skillquest_token");
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    (async () => {
      try {
        if (!token) return navigate("/login");
        const res = await api.get("/api/auth/me");
        const data = res.data;
        const localUser = {
          id: data.id,
          xp: data.xp ?? 0,
          level: data.xp ? Math.max(1, Math.floor((data.xp || 0) / 100) + 1) : 1,
          subscription: data.subscription ?? "free",
          educationLevel: data.educationLevel ?? undefined,
        };
        setUser(localUser);
        localStorage.setItem("user", JSON.stringify(localUser));
      } catch (err) {
        console.error("Failed to fetch user", err);
        toast.error("Please login");
        navigate("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (level: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await api.post("/api/path/select", { educationLevel: level });
      const tier = user?.subscription ?? "free";
      navigate(`/skills?level=${encodeURIComponent(level)}&tier=${encodeURIComponent(tier)}`);
    } catch (err: any) {
      console.error("Failed to select path", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) navigate("/login");
      else toast.error(err?.response?.data?.error || "Failed to select path");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-quest p-8 relative overflow-hidden">
      {/* decorations omitted for brevity (unchanged) */}

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* header */}
        <div className="text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-primary border-2 border-primary mb-4 animate-flicker">
            <span className="text-[0.6rem] font-pixel text-primary-foreground">📍 QUEST SELECT</span>
          </div>
          <h1 className="text-4xl font-pixel text-primary animate-glow leading-relaxed">CHOOSE PATH</h1>
          <p className="text-xs text-muted-foreground font-pixel leading-relaxed">SELECT EDUCATION LEVEL</p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-accent border-2 border-accent">
              <span className="text-[0.6rem] font-pixel text-card">★ LVL {user?.level ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary border-2 border-secondary animate-flicker">
              <span className="text-[0.6rem] font-pixel text-secondary-foreground">🪙 {user?.xp ?? "—"} XP</span>
            </div>
          </div>
        </div>

        {/* current plan */}
        <div className="text-center p-4 bg-primary/20 border-2 border-primary rounded-xl">
          <p className="text-[0.7rem] font-pixel text-primary">
            CURRENT PLAN: <span className="text-secondary animate-glow">{user?.subscription?.toUpperCase() ?? "FREE"}</span>
          </p>
        </div>

        {/* education cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-pixel text-center text-primary animate-glow">📚 SELECT EDUCATION LEVEL</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {educationLevels.map((edu) => (
              <div key={edu.id} className="transform hover:scale-105 transition-all duration-300">
                <QuestCard
                  title={edu.title}
                  icon={edu.icon}
                  onClick={() => {
                    if (actionLoading) return;
                    void handleSelect(edu.level);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400 rounded-xl animate-pulse">
          <p className="text-sm font-pixel text-primary mb-2">🚀 READY TO LEVEL UP?</p>
          <p className="text-[0.65rem] font-pixel text-muted-foreground">Choose your education level to start your learning quest!</p>
          <div className="mt-4">
            <Button onClick={() => navigate("/skills")} disabled={actionLoading}>Browse All Skills</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Education;
