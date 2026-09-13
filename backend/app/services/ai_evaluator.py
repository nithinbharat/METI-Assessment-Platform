import json
import random
from typing import Dict, Any, Tuple, List, Set
from app.db.models import EvaluationStatus

TOPIC_KNOWLEDGE_BANK: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    "Python": {
        "primary": [
            {
                "text": "What is the difference between shallow copy and deep copy in Python's copy module?",
                "options": [
                    "Shallow copy copies object reference structure; deep copy recursively duplicates all nested objects.",
                    "Shallow copy works only on lists; deep copy works only on dictionaries.",
                    "Shallow copy modifies original objects; deep copy creates read-only immutable tuples.",
                    "There is no functional difference between them."
                ],
                "correct_idx": 0,
                "keywords": ["recursive", "nested", "duplicate", "reference", "copy"]
            },
            {
                "text": "Explain how Python's Global Interpreter Lock (GIL) affects multi-threading vs multi-processing.",
                "options": [
                    "GIL prevents multiple native threads from executing Python bytecodes at once, making multiprocessing better for CPU-bound tasks.",
                    "GIL speeds up multithreading for CPU-bound tasks by eliminating lock contention.",
                    "GIL only applies to async functions defined with async def.",
                    "GIL disables garbage collection in multi-threaded programs."
                ],
                "correct_idx": 0,
                "keywords": ["lock", "thread", "cpu", "bytecode", "process", "concurrency"]
            },
            {
                "text": "How do Python Generators differ from standard functions, and what is the role of the yield keyword?",
                "options": [
                    "Generators use yield to lazily produce values one at a time, preserving local variable state between iterations.",
                    "Generators execute faster by compiling Python code into C extensions.",
                    "Yield terminates function execution permanently like return.",
                    "Generators can only return list data types."
                ],
                "correct_idx": 0,
                "keywords": ["yield", "lazy", "state", "iterator", "generator"]
            },
            {
                "text": "What is a Python Decorator and how does `@functools.wraps` preserve function metadata?",
                "options": [
                    "A decorator wraps a function to modify behavior; `@wraps` copies original docstrings and name attributes to the wrapper.",
                    "Decorators automatically optimize loop performance.",
                    "wraps converts functions into class methods.",
                    "Decorators are used exclusively for database connection pooling."
                ],
                "correct_idx": 0,
                "keywords": ["wrap", "wrapper", "metadata", "docstring", "function", "decorator"]
            }
        ],
        "coding": [
            {
                "text": "Write a Python function `reverse_words(sentence: str) -> str` that takes a string of words separated by spaces and returns the sentence with words in reverse order.",
                "programming_language": "python",
                "code_template": "# Write your Python solution below\ndef reverse_words(sentence: str) -> str:\n    # Your code here\n    pass\n",
                "keywords": ["split", "reverse", "join", "reversed"]
            },
            {
                "text": "Write a Python function `count_vowels(s: str) -> int` that returns the total count of vowels (a, e, i, o, u) in a string `s`.",
                "programming_language": "python",
                "code_template": "# Write your Python solution below\ndef count_vowels(s: str) -> int:\n    # Your code here\n    pass\n",
                "keywords": ["for", "in", "count", "vowel", "return"]
            }
        ],
        "followup": [
            {
                "text": "Follow-up Clarification (Python Fundamentals): Which built-in function returns a unique integer identifier for a memory reference of an object?",
                "options": ["id()", "ref()", "address()", "hash()"],
                "correct_idx": 0,
                "keywords": ["id", "id()", "identity", "memory"]
            },
            {
                "text": "Follow-up Clarification (Python Data Structures): What is the average time complexity of key lookup in a Python dictionary?",
                "options": ["O(1) Constant Time", "O(N) Linear Time", "O(log N) Logarithmic Time", "O(N^2) Quadratic Time"],
                "correct_idx": 0,
                "keywords": ["o(1)", "constant", "hash", "dict"]
            }
        ]
    },
    "FastAPI": {
        "primary": [
            {
                "text": "How does FastAPI achieve high asynchronous performance compared to traditional WSGI frameworks?",
                "options": [
                    "Built on top of Starlette ASGI engine and Pydantic for async I/O coroutine execution.",
                    "Compiles Python code directly into native C binaries at runtime.",
                    "Executes all endpoints inside isolated OS process workers automatically.",
                    "Replaces HTTP with WebSockets for all API routes."
                ],
                "correct_idx": 0,
                "keywords": ["starlette", "asgi", "async", "pydantic", "coroutine", "io"]
            },
            {
                "text": "In FastAPI, how does automatic request validation work when defining Pydantic model parameters?",
                "options": [
                    "FastAPI inspects type hints and validates incoming JSON body payloads against Pydantic schemas automatically.",
                    "Validation requires writing manual try-except block validation in every route.",
                    "Validation executes only on client side before request transmission.",
                    "FastAPI relies on SQL database constraints for request payload validation."
                ],
                "correct_idx": 0,
                "keywords": ["pydantic", "schema", "validation", "type", "json", "body"]
            },
            {
                "text": "What is the purpose of BackgroundTasks in FastAPI response handling?",
                "options": [
                    "Executing non-blocking tasks (like sending email notifications) after returning HTTP responses.",
                    "Running long-running cron jobs indefinitely in separate containers.",
                    "Replacing Celery or Redis for heavy distributed data processing pipelines.",
                    "Automatically restarting worker threads upon crash."
                ],
                "correct_idx": 0,
                "keywords": ["background", "email", "response", "non-blocking", "task"]
            }
        ],
        "coding": [
            {
                "text": "Write a FastAPI GET route `/health` that returns a JSON response `{'status': 'ok', 'service': 'fastapi'}`.",
                "programming_language": "python",
                "code_template": "# Write your FastAPI route below\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n# Your code here\n",
                "keywords": ["@app.get", "/health", "async", "def", "return"]
            }
        ],
        "followup": [
            {
                "text": "Follow-up Clarification (FastAPI Routing): Which parameter decorator in FastAPI is used to perform automatic dependency injection?",
                "options": ["Depends()", "Inject()", "Provide()", "Service()"],
                "correct_idx": 0,
                "keywords": ["depends", "depends()", "dependency", "injection"]
            },
            {
                "text": "Follow-up Clarification (FastAPI Status Codes): Which status code should be returned when a resource is successfully created?",
                "options": ["201 Created", "200 OK", "204 No Content", "202 Accepted"],
                "correct_idx": 0,
                "keywords": ["201", "created"]
            }
        ]
    },
    "React": {
        "primary": [
            {
                "text": "In React 18, what is the primary purpose of the useMemo hook?",
                "options": [
                    "Memoize expensive calculation results across component re-renders.",
                    "Persist state changes to browser localStorage automatically.",
                    "Trigger side effects after component DOM mutation.",
                    "Handle asynchronous API fetch requests."
                ],
                "correct_idx": 0,
                "keywords": ["memoize", "calculation", "expensive", "re-render", "performance"]
            },
            {
                "text": "What is the Virtual DOM in React and how does reconciliation optimize UI updates?",
                "options": [
                    "Virtual DOM is an in-memory representation of DOM; reconciliation diffs virtual trees and batch updates real DOM efficiently.",
                    "Virtual DOM executes directly on browser GPU for faster canvas rendering.",
                    "Virtual DOM replaces browser CSS engine entirely.",
                    "Reconciliation downloads component bundles on-demand."
                ],
                "correct_idx": 0,
                "keywords": ["diff", "virtual", "in-memory", "dom", "batch", "reconciliation"]
            },
            {
                "text": "How does the useCallback hook differ from the useMemo hook in React?",
                "options": [
                    "useCallback memoizes callback function instances; useMemo memoizes computed return values.",
                    "useCallback runs on server; useMemo runs on client.",
                    "useCallback creates global context state; useMemo handles component refs.",
                    "There is no difference between them."
                ],
                "correct_idx": 0,
                "keywords": ["function", "callback", "value", "memoize", "usecallback"]
            }
        ],
        "coding": [
            {
                "text": "Write a React component `Counter()` in JavaScript using `useState` that initializes `count` to 0 and renders buttons to increment and decrement the count.",
                "programming_language": "javascript",
                "code_template": "// Write your React component below\nimport React, { useState } from 'react';\n\nexport function Counter() {\n    // Your code here\n    pass\n}\n",
                "keywords": ["useState", "count", "button", "onClick", "return"]
            }
        ],
        "followup": [
            {
                "text": "Follow-up Clarification (React Hooks): Which hook is used to manage mutable local component state?",
                "options": ["useState()", "useRef()", "useContext()", "useCallback()"],
                "correct_idx": 0,
                "keywords": ["usestate", "usestate()", "state"]
            },
            {
                "text": "Follow-up Clarification (React Component Lifecycle): Which hook replaces componentDidMount and componentWillUnmount?",
                "options": ["useEffect()", "useLayoutEffect()", "useState()", "useReducer()"],
                "correct_idx": 0,
                "keywords": ["useeffect", "useeffect()", "cleanup"]
            }
        ]
    },
    "Next.js": {
        "primary": [
            {
                "text": "In Next.js App Router, how do Server Components differ from Client Components ('use client')?",
                "options": [
                    "Server Components render strictly on the server without sending JS bundle code to the browser.",
                    "Client Components render faster than Server Components on initial page load.",
                    "Server Components can use React useState and useEffect hooks.",
                    "Server Components run only in the user's web browser."
                ],
                "correct_idx": 0,
                "keywords": ["server", "render", "bundle", "javascript", "use client"]
            },
            {
                "text": "What is Server-Side Rendering (SSR) vs Incremental Static Regeneration (ISR) in Next.js?",
                "options": [
                    "SSR generates HTML on every request; ISR updates static pages in background after build time at specified intervals.",
                    "ISR compiles React components into WebAssembly binaries.",
                    "SSR works only on mobile browsers while ISR works on desktop.",
                    "ISR requires disabling all API routes."
                ],
                "correct_idx": 0,
                "keywords": ["static", "regeneration", "background", "revalidate", "ssr", "isr"]
            }
        ],
        "coding": [
            {
                "text": "Write a Next.js Server Component `UserProfile({ userId })` that asynchronously fetches data from `https://api.example.com/users/${userId}` and renders user name in an `<h1>`.",
                "programming_language": "javascript",
                "code_template": "// Write your Next.js Server Component below\nexport default async function UserProfile({ userId }) {\n    // Your code here\n    pass\n}\n",
                "keywords": ["fetch", "await", "return", "h1"]
            }
        ],
        "followup": [
            {
                "text": "Follow-up Clarification (Next.js Routing): Which standard filename defines a route's visual UI view in App Router?",
                "options": ["page.tsx", "index.tsx", "route.ts", "layout.tsx"],
                "correct_idx": 0,
                "keywords": ["page.tsx", "page.js", "page"]
            }
        ]
    },
    "SQL": {
        "primary": [
            {
                "text": "What is the key difference between INNER JOIN and LEFT OUTER JOIN in SQL queries?",
                "options": [
                    "INNER JOIN returns matching rows in both tables; LEFT JOIN returns all rows from left table plus matching right rows.",
                    "LEFT JOIN is faster than INNER JOIN in indexed databases.",
                    "INNER JOIN merges columns; LEFT JOIN merges rows.",
                    "There is no difference in query execution results."
                ],
                "correct_idx": 0,
                "keywords": ["match", "matching", "left", "both", "null", "rows"]
            },
            {
                "text": "Explain ACID properties in relational database transactions.",
                "options": [
                    "Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent safety), Durability (persisted commits).",
                    "Asynchronous, Concurrent, Indexed, and Distributed database properties.",
                    "Aggregation, Constraints, Integrity, and Normalization rules.",
                    "None of the above."
                ],
                "correct_idx": 0,
                "keywords": ["atomicity", "consistency", "isolation", "durability", "acid"]
            }
        ],
        "coding": [
            {
                "text": "Write an SQL query to select `department`, COUNT(*) as `employee_count` from `employees` group by `department` having COUNT(*) >= 5.",
                "programming_language": "sql",
                "code_template": "-- Write your SQL query below\n",
                "keywords": ["select", "count", "from", "group by", "having"]
            }
        ],
        "followup": [
            {
                "text": "Follow-up Clarification (SQL Clauses): Which SQL clause is used to filter aggregated group records (after GROUP BY)?",
                "options": ["HAVING", "WHERE", "FILTER", "ORDER BY"],
                "correct_idx": 0,
                "keywords": ["having", "group by"]
            }
        ]
    },
    "Docker": {
        "primary": [
            {
                "text": "In Docker, what is the conceptual difference between a Docker Image and a Docker Container?",
                "options": [
                    "An Image is a read-only blueprint template; a Container is a runnable isolated instance of an Image.",
                    "A Container is static; an Image is dynamic.",
                    "Images run in production; Containers run in development.",
                    "Docker Containers require full virtual machine OS hypervisors."
                ],
                "correct_idx": 0,
                "keywords": ["blueprint", "template", "instance", "read-only", "runnable"]
            },
            {
                "text": "What is the function of Multi-Stage Builds in Dockerfiles?",
                "options": [
                    "Using multiple FROM statements to compile artifacts in builder stages and copy only final binaries to produce tiny production images.",
                    "Running multiple containers simultaneously inside 1 Docker daemon.",
                    "Building images across multiple CPU architectures in parallel.",
                    "Mounting persistent host volumes automatically."
                ],
                "correct_idx": 0,
                "keywords": ["multi-stage", "builder", "copy", "artifact", "binary", "tiny"]
            }
        ],
        "coding": [
            {
                "text": "Write a Dockerfile for a Python application based on `python:3.11-slim`, copying `requirements.txt`, executing `pip install -r requirements.txt`, copying app source, and exposing port 8000.",
                "programming_language": "dockerfile",
                "code_template": "# Write your Dockerfile below\n",
                "keywords": ["from", "copy", "run", "pip", "expose", "cmd"]
            }
        ],
        "followup": [
            {
                "text": "Follow-up Clarification (Docker CLI): Which command builds a Docker image from a local Dockerfile?",
                "options": ["docker build", "docker run", "docker create", "docker compose"],
                "correct_idx": 0,
                "keywords": ["docker build", "build"]
            }
        ]
    },
    "Data Science": {
        "primary": [
            {
                "text": "What is the primary difference between Supervised and Unsupervised Machine Learning?",
                "options": [
                    "Supervised learning trains on labeled data with targets; Unsupervised learning finds hidden patterns in unlabeled data.",
                    "Supervised learning requires GPU acceleration; Unsupervised learning runs on CPU.",
                    "Unsupervised learning is used only for linear regression.",
                    "Supervised learning does not require loss functions."
                ],
                "correct_idx": 0,
                "keywords": ["label", "target", "unlabeled", "pattern", "supervised", "unsupervised"]
            },
            {
                "text": "In Machine Learning, what is the Bias-Variance Tradeoff?",
                "options": [
                    "High bias causes underfitting by oversimplifying model assumptions; high variance causes overfitting by sensitivity to training noise.",
                    "Bias refers to dataset size; variance refers to feature count.",
                    "High variance causes underfitting; high bias causes overfitting.",
                    "It measures execution time vs RAM consumption."
                ],
                "correct_idx": 0,
                "keywords": ["underfitting", "overfitting", "noise", "bias", "variance"]
            }
        ],
        "coding": [
            {
                "text": "Write a Python function `calculate_mean(numbers: list) -> float` that calculates and returns the arithmetic mean of a list of numbers.",
                "programming_language": "python",
                "code_template": "# Write your Python solution below\ndef calculate_mean(numbers: list) -> float:\n    # Your code here\n    pass\n",
                "keywords": ["sum", "len", "return"]
            }
        ],
        "followup": [
            {
                "text": "Follow-up Clarification (ML Metrics): Which metric measures the ratio of true positive predictions among all positive predictions made?",
                "options": ["Precision", "Recall", "Accuracy", "MSE"],
                "correct_idx": 0,
                "keywords": ["precision", "positive", "true positive"]
            }
        ]
    }
}

GENERIC_TEMPLATES = [
    {
        "text": "Explain core architectural patterns and state management principles when designing applications with {topic}.",
        "options": [
            "Maintain modular component boundaries, single source of truth, separation of concerns, and clean error handling.",
            "Write all application logic inside 1 monolithic function.",
            "Avoid using version control or automated testing.",
            "Disable security checks in production."
        ],
        "correct_idx": 0,
        "keywords": ["modular", "state", "architecture", "separation", "testing", "clean"]
    },
    {
        "text": "In production engineering for {topic}, what techniques prevent memory leaks and performance bottlenecks under high load?",
        "options": [
            "Connection pooling, caching frequent queries, resource cleanup, and async non-blocking operations.",
            "Increasing polling frequency to 1 millisecond.",
            "Disabling database indexing.",
            "Restarting servers after every request."
        ],
        "correct_idx": 0,
        "keywords": ["caching", "pool", "cleanup", "performance", "memory", "async"]
    },
    {
        "text": "What are the security best practices (authentication, authorization, and data sanitization) when building APIs in {topic}?",
        "options": [
            "Using strong token validation (JWT/OAuth), parameterized queries against SQL injection, and HTTP-Only cookies.",
            "Storing passwords in plain text for fast access.",
            "Disabling CORS middleware completely.",
            "Exposing administrative database credentials in API payloads."
        ],
        "correct_idx": 0,
        "keywords": ["token", "jwt", "sanitization", "sql injection", "security", "cors"]
    }
]

def generate_question_data(
    topic: str,
    is_followup: bool = False,
    seen_texts: Set[str] = None,
    allow_coding: bool = False
) -> Dict[str, Any]:
    if seen_texts is None:
        seen_texts = set()

    topic_clean = topic.strip()
    bank_entry = TOPIC_KNOWLEDGE_BANK.get(topic_clean)
    
    if not bank_entry:
        for k, v in TOPIC_KNOWLEDGE_BANK.items():
            if k.lower() in topic_clean.lower():
                bank_entry = v
                break

    if bank_entry:
        # Check if coding question should be selected
        coding_pool = bank_entry.get("coding", [])
        if allow_coding and not is_followup and coding_pool and (random.random() < 0.5):
            unseen_coding = [q for q in coding_pool if q["text"] not in seen_texts]
            chosen = random.choice(unseen_coding) if unseen_coding else random.choice(coding_pool)
            return {
                "text": chosen["text"],
                "question_type": "CODING",
                "programming_language": chosen.get("programming_language", "python"),
                "code_template": chosen.get("code_template", "# Write your code below\n"),
                "options": [],
                "correct_idx": 0,
                "keywords": chosen.get("keywords", [])
            }

        pool = bank_entry["followup"] if is_followup else bank_entry["primary"]
        unseen = [q for q in pool if q["text"] not in seen_texts]
        chosen = random.choice(unseen) if unseen else random.choice(pool)
        return {
            "text": chosen["text"],
            "question_type": "MCQ",
            "programming_language": None,
            "code_template": None,
            "options": chosen["options"],
            "correct_idx": chosen["correct_idx"],
            "keywords": chosen.get("keywords", [])
        }
    else:
        # Dynamic generic topic generation with unseen template variation
        unseen_templates = [t for t in GENERIC_TEMPLATES if t["text"].format(topic=topic_clean) not in seen_texts]
        chosen_template = random.choice(unseen_templates) if unseen_templates else random.choice(GENERIC_TEMPLATES)
        
        return {
            "text": chosen_template["text"].format(topic=topic_clean),
            "question_type": "MCQ",
            "programming_language": None,
            "code_template": None,
            "options": [opt.format(topic=topic_clean) for opt in chosen_template["options"]],
            "correct_idx": chosen_template["correct_idx"],
            "keywords": chosen_template["keywords"]
        }

def evaluate_candidate_answer(
    topic: str,
    question_data: Dict[str, Any],
    candidate_answer: str
) -> Tuple[EvaluationStatus, float, str]:
    answer_clean = candidate_answer.strip()
    
    if not answer_clean:
        return EvaluationStatus.NEEDS_CLARIFICATION, 0.0, "No answer provided."

    q_type = question_data.get("question_type", "MCQ")
    options = question_data.get("options") or []

    # --- 1. CODING QUESTION EVALUATION ---
    if q_type == "CODING" or not options:
        template = (question_data.get("code_template") or "").strip()
        if answer_clean == template or answer_clean.lower() in ("pass", "pass\n", "// write your code here"):
            return EvaluationStatus.NEEDS_CLARIFICATION, 0.1, f"Only starter boilerplate submitted for {topic}. Please type your actual code solution."
        
        lang = (question_data.get("programming_language") or "python").lower()
        if lang == "python":
            try:
                compile(answer_clean, "<string>", "exec")
            except SyntaxError as e:
                return EvaluationStatus.NEEDS_CLARIFICATION, 0.35, f"Syntax Error: {e.msg} at line {e.lineno}. Please fix the syntax."

        keywords = question_data.get("keywords", [])
        matched_keywords = sum(1 for kw in keywords if kw.lower() in answer_clean.lower())
        keyword_score = (matched_keywords / len(keywords)) if keywords else 0.5
        
        if keyword_score >= 0.4 or len(answer_clean) > 40:
            confidence_score = min(0.95, round(0.70 + (keyword_score * 0.25), 2))
            status = EvaluationStatus.CONFIDENT
            feedback = f"🌟 High Confidence ({int(confidence_score * 100)}% Match)! Your {topic} code solution is syntactically sound and implements required logic."
        else:
            confidence_score = max(0.30, round(keyword_score * 0.6, 2))
            status = EvaluationStatus.NEEDS_CLARIFICATION
            feedback = f"🔍 Needs Clarification ({int(confidence_score * 100)}% Match). Your code solution for {topic} is missing key logic or syntax elements."

        return status, confidence_score, feedback

    # --- 2. MULTIPLE CHOICE QUESTION EVALUATION ---
    correct_idx = question_data.get("correct_idx", 0)
    correct_option_text = options[correct_idx] if len(options) > correct_idx else ""
    keywords = question_data.get("keywords", [])

    is_exact_option = answer_clean.lower() in [opt.lower() for opt in options]
    is_correct_option = (answer_clean.lower() == correct_option_text.lower())
    
    matched_keywords = sum(1 for kw in keywords if kw.lower() in answer_clean.lower())
    keyword_score = matched_keywords / len(keywords) if keywords else 0.5
    
    if is_correct_option or (is_exact_option and is_correct_option):
        confidence_score = 0.95
    elif is_exact_option and not is_correct_option:
        confidence_score = 0.25
    else:
        confidence_score = min(1.0, round(keyword_score + 0.35, 2)) if matched_keywords > 0 else 0.30

    if confidence_score >= 0.70:
        status = EvaluationStatus.CONFIDENT
        feedback = f"🌟 High Confidence ({int(confidence_score * 100)}% Match)! Excellent understanding of {topic}. Moving forward to the next resume skill."
    else:
        status = EvaluationStatus.NEEDS_CLARIFICATION
        feedback = f"🔍 Needs Clarification ({int(confidence_score * 100)}% Match). Your answer lacked key concepts for {topic}. Asking a follow-up question to re-assess fundamentals."

    return status, confidence_score, feedback
