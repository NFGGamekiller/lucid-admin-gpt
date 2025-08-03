const OpenAI = require('openai');
const rulesLoader = require('./completeRulesLoader');

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
        temperature: 0.1, // Lower temperature for more factual responses
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

    console.log('🔍 Extracted keywords:', keywords.join(', '));

    // Get relevant rules from the complete documents
    if (keywords.length > 0) {
      const context = rulesLoader.getCompleteRulesContext(keywords);
      console.log(`📋 Using complete rules context: ${context.length} characters`);
      
      // Debug: log first 200 chars of context to see what rules are found
      if (context.length > 0) {
        console.log('📋 Context preview:', context.substring(0, 200) + '...');
      }
      
      return context;
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
    
    // Context-specific keywords to avoid wrong rule matching
    const contextualTerms = {
      roaming: ['roam', 'roaming', 'group', 'limit', 'people', 'players', 'crew', 'many'],
      general_conduct: ['rob', 'robbery', 'shoot', 'attack', 'violence', 'conflict', 'beef', 'pressing'],
      character: ['character', 'break', 'meta', 'power', 'combat', 'log'],
      reporting: ['ban', 'appeal', 'report', 'infraction', 'staff'],
      heists: ['heist', 'fleeca', 'pacific', 'hostage'],
      zones: ['safe', 'zone', 'restart', 'tsunami'],
      toxicity: ['discrimination', 'toxic', 'grief', 'scam', 'exploit', 'cheat', 'mod']
    };
    
    // Only add law enforcement keywords if context actually involves police/government
    if (text.includes('police') || text.includes('cop') || text.includes('officer') || 
        text.includes('government') || text.includes('ems') || text.includes('law enforcement')) {
      keywords.push('police', 'law', 'enforcement', 'government');
    }
    
    // Add relevant contextual terms
    for (const [category, terms] of Object.entries(contextualTerms)) {
      terms.forEach(term => {
        if (words.includes(term)) {
          keywords.push(term);
        }
      });
    }
    
    return keywords.slice(0, 6); // Slightly increased limit
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
- Help users understand server rules and procedures based ONLY on the official rules provided
- Guide users to appropriate support channels when needed
- Answer questions about community guidelines and infraction classifications
- Explain rule violations and their consequences
- Maintain clarity and authority in all responses
- DO NOT provide roleplay advice, suggestions, or game mechanics
- DO NOT give information that would constitute meta gaming

CONVERSATION STYLE:
- Answer questions accurately and confidently based ONLY on the official rules provided in the context
- Skip small talk unless necessary for clarification
- Avoid overly apologetic or friendly filler phrases
- Remember context from earlier in the conversation
- Provide follow-up guidance only if essential or requested
- NEVER make up information not found in the official rules
- NEVER provide roleplay scenarios, examples, or character guidance
- When rules are not clear or missing from context, direct users to staff for clarification
- If you don't have the specific rule information in the context, state that clearly

${rulesContext ? `RELEVANT RULES CONTEXT (USE ONLY THIS INFORMATION):\n${rulesContext}\n\n` : ''}

CRITICAL RULE ACCURACY:
- CONFIDENTLY provide information that is explicitly stated in the RELEVANT RULES CONTEXT above
- If you have relevant rules in the context, provide clear answers based on that information
- Only say "I don't have that specific rule information available" if the context is truly empty or doesn't contain relevant rules
- When you have C06.01 and/or C11.01 in the context, confidently answer roaming questions
- Be direct and helpful when you have the rule information available

RULE APPLICABILITY - CRITICAL:
- C05.01 (LAW ENFORCEMENT INTERACTIONS) - ONLY applies to interactions WITH law enforcement officers/police
- C05.02 (GOVERNMENT ROBBERIES) - ONLY applies to robbing government employees (police, EMS, etc.)
- C05.03 (EMERGENCY MEDICAL SERVICE) - ONLY applies to interactions with EMS personnel
- C05.04 (GOVERNMENT CORRUPTION) - ONLY applies to government employees abusing their powers
- C05.05 (GOVERNMENT IMPERSONATION) - ONLY applies to pretending to be government employees
- Section 05 rules are GOVERNMENT-SPECIFIC and should NOT be applied to civilian vs civilian situations
- For general conduct between civilians, look for rules in other sections like C03 (Unreasonable Conduct), C04 (Character Conduct), C06 (Robbery & Roaming), C09 (Hostile Conduct)
- NEVER cite government/law enforcement rules for civilian situations

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

Ban Appeals:
- ONLY through https://forums.lucidcityrp.com/forms/29-20-ban-appeal/
- Takes 2-10 days depending on Infraction Review Team workload
- NO appeals via ticket or waiting room
- Cannot appeal on behalf of others

IMPORTANT GUIDELINES:
- Always clarify that you're an AI assistant, not official staff
- For official matters (appeals, reports, serious issues), direct users to appropriate channels
- When mentioning support channels, use the channel tags: <#790344631048208435> and <#794297874070241301>
- ONLY provide information that is explicitly stated in the official rules context provided
- NEVER make up rules, procedures, or game mechanics not documented in the context
- DO NOT provide roleplay advice, character guidance, or in-game strategies
- If asked about game mechanics, redirect to learning in-character through roleplay
- Acknowledge unknowns briefly and refer to staff without speculation

CONVERSATION MANAGEMENT:
- This is an ongoing conversation - the user will keep messaging until they say "End"
- Reference earlier parts of your conversation when relevant
- If the user seems confused, ask direct clarifying questions
- Keep track of what you've already explained to avoid repetition

ANTI-META GAMING ENFORCEMENT:
- DO NOT explain how to perform in-game activities (heists, jobs, robberies, etc.)
- DO NOT provide character advice or roleplay scenarios
- DO NOT share game mechanics that characters wouldn't know
- Explain that learning game activities must happen in-character through roleplay
- Remind users that using out-of-character knowledge in roleplay violates meta gaming rules

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