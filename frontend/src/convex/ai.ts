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

    const prompt = `You are analyzing a Qatar ID card or Qatar Residency Permit image.
Extract the following information and return ONLY a valid JSON object (no markdown, no backticks, no extra text):
{
  "fullName": "Full name in Arabic script as written on the card. If only English name is visible, return the English name.",
  "personalId": "The ID number or QID number - digits only, no spaces or dashes",
  "birthYear": "4-digit birth year only, e.g. 2005",
  "nationality": "Nationality as written on the card (Arabic or English)"
}
If any field is not visible or unclear, set it to null.
Return ONLY the JSON object, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

    if (!text) throw new Error("Gemini returned empty response");

    // استخراج JSON من الرد (يتعامل مع markdown أيضاً)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Could not find JSON in response: ${text.slice(0, 200)}`);

    let result: any;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      throw new Error(`JSON parse failed: ${jsonMatch[0].slice(0, 200)}`);
    }

    return {
      fullName:    result.fullName    ? String(result.fullName).trim()                           : null,
      personalId:  result.personalId  ? String(result.personalId).replace(/\D/g, "")             : null,
      birthYear:   result.birthYear   ? String(result.birthYear).replace(/\D/g, "").slice(0, 4)  : null,
      nationality: result.nationality ? String(result.nationality).trim()                         : null,
    };
  },
});
