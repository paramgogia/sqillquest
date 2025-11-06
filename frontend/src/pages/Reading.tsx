import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

/**
 * Reading Practice
 * - Records audio
 * - POST /api/practice/:lessonId/submit  → uploads audio + answers JSON
 * - POST /api/lessons/:lessonId/complete → marks completed, awards XP (20)
 * 
 * Expects: localStorage.skillquest_token and localStorage.user
 */

const API_BASE =
  
  "http://localhost:4000";

const api = axios.create({ baseURL: API_BASE });

const Reading = () => {
  const params = useParams<{ courseId?: string; skillName?: string }>();
  const courseId = params.courseId || params.skillName || "";
  const navigate = useNavigate();

  const [selectedAccent, setSelectedAccent] = useState("US");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  // Lesson + Course binding
  const [lessonId, setLessonId] = useState<string>("");

  // Fetch the course → find “reading” lesson if available
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const token = localStorage.getItem("skillquest_token");
        if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await api.get(`/api/courses/${courseId}`);
        const lessons = res.data?.lessons || [];
        const readingLesson =
          lessons.find((l: any) => l.type === "reading" || l.title?.toLowerCase().includes("reading")) ||
          lessons[0];
        setLessonId(readingLesson?._id || readingLesson?.id || "reading-lesson");
      } catch (err) {
        console.error("Failed to fetch course/lesson", err);
        setLessonId("reading-lesson");
      }
    };
    if (courseId) void loadCourse();
  }, [courseId]);

  const paragraph =
    "Once upon a time, in a small village, there lived a young girl who loved to explore the forests and rivers around her home.";

  const handleBack = () => navigate(-1);

  // 🎙️ Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or unsupported:", err);
      toast.error("Please allow microphone access.");
    }
  };

  // ⏹ Stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAccentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccent(e.target.value);
  };

  // 📤 Submit the audio recording → /practice + /complete
  const handleSubmit = async () => {
    if (!audioBlob) {
      toast.error("Please record your voice first!");
      return;
    }
    if (!lessonId) {
      toast.error("Lesson not found. Please refresh the page.");
      return;
    }

    const token = localStorage.getItem("skillquest_token");
    if (!token) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Submit audio to practice endpoint
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("answers", JSON.stringify({ paragraph, accent: selectedAccent }));

      const practiceRes = await api.post(`/api/practice/${lessonId}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const practice = practiceRes.data;
      const xpEarned = practice?.xpEarned || 0;
      const totalXpAfterPractice = practice?.totalXp ?? null;
      const score = practice?.score ?? 0;

      // 2️⃣ Mark lesson complete to award XP_PER_LESSON (20)
      const completeRes = await api.post(
        `/api/lessons/${lessonId}/complete`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const complete = completeRes.data;
      const lessonXp = complete?.xpAwarded ?? 20;
      const totalXpAfterComplete = complete?.totalXp ?? totalXpAfterPractice;

      // 3️⃣ Update local XP
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (totalXpAfterComplete != null) {
          user.xp = totalXpAfterComplete;
        } else {
          user.xp = (user.xp || 0) + xpEarned + lessonXp;
        }
        user.level = Math.max(1, Math.floor((user.xp || 0) / 100) + 1);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        console.warn("Failed to update local XP", err);
      }

      toast.success(`🎉 Reading submitted! Score ${score}, XP +${xpEarned + lessonXp}`);

      // optionally, fetch feedback or display scoring
      setFeedback({
        score,
        xpEarned: xpEarned + lessonXp,
        totalXp: totalXpAfterComplete || totalXpAfterPractice,
      });

      // navigate back after short delay
      setTimeout(() => navigate(`/lessons/${courseId}`), 2000);
    } catch (err: any) {
      console.error("Error submitting reading:", err);
      toast.error(err?.response?.data?.error || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 overflow-y-auto">
      <div>
        <Button variant="ghost" onClick={handleBack} className="group border-0 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-pixel text-[0.65rem]">BACK</span>
        </Button>
      </div>

      <h1 className="text-3xl font-pixel mb-8 animate-glow text-center">📖 Reading Practice</h1>

      <div className="w-full max-w-2xl space-y-6 p-6 rounded-2xl shadow-md border bg-white/10 border-gray-400">
        {/* Paragraph */}
        <div>
          <strong className="text-lg">Paragraph:</strong>
          <p className="mt-2 text-gray-300">{paragraph}</p>
        </div>

        {/* Accent selector */}
        <div>
          <label className="font-bold mr-2">Select Accent:</label>
          <select
            value={selectedAccent}
            onChange={handleAccentChange}
            className="p-2 rounded border border-[hsl(var(--border))] bg-white text-black"
          >
            <option value="US">US</option>
            <option value="UK">UK</option>
            <option value="AU">Australian</option>
            <option value="IN">Indian</option>
          </select>
        </div>

        {/* 🎙️ Recording controls */}
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-4">
            <Button
              onClick={startRecording}
              disabled={isRecording}
              className="px-4 py-2 rounded-full font-pixel"
            >
              {isRecording ? "Recording..." : "Start Recording 🎤"}
            </Button>
            <Button
              onClick={stopRecording}
              disabled={!isRecording}
              className="px-4 py-2 rounded-full font-pixel"
            >
              Stop ⏹
            </Button>
          </div>

          {audioUrl && <audio src={audioUrl} controls className="w-full mt-2" />}
        </div>

        {/* ✅ Submit */}
        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={loading || !audioBlob}
            className="px-6 py-2 rounded-full font-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-105 transition-all"
          >
            {loading ? "Uploading..." : "Submit →"}
          </Button>
        </div>

        {/* 🗣️ Feedback display */}
        {feedback && (
          <div className="mt-4 p-4 rounded bg-gray-800 text-white space-y-2">
            <h2 className="font-bold text-lg">✅ Submission Summary</h2>
            <p><strong>Score:</strong> {feedback.score ?? "—"} / 100</p>
            <p><strong>XP Earned:</strong> {feedback.xpEarned ?? 0}</p>
            <p><strong>Total XP:</strong> {feedback.totalXp ?? "—"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reading;
