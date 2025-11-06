import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, CheckCircle, XCircle, Volume2 } from "lucide-react";

const speakingData = [
  {
    id: 1,
    title: "Section 1 - Basic Pronunciation",
    duration: "10 mins",
    sentences: [
      { 
        id: 1, 
        text: "Hello, my name is John and I live in New York.",
        difficulty: "easy"
      },
      { 
        id: 2, 
        text: "I enjoy reading books and watching movies on weekends.",
        difficulty: "easy"
      },
    ],
  },
  {
    id: 2,
    title: "Section 2 - Descriptive Speech",
    duration: "15 mins",
    sentences: [
      { 
        id: 1, 
        text: "My favorite vacation destination is the beautiful beaches of Hawaii with crystal clear water.",
        difficulty: "medium"
      },
      { 
        id: 2, 
        text: "Yesterday I had a delicious Italian meal at a cozy restaurant with my family.",
        difficulty: "medium"
      },
    ],
  },
  {
    id: 3,
    title: "Section 3 - Opinion Expression",
    duration: "20 mins",
    sentences: [
      { 
        id: 1, 
        text: "In my opinion, social media has both positive and negative impacts on modern society.",
        difficulty: "hard"
      },
      { 
        id: 2, 
        text: "I believe that students should have homework because it reinforces learning and builds discipline.",
        difficulty: "hard"
      },
    ],
  },
  {
    id: 4,
    title: "Section 4 - Advanced Speaking",
    duration: "25 mins",
    sentences: [
      { 
        id: 1, 
        text: "The magnificent architecture of ancient civilizations continues to inspire modern designers around the world.",
        difficulty: "hard"
      },
      { 
        id: 2, 
        text: "Environmental conservation requires immediate attention and collective effort from all nations globally.",
        difficulty: "hard"
      },
    ],
  },
];

const Speaking = () => {
  const { skillName } = useParams();
  const navigate = useNavigate();
  
  const [userRecordings, setUserRecordings] = useState({});
  const [feedback, setFeedback] = useState({});
  const [unlockedSections, setUnlockedSections] = useState([1]);
  const [isRecording, setIsRecording] = useState({});
  const [recognition, setRecognition] = useState(null);
  const [browserSupport, setBrowserSupport] = useState(true);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      setRecognition(recognitionInstance);
    } else {
      setBrowserSupport(false);
    }
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const speakSentence = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
    const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
    
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    let matches = 0;
    const maxLength = Math.max(words1.length, words2.length);
    
    words1.forEach(word => {
      if (words2.includes(word)) {
        matches++;
      }
    });
    
    return (matches / maxLength) * 100;
  };

  const handleStartRecording = (sectionId, sentenceId, targetText) => {
    const key = `${sectionId}-${sentenceId}`;
    
    if (!recognition) return;

    setIsRecording({ ...isRecording, [key]: true });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserRecordings({ ...userRecordings, [key]: transcript });
      
      const similarity = calculateSimilarity(transcript, targetText);
      const words1 = targetText.toLowerCase().split(/\s+/);
      const words2 = transcript.toLowerCase().split(/\s+/);
      
      const missingWords = words1.filter(word => 
        !words2.some(w => w.includes(word) || word.includes(w))
      );
      
      const extraWords = words2.filter(word => 
        !words1.some(w => w.includes(word) || word.includes(w))
      );

      setFeedback({
        ...feedback,
        [key]: {
          status: similarity >= 70 ? "good" : "needsWork",
          similarity: Math.round(similarity),
          transcript,
          missingWords,
          extraWords
        }
      });
      
      setIsRecording({ ...isRecording, [key]: false });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording({ ...isRecording, [key]: false });
    };

    recognition.onend = () => {
      setIsRecording({ ...isRecording, [key]: false });
    };

    recognition.start();
  };

  const handleStopRecording = (sectionId, sentenceId) => {
    const key = `${sectionId}-${sentenceId}`;
    if (recognition) {
      recognition.stop();
    }
    setIsRecording({ ...isRecording, [key]: false });
  };

  const handleRetry = (sectionId, sentenceId) => {
    const key = `${sectionId}-${sentenceId}`;
    setUserRecordings({ ...userRecordings, [key]: "" });
    setFeedback({ ...feedback, [key]: null });
  };

  const handleDone = (sectionId) => {
    if (sectionId < speakingData.length) {
      setUnlockedSections((prev) => [...new Set([...prev, sectionId + 1])]);
    }

    if (sectionId === speakingData.length) {
      const completedSteps =
        JSON.parse(localStorage.getItem(`${skillName}-completed`)) || [];
      const newCompleted = [...new Set([...completedSteps, 24])]; // Speaking ID is 24
      localStorage.setItem(`${skillName}-completed`, JSON.stringify(newCompleted));
      navigate(`/lessons/${skillName}`);
    }
  };

  if (!browserSupport) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6">
        <h1 className="text-2xl font-pixel mb-4">Browser Not Supported</h1>
        <p className="text-gray-400 text-center max-w-md">
          Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for this feature.
        </p>
        <Button onClick={handleBack} className="mt-6">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 overflow-y-auto">
      <div>
        <Button variant="ghost" onClick={handleBack} className="group border-0">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-pixel text-[0.65rem]">BACK</span>
        </Button>
      </div>
      <h1 className="text-3xl font-pixel mb-8 animate-glow text-center">
        🎤 Speaking Practice
      </h1>

      <div className="w-full max-w-3xl space-y-12">
        {speakingData.map((section, sectionIndex) => {
          const isUnlocked = unlockedSections.includes(section.id);
          const allCompleted = section.sentences.every(
            (s) => feedback[`${section.id}-${s.id}`]?.status === "good"
          );

          return (
            <div
              key={section.id}
              className={`p-6 rounded-2xl shadow-md border transition-all duration-500 ${
                isUnlocked
                  ? "bg-white/10 border-gray-400"
                  : "bg-gray-900/40 border-gray-700 opacity-60 pointer-events-none"
              }`}
            >
              <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
              <p className="text-gray-400 mb-4">⏱ Duration: {section.duration}</p>

              {isUnlocked ? (
                <div className="space-y-6">
                  {section.sentences.map((sentence) => {
                    const key = `${section.id}-${sentence.id}`;
                    const isRecordingThis = isRecording[key];
                    const sentenceFeedback = feedback[key];
                    const userTranscript = userRecordings[key];

                    return (
                      <div key={key} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-5 rounded-xl border border-purple-500/30">
                        <div className="mb-3">
                          <div className="flex items-start justify-between mb-2">
                            <label className="font-bold text-lg">
                              Sentence {sentence.id}:
                            </label>
                            <span className={`text-xs px-2 py-1 rounded ${
                              sentence.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                              sentence.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {sentence.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-gray-200 text-lg flex-1">{sentence.text}</p>
                            <Button
                              onClick={() => speakSentence(sentence.text)}
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                            {!sentenceFeedback || sentenceFeedback.status !== "good" ? (
                              <>
                                <Button
                                  onClick={() => isRecordingThis 
                                    ? handleStopRecording(section.id, sentence.id)
                                    : handleStartRecording(section.id, sentence.id, sentence.text)
                                  }
                                  className={`flex-1 ${isRecordingThis ? 'bg-red-500 hover:bg-red-600' : ''}`}
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
                                  <Button
                                    onClick={() => handleRetry(section.id, sentence.id)}
                                    variant="outline"
                                  >
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
                              <div className="h-2 w-2 bg-red-400 rounded-full animate-ping"></div>
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
                            <div className={`p-4 rounded-lg ${
                              sentenceFeedback.status === "good" 
                                ? "bg-green-500/20 border border-green-500/50" 
                                : "bg-yellow-500/20 border border-yellow-500/50"
                            }`}>
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
                                <p>
                                  Accuracy: {sentenceFeedback.similarity}%
                                  {sentenceFeedback.similarity >= 70 ? " ✅" : " ❌"}
                                </p>
                                {sentenceFeedback.missingWords.length > 0 && (
                                  <p className="text-red-300">
                                    Missing words: {sentenceFeedback.missingWords.join(", ")}
                                  </p>
                                )}
                                {sentenceFeedback.extraWords.length > 0 && (
                                  <p className="text-orange-300">
                                    Extra words: {sentenceFeedback.extraWords.join(", ")}
                                  </p>
                                )}
                                {sentenceFeedback.status !== "good" && (
                                  <p className="text-gray-300 mt-2">
                                    💡 Tip: Speak clearly and at a moderate pace. Try again!
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {allCompleted && (
                    <div className="flex mt-6">
                      <Button
                        onClick={() => handleDone(section.id)}
                        className="px-6 py-2 rounded-full font-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-105 transition-all"
                      >
                        {section.id === speakingData.length
                          ? "Finish 🎉"
                          : "Done →"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  🔒 Complete the previous section to unlock this one.
                </p>
              )}

              {sectionIndex !== speakingData.length - 1 && (
                <hr className="mt-8 border-t border-gray-500 opacity-40" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-4 bg-white/5 rounded-lg border border-gray-600 max-w-3xl">
        <h3 className="font-pixel text-sm mb-2">🎯 Tips for Success:</h3>
        <ul className="text-xs space-y-1 text-gray-300">
          <li>🎤 Speak clearly and at a moderate pace</li>
          <li>🔊 Click the speaker icon to hear the sentence</li>
          <li>✅ Achieve 70% accuracy to pass each sentence</li>
          <li>🔄 You can retry as many times as needed</li>
        </ul>
      </div>
    </div>
  );
};

export default Speaking;