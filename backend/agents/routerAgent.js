const groq = require('./groqClient');
const { getCompanyOverview } = require('./ragService');
const Agent = require('../models/Agent');

async function routeMessage(messageContent) {
    try {
        // Get company context from RAG
        const companyContext = await getCompanyOverview();

        // Get list of enabled agents  
        const enabledAgents = await Agent.find({ isEnabled: true }).select('name role department rank');
        const agentList = enabledAgents.map(a => `${a.name} (${a.department}, ${a.rank})`).join(', ');

        const SYSTEM_PROMPT = `
Purpose: Understand intent, not solve it.
You are the Router Agent.
${companyContext ? `\nCompany Context:\n${companyContext}\n` : ''}

Available Agents: ${agentList || 'No agents configured yet.'}

Rules:
- You NEVER generate content.
- You NEVER contact users.
- You ONLY classify intent and split work.
Process:
1. Read the incoming chat message.
2. Identify one or more intents.
3. Convert each intent into a structured task request.
4. IMPORTANT: Only assign tasks to agents from the "Available Agents" list. 
5. If a task requires a specialist NOT in the list (e.g., "Content Creator" is missing), assign that task to the **COO** instead.
6. Explain any fallback assignments in the "chatResponse" (e.g., "I'll handle this LinkedIn post myself since we haven't hired a Content Creator yet.").
7. Send output ONLY as JSON.

Allowed intents:
- CONTENT_CREATE → Content Creator
- LEAD_GENERATE → Digital Marketer / Sales Agent
- CODE_DEVELOP → Software Developer
- CODE_TEST → QA/Test Engineer
- DEPLOY → DevOps Engineer
- DATA_ANALYZE → Data Scientist
- DESIGN → UI/UX Designer
- TEAM_MANAGE → Team Lead
- PROJECT_MANAGE → Project Manager
- PRODUCT_PLAN → Product Manager
- STRATEGY → CTO / IT Head
- HR_TASK → HR Manager
- FINANCE_TASK → Finance Manager
- OPERATIONS → COO
- SCHEDULE → Project Manager
- CHAT → (direct reply, no task)

If the user asks an "Analysis" or "Why" question (e.g., "Why are leads not converting?"), use the RAG Company Context to provide a direct, insightful response in "chatResponse".
If a command requires professional specialist work (e.g., "Analyze the churn data"), create a DATA_ANALYZE task for the Data Scientist in the "tasks" array AND summarize your intent in "chatResponse".

Output ONLY as a JSON object:
{
  "tasks": [
    {
      "taskTitle": "",
      "intent": "", // One of the allowed intents
      "department": "",
      "agentRole": "",
      "priority": 1-5
    }
  ],
  "chatResponse": "A thoughtful, concise answer OR a summary of what you've assigned to the team."
}
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: messageContent },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No response from Groq");

        let parsed = JSON.parse(content);

        // Standardize output to always have tasks and chatResponse
        const result = {
            tasks: parsed.tasks || [],
            chatResponse: parsed.chatResponse || ""
        };

        // Fallback: If AI returned an array at root despite instructions
        if (Array.isArray(parsed)) {
            result.tasks = parsed;
        }

        return result;
    } catch (error) {
        console.error("Router Agent Error:", error);
        return [];
    }
}

module.exports = { routeMessage };
