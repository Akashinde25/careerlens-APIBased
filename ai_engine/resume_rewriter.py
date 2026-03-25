from model_manager import LocalModelManager
import json

class ResumeRewriter:
    def __init__(self):
        self.llm = LocalModelManager()

    def rewrite_bullets(self, original_bullets, jd_keywords, gap_data):
        """
        Take a list of bullet points and rewrite them to include JD keywords
        without inventing experience.
        """
        
        prompt = f"""
        You are an expert resume writer. Rewrite the following resume bullet points to maximize ATS keyword match with the target Job Description keywords.
        
        RULES:
        1. Do NOT invent experience or skills not present in the original.
        2. Do NOT change the core facts.
        3. DO mirror the JD's exact terminology where the underlying experience genuinely matches.
        4. Add quantification where implied by context.
        5. Return a JSON object with a single key "rewritten_bullets" containing a list of objects with "original", "rewritten", and "change_explanation".
        
        JD Keywords: {", ".join(jd_keywords)}
        
        Original Bullets:
        {json.dumps(original_bullets, indent=2)}
        """
        
        try:
            res = self.llm.generate(prompt, response_format="json")
            if res:
                return json.loads(res).get("rewritten_bullets", [])
        except Exception as e:
            print(f"Error in rewriting bullets: {e}")
            
        # fallback
        return [{"original": b, "rewritten": b, "change_explanation": "Failed to rewrite"} for b in original_bullets]

    def _extract_all_bullets(self, profile):
        """Helper to flat map all experience bullets from candidate profile"""
        # simplified for this version:
        return profile.get("experience", [])
