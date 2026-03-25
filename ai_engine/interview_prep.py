from model_manager import LocalModelManager
import json

class InterviewPrepGenerator:
    def __init__(self):
        self.llm = LocalModelManager()

    def generate(self, profile, jd_data):
        prompt = f"""
        Act as an expert technical interviewer for the role of {jd_data.get('title')} at {jd_data.get('company') or 'a tech company'}.
        
        Based on the candidate's skills ({", ".join(profile.get('skills', []))}) and the JD requirements ({", ".join(jd_data.get('required_skills', []))}), create a custom interview prep guide.
        
        Return ONLY valid JSON matching this schema exactly:
        {{
            "technical_questions": [
                {{"question": "...", "ideal_answer_structure": "..."}}
            ],
            "behavioral_questions": [
                {{"question": "...", "star_format_hint": "..."}}
            ],
            "system_design": {{"question": "...", "key_considerations": ["...", "..."]}},
            "questions_to_ask_interviewer": ["...", "..."]
        }}
        
        Rules:
        - 5 technical questions
        - 3 behavioral questions
        - 1 system design question (if applicable to role, else 1 advanced scenario)
        - 2 sharp questions the candidate should ask the interviewer
        """
        
        try:
            res = self.llm.generate(prompt, response_format="json")
            if res:
                return json.loads(res)
        except Exception as e:
            print(f"Error generating interview prep: {e}")
            return {
                "error": "Failed to generate interview prep."
            }
