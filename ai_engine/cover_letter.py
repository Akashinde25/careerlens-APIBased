from model_manager import LocalModelManager


class CoverLetterGenerator:
    def __init__(self):
        self.llm = LocalModelManager()

    def generate(self, profile, jd_data, tone="professional"):
        """Non-streaming version — returns the full text at once."""
        prompt = self._build_prompt(profile, jd_data, tone)
        return self.llm.generate(prompt)

    def stream(self, candidate, jd, tone="professional"):
        """
        Streaming version — yields text chunks one at a time.
        Used by cli.py for the SSE cover-letter endpoint.
        """
        prompt = self._build_prompt(candidate, jd, tone)
        for chunk in self.llm.stream_generate(prompt, temperature=0.5):
            yield chunk

    def _build_prompt(self, candidate, jd, tone):
        return f"""
Write a compelling, tailored cover letter for the following candidate applying to the following job.
Tone: {tone}

Candidate Profile:
Name: {candidate.get('name', 'Applicant')}
Summary: {candidate.get('summary', '')}
Experience: {chr(10).join(candidate.get('experience', []))}
Skills: {', '.join(candidate.get('skills', []))}

Job Description:
Title: {jd.get('title', 'Target Role')}
Company: {jd.get('company', 'Target Company')}
Required Skills: {', '.join(jd.get('required_skills', []))}
Responsibilities: {chr(10).join(jd.get('responsibilities', []))}

Instructions:
1. Standard business letter format.
2. 3-4 paragraphs max.
3. Highlight specific candidate experience that directly matches the JD requirements.
4. Do NOT hallucinate experience not present in the candidate profile.
5. Provide ONLY the final cover letter text.
"""
