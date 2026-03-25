import sys
import subprocess
import platform
import os
import shutil
import json

def run_cmd(cmd, cwd=None, shell=False):
    try:
        if shell:
            result = subprocess.run(cmd, cwd=cwd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        else:
            result = subprocess.run(cmd, cwd=cwd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def print_step(msg):
    print(f"\n🚀 {msg}...")
    
def print_success(msg):
    print(f"✅ {msg}")
    
def print_error(msg):
    print(f"❌ {msg}")
    
def setup():
    print("====================================")
    print(" CareerLens Local (Groq) Setup")
    print("====================================\n")

    # 1. System Audit
    print_step("System Audit")
    os_name = platform.system()
    python_version = sys.version.split(' ')[0]
    
    print(f"OS: {os_name}")
    print(f"Python: {python_version}")
    
    # Node Check
    success, node_v_out = run_cmd(['node', '--version'])
    if success:
         print(f"Node.js: {node_v_out.strip()}")
    else:
         print_error("Node.js not found. Please install Node.js 18+.")
         sys.exit(1)
         
    # 2. Setup Venv
    print_step("Creating Python Virtual Environment")
    if not os.path.exists("venv"):
        success, _ = run_cmd([sys.executable, "-m", "venv", "venv"])
        if success:
            print_success("Virtual environment created.")
        else:
            print_error("Failed to create virtual environment.")
            sys.exit(1)
    else:
        print_success("Virtual environment already exists.")
        
    pip_cmd = "venv/bin/pip" if os_name != "Windows" else "venv\\Scripts\\pip"
    python_cmd = "venv/bin/python" if os_name != "Windows" else "venv\\Scripts\\python"

    # 3. Install Python Dependencies
    print_step("Installing Python Dependencies")
    deps = [
        "pymupdf", "pdfplumber", "pytesseract", "Pillow", "spacy", "nltk",
        "sentence-transformers", "faiss-cpu", "scikit-learn", "pandas", "numpy",
        "flask", "flask-cors", "python-dotenv", "requests", "beautifulsoup4",
        "lxml", "pyspellchecker", "language-tool-python", "reportlab", "fpdf2",
        "rich", "groq"
    ]
    for dep in deps:
        print(f"Installing {dep}...")
        success, err = run_cmd([pip_cmd, "install", dep])
        if success:
            print_success(f"{dep} installed.")
        else:
            print_error(f"Failed to install {dep}. Error: {err}")

    # For MacOS/Linux we use simple torch CPU to save disk space over typical full install
    print("Installing PyTorch (CPU)...")
    success, err = run_cmd([pip_cmd, "install", "torch", "torchvision", "torchaudio", "--index-url", "https://download.pytorch.org/whl/cpu"])
    if success:
         print_success("PyTorch installed.")
         
    # 4. Spacy & NLTK
    print_step("Downloading SpaCy English Model")
    run_cmd([python_cmd, "-m", "spacy", "download", "en_core_web_lg"])
    print_success("SpaCy model downloaded.")
    
    print_step("Downloading NLTK Data")
    nltk_script = "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('averaged_perceptron_tagger')"
    run_cmd([python_cmd, "-c", nltk_script])
    print_success("NLTK data downloaded.")

    # 5. Frontend & Backend Setup
    print_step("Setting up Node.js Environments")
    print("Installing Backend dependencies...")
    run_cmd("npm install express cors multer pdf-parse dotenv axios cheerio puppeteer-core node-fetch", cwd="backend", shell=True)
    print_success("Backend dependencies installed.")

    print("Installing Frontend dependencies...")
    run_cmd("npm install react react-dom react-router-dom axios tailwindcss @tailwindcss/forms lucide-react react-dropzone react-hot-toast react-beautiful-dnd recharts framer-motion", cwd="frontend", shell=True)
    print_success("Frontend dependencies installed.")

    print_step("Tesseract OCR Setup Reminder")
    if os_name == "Darwin":
         print("macOS: Please ensure tesseract is installed -> `brew install tesseract`")
    elif os_name == "Linux":
         print("Linux: Please ensure tesseract is installed -> `sudo apt install tesseract-ocr`")
    else:
         print("Windows: Download tesseract installer from github.")
         
    print("\n====================================")
    print(" Setup Complete! Run 'bash start.sh'")
    print("====================================\n")

if __name__ == "__main__":
    setup()
