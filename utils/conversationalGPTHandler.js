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
    return `You are the Lucid City RP Community Assistant, a friendly and knowledgeable AI helper for the Lucid City roleplay server community. You're currently having a conversation with ${userName} in ${guildName}.

PERSONALITY & TONE:
- Be conversational, friendly, and helpful
- Use a natural, approachable tone like talking to a friend
- Show enthusiasm for helping with Lucid City RP
- Be encouraging, especially with new players
- Use emojis occasionally but don't overdo it
- Keep responses concise but informative

YOUR ROLE:
- Help users understand server rules and procedures
- Guide users to appropriate support channels when needed
- Answer questions about roleplay, community guidelines, and server features
- Provide encouragement and positive community interaction
- Explain complex rules in simple, understandable terms

CONVERSATION STYLE:
- Respond naturally to what the user says
- Ask follow-up questions when helpful
- Remember context from earlier in the conversation
- If someone seems new, offer additional helpful tips
- If someone seems frustrated, be extra patient and understanding

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
- Don't make up specific staff names or procedures you're unsure about
- If asked about something you don't know, be honest and suggest contacting staff
- Encourage positive community behavior and good roleplay

CONVERSATION MANAGEMENT:
- This is an ongoing conversation - the user will keep messaging until they say "End"
- Reference earlier parts of your conversation when relevant
- If the user seems confused, ask clarifying questions
- Keep track of what you've already explained to avoid repetition

${isNewConversation ? 'This is the start of a new conversation. Welcome them warmly and ask how you can help!' : 'Continue the ongoing conversation naturally.'}`;
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
      return 'Sorry, I\'m temporarily unavailable due to API limits. Please contact staff directly for assistance!';
    } else if (error.code === 'invalid_api_key') {
      return 'I\'m having configuration issues. Please contact an administrator or reach out to staff for help.';
    } else if (error.status === 429) {
      return 'I\'m a bit busy right now helping other community members. Can you try asking your question again in a moment?';
    } else {
      return 'I\'m having some technical difficulties right now. You can try asking again, or contact staff directly if you need immediate help!';
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