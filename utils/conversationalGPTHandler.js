const OpenAI = require('openai');

// Try to load the complete rules loader, fallback to old database if needed
let rulesLoader;
try {
  rulesLoader = require('./completeRulesLoader');
  console.log('✅ Using complete rules loader');
} catch (error) {
  console.log('⚠️ Complete rules loader not found, falling back to rules database');
  rulesLoader = require('./rulesDatabase');
}

class ConversationalGPTHandler {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async handleConversation(userMessage, conversationHistory, context = {}) {
    try {
      const { isNewConversation, userName, guildName, guildId } = context;

      // Get relevant rules context from the complete documents
      const rulesContext = this.extractRulesContext(userMessage, conversationHistory);

      const systemPrompt = this.buildSystemPrompt(userName, guildName, isNewConversation, guildId, rulesContext);
      const messages = this.buildMessageHistory(conversationHistory, systemPrompt);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('GPT API Error:', error);
      return this.getErrorResponse(error);
    }
  }

  extractRulesContext(userMessage, conversationHistory) {
    // Extract keywords from the user's message and conversation
    const keywords = this.extractKeywords(userMessage);
    
    // Add keywords from recent conversation
    const recentMessages = conversationHistory.slice(-3);
    recentMessages.forEach(msg => {
      keywords.push(...this.extractKeywords(msg.content));
    });

    console.log(`🔍 Extracted keywords: ${keywords.join(', ')}`);

    // Get relevant rules from the complete documents
    if (keywords.length > 0) {
      try {
        let context = '';
        if (rulesLoader.getCompleteRulesContext) {
          context = rulesLoader.getCompleteRulesContext(keywords);
          console.log(`📋 Using complete rules context: ${context.length} characters`);
        } else if (rulesLoader.getRuleContext) {
          context = rulesLoader.getRuleContext(keywords);
          console.log(`📋 Using fallback rules context: ${context.length} characters`);
        }
        return context;
      } catch (error) {
        console.error('❌ Error getting rules context:', error);
        return '';
      }
    }
    
    return '';
  }

  extractKeywords(text) {
    const keywords = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Look for rule codes
    const ruleCodes = text.match(/[cC]\d{2}\.?\d{0,2}/g);
    if (ruleCodes) {
      keywords.push(...ruleCodes);
    }
    
    // Important rule-related terms
    const ruleTerms = [
      'roam', 'roaming', 'group', 'people', 'crew', 'rob', 'robbery', 'rdm', 'vdm', 
      'meta', 'power', 'combat', 'log', 'character', 'break', 'gang', 'police', 
      'ems', 'government', 'ban', 'appeal', 'report', 'infraction', 'heist', 
      'fleeca', 'pacific', 'hostage', 'safe', 'zone', 'restart', 'tsunami',
      'discrimination', 'toxic', 'grief', 'scam', 'exploit', 'cheat', 'mod',
      'many', 'limit', 'maximum', 'together'
    ];
    
    words.forEach(word => {
      if (ruleTerms.includes(word)) {
        keywords.push(word);
      }
    });
    
    return [...new Set(keywords)].slice(0, 5); // Remove duplicates and limit keywords
  }

  buildSystemPrompt(userName, guildName, isNewConversation, guildId, rulesContext = '') {
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
- Answer questions about community guidelines and infraction classifications
- Explain rule violations and their consequences
- Maintain clarity and authority in all responses
- DO NOT provide roleplay advice, suggestions, or game mechanics
- DO NOT give information that would constitute meta gaming

CONVERSATION STYLE:
- Answer questions accurately and confidently based ONLY on the official rules provided
- Skip small talk unless necessary for clarification
- Avoid overly apologetic or friendly filler phrases
- Remember context from earlier in the conversation
- Provide follow-up guidance only if essential or requested
- NEVER make up information not found in the official rules
- NEVER provide roleplay scenarios, examples, or character guidance
- When rules are not clear, direct users to staff for clarification

${rulesContext ? `RELEVANT RULES CONTEXT:\n${rulesContext}\n\n` : ''}

TECHNICAL INFORMATION:
- Lucid City RP is a FiveM roleplay server
- FiveM is a modification for Grand Theft Auto V that allows custom multiplayer servers
- Common technical issues include: mod conflicts, outdated FiveM client, corrupted cache, graphics driver issues
- Players connect through the FiveM client, not the base GTA V game

SUPPORT PROCEDURES:
Player Reports:
- Join <#790344631048208435> (Waiting Room voice channel) OR request ticket in <#794297874070241301> (community-support)
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

CHANNEL INFORMATION:
- Waiting Room (voice): <#790344631048208435>
- Community Support (text): <#794297874070241301>
- Main Lucid City server ID: 776724970579165186

COMMON FIVEM TECHNICAL ISSUES:
- Game crashes: Often caused by outdated FiveM client, mod conflicts, or graphics driver issues
- Connection issues: Usually related to internet connectivity, server capacity, or FiveM client problems
- Performance issues: Graphics settings too high, insufficient hardware, background applications
- Character not loading: Cache corruption, server connection issues
- Recommended troubleshooting: Update FiveM client, clear cache, verify GTA V files, update graphics drivers

IMPORTANT GUIDELINES:
- Always clarify that you're an AI assistant, not official staff
- For official matters (appeals, reports, serious issues), direct users to appropriate channels
- When mentioning support channels, use the channel tags: <#790344631048208435> and <#794297874070241301>
- For technical issues, consider FiveM-specific troubleshooting steps
- ONLY provide information that is explicitly stated in the official rules
- NEVER make up rules, procedures, or game mechanics not documented
- DO NOT provide roleplay advice, character guidance, or in-game strategies
- DO NOT explain game mechanics or "how to" information that would constitute meta gaming
- If asked about game mechanics, redirect to learning in-character through roleplay
- Acknowledge unknowns briefly and refer to staff without speculation
- Enforce understanding of community guidelines with clarity

CONVERSATION MANAGEMENT:
- This is an ongoing conversation - the user will keep messaging until they say "End"
- Reference earlier parts of your conversation when relevant
- If the user seems confused, ask direct clarifying questions
- Keep track of what you've already explained to avoid repetition
- If asked about roleplay mechanics or "how to" do in-game activities, explain that characters must learn this information in-character
- Redirect meta gaming questions to proper roleplay learning

ANTI-META GAMING ENFORCEMENT:
- DO NOT explain how to perform in-game activities (heists, jobs, robberies, etc.)
- DO NOT provide character advice or roleplay scenarios
- DO NOT share game mechanics that characters wouldn't know
- Explain that learning game activities must happen in-character through roleplay
- Remind users that using out-of-character knowledge in roleplay violates C07.03 (Meta Gaming)

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