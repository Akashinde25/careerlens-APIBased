import re
import requests
from bs4 import BeautifulSoup
from model_manager import LocalModelManager
import json

class JDParser:
    def __init__(self):
        self.llm = LocalModelManager()

    def fetch_from_url(self, url):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        try:
            res = requests.get(url, headers=headers, timeout=10)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, 'html.parser')
            # Extract main text
            text = soup.get_text(separator=' ', strip=True)
            return self._clean_text(text)
        except Exception as e:
            print(f"Error fetching JD from URL: {e}")
            return ""

    def _clean_text(self, text):
        import re
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def parse(self, text_or_url):
        if text_or_url.startswith('http'):
            raw_text = self.fetch_from_url(text_or_url)
        else:
            raw_text = text_or_url
            
        if not raw_text:
            return {"error": "No text provided or failed to fetch URL"}

        prompt = f"""
        Extract the following information from this job description:
        Return ONLY a JSON object with these keys:
        - title: Job Title
        - company: Company Name (if found, otherwise null)
        - location: Location (if found)
        - experience_required: Years of experience (e.g., "3-5 years" or null)
        - required_skills: Array of string (hard skills mentioned as strictly required)
        - preferred_skills: Array of string (skills mentioned as bonus/nice to have)
        - keywords: Array of string (other technical or domain keywords)
        
        JOB DESCRIPTION:
        {raw_text[:8000]}
        """
        
        try:
            result = self.llm.generate(
                prompt=prompt,
                system_prompt="You are an expert HR data extraction AI. Always return precise, valid JSON.",
                response_format="json"
            )
            return json.loads(result)
        except Exception as e:
            print(f"LLM parsing failed: {e}")
            return {
                "title": "",
                "company": "",
                "experience_required": "",
                "required_skills": [],
                "preferred_skills": [],
                "keywords": [],
                "raw_text": raw_text
            }
