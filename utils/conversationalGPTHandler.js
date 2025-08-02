const OpenAI = require('openai');

class ConversationalGPTHandler {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async handleConversation(userMessage, conversationHistory, context = {}) {
    try {
      const { isNewConversation, userName, guildName, guildId } = context;

      const systemPrompt = this.buildSystemPrompt(userName, guildName, isNewConversation, guildId);
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

  buildSystemPrompt(userName, guildName, isNewConversation, guildId) {
    const isMainServer = guildId === '776724970579165186';
    const serverContext = isMainServer ? 
      'You are in the main Lucid City server where all support is handled.' : 
      'You are in a Lucid City affiliated server. All official support must go through the main Lucid City server.';

    return `You are the Lucid City RP Community Assistant, a knowledgeable AI helper for the Lucid City roleplay server community. You're currently having a conversation with ${userName} in ${guildName}.

${serverContext}

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

SUPPORT PROCEDURES (All support goes to main Lucid City server):
Player Reports:
- Join "Waiting Room" voice channel in main server OR request ticket in community-support channel
- Ticket sent to DMs with prompts for required information
- Requires video clip minimum 1 minute (recommended 2 minutes) with full context
- Must include player's UID (number over head when pressing J in-game)
- Must include ALL audio from ALL players involved (no voices omitted)
- Report as soon as scene concludes (exceptions for real-life emergencies)
- Clips without these elements are considered invalid

Staff Reports:
- Same process as player reports but with escalation hierarchy:
- Moderation team reports → handled by Lead Moderator or higher
- Lead Moderator reports → handled by Administrator
- Administrator reports → handled by Head Administrator  
- Head Administrator reports → handled by Management
- Management reports → handled by TJ Miller (Co-Director)

Ban Appeals:
- ONLY through https://forums.lucidcityrp.com/forms/29-20-ban-appeal/
- Takes 2-10 days depending on Infraction Review Team workload
- Infraction Review Team ONLY handles appeals through that link
- NO appeals via ticket or waiting room
- Cannot appeal on behalf of others

SERVER INFORMATION:
- Main Lucid City server ID: 776724970579165186
- All support and appeals must go through the main server
- If user is not in main server, direct them there for official support

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