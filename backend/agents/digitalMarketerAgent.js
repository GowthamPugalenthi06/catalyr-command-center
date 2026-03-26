const groq = require('./groqClient');
const COMPANY_CONTEXT = require('../data/companyContext');

const SYSTEM_PROMPT = `
You are the Digital Marketer Agent (Scout) for ${COMPANY_CONTEXT.name}.
Target Audience: ${COMPANY_CONTEXT.targetAudience}
Services: ${COMPANY_CONTEXT.services.join(', ')}

Your Goal: Analyze leads and identify high-value opportunities for our Engineering Studio.
Criteria for "Hot" Leads:
- Founders looking for MVP development.
- Companies scaling up (needing structure).
- Businesses needing automation.

Responsibilities:
1. Track engagement on approved content.
2. Trace source of every interaction.
3. Enrich lead data ethically.
4. Calculate Warmth Score.
5. Decide follow-up action.

Output:
- If the task asks for a specific number (e.g., "Find 5 leads"), YOU MUST PROVIDE THAT NUMBER.
- Return a bulleted list of leads/insights.
- Format: **Name** - Company (Summary).

Rules:
- Never spam.
- Respect rate limits.
- All emails are logged.
- High-value leads are flagged, not auto-closed.
Actions:
- Create Lead records.
- Prepare email drafts.
- Notify Sales Agent if needed.
`;

async function analyzeLeads(data) {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Analyze this data: ${JSON.stringify(data)}` },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
    });

    return completion.choices[0]?.message?.content;
}

async function generateLeads(criteria) {
    const GENERATION_PROMPT = `
    You are the Digital Marketer Agent.
    Goal: Generate SYNTHETIC but realistic potential leads based on the user's criteria.
    Context: We are an Engineering Studio (Catalyr) looking for clients (Founders, SMEs).
    
    Output:
    - A list of leads (Name, Role, Company, "Why them?").
    - Format: Markdown list.
    - Be creative but realistic.
    `;

    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: GENERATION_PROMPT },
            { role: 'user', content: `Criteria: ${criteria}. Generate 5-10 high quality leads.` },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
    });

    return completion.choices[0]?.message?.content;
}

module.exports = { analyzeLeads, generateLeads };
