import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

/**
 * Writing.tsx
 * - Submits answers JSON to POST /api/practice/:lessonId/submit
 * - Calls POST /api/lessons/:lessonId/complete with { courseId }
 * - Updates local XP and unlocks next sections
 *
 * Expects: JWT in localStorage.skillquest_token and localStorage.user (optional)
 */

// safe client-side env resolution
const API_BASE =
  "http://localhost:4000";

const api = axios.create({ baseURL: API_BASE, headers: { "Content-Type": "application/json" } });

const writingData = [
  {
    id: 1,
    title: "Section 1 - Basic Sentences",
    duration: "10 mins",
    prompts: [
      {
        id: 1,
        prompt: "Describe your favorite hobby in 2-3 sentences.",
        minWords: 15,
        keywords: ["enjoy", "like", "favorite"],
      },
      {
        id: 2,
        prompt: "Write about what you did last weekend.",
        minWords: 20,
        keywords: ["weekend", "went", "did"],
      },
    ],
  },
  {
    id: 2,
    title: "Section 2 - Descriptive Writing",
    duration: "15 mins",
    prompts: [
      {
        id: 1,
        prompt:
          "Describe your dream vacation destination. Include details about location, activities, and why you want to go there.",
        minWords: 40,
        keywords: ["vacation", "travel", "destination"],
      },
      {
        id: 2,
        prompt:
          "Write about a memorable meal you've had. Describe the food, atmosphere, and who you were with.",
        minWords: 35,
        keywords: ["food", "meal", "restaurant", "delicious"],
      },
    ],
  },
  {
    id: 3,
    title: "Section 3 - Opinion Writing",
    duration: "20 mins",
    prompts: [
      {
        id: 1,
        prompt:
          "Do you think social media has a positive or negative impact on society? Explain your opinion with examples.",
        minWords: 50,
        keywords: ["social media", "impact", "opinion", "because"],
      },
      {
        id: 2,
        prompt: "Should students have homework? Give reasons to support your viewpoint.",
        minWords: 45,
        keywords: ["students", "homework", "should", "because", "reason"],
      },
    ],
  },
  {
    id: 4,
    title: "Section 4 - Creative Writing",
    duration: "25 mins",
    prompts: [
      {
        id: 1,
        prompt:
          "Write a short story beginning with: 'The door creaked open, and I couldn't believe what I saw...'",
        minWords: 60,
        keywords: ["door", "saw", "suddenly"],
      },
      {
        id: 2,
        prompt:
          "Imagine you could have any superpower for one day. What would it be and what would you do?",
        minWords: 55,
        keywords: ["superpower", "would", "imagine"],
      },
    ],
  },
];

const countWords = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

const checkKeywords = (text: string, keywords: string[]) => {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase()));
};

const Writing = () => {
  const { courseId: paramCourseId, skillName } = useParams<{ courseId?: string; skillName?: string }>();
  const courseId = paramCourseId || skillName || "";
  const navigate = useNavigate();

  // local state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, any>>({});
  const [unlockedSections, setUnlockedSections] = useState<number[]>([1]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessonIdForSection, setLessonIdForSection] = useState<Record<number, string>>({}); // map section -> lessonId (if server provides)

  // Try to fetch course and map lessons to sections (to get real lesson IDs)
  useEffect(() => {
    const token = localStorage.getItem("skillquest_token");
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const load = async () => {
      if (!courseId) return;
      try {
        const res = await api.get(`/api/courses/${courseId}`);
        const lessons = Array.isArray(res.data?.lessons) ? res.data.lessons : [];

        // map lessons to sections by index (fallback), find writing lesson by type if present
        const mapping: Record<number, string> = {};
        // attempt to find lessons with type 'writing'
        const writingLessons = lessons.filter((l: any) => l.type === "writing" || (l.title && l.title.toLowerCase().includes("writing")));
        if (writingLessons.length > 0) {
          // if multiple, assign the first to section 1, next to 2 etc.
          writingLessons.forEach((l: any, idx: number) => {
            const sectionIndex = idx + 1;
            mapping[sectionIndex] = l._id || l.id;
          });
        } else {
          // fallback: map by sequence to sections length
          for (let i = 0; i < writingData.length; i++) {
            const lesson = lessons[i];
            if (lesson) mapping[i + 1] = lesson._id || lesson.id;
          }
        }
        setLessonIdForSection(mapping);
      } catch (err) {
        console.warn("Could not fetch course to map lessons. Using fallback IDs.", err);
      }
    };
    void load();
  }, [courseId]);

  const handleBack = () => navigate(-1);

  const handleChange = (sectionId: number, promptId: number, value: string) => {
    const key = `${sectionId}-${promptId}`;
    setUserAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitSection = async (sectionId: number) => {
    const section = writingData.find((s) => s.id === sectionId);
    if (!section) return;

    // Validate token
    const token = localStorage.getItem("skillquest_token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    // Build answers object: q1, q2...
    const answers: Record<string, string> = {};
    for (const prompt of section.prompts) {
      const key = `${sectionId}-${prompt.id}`;
      answers[`q${prompt.id}`] = (userAnswers[key] || "").toString();
    }

    // Local pre-feedback: word counts and keyword checks
    const newFeedback: Record<string, any> = { ...(feedback || {}) };
    for (const prompt of section.prompts) {
      const key = `${section.id}-${prompt.id}`;
      const text = (userAnswers[key] || "").toString();
      const wordCount = countWords(text);
      const found = checkKeywords(text, prompt.keywords);
      const meetsWord = wordCount >= prompt.minWords;
      const enoughKeywords = found.length >= Math.ceil(prompt.keywords.length / 2);
      newFeedback[key] = {
        status: meetsWord && enoughKeywords ? "good" : "needsWork",
        wordCount,
        minWords: prompt.minWords,
        foundKeywords: found,
        totalKeywords: prompt.keywords.length,
      };
    }
    setFeedback(newFeedback);

    setIsSubmitting(true);
    try {
      // choose lessonId
      const lessonId = lessonIdForSection[sectionId] ?? `writing-section-${sectionId}`;

      // 1) Submit to practice endpoint (JSON body)
      const practiceResp = await api.post(`/api/practice/${lessonId}/submit`, { answers });
      const practiceData = practiceResp?.data || {};
      const practiceXp = practiceData?.xpEarned ?? 0;
      const practiceScore = practiceData?.score ?? 0;
      const totalXpFromPractice = practiceData?.totalXp ?? null;

      // 2) Mark lesson complete to award lesson XP (20)
      const completeResp = await api.post(`/api/lessons/${lessonId}/complete`, { courseId });
      const completeData = completeResp?.data || {};
      const lessonXp = completeData?.xpAwarded ?? completeData?.xpEarned ?? 20;
      const totalXpAfterComplete = completeData?.totalXp ?? totalXpFromPractice;

      // Update local user XP & level
      try {
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (totalXpAfterComplete != null) {
          localUser.xp = totalXpAfterComplete;
        } else {
          localUser.xp = (localUser.xp || 0) + practiceXp + lessonXp;
        }
        localUser.level = Math.max(1, Math.floor((localUser.xp || 0) / 100) + 1);
        localStorage.setItem("user", JSON.stringify(localUser));
      } catch (e) {
        console.warn("Failed to update local user xp", e);
      }

      // Show toast + update feedback (could merge server scoring info)
      toast.success(`Submitted — score: ${practiceScore} — XP +${practiceXp + lessonXp}`);

      // Unlock next section
      setUnlockedSections((prev) => [...new Set([...prev, sectionId + 1])]);

      // If last section, go back to lessons overview
      if (sectionId === writingData[writingData.length - 1].id) {
        navigate(`/lessons/${courseId}`);
      }
    } catch (err: any) {
      console.error("Error submitting writing section:", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error("Session expired — please login again");
        navigate("/login");
        return;
      }
      toast.error(err?.response?.data?.error || "Failed to submit section");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = (sectionId: number) => {
    // after submission, caller should call handleSubmitSection, but keep unlock here too
    setUnlockedSections((prev) => [...new Set([...prev, sectionId + 1])]);
    if (sectionId === writingData.length) {
      navigate(`/lessons/${courseId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 overflow-y-auto">
      <div>
        <Button variant="ghost" onClick={handleBack} className="group border-0">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-pixel text-[0.65rem]">BACK</span>
        </Button>
      </div>

      <h1 className="text-3xl font-pixel mb-8 animate-glow text-center">✍️ Writing Practice</h1>

      <div className="w-full max-w-3xl space-y-12">
        {writingData.map((section, sectionIndex) => {
          const isUnlocked = unlockedSections.includes(section.id);
          return (
            <div
              key={section.id}
              className={`p-6 rounded-2xl shadow-md border transition-all duration-500 ${isUnlocked ? "bg-white/10 border-gray-400" : "bg-gray-900/40 border-gray-700 opacity-60 pointer-events-none"}`}
            >
              <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
              <p className="text-gray-400 mb-4">⏱ Duration: {section.duration}</p>

              {isUnlocked ? (
                <div className="space-y-6">
                  {section.prompts.map((prompt) => {
                    const key = `${section.id}-${prompt.id}`;
                    const userText = userAnswers[key] || "";
                    const wordCount = countWords(userText);
                    const promptFeedback = feedback[key];

                    return (
                      <div key={key} className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-5 rounded-xl border border-blue-500/30">
                        <div className="mb-3">
                          <div className="flex items-start justify-between mb-2">
                            <label className="font-bold text-lg">Prompt {prompt.id}:</label>
                            <span className="text-sm text-gray-400">Min. {prompt.minWords} words</span>
                          </div>
                          <p className="text-gray-300 italic mb-3">{prompt.prompt}</p>
                        </div>

                        <textarea
                          value={userText}
                          onChange={(e) => handleChange(section.id, prompt.id, e.target.value)}
                          className="w-full p-3 rounded-lg border border-[hsl(var(--border))] bg-white text-black min-h-[150px] resize-y"
                          placeholder="Start writing here..."
                        />

                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className={`${wordCount >= prompt.minWords ? "text-green-400" : "text-gray-400"}`}>
                            📝 Words: {wordCount} / {prompt.minWords}
                          </span>
                        </div>

                        {promptFeedback && (
                          <div className={`mt-4 p-4 rounded-lg ${promptFeedback.status === "good" ? "bg-green-500/20 border border-green-500/50" : "bg-yellow-500/20 border border-yellow-500/50"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {promptFeedback.status === "good" ? (
                                <>
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                  <span className="font-semibold text-green-400">Great work!</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-5 w-5 text-yellow-400" />
                                  <span className="font-semibold text-yellow-400">Needs improvement</span>
                                </>
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <p>
                                ✓ Word count: {promptFeedback.wordCount} / {promptFeedback.minWords} {promptFeedback.wordCount >= promptFeedback.minWords ? " ✅" : " ❌"}
                              </p>
                              <p>
                                ✓ Relevant keywords used: {promptFeedback.foundKeywords.length} / {promptFeedback.totalKeywords} {promptFeedback.foundKeywords.length >= Math.ceil(promptFeedback.totalKeywords / 2) ? " ✅" : " ❌"}
                              </p>
                              {promptFeedback.foundKeywords.length > 0 && <p className="text-green-300">Found: {promptFeedback.foundKeywords.join(", ")}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex mt-6 space-x-4">
                    {/* Show Submit if no feedback present yet for this section */}
                    {!section.prompts.some((p) => feedback[`${section.id}-${p.id}`]) && (
                      <Button
                        onClick={() => void handleSubmitSection(section.id)}
                        className="px-6 py-2 rounded-full font-pixel hover:scale-105 transition-all"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting…" : "Submit"}
                      </Button>
                    )}

                    {section.prompts.every((p) => feedback[`${section.id}-${p.id}`]) && (
                      <Button
                        onClick={() => {
                          handleDone(section.id);
                        }}
                        className="px-6 py-2 rounded-full font-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-105 transition-all"
                      >
                        {section.id === writingData.length ? "Finish 🎉" : "Done →"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">🔒 Complete the previous section to unlock this one.</p>
              )}

              {sectionIndex !== writingData.length - 1 && <hr className="mt-8 border-t border-gray-500 opacity-40" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Writing;
