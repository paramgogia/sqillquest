import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, CheckCircle, XCircle, Volume2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

/**
 * Speaking.tsx
 * - If ?lessonId= is present and the lesson type === 'quiz', render a quiz based on lesson.resources
 * - Quiz resources expected: ["Question 1: ... || Answer: ...", "Question 2: ... || Answer: ..."]
 * - Submits to POST /api/practice/:lessonId/submit  { answers }  -> returns { score, xpEarned, totalXp }
 * - Then marks lesson complete: POST /api/lessons/:lessonId/complete  { courseId }
 *
 * Fallback: original speaking experience (speech recognition)
 */

const API_BASE = "http://localhost:4000";
const api = axios.create({ baseURL: API_BASE, headers: { "Content-Type": "application/json" } });

const speakingData = [
  {
    id: 1,
    title: "Section 1 - Basic Pronunciation",
    duration: "10 mins",
    sentences: [
      { id: 1, text: "Hello, my name is John and I live in New York.", difficulty: "easy" },
      { id: 2, text: "I enjoy reading books and watching movies on weekends.", difficulty: "easy" },
    ],
  },
  // ... (keeps your existing fallback sections)
];

const Speaking = () => {
  const { skillName } = useParams();
  const [searchParams] = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId") || undefined;
  const navigate = useNavigate();

  // quiz-related state
  const [isQuiz, setIsQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<
    { qid: string; question: string; answer?: string }[]
  >([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // original speaking states (fallback)
  const [userRecordings, setUserRecordings] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, any>>({});
  const [unlockedSections, setUnlockedSections] = useState<number[]>([1]);
  const [isRecording, setIsRecording] = useState<Record<string, boolean>>({});
  const [recognition, setRecognition] = useState<any>(null);
  const [browserSupport, setBrowserSupport] = useState(true);

  // set auth header if token exists
  useEffect(() => {
    const token = localStorage.getItem("skillquest_token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // attempt to load lesson if lessonId present
  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonIdParam) return;
      try {
        const res = await api.get(`/api/lessons/${lessonIdParam}`);
        const lesson = res?.data;
        if (!lesson) return;

        // If lesson.type is quiz, parse resources
        if ((lesson.type || "").toLowerCase() === "quiz") {
          setIsQuiz(true);
          setQuizTitle(lesson.title || "Quiz");

          const resources: string[] = Array.isArray(lesson.resources) ? lesson.resources : [];

          const parsed = resources.map((r, idx) => {
            // try splitting by "||" or "||"
            const parts = r.split("||").map((s) => s.trim());
            let qtext = parts[0] || `Question ${idx + 1}`;
            let ans: string | undefined = undefined;

            // attempt to extract "Answer:" token from any part
            for (const part of parts.slice(1)) {
              const lower = part.toLowerCase();
              if (lower.startsWith("answer:")) {
                ans = part.replace(/^[aA]nswer:\s*/i, "").trim();
                break;
              }
            }

            // fallback: try to extract "Answer:" inside the first part as well
            if (!ans) {
              const match = qtext.match(/\|\|\s*answer:\s*(.+)$/i);
              if (match) {
                ans = match[1].trim();
                qtext = qtext.replace(/\|\|\s*answer:\s*(.+)$/i, "").trim();
              }
            }

            // also trim "Question X:" if present
            qtext = qtext.replace(/^[qQ]uestion\s*\d*\s*[:.-]?\s*/i, "").trim();

            return { qid: String(idx + 1), question: qtext, answer: ans };
          });

          setQuizQuestions(parsed);
        } else {
          // not a quiz - keep fallback speaking behaviour
          setIsQuiz(false);
        }
      } catch (err) {
        console.error("Could not fetch lesson:", err);
        // on error just fallback to built-in speakingData
        setIsQuiz(false);
      }
    };
    void loadLesson();
  }, [lessonIdParam]);

  // ------------------------
  // Quiz handlers
  // ------------------------
  const handleQuizAnswerChange = (qid: string, value: string) => {
    setQuizAnswers((p) => ({ ...p, [qid]: value }));
  };

  const submitQuiz = async () => {
    if (!lessonIdParam) {
      toast.error("Lesson id missing");
      return;
    }
    const token = localStorage.getItem("skillquest_token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    // build answers payload using the qid keys
    const answersPayload: Record<string, string> = {};
    for (const q of quizQuestions) {
      answersPayload[`q${q.qid}`] = (quizAnswers[q.qid] || "").toString();
    }

    setQuizSubmitting(true);
    try {
      // 1) Submit practice (answers). Server returns xpEarned, score, totalXp...
      const practiceResp = await api.post(`/api/practice/${lessonIdParam}/submit`, {
        answers: answersPayload,
      });

      const practiceData = practiceResp?.data || {};
      const xpFromPractice = practiceData.xpEarned ?? 0;
      const score = practiceData.score ?? 0;
      const totalXpAfterPractice = practiceData.totalXp ?? null;

      // 2) Mark lesson complete (award lesson XP) - send courseId if available (skillName used as courseId in your routes)
      const completeResp = await api.post(`/api/lessons/${lessonIdParam}/complete`, {
        courseId: skillName || undefined,
      });

      const completeData = completeResp?.data || {};
      const xpFromComplete = completeData.xpAwarded ?? completeData.xpEarned ?? 0;
      const totalXpAfterComplete = completeData.totalXp ?? totalXpAfterPractice;

      // update localStorage user xp/level if server returned totals
      try {
        const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
        if (totalXpAfterComplete != null) {
          userLocal.xp = totalXpAfterComplete;
        } else {
          userLocal.xp = (userLocal.xp || 0) + xpFromPractice + xpFromComplete;
        }
        userLocal.level = Math.max(1, Math.floor((userLocal.xp || 0) / 100) + 1);
        localStorage.setItem("user", JSON.stringify(userLocal));
      } catch (e) {
        console.warn("Could not update local user xp", e);
      }

      // build local feedback by comparing known answers (if resource had answers)
      const localFeedback: Record<string, "correct" | "wrong"> = {};
      for (const q of quizQuestions) {
        const correct = (q.answer || "").toString().trim().toLowerCase();
        const given = (quizAnswers[q.qid] || "").toString().trim().toLowerCase();
        localFeedback[q.qid] = correct && given && given === correct ? "correct" : "wrong";
      }

      // show result
      setQuizSubmitting(false);
      toast.success(`Quiz submitted — score:${score} • +${(xpFromPractice || 0) + (xpFromComplete || 0)} XP`);
      // optionally show a small result view (we'll mark local feedback)
      // map to feedback shape for rendering
      const fb: Record<string, any> = {};
      for (const [qid, val] of Object.entries(localFeedback)) {
        fb[qid] = { status: val };
      }
      setFeedback(fb);

      // navigate back to lessons overview after a small delay
      setTimeout(() => {
        navigate(`/lessons/${skillName}`);
      }, 900);
    } catch (err: any) {
      console.error("Quiz submit error:", err);
      toast.error(err?.response?.data?.error || "Failed to submit quiz");
      setQuizSubmitting(false);
    }
  };

  // ------------------------
  // Original speech-recognition setup (fallback)
  // ------------------------
  useEffect(() => {
    if (isQuiz) return; // do not init speech recognition for quiz mode
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = "en-US";
        setRecognition(recognitionInstance);
      } catch (e) {
        console.warn("SpeechRecognition init failed", e);
        setBrowserSupport(false);
      }
    } else {
      setBrowserSupport(false);
    }
  }, [isQuiz]);

  const speakSentence = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const calculateSimilarity = (str1: string, str2: string) => {
    const s1 = str1.toLowerCase().replace(/[^\w\s]/g, "");
    const s2 = str2.toLowerCase().replace(/[^\w\s]/g, "");

    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);

    let matches = 0;
    const maxLength = Math.max(words1.length, words2.length);

    words1.forEach((word) => {
      if (words2.includes(word)) {
        matches++;
      }
    });

    return (matches / maxLength) * 100;
  };

  const handleStartRecording = (sectionId: number, sentenceId: number, targetText: string) => {
    const key = `${sectionId}-${sentenceId}`;

    if (!recognition) return;

    setIsRecording((p) => ({ ...p, [key]: true }));

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserRecordings((p) => ({ ...p, [key]: transcript }));

      const similarity = calculateSimilarity(transcript, targetText);
      const words1 = targetText.toLowerCase().split(/\s+/);
      const words2 = transcript.toLowerCase().split(/\s+/);

      const missingWords = words1.filter((word) => !words2.some((w) => w.includes(word) || word.includes(w)));
      const extraWords = words2.filter((word) => !words1.some((w) => w.includes(word) || word.includes(w)));

      setFeedback((p) => ({
        ...p,
        [key]: {
          status: similarity >= 70 ? "good" : "needsWork",
          similarity: Math.round(similarity),
          transcript,
          missingWords,
          extraWords,
        },
      }));

      setIsRecording((p) => ({ ...p, [key]: false }));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording((p) => ({ ...p, [key]: false }));
    };

    recognition.onend = () => {
      setIsRecording((p) => ({ ...p, [key]: false }));
    };

    recognition.start();
  };

  const handleStopRecording = (sectionId: number, sentenceId: number) => {
    const key = `${sectionId}-${sentenceId}`;
    if (recognition) recognition.stop();
    setIsRecording((p) => ({ ...p, [key]: false }));
  };

  const handleRetry = (sectionId: number, sentenceId: number) => {
    const key = `${sectionId}-${sentenceId}`;
    setUserRecordings((p) => ({ ...p, [key]: "" }));
    setFeedback((p) => ({ ...p, [key]: null }));
  };

  const handleDone = (sectionId: number) => {
    if (sectionId < speakingData.length) {
      setUnlockedSections((prev) => [...new Set([...prev, sectionId + 1])]);
    }

    if (sectionId === speakingData.length) {
      const completedSteps = JSON.parse(localStorage.getItem(`${skillName}-completed`) || "[]");
      const newCompleted = [...new Set([...completedSteps, 24])];
      localStorage.setItem(`${skillName}-completed`, JSON.stringify(newCompleted));
      navigate(`/lessons/${skillName}`);
    }
  };

   const handleBack = () => navigate(-1);


  // ------------------------
  // Render
  // ------------------------
  // Back button + title
  return (
    <div className="min-h-screen flex flex-col items-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 overflow-y-auto">
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="group border-0">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-pixel text-[0.65rem]">BACK</span>
        </Button>
      </div>

      {isQuiz ? (
        // Quiz UI
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-pixel mb-6 animate-glow text-center">🧠 {quizTitle}</h1>

          <div className="space-y-6">
            {quizQuestions.map((q) => {
              const correct = (q.answer || "").toString();
              const given = (quizAnswers[q.qid] || "").toString();
              const passed = correct && given && given.trim().toLowerCase() === correct.trim().toLowerCase();
              return (
                <div key={q.qid} className="p-4 rounded-xl bg-white/5 border border-gray-600">
                  <div className="mb-2">
                    <div className="font-semibold">Question {q.qid}</div>
                    <div className="text-sm text-gray-300">{q.question}</div>
                  </div>

                  <input
                    value={quizAnswers[q.qid] || ""}
                    onChange={(e) => handleQuizAnswerChange(q.qid, e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full p-2 rounded border bg-white text-black"
                    disabled={quizSubmitting}
                  />

                  {feedback[q.qid] && (
                    <div className={`mt-2 p-2 rounded ${feedback[q.qid].status === "correct" ? "bg-green-700/20 border border-green-600" : "bg-red-700/10 border border-red-600"}`}>
                      <div className="text-sm">{feedback[q.qid].status === "correct" ? "Correct ✅" : "Wrong ❌"}</div>
                      {q.answer && <div className="text-xs text-muted-foreground mt-1">Answer: {q.answer}</div>}
                    </div>
                  )}

                  {/* local compare preview */}
                  {!feedback[q.qid] && q.answer && quizAnswers[q.qid] && (
                    <div className={`mt-2 text-sm ${passed ? "text-green-400" : "text-yellow-300"}`}>{passed ? "Looks correct" : "May be incorrect"}</div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-4 mt-4">
              <Button onClick={() => void submitQuiz()} disabled={quizSubmitting} className="px-6 py-2">
                {quizSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/lessons/${skillName}`)} disabled={quizSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Fallback: original speaking UI
        <div className="w-full max-w-3xl space-y-12">
          <h1 className="text-3xl font-pixel mb-8 animate-glow text-center">🎤 Speaking Practice</h1>

          {speakingData.map((section, sectionIndex) => {
            const isUnlocked = unlockedSections.includes(section.id);
            const allCompleted = section.sentences.every((s) => feedback[`${section.id}-${s.id}`]?.status === "good");

            return (
              <div
                key={section.id}
                className={`p-6 rounded-2xl shadow-md border transition-all duration-500 ${
                  isUnlocked ? "bg-white/10 border-gray-400" : "bg-gray-900/40 border-gray-700 opacity-60 pointer-events-none"
                }`}
              >
                <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
                <p className="text-gray-400 mb-4">⏱ Duration: {section.duration}</p>

                {isUnlocked ? (
                  <div className="space-y-6">
                    {section.sentences.map((sentence) => {
                      const key = `${section.id}-${sentence.id}`;
                      const isRecordingThis = !!isRecording[key];
                      const sentenceFeedback = feedback[key];
                      const userTranscript = userRecordings[key];

                      return (
                        <div key={key} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-5 rounded-xl border border-purple-500/30">
                          <div className="mb-3">
                            <div className="flex items-start justify-between mb-2">
                              <label className="font-bold text-lg">Sentence {sentence.id}:</label>
                              <span className={`text-xs px-2 py-1 rounded ${sentence.difficulty === "easy" ? "bg-green-500/20 text-green-400" : sentence.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                                {sentence.difficulty.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-gray-200 text-lg flex-1">{sentence.text}</p>
                              <Button onClick={() => speakSentence(sentence.text)} variant="outline" size="sm" className="shrink-0">
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              {!sentenceFeedback || sentenceFeedback.status !== "good" ? (
                                <>
                                  <Button
                                    onClick={() =>
                                      isRecordingThis ? handleStopRecording(section.id, sentence.id) : handleStartRecording(section.id, sentence.id, sentence.text)
                                    }
                                    className={`flex-1 ${isRecordingThis ? "bg-red-500 hover:bg-red-600" : ""}`}
                                  >
                                    {isRecordingThis ? (
                                      <>
                                        <MicOff className="mr-2 h-4 w-4" />
                                        Stop Recording
                                      </>
                                    ) : (
                                      <>
                                        <Mic className="mr-2 h-4 w-4" />
                                        Start Recording
                                      </>
                                    )}
                                  </Button>
                                  {sentenceFeedback && (
                                    <Button onClick={() => handleRetry(section.id, sentence.id)} variant="outline">
                                      Retry
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <div className="flex-1 flex items-center justify-center gap-2 text-green-400">
                                  <CheckCircle className="h-5 w-5" />
                                  <span className="font-semibold">Perfect!</span>
                                </div>
                              )}
                            </div>

                            {isRecordingThis && (
                              <div className="flex items-center justify-center gap-2 text-red-400 animate-pulse">
                                <div className="h-2 w-2 bg-red-400 rounded-full animate-ping" />
                                <span className="text-sm">Recording...</span>
                              </div>
                            )}

                            {userTranscript && (
                              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                <p className="text-sm text-gray-400 mb-1">You said:</p>
                                <p className="text-white">{userTranscript}</p>
                              </div>
                            )}

                            {sentenceFeedback && (
                              <div className={`p-4 rounded-lg ${sentenceFeedback.status === "good" ? "bg-green-500/20 border border-green-500/50" : "bg-yellow-500/20 border border-yellow-500/50"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {sentenceFeedback.status === "good" ? (
                                    <>
                                      <CheckCircle className="h-5 w-5 text-green-400" />
                                      <span className="font-semibold text-green-400">Excellent pronunciation!</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-5 w-5 text-yellow-400" />
                                      <span className="font-semibold text-yellow-400">Keep practicing!</span>
                                    </>
                                  )}
                                </div>
                                <div className="space-y-2 text-sm">
                                  <p>Accuracy: {sentenceFeedback.similarity}%{sentenceFeedback.similarity >= 70 ? " ✅" : " ❌"}</p>
                                  {sentenceFeedback.missingWords?.length > 0 && <p className="text-red-300">Missing words: {sentenceFeedback.missingWords.join(", ")}</p>}
                                  {sentenceFeedback.extraWords?.length > 0 && <p className="text-orange-300">Extra words: {sentenceFeedback.extraWords.join(", ")}</p>}
                                  {sentenceFeedback.status !== "good" && <p className="text-gray-300 mt-2">💡 Tip: Speak clearly and at a moderate pace. Try again!</p>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {allCompleted && (
                      <div className="flex mt-6">
                        <Button onClick={() => handleDone(section.id)} className="px-6 py-2 rounded-full font-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-105 transition-all">
                          {section.id === speakingData.length ? "Finish 🎉" : "Done →"}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">🔒 Complete the previous section to unlock this one.</p>
                )}

                {sectionIndex !== speakingData.length - 1 && <hr className="mt-8 border-t border-gray-500 opacity-40" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Speaking;
