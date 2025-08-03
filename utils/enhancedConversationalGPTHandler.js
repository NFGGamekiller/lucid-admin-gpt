const OpenAI = require('openai');
const enhancedRulesParser = require('./enhancedRulesParser');

class EnhancedConversationalGPTHandler {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    this.conversationContext = new Map(); // Store conversation context per user
  }

  async handleConversation(userMessage, conversationHistory, context = {}) {
    try {
      const { isNewConversation, userName, guildName, guildId } = context;
      
      // Analyze the user's query for intent and extract rule context
      const queryAnalysis = this.analyzeUserQuery(userMessage, conversationHistory);
      const rulesContext = this.buildComprehensiveRulesContext(queryAnalysis);
      
      // Store conversation context for better follow-ups
      const userId = context.userId || 'unknown';
      this.updateConversationContext(userId, queryAnalysis, userMessage);

      const systemPrompt = this.buildEnhancedSystemPrompt(
        userName, 
        guildName, 
        isNewConversation, 
        guildId, 
        rulesContext,
        queryAnalysis
      );
      
      const messages = this.buildMessageHistory(conversationHistory, systemPrompt);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.1,
        max_tokens: 1200,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Enhanced GPT API Error:', error);
      return this.getErrorResponse(error);
    }
  }

  analyzeUserQuery(userMessage, conversationHistory) {
    const analysis = {
      intent: this.detectIntent(userMessage),
      ruleCodesRequested: this.extractRuleCodes(userMessage),
      concepts: this.extractConcepts(userMessage),
      keywords: this.extractAdvancedKeywords(userMessage),
      severity: this.detectSeverityLevel(userMessage),
      queryType: this.classifyQuery(userMessage),
      followUpContext: this.getFollowUpContext(conversationHistory),
      entities: this.extractEntities(userMessage)
    };

    console.log('🔍 Query Analysis:', {
      intent: analysis.intent,
      concepts: analysis.concepts,
      queryType: analysis.queryType,
      ruleCodesRequested: analysis.ruleCodesRequested
    });

    return analysis;
  }

  detectIntent(message) {
    const intents = {
      'rule_lookup': [
        /what.*rule/i, /which.*rule/i, /find.*rule/i, /rule.*about/i,
        /^[cC]\d{2}\.\d{2}/
      ],
      'explanation': [
        /explain/i, /what.*mean/i, /clarify/i, /help.*understand/i,
        /what.*is/i, /how.*work/i
      ],
      'consequences': [
        /what.*happen/i, /punishment/i, /ban/i, /consequence/i,
        /suspended/i, /infraction/i, /penalty/i
      ],
      'permission': [
        /can.*i/i, /am.*allowed/i, /is.*allowed/i, /permitted/i,
        /legal/i, /against.*rule/i
      ],
      'comparison': [
        /difference/i, /compare/i, /versus/i, /vs/i, /better/i, /worse/i
      ],
      'appeal_help': [
        /appeal/i, /banned/i, /suspended/i, /contest/i, /unfair/i
      ],
      'report_help': [
        /report/i, /violation/i, /someone.*broke/i, /file.*complaint/i
      ]
    };

    for (const [intent, patterns] of Object.entries(intents)) {
      if (patterns.some(pattern => pattern.test(message))) {
        return intent;
      }
    }

    return 'general_inquiry';
  }

  extractRuleCodes(message) {
    const ruleCodes = [];
    
    // Match C##.## format
    const codeMatches = message.match(/[cC]\d{2}\.?\d{0,2}/g);
    if (codeMatches) {
      ruleCodes.push(...codeMatches.map(code => code.toUpperCase().replace(/(\d{2})(\d{2})/, '$1.$2')));
    }
    
    // Match spelled out codes like "C zero six dot zero one"
    const spokenCodes = message.match(/[cC]\s*(?:zero\s*)?(\d+|zero|one|two|three|four|five|six|seven|eight|nine)\s*(?:dot|point)?\s*(?:zero\s*)?(\d+|zero|one|two|three|four|five|six|seven|eight|nine)/gi);
    if (spokenCodes) {
      // Convert spoken numbers to digits and add to rule codes
      // This would need a more complex implementation for full support
    }
    
    return [...new Set(ruleCodes)]; // Remove duplicates
  }

  extractConcepts(message) {
    const concepts = new Set();
    const lowerMessage = message.toLowerCase();
    
    // Enhanced concept detection with context
    const conceptMappings = {
      'roaming': ['roam', 'group', 'limit', 'people', 'together', 'party', 'squad'],
      'violence': ['kill', 'shoot', 'attack', 'harm', 'violence', 'rdm', 'vdm', 'fight'],
      'meta_gaming': ['meta', 'discord', 'outside', 'external', 'information', 'ooc'],
      'power_gaming': ['power', 'force', 'unrealistic', 'abuse', 'feature'],
      'character_conduct': ['character', 'roleplay', 'immersion', 'acting', 'personality'],
      'government': ['police', 'cop', 'ems', 'government', 'law enforcement', 'officer'],
      'crew_rules': ['crew', 'gang', 'organization', 'conflict', 'war', 'territory'],
      'economy': ['money', 'rob', 'steal', 'scam', 'economy', 'trading', 'sell'],
      'technical': ['exploit', 'cheat', 'mod', 'hack', 'bug', 'client'],
      'communication': ['voice', 'chat', 'talk', 'speak', 'communicate'],
      'locations': ['hospital', 'safe zone', 'apartment', 'bank', 'store'],
      'vehicles': ['car', 'vehicle', 'drive', 'crash', 'ram', 'pursuit'],
      'time_restrictions': ['restart', 'tsunami', 'cooldown', 'timer', 'wait'],
      'appeals_reports': ['appeal', 'report', 'ban', 'suspended', 'ticket', 'staff']
    };
    
    for (const [concept, keywords] of Object.entries(conceptMappings)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        concepts.add(concept);
      }
    }
    
    // Detect severity-related concepts
    const severityKeywords = ['ban', 'suspend', 'warn', 'kick', 'remove', 'delete'];
    if (severityKeywords.some(keyword => lowerMessage.includes(keyword))) {
      concepts.add('consequences');
    }
    
    return Array.from(concepts);
  }

  extractAdvancedKeywords(message) {
    // More sophisticated keyword extraction
    const words = message.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const stopWords = new Set([
      'the', 'and', 'or', 'is', 'are', 'to', 'of', 'in', 'for', 'with', 'by', 
      'a', 'an', 'can', 'will', 'what', 'how', 'when', 'where', 'why', 'who',
      'this', 'that', 'these', 'those', 'me', 'you', 'we', 'they', 'it'
    ]);
    
    const importantWords = words.filter(word => !stopWords.has(word));
    
    // Weight important terms
    const weightedKeywords = [];
    const highValueTerms = ['rule', 'regulation', 'guideline', 'violation', 'infraction'];
    
    for (const word of importantWords) {
      if (highValueTerms.includes(word)) {
        weightedKeywords.push({ word, weight: 2.0 });
      } else {
        weightedKeywords.push({ word, weight: 1.0 });
      }
    }
    
    return weightedKeywords.slice(0, 10);
  }

  detectSeverityLevel(message) {
    const severityIndicators = {
      'low': ['warning', 'minor', 'small', 'little'],
      'medium': ['suspend', 'temporary', 'few days'],
      'high': ['ban', 'permanent', 'serious', 'major'],
      'critical': ['removal', 'blacklist', 'terminated', 'deleted']
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (const [level, indicators] of Object.entries(severityIndicators)) {
      if (indicators.some(indicator => lowerMessage.includes(indicator))) {
        return level;
      }
    }
    
    return 'unknown';
  }

  classifyQuery(message) {
    const classifications = {
      'specific_rule': /[cC]\d{2}\.\d{2}/.test(message),
      'general_concept': /what.*about|tell.*about|explain.*concept/.test(message),
      'scenario_based': /if.*i|can.*i|what.*happens.*if|scenario|situation/.test(message),
      'comparison': /difference|compare|versus|vs|better|worse/.test(message),
      'procedural': /how.*to|process|procedure|steps/.test(message),
      'definitional': /what.*is|define|meaning|means/.test(message)
    };
    
    for (const [type, test] of Object.entries(classifications)) {
      if (test) return type;
    }
    
    return 'general';
  }

  getFollowUpContext(conversationHistory) {
    if (conversationHistory.length < 2) return null;
    
    const recentMessages = conversationHistory.slice(-3);
    const mentionedRules = [];
    const mentionedConcepts = [];
    
    for (const msg of recentMessages) {
      const codes = this.extractRuleCodes(msg.content);
      const concepts = this.extractConcepts(msg.content);
      mentionedRules.push(...codes);
      mentionedConcepts.push(...concepts);
    }
    
    return {
      mentionedRules: [...new Set(mentionedRules)],
      mentionedConcepts: [...new Set(mentionedConcepts)],
      hasContext: mentionedRules.length > 0 || mentionedConcepts.length > 0
    };
  }

  extractEntities(message) {
    const entities = {
      numbers: message.match(/\d+/g) || [],
      timeReferences: this.extractTimeReferences(message),
      playerReferences: this.extractPlayerReferences(message),
      gameElements: this.extractGameElements(message)
    };
    
    return entities;
  }

  extractTimeReferences(message) {
    const timePatterns = [
      /\d+\s*(?:hour|hr|h)/gi,
      /\d+\s*(?:day|d)/gi,
      /\d+\s*(?:week|wk|w)/gi,
      /\d+\s*(?:month|mo|m)/gi,
      /\d+\s*(?:minute|min)/gi
    ];
    
    const matches = [];
    for (const pattern of timePatterns) {
      const found = message.match(pattern);
      if (found) matches.push(...found);
    }
    
    return matches;
  }

  extractPlayerReferences(message) {
    const patterns = [
      /player/gi,
      /member/gi,
      /user/gi,
      /person/gi,
      /individual/gi
    ];
    
    return patterns.some(pattern => pattern.test(message));
  }

  extractGameElements(message) {
    const gameElements = [];
    const lowerMessage = message.toLowerCase();
    
    const elements = {
      'vehicles': ['car', 'vehicle', 'bike', 'truck', 'helicopter', 'plane'],
      'locations': ['hospital', 'bank', 'store', 'apartment', 'house', 'city'],
      'items': ['weapon', 'gun', 'money', 'cash', 'drugs', 'items'],
      'activities': ['heist', 'robbery', 'racing', 'business', 'job', 'work']
    };
    
    for (const [category, terms] of Object.entries(elements)) {
      if (terms.some(term => lowerMessage.includes(term))) {
        gameElements.push(category);
      }
    }
    
    return gameElements;
  }

  buildComprehensiveRulesContext(analysis) {
    let context = '';
    
    // Handle specific rule code requests
    if (analysis.ruleCodesRequested.length > 0) {
      for (const ruleCode of analysis.ruleCodesRequested) {
        const ruleExplanation = enhancedRulesParser.generateRuleExplanation(ruleCode, true);
        if (ruleExplanation) {
          context += `SPECIFIC RULE REQUESTED - ${ruleCode}:\n`;
          context += ruleExplanation.explanation + '\n\n';
          
          // Add related rules context
          if (ruleExplanation.related.length > 0) {
            context += `RELATED RULES:\n`;
            for (const related of ruleExplanation.related) {
              context += `${related.rule.code} - ${related.rule.title}: ${related.rule.description}\n`;
            }
            context += '\n';
          }
        }
      }
    }
    
    // Handle concept-based searches
    if (analysis.concepts.length > 0) {
      const searchResults = enhancedRulesParser.intelligentSearch(
        analysis.concepts.join(' '), 
        { includeRelated: true, conceptWeight: 1.5 }
      );
      
      if (searchResults.primary.length > 0) {
        context += `RELEVANT RULES FOR CONCEPTS [${analysis.concepts.join(', ')}]:\n\n`;
        
        for (const result of searchResults.primary.slice(0, 3)) {
          const rule = result.rule;
          context += `${rule.code} - ${rule.title}:\n`;
          context += `${rule.description}\n`;
          
          if (rule.prohibitions.length > 0) {
            context += `Prohibited: ${rule.prohibitions.join('; ')}\n`;
          }
          
          if (rule.requirements.length > 0) {
            context += `Requirements: ${rule.requirements.join('; ')}\n`;
          }
          
          if (rule.examples.length > 0) {
            context += `Examples: ${rule.examples.slice(0, 2).join('; ')}\n`;
          }
          
          context += `\n`;
        }
        
        // Add conceptual context
        const conceptContext = enhancedRulesParser.getConceptualContext(analysis.concepts);
        if (conceptContext.length > 0) {
          context += `CONCEPTUAL RELATIONSHIPS:\n`;
          for (const conceptInfo of conceptContext.slice(0, 2)) {
            context += `${conceptInfo.concept}: ${conceptInfo.ruleCount} related rules\n`;
          }
          context += '\n';
        }
      }
    }
    
    // Handle keyword-based searches if no specific rules or strong concepts found
    if (!context && analysis.keywords.length > 0) {
      const keywordQuery = analysis.keywords.map(kw => kw.word).join(' ');
      const searchResults = enhancedRulesParser.intelligentSearch(keywordQuery);
      
      if (searchResults.primary.length > 0) {
        context += `RULES MATCHING KEYWORDS [${keywordQuery}]:\n\n`;
        
        for (const result of searchResults.primary.slice(0, 2)) {
          const rule = result.rule;
          context += `${rule.code} - ${rule.title}: ${rule.description}\n`;
          if (rule.examples.length > 0) {
            context += `Example: ${rule.examples[0]}\n`;
          }
          context += '\n';
        }
      }
    }
    
    // Add infraction information if consequences are being discussed
    if (analysis.intent === 'consequences' || analysis.concepts.includes('consequences')) {
      context += `INFRACTION SYSTEM OVERVIEW:\n`;
      context += `Classification A: Warning/1 Day (5 points, expires 3 months)\n`;
      context += `Classification B: 3 Day Suspension (10 points, expires 6 months)\n`;
      context += `Classification C: 5 Day Suspension (15 points, expires 6 months)\n`;
      context += `Classification D: 7 Day Suspension (20 points, expires 12 months)\n`;
      context += `Classification E: 14 Day Suspension (25 points, expires 12 months)\n`;
      context += `Classification F: Permanent Ban (50 points, never expire)\n`;
      context += `Maximum total: 125 points before Community Removal\n\n`;
    }
    
    console.log(`📋 Built comprehensive context: ${context.length} characters`);
    return context.substring(0, 4000); // Limit context size
  }

  updateConversationContext(userId, analysis, message) {
    if (!this.conversationContext.has(userId)) {
      this.conversationContext.set(userId, {
        topics: [],
        rulesDiscussed: [],
        concepts: [],
        lastIntent: null
      });
    }
    
    const userContext = this.conversationContext.get(userId);
    userContext.lastIntent = analysis.intent;
    userContext.rulesDiscussed.push(...analysis.ruleCodesRequested);
    userContext.concepts.push(...analysis.concepts);
    
    // Keep only recent history
    userContext.rulesDiscussed = [...new Set(userContext.rulesDiscussed)].slice(-5);
    userContext.concepts = [...new Set(userContext.concepts)].slice(-5);
  }

buildEnhancedSystemPrompt(userName, guildName, isNewConversation, guildId, rulesContext, analysis) {
  const isMainServer = guildId === '776724970579165186';
  const serverContext = isMainServer ? 
    'You are in the main Lucid City server where all support is handled.' : 
    'You are in a Lucid City affiliated server. All official support must go through the main Lucid City server.';

  const intentGuidance = this.getIntentSpecificGuidance(analysis.intent);

  return `You are the Lucid City RP Community Assistant with deep understanding of server rules. You're conversing with ${userName} in ${guildName}.

${serverContext}

QUERY ANALYSIS DETECTED:
- User Intent: ${analysis.intent}
- Concepts Identified: ${analysis.concepts.join(', ') || 'General inquiry'}
- Query Classification: ${analysis.queryType}
- Specific Rules Requested: ${analysis.ruleCodesRequested.join(', ') || 'None'}

RESPONSE STRATEGY: ${intentGuidance}

CRITICAL: Use the COMPREHENSIVE RULES CONTEXT below to provide detailed, accurate answers. Do not give generic responses.

${rulesContext ? `COMPREHENSIVE RULES CONTEXT FOR THIS QUERY:
${rulesContext}

IMPORTANT: Base your entire response on the rules context above. Reference specific rule codes, explain relationships between rules, and provide comprehensive explanations.` : 'No specific rules context found - ask for clarification about what they need help with.'}

PERSONALITY & APPROACH:
- Be authoritative and knowledgeable about the specific rules provided in context
- Reference rule codes (like C06.01) when explaining concepts
- Explain rule relationships and how different rules work together
- Provide detailed explanations with examples when available in the context
- Do not use emojis or overly casual language
- Be direct and informative

CONVERSATION FLOW:
${isNewConversation ? 
  `This is a new conversation. After greeting ${userName}, immediately address their specific question using the rules context provided above.` : 
  'Continue the ongoing conversation, building on what has been discussed previously.'
}

ENHANCED CAPABILITIES IN USE:
- Deep rule parsing with full context understanding
- Intelligent concept mapping and relationship analysis
- Comprehensive infraction and consequence explanations
- Related rule suggestions based on actual connections

SUPPORT GUIDANCE:
- Player Reports: <#790344631048208435> or <#794297874070241301>
- Ban Appeals: https://forums.lucidcityrp.com/forms/29-20-ban-appeal/
- For official matters, direct to appropriate channels

RESPONSE REQUIREMENT: Provide a detailed, informative response about Lucid City RP rules based on the context above. Do not give generic greetings without addressing their specific question.`;

}
  getIntentSpecificGuidance(intent) {
    const guidance = {
      'rule_lookup': 'Focus on providing complete rule information including context, examples, and related rules.',
      'explanation': 'Provide thorough explanations that help the user understand both the rule and its reasoning.',
      'consequences': 'Explain the infraction system, specific penalties, and escalation patterns.',
      'permission': 'Clearly state what is and isn\'t allowed, with specific rule references.',
      'comparison': 'Highlight differences and similarities between rules or concepts.',
      'appeal_help': 'Guide to proper appeal procedures and explain the process.',
      'report_help': 'Explain reporting procedures and evidence requirements.',
      'general_inquiry': 'Use your comprehensive understanding to address the underlying question.'
    };
    
    return guidance[intent] || guidance['general_inquiry'];
  }

  buildMessageHistory(conversationHistory, systemPrompt) {
    const messages = [{ role: 'system', content: systemPrompt }];
    
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
      return 'I am experiencing configuration issues. Contact an administrator.';
    } else if (error.status === 429) {
      return 'I am currently busy. Please try again in a moment.';
    } else {
      return 'I am experiencing technical difficulties. Contact staff if you need immediate help.';
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
      console.error('Enhanced GPT Connection Test Failed:', error);
      return false;
    }
  }

  // Diagnostic methods
  getParserStats() {
    return enhancedRulesParser.getStats();
  }

  testRuleSearch(query) {
    return enhancedRulesParser.intelligentSearch(query, { includeRelated: true });
  }

  explainRule(ruleCode) {
    return enhancedRulesParser.generateRuleExplanation(ruleCode, true);
  }
}

module.exports = new EnhancedConversationalGPTHandler();