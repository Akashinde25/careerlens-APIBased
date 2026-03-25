from embeddings import SemanticMatcher
from model_manager import LocalModelManager
import json

class GapAnalyzer:
    def __init__(self):
        self.matcher = SemanticMatcher()
        self.llm = LocalModelManager()

    def analyze(self, profile, jd_data, ats_score_data):
        profile_skills = [s.strip().lower() for s in profile.get("skills", [])]
        raw_text_lower = profile.get("raw_text", "").lower()
        req_skills = jd_data.get("required_skills", []) + jd_data.get("preferred_skills", [])
        
        green = []
        yellow = []
        red = []
        
        # 1. First pass: semantic matching
        for skill in req_skills:
            skill_lower = skill.lower()
            if skill_lower in profile_skills or skill_lower in raw_text_lower:
                green.append({"skill": skill, "evidence_from_resume": "Found exactly in resume."})
                continue
                
            # Check Semantic Match
            best_match, score = self.matcher.find_best_match(skill, profile_skills, threshold=0.7)
            if best_match:
                yellow.append({
                    "skill": skill, 
                    "adjacent_evidence": best_match, 
                    "gap_description": f"Has {best_match}, which is related, but not exact {skill}."
                })
            else:
                red.append({"skill": skill, "importance": "high", "why_it_matters": "Mentioned in JD."})

        # 2. Refine via LLM (LLM reasons about implicit experience)
        if red or yellow:
            red_list = ", ".join([r["skill"] for r in red])
            yellow_list = ", ".join([y["skill"] for y in yellow])
            
            prompt = f"""
            The candidate is missing these skills exactly:
            Red (missing entirely): {red_list}
            Yellow (partial match): {yellow_list}
            
            Candidate's raw experience text:
            {profile.get('raw_text', '')[:4000]}
            
            Analyze if the candidate implicitly has any of these Red or Yellow skills hidden in their experience text.
            Return a valid JSON object ONLY, in this EXACT format:
            {{
                "upgrades_to_green": [{{"skill": "...", "evidence": "..."}}],
                "upgrades_to_yellow": [{{"skill": "...", "evidence": "..."}}],
                "red_reasons": [{{"skill": "...", "why_it_matters": "..."}}]
            }}
            """
            
            try:
                res = self.llm.generate(prompt, response_format="json")
                if res:
                   refinement = json.loads(res)
                   # Apply upgrades
                   for u in refinement.get("upgrades_to_green", []):
                       # Move from R/Y to G
                       s = u.get("skill")
                       yellow = [y for y in yellow if y["skill"] != s]
                       red = [r for r in red if r["skill"] != s]
                       green.append({"skill": s, "evidence_from_resume": u.get("evidence")})
                       
                   for u in refinement.get("upgrades_to_yellow", []):
                       s = u.get("skill")
                       red = [r for r in red if r["skill"] != s]
                       yellow.append({"skill": s, "adjacent_evidence": "Implicit", "gap_description": u.get("evidence")})
                       
                   # update red_reasons
                   for r_reason in refinement.get("red_reasons", []):
                       for item in red:
                           if item["skill"] == r_reason.get("skill"):
                               item["why_it_matters"] = r_reason.get("why_it_matters")
            except Exception as e:
                print(f"LLM gap refinement failed, using heuristics. Error: {e}")
                
        # Calculate heuristics
        total_k = len(green) + len(yellow) + len(red)
        fit_percentage = int((len(green) + (0.5 * len(yellow))) / max(1, total_k) * 100) if total_k else 50
        
        prob = "Low"
        if fit_percentage > 75: prob = "High"
        elif fit_percentage > 50: prob = "Medium"
        
        summary_prompt = f"Candidate has {len(green)} matching skills, {len(yellow)} partial, and {len(red)} missing. Fit is {fit_percentage}%. Write a 2 sentence summary predicting interview chances."
        summary = self.llm.generate(summary_prompt)
        
        return {
            "green": green,
            "yellow": yellow,
            "red": red,
            "ats_score": ats_score_data,
            "overall_fit_percentage": fit_percentage,
            "hiring_probability_estimate": prob,
            "summary_paragraph": summary or "Fit analysis complete."
        }
