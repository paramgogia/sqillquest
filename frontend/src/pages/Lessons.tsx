import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const lessonSteps = [
    { id: 1, title: "Introduction", path: "introduction" },
    {
        id: 2,
        title: "Start Learning",
        subsections: [
            { id: 21, title: "Listening", path: "listening" },
            { id: 22, title: "Reading", path: "reading" },
            { id: 23, title: "Writing", path: "writing" },
            { id: 24, title: "Speaking", path: "speaking" },
        ],
    },
    { id: 3, title: "Mock Test", path: "mock-test" },
];

const Lessons = () => {
    const { skillName } = useParams();
    const navigate = useNavigate();
    const [completedSteps, setCompletedSteps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProgress();
    }, [skillName]);

    const fetchProgress = async () => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            toast.error("Please login first");
            navigate("/login");
            return;
        }

        try {
            const response = await axios.get(
                `http://localhost:5000/api/lessons/${skillName}/progress`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            setCompletedSteps(response.data.completedSteps || []);
        } catch (error: any) {
            console.error("Error fetching progress:", error);
            // If no progress exists, start with empty array
            setCompletedSteps([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStepClick = (step: any, parentId: any) => {
        if (!parentId) {
            if (step.id === 1 || completedSteps.includes(step.id - 1)) {
                navigate(`/lessons/${skillName}/${step.path}`);
            }
        } else {
            const parent = lessonSteps.find((s) => s.id === parentId);
            const subs = parent?.subsections || [];
            const subIndex = subs.findIndex((s) => s.id === step.id);

            if (subIndex === 0 || completedSteps.includes(subs[subIndex - 1].id)) {
                navigate(`/lessons/${skillName}/${step.path}`);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
                <p className="font-pixel text-primary animate-glow">LOADING LESSONS...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6">
            <h1 className="text-3xl font-pixel mb-6 animate-glow text-center">
                📚 Lessons for {skillName?.replace("-", " ").toUpperCase()}
            </h1>

            <div className="flex flex-col items-center space-y-8 w-full max-w-md mt-6">
                {lessonSteps.map((step, index) => {
                    const isUnlocked = step.id === 1 || completedSteps.includes(step.id - 1);
                    const isCompleted = completedSteps.includes(step.id);

                    return (
                        <div key={step.id} className="relative flex flex-col items-center w-full">
                            <Button
                                onClick={() => (step.subsections ? null : handleStepClick(step, null))}
                                disabled={!isUnlocked}
                                className={`px-6 py-3 rounded-full font-pixel text-sm border-2 border-[hsl(var(--border))] shadow-lg transition-transform duration-200 ${isUnlocked
                                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:scale-110"
                                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                                    }`}
                            >
                                {step.title}
                                {isCompleted && (
                                    <CheckCircle className="ml-2 w-5 h-5 text-[hsl(var(--accent))] animate-pulse" />
                                )}
                            </Button>

                            {step.subsections && isUnlocked && (
                                <div className="flex flex-wrap justify-center gap-4 mt-4">
                                    {step.subsections.map((sub) => {
                                        const isSubCompleted = completedSteps.includes(sub.id);
                                        return (
                                            <Button
                                                key={sub.id}
                                                onClick={() => handleStepClick(sub, step.id)}
                                                className={`px-4 py-2 rounded-full font-pixel text-sm border-2 border-[hsl(var(--border))] shadow-md transition-transform duration-200 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:scale-110`}
                                            >
                                                {sub.title}
                                                {isSubCompleted && (
                                                    <CheckCircle className="ml-1 w-4 h-4 text-[hsl(var(--accent))] animate-pulse" />
                                                )}
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}

                            {index < lessonSteps.length - 1 && (
                                <div className="w-1 h-12 mt-2 relative">
                                    <div className="absolute top-0 left-0 w-1 h-12 bg-[hsl(var(--accent))] animate-flicker"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Lessons;