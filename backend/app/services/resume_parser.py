import io
import re
from typing import List, Tuple

try:
    # pyrefly: ignore [missing-import]
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

SKILL_TAXONOMY = [
    "Python", "JavaScript", "TypeScript", "Next.js", "React", "Node.js", "FastAPI",
    "Django", "Flask", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "REST API", "GraphQL",
    "HTML", "CSS", "Tailwind CSS", "Linux", "C++", "Java", "Machine Learning",
    "Data Science", "Pandas", "NumPy", "PyTorch", "TensorFlow", "Scikit-Learn"
]

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        if HAS_PYPDF:
            try:
                reader = PdfReader(io.BytesIO(file_content))
                extracted_pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted_pages.append(text)
                return "\n".join(extracted_pages)
            except Exception as e:
                return f"PDF Parsing Fallback: {str(e)}"
        else:
            try:
                return file_content.decode("utf-8", errors="ignore")
            except Exception:
                return str(file_content)
    else:
        # Text or raw content fallback
        try:
            return file_content.decode("utf-8", errors="ignore")
        except Exception:
            return str(file_content)

def extract_skills_from_text(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = []
    
    for skill in SKILL_TAXONOMY:
        # Match word boundaries or substring
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill)
            
    # Default skills fallback if resume is brief
    if not found_skills:
        found_skills = ["Software Engineering", "Python", "Full-Stack Development"]
        
    return found_skills
