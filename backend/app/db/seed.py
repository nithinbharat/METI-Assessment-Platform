import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import engine, async_session_maker
from app.db.base import Base
from app.db.models import User, UserRole, Category, Assessment, Question, QuestionType, Option
from app.core.security import get_password_hash

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session_maker() as db:
        # Check if users exist
        result = await db.execute(select(User))
        if result.scalars().first() is not None:
            print("Database already contains data.")

        print("Seeding database with demo users, categories, assessments, coding sandbox, and file upload questions...")

        # Create Admin
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

        # Create Student / Candidate
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

        # Create Category
        res_cat = await db.execute(select(Category).where(Category.name == "Software Engineering"))
        cat_se = res_cat.scalars().first()
        if not cat_se:
            cat_se = Category(name="Software Engineering", description="Full-stack web development, REST APIs, databases, coding sandboxes, and DevOps.")
            cat_ds = Category(name="Data Science & AI", description="Machine learning, Python libraries, data analysis, and statistics.")
            db.add_all([cat_se, cat_ds])
            await db.flush()

        # Assessment 1: Full-Stack Web Development & Live Coding
        res_assess = await db.execute(select(Assessment).where(Assessment.title == "Full-Stack Web Development Assessment"))
        assess_1 = res_assess.scalars().first()
        if not assess_1:
            assess_1 = Assessment(
                category_id=cat_se.id,
                title="Full-Stack Web Development Assessment",
                description="Evaluate knowledge of Next.js, FastAPI, REST APIs, live Python/JS coding sandboxes, and file upload submissions.",
                time_limit_minutes=20,
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

            # Question 1: MCQ
            q1 = Question(
                assessment_id=assess_1.id,
                text="Which HTTP method is considered idempotent according to RFC 7231?",
                question_type=QuestionType.MCQ,
                points=1.0,
                explanation="GET, PUT, and DELETE methods are idempotent because multiple identical requests have the same intended effect on the server."
            )
            db.add(q1)
            await db.flush()
            
            db.add_all([
                Option(question_id=q1.id, option_text="POST", is_correct=False),
                Option(question_id=q1.id, option_text="GET", is_correct=True),
                Option(question_id=q1.id, option_text="PATCH", is_correct=False),
                Option(question_id=q1.id, option_text="CONNECT", is_correct=False)
            ])

            # Question 2: TRUE / FALSE
            q2 = Question(
                assessment_id=assess_1.id,
                text="FastAPI automatically generates interactive OpenAPI (Swagger) documentation at '/docs'.",
                question_type=QuestionType.TRUE_FALSE,
                points=1.0,
                explanation="True! FastAPI integrates OpenAPI out of the box using Swagger UI and ReDoc."
            )
            db.add(q2)
            await db.flush()

            db.add_all([
                Option(question_id=q2.id, option_text="True", is_correct=True),
                Option(question_id=q2.id, option_text="False", is_correct=False)
            ])

            # Question 3: AI NLP SHORT_TEXT
            q3 = Question(
                assessment_id=assess_1.id,
                text="Explain the concept of Asynchronous I/O in Python and why it is useful for web servers.",
                question_type=QuestionType.SHORT_TEXT,
                points=2.0,
                explanation="Asynchronous I/O allows single-threaded concurrent execution using async and await, enabling high performance during non-blocking network requests."
            )
            db.add(q3)
            await db.flush()
            db.add(Option(question_id=q3.id, option_text="Asynchronous I/O enables single threaded concurrency using async await for high performance non blocking network operations.", is_correct=True))

            # Question 4: INTERACTIVE CODING SANDBOX (Python)
            q4 = Question(
                assessment_id=assess_1.id,
                text="Write a Python function `reverse_words(sentence)` that takes a string of words separated by spaces and returns the sentence with words in reverse order.",
                question_type=QuestionType.CODING,
                programming_language="python",
                code_template="# Write your Python solution below\ndef reverse_words(sentence: str) -> str:\n    # Your code here\n    words = sentence.split()\n    return ' '.join(reversed(words))\n\n# Test your function\nprint(reverse_words('METI Assessment Platform Engine'))\n",
                points=3.0,
                explanation="Splitting words by space and reversing array order yields the correct reversed sentence string."
            )
            db.add(q4)
            await db.flush()

            # Question 5: FILE UPLOAD SUBMISSION
            q5 = Question(
                assessment_id=assess_1.id,
                text="Upload your compressed project repository (.zip, .py, or .js file) containing your solution to the mini web application task.",
                question_type=QuestionType.FILE_UPLOAD,
                points=3.0,
                explanation="Attached solution archive containing project source files."
            )
            db.add(q5)

            await db.commit()
            print("Full-Stack assessment with live coding sandbox and file uploads seeded successfully!")

        # Assessment 2: Data Science & AI/ML Assessment
        res_assess2 = await db.execute(select(Assessment).where(Assessment.title == "Data Science & AI/ML Assessment"))
        assess_2 = res_assess2.scalars().first()
        if not assess_2:
            assess_2 = Assessment(
                category_id=cat_ds.id,
                title="Data Science & AI/ML Assessment",
                description="Evaluate core knowledge of Python data structures, ML fundamentals, and statistical computing.",
                time_limit_minutes=25,
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

            # Question 1: MCQ
            q2_1 = Question(
                assessment_id=assess_2.id,
                text="Which Python library is primarily used for Data Analysis and DataFrame manipulation?",
                question_type=QuestionType.MCQ,
                points=1.0,
                explanation="Pandas provides DataFrames and Series structures for tabular data manipulation."
            )
            db.add(q2_1)
            await db.flush()
            db.add_all([
                Option(question_id=q2_1.id, option_text="NumPy", is_correct=False),
                Option(question_id=q2_1.id, option_text="Pandas", is_correct=True),
                Option(question_id=q2_1.id, option_text="Matplotlib", is_correct=False),
                Option(question_id=q2_1.id, option_text="Flask", is_correct=False)
            ])

            # Question 2: TRUE / FALSE
            q2_2 = Question(
                assessment_id=assess_2.id,
                text="Supervised Machine Learning requires labeled training data.",
                question_type=QuestionType.TRUE_FALSE,
                points=1.0,
                explanation="Supervised learning relies on input-output pairs of labeled training data."
            )
            db.add(q2_2)
            await db.flush()
            db.add_all([
                Option(question_id=q2_2.id, option_text="True", is_correct=True),
                Option(question_id=q2_2.id, option_text="False", is_correct=False)
            ])

            # Question 3: CODING
            q2_3 = Question(
                assessment_id=assess_2.id,
                text="Write a Python function `calculate_mean(numbers)` that calculates and returns the mean of a list of numbers.",
                question_type=QuestionType.CODING,
                programming_language="python",
                code_template="# Write your Python solution below\ndef calculate_mean(numbers: list) -> float:\n    # Your code here\n    if not numbers:\n        return 0.0\n    return sum(numbers) / len(numbers)\n\nprint(calculate_mean([10, 20, 30, 40]))\n",
                points=3.0,
                explanation="Summing all numbers in the list and dividing by list length computes the mathematical mean."
            )
            db.add(q2_3)

            await db.commit()
            print("Data Science assessment seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
