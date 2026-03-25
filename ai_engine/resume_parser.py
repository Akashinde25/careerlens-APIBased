import fitz  # PyMuPDF
import pdfplumber
import re
import os

try:
    import spacy
    nlp = spacy.load("en_core_web_lg")
except Exception:
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = None

try:
    from docx import Document as DocxDocument
    DOCX_SUPPORTED = True
except ImportError:
    DOCX_SUPPORTED = False


class ResumeParser:
    def __init__(self):
        pass

    def extract_text_from_pdf(self, file_path):
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber failed: {e}", flush=True)

        if len(text.strip()) < 50:
            try:
                doc = fitz.open(file_path)
                text = ""
                for page in doc:
                    text += page.get_text() + "\n"
            except Exception as e:
                print(f"PyMuPDF failed: {e}", flush=True)

        return text

    def extract_text_from_docx(self, file_path):
        if not DOCX_SUPPORTED:
            raise ImportError("python-docx not installed. Run: pip install python-docx")
        doc = DocxDocument(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)

    def parse(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".docx":
            text = self.extract_text_from_docx(file_path)
        else:
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
            "raw_text": text,
            "file_path": file_path
        }

        # Contact via Regex
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        if emails:
            profile["contact"]["email"] = emails[0]

        phones = re.findall(r'\(?\d{3}\)?[\-.\s]?\d{3}[\-.\s]?\d{4}', text)
        if phones:
            profile["contact"]["phone"] = phones[0]

        linkedin = re.findall(r'(linkedin\.com/in/[a-zA-Z0-9_-]+)', text)
        if linkedin:
            profile["contact"]["linkedin"] = linkedin[0]

        github = re.findall(r'(github\.com/[a-zA-Z0-9_-]+)', text)
        if github:
            profile["contact"]["github"] = github[0]

        # Name extraction via spaCy
        if nlp:
            doc = nlp(text[:1000])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    profile["name"] = ent.text
                    break

        # Section parsing
        lines = text.split('\n')
        current_section = "summary"
        section_text = {"summary": [], "experience": [], "education": [], "skills": [], "projects": [], "certifications": []}

        headers = {
            "experience": ["experience", "employment", "work history", "professional experience", "work experience"],
            "education": ["education", "academic background", "academic qualifications"],
            "skills": ["skills", "technologies", "core competencies", "technical skills", "key skills"],
            "projects": ["projects", "personal projects", "academic projects", "key projects"],
            "certifications": ["certifications", "licenses", "certificates", "achievements"]
        }

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            line_lower = stripped.lower()
            matched_section = False
            for sec, kws in headers.items():
                if line_lower in kws or any(line_lower.startswith(k) for k in kws):
                    current_section = sec
                    matched_section = True
                    break

            if not matched_section and current_section in section_text:
                section_text[current_section].append(stripped)

        profile["summary"] = " ".join(section_text["summary"])
        profile["education"] = section_text["education"]
        profile["projects"] = section_text["projects"]
        profile["certifications"] = section_text["certifications"]

        # Skills: try comma-split first, fallback to newline-split short phrases
        raw_skills = " ".join(section_text["skills"])
        profile["skills"] = [s.strip() for s in raw_skills.split(',') if s.strip()]
        if not profile["skills"]:
            profile["skills"] = [s for s in section_text["skills"] if len(s.split()) <= 5]

        # Experience: keep ALL non-empty lines from the experience section
        # This fixes the "No bullets" bug — we pass every line, not just bullet-prefixed ones
        exp_lines = [l for l in section_text["experience"] if len(l) > 3]
        profile["experience"] = exp_lines

        return profile
