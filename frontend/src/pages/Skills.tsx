import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QuestCard } from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, TrendingUp, Code, FileSpreadsheet, Palette } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// SAFE env resolution (Vite / Next / CRA) without crashing in browser
const API_BASE =

  "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

const Skills = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const level = searchParams.get("level") || "unknown";

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const skillIcons: any = {
    ielts: MessageCircle,
    sat: TrendingUp,
    python: Code,
    excel: FileSpreadsheet,
    canva: Palette,
  };

  useEffect(() => {
    const token = localStorage.getItem("skillquest_token");
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, []);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/courses");
      const preferred = Array.isArray(res.data.preferred) ? res.data.preferred : [];
      const others = Array.isArray(res.data.others) ? res.data.others : [];
      setCourses([...preferred, ...others]);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Session expired. Please login.");
        navigate("/login");
        return;
      }
      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate("/education");

  const handleCourseSelect = async (courseId: string) => {
    const token = localStorage.getItem("skillquest_token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    setActionLoadingId(courseId);
    try {
      await api.post(`/api/courses/${courseId}/enroll`);
      const dash = await api.get("/api/dashboard");
      const userObj = {
        id: dash.data.user?.id,
        xp: dash.data.user?.xp ?? (JSON.parse(localStorage.getItem("user") || "{}").xp || 0),
        level: dash.data.user?.xp ? Math.max(1, Math.floor((dash.data.user?.xp || 0) / 100) + 1) : JSON.parse(localStorage.getItem("user") || '{"level":1}').level,
        subscription: dash.data.user?.subscription ?? JSON.parse(localStorage.getItem("user") || '{"subscription":"free"}').subscription,
      };
      localStorage.setItem("user", JSON.stringify(userObj));

      const course = courses.find((c) => (c._id || c.id) === courseId);
      toast.success(`${course?.title || "Course"} started!`);
      navigate(`/lessons/${courseId}`);
 // adjust if your route differs
    } catch (error: any) {
      console.error("Error starting course:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Please login again");
        navigate("/login");
        return;
      }
      toast.error(error?.response?.data?.error || "Failed to start course");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-quest flex items-center justify-center">
        <p className="font-pixel text-primary animate-glow">LOADING COURSES...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-quest p-8 relative overflow-hidden">
      {/* header & chrome omitted for brevity (unchanged) */}

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Back */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/education")} className="group border-0">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-pixel text-[0.65rem]">BACK</span>
          </Button>
          <div className="px-3 py-2 bg-primary border-2 border-primary animate-flicker">
            <span className="text-[0.6rem] font-pixel text-primary-foreground">🎯 QUEST BOARD</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-pixel text-primary animate-glow flex items-center justify-center gap-4 leading-relaxed">
            <span className="text-4xl">⚔️</span> CHOOSE QUEST <span className="text-4xl">🗡️</span>
          </h1>
          <p className="text-xs text-muted-foreground font-pixel leading-relaxed">
            PICK A SKILL AS{" "}
            <span className="px-3 py-2 bg-primary border-2 border-primary font-pixel text-primary-foreground inline-block text-[0.6rem]">
              {level.toUpperCase()}
            </span>
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="px-4 py-2 bg-accent border-2 border-accent animate-pixel-bounce">
              <span className="text-[0.6rem] font-pixel text-card">💪 {courses.length} QUESTS</span>
            </div>
          </div>
        </div>

        {/* Courses grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course: any) => {
            const Icon = skillIcons[course.category] || Code;
            const id = course._id || course.id;
            const isBusy = actionLoadingId === id;

            return (
              <div key={id} className="transform hover:scale-105 transition-all duration-300">
                <QuestCard
                  title={course.title}
                  icon={Icon}
                  onClick={() => {
                    if (isBusy || actionLoadingId) return; // prevent double click
                    void handleCourseSelect(id);
                  }}
                />
                {course.description && (
                  <div className="mt-2 text-[0.7rem] text-muted-foreground font-pixel">
                    {course.description}
                  </div>
                )}
                {isBusy && <div className="mt-2 text-[0.75rem] font-pixel text-primary">Starting…</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Skills;
