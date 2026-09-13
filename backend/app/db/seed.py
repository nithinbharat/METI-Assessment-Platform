import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, text
from app.db.session import engine, async_session_maker
from app.db.base import Base
from app.db.models import User, UserRole, Category, Assessment, Question, QuestionType, Option, Attempt
from app.core.security import get_password_hash

# Define question banks for the two assessments
FULL_STACK_QUESTIONS = [
    {
        "text": "[Java] What is the primary function of the Java Virtual Machine (JVM) ClassLoader?",
        "topic": "Java",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "The JVM ClassLoader subsystem dynamically loads compiled .class bytecode files into runtime memory and links them during execution.",
        "options": [
            ("It compiles Java source code directly into native assembly instructions.", False),
            ("It dynamically loads, links, and initializes Java bytecode (.class files) into JVM memory.", True),
            ("It acts as a physical hardware emulator for CPU registers.", False),
            ("It manages HTTP servlet requests in Spring Boot applications.", False),
        ]
    },
    {
        "text": "[HTML] Which semantic HTML5 element represents self-contained content that could be distributed independently, such as a blog post or news story?",
        "topic": "HTML",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "The <article> element represents a self-contained composition in a document, page, or site, intended to be independently distributable or reusable.",
        "options": [
            ("<section>", False),
            ("<article>", True),
            ("<aside>", False),
            ("<main>", False),
        ]
    },
    {
        "text": "[CSS] In the standard CSS Box Model, which property determines the space between the content box and the element's border?",
        "topic": "CSS",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Padding creates space between the element's content area and its inner border, whereas Margin creates space outside the border.",
        "options": [
            ("margin", False),
            ("padding", True),
            ("outline", False),
            ("gap", False),
        ]
    },
    {
        "text": "[JavaScript] In the JavaScript event loop, which queue has higher priority and executes immediately after the current script and before the next task?",
        "topic": "JavaScript",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "The Microtask Queue (handling Promise.then callbacks, queueMicrotask, and MutationObservers) is drained completely before the next Macrotask (such as setTimeout/setInterval) runs.",
        "options": [
            ("Macrotask Queue (Task Queue)", False),
            ("Microtask Queue (Job Queue)", True),
            ("Render Animation Queue", False),
            ("Worker Thread Pool Queue", False),
        ]
    },
    {
        "text": "[Python] What is the primary purpose of the Global Interpreter Lock (GIL) in standard CPython?",
        "topic": "Python",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "CPython's GIL is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously, ensuring thread-safe reference-counted memory management.",
        "options": [
            ("It optimizes JIT compilation for nested loops.", False),
            ("It ensures thread-safe memory management by allowing only one native thread to execute Python bytecode at a time.", True),
            ("It restricts network sockets to asynchronous non-blocking connections.", False),
            ("It provides cryptographic hashing for Python strings.", False),
        ]
    },
    {
        "text": "[Django] In Django's Model-View-Template (MVT) architecture, what is the primary role of the 'View'?",
        "topic": "Django",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "In Django MVT, the View encapsulates the business logic, receives HTTP requests, interacts with Models, and returns HTTP responses or renders Templates.",
        "options": [
            ("It manages the database schema and writes SQL migration tables.", False),
            ("It contains the business logic that receives HTTP requests, queries models, and returns HTTP responses.", True),
            ("It serves as the static CSS/HTML presentation file in the browser.", False),
            ("It configures URL routing paths in the urls.py file.", False),
        ]
    },
    {
        "text": "[Node.js] Why can Node.js handle thousands of concurrent network connections despite having a single main JavaScript execution thread?",
        "topic": "Node.js",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Node.js utilizes an event-driven, non-blocking I/O model powered by the Libuv library, delegating asynchronous system calls to the operating system kernel and worker pool.",
        "options": [
            ("It assigns a dedicated physical CPU thread to every incoming HTTP connection.", False),
            ("It uses an event-driven, non-blocking I/O loop backed by Libuv that offloads system operations to kernel threads.", True),
            ("It executes JavaScript code ahead-of-time (AOT) into binary assembly before serving requests.", False),
            ("It bypasses TCP/IP handshake protocols using direct memory sockets.", False),
        ]
    },
    {
        "text": "[REST APIs & Web] According to RFC 7231, which HTTP methods are defined as idempotent?",
        "topic": "REST APIs",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "GET, PUT, and DELETE are idempotent because multiple identical requests will produce the same intended side-effect on the server resource state.",
        "options": [
            ("POST and PATCH", False),
            ("GET, PUT, and DELETE", True),
            ("POST, CONNECT, and OPTIONS", False),
            ("PUT, PATCH, and POST", False),
        ]
    },
    {
        "text": "[Databases & SQL] In relational databases and Object-Relational Mappers (ORMs), what causes the 'N+1 query problem'?",
        "topic": "Databases & SQL",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "The N+1 query problem occurs when an application executes 1 query to fetch parent records and then issues N separate queries for each related child record instead of using a JOIN or prefetch.",
        "options": [
            ("Creating N+1 indexes on a single table causing write contention.", False),
            ("Executing 1 query to retrieve parent entities and N subsequent queries to fetch related child records for each entity.", True),
            ("Allocating N+1 database connections in the connection pool.", False),
            ("Exceeding foreign key constraint validation limits.", False),
        ]
    },
    {
        "text": "[Full-Stack Architecture] JSON Web Tokens (JWT) stored in HTTP-Only, SameSite cookies are immune to Cross-Site Scripting (XSS) token theft.",
        "topic": "Web Security",
        "type": QuestionType.TRUE_FALSE,
        "points": 1.0,
        "explanation": "True. Setting the HttpOnly flag prevents client-side scripts (JavaScript) from accessing document.cookie, mitigating direct token exfiltration via XSS.",
        "options": [
            ("True", True),
            ("False", False),
        ]
    },
    {
        "text": "[Coding Sandbox] Write a Python function `reverse_words(sentence)` that takes a string of words separated by spaces and returns the sentence with words in reverse order.",
        "topic": "Python Coding",
        "type": QuestionType.CODING,
        "points": 3.0,
        "explanation": "Splitting words by space, reversing array order with slicing or reverse(), and joining them yields the correct reversed sentence string.",
        "programming_language": "python",
        "code_template": "# Write your Python solution below\ndef reverse_words(sentence: str) -> str:\n    # Example: 'hello world' -> 'world hello'\n    return ' '.join(sentence.split()[::-1])\n",
        "options": []
    },
    {
        "text": "[Coding Sandbox] Write a Python function `is_palindrome(s)` that returns True if the string `s` reads the same backward as forward (ignoring casing), otherwise False.",
        "topic": "Algorithm Coding",
        "type": QuestionType.CODING,
        "points": 3.0,
        "explanation": "Normalizing case and comparing the string to its reversed version verifies palindrome equality.",
        "programming_language": "python",
        "code_template": "# Write your Python solution below\ndef is_palindrome(s: str) -> bool:\n    cleaned = s.lower()\n    return cleaned == cleaned[::-1]\n",
        "options": []
    }
]

DATA_SCIENCE_QUESTIONS = [
    {
        "text": "[Data Science] In hypothesis testing, what does a p-value less than the chosen significance level (e.g. alpha = 0.05) indicate?",
        "topic": "Data Science",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "A p-value < 0.05 provides statistically significant evidence against the null hypothesis, allowing you to reject the null hypothesis in favor of the alternative hypothesis.",
        "options": [
            ("The null hypothesis is definitively proven to be true.", False),
            ("There is statistically significant evidence to reject the null hypothesis.", True),
            ("The statistical test has an error rate greater than 95%.", False),
            ("The dataset contains zero variance or bias.", False),
        ]
    },
    {
        "text": "[Data Analysis] In the Python Pandas library, which function or method is used to impute or replace missing NaN values across a DataFrame?",
        "topic": "Data Analysis",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "df.fillna() is used to replace NA/NaN values with specified values, forward fills, or mean/median imputations.",
        "options": [
            ("df.dropna()", False),
            ("df.fillna()", True),
            ("df.replace_null()", False),
            ("df.interpolate_na()", False),
        ]
    },
    {
        "text": "[Data Engineering] What is the core architectural difference between traditional ETL (Extract, Transform, Load) and modern ELT (Extract, Load, Transform)?",
        "topic": "Data Engineering",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "In ELT, raw data is loaded directly into the target cloud data warehouse/lake first, and transformations are performed inside the warehouse using its distributed compute engine.",
        "options": [
            ("ETL only works with unstructured audio/video files while ELT works with SQL tables.", False),
            ("In ELT, data is loaded into the cloud storage/warehouse first before transformations are executed using warehouse compute.", True),
            ("ELT completely avoids using database indexes and schema definitions.", False),
            ("ETL is strictly streaming whereas ELT is strictly batch.", False),
        ]
    },
    {
        "text": "[AWS] Which AWS managed service is specifically designed for running distributed big data processing frameworks like Apache Spark, Hadoop, and Presto?",
        "topic": "AWS",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Amazon EMR (Elastic MapReduce) is AWS's managed big data platform for processing massive amounts of data using open-source tools like Apache Spark, Hadoop, Hive, and HBase.",
        "options": [
            ("Amazon RDS", False),
            ("Amazon EMR (Elastic MapReduce)", True),
            ("Amazon CloudWatch", False),
            ("AWS Lambda", False),
        ]
    },
    {
        "text": "[AWS] Which AWS serverless service allows you to run SQL queries directly on structured and semi-structured data stored in Amazon S3 without provisioning infrastructure?",
        "topic": "AWS",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Amazon Athena is an interactive, serverless query service that makes it easy to analyze data directly in Amazon S3 using standard SQL.",
        "options": [
            ("Amazon Redshift", False),
            ("Amazon Athena", True),
            ("Amazon DynamoDB", False),
            ("AWS AppSync", False),
        ]
    },
    {
        "text": "[Hadoop] In the Hadoop Distributed File System (HDFS) master-worker architecture, what is the responsibility of the NameNode?",
        "topic": "Hadoop",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "The NameNode maintains the filesystem namespace, tree directory structure, and metadata mapping of block locations across DataNodes.",
        "options": [
            ("It physically stores and retrieves actual data block bytes on local disks.", False),
            ("It manages the filesystem metadata, directory tree, and block location mapping across cluster DataNodes.", True),
            ("It compiles Java MapReduce tasks into Spark bytecodes.", False),
            ("It schedules CPU worker threads for client browsers.", False),
        ]
    },
    {
        "text": "[Spark & Hive] What is the primary characteristic of an RDD (Resilient Distributed Dataset) in Apache Spark?",
        "topic": "Spark & Hive",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "RDDs are immutable, fault-tolerant, lazily evaluated collections of data partitioned across cluster nodes that can be operated on in parallel.",
        "options": [
            ("They are mutable single-node relational tables updated via SQL triggers.", False),
            ("They are immutable, fault-tolerant distributed collections of objects computed across cluster nodes with lazy evaluation.", True),
            ("They are physical disk sectors allocated by the operating system kernel.", False),
            ("They are synchronous network sockets used for streaming video.", False),
        ]
    },
    {
        "text": "[Spark & Hive] In Apache Hive data warehousing, how does table 'Partitioning' differ from table 'Bucketing'?",
        "topic": "Spark & Hive",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Partitioning divides data into subdirectories based on distinct column values (e.g., date, country), while Bucketing decomposes data into fixed-size files within partitions using a hash function on a specified column.",
        "options": [
            ("Partitioning stores data in memory while Bucketing stores data on SSDs.", False),
            ("Partitioning creates distinct subdirectories based on column values, whereas Bucketing divides data into fixed hash-based files.", True),
            ("Bucketing is only supported in relational MySQL databases.", False),
            ("Partitioning compresses data with GZIP while Bucketing encrypts with AES.", False),
        ]
    },
    {
        "text": "[Machine Learning] What does the Bias-Variance tradeoff describe in supervised machine learning models?",
        "topic": "Machine Learning",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "High bias leads to underfitting (oversimplifying model assumptions), while high variance leads to overfitting (capturing noise in training data instead of generalizable patterns).",
        "options": [
            ("The tradeoff between training CPU speed and GPU memory bandwidth.", False),
            ("The tension between model underfitting (high bias) and model overfitting (high variance) when generalizing to unseen data.", True),
            ("The balance between positive and negative classes in binary classification.", False),
            ("The ratio of numerical features to categorical features in the dataset.", False),
        ]
    },
    {
        "text": "[Feature Engineering] Why is One-Hot Encoding preferred over Label Encoding for nominal categorical features without an inherent order (e.g. Colors: Red, Green, Blue)?",
        "topic": "Feature Engineering",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Label Encoding assigns arbitrary integers (0, 1, 2) which can mislead linear and distance-based algorithms into assuming an artificial numerical hierarchy or order.",
        "options": [
            ("Label Encoding causes division by zero errors during gradient descent.", False),
            ("Label Encoding introduces an artificial ordinal hierarchy (e.g. 2 > 1 > 0) that distance-based and linear models can misinterpret.", True),
            ("One-Hot Encoding reduces memory footprint by compressing column counts.", False),
            ("One-Hot Encoding automatically removes outliers from numeric distributions.", False),
        ]
    },
    {
        "text": "[AI] What is the primary advantage of the Rectified Linear Unit (ReLU) activation function over the Sigmoid function in deep neural networks?",
        "topic": "AI",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "ReLU (f(x) = max(0, x)) does not saturate for positive values, which prevents the vanishing gradient problem and accelerates gradient descent convergence.",
        "options": [
            ("It scales all outputs strictly between -1.0 and +1.0.", False),
            ("It avoids gradient saturation for positive activations, mitigating the vanishing gradient problem and accelerating training.", True),
            ("It eliminates the need for backpropagation and weights optimization.", False),
            ("It guarantees convex optimization without local minima.", False),
        ]
    },
    {
        "text": "[Gen AI] In Generative AI and Large Language Models, what is the role of the Multi-Head Self-Attention mechanism in the Transformer architecture?",
        "topic": "Gen AI",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Multi-Head Self-Attention enables the model to simultaneously attend to information from different representation subspaces and positions, capturing contextual semantic relationships across tokens.",
        "options": [
            ("It converts audio frequencies into pixel matrices.", False),
            ("It allows the model to jointly attend to contextual relationships and dependencies across different positions and representation subspaces.", True),
            ("It performs garbage collection on unused model parameters during inference.", False),
            ("It acts as a physical firewall against prompt injection attacks.", False),
        ]
    },
    {
        "text": "[RAG] In a Retrieval-Augmented Generation (RAG) system, what is the purpose of storing text chunk vector embeddings in a Vector Database (e.g. Chroma, FAISS, Pinecone)?",
        "topic": "RAG",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Vector databases enable fast semantic similarity search (using cosine similarity or dot product) to retrieve relevant contextual passages that augment the LLM prompt.",
        "options": [
            ("To encrypt database records using AES-256 keys.", False),
            ("To perform fast semantic similarity searches and retrieve top-k relevant knowledge passages to provide ground truth context to the LLM.", True),
            ("To execute SQL ACID transactions across multiple master nodes.", False),
            ("To fine-tune LLM foundation model weights on every query.", False),
        ]
    },
    {
        "text": "[Prompt Engineering] What is 'Chain-of-Thought' (CoT) prompting in Large Language Model interactions?",
        "topic": "Prompt Engineering",
        "type": QuestionType.MCQ,
        "points": 1.0,
        "explanation": "Chain-of-Thought prompting encourages the LLM to output intermediate reasoning steps before arriving at the final answer, significantly improving accuracy on complex reasoning tasks.",
        "options": [
            ("Sending multiple parallel API requests simultaneously to reduce latency.", False),
            ("Instructing the model to decompose complex problems into intermediate step-by-step reasoning before providing the final answer.", True),
            ("Injecting malicious system prompts to jailbreak the model guardrails.", False),
            ("Compressing prompts into tokenized hashes to bypass context window limits.", False),
        ]
    },
    {
        "text": "[Coding Sandbox] Write a Python function `calculate_mean(numbers)` that returns the arithmetic mean of a list of floating point or integer numbers.",
        "topic": "Data Science Coding",
        "type": QuestionType.CODING,
        "points": 3.0,
        "explanation": "Summing the numbers and dividing by the count yields the arithmetic mean.",
        "programming_language": "python",
        "code_template": "# Write your Python solution below\ndef calculate_mean(numbers: list) -> float:\n    if not numbers:\n        return 0.0\n    return sum(numbers) / len(numbers)\n",
        "options": []
    }
]

async def seed_data(refresh_questions: bool = True):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session_maker() as db:
        print("Seeding database with demo users, categories, assessments, and topic questions...")

        # Ensure 'topic' column exists in questions table for SQLite
        try:
            await db.execute(text("ALTER TABLE questions ADD COLUMN topic VARCHAR(100)"))
            await db.commit()
        except Exception:
            pass # already exists

        # 1. Create or verify Admin
        res_admin = await db.execute(select(User).where(User.email == "admin@meti.org"))
        admin = res_admin.scalars().first()
        if not admin:
            admin = User(
                email="admin@meti.org",
                hashed_password=get_password_hash("admin123"),
                full_name="Platform Admin",
                role=UserRole.ADMIN
            )
            db.add(admin)

        # 2. Create or verify Student / Candidate
        res_student = await db.execute(select(User).where(User.email == "student@meti.org"))
        student = res_student.scalars().first()
        if not student:
            student = User(
                email="student@meti.org",
                hashed_password=get_password_hash("student123"),
                full_name="Demo Candidate",
                role=UserRole.CANDIDATE
            )
            db.add(student)

        await db.flush()

        # 3. Create or verify Categories
        res_cat_se = await db.execute(select(Category).where(Category.name == "Software Engineering"))
        cat_se = res_cat_se.scalars().first()
        if not cat_se:
            cat_se = Category(
                name="Software Engineering",
                description="Full-stack web development, Java, Python, JavaScript, Django, Node.js, databases, and APIs."
            )
            db.add(cat_se)

        res_cat_ds = await db.execute(select(Category).where(Category.name == "Data Science & AI"))
        cat_ds = res_cat_ds.scalars().first()
        if not cat_ds:
            cat_ds = Category(
                name="Data Science & AI",
                description="Data Science, Machine Learning, Data Engineering, AWS, Big Data (Hadoop, Spark, Hive), Generative AI, RAG, and Prompt Engineering."
            )
            db.add(cat_ds)

        await db.flush()

        # 4. Assessment 1: Full-Stack Web Development
        res_assess1 = await db.execute(select(Assessment).where(Assessment.title == "Full-Stack Web Development Assessment"))
        assess_1 = res_assess1.scalars().first()
        if not assess_1:
            assess_1 = Assessment(
                category_id=cat_se.id,
                title="Full-Stack Web Development Assessment",
                description="Comprehensive evaluation covering Java, HTML, CSS, JavaScript, Python, Django, Node.js, REST APIs, databases, and live coding.",
                time_limit_minutes=30,
                passing_score_percentage=70.0,
                is_active=True,
                is_proctored=True,
                tab_monitoring_enabled=True,
                fullscreen_required=True,
                webcam_monitoring_enabled=True,
                face_monitoring_enabled=True
            )
            db.add(assess_1)
            await db.flush()
        else:
            assess_1.description = "Comprehensive evaluation covering Java, HTML, CSS, JavaScript, Python, Django, Node.js, REST APIs, databases, and live coding."
            assess_1.time_limit_minutes = 30
            assess_1.is_active = True

        # 5. Assessment 2: Data Science & AI/ML Assessment
        res_assess2 = await db.execute(select(Assessment).where(Assessment.title == "Data Science & AI/ML Assessment"))
        assess_2 = res_assess2.scalars().first()
        if not assess_2:
            assess_2 = Assessment(
                category_id=cat_ds.id,
                title="Data Science & AI/ML Assessment",
                description="Comprehensive evaluation covering Data Science, Data Analysis, Data Engineering, AWS, Hadoop, Spark & Hive, AI, RAG, Generative AI, Prompt Engineering, Feature Engineering, and ML algorithms.",
                time_limit_minutes=35,
                passing_score_percentage=70.0,
                is_active=True,
                is_proctored=True,
                tab_monitoring_enabled=True,
                fullscreen_required=True,
                webcam_monitoring_enabled=True,
                face_monitoring_enabled=True
            )
            db.add(assess_2)
            await db.flush()
        else:
            assess_2.description = "Comprehensive evaluation covering Data Science, Data Analysis, Data Engineering, AWS, Hadoop, Spark & Hive, AI, RAG, Generative AI, Prompt Engineering, Feature Engineering, and ML algorithms."
            assess_2.time_limit_minutes = 35
            assess_2.is_active = True

        await db.commit()

        if refresh_questions:
            print("Refreshing questions for Assessment 1 (Full-Stack Web Development)...")
            # Clear old questions for Assessment 1
            old_q1 = await db.execute(select(Question).where(Question.assessment_id == assess_1.id))
            for q in old_q1.scalars().all():
                await db.delete(q)
            await db.flush()

            # Insert Full Stack Questions
            for q_data in FULL_STACK_QUESTIONS:
                question = Question(
                    assessment_id=assess_1.id,
                    text=q_data["text"],
                    question_type=q_data["type"],
                    points=q_data["points"],
                    explanation=q_data.get("explanation"),
                    code_template=q_data.get("code_template"),
                    programming_language=q_data.get("programming_language"),
                    topic=q_data.get("topic")
                )
                db.add(question)
                await db.flush()

                for opt_text, is_corr in q_data.get("options", []):
                    db.add(Option(
                        question_id=question.id,
                        option_text=opt_text,
                        is_correct=is_corr
                    ))

            print(f"Added {len(FULL_STACK_QUESTIONS)} questions to Full-Stack Web Development.")

            print("Refreshing questions for Assessment 2 (Data Science & AI/ML)...")
            # Clear old questions for Assessment 2
            old_q2 = await db.execute(select(Question).where(Question.assessment_id == assess_2.id))
            for q in old_q2.scalars().all():
                await db.delete(q)
            await db.flush()

            # Insert Data Science Questions
            for q_data in DATA_SCIENCE_QUESTIONS:
                question = Question(
                    assessment_id=assess_2.id,
                    text=q_data["text"],
                    question_type=q_data["type"],
                    points=q_data["points"],
                    explanation=q_data.get("explanation"),
                    code_template=q_data.get("code_template"),
                    programming_language=q_data.get("programming_language"),
                    topic=q_data.get("topic")
                )
                db.add(question)
                await db.flush()

                for opt_text, is_corr in q_data.get("options", []):
                    db.add(Option(
                        question_id=question.id,
                        option_text=opt_text,
                        is_correct=is_corr
                    ))

            print(f"Added {len(DATA_SCIENCE_QUESTIONS)} questions to Data Science & AI/ML.")

            # Clear any stale IN_PROGRESS attempts so candidates get a clean start with new questions
            stale_attempts = await db.execute(select(Attempt).where(Attempt.status == "IN_PROGRESS"))
            for att in stale_attempts.scalars().all():
                await db.delete(att)

            await db.commit()
            print("Successfully refreshed assessments, questions, and attempt states!")

if __name__ == "__main__":
    asyncio.run(seed_data(refresh_questions=True))
