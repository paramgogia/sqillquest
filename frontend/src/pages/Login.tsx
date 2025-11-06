import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";



const API_BASE =

 
  // fallback
  "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const saveToken = (token: string) => {
    try {
      localStorage.setItem("skillquest_token", token);
    } catch (err) {
      // If localStorage is blocked, just ignore but show user a message
      console.warn("Could not save token to localStorage", err);
    }
  };

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
      // expected: { token, user: {...} }
      if (res?.data?.token) {
        saveToken(res.data.token);
        toast.success(`Welcome back, ${email.split("@")[0] || "Adventurer"}!`);
        // navigate to education page after successful login
        navigate("/education");
      } else {
        // unexpected response shape
        toast.error("Login succeeded but token missing from response.");
      }
    } catch (err: any) {
      // axios error handling
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

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { name: email.split("@")[0] || "Adventurer", email, password, educationLevel: "undergraduate" };
      const res = await api.post("/api/auth/register", payload);
      // expected: { token, user: {...} }
      if (res?.data?.token) {
        saveToken(res.data.token);
        toast.success("Account created successfully!");
        navigate("/education");
      } else {
        toast.success("Account created - please login.");
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
      setIsLoading(false);
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-3 pt-2">
                <Button 
                  type="submit" 
                  variant="quest" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Login"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleSignUp}
                  disabled={isLoading}
                >
                  Sign Up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
