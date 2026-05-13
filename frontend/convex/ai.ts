"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * scanIdCard — يستخدم Gemini Vision لاستخراج بيانات البطاقة الشخصية أو الإقامة
 */
export const scanIdCard = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, { imageBase64, mimeType }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY غير مضبوط في المتغيرات البيئية");

    const prompt = `هذه صورة بطاقة هوية قطرية أو تصريح إقامة (Residence Permit / Qatar ID).
استخرج البيانات التالية بدقة وأرجعها كـ JSON نقي فقط بدون أي نص إضافي أو markdown أو backticks:
{
  "fullName": "الاسم الكامل بالعربي كما هو مكتوب في البطاقة",
  "personalId": "رقم الهوية أو رقم القيد — أرقام فقط بدون مسافات أو شرطات",
  "birthYear": "سنة الميلاد مكونة من 4 أرقام فقط مثل 2005",
  "nationality": "الجنسية بالعربي مثل قطري أو مصري أو سوري"
}
إذا كان الحقل غير موجود أو غير واضح اجعله null.
أرجع JSON فقط بدون أي كلام آخر.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 512 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // استخراج JSON من الرد (يتعامل مع markdown أيضاً)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("لم يتم استخراج بيانات من البطاقة");

    const result = JSON.parse(jsonMatch[0]);

    return {
      fullName:   result.fullName   ? String(result.fullName).trim()                          : null,
      personalId: result.personalId ? String(result.personalId).replace(/\D/g, "")            : null,
      birthYear:  result.birthYear  ? String(result.birthYear).replace(/\D/g, "").slice(0, 4) : null,
      nationality: result.nationality ? String(result.nationality).trim()                      : null,
    };
  },
});
