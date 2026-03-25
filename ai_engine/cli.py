import sys
import json
import os

# Ensure the ai_engine directory is in the path
sys.path.insert(0, os.path.dirname(__file__))

from resume_parser import ResumeParser
from jd_parser import JDParser
from gap_analyzer import GapAnalyzer
from ats_scorer import ATSScorer
from resume_rewriter import ResumeRewriter
from resume_exporter import ResumeExporter
from roadmap_generator import RoadmapGenerator
from cover_letter import CoverLetterGenerator
from interview_prep import InterviewPrepGenerator
from humanizer import HumanizerEngine
from company_interest import CompanyInterestGenerator


def stream_cover_letter(payload):
    """Streams cover letter chunks to stdout as JSON lines for SSE consumption."""
    generator = CoverLetterGenerator()
    candidate = payload.get("candidate", {})
    jd = payload.get("jd", {})
    tone = payload.get("tone", "professional")
    for chunk in generator.stream(candidate, jd, tone):
        print(json.dumps({"chunk": chunk}), flush=True)


def stream_company_interest(payload):
    """Streams company interest answer chunks as JSON lines for SSE consumption."""
    generator = CompanyInterestGenerator()
    candidate = payload.get("candidate", {})
    jd = payload.get("jd", {})
    company_notes = payload.get("company_notes", "")
    for chunk in generator.stream(candidate, jd, company_notes):
        print(json.dumps({"chunk": chunk}), flush=True)


def stream_humanize(payload):
    """Streams humanized text chunks as JSON lines for SSE consumption."""
    engine = HumanizerEngine()
    text = payload.get("text", "")
    for chunk in engine.stream_humanize(text):
        print(json.dumps({"chunk": chunk}), flush=True)


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: cli.py <action> <payload_file>"}))
        sys.exit(1)

    action = sys.argv[1]

    try:
        with open(sys.argv[2], "r") as f:
            payload = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to read payload: {e}"}))
        sys.exit(1)

    result = {}
    try:
        if action == "parse_resume":
            parser = ResumeParser()
            result = parser.parse(payload.get("pdf_path"))

        elif action == "parse_jd":
            parser = JDParser()
            text = payload.get("input_data") or payload.get("text_or_url", "")
            result = parser.parse(text)

        elif action == "analyze_gap":
            scorer = ATSScorer()
            analyzer = GapAnalyzer()
            candidate = payload.get("candidate")
            jd = payload.get("jd")
            ats = scorer.calculate_score(candidate, jd)
            result = analyzer.analyze(candidate, jd, ats)

        elif action == "rewrite_resume":
            rewriter = ResumeRewriter()
            candidate = payload.get("candidate", {})
            jd = payload.get("jd", {})
            gap_analysis = payload.get("gap_analysis", {})
            jd_keywords = jd.get("required_skills", []) + jd.get("keywords", [])
            bullets = candidate.get("experience", [])
            rewritten = rewriter.rewrite_bullets(bullets, jd_keywords, gap_analysis)
            result = {
                "status": "success",
                "rewritten_experience": rewritten
            }

        elif action == "export_resume":
            exporter = ResumeExporter()
            profile = payload.get("profile", {})
            accepted_bullets = payload.get("accepted_bullets", [])
            export_format = payload.get("format", "docx").lower()
            output_path = payload.get("output_path", "/tmp/resume_export")

            if export_format == "pdf":
                out = exporter.export_to_pdf(profile, accepted_bullets, output_path + ".pdf")
            else:
                out = exporter.export_to_docx(profile, accepted_bullets, output_path + ".docx")

            result = {"status": "success", "file_path": out}

        elif action == "roadmap":
            generator = RoadmapGenerator()
            skill = payload.get("skill")
            jd_context = payload.get("jd_context", "")
            candidate_level = payload.get("candidate_level", "none")
            gap_item = {
                "skill": skill,
                "why_it_matters": f"Required for the role. Context: {jd_context}",
                "candidate_level": candidate_level
            }
            roadmaps = generator.generate_roadmap([gap_item])
            result = roadmaps[0] if roadmaps else {"error": "No roadmap generated"}

        elif action == "interview_prep":
            generator = InterviewPrepGenerator()
            result = generator.generate(
                payload.get("candidate", {}),
                payload.get("jd", {})
            )

        elif action == "cover_letter":
            stream_cover_letter(payload)
            sys.exit(0)

        elif action == "company_interest":
            stream_company_interest(payload)
            sys.exit(0)

        elif action == "humanize":
            stream_humanize(payload)
            sys.exit(0)

        else:
            result = {"error": f"Unknown action: {action}"}

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
