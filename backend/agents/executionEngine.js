const Task = require('../models/Task');
const Agent = require('../models/Agent');
const { executeAgent } = require('./agentFactory');

/**
 * Execution Engine — Routes tasks to the correct agent via the AgentFactory.
 * Each agent runs in isolation with its own system prompt + RAG context.
 */
async function executeTask(taskId) {
    try {
        const task = await Task.findById(taskId);
        if (!task) return;

        console.log(`[ExecutionEngine] Starting task: ${task.title} (${task.department})`);

        // Update status to IN_PROGRESS
        task.status = 'IN_PROGRESS';
        await task.save();

        // Determine which agent should handle this task
        let agentRole = '';

        // If task has an assigned agent ID, look it up
        if (task.assignedAgent) {
            const agent = await Agent.findById(task.assignedAgent);
            if (agent) {
                agentRole = agent.role || agent.name;
            }
        }

        // If no agent assigned yet, map by department/intent
        if (!agentRole) {
            agentRole = mapDepartmentToAgent(task.department, task.title);
        }

        // Execute via AgentFactory (isolated brain per agent)
        let output = '';
        if (agentRole) {
            output = await executeAgent(agentRole, task.title, task.description);
        } else {
            output = 'No suitable agent found for this task. Please assign manually.';
        }

        // Save Output
        if (output) {
            const separator = '\n\n--- 🤖 AGENT OUTPUT ---\n';
            task.description = (task.description || '') + separator + output;
        }

        // Approval logic
        if (task.requiresApproval) {
            task.status = 'REVIEW';
        } else {
            task.status = 'COMPLETED';
        }

        await task.save();
        console.log(`[ExecutionEngine] Task ${taskId} handled by [${agentRole}] → ${task.status}`);

    } catch (error) {
        console.error(`[ExecutionEngine] Failed to execute task ${taskId}:`, error);
        await Task.findByIdAndUpdate(taskId, { status: 'FAILED' });
    }
}

/**
 * Maps department/title keywords to the correct agent role.
 */
function mapDepartmentToAgent(department, title) {
    const t = (title || '').toLowerCase();

    // Explicit department mappings
    const deptMap = {
        'Engineering': 'Software Developer',
        'QA': 'QA/Test Engineer',
        'DevOps': 'DevOps Engineer',
        'Data': 'Data Scientist',
        'Design': 'UI/UX Designer',
        'Management': 'Project Manager',
        'Product': 'Product Manager',
        'Executive': 'COO',
        'HR': 'HR Manager',
        'Finance': 'Finance Manager',
        'Marketing': 'Content Creator',
        'Sales': 'Sales Agent',
        'Operations': 'COO',
        'Ops': 'COO',
        'Technology': 'Software Developer',
    };

    if (department && deptMap[department]) {
        // Refine based on title keywords
        if (department === 'Marketing') {
            if (t.includes('lead') || t.includes('seo') || t.includes('campaign') || t.includes('ad')) {
                return 'Digital Marketer';
            }
            return 'Content Creator';
        }
        if (department === 'Executive') {
            if (t.includes('technical') || t.includes('architecture') || t.includes('stack') || t.includes('security')) {
                return 'CTO / IT Head';
            }
            return 'COO';
        }
        if (department === 'Management') {
            if (t.includes('team') || t.includes('review') || t.includes('mentor')) {
                return 'Team Lead';
            }
            if (t.includes('product') || t.includes('feature') || t.includes('roadmap')) {
                return 'Product Manager';
            }
            return 'Project Manager';
        }
        return deptMap[department];
    }

    // Keyword fallbacks
    if (t.includes('code') || t.includes('develop') || t.includes('implement') || t.includes('bug') || t.includes('feature')) return 'Software Developer';
    if (t.includes('test') || t.includes('qa') || t.includes('quality')) return 'QA/Test Engineer';
    if (t.includes('deploy') || t.includes('ci/cd') || t.includes('pipeline') || t.includes('docker')) return 'DevOps Engineer';
    if (t.includes('data') || t.includes('analytics') || t.includes('ml') || t.includes('insight')) return 'Data Scientist';
    if (t.includes('design') || t.includes('wireframe') || t.includes('ux') || t.includes('ui')) return 'UI/UX Designer';
    if (t.includes('hire') || t.includes('onboard') || t.includes('employee') || t.includes('policy')) return 'HR Manager';
    if (t.includes('budget') || t.includes('invoice') || t.includes('financial') || t.includes('cost')) return 'Finance Manager';
    if (t.includes('content') || t.includes('post') || t.includes('blog') || t.includes('write')) return 'Content Creator';
    if (t.includes('lead') || t.includes('seo') || t.includes('campaign')) return 'Digital Marketer';
    if (t.includes('sale') || t.includes('prospect') || t.includes('deal') || t.includes('client')) return 'Sales Agent';
    if (t.includes('sprint') || t.includes('timeline') || t.includes('plan')) return 'Project Manager';
    if (t.includes('product') || t.includes('roadmap') || t.includes('feature')) return 'Product Manager';

    // Default
    return 'COO';
}

module.exports = { executeTask };
