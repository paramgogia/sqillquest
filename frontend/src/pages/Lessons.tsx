import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

/**
 * Lessons page (course home)
 * - route: /lessons/:courseId
 * - fetches course details: GET /api/courses/:id
 * - fetches progress:     GET /api/courses/:id/progress
 * - marks a lesson complete: POST /api/lessons/:lessonId/complete  { courseId }
 *
 * Token expected at localStorage.skillquest_token
 */

// Safe client-side env resolution (works with Vite/CRA/Next without reading process directly)
const API_BASE =
 
  "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

const Lessons = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any | null>(null);
  const [progress, setProgress] = useState<{ lessonsCompleted?: number; lessonsTotal?: number; xpEarned?: number } | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // set auth header from token
  useEffect(() => {
    const token = localStorage.getItem("skillquest_token");
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, []);

  useEffect(() => {
    if (!courseId) return;
    fetchCourseAndProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseAndProgress = async () => {
    const token = localStorage.getItem("skillquest_token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      // fetch course details (with lessons populated)
      const courseRes = await api.get(`/api/courses/${courseId}`);
      const courseData = courseRes?.data;
      setCourse(courseData);

      // fetch progress for that course
      const progRes = await api.get(`/api/courses/${courseId}/progress`);
      const prog = progRes?.data || { lessonsCompleted: 0, lessonsTotal: (courseData?.lessons || []).length, xpEarned: 0 };

      setProgress(prog);

      // If progress coming from API includes completed lessons list, use it.
      // Our earlier server used numeric counts; if you later include explicit completed lesson ids, adjust below.
      // For now, we'll derive "completedLessonIds" by matching first N lessons (lessonsCompleted)
      const completedCount = prog?.lessonsCompleted || 0;
      const lessonIds = (courseData?.lessons || []).map((l: any) => l._id || l.id);
      const completedIds = lessonIds.slice(0, completedCount);
      setCompletedLessonIds(completedIds);
    } catch (err: any) {
      console.error("Failed to load course/progress", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error("Session expired, please login");
        navigate("/login");
        return;
      }
      toast.error("Failed to load course. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Map lessons into the UI structure you had: Introduction + Start Learning -> {listening, reading, writing, speaking}
  const buildLessonSteps = () => {
    if (!course) return [];

    // Find an "introduction" lesson (heuristic: lesson.order === 1 or type === 'text')
    const lessons = Array.isArray(course.lessons) ? course.lessons : [];

    // Normalize lessons: ensure fields _id, title, type, order exist
    const normalized = lessons.map((l: any, idx: number) => ({
      id: l._id || l.id || String(idx),
      title: l.title || `Lesson ${idx + 1}`,
      type: l.type || "text",
      order: typeof l.order === "number" ? l.order : idx + 1,
    }));

    // Intro: pick lowest order text lesson (or first)
    const intro = normalized.find(l => l.type === "text" || l.order === 1) || normalized[0];

    // For subsections, match types to these names (if present)
    const listening = normalized.find(l => l.type === "listening");
    const reading = normalized.find(l => l.type === "reading");
    const writing = normalized.find(l => l.type === "writing");
    const speaking = normalized.find(l => l.type === "speaking");

    const steps = [
      { id: "intro", title: "Introduction", lesson: intro, path: "introduction" },
      {
        id: "start",
        title: "Start Learning",
        subsections: [
          listening ? { id: listening.id, title: "Listening", lesson: listening, path: "listening" } : null,
          reading ? { id: reading.id, title: "Reading", lesson: reading, path: "reading" } : null,
          writing ? { id: writing.id, title: "Writing", lesson: writing, path: "writing" } : null,
          speaking ? { id: speaking.id, title: "Speaking", lesson: speaking, path: "speaking" } : null,
        ].filter(Boolean),
      },
      { id: "mock", title: "Mock Test", path: "mock-test" },
    ];

    return steps;
  };

  // navigate to a section route for the course
  const goToSection = (path: string) => {
    navigate(`/lessons/${courseId}/${path}`);
  };

  // Mark a concrete lesson as complete by calling POST /api/lessons/:id/complete
  const markLessonComplete = async (lessonId: string) => {
    if (!lessonId) return;
    setActionLoading(lessonId);
    try {
      await api.post(`/api/lessons/${lessonId}/complete`, { courseId });
      toast.success("Lesson completed! XP awarded.");
      // Optimistically update completed list and progress counts:
      setCompletedLessonIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));

      // update progress counts: fetch fresh progress
      const progRes = await api.get(`/api/courses/${courseId}/progress`);
      setProgress(progRes?.data || null);
    } catch (err: any) {
      console.error("Failed to complete lesson", err);
      toast.error(err?.response?.data?.error || "Could not mark lesson complete");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-quest">
        <p className="font-pixel text-primary animate-glow">LOADING COURSE...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-quest">
        <p className="font-pixel text-primary">Course not found.</p>
      </div>
    );
  }

  const steps = buildLessonSteps();
  const lessonCount = (course.lessons || []).length;
  const completedCount = completedLessonIds.length;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-quest p-6">
      <h1 className="text-3xl font-pixel mb-4 animate-glow text-center">{course.title}</h1>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl text-center">{course.description}</p>

      <div className="mb-4">
        <div className="text-[0.85rem] font-pixel text-secondary">Progress</div>
        <div className="text-[0.95rem] font-pixel text-primary">
          {completedCount} / {lessonCount} lessons completed • XP: {progress?.xpEarned ?? 0}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6 w-full max-w-3xl mt-4">
        {steps.map((step: any, index: number) => {
          const isUnlocked = index === 0 || completedCount >= index;
          const isCompleted = step.lesson ? completedLessonIds.includes(step.lesson.id) : false;

          return (
            <div key={step.id} className="relative flex flex-col items-center w-full">
              <Button
                onClick={() => {
                  if (!isUnlocked) {
                    toast.error("Complete previous steps first");
                    return;
                  }
                  if (step.subsections) {
                    // nothing - subsections displayed below
                    return;
                  }
                  // For intro or mock-test route
                  goToSection(step.path);
                }}
                className={`px-6 py-3 rounded-full font-pixel text-sm border-2 shadow-lg transition-transform duration-200 ${
                  isUnlocked
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-105"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                }`}
              >
                {step.title}
                {/* show tick if lesson itself is completed */}
                {isCompleted && <CheckCircle className="ml-2 w-5 h-5 text-[hsl(var(--accent))] animate-pulse" />}
              </Button>

              {/* subsections */}
              {step.subsections && isUnlocked && (
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {step.subsections.map((sub: any) => {
                    const subCompleted = completedLessonIds.includes(sub.lesson.id);
                    return (
                      <div key={sub.id} className="flex flex-col items-center">
                        <Button
                          onClick={() => {
                            // navigate to the section page (listening/reading/writing/speaking)
                            goToSection(sub.path);
                          }}
                          className="px-4 py-2 rounded-full font-pixel text-sm border-2 shadow-md transition-transform duration-200 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:scale-105"
                        >
                          {sub.title}
                          {subCompleted && <CheckCircle className="ml-1 w-4 h-4 text-[hsl(var(--accent))] animate-pulse" />}
                        </Button>

                        {/* small "mark complete" for testing/demo (calls POST /api/lessons/:id/complete) */}
                        {!subCompleted && (
                          <Button
                            onClick={() => void markLessonComplete(sub.lesson.id)}
                            className="mt-2 px-3 py-1 rounded-full font-pixel text-xs border-2 bg-transparent"
                            disabled={actionLoading === sub.lesson.id}
                          >
                            {actionLoading === sub.lesson.id ? "Completing..." : "Mark complete"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* connector line */}
              {index < steps.length - 1 && <div className="w-1 h-12 mt-2 relative"><div className="absolute top-0 left-0 w-1 h-12 bg-[hsl(var(--accent))] animate-flicker" /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Lessons;
