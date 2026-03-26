const groq = require('./groqClient');
const Task = require('../models/Task');
const Agent = require('../models/Agent');
const { executeTask } = require('./executionEngine');
const { getCompanyOverview, getRelevantChunks } = require('./ragService');

/**
 * COO Agent — now uses RAG context from uploaded company docs
 * instead of hardcoded COMPANY_CONTEXT.
 */
async function processTaskRequest(routerOutput, originalChatId) {
    console.log("COO Input (Router Output):", JSON.stringify(routerOutput, null, 2));

    // Get company context from RAG
    const companyContext = await getCompanyOverview();

    const SYSTEM_PROMPT = `
Purpose: Turn tasks into company work.
You are the COO Agent.
${companyContext ? `\nCompany Context:\n${companyContext}\n` : ''}
Authority:
- You manage tasks, schedules, and workload.
- You do NOT generate content or leads.
Responsibilities:
1. Validate tasks from Router.
2. Assign execution agents based on rank and department.
3. Set deadlines.
4. Enforce quality and priority.
Rules:
- High-priority tasks get same-day deadlines.
- Low-impact tasks are delayed or killed.
Output:
- JSON Object with: { "title", "description", "department", "priority", "deadline", "agentRole" }
- agentRole MUST be one of the provided "Available Agents" names.
- If no specialist matches the task (e.g., "Content Creator" is not listed), use Orion (COO) as the agentRole.
`;

    try {
        // Get list of available agents for assignment
        const enabledAgents = await Agent.find({ isEnabled: true }).select('name role department rank');
        const agentList = enabledAgents.map(a => `${a.name} (${a.department}, ${a.rank})`).join(', ');

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + `\nAvailable Agents: ${agentList}` },
                { role: 'user', content: `Refine this task request: ${JSON.stringify(routerOutput)}` },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });

        const refinedTaskData = JSON.parse(completion.choices[0].message.content);
        console.log("COO Refined Output:", JSON.stringify(refinedTaskData, null, 2));

        // Safe Date Parsing
        let cleanDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (refinedTaskData.deadline) {
            const parsed = new Date(refinedTaskData.deadline);
            if (!isNaN(parsed.getTime())) {
                cleanDeadline = parsed;
            } else if (JSON.stringify(refinedTaskData.deadline).toLowerCase().includes('today')) {
                const d = new Date();
                d.setHours(18, 0, 0, 0);
                cleanDeadline = d;
            }
        }

        // Find the assigned agent by role name
        let assignedAgentId = null;
        if (refinedTaskData.agentRole) {
            const agent = await Agent.findOne({
                $or: [
                    { role: refinedTaskData.agentRole },
                    { name: refinedTaskData.agentRole },
                ],
                isEnabled: true,
            });
            if (agent) assignedAgentId = agent._id;
        }

        // 🛡️ FALLBACK: If no agent found (or hallucinated), assign to COO
        if (!assignedAgentId) {
            const coo = await Agent.findOne({ 
                $or: [{ role: 'COO' }, { name: 'COO' }], 
                isEnabled: true 
            });
            if (coo) assignedAgentId = coo._id;
        }

        // Create Task in DB
        const newTask = await Task.create({
            title: refinedTaskData.title || routerOutput.taskTitle,
            description: refinedTaskData.description || "Auto-generated task",
            department: refinedTaskData.department || routerOutput.department,
            priority: refinedTaskData.priority || routerOutput.priority,
            status: 'PENDING',
            requiresApproval: true,
            assignedAgent: assignedAgentId,
            inputRefs: {
                chatId: originalChatId,
            },
            deadline: cleanDeadline,
        });

        // Trigger Execution Asynchronously
        executeTask(newTask._id);

        return newTask;

    } catch (error) {
        console.error("[COO Agent] Error:", error);
        // Fallback: create task with basic info
        let fallbackAgentId = null;
        const coo = await Agent.findOne({ $or: [{ role: 'COO' }, { name: 'COO' }], isEnabled: true });
        if (coo) fallbackAgentId = coo._id;

        const newTask = await Task.create({
            title: routerOutput.taskTitle,
            description: routerOutput.description || "Auto-generated task",
            department: routerOutput.department,
            priority: routerOutput.priority || 3,
            status: 'PENDING',
            requiresApproval: true,
            assignedAgent: fallbackAgentId,
            inputRefs: { chatId: originalChatId },
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        executeTask(newTask._id);
        return newTask;
    }
}

// Autonomous Daily Planning — uses RAG context
async function planDailyWork() {
    const dateStr = new Date().toLocaleDateString();
    console.log(`[COO Agent] Planning work for ${dateStr}...`);

    const companyContext = await getCompanyOverview();
    const enabledAgents = await Agent.find({ isEnabled: true }).select('name role department');
    const agentList = enabledAgents.map(a => `${a.name} (${a.department})`).join(', ');

    const SYSTEM_PROMPT_PLANNING = `
You are Orion, the COO AI agent.
Today is ${dateStr}.
Your goal is to proactively assign work to your team.

${companyContext ? `Company Context:\n${companyContext}\n` : ''}

Available Agents: ${agentList || 'None configured yet.'}

Instructions:
1. Generate 2-3 high-impact tasks for today.
2. Focus on business growth: clients, shipping code, operations.
3. Do NOT repeat the same tasks. Vary the focus.
4. Assign each task to a specific agent from the Available Agents list.

Output Format:
Return a JSON object with key "tasks" containing an array.
Each task: { "title": "...", "description": "...", "department": "...", "priority": 1-3, "agentRole": "..." }
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT_PLANNING },
                { role: 'user', content: "Generate today's work plan." },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            response_format: { type: 'json_object' },
        });

        const plan = JSON.parse(completion.choices[0].message.content);
        console.log(`[COO Agent] Generated ${plan.tasks?.length} tasks.`);
        return plan.tasks || [];

    } catch (error) {
        console.error("[COO Agent] Planning failed:", error);
        return [];
    }
}

module.exports = { processTaskRequest, planDailyWork };
