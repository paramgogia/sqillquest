import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";


const Introduction = () => {
    const { skillName } = useParams();
    const navigate = useNavigate();
    const handleBack = () => {
        navigate(-1);
    };

    const handleDone = () => {
        // Save completion for this step
        const completed = JSON.parse(localStorage.getItem(`${skillName}-completed`)) || [];
        if (!completed.includes(1)) completed.push(1);
        localStorage.setItem(`${skillName}-completed`, JSON.stringify(completed));

        // Go back to Lessons page
        navigate(`/lessons/${skillName}`);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6">

            {/* Back Button */}
            <div>
                <Button variant="ghost" onClick={handleBack} className="group border-0">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-pixel text-[0.65rem]">BACK</span>
                </Button>
            </div>
            <h1 className="text-3xl font-pixel mb-6 animate-glow">Introduction to IELTS</h1>
            <p className="text-sm mb-8 text-[hsl(var(--primary-foreground))]">
                Welcome to the Introduction lesson. Here you will learn the basics of IELTS reading, writing, speaking, and listening.
                IELTS (International English Language Testing System) is the world's most popular English language proficiency test for higher education and global migration. Developed by the British Council, IDP: IELTS Australia, and Cambridge English, it assesses four skills: listening, reading, writing, and speaking, using a 9-band scale to measure proficiency from non-user to expert. Accepted by over 10,000 organizations worldwide, including universities, employers, and immigration authorities, IELTS helps people demonstrate their English ability for academic, professional, and migration purposes.  [1, 2, 3, 4, 5] <br></br>
                Key Aspects of IELTS

                • Purpose: To evaluate the English language ability of non-native speakers for work, study, or migration in English-speaking countries. [4, 5]
                • Test Providers: Jointly owned and developed by the British Council, IDP: IELTS Australia, and Cambridge English. [2, 6]
                • Structure: The test assesses four language skills: [3]
                • Listening: Evaluates the ability to understand spoken English. [7]
                • Reading: Assesses comprehension of written English. [3, 7]
                • Writing: Measures the ability to produce written English on various topics. [7]
                • Speaking: Tests the ability to communicate effectively in spoken English. [4, 7]

                • Band Score: Results are reported on a 9-band scale, with 1 being a non-user and 9 an expert user. [3]
                • Recognition: IELTS scores are accepted by thousands of institutions globally, including over 10,000 universities, employers, and government agencies. [4, 5]
                • Modules: Two primary modules are available: [2]
                • IELTS Academic: For those applying for higher education or professional registration. [3, 8, 9, 10, 11]
                • IELTS General Training: For immigration or work-related training. [3, 9, 12]


            </p>

            <Button
                onClick={handleDone}
                className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-pixel hover:scale-105 transition-transform"
            >
                Done
            </Button>
        </div>
    );
};

export default Introduction;
