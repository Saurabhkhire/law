/**
 * pending_applications may be a JSON string (from DB) or already parsed (from routes).
 */
function parsePendingApplications(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Parse JSON from OpenAI chat completion; avoids empty-string JSON.parse crashes.
 */
function parseOpenAIMessageJson(completion) {
  const raw = completion?.choices?.[0]?.message?.content;
  if (raw == null) {
    throw new Error('Model returned no message content');
  }
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (!s) {
    throw new Error('Model returned empty message content');
  }
  try {
    return JSON.parse(s);
  } catch (e) {
    throw new Error(`Model response was not valid JSON: ${e.message}`);
  }
}

module.exports = { parsePendingApplications, parseOpenAIMessageJson };
