require('dotenv').config();
const { isEnabled, generateReply } = require('../services/assistant/llm');
const { buildSystemPrompt } = require('../services/assistant/prompt');

(async () => {
  if (!isEnabled()) {
    console.log('Set ASSISTANT_ENABLED=true and ANTHROPIC_API_KEY in .env first');
    process.exit(1);
  }
  const r = await generateReply({
    system: buildSystemPrompt('creator'),
    messages: [{ role: 'user', content: 'Hi, how do I get paid on GoodCreator?' }],
  });
  console.log(r);
})().catch((e) => {
  console.error('Failed:', e.status, e.message);
  process.exit(1);
});