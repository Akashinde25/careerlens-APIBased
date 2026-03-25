from model_manager import LocalModelManager
import json

class ResumeRewriter:
    def __init__(self):
        self.llm = LocalModelManager()

    def rewrite_bullets(self, original_bullets, jd_keywords, gap_data):
        """
        Rewrite every line from the experience section to better match JD keywords.
        Works on any list of strings — bullet points, sentences, or raw lines.
        """
        if not original_bullets:
            return []

        prompt = f"""
You are an expert resume writer. Rewrite the following resume experience lines to maximize ATS keyword match with the target Job Description keywords.

RULES:
1. Do NOT invent experience or skills not present in the original line.
2. Do NOT change the core facts or dates.
3. Mirror the JD's terminology where the underlying experience genuinely matches.
4. Add quantification where implied by context.
5. Keep changes natural and professional — avoid overly corporate or AI-sounding language.
6. Return a JSON object with a single key "rewritten_bullets" containing a list of objects,
   each with "original", "rewritten", and "change_explanation".

JD Keywords: {", ".join(jd_keywords) if jd_keywords else "None provided"}

Gap Areas to Address: {json.dumps(gap_data.get("missing_skills", []) if isinstance(gap_data, dict) else [])}

Experience Lines to Rewrite:
{json.dumps(original_bullets, indent=2)}
"""
        try:
            res = self.llm.generate(prompt, response_format="json")
            if res:
                parsed = json.loads(res)
                bullets = parsed.get("rewritten_bullets", [])
                if isinstance(bullets, list) and len(bullets) > 0:
                    return bullets
        except Exception as e:
            print(f"Error in rewriting bullets: {e}", flush=True)

        # Graceful fallback — return originals with a note
        return [{"original": b, "rewritten": b, "change_explanation": "Could not rewrite — using original."} for b in original_bullets]

    def _extract_all_bullets(self, profile):
        """Helper to flat map all experience bullets from candidate profile"""
        return profile.get("experience", [])
