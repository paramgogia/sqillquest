import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Lock, BookOpen, Headphones, FileText, Mic, Video } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Icon mapping for lesson types
const LESSON_TYPE_ICONS = {
  listening: Headphones,
  reading: BookOpen,
  writing: FileText,
  speaking: Mic,
  quiz: Mic,
  video: Video,
  text: BookOpen,
};

const LESSON_TYPE_LABELS = {
  listening: "Listening Practice",
  reading: "Reading Practice",
  writing: "Writing Practice",
  speaking: "Speaking Practice",
  quiz: "Quiz",
  video: "Video Lesson",
  text: "Text Lesson",
};

const Lessons = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Set auth header from token
  useEffect(() => {
    const token = localStorage.getItem("skillquest_token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    if (!courseId) return;
    fetchCourseAndProgress();
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
      // Fetch course details with populated lessons
      const courseRes = await api.get(`/api/courses/${courseId}`);
      const courseData = courseRes.data;
      setCourse(courseData);

      // Fetch progress for this course
      const progRes = await api.get(`/api/courses/${courseId}/progress`);
      const progressData = progRes.data || {
        lessonsCompleted: 0,
        lessonsTotal: courseData.lessons?.length || 0,
        xpEarned: 0,
        completedLessons: []
      };
      
      setProgress(progressData);

      // Set completed lesson IDs from backend progress.completedLessons array
      const completedIds = Array.isArray(progressData.completedLessons)
        ? progressData.completedLessons.map(id => String(id))
        : [];
      
      setCompletedLessonIds(completedIds);
    } catch (err) {
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

  const markLessonComplete = async (lessonId) => {
    if (!lessonId) return;
    setActionLoading(lessonId);
    try {
      const response = await api.post(`/api/lessons/${lessonId}/complete`, { courseId });
      
      if (response.data.ok) {
        toast.success(`Lesson completed! +${response.data.xpAwarded || 20} XP`);
        
        // Update local state
        setCompletedLessonIds(prev => 
          prev.includes(lessonId) ? prev : [...prev, lessonId]
        );
        
        // Refresh progress from server
        const progRes = await api.get(`/api/courses/${courseId}/progress`);
        setProgress(progRes.data || null);
      }
    } catch (err) {
      console.error("Failed to complete lesson", err);
      const errorMsg = err?.response?.data?.error || "Could not mark lesson complete";
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const navigateToLesson = (lesson) => {
    if (!lesson) return;
    
    const lessonId = lesson._id || lesson.id;
    const lessonType = lesson.type || 'text';
    
    // Map lesson types to route paths
    const typeRouteMap = {
      listening: 'listening',
      reading: 'reading',
      writing: 'writing',
      speaking: 'quiz',
      quiz: 'quiz',
      video: 'video',
      text: 'introduction'
    };
    
    const routePath = typeRouteMap[lessonType] || 'introduction';
    
    // Navigate with lessonId as query parameter
    navigate(`/lessons/${courseId}/${routePath}?lessonId=${lessonId}`);
  };

  // Group lessons by type based on the actual lesson.type field from backend
  const groupLessonsByType = () => {
    if (!course?.lessons || !Array.isArray(course.lessons)) return {};
    
    const grouped = {};
    
    course.lessons.forEach((lesson, index) => {
      const type = lesson.type || 'text';
      
      if (!grouped[type]) {
        grouped[type] = [];
      }
      
      grouped[type].push({
        ...lesson,
        order: lesson.order ?? index + 1,
        id: lesson._id || lesson.id
      });
    });
    
    // Sort lessons within each group by order
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => a.order - b.order);
    });
    
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg text-purple-300 font-semibold">Loading Course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <p className="text-xl text-purple-300 font-semibold">Course not found.</p>
          <Button 
            onClick={() => navigate('/skills')} 
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const groupedLessons = groupLessonsByType();
  const totalLessons = course.lessons?.length || 0;
  const completedCount = completedLessonIds.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Define display order for lesson types
  const typeDisplayOrder = ['text', 'video', 'listening', 'reading', 'writing', 'speaking', 'quiz'];
  const orderedTypes = typeDisplayOrder.filter(type => groupedLessons[type]);

  return (
    <div className="min-h-screen ">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/skills')}
            className="mb-4 text-purple-300 hover:text-purple-100 hover:bg-purple-800/30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
            <p className="text-purple-200 mb-4">{course.description}</p>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-purple-300">
                <span>{completedCount} / {totalLessons} lessons completed</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-right text-sm text-purple-300">
                XP Earned: {progress?.xpEarned || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Lessons by Type */}
        <div className="space-y-8">
          {orderedTypes.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 text-center">
              <p className="text-purple-300 text-lg">No lessons available yet.</p>
            </div>
          ) : (
            orderedTypes.map(type => {
              const lessons = groupedLessons[type];
              const Icon = LESSON_TYPE_ICONS[type] || BookOpen;
              const label = LESSON_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1);
              
              return (
                <div key={type} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-600/20 rounded-lg">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{label}</h2>
                    <span className="ml-auto text-sm text-purple-300">
                      {lessons.filter(l => completedLessonIds.includes(String(l.id))).length} / {lessons.length} completed
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lessons.map((lesson) => {
                      const lessonId = String(lesson.id);
                      const isCompleted = completedLessonIds.includes(lessonId);
                      const isProcessing = actionLoading === lessonId;
                      
                      return (
                        <div 
                          key={lessonId}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-300
                            ${isCompleted 
                              ? 'bg-purple-600/20 border-purple-500/50' 
                              : 'bg-slate-700/50 border-slate-600 hover:border-purple-500/50'
                            }
                          `}
                        >
                          {isCompleted && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                          )}
                          
                          <h3 className="text-lg font-semibold text-white mb-2 pr-8">
                            {lesson.title}
                          </h3>
                          
                          {lesson.durationMinutes && (
                            <p className="text-sm text-purple-300 mb-3">
                              Duration: {lesson.durationMinutes} min
                            </p>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => navigateToLesson(lesson)}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                              size="sm"
                            >
                              {isCompleted ? 'Review' : 'Start'}
                            </Button>
                            
                            {!isCompleted && (
                              <Button
                                onClick={() => markLessonComplete(lessonId)}
                                disabled={isProcessing}
                                variant="outline"
                                size="sm"
                                className="border-purple-500/50 text-purple-300 hover:bg-purple-600/20"
                              >
                                {isProcessing ? 'Completing...' : 'Complete'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mock Test Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Final Assessment</h2>
              <p className="text-purple-200">Test your knowledge with a comprehensive mock test</p>
            </div>
            <Button
              onClick={() => navigate(`/lessons/${courseId}/mock-test`)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6"
              disabled={completedCount < totalLessons * 0.5}
            >
              {completedCount < totalLessons * 0.5 ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Complete 50% to Unlock
                </>
              ) : (
                'Take Mock Test'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lessons;