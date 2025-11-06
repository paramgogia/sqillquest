import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

const Login = () => {
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Signup overlay state
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupEducation, setSignupEducation] = useState("undergraduate");
  const [signupLoading, setSignupLoading] = useState(false);

  const saveToken = (token: string) => {
    try {
      localStorage.setItem("skillquest_token", token);
    } catch (err) {
      console.warn("Could not save token to localStorage", err);
    }
  };

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { email, password };
      const res = await api.post("/api/auth/login", payload);
      if (res?.data?.token) {
        saveToken(res.data.token);
        toast.success(`Welcome back, ${email.split("@")[0] || "Adventurer"}!`);
        navigate("/education");
      } else {
        toast.error("Login succeeded but token missing from response.");
      }
    } catch (err: any) {
      if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err?.response?.status === 401) {
        toast.error("Invalid credentials");
      } else {
        toast.error("Login failed. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // OPEN SIGNUP CARD (overlay)
  const openSignup = () => {
    // prefill signup email/password from login inputs for convenience
    setSignupEmail(email || "");
    setSignupPassword(password || "");
    setSignupName((email && email.split("@")[0]) || "");
    setShowSignup(true);
  };

  // CANCEL SIGNUP
  const cancelSignup = () => {
    setShowSignup(false);
    setSignupLoading(false);
  };

  // SIGNUP
  const handleSignUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!signupName || !signupEmail || !signupPassword || !signupEducation) {
      toast.error("Please fill in all signup fields");
      return;
    }

    setSignupLoading(true);
    try {
      const payload = {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        educationLevel: signupEducation,
      };

      const res = await api.post("/api/auth/register", payload);

      if (res?.data?.token) {
        saveToken(res.data.token);
        toast.success("Account created successfully!");
        setShowSignup(false);
        // small delay so toast is visible, then navigate
        navigate("/education");
      } else {
        // server may return user without token
        toast.success("Account created — please login.");
        setShowSignup(false);
        navigate("/education");
      }
    } catch (err: any) {
      if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Sign up failed. Please try again.");
      }
      console.error("SignUp error:", err);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-quest p-4 relative overflow-hidden">
      {/* Pixel decorative background elements */}
      <div className="absolute top-10 left-10 text-6xl animate-pixel-bounce text-primary">⭐</div>
      <div className="absolute bottom-20 right-20 text-5xl animate-pixel-bounce text-secondary" style={{ animationDelay: '0.5s' }}>💎</div>
      <div className="absolute top-1/2 right-10 text-4xl animate-pixel-bounce text-accent" style={{ animationDelay: '1s' }}>🗡️</div>
      <div className="absolute top-1/3 left-20 text-5xl animate-flicker text-pixel-orange" style={{ animationDelay: '1.5s' }}>🪙</div>
      <div className="absolute bottom-1/3 left-1/4 text-4xl animate-glow text-primary">✨</div>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo and Branding */}
        <div className="text-center space-y-6">
          <div className="flex justify-center relative">
            <div className="relative p-4 bg-gradient-magic border-4 border-primary shadow-glow-primary animate-glow">
              <Sparkles className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-pixel text-primary animate-glow leading-relaxed">
              SKILLQUEST
            </h1>
            <p className="text-xs text-muted-foreground mt-4 font-pixel leading-relaxed">
              LEVEL UP YOUR SKILLS
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="px-3 py-2 bg-primary border-2 border-primary text-[0.6rem] font-pixel text-primary-foreground animate-flicker">
                ▶ NEW GAME
              </div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-quest border-4 border-primary relative overflow-hidden">
          {/* Pixel corner decorations */}
          <div className="absolute top-2 right-2 w-3 h-3 bg-primary animate-flicker" />
          <div className="absolute top-2 left-2 w-3 h-3 bg-secondary animate-flicker" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-2 right-2 w-3 h-3 bg-accent animate-flicker" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-2 left-2 w-3 h-3 bg-pixel-orange animate-flicker" style={{ animationDelay: '1.5s' }} />
          
          <CardHeader className="space-y-4 relative">
            <CardTitle className="text-sm font-pixel text-center uppercase leading-relaxed">
              ⚔️ BEGIN QUEST 🛡️
            </CardTitle>
            <CardDescription className="text-center text-[0.65rem] font-pixel leading-relaxed">
              ENTER CREDENTIALS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="adventurer@skillquest.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="transition-all focus:border-primary"
                  disabled={isLoading || signupLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="transition-all focus:border-primary"
                  disabled={isLoading || signupLoading}
                />
              </div>
              <div className="space-y-3 pt-2">
                <Button 
                  type="submit" 
                  variant="quest" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading || signupLoading}
                >
                  {isLoading ? "Loading..." : "Login"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={openSignup}
                  disabled={isLoading || signupLoading}
                >
                  Sign Up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Signup overlay card */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-0 relative">
            <div className="absolute top-3 right-3">
              <Button variant="ghost" onClick={cancelSignup} className="text-sm">Close</Button>
            </div>
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-pixel">Create your account</CardTitle>
              <CardDescription className="text-sm">Fill the details below to start your learning quest</CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0">
              <form onSubmit={(e) => { e.preventDefault(); void handleSignUpSubmit(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Test User"
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="test@example.com"
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Password123"
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-education">Education Level</Label>
                  <select
                    id="signup-education"
                    value={signupEducation}
                    onChange={(e) => setSignupEducation(e.target.value)}
                    className="w-full p-2 rounded border border-[hsl(var(--border))] bg-white text-black"
                    disabled={signupLoading}
                  >
                    <option value="12th">12th</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={signupLoading}
                    onClick={() => void handleSignUpSubmit()}
                  >
                    {signupLoading ? "Creating..." : "Create Account"}
                  </Button>

                  <Button variant="outline" className="flex-1" onClick={cancelSignup} disabled={signupLoading}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Login;
