import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Education from "./pages/Education";
import Skills from "./pages/Skills";
import SkillSelected from "./pages/SkillSelected";
import NotFound from "./pages/NotFound";
import Lessons from "./pages/Lessons";
import Introduction from "./pages/Introduction";
import Listening from "./pages/Listening";
import Reading from "./pages/Reading";
import Writing from "./pages/Writing";
import Speaking from "./pages/Speaking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SonnerToaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/education" element={<Education />} />
          <Route path="/skills" element={<Skills />} />
          {/* When user clicks a course, we navigate to /lessons/:courseId */}
          <Route path="/lessons/:courseId" element={<Lessons />} />
          <Route
            path="/lessons/:courseId/introduction"
            element={<Introduction />}
          />
          <Route path="/lessons/:courseId/listening" element={<Listening />} />
          <Route path="/lessons/:courseId/reading" element={<Reading />} />
          <Route path="/lessons/:courseId/writing" element={<Writing />} />
          <Route path="/lessons/:courseId/quiz" element={<Speaking />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
