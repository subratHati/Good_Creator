const mongoose = require('mongoose');

const assistantMessageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssistantConversation', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, default: '' },
    // usage tracking so we can see real cost later
    model: String,
    inputTokens: Number,
    outputTokens: Number,
    // structured result cards (e.g. creator suggestions), built by the server from real database rows
    cards: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // true for messages the AI started itself (daily check-ins)
    proactive: { type: Boolean, default: false },
    checkinTopic: { type: String, default: '' },
}, { timestamps: true });

assistantMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('AssistantMessage', assistantMessageSchema);