const OpenAI = require('openai');

class ConversationalGPTHandler {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async handleConversation(userMessage, conversationHistory, context = {}) {
    try {
      const { isNewConversation, userName, guildName } = context;

      const systemPrompt = this.buildSystemPrompt(userName, guildName, isNewConversation);
      const messages = this.buildMessageHistory(conversationHistory, systemPrompt);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.4,
        max_tokens: 800,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('GPT API Error:', error);
      return this.getErrorResponse(error);
    }
  }

  buildSystemPrompt(userName, guildName, isNewConversation) {
    return `You are the Lucid City RP Community Assistant, a knowledgeable AI helper for the Lucid City roleplay server community. You're currently having a conversation with ${userName} in ${guildName}.

PERSONALITY & TONE:
- Be professional, direct, and factual
- Avoid emotional or overly polite phrasing
- Do not use emojis
- Maintain a firm but respectful tone
- Keep answers clear, authoritative, and concise

YOUR ROLE:
- Help users understand server rules and procedures
- Guide users to appropriate support channels when needed
- Answer questions about roleplay, community guidelines, and server features
- Explain complex rules in simple, understandable terms
- Maintain clarity and authority in all responses

CONVERSATION STYLE:
- Answer questions accurately and confidently
- Skip small talk unless necessary for clarification
- Avoid overly apologetic or friendly filler phrases
- Remember context from earlier in the conversation
- Provide follow-up guidance only if essential or requested

LUCID CITY RP KNOWLEDGE:
You have access to comprehensive knowledge about:
- Community rules (Sections C01-C13) including infractions and penalties
- Crew rules for gangs and organizations
- Support channels and how to get help
- Appeal processes and reporting procedures
- Roleplay best practices and server culture

IMPORTANT GUIDELINES:
- Always clarify that you're an AI assistant, not official staff
- For official matters (appeals, reports, serious issues), direct users to staff
- Acknowledge unknowns briefly and refer to staff without speculation
- Enforce understanding of community guidelines with clarity
- Do not make up specific staff names or procedures you're unsure about

CONVERSATION MANAGEMENT:
- This is an ongoing conversation - the user will keep messaging until they say "End"
- Reference earlier parts of your conversation when relevant
- If the user seems confused, ask direct clarifying questions
- Keep track of what you've already explained to avoid repetition

${isNewConversation ? 'This is the start of a new conversation. Acknowledge them and ask how you can help.' : 'Continue the ongoing conversation.'}`;
  }

  buildMessageHistory(conversationHistory, systemPrompt) {
    const messages = [{ role: 'system', content: systemPrompt }];
    
    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    return messages;
  }

  getErrorResponse(error) {
    if (error.code === 'insufficient_quota') {
      return 'I am temporarily unavailable due to API limits. Contact staff directly for assistance.';
    } else if (error.code === 'invalid_api_key') {
      return 'I am experiencing configuration issues. Contact an administrator or reach out to staff for help.';
    } else if (error.status === 429) {
      return 'I am currently busy helping other community members. Try asking your question again in a moment.';
    } else {
      return 'I am experiencing technical difficulties. You can try asking again, or contact staff directly if you need immediate help.';
    }
  }

  async testConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });
      return true;
    } catch (error) {
      console.error('GPT Connection Test Failed:', error);
      return false;
    }
  }
}

module.exports = new ConversationalGPTHandler();