import schoolNamesData from "@/data/schools_names.json";
import { fixMojibake } from "./mojibake";

const SCHOOL_LABEL_MAP = Object.fromEntries(schoolNamesData.map(s => [s.english, s.arabic]));

export function getSchoolDisplayName(name) {
  if (!name) return "";
  const eng = name.split(' / ')[0]?.trim();
  const fromMap = SCHOOL_LABEL_MAP[eng];
  if (fromMap) return fromMap;
  const afterSlash = name.split(' / ')[1]?.trim();
  if (afterSlash) return fixMojibake(afterSlash);
  return fixMojibake(name);
}
