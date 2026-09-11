import { chatbotKnowledge, KnowledgeItem } from "./chatbotKnowledge";

export interface ChatContext {
  page?: string;
  role?: string;
}

/**
 * Asynchronous response handler with multi-layer intent matching algorithm:
 * 1. Direct suggested question match (100% precision for chips)
 * 2. Phrase substring matching
 * 3. Tokenized word overlap scoring
 */
export async function getChatbotResponse(
  message: string,
  context?: ChatContext
): Promise<{ text: string; intent?: string }> {
  const query = message.toLowerCase().trim();

  if (!query) {
    return {
      text: "How can I assist you with METI Assessment Platform today?",
    };
  }

  // Clean query punctuation for matching
  const cleanQuery = query.replace(/[^\w\s]/g, "").trim();

  // 1. Greeting checks
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(query)) {
    return {
      text: "Hi there! 👋 I'm EVE, your METI Assessment Platform assistant. You can ask me how to take exams, upload your resume for AI evaluation, view test score reports, or use the Admin Portal!",
    };
  }

  // 2. Help / info checks
  if (/^(help|who are you|what can you do)/i.test(query)) {
    return {
      text: "I am your interactive application assistant! I know all about METI Assessment Platform. Feel free to click any of the suggested topics below or ask a question.",
    };
  }

  // 3. Multi-Layer Knowledge Matching Engine
  let bestMatch: KnowledgeItem | null = null;
  let maxScore = 0;

  for (const item of chatbotKnowledge) {
    let score = 0;
    const cleanSuggested = item.suggestedQuestion.toLowerCase().replace(/[^\w\s]/g, "").trim();

    // A. Direct suggested question match (Exact or containment)
    if (
      cleanQuery === cleanSuggested ||
      cleanQuery.includes(cleanSuggested) ||
      cleanSuggested.includes(cleanQuery)
    ) {
      return {
        text: item.response,
        intent: item.intent,
      };
    }

    // B. Keyword phrase matching
    for (const kw of item.keywords) {
      const cleanKw = kw.toLowerCase().replace(/[^\w\s]/g, "").trim();
      if (cleanQuery.includes(cleanKw)) {
        score += cleanKw.length * 4;
      }
    }

    // C. Tokenized word overlap scoring
    const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2);
    for (const token of queryTokens) {
      for (const kw of item.keywords) {
        if (kw.toLowerCase().includes(token)) {
          score += token.length;
        }
      }
      if (cleanSuggested.includes(token)) {
        score += token.length * 2;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && maxScore >= 5) {
    return {
      text: bestMatch.response,
      intent: bestMatch.intent,
    };
  }

  // Contextual fallback response
  return {
    text: "I'm not sure about that yet. I can help with questions about this application's features, navigation, assessments, results, and account settings.",
  };
}

/**
 * Provides contextual quick-question chips based on the user's current route and role.
 */
export function getSuggestedQuestionsForRoute(
  pathname: string,
  role?: string
): string[] {
  if (pathname.startsWith("/admin") || role === "ADMIN") {
    return [
      "How do I create a new assessment?",
      "What can I do in the Admin Control Center?",
      "How are test leaderboards generated?",
      "What is the METI Assessment Platform?",
    ];
  }

  if (pathname.startsWith("/resume")) {
    return [
      "How does the AI Resume Interview work?",
      "How does AI adaptive confidence branching work?",
      "How do I start an assessment?",
      "Where can I view my assessment results?",
    ];
  }

  if (pathname.startsWith("/assessment")) {
    return [
      "What happens when the test timer expires?",
      "How does the exam room navigation matrix work?",
      "Where can I view my assessment results?",
      "What is the METI Assessment Platform?",
    ];
  }

  // Default candidate/dashboard suggestions
  return [
    "What is the METI Assessment Platform?",
    "How do I start an assessment?",
    "How does the AI Resume Interview work?",
    "Where can I view my assessment results?",
    "How do I sign in using Demo accounts?",
  ];
}
