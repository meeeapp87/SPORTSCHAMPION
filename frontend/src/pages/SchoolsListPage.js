import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, School } from "lucide-react";
import schoolNamesData from "@/data/schools_names.json";

const CP1252_MAP = {
  0x0160:0x8A,0x2020:0x86,0x201E:0x84,0x2026:0x85,0x02C6:0x88,0x201A:0x82,
  0x0161:0x9A,0x017E:0x9E,0x017D:0x8E,0x0152:0x8C,0x0153:0x9C,0x0192:0x83,
  0x02DC:0x98,0x2039:0x8B,0x203A:0x9B,0x2018:0x91,0x2019:0x92,0x201C:0x93,
  0x201D:0x94,0x2013:0x96,0x2014:0x97,0x2022:0x95,0x20AC:0x80,
};
function fixMojibake(text) {
  if (!text || (!text.includes('Ø') && !text.includes('Ù'))) return text;
  try {
    const bytes = [];
    for (const c of text) {
      const o = c.codePointAt(0);
      if (o <= 0xFF) bytes.push(o);
      else if (CP1252_MAP[o] !== undefined) bytes.push(CP1252_MAP[o]);
      else return text;
    }
    const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    return /[؀-ۿ]/.test(decoded) ? decoded.trim() : text;
  } catch { return text; }
}
const ARABIC_MAP = Object.fromEntries(schoolNamesData.map(s => [s.english, s.arabic]));
const getArabic = (name) => {
  if (!name) return "";
  const eng = name.split(' / ')[0]?.trim();
  const fromMap = ARABIC_MAP[eng];
  if (fromMap) return fromMap;
  const afterSlash = name.split(' / ')[1]?.trim();
  if (afterSlash) return fixMojibake(afterSlash);
  return fixMojibake(name);
};

const STAGE_COLORS = {
  "ابتدائي": "bg-emerald-50 text-emerald-700",
  "إعدادي":  "bg-blue-50 text-blue-700",
  "ثانوي":   "bg-purple-50 text-purple-700",
};
const GENDER_COLORS = {
  "بنين":    "bg-sky-50 text-sky-700",
  "بنات":    "bg-pink-50 text-pink-700",
};

export default function SchoolsListPage() {
  const navigate = useNavigate();
  const schoolsQuery = useQuery(api.schools.list);
  const studentsQuery = useQuery(api.students.list);
  const schools = useMemo(() => schoolsQuery || [], [schoolsQuery]);
  const students = useMemo(() => studentsQuery || [], [studentsQuery]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const filtered = useMemo(() => {
    return schools.filter(s => {
      if (stageFilter && s.stage !== stageFilter) return false;
      if (genderFilter && s.gender !== genderFilter) return false;
      if (search) {
        const arabic = getArabic(s.name).toLowerCase();
        const q = search.toLowerCase();
        if (!arabic.includes(q) && !s.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [schools, search, stageFilter, genderFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Alexandria']">قائمة المدارس</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">{filtered.length} مدرسة من أصل {schools.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم المدرسة..."
            className="pr-9 text-right"
          />
        </div>
        {["", "ابتدائي", "إعدادي", "ثانوي"].map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${stageFilter === s ? "bg-[#8A1538] text-white border-[#8A1538]" : "bg-white text-[#4B5563] border-[#E5E1D8] hover:bg-[#F5F3EC]"}`}>
            {s || "كل المراحل"}
          </button>
        ))}
        {["", "بنين", "بنات"].map(g => (
          <button key={g} onClick={() => setGenderFilter(g)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${genderFilter === g ? "bg-[#8A1538] text-white border-[#8A1538]" : "bg-white text-[#4B5563] border-[#E5E1D8] hover:bg-[#F5F3EC]"}`}>
            {g || "الكل"}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF]">
          <School className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد مدارس</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(school => {
            const count = students.filter(st => st.schoolId === school._id).length;
            const max = school.maxStudents || 3;
            const isFull = count >= max;
            const pct = Math.min((count / max) * 100, 100);
            return (
              <Card key={school._id} className="border-[#E5E1D8] hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate(`/schools/${school._id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-[#1A1A1A]">{getArabic(school.name)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[school.stage] || "bg-gray-50 text-gray-600"}`}>{school.stage}</span>
                        {school.gender && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GENDER_COLORS[school.gender] || "bg-gray-50 text-gray-600"}`}>{school.gender}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#E5E1D8] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isFull ? "bg-emerald-500" : "bg-[#8A1538]"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[#9CA3AF] shrink-0">{count}/{max} طالب</span>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
