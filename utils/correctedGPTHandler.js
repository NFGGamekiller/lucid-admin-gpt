const OpenAI = require('openai');
const enhancedRulesParser = require('./enhancedRulesParser');
const ruleAccuracyEnhancer = require('./ruleAccuracyEnhancer');

class FixedCorrectedGPTHandler {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async handleConversation(userMessage, conversationHistory, context = {}) {
    try {
      const { isNewConversation, userName, guildName, guildId } = context;
      
      console.log(`🔍 Processing query: "${userMessage}"`);
      
      // CRITICAL: Check for exact rule scenarios first
      const criticalRule = ruleAccuracyEnhancer.determineExactRule(userMessage);
      
      if (criticalRule) {
        console.log(`🎯 Using critical rule mapping: ${criticalRule.code}`);
        // Use the critical rule mapping directly for maximum accuracy
        return this.generateCriticalRuleResponse(criticalRule, userName);
      }
      
      // Build enhanced context for non-critical queries
      const rulesContext = this.buildEnhancedContext(userMessage);
      
      // Build system prompt
      const systemPrompt = this.buildFixedSystemPrompt(userName, guildName, rulesContext, userMessage);
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.1, // Very low for consistency
        max_tokens: 600,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Fixed GPT API Error:', error);
      return this.getErrorResponse(error);
    }
  }

  generateCriticalRuleResponse(criticalRule, userName) {
    // Generate the exact decisive response for critical scenarios
    let response = `**${criticalRule.judgment}** - This ${criticalRule.judgment.includes('VIOLATION') || criticalRule.judgment.includes('NOT PERMISSIBLE') ? 'violates' : 'follows'} rule ${criticalRule.code} - ${criticalRule.title}.\n\n`;
    
    response += `${criticalRule.reasoning}`;
    
    if (criticalRule.infraction && criticalRule.infraction.length > 0) {
      const infractions = criticalRule.infraction.join(' → ');
      response += `\n\n**Consequences:** ${infractions}`;
    }
    
    return response;
  }

  buildEnhancedContext(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    let context = '';
    
    // Add specific rule context based on query content
    if (lowerMessage.includes('roam') || lowerMessage.includes('people') || lowerMessage.includes('group')) {
      context += `ROAMING RULES:
C06.01 - PLAYER ROAMING LIMITATIONS: Non-crew players limited to 6 people for all activities including heists and robberies.
C11.01 - ROAMING LIMITATIONS: Crew members can roam with up to 16 people, but limited to 6 when law enforcement is involved.

`;
    }
    
    if (lowerMessage.includes('combat') || lowerMessage.includes('timer') || lowerMessage.includes('down')) {
      context += `COMBAT RULES:
C04.06 - RETURNING TO SCENE & COMBAT TIMER: Cannot re-engage after being downed. Must wait 30 minutes after medical care before combat.

`;
    }
    
    if (lowerMessage.includes('discord') || lowerMessage.includes('external') || lowerMessage.includes('meta')) {
      context += `META GAMING RULES:
C07.03 - META GAMING & EXTERNAL INFORMATION: Using Discord, streams, or external info during roleplay is prohibited.

`;
    }
    
    if (lowerMessage.includes('toxic') || lowerMessage.includes('running over') || lowerMessage.includes('excessive')) {
      context += `TOXICITY RULES:
C03.03 - EXCESSIVE TOXICITY: Running over downed bodies, excessive actions, carrying players 15+ minutes without purpose is prohibited.

`;
    }
    
    return context;
  }

  buildFixedSystemPrompt(userName, guildName, rulesContext, userMessage) {
    return `You are the Lucid City RP Community Assistant providing authoritative rule information to ${userName}.

CRITICAL INSTRUCTIONS:
1. Answer the EXACT question asked - do not make up scenarios
2. Use ONLY the rules context provided below  
3. Be decisive and definitive in your responses
4. Format: **[JUDGMENT]** - This violates/follows rule [CODE] - [TITLE]

USER'S ACTUAL QUESTION: "${userMessage}"

${rulesContext ? `RELEVANT RULES FOR THIS QUESTION:
${rulesContext}

Answer based ONLY on the rules above.` : 'No specific rules context found. Provide general guidance and direct to staff for specifics.'}

RESPONSE REQUIREMENTS:
- Start with a clear judgment (**YES/NO/VIOLATION/PERMITTED**)
- Reference the exact rule code that applies
- Give a brief, factual explanation
- Do not create hypothetical scenarios
- Do not give unrelated rule information

If the question cannot be answered with the provided rules context, say "I don't have specific rule information for that question. Contact staff for clarification."`;
  }

  getErrorResponse(error) {
    if (error.code === 'insufficient_quota') {
      return 'I am temporarily unavailable due to API limits. Contact staff directly.';
    } else if (error.status === 429) {
      return 'I am currently busy. Please try again in a moment.';
    } else {
      return 'I am experiencing technical difficulties. Contact staff if needed.';
    }
  }

  // Diagnostic methods
  getParserStats() {
    try {
      return enhancedRulesParser.getStats();
    } catch (error) {
      return { totalRules: 0, communityRules: 0, crewRules: 0, concepts: 0, relationships: 0 };
    }
  }

  testRuleAccuracy(query) {
    const criticalRule = ruleAccuracyEnhancer.determineExactRule(query);
    if (criticalRule) {
      return {
        type: 'critical_mapping',
        rule: criticalRule,
        accuracy: 'high',
        decisiveAnswer: ruleAccuracyEnhancer.generateDecisiveAnswer(criticalRule)
      };
    }
    
    try {
      return ruleAccuracyEnhancer.enhancedRuleLookup(query, enhancedRulesParser);
    } catch (error) {
      return { primary: [], related: [], critical: false };
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

module.exports = new FixedCorrectedGPTHandler();