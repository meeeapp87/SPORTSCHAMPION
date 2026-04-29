import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";

function formatApiError(detail) {
  if (!detail) return "حدث خطأ، يرجى المحاولة مرة أخرى";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail);
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        if (!name.trim()) { setError("يرجى إدخال الاسم"); setLoading(false); return; }
        await register(email, password, name);
      }
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFBF7] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238A1538' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center mb-4">
            <img src="/logo.png" alt="شعار" className="w-28 h-28 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] font-['Alexandria']">مشروع اللياقة البدنية</h1>
          <p className="text-sm text-[#9CA3AF] mt-2">نظام إدارة تسجيل الطلاب</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-[#4B5563]">البريد الإلكتروني</Label>
                  <Input id="email" data-testid="email-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" dir="ltr" className="mt-1 text-left focus:ring-[#D4AF37]" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-[#4B5563]">كلمة المرور</Label>
                  <div className="relative mt-1">
                    <Input id="password" data-testid="password-input" type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" className="text-left pl-10 focus:ring-[#D4AF37]" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-3 bg-red-50 p-2 rounded-lg" data-testid="auth-error">{error}</p>}

              <Button type="submit" data-testid="auth-submit-btn" disabled={loading} className="w-full mt-6 bg-[#8A1538] hover:bg-[#6D102A] text-white h-11">
                {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : "تسجيل الدخول"}
              </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
