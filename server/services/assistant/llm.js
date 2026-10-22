const AnthropicModule = require('@anthropic-ai/sdk');
const Anthropic = AnthropicModule.default || AnthropicModule;

const MODEL = process.env.ASSISTANT_MODEL || 'claude-haiku-5-5';
const MAX_OUTPUT_TOKENS = Number(process.env.ASSISTANT_MAX_OUTPUT_TOKENS) || 600;

let client = null;
const getClient = () => {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30000, maxRetries: 1 });
  }
  return client;
};

// kill switch: set ASSISTANT_ENABLED=false (or remove the key) to turn the AI off instantly
const isEnabled = () => process.env.ASSISTANT_ENABLED === 'true' && !!process.env.ANTHROPIC_API_KEY;

const generateReply = async ({ system, messages, tools }) => {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system,
    messages,
    ...(tools && tools.length ? { tools } : {}),
  });
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return {
    text,
    content: response.content,
    stopReason: response.stop_reason,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
    model: MODEL,
  };
};

module.exports = { isEnabled, generateReply, MODEL };