import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

/**
 * Listening.tsx (modified)
 * - Adds a single audio player at the top (use asset filename or upload local file)
 * - Player is placed above sections. You can listen and then answer questions.
 * - Rest of the component (submit => /api/practice/:lessonId/submit + /api/lessons/:lessonId/complete) unchanged.
 */

// fallback sample questions (used when course doesn't provide question data)
const listeningDataFallback = [
  {
    id: 1,
    title: "Section 1",
    duration: "5 mins",
    questions: [
      { id: 1, question: "What is the main topic of the conversation?", answer: "Booking a hotel" },
      { id: 2, question: "What time is the meeting scheduled?", answer: "10 AM" },
    ],
  },
  {
    id: 2,
    title: "Section 2",
    duration: "15 mins",
    questions: [
      { id: 1, question: "Who is speaking in the conversation?", answer: "A manager" },
      { id: 2, question: "Where is the meeting happening?", answer: "Conference room" },
    ],
  },
  {
    id: 3,
    title: "Section 3",
    duration: "30 mins",
    questions: [
      { id: 1, question: "What is being discussed?", answer: "Project deadline" },
      { id: 2, question: "When is the deadline?", answer: "Friday" },
    ],
  },
  {
    id: 4,
    title: "Section 4",
    duration: "1 hour",
    questions: [
      { id: 1, question: "What is the purpose of the call?", answer: "Team update" },
      { id: 2, question: "Who is absent from the meeting?", answer: "John" },
    ],
  },
];

// safe client env resolution (hardcoded to your API)
const API_BASE = "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// shuffle helper
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Listening = () => {
  const params = useParams<{ courseId?: string; skillName?: string }>();
  const courseId = params.courseId || params.skillName || "";
  const navigate = useNavigate();

  const [courseTitle, setCourseTitle] = useState<string>("");
  const [sections, setSections] = useState<
    {
      sectionId: number;
      title: string;
      duration: string;
      questions: { id: number | string; question: string; answer?: string }[];
      lessonId?: string; // real backend lesson id if available
    }[]
  >([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, "correct" | "wrong">>({});
  const [unlockedSections, setUnlockedSections] = useState<number[]>([1]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio player state
  const [assetFilename, setAssetFilename] = useState<string>(""); // e.g. "listening-course-1.mp3"
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // resolved URL or object URL for uploaded file
  const [localFileNameLabel, setLocalFileNameLabel] = useState<string | null>(null);

  // set auth header once
  useEffect(() => {
    const token = localStorage.getItem("skillquest_token");
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, []);

  // fetch course -> map lessons to sections
  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        // fallback to local data
        setCourseTitle("Listening Practice");
        const fallback = listeningDataFallback.map((s) => ({
          sectionId: s.id,
          title: s.title,
          duration: s.duration,
          questions: s.questions.map(q => ({ id: q.id, question: q.question, answer: q.answer })),
        }));
        setSections(fallback);
        return;
      }

      try {
        const token = localStorage.getItem("skillquest_token");
        if (!token) {
          toast.error("Please login first");
          navigate("/login");
          return;
        }

        // GET course details (should populate lessons)
        const courseRes = await api.get(`/api/courses/${courseId}`);
        const courseData = courseRes?.data;
        setCourseTitle(courseData?.title || "Listening Practice");

        // courseData.lessons expected as array (populated)
        const lessons: any[] = Array.isArray(courseData?.lessons) ? courseData.lessons : [];

        // Map server lessons (if available) to fallback sections
        const mapped: any[] = [];
        const fallback = listeningDataFallback;

        for (let i = 0; i < fallback.length; i++) {
          const sectionNum = fallback[i].id;
          const lesson = lessons[i]; // may be undefined
          let questions = fallback[i].questions.map(q => ({ id: q.id, question: q.question, answer: q.answer }));
          if (lesson && lesson.content) {
            try {
              const parsed = typeof lesson.content === "string" ? JSON.parse(lesson.content) : lesson.content;
              if (parsed && Array.isArray(parsed.questions)) {
                questions = parsed.questions.map((qq: any, idx: number) => ({
                  id: qq.id ?? idx + 1,
                  question: qq.question ?? qq.q ?? `Question ${idx + 1}`,
                  answer: qq.answer ?? undefined,
                }));
              }
            } catch (e) {
              // not JSON — keep fallback questions
            }
          }

          // shuffle questions for this section
          const randomized = shuffle(questions);

          mapped.push({
            sectionId: sectionNum,
            title: fallback[i].title,
            duration: fallback[i].duration,
            questions: randomized,
            lessonId: lesson?._id || lesson?.id,
          });
        }

        setSections(mapped);
      } catch (err: any) {
        console.error("Failed to load course or map lessons:", err);
        toast.error("Could not load course - using fallback questions");
        // fallback
        const fallback = listeningDataFallback.map((s) => ({
          sectionId: s.id,
          title: s.title,
          duration: s.duration,
          questions: shuffle(s.questions.map(q => ({ id: q.id, question: q.question, answer: q.answer }))),
        }));
        setSections(fallback);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleBack = () => navigate(-1);

  const handleChange = (sectionId: number | string, questionId: number | string, value: string) => {
    const key = `${sectionId}-${questionId}`;
    setUserAnswers(prev => ({ ...prev, [key]: value }));
  };

  // Start/unlock a section
  const handleStartSection = (sectionId: number) => {
    setUnlockedSections(prev => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
  };

  // Play a short demo beep (kept for compatibility) — still available via Play Demo button if you want it
  const playDemoBeep = async (sectionId: number) => {
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioCtx) {
        handleStartSection(sectionId);
        return;
      }
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 600;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      o.start(now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      o.stop(now + 0.45);
      setTimeout(() => {
        handleStartSection(sectionId);
        try { ctx.close(); } catch (e) {}
      }, 500);
    } catch (err) {
      console.warn("Audio play failed, unlocking section anyway.", err);
      handleStartSection(sectionId);
    }
  };

  // Load an audio file from /assets/<filename> (you said you'll upload to assets)
  const handleLoadAsset = () => {
    if (!assetFilename) {
      toast.error("Enter the asset filename (e.g. listening-course-1.mp3)");
      return;
    }
    // Build URL assuming assets served from /assets/
    const url = `/assets/${assetFilename}`;
    setAudioUrl(url);
    setLocalFileNameLabel(null);
    toast.success("Loaded asset audio (check player above).");
  };

  // Upload a local file and play locally (object URL)
  const handleLocalFile = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setLocalFileNameLabel(file.name);
    toast.success(`Loaded local file: ${file.name}`);
  };

  // Submit answers to practice endpoint then mark lesson complete
  const handleSubmit = async (section) => {
    const sectionId = section.sectionId;
    const lessonId = section.lessonId ?? `listening-section-${sectionId}`; // fallback id if server lacks lesson id
    const questions = section.questions;

    // Build answers object
    const answers: Record<string, string> = {};
    for (const q of questions) {
      const key = `${sectionId}-${q.id}`;
      answers[`q${q.id}`] = (userAnswers[key] || "").toString();
    }

    const token = localStorage.getItem("skillquest_token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) Submit practice (server accepts JSON answers)
      const practiceResp = await api.post(`/api/practice/${lessonId}/submit`, {
        answers,
      });

      const practiceData = practiceResp?.data;
      const practiceXp = practiceData?.xpEarned ?? 0;
      const practiceScore = practiceData?.score ?? 0;
      const totalXpAfterPractice = practiceData?.totalXp ?? null;

      // 2) Immediately mark lesson complete so backend increments lessonsCompleted and awards XP_PER_LESSON (20)
      const completeResp = await api.post(`/api/lessons/${lessonId}/complete`, { courseId });
      const completeData = completeResp?.data;
      const lessonXp = completeData?.xpAwarded ?? completeData?.xpEarned ?? 0;
      const totalXpAfterComplete = completeData?.totalXp ?? totalXpAfterPractice;

      // Update localStorage user.xp and level based on returned totalXp if present, else add xp
      try {
        const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
        if (totalXpAfterComplete != null) {
          userLocal.xp = totalXpAfterComplete;
        } else {
          userLocal.xp = (userLocal.xp || 0) + practiceXp + lessonXp;
        }
        userLocal.level = Math.max(1, Math.floor((userLocal.xp || 0) / 100) + 1);
        localStorage.setItem("user", JSON.stringify(userLocal));
      } catch (e) {
        console.warn("Could not update local user xp", e);
      }

      // Build local feedback by comparing text answers where we have correct answers in data
      const newFeedback: Record<string, "correct" | "wrong"> = {};
      for (const q of questions) {
        const key = `${sectionId}-${q.id}`;
        if (q.answer !== undefined) {
          const userAns = (userAnswers[key] || "").toString().trim().toLowerCase();
          const correct = (q.answer || "").toString().trim().toLowerCase();
          newFeedback[key] = userAns !== "" && userAns === correct ? "correct" : "wrong";
        } else {
          // if no correct answer available, mark as wrong/unknown; server scoring is authoritative
          newFeedback[key] = "wrong";
        }
      }
      setFeedback(prev => ({ ...prev, ...newFeedback }));

      toast.success(`Submitted — score: ${practiceScore} — XP +${(practiceXp || 0) + (lessonXp || 0)}`);

      // unlock next section
      setUnlockedSections(prev => [...new Set([...prev, sectionId + 1])]);

      // if last section, navigate back to lessons overview
      const last = sections[sections.length - 1]?.sectionId;
      if (sectionId === last) {
        navigate(`/lessons/${courseId}`);
      }
    } catch (err: any) {
      console.error("Listening submit error:", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error("Session expired — please login");
        navigate("/login");
        return;
      }
      toast.error(err?.response?.data?.error || "Failed to submit answers");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = (section) => {
    // call submit which handles both practice submit and lesson complete
    void handleSubmit(section);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <Button variant="ghost" onClick={handleBack} className="group border-0 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-pixel text-[0.65rem]">BACK</span>
        </Button>

        <h1 className="text-3xl font-pixel mb-4 animate-glow text-center">🎧 {courseTitle || "Listening Practice"}</h1>

        {/* AUDIO PLAYER + ASSET LOADER */}
        <div className="mb-6 p-4 rounded-xl border bg-white/5 border-gray-400">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1">Audio (use asset or upload local)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. listening-course-1.mp3"
                  value={assetFilename}
                  onChange={(e) => setAssetFilename(e.target.value)}
                  className="flex-1 p-2 rounded border border-[hsl(var(--border))] bg-white text-black"
                />
                <Button onClick={handleLoadAsset} className="px-4 py-2">Load Asset</Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Place the file in <code>/assets/</code> and enter its filename above, or upload a local file below.
              </div>
            </div>

            <div className="w-48">
              <label className="block text-sm text-muted-foreground mb-1">Upload local audio</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  handleLocalFile(f);
                }}
                className="w-full"
              />
              {localFileNameLabel && <div className="text-xs mt-1 text-muted-foreground">{localFileNameLabel}</div>}
            </div>
          </div>

          {/* audio player (if audioUrl available) */}
          {audioUrl ? (
            <audio src={audioUrl} controls className="w-full mt-3" />
          ) : (
            <div className="text-sm text-muted-foreground">No audio loaded — load an asset or upload a file to play.</div>
          )}
        </div>

        <div className="space-y-8">
          {sections.map((section) => {
            const isUnlocked = unlockedSections.includes(section.sectionId);
            const questions = section.questions;
            const allAnswered = questions.every(q => {
              const key = `${section.sectionId}-${q.id}`;
              return (userAnswers[key] || "").toString().trim() !== "";
            });

            return (
              <div
                key={section.sectionId}
                className={`p-6 rounded-2xl shadow-md border transition-all duration-500 ${isUnlocked ? "bg-white/5 border-gray-400" : "bg-gray-900/40 border-gray-700 opacity-60 pointer-events-none"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-2xl font-semibold">{section.title}</h2>
                    <p className="text-gray-400">⏱ Duration: {section.duration}</p>
                    {section.lessonId && <p className="text-xs text-muted-foreground mt-1">Lesson ID: {section.lessonId}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isUnlocked ? (
                      <>
                        <Button onClick={() => handleStartSection(section.sectionId)} className="px-4 py-2">Start</Button>
                        <Button onClick={() => playDemoBeep(section.sectionId)} className="px-4 py-2">Play Demo</Button>
                      </>
                    ) : (
                      <div className="text-xs font-pixel text-muted-foreground">Unlocked</div>
                    )}
                  </div>
                </div>

                {isUnlocked ? (
                  <div className="space-y-4 mt-4">
                    {questions.map((q) => {
                      const key = `${section.sectionId}-${q.id}`;
                      return (
                        <div key={key} className="flex flex-col space-y-1">
                          <label className="font-bold">{q.question}</label>
                          <input
                            type="text"
                            value={userAnswers[key] || ""}
                            onChange={(e) => handleChange(section.sectionId, q.id, e.target.value)}
                            className="p-2 rounded border border-[hsl(var(--border))] bg-white text-black"
                            disabled={isSubmitting}
                          />
                          {feedback[key] && (
                            <span className={`font-bold ${feedback[key] === "correct" ? "text-green-500" : "text-red-500"}`}>
                              {feedback[key] === "correct" ? "Correct ✅" : `Wrong ❌${q.answer ? ` (Answer: ${q.answer})` : ""}`}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex mt-6 space-x-4">
                      <Button
                        onClick={() => void handleSubmit(section)}
                        className="px-6 py-2 rounded-full font-pixel hover:scale-105 transition-all"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting…" : "Submit Answers"}
                      </Button>

                      <Button
                        onClick={() => handleDone(section)}
                        className="px-6 py-2 rounded-full font-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-105 transition-all"
                        disabled={isSubmitting || !allAnswered}
                      >
                        {isSubmitting ? "Processing…" : section.sectionId === sections[sections.length - 1].sectionId ? "Finish 🎉" : "Done →"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">🔒 Complete the previous section to unlock this one.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Listening;
