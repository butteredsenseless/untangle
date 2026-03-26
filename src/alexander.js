export async function askAlexander(input, areas, context = {}, learned = {}) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const bucketList = areas.map(a => `${a.id}: ${a.label} (${a.emoji})`).join('\n');

  const prompt = `You are Alexander, an AI assistant for Untangle — an ADHD life management app.

The user has typed: "${input}"

Available buckets:
${bucketList}
${Object.keys(learned).length > 0 ? `\nLearned corrections:\n${Object.entries(learned).map(([k,v])=>`- "${k}" goes in ${v.to} (corrected ${v.count} time${v.count>1?'s':''})`).join('\n')}` : ''}

Analyse the input and respond with ONLY a JSON object, no markdown:
{
  "title": "keep the user's original wording, only fix typos or remove hashtags — never rewrite or interpret",
  "area": "bucket id from the list above",
  "type": "task|recurring|deadline|goal|project",
  "recur": "none|daily|weekday|weekly|monthly",
  "dailyTarget": 1,
  "deadline": "natural language deadline or empty string",
  "horizon": "today|week|month|project",
  "confidence": "high|medium|low",
  "nudge": "optional short message if this looks like a project or goal, otherwise empty string"
}

Rules:
- NEVER rewrite the task title. Keep the user's own words.
- If the task mentions a frequency like "twice a day" or "3 times daily", set dailyTarget to that number and recur to "daily" — do NOT create multiple tasks.
- If the input sounds like a goal (e.g. "lose weight", "be happier"), set nudge to a gentle message.
- If the input sounds like a project (multiple steps implied), set nudge to a gentle message.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content?.map(c => c.text || "").join("") || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
