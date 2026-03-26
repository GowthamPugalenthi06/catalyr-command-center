const CompanyProfile = require('../models/CompanyProfile');

/**
 * Split text into ~500-character chunks with overlap.
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunkStr = text.slice(start, end);
        // Extract simple keywords (words > 4 chars, unique)
        const keywords = [...new Set(
            chunkStr
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 4)
        )];
        chunks.push({
            text: chunkStr,
            keywords,
            chunkIndex: chunks.length,
        });
        start = end - overlap;
        if (start >= text.length) break;
    }
    return chunks;
}

/**
 * Simple keyword-overlap scoring for RAG retrieval.
 * No external vector DB needed — pure MongoDB + JS.
 */
function scoreChunk(chunk, queryKeywords) {
    let score = 0;
    const chunkLower = chunk.text.toLowerCase();
    for (const kw of queryKeywords) {
        if (chunkLower.includes(kw)) {
            score += 1;
        }
    }
    // Bonus for keyword array matches
    for (const kw of queryKeywords) {
        if (chunk.keywords && chunk.keywords.includes(kw)) {
            score += 0.5;
        }
    }
    return score;
}

/**
 * Retrieve the top N most relevant chunks from the company profile.
 * @param {string} query - The search query (task title, description, etc.)
 * @param {number} limit - Max chunks to return
 * @returns {string} - Concatenated context string
 */
async function getRelevantChunks(query, limit = 3) {
    try {
        const profile = await CompanyProfile.findOne().sort({ createdAt: -1 });
        if (!profile || !profile.chunks || profile.chunks.length === 0) {
            return '';
        }

        const queryKeywords = query
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3);

        if (queryKeywords.length === 0) {
            // No meaningful keywords — return first N chunks as general context
            return profile.chunks.slice(0, limit).map(c => c.text).join('\n\n');
        }

        // Score each chunk
        const scored = profile.chunks.map(chunk => ({
            text: chunk.text,
            score: scoreChunk(chunk, queryKeywords),
        }));

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Return top N
        const topChunks = scored.slice(0, limit).filter(c => c.score > 0);

        if (topChunks.length === 0) {
            // Fallback: return first N chunks
            return profile.chunks.slice(0, limit).map(c => c.text).join('\n\n');
        }

        return topChunks.map(c => c.text).join('\n\n');
    } catch (error) {
        console.error('[RAG] Error retrieving chunks:', error);
        return '';
    }
}

/**
 * Get a brief company overview (first 2 chunks) for the router agent.
 */
async function getCompanyOverview() {
    try {
        const profile = await CompanyProfile.findOne().sort({ createdAt: -1 });
        if (!profile || !profile.chunks || profile.chunks.length === 0) {
            return '';
        }
        return profile.chunks.slice(0, 2).map(c => c.text).join('\n\n');
    } catch (error) {
        console.error('[RAG] Error getting overview:', error);
        return '';
    }
}

module.exports = { chunkText, getRelevantChunks, getCompanyOverview };
