import sys
import importlib
import json
import os

def check_dep(name):
    try:
        importlib.import_module(name)
        return True
    except ImportError:
        return False

def health_check():
    deps = {
        "PyMuPDF": "fitz",
        "pdfplumber": "pdfplumber",
        "spaCy": "spacy",
        "NLTK": "nltk",
        "Sentence Transformers": "sentence_transformers",
        "FAISS": "faiss",
        "Scikit-Learn": "sklearn",
        "Pandas": "pandas",
        "Requests": "requests",
        "Groq": "groq",
        "ReportLab": "reportlab"
    }
    
    status = {"status": "ok", "dependencies": {}}
    all_passed = True
    
    for display, module in deps.items():
        ok = check_dep(module)
        status["dependencies"][display] = "PASS" if ok else "FAIL"
        if not ok:
            all_passed = False
            
    # Check spacy models
    if status["dependencies"]["spaCy"] == "PASS":
        import spacy
        if not spacy.util.is_package("en_core_web_lg"):
            status["dependencies"]["spaCy_en_core_web_lg"] = "FAIL"
            all_passed = False
        else:
            status["dependencies"]["spaCy_en_core_web_lg"] = "PASS"
            
    # Config sanity check
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            cfg = json.load(f)
            if not cfg.get("groq_api_key"):
                status["api_key"] = "FAIL (Missing)"
                all_passed = False
            else:
                status["api_key"] = "PASS"
    else:
        status["config_json"] = "FAIL (Missing)"
        all_passed = False
        
    status["status"] = "ok" if all_passed else "error"
    return status

if __name__ == "__main__":
    import json
    print(json.dumps(health_check(), indent=2))
