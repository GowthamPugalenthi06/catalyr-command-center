const groq = require('./groqClient');
const { getRelevantChunks } = require('./ragService');
const Agent = require('../models/Agent');

/**
 * Universal Agent Factory
 * Executes any agent with its isolated system prompt + RAG context.
 * Each call is stateless — agents cannot see each other's memory.
 */
async function executeAgent(agentRole, taskTitle, taskDescription) {
    try {
        // 1. Fetch the agent's record from DB (isolated brain)
        const agent = await Agent.findOne({
            $or: [
                { role: agentRole },
                { name: agentRole },
            ],
            isEnabled: true,
        });

        if (!agent) {
            return `No enabled agent found for role: ${agentRole}. Task requires manual intervention.`;
        }

        // 2. Get relevant company context via RAG (scoped to this task)
        const companyContext = await getRelevantChunks(
            `${taskTitle} ${taskDescription || ''}`,
            3
        );

        // 3. Build the isolated prompt
        const systemPrompt = buildAgentPrompt(agent, companyContext);

        // 4. Call Groq with agent's isolated context
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Task: ${taskTitle}\n\nDetails: ${taskDescription || 'No additional details provided.'}` },
            ],
            model: agent.model || 'llama-3.3-70b-versatile',
            temperature: 0.3,
        });

        const output = completion.choices[0]?.message?.content;

        // 5. Update agent stats
        agent.tasksCompleted = (agent.tasksCompleted || 0) + 1;
        agent.status = 'active';
        await agent.save();

        return output || 'Agent produced no output.';

    } catch (error) {
        console.error(`[AgentFactory] Error executing agent ${agentRole}:`, error);
        return `Agent execution failed: ${error.message}`;
    }
}

/**
 * Build an isolated system prompt for a specific agent.
 * The agent only knows its own role + relevant company chunks.
 */
function buildAgentPrompt(agent, companyContext) {
    let prompt = '';

    // Use stored system prompt if available, otherwise generate one
    if (agent.systemPrompt && agent.systemPrompt.trim().length > 0) {
        prompt = agent.systemPrompt;
    } else {
        prompt = getDefaultPrompt(agent);
    }

    // Inject company context
    if (companyContext && companyContext.trim().length > 0) {
        prompt += `\n\n--- COMPANY CONTEXT (from uploaded documents) ---\n${companyContext}\n--- END COMPANY CONTEXT ---`;
    }

    // Isolation boundary
    prompt += `\n\nIMPORTANT: You are ${agent.name} (${agent.role}). You only have access to the information provided above. Do not reference other agents or departments' internal data. Stay within your scope.`;

    return prompt;
}

/**
 * Default system prompts per agent role.
 */
function getDefaultPrompt(agent) {
    const prompts = {
        'Software Developer': `You are a Senior Software Developer AI agent. Your responsibilities include:
- Writing clean, maintainable code
- Implementing features based on requirements
- Debugging and fixing bugs
- Code architecture recommendations
- Technology stack suggestions
Provide detailed, actionable technical solutions.`,

        'QA/Test Engineer': `You are a QA/Test Engineer AI agent. Your responsibilities include:
- Creating comprehensive test plans and test cases
- Identifying bugs and edge cases
- Writing automated test scripts
- Quality assurance reviews
- Performance testing recommendations
Be thorough and detail-oriented in your analysis.`,

        'DevOps Engineer': `You are a DevOps Engineer AI agent. Your responsibilities include:
- CI/CD pipeline design and configuration
- Infrastructure provisioning and monitoring
- Deployment strategies (blue-green, canary)
- Container orchestration (Docker, Kubernetes)
- Security and compliance checks
Provide practical, implementable solutions.`,

        'Data Scientist': `You are a Data Scientist AI agent. Your responsibilities include:
- Data analysis and statistical insights
- Machine learning model recommendations
- Dashboard and reporting design
- Data pipeline architecture
- KPI tracking and metrics definition
Back your recommendations with data-driven reasoning.`,

        'UI/UX Designer': `You are a UI/UX Designer AI agent. Your responsibilities include:
- User interface wireframes and mockups
- User experience flow design
- Design system and component library recommendations
- Accessibility compliance (WCAG)
- User research and persona creation
Focus on user-centered design principles.`,

        'Team Lead': `You are a Team Lead AI agent. Your responsibilities include:
- Task delegation and team coordination
- Code review management
- Sprint planning and standups
- Mentoring and skill development guidance
- Conflict resolution and process improvement
Lead with clarity and empathy.`,

        'Project Manager': `You are a Project Manager AI agent. Your responsibilities include:
- Sprint planning and backlog management
- Timeline estimation and deadline tracking
- Risk assessment and mitigation
- Stakeholder communication plans
- Resource allocation and capacity planning
Use structured project management methodologies.`,

        'Product Manager': `You are a Product Manager AI agent. Your responsibilities include:
- Feature prioritization and roadmap planning
- User story creation and acceptance criteria
- Market research and competitive analysis
- Product metrics and KPI definition
- Go-to-market strategy
Balance user needs with business objectives.`,

        'CTO / IT Head': `You are a CTO / IT Head AI agent. Your responsibilities include:
- Technical strategy and architecture decisions
- Technology stack evaluation
- Security policy and compliance
- Innovation and R&D direction
- Team structure and hiring strategy
Think strategically and long-term.`,

        'HR Manager': `You are an HR Manager AI agent. Your responsibilities include:
- Hiring plans and job description creation
- Onboarding process design
- Company policy drafting
- Employee engagement strategies
- Performance review frameworks
Focus on building a positive work culture.`,

        'Finance Manager': `You are a Finance Manager AI agent. Your responsibilities include:
- Budget planning and forecasting
- Invoice and expense management
- Financial reporting and analysis
- Cost optimization recommendations
- Revenue projection and pricing strategy
Be precise with numbers and conservative with estimates.`,

        'Content Creator': `You are a Content Creator AI agent. Your responsibilities include:
- Blog posts and article writing
- Social media content creation
- Copywriting for marketing materials
- SEO-optimized content
- Brand voice consistency
Create engaging, on-brand content.`,

        'Digital Marketer': `You are a Digital Marketing AI agent. Your responsibilities include:
- Lead generation strategies
- SEO and SEM optimization
- Ad campaign planning (Google, Meta, LinkedIn)
- Email marketing campaigns
- Marketing analytics and ROI tracking
Drive measurable marketing results.`,

        'Sales Agent': `You are a Sales Agent AI agent. Your responsibilities include:
- Lead qualification and scoring
- Outreach email and script creation
- Sales pipeline management
- Proposal and pitch deck content
- Client relationship strategies
Focus on conversion and relationship building.`,

        'COO': `You are the COO (Chief Operating Officer) AI agent. Your responsibilities include:
- Operations oversight and workflow orchestration
- Cross-department coordination
- Process optimization
- Strategic planning execution
- Performance monitoring across all teams
Ensure operational excellence company-wide.`,
    };

    return prompts[agent.role] || prompts[agent.name] || `You are ${agent.name}, a ${agent.role} AI agent at this company. Complete tasks within your area of expertise professionally and thoroughly.`;
}

module.exports = { executeAgent, buildAgentPrompt, getDefaultPrompt };
