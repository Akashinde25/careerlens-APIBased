from model_manager import LocalModelManager


class HumanizerEngine:
    """Rewrites AI-generated text to sound more natural and human-written."""

    def __init__(self):
        self.llm = LocalModelManager()

    def _build_prompt(self, text):
        return f"""You are an expert editor who makes AI-generated professional writing sound more natural and human.

TASK: Rewrite the following text so it:
1. Sounds like it was written by a real person, not an AI
2. Uses straightforward, everyday English — no over-formal or corporate jargon
3. Avoids AI-typical phrases like "I am thrilled to", "leverage", "delve into", "I am passionate about", "excited to", "groundbreaking", "synergy", "cutting-edge" etc.
4. Keeps the same core message, facts, and professional tone
5. Maintains proper grammar and structure
6. Is suitable for job applications and professional submissions
7. Feels genuine and personal

IMPORTANT: Return ONLY the rewritten text. No explanations, no preamble, no quotes.

Text to rewrite:
{text}
"""

    def humanize(self, text):
        """Non-streaming version."""
        prompt = self._build_prompt(text)
        return self.llm.generate(prompt, temperature=0.6)

    def stream_humanize(self, text):
        """Streaming version - yields text chunks."""
        prompt = self._build_prompt(text)
        for chunk in self.llm.stream_generate(prompt, temperature=0.6):
            yield chunk
