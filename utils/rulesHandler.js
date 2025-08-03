const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class RulesHandler {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    this.communityRules = '';
    this.crewRules = '';
    this.parsedRules = new Map();
    this.rulesByCode = new Map();
    
    // Static server information
    this.serverInfo = {
      discordInvite: 'https://discord.gg/LucidCity',
      connectCommand: 'connect play.lucidcityrp.com',
      channels: {
        rules: '<#791819254374465536>',
        communitySupport: '<#794297874070241301>',
        waitingRoom: '<#790344631048208435>',
        gameCrashes: '<#847957461603581972>',
        faq: '<#794391616772374558>',
        shopSupport: '<#817207253195030528>'
      },
      banAppealForm: 'https://forums.lucidcityrp.com/forms/29-20-ban-appeal/'
    };
  }

  async loadRules() {
    try {
      const rulesDir = path.join(__dirname, '..', 'rules');
      
      // Load ONLY the two specified files
      const communityRulesPath = path.join(rulesDir, 'COMMUNITY REGULATORY GUIDELINES AND RULES.txt');
      const crewRulesPath = path.join(rulesDir, 'CREW REGULATORY GUIDELINES.txt');
      
      if (fs.existsSync(communityRulesPath)) {
        this.communityRules = fs.readFileSync(communityRulesPath, 'utf8');
        console.log('✅ Loaded: COMMUNITY REGULATORY GUIDELINES AND RULES.txt');
      } else {
        console.error('❌ Missing: COMMUNITY REGULATORY GUIDELINES AND RULES.txt');
        return false;
      }
      
      if (fs.existsSync(crewRulesPath)) {
        this.crewRules = fs.readFileSync(crewRulesPath, 'utf8');
        console.log('✅ Loaded: CREW REGULATORY GUIDELINES.txt');
      } else {
        console.error('❌ Missing: CREW REGULATORY GUIDELINES.txt');
        return false;
      }
      
      // Parse the loaded rules
      this.parseRules();
      
      console.log(`📊 Parsed ${this.parsedRules.size} total rules from official documents`);
      console.log(`   📜 Community Rules: ${Array.from(this.parsedRules.values()).filter(r => r.type === 'community').length}`);
      console.log(`   👥 Crew Rules: ${Array.from(this.parsedRules.values()).filter(r => r.type === 'crew').length}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error loading rules:', error);
      return false;
    }
  }

  parseRules() {
    this.parseDocument(this.communityRules, 'community');
    this.parseDocument(this.crewRules, 'crew');
  }

  parseDocument(content, type) {
    const lines = content.split('\n');
    let currentRule = null;
    let currentContent = [];
    let currentSection = '';
    
    const rulePattern = /^([C][0-9]{2}\.[0-9]{2})\s*-\s*(.+?):/;
    const sectionPattern = /^SECTION\s+(\d+)\s*-\s*(.+?):/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for section headers
      const sectionMatch = line.match(sectionPattern);
      if (sectionMatch) {
        currentSection = `${sectionMatch[1]} - ${sectionMatch[2]}`;
        continue;
      }
      
      // Check for rule headers
      const ruleMatch = line.match(rulePattern);
      if (ruleMatch) {
        // Process previous rule if it exists
        if (currentRule) {
          this.processRule(currentRule, currentContent, type, currentSection);
        }
        
        // Start new rule
        currentRule = {
          code: ruleMatch[1],
          title: ruleMatch[2]
        };
        currentContent = [line];
      } else if (currentRule && line) {
        currentContent.push(line);
      } else if (currentRule && !line) {
        // Check if this is the end of the rule
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) {
          j++;
        }
        if (j < lines.length) {
          const nextLine = lines[j].trim();
          if (nextLine.match(rulePattern) || nextLine.match(sectionPattern)) {
            // End of current rule
            this.processRule(currentRule, currentContent, type, currentSection);
            currentRule = null;
            currentContent = [];
          }
        }
      }
    }
    
    // Process final rule
    if (currentRule) {
      this.processRule(currentRule, currentContent, type, currentSection);
    }
  }

  processRule(ruleHeader, content, type, section) {
    const rule = {
      code: ruleHeader.code,
      title: ruleHeader.title,
      type: type,
      section: section,
      content: content.join('\n'),
      description: this.extractDescription(content),
      infractions: this.extractInfractions(content),
      examples: this.extractExamples(content)
    };
    
    this.parsedRules.set(rule.code, rule);
    this.rulesByCode.set(rule.code.toLowerCase(), rule);
    
    // Also store without dots for easier lookup
    const codeNoDots = rule.code.replace('.', '');
    this.rulesByCode.set(codeNoDots.toLowerCase(), rule);
  }

  extractDescription(content) {
    // Find the "General Information:" line and extract description
    const generalInfoIndex = content.findIndex(line => line.includes('General Information:'));
    if (generalInfoIndex !== -1 && generalInfoIndex < content.length - 1) {
      return content[generalInfoIndex + 1].trim();
    }
    return 'Description not available';
  }

  extractInfractions(content) {
    // Find infraction category line
    const infractionLine = content.find(line => line.includes('Infraction Category:'));
    if (infractionLine) {
      const match = infractionLine.match(/\[([^\]]+)\]/);
      if (match) {
        return match[1];
      }
    }
    return 'Variable';
  }

  extractExamples(content) {
    const examples = [];
    let inExampleSection = false;
    
    for (const line of content) {
      if (line.toLowerCase().includes('examples') && line.includes(':')) {
        inExampleSection = true;
        continue;
      }
      
      if (inExampleSection) {
        if (line.startsWith('•') || line.match(/^\d+\./)) {
          examples.push(line.replace(/^[•\d.]\s*/, '').trim());
        } else if (line.includes(':') && !line.toLowerCase().includes('example')) {
          break; // End of examples section
        }
      }
    }
    
    return examples;
  }

  async processQuery(userMessage, conversationHistory, context) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const relevantRules = this.findRelevantRules(userMessage, conversationHistory);
      
      const messages = [
        { role: 'system', content: systemPrompt + this.buildRulesContext(relevantRules) },
        ...conversationHistory
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.1,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('OpenAI API Error:', error);
      return this.getErrorResponse(error);
    }
  }

  buildSystemPrompt(context) {
    return `You are the Lucid City RP Community Assistant. You help users with questions about server rules, support procedures, and basic technical guidance.

CRITICAL RESTRICTIONS:
- ONLY reference information from the official Community and Crew Regulatory Guidelines documents
- NEVER reference or mention internal staff documents, moderation procedures, or confidential processes
- Stick to publicly available information only

YOUR ROLE:
- Answer questions about Lucid City RP rules accurately using only the official documents
- Guide users to proper support channels when needed
- Explain rule violations and consequences based on the official infraction classifications
- Provide basic technical support for common FiveM issues
- Maintain professionalism and accuracy

TONE & STYLE:
- Professional and helpful, but not overly casual
- Clear and direct responses
- Reference specific rule codes when applicable
- Skip unnecessary pleasantries unless it's a new conversation

SERVER INFORMATION:
- Discord: ${this.serverInfo.discordInvite}
- Connect: \`${this.serverInfo.connectCommand}\`
- Rules Channel: ${this.serverInfo.channels.rules}
- Community Support: ${this.serverInfo.channels.communitySupport}
- Staff Help (Waiting Room): ${this.serverInfo.channels.waitingRoom}
- Game Crashes: ${this.serverInfo.channels.gameCrashes}
- Ban Appeals: ${this.serverInfo.banAppealForm}

SUPPORT PROCEDURES:
- Player Reports: Join ${this.serverInfo.channels.waitingRoom} voice channel OR request ticket in ${this.serverInfo.channels.communitySupport}
- Ban Appeals: ONLY through ${this.serverInfo.banAppealForm} (takes 2-10 days)
- Technical Issues: Ask in ${this.serverInfo.channels.communitySupport} or contact staff through ${this.serverInfo.channels.waitingRoom}
- Game Crashes: Use ${this.serverInfo.channels.gameCrashes} ONLY to notify others during active scenes with proper format

CONVERSATION CONTEXT:
- User: ${context.userName}
- Server: ${context.guildName}
- ${context.isNewConversation ? 'This is a new conversation - acknowledge and help with their question' : 'Continue the ongoing conversation naturally'}

`;
  }

  findRelevantRules(userMessage, conversationHistory) {
    const keywords = this.extractKeywords(userMessage);
    const relevantRules = [];
    
    // Add keywords from recent conversation
    const recentMessages = conversationHistory.slice(-3);
    recentMessages.forEach(msg => {
      keywords.push(...this.extractKeywords(msg.content));
    });
    
    // Search for relevant rules
    for (const [code, rule] of this.parsedRules) {
      const ruleText = (rule.title + ' ' + rule.content).toLowerCase();
      
      if (keywords.some(keyword => ruleText.includes(keyword.toLowerCase()))) {
        relevantRules.push(rule);
      }
    }
    
    // Sort by relevance and return top results
    return relevantRules.slice(0, 5);
  }

  extractKeywords(text) {
    const keywords = [];
    
    // Look for rule codes
    const ruleCodes = text.match(/[cC]\d{2}\.?\d{0,2}/g);
    if (ruleCodes) {
      keywords.push(...ruleCodes);
    }
    
    // Extract contextual terms
    const contextTerms = [
      'roam', 'roaming', 'group', 'limit', 'people', 'crew', 'gang',
      'rob', 'robbery', 'steal', 'scam', 'violence', 'attack', 'kill',
      'meta', 'metagaming', 'power', 'powergaming', 'exploit', 'cheat',
      'character', 'roleplay', 'break', 'breaking', 'conduct',
      'police', 'cop', 'ems', 'government', 'law', 'enforcement',
      'ban', 'appeal', 'suspend', 'warn', 'infraction', 'violation',
      'report', 'ticket', 'staff', 'help', 'support', 'crash',
      'heist', 'fleeca', 'pacific', 'hostage', 'safe', 'zone',
      'restart', 'tsunami', 'cooldown', 'timer'
    ];
    
    const lowerText = text.toLowerCase();
    contextTerms.forEach(term => {
      if (lowerText.includes(term)) {
        keywords.push(term);
      }
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  buildRulesContext(relevantRules) {
    if (relevantRules.length === 0) {
      return '\n\nNo specific rules context found for this query.';
    }
    
    let context = '\n\nRELEVANT RULES FROM OFFICIAL DOCUMENTS:\n\n';
    
    relevantRules.forEach(rule => {
      context += `${rule.code} - ${rule.title}:\n`;
      context += `Section: ${rule.section}\n`;
      context += `Type: ${rule.type === 'community' ? 'Community Rule' : 'Crew Rule'}\n`;
      context += `Infractions: ${rule.infractions}\n`;
      context += `Description: ${rule.description}\n`;
      
      if (rule.examples.length > 0) {
        context += `Examples: ${rule.examples.slice(0, 2).join('; ')}\n`;
      }
      
      context += '\n---\n\n';
    });
    
    return context;
  }

  async quickRuleLookup(query) {
    const ruleCode = query.match(/[cC]\d{2}\.?\d{0,2}/);
    
    if (ruleCode) {
      const code = ruleCode[0].toUpperCase().replace(/(\d{2})(\d{2})/, '$1.$2');
      const rule = this.rulesByCode.get(code.toLowerCase());
      
      if (rule) {
        return {
          found: true,
          rule: {
            code: rule.code,
            title: rule.title,
            description: rule.description,
            section: rule.section,
            infractions: rule.infractions,
            examples: rule.examples,
            type: rule.type
          }
        };
      }
    }
    
    // Search by keywords if no direct code match
    const keywords = this.extractKeywords(query);
    for (const [code, rule] of this.parsedRules) {
      const ruleText = (rule.title + ' ' + rule.content).toLowerCase();
      
      if (keywords.some(keyword => ruleText.includes(keyword.toLowerCase()))) {
        return {
          found: true,
          rule: {
            code: rule.code,
            title: rule.title,
            description: rule.description,
            section: rule.section,
            infractions: rule.infractions,
            examples: rule.examples,
            type: rule.type
          }
        };
      }
    }
    
    return { found: false };
  }

  getErrorResponse(error) {
    if (error.code === 'insufficient_quota') {
      return 'I am temporarily unavailable due to API limits. Please contact staff directly in ' + this.serverInfo.channels.communitySupport + ' for assistance.';
    } else if (error.code === 'invalid_api_key') {
      return 'I am experiencing configuration issues. Please contact staff in ' + this.serverInfo.channels.communitySupport + ' for help.';
    } else if (error.status === 429) {
      return 'I am currently busy helping other community members. Please try asking your question again in a moment.';
    } else {
      return 'I am experiencing technical difficulties. You can try asking again, or contact staff directly in ' + this.serverInfo.channels.communitySupport + ' if you need immediate help.';
    }
  }

  async testOpenAIConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5
      });
      return true;
    } catch (error) {
      console.error('OpenAI Connection Test Failed:', error);
      return false;
    }
  }

  // Utility methods for diagnostics
  getRulesStats() {
    const communityRules = Array.from(this.parsedRules.values()).filter(r => r.type === 'community').length;
    const crewRules = Array.from(this.parsedRules.values()).filter(r => r.type === 'crew').length;
    
    return {
      totalRules: this.parsedRules.size,
      communityRules: communityRules,
      crewRules: crewRules,
      documentsLoaded: {
        community: this.communityRules.length > 0,
        crew: this.crewRules.length > 0
      }
    };
  }

  searchRules(searchTerm) {
    const results = [];
    const term = searchTerm.toLowerCase();
    
    for (const [code, rule] of this.parsedRules) {
      const ruleText = (rule.code + ' ' + rule.title + ' ' + rule.content).toLowerCase();
      
      if (ruleText.includes(term)) {
        results.push({
          code: rule.code,
          title: rule.title,
          type: rule.type,
          section: rule.section,
          relevance: this.calculateRelevance(ruleText, term)
        });
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, 10);
  }

  calculateRelevance(text, searchTerm) {
    const termCount = (text.match(new RegExp(searchTerm, 'g')) || []).length;
    const titleBonus = text.includes(searchTerm) && text.indexOf(searchTerm) < 100 ? 2 : 0;
    return termCount + titleBonus;
  }

  getRule(ruleCode) {
    const code = ruleCode.toUpperCase().replace(/[^C0-9.]/g, '');
    return this.rulesByCode.get(code.toLowerCase()) || null;
  }

  getAllRules() {
    return Array.from(this.parsedRules.values());
  }

  getRulesByType(type) {
    return Array.from(this.parsedRules.values()).filter(rule => rule.type === type);
  }

  getRulesBySection(sectionNumber) {
    return Array.from(this.parsedRules.values()).filter(rule => 
      rule.section && rule.section.startsWith(sectionNumber.toString())
    );
  }
}

module.exports = RulesHandler;