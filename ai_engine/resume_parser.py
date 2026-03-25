import fitz  # PyMuPDF
import pdfplumber
import spacy
import re
import json

try:
    nlp = spacy.load("en_core_web_lg")
except OSError:
    print("Warning: spacy model 'en_core_web_lg' not found. Using small model or skipping.")
    nlp = None

class ResumeParser:
    def __init__(self):
        pass

    def extract_text_from_pdf(self, file_path):
        text = ""
        # Try pdfplumber first
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber failed: {e}")
            
        # Fallback to PyMuPDF if empty
        if len(text.strip()) < 50:
            try:
                doc = fitz.open(file_path)
                text = ""
                for page in doc:
                    text += page.get_text() + "\n"
            except Exception as e:
                print(f"PyMuPDF failed: {e}")
                
        return text

    def parse(self, file_path):
        text = self.extract_text_from_pdf(file_path)
        
        profile = {
            "name": "",
            "contact": {"email": "", "phone": "", "linkedin": "", "github": ""},
            "summary": "",
            "education": [],
            "experience": [],
            "projects": [],
            "skills": [],
            "certifications": [],
            "raw_text": text
        }
        
        # Extract basic contact info using Regex
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        if emails: profile["contact"]["email"] = emails[0]
        
        phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, text)
        if phones: profile["contact"]["phone"] = phones[0]
        
        linkedin_pattern = r'(linkedin\.com/in/[a-zA-Z0-9_-]+)'
        linkedin = re.findall(linkedin_pattern, text)
        if linkedin: profile["contact"]["linkedin"] = linkedin[0]
        
        # Simple NLP for Name extraction (First ORG or PERSON near the top)
        if nlp:
            doc = nlp(text[:1000])  # analyze first 1000 chars for name
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    profile["name"] = ent.text
                    break
        
        # Sections parsing heuristic (Split by common headers)
        lines = text.split('\n')
        current_section = "summary"
        section_text = {"summary": [], "experience": [], "education": [], "skills": [], "projects": []}
        
        headers = {
            "experience": ["experience", "employment", "work history", "professional experience"],
            "education": ["education", "academic background"],
            "skills": ["skills", "technologies", "core competencies"],
            "projects": ["projects", "personal projects", "academic projects"]
        }
        
        for line in lines:
            line_lower = line.strip().lower()
            matched_section = False
            for sec, keywords in headers.items():
                if line_lower in keywords or line_lower.startswith(tuple(k + " " for k in keywords)):
                    current_section = sec
                    matched_section = True
                    break
            
            if not matched_section and line.strip():
                if current_section in section_text:
                    section_text[current_section].append(line.strip())
                    
        # Process sections
        profile["summary"] = " ".join(section_text["summary"])
        profile["experience"] = section_text["experience"]
        profile["skills"] = [s.strip() for s in " ".join(section_text["skills"]).split(',') if s.strip()]
        if not profile["skills"]:
             # fallback split by newlines if comma separation wasn't used
             profile["skills"] = [s for s in section_text["skills"] if len(s.split()) < 4]
        
        profile["education"] = section_text["education"]
        profile["projects"] = section_text["projects"]
        
        return profile
