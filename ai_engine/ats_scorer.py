from embeddings import SemanticMatcher

class ATSScorer:
    def __init__(self):
        self.matcher = SemanticMatcher()

    def calculate_score(self, profile, jd_data):
        score_breakdown = {
            "keyword_match": 0,
            "semantic_match": 0,
            "formatting": 0,
            "impact": 0,
            "skills": 0,
            "contact": 0,
            "total": 0,
            "tips": []
        }
        
        # 1. Contact info (5 points)
        contact = profile.get("contact", {})
        c_score = 0
        if contact.get("email"): c_score += 2
        if contact.get("phone"): c_score += 2
        if contact.get("linkedin") or contact.get("github"): c_score += 1
        score_breakdown["contact"] = c_score
        if c_score < 5:
             score_breakdown["tips"].append("Include Email, Phone, and LinkedIn/GitHub.")

        # 2. Skills Completeness (10 points)
        req_skills = jd_data.get("required_skills", [])
        profile_skills_lower = [s.lower() for s in profile.get("skills", [])]
        
        matched_req = 0
        for rs in req_skills:
            # simple exact/substring match
            if any(rs.lower() in ps or ps in rs.lower() for ps in profile_skills_lower):
                matched_req += 1
                
        skill_score = 10 if not req_skills else int((matched_req / len(req_skills)) * 10)
        score_breakdown["skills"] = skill_score
        if skill_score < 10:
             score_breakdown["tips"].append("Add more explicitly required hard skills to your skills section.")

        # 3. Keyword Match in Entire Resume (35 points)
        jd_keywords = [k.lower() for k in jd_data.get("keywords", [])]
        raw_text_lower = profile.get("raw_text", "").lower()
        matched_kw = sum(1 for kw in jd_keywords if kw in raw_text_lower)
        
        kw_score = 35 if not jd_keywords else int((matched_kw / len(jd_keywords)) * 35)
        score_breakdown["keyword_match"] = kw_score
        if kw_score < 25:
             score_breakdown["tips"].append("Your resume is missing important JD keywords.")

        # 4. Semantic Match of Summary (20 points)
        summary = profile.get("summary", "")
        if summary and jd_data.get("title"):
             # compare summary to JD title/description
             sim = self.matcher.similarity_score(summary, jd_data["title"] + " " + " ".join(jd_keywords))
             sem_score = int(sim * 20)
        else:
             sem_score = 0
             score_breakdown["tips"].append("Add a professional summary tailored to the job title.")
        score_breakdown["semantic_match"] = sem_score
        
        # 5. Impact (15 points) - Looking for numbers in experience
        exp_text = " ".join(profile.get("experience", []))
        import re
        nums = re.findall(r'\b\d+[%+kKM]?\b', exp_text)
        impact_score = min(15, len(nums) * 2)
        score_breakdown["impact"] = impact_score
        if impact_score < 10:
             score_breakdown["tips"].append("Quantify your achievements in bullet points (use numbers/percentages).")

        # 6. Formatting Quality (15 points)
        format_score = 15
        if not summary or not profile.get("experience") or not profile.get("education"):
             format_score -= 5
             score_breakdown["tips"].append("Ensure clear sections: Summary, Experience, Education.")
        if len(raw_text_lower) < 500:
             format_score -= 5
             score_breakdown["tips"].append("Resume is too short to parse correctly.")
        score_breakdown["formatting"] = format_score
        
        total = c_score + skill_score + kw_score + sem_score + impact_score + format_score
        score_breakdown["total"] = total
        
        return score_breakdown
