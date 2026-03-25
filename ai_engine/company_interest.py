from model_manager import LocalModelManager


class CompanyInterestGenerator:
    """Generates a thoughtful answer to 'What interests you about working for this company?'"""

    def __init__(self):
        self.llm = LocalModelManager()

    def _build_prompt(self, candidate, jd, company_notes=""):
        company = jd.get("company", "this company")
        role = jd.get("title", "this role")
        responsibilities = "\n".join(jd.get("responsibilities", []))
        required_skills = ", ".join(jd.get("required_skills", []))
        candidate_summary = candidate.get("summary", "")
        candidate_skills = ", ".join(candidate.get("skills", []))
        candidate_exp = "\n".join(candidate.get("experience", [])[:5])  # limit for context

        extra_notes = f"\nAdditional context about the company: {company_notes}" if company_notes else ""

        return f"""You are helping a job applicant write a genuine, professional answer to the interview question:
"What interests you about working for {company}?"

The answer should:
1. Be specific to this company and role — not generic
2. Connect the candidate's background naturally to the company's work
3. Sound like a real person wrote it — authentic and conversational, not stiff
4. Avoid clichés like "I've always admired your company" or "I'm passionate about..."
5. Be 2-3 focused paragraphs max
6. Show genuine curiosity about the company's direction and role
7. Subtly highlight why the candidate is a good fit without being boastful
8. Use professional but approachable language

Company: {company}
Role: {role}
Role Responsibilities: {responsibilities}
Required Skills: {required_skills}

Candidate Background:
Summary: {candidate_summary}
Skills: {candidate_skills}
Recent Experience:
{candidate_exp}
{extra_notes}

Write ONLY the answer. No headers, no preamble.
"""

    def generate(self, candidate, jd, company_notes=""):
        """Non-streaming version."""
        prompt = self._build_prompt(candidate, jd, company_notes)
        return self.llm.generate(prompt, temperature=0.5)

    def stream(self, candidate, jd, company_notes=""):
        """Streaming version — yields text chunks."""
        prompt = self._build_prompt(candidate, jd, company_notes)
        for chunk in self.llm.stream_generate(prompt, temperature=0.5):
            yield chunk
