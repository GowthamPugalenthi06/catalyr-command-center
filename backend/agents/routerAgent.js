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
4. Assign the correct agent from the Available Agents list.
5. Send output ONLY as JSON.

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

If the user just wants to talk or asks a general question, use intent "CHAT".
For "CHAT", return { "intent": "CHAT", "reply": "Your concise response here" }.
Reject vague commands. Do not assume. Do not hallucinate.

Output format:
[
  {
    "taskTitle": "",
    "intent": "",
    "department": "",
    "agentRole": "",
    "priority": 1-5
  }
]
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

        // Handle wrapper objects
        if (!Array.isArray(parsed) && typeof parsed === 'object') {
            const values = Object.values(parsed);
            const arrayValue = values.find(v => Array.isArray(v));
            if (arrayValue) {
                parsed = arrayValue;
            } else if (parsed.intent || parsed.taskTitle) {
                parsed = [parsed];
            }
        }

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Router Agent Error:", error);
        return [];
    }
}

module.exports = { routeMessage };
