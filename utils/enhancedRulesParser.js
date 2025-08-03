const fs = require('fs');
const path = require('path');

class EnhancedRulesParser {
  constructor() {
    this.parsedRules = {
      community: new Map(),
      crew: new Map()
    };
    this.ruleCategories = new Map();
    this.conceptMap = new Map();
    this.relationshipGraph = new Map();
    this.infractionMatrix = new Map();
    
    this.initialize();
  }

  initialize() {
    try {
      this.loadAndParseRules();
      this.buildConceptMap();
      this.buildRelationshipGraph();
      this.buildInfractionMatrix();
      console.log('✅ Enhanced rules system initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize enhanced rules system:', error);
    }
  }

  loadAndParseRules() {
    // Load community rules
    const communityPath = path.join(__dirname, '..', 'rules', 'COMMUNITY REGULATORY GUIDELINES AND RULES.txt');
    const crewPath = path.join(__dirname, '..', 'rules', 'CREW REGULATORY GUIDELINES.txt');
    
    if (fs.existsSync(communityPath)) {
      const communityText = fs.readFileSync(communityPath, 'utf8');
      this.parseRulesDocument(communityText, 'community');
    }
    
    if (fs.existsSync(crewPath)) {
      const crewText = fs.readFileSync(crewPath, 'utf8');
      this.parseRulesDocument(crewText, 'crew');
    }
  }

  parseRulesDocument(text, type) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let currentSection = null;
    let currentRule = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Section detection
      if (line.match(/^SECTION\s+\d+\s*-\s*(.+):/)) {
        const sectionMatch = line.match(/^SECTION\s+(\d+)\s*-\s*(.+):/);
        if (sectionMatch) {
          currentSection = {
            number: parseInt(sectionMatch[1]),
            title: sectionMatch[2].trim(),
            rules: []
          };
        }
        continue;
      }

      // Rule code detection (C##.## format)
      const ruleMatch = line.match(/^([C]\d{2}\.\d{2})\s*-\s*(.+):/);
      if (ruleMatch) {
        // Save previous rule if exists
        if (currentRule) {
          this.processRule(currentRule, currentContent, currentSection, type);
        }

        // Start new rule
        currentRule = {
          code: ruleMatch[1],
          title: ruleMatch[2].trim(),
          section: currentSection
        };
        currentContent = [];
        continue;
      }

      // Infraction category detection
      if (line.match(/^Infraction Category:\s*\[.+\]/)) {
        const infractionMatch = line.match(/^Infraction Category:\s*\[(.+)\]/);
        if (infractionMatch && currentRule) {
          currentRule.infractions = this.parseInfractionSequence(infractionMatch[1]);
        }
        continue;
      }

      // Approval required detection
      if (line.match(/^Approval required:/)) {
        const approvalMatch = line.match(/^Approval required:\s*(.+)/);
        if (approvalMatch && currentRule) {
          currentRule.approvalRequired = approvalMatch[1].trim();
        }
        continue;
      }

      // General information
      if (line.match(/^General Information:/)) {
        const infoMatch = line.match(/^General Information:\s*(.+)/);
        if (infoMatch && currentRule) {
          currentContent.push(infoMatch[1]);
        }
        continue;
      }

      // Examples detection
      if (line.match(/^Examples? (of|are|include)/i) || line.match(/^Here are/)) {
        if (currentRule) {
          currentRule.hasExamples = true;
        }
      }

      // Continue collecting content
      if (currentRule && line && !line.match(/^[A-Z\s]+:$/)) {
        currentContent.push(line);
      }
    }

    // Process last rule
    if (currentRule) {
      this.processRule(currentRule, currentContent, currentSection, type);
    }
  }

  processRule(rule, content, section, type) {
    const fullContent = content.join(' ');
    
    // Enhanced rule object
    const processedRule = {
      code: rule.code,
      title: rule.title,
      section: section ? {
        number: section.number,
        title: section.title
      } : null,
      type: type,
      infractions: rule.infractions || [],
      approvalRequired: rule.approvalRequired || null,
      description: this.extractDescription(fullContent),
      examples: this.extractExamples(fullContent),
      keywords: this.extractKeywords(rule.title + ' ' + fullContent),
      severity: this.calculateSeverity(rule.infractions || []),
      relatedConcepts: this.identifyRelatedConcepts(rule.title + ' ' + fullContent),
      prohibitions: this.extractProhibitions(fullContent),
      requirements: this.extractRequirements(fullContent),
      consequences: this.extractConsequences(fullContent),
      context: this.extractContext(fullContent),
      fullText: fullContent
    };

    this.parsedRules[type].set(rule.code, processedRule);
    
    // Add to category mapping
    if (section) {
      if (!this.ruleCategories.has(section.title)) {
        this.ruleCategories.set(section.title, []);
      }
      this.ruleCategories.get(section.title).push(processedRule);
    }
  }

  parseInfractionSequence(sequenceStr) {
    const sequence = sequenceStr.split('>').map(s => s.trim());
    return sequence.map(infraction => {
      if (infraction.includes('+')) {
        return infraction.split('+').map(i => i.trim());
      }
      return infraction;
    });
  }

  extractDescription(content) {
    // Look for the main descriptive content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences[0]?.trim() || content.substring(0, 200);
  }

  extractExamples(content) {
    const examples = [];
    const lines = content.split(/[.\n]/).filter(line => line.trim());
    
    let inExamples = false;
    for (const line of lines) {
      if (line.match(/examples?.*(?:are|include|of)/i) || 
          line.match(/here are/i) || 
          line.match(/such as/i)) {
        inExamples = true;
        continue;
      }
      
      if (inExamples && line.trim().length > 5) {
        examples.push(line.trim());
      }
      
      // Stop collecting examples at certain patterns
      if (inExamples && (line.match(/^[A-Z\s]+:/) || line.length > 200)) {
        break;
      }
    }
    
    return examples.slice(0, 10); // Limit examples
  }

  extractKeywords(text) {
    const commonWords = new Set(['the', 'and', 'or', 'is', 'are', 'to', 'of', 'in', 'for', 'with', 'by', 'a', 'an']);
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    return [...new Set(words)]; // Remove duplicates
  }

  calculateSeverity(infractions) {
    if (!infractions.length) return 0;
    
    const severityMap = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6,
      'CR': 10, 'CD': 7, 'GB': 8, 'SI': 9
    };
    
    const maxSeverity = Math.max(...infractions.flat().map(inf => severityMap[inf] || 0));
    return maxSeverity;
  }

  identifyRelatedConcepts(text) {
    const concepts = [];
    const lowerText = text.toLowerCase();
    
    // Concept patterns
    const conceptPatterns = {
      'character_conduct': ['character', 'roleplay', 'immersion', 'acting'],
      'violence': ['violence', 'killing', 'shooting', 'attacking', 'harming'],
      'communication': ['discord', 'external', 'teamspeak', 'communication'],
      'economy': ['money', 'currency', 'trading', 'scamming', 'robbery'],
      'government': ['police', 'ems', 'government', 'law enforcement'],
      'groups': ['crew', 'gang', 'group', 'roaming', 'alliance'],
      'technical': ['exploit', 'cheat', 'mod', 'bug', 'client'],
      'timeouts': ['restart', 'tsunami', 'cooldown', 'timer'],
      'locations': ['safe zone', 'hospital', 'apartment', 'protected']
    };
    
    for (const [concept, patterns] of Object.entries(conceptPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        concepts.push(concept);
      }
    }
    
    return concepts;
  }

  extractProhibitions(content) {
    const prohibitions = [];
    const lines = content.split(/[.!]/).filter(line => line.trim());
    
    const prohibitionPatterns = [
      /(?:is\s+)?(?:not\s+)?(?:permitted|allowed|acceptable)/i,
      /(?:cannot|can't|must not|should not|shall not)/i,
      /prohibited|forbidden|banned|restricted/i,
      /avoid\s+(?:doing|engaging)/i
    ];
    
    for (const line of lines) {
      if (prohibitionPatterns.some(pattern => pattern.test(line))) {
        prohibitions.push(line.trim());
      }
    }
    
    return prohibitions.slice(0, 5);
  }

  extractRequirements(content) {
    const requirements = [];
    const lines = content.split(/[.!]/).filter(line => line.trim());
    
    const requirementPatterns = [
      /(?:must|required to|expected to|mandated to)/i,
      /(?:shall|should|ought to)/i,
      /(?:minimum|maximum).*(?:of|is)/i
    ];
    
    for (const line of lines) {
      if (requirementPatterns.some(pattern => pattern.test(line))) {
        requirements.push(line.trim());
      }
    }
    
    return requirements.slice(0, 5);
  }

  extractConsequences(content) {
    const consequences = [];
    const lines = content.split(/[.!]/).filter(line => line.trim());
    
    const consequencePatterns = [
      /(?:will result in|leads? to|results? in)/i,
      /(?:consequence|punishment|penalty)/i,
      /(?:suspension|ban|removal|deletion)/i
    ];
    
    for (const line of lines) {
      if (consequencePatterns.some(pattern => pattern.test(line))) {
        consequences.push(line.trim());
      }
    }
    
    return consequences.slice(0, 3);
  }

  extractContext(content) {
    // Extract contextual information about when/where the rule applies
    const contexts = [];
    const lowerContent = content.toLowerCase();
    
    const contextPatterns = {
      'during_conflicts': ['during.*conflict', 'active.*engagement', 'hostile.*interaction'],
      'in_roleplay': ['within roleplay', 'in character', 'during.*scene'],
      'with_government': ['law enforcement', 'government.*employee', 'ems.*personnel'],
      'crew_activities': ['crew.*activity', 'gang.*related', 'crew.*member'],
      'public_areas': ['public.*area', 'safe.*zone', 'neutral.*ground'],
      'restart_times': ['before.*restart', 'after.*tsunami', 'server.*restart']
    };
    
    for (const [context, patterns] of Object.entries(contextPatterns)) {
      if (patterns.some(pattern => new RegExp(pattern).test(lowerContent))) {
        contexts.push(context);
      }
    }
    
    return contexts;
  }

  buildConceptMap() {
    // Build a comprehensive concept map for better understanding
    this.conceptMap.clear();
    
    const allRules = [...this.parsedRules.community.values(), ...this.parsedRules.crew.values()];
    
    for (const rule of allRules) {
      for (const concept of rule.relatedConcepts) {
        if (!this.conceptMap.has(concept)) {
          this.conceptMap.set(concept, []);
        }
        this.conceptMap.get(concept).push(rule);
      }
      
      // Also map by keywords
      for (const keyword of rule.keywords) {
        if (!this.conceptMap.has(keyword)) {
          this.conceptMap.set(keyword, []);
        }
        this.conceptMap.get(keyword).push(rule);
      }
    }
  }

  buildRelationshipGraph() {
    // Build relationships between rules
    this.relationshipGraph.clear();
    
    const allRules = [...this.parsedRules.community.values(), ...this.parsedRules.crew.values()];
    
    for (const rule of allRules) {
      this.relationshipGraph.set(rule.code, {
        rule: rule,
        related: [],
        conflicts: [],
        prerequisites: [],
        consequences: []
      });
    }
    
    // Find relationships
    for (const rule of allRules) {
      const relationships = this.relationshipGraph.get(rule.code);
      
      for (const otherRule of allRules) {
        if (rule.code === otherRule.code) continue;
        
        // Check for concept overlap
        const sharedConcepts = rule.relatedConcepts.filter(c => 
          otherRule.relatedConcepts.includes(c)
        );
        
        if (sharedConcepts.length > 0) {
          relationships.related.push({
            rule: otherRule,
            connection: sharedConcepts,
            strength: sharedConcepts.length
          });
        }
        
        // Check for keyword overlap
        const sharedKeywords = rule.keywords.filter(k => 
          otherRule.keywords.includes(k)
        );
        
        if (sharedKeywords.length > 1) {
          relationships.related.push({
            rule: otherRule,
            connection: sharedKeywords,
            strength: sharedKeywords.length * 0.5
          });
        }
      }
      
      // Sort by relationship strength
      relationships.related.sort((a, b) => b.strength - a.strength);
      relationships.related = relationships.related.slice(0, 5); // Top 5 related rules
    }
  }

  buildInfractionMatrix() {
    // Build comprehensive infraction understanding
    this.infractionMatrix.clear();
    
    const infractionInfo = {
      'A': { 
        name: 'Warning/1 Day', 
        points: 5, 
        duration: '1 day suspension or warning', 
        expires: '3 months',
        severity: 'Minor',
        description: 'Light disciplinary action for minor violations'
      },
      'B': { 
        name: '3 Day Suspension', 
        points: 10, 
        duration: '3 day suspension or warning', 
        expires: '6 months',
        severity: 'Low',
        description: 'Short suspension for repeated minor or moderate violations'
      },
      'C': { 
        name: '5 Day Suspension', 
        points: 15, 
        duration: '5 day suspension or warning', 
        expires: '6 months',
        severity: 'Moderate',
        description: 'Medium suspension for serious rule violations'
      },
      'D': { 
        name: '7 Day Suspension', 
        points: 20, 
        duration: '7 day suspension', 
        expires: '12 months',
        severity: 'High',
        description: 'Week-long suspension for major violations'
      },
      'E': { 
        name: '14 Day Suspension', 
        points: 25, 
        duration: '14 day suspension', 
        expires: '12 months',
        severity: 'Severe',
        description: 'Two-week suspension for very serious violations'
      },
      'F': { 
        name: 'Permanent Ban', 
        points: 50, 
        duration: 'Appealable permanent ban', 
        expires: 'Never',
        severity: 'Critical',
        description: 'Permanent ban with appeal option for extreme violations'
      },
      'CR': { 
        name: 'Community Removal', 
        points: null, 
        duration: 'Indefinite removal without appeal', 
        expires: 'Never',
        severity: 'Terminal',
        description: 'Permanent removal from community with no appeal process'
      },
      'CD': { 
        name: 'Character Deletion', 
        points: null, 
        duration: 'Character(s) deleted', 
        expires: 'N/A',
        severity: 'Asset Loss',
        description: 'Removal of character(s) for economic violations'
      },
      'GB': { 
        name: 'Government Blacklist', 
        points: null, 
        duration: 'Permanent government job ban', 
        expires: 'Never',
        severity: 'Role Restriction',
        description: 'Permanent ban from all government positions'
      },
      'SI': { 
        name: 'Specialized Instance', 
        points: null, 
        duration: '31+ day suspension', 
        expires: 'Varies',
        severity: 'Variable',
        description: 'Custom punishment for unique situations'
      }
    };
    
    for (const [code, info] of Object.entries(infractionInfo)) {
      this.infractionMatrix.set(code, info);
    }
  }

  // Enhanced search methods
  intelligentSearch(query, options = {}) {
    const {
      includeRelated = true,
      conceptWeight = 1.0,
      keywordWeight = 0.8,
      titleWeight = 1.2,
      exactMatch = false
    } = options;

    const results = new Map();
    const queryLower = query.toLowerCase();
    const queryWords = this.extractKeywords(query);

    // Search all rules
    const allRules = [...this.parsedRules.community.values(), ...this.parsedRules.crew.values()];

    for (const rule of allRules) {
      let score = 0;

      // Exact code match
      if (rule.code.toLowerCase() === queryLower) {
        score += 100;
      }

      // Title matching
      if (rule.title.toLowerCase().includes(queryLower)) {
        score += titleWeight * 50;
      }

      // Keyword matching
      const matchingKeywords = rule.keywords.filter(keyword => 
        queryWords.some(qw => keyword.includes(qw) || qw.includes(keyword))
      );
      score += matchingKeywords.length * keywordWeight * 10;

      // Concept matching
      const conceptMatches = rule.relatedConcepts.filter(concept =>
        queryWords.some(qw => concept.includes(qw) || qw.includes(concept))
      );
      score += conceptMatches.length * conceptWeight * 15;

      // Description/content matching
      if (rule.description.toLowerCase().includes(queryLower)) {
        score += 20;
      }

      // Examples matching
      const exampleMatches = rule.examples.filter(example =>
        example.toLowerCase().includes(queryLower)
      );
      score += exampleMatches.length * 25;

      if (score > 0) {
        results.set(rule.code, { rule, score, matchType: this.getMatchType(rule, queryLower, queryWords) });
      }
    }

    // Convert to sorted array
    const sortedResults = Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Add related rules if requested
    if (includeRelated && sortedResults.length > 0) {
      const topResult = sortedResults[0];
      const related = this.getRelatedRules(topResult.rule.code, 3);
      
      return {
        primary: sortedResults,
        related: related,
        searchMeta: {
          query: query,
          totalFound: results.size,
          concepts: this.identifyRelatedConcepts(query)
        }
      };
    }

    return {
      primary: sortedResults,
      related: [],
      searchMeta: {
        query: query,
        totalFound: results.size,
        concepts: this.identifyRelatedConcepts(query)
      }
    };
  }

  getMatchType(rule, queryLower, queryWords) {
    if (rule.code.toLowerCase() === queryLower) return 'exact_code';
    if (rule.title.toLowerCase().includes(queryLower)) return 'title';
    if (rule.relatedConcepts.some(c => queryWords.includes(c))) return 'concept';
    if (rule.keywords.some(k => queryWords.includes(k))) return 'keyword';
    if (rule.examples.some(e => e.toLowerCase().includes(queryLower))) return 'example';
    return 'content';
  }

  getRelatedRules(ruleCode, limit = 5) {
    const relationships = this.relationshipGraph.get(ruleCode);
    if (!relationships) return [];

    return relationships.related
      .slice(0, limit)
      .map(rel => ({
        rule: rel.rule,
        connection: rel.connection,
        strength: rel.strength
      }));
  }

  getConceptualContext(concepts) {
    const context = [];
    
    for (const concept of concepts) {
      const relatedRules = this.conceptMap.get(concept) || [];
      if (relatedRules.length > 0) {
        context.push({
          concept: concept,
          rules: relatedRules.slice(0, 3),
          ruleCount: relatedRules.length
        });
      }
    }
    
    return context;
  }

  generateRuleExplanation(ruleCode, includeContext = true) {
    const rule = this.getRule(ruleCode);
    if (!rule) return null;

    const infractions = rule.infractions.flat().map(inf => 
      this.infractionMatrix.get(inf)
    ).filter(Boolean);

    const related = this.getRelatedRules(ruleCode, 3);

    return {
      rule: rule,
      infractions: infractions,
      related: related,
      conceptualContext: includeContext ? this.getConceptualContext(rule.relatedConcepts) : null,
      explanation: this.buildNaturalExplanation(rule, infractions, related)
    };
  }

  buildNaturalExplanation(rule, infractions, related) {
    let explanation = `${rule.code} - ${rule.title}:\n\n`;
    explanation += `${rule.description}\n\n`;

    if (rule.prohibitions.length > 0) {
      explanation += `What's Not Allowed:\n`;
      rule.prohibitions.forEach(prohibition => {
        explanation += `• ${prohibition}\n`;
      });
      explanation += '\n';
    }

    if (rule.requirements.length > 0) {
      explanation += `Requirements:\n`;
      rule.requirements.forEach(requirement => {
        explanation += `• ${requirement}\n`;
      });
      explanation += '\n';
    }

    if (rule.examples.length > 0) {
      explanation += `Examples:\n`;
      rule.examples.forEach(example => {
        explanation += `• ${example}\n`;
      });
      explanation += '\n';
    }

    if (infractions.length > 0) {
      explanation += `Consequences:\n`;
      infractions.forEach(infraction => {
        explanation += `• ${infraction.name}: ${infraction.description}\n`;
      });
      explanation += '\n';
    }

    if (related.length > 0) {
      explanation += `Related Rules:\n`;
      related.forEach(rel => {
        explanation += `• ${rel.rule.code} - ${rel.rule.title}\n`;
      });
    }

    return explanation;
  }

  getRule(ruleCode) {
    const upperCode = ruleCode.toUpperCase();
    return this.parsedRules.community.get(upperCode) || this.parsedRules.crew.get(upperCode);
  }

  getAllRules() {
    return {
      community: Array.from(this.parsedRules.community.values()),
      crew: Array.from(this.parsedRules.crew.values())
    };
  }

  getStats() {
    return {
      totalRules: this.parsedRules.community.size + this.parsedRules.crew.size,
      communityRules: this.parsedRules.community.size,
      crewRules: this.parsedRules.crew.size,
      concepts: this.conceptMap.size,
      categories: this.ruleCategories.size,
      relationships: this.relationshipGraph.size
    };
  }
}

module.exports = new EnhancedRulesParser();