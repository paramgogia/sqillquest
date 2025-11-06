import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Reading = () => {
  const { skillName } = useParams();
  const navigate = useNavigate();

  const [selectedAccent, setSelectedAccent] = useState("US");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const paragraph = `Once upon a time, in a small village, there lived a young girl who loved to explore the forests and rivers around her home.`;

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
      console.error("Microphone access denied or not supported:", err);
      alert("Please allow microphone access.");
    }
  };

  // ⏹ Stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // 🌍 Accent selector
  const handleAccentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccent(e.target.value);
  };

  // 📤 Submit for analysis
  const handleDone = async () => {
    if (!audioBlob) {
      alert("Please record your voice first.");
      return;
    }

    setLoading(true);
    setSubmitted(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("text", paragraph);
    formData.append("accent", selectedAccent);

    try {
      const res = await fetch("http://localhost:5000/api/analyze-pronunciation", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error(err);
      alert("Error submitting recording");
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 overflow-y-auto">
      {/* 🔙 Back button */}
      <div>
        <Button variant="ghost" onClick={handleBack} className="group border-0">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-pixel text-[0.65rem]">BACK</span>
        </Button>
      </div>

      {/* 📖 Title */}
      <h1 className="text-3xl font-pixel mb-8 animate-glow text-center">
        📖 Reading Practice
      </h1>

      {/* 🧾 Main card */}
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

          {audioUrl && (
            <audio src={audioUrl} controls className="w-full mt-2" />
          )}
        </div>

        {/* ✅ Submit */}
        <div className="mt-6">
          <Button
            onClick={handleDone}
            disabled={submitted || loading}
            className="px-6 py-2 rounded-full font-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-105 transition-all"
          >
            {loading ? "Analyzing..." : submitted ? "Submitted ✅" : "Done →"}
          </Button>
        </div>

        {/* 🗣️ Feedback display */}
        {feedback && (
          <div className="mt-4 p-4 rounded bg-gray-800 text-white space-y-2">
            <h2 className="font-bold text-lg">Feedback:</h2>
            <p><strong>Accuracy Score:</strong> {feedback.accuracy_score ?? "—"}%</p>
            <p><strong>Feedback:</strong> {feedback.pronunciation_feedback}</p>

            {feedback.missing_words?.length > 0 && (
              <p><strong>Missing Words:</strong> {feedback.missing_words.join(", ")}</p>
            )}
            {feedback.mispronounced_words?.length > 0 && (
              <p><strong>Mispronounced Words:</strong> {feedback.mispronounced_words.join(", ")}</p>
            )}
            <p className="text-gray-400 text-sm mt-2 italic">
              Transcript: "{feedback.transcript}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reading;
