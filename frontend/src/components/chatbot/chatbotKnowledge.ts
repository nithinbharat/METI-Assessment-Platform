export interface KnowledgeItem {
  intent: string;
  category: "Overview" | "Assessments" | "AI Resume" | "Admin" | "Results" | "Account";
  keywords: string[];
  suggestedQuestion: string;
  response: string;
}

export const chatbotKnowledge: KnowledgeItem[] = [
  {
    intent: "platform_overview",
    category: "Overview",
    keywords: [
      "what is meti",
      "about application",
      "overview",
      "what does this app do",
      "features",
      "platform",
      "what is this application",
      "what can i do here",
      "what is the meti assessment platform",
    ],
    suggestedQuestion: "What is the METI Assessment Platform?",
    response:
      "METI Assessment Platform is a full-stack enterprise evaluation engine designed for candidate testing. Key features include: 1) Timed live examinations with automated grading, 2) AI Resume Skill Interview Engine with adaptive confidence evaluation, 3) Admin Control Center for authoring tests and question banks, and 4) System-wide candidate analytics & leaderboards.",
  },
  {
    intent: "dashboard_usage",
    category: "Overview",
    keywords: [
      "dashboard",
      "how to use dashboard",
      "candidate hub",
      "my dashboard",
      "metrics",
      "attempted",
      "passed count",
      "avg score",
      "how do i use the dashboard",
      "how to use candidate dashboard",
    ],
    suggestedQuestion: "How do I use the dashboard?",
    response:
      "Your Candidate Dashboard ('/dashboard') displays your performance metrics (total tests attempted, passed count, average score percentage). Below the metrics, you can browse all active assessments to start a test, or view your past completed attempt history table.",
  },
  {
    intent: "create_assessment",
    category: "Admin",
    keywords: [
      "create assessment",
      "create a new assessment",
      "create new assessment",
      "new test",
      "add exam",
      "author test",
      "create test",
      "make test",
      "how do i create an assessment",
      "how do i create a new assessment",
    ],
    suggestedQuestion: "How do I create a new assessment?",
    response:
      "To create an assessment: 1) Sign in as an Administrator (e.g., admin@meti.org). 2) Open the Admin Control Center ('/admin'). 3) Locate 'Assessment Management' and click 'Create Assessment'. 4) Enter the title, description, category tag, duration limit (in minutes), and passing score percentage threshold.",
  },
  {
    intent: "author_questions",
    category: "Admin",
    keywords: [
      "add question",
      "how do i add questions",
      "author question",
      "question bank",
      "mcq",
      "true false",
      "short answer",
      "question options",
      "how do i add questions to an assessment",
    ],
    suggestedQuestion: "How do I add questions to an assessment?",
    response:
      "In the Admin Control Center ('/admin'), select an assessment and open the Question Bank authoring tab. Click 'Add Question', choose the question type (Multiple Choice MCQ, True/False, or Short Text), enter point values, correct answer options, and explanation rationales.",
  },
  {
    intent: "take_assessment",
    category: "Assessments",
    keywords: [
      "take assessment",
      "start test",
      "begin exam",
      "how to test",
      "launch exam",
      "how do i take",
      "test room",
      "how do i start an assessment",
      "how to start assessment",
    ],
    suggestedQuestion: "How do I start an assessment?",
    response:
      "From the Candidate Dashboard ('/dashboard'), scroll to 'Available Assessments' and click 'Start Test' next to any active test. This opens the Exam Room ('/assessment/[id]/take') featuring a real-time countdown timer, question navigation matrix, draft saving, and auto-submit.",
  },
  {
    intent: "exam_navigation",
    category: "Assessments",
    keywords: [
      "exam room",
      "navigate questions",
      "question matrix",
      "flag question",
      "unanswered",
      "answered",
      "how does the exam room navigation matrix work",
    ],
    suggestedQuestion: "How does the exam room navigation matrix work?",
    response:
      "Inside the Exam Room, the right sidebar contains a Question Matrix grid. Click any question number to jump directly to it. The matrix uses color indicators: Blue for answered questions, Gray for unanswered questions, and Yellow flags for questions you flagged for later review.",
  },
  {
    intent: "view_results",
    category: "Results",
    keywords: [
      "view results",
      "see score",
      "my attempts",
      "results",
      "score report",
      "report",
      "passed or failed",
      "how do i view results",
      "where can i view my assessment results",
      "where to view results",
    ],
    suggestedQuestion: "Where can I view my assessment results?",
    response:
      "View your results from the Candidate Dashboard under 'Your Attempt History'. Click 'View Score Report' next to any completed attempt to open the Score Report page ('/assessment/[id]/result'), detailing your total score, percentage, pass/fail badge, awarded points, and question explanations.",
  },
  {
    intent: "ai_resume_interview",
    category: "AI Resume",
    keywords: [
      "ai resume",
      "resume interview",
      "upload resume",
      "skill evaluation",
      "adaptive test",
      "pdf resume",
      "txt resume",
      "resume assessment",
      "how does the ai resume interview work",
    ],
    suggestedQuestion: "How does the AI Resume Interview work?",
    response:
      "Navigate to 'AI Resume Interview' ('/resume') and upload a PDF or TXT resume. The platform parses technical skills (such as Next.js, FastAPI, Python, SQL, Docker) and launches an adaptive interview session. An AI evaluator asks targeted skill questions and evaluates response confidence.",
  },
  {
    intent: "adaptive_confidence_branching",
    category: "AI Resume",
    keywords: [
      "confidence score",
      "clarification",
      "adaptive branching",
      "confident",
      "needs clarification",
      "how does ai adaptive confidence branching work",
    ],
    suggestedQuestion: "How does AI adaptive confidence branching work?",
    response:
      "During the AI Resume Interview, the engine evaluates each answer on a confidence scale (0.0 to 1.0). If your score is ≥ 0.70 ('CONFIDENT'), it advances to the next resume skill. If < 0.70 ('NEEDS_CLARIFICATION'), it dynamically asks a targeted clarification question on the same topic.",
  },
  {
    intent: "admin_control_center",
    category: "Admin",
    keywords: [
      "admin portal",
      "admin center",
      "admin control center",
      "administrator",
      "category management",
      "leaderboard",
      "system metrics",
      "what can i do in the admin control center",
      "what can i do in admin",
      "admin control",
    ],
    suggestedQuestion: "What can I do in the Admin Control Center?",
    response:
      "In the Admin Control Center ('/admin'), platform administrators can: 1) Create domain categories, 2) Author assessments and question banks, 3) Track platform analytics (total candidates, attempts, aggregate pass rates), and 4) Inspect candidate attempt histories and leaderboards.",
  },
  {
    intent: "leaderboard_analytics",
    category: "Results",
    keywords: [
      "leaderboard",
      "top candidates",
      "rankings",
      "highest score",
      "analytics",
      "how are test leaderboards generated",
    ],
    suggestedQuestion: "How are test leaderboards generated?",
    response:
      "Leaderboards rank candidate attempts for each assessment based on highest score percentage and fastest completion time. Administrators can inspect leaderboards directly from the Admin Control Center.",
  },
  {
    intent: "time_limits_auto_submit",
    category: "Assessments",
    keywords: [
      "time limit",
      "timer",
      "clock",
      "runs out",
      "auto submit",
      "expiration",
      "what happens when the test timer expires",
    ],
    suggestedQuestion: "What happens when the test timer expires?",
    response:
      "Each assessment has a configured duration limit in minutes. A real-time timer counts down during the exam. When the timer reaches zero, the platform automatically submits your answered questions so no progress is lost.",
  },
  {
    intent: "account_profile_settings",
    category: "Account",
    keywords: [
      "profile",
      "account",
      "settings",
      "user role",
      "sign out",
      "logout",
      "where are my settings",
      "update profile",
      "where are my profile and account details",
    ],
    suggestedQuestion: "Where are my profile and account details?",
    response:
      "Your signed-in account profile details (Full Name and Role badge: 'ADMIN' or 'CANDIDATE') are displayed in the top navigation bar. Click the Logout icon next to your name to end your active session.",
  },
  {
    intent: "demo_login",
    category: "Account",
    keywords: [
      "demo login",
      "how to sign in",
      "try admin",
      "try candidate",
      "credentials",
      "student@meti.org",
      "admin@meti.org",
      "how do i sign in using demo accounts",
    ],
    suggestedQuestion: "How do I sign in using Demo accounts?",
    response:
      "On the home page ('/'), use the 1-Click Demo Login Shortcuts! Click 'Demo Candidate' (student@meti.org / student123) to browse tests as a candidate, or 'Demo Admin' (admin@meti.org / admin123) to open the Admin Control Center.",
  },
];
