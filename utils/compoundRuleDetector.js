// utils/compoundRuleDetector.js - Detects multiple rule violations in single scenarios

class CompoundRuleDetector {
  constructor() {
    // Define compound violation patterns
    this.compoundPatterns = {
      'vehicle_water_dumping': {
        keywords: ['dump', 'water', 'ocean', 'car', 'vehicle', 'impound'],
        rules: [
          {
            code: 'C07.05',
            title: 'POWER GAMING',
            reasoning: 'Disposing of vehicle in water to avoid consequences'
          },
          {
            code: 'C05.01', 
            title: 'LAW ENFORCEMENT INTERACTIONS',
            reasoning: 'Avoiding law enforcement through unrealistic means'
          }
        ],
        judgment: 'MULTIPLE VIOLATIONS'
      },

      'meta_gaming_revenge': {
        keywords: ['discord', 'stream', 'revenge', 'retaliate', 'external'],
        rules: [
          {
            code: 'C07.03',
            title: 'META GAMING & EXTERNAL INFORMATION', 
            reasoning: 'Using external information sources'
          },
          {
            code: 'C02.01',
            title: 'EXTERNAL TARGETING & COMMUNICATION',
            reasoning: 'Taking roleplay conflicts outside of character'
          }
        ],
        judgment: 'MULTIPLE VIOLATIONS'
      },

      'toxic_rdm': {
        keywords: ['kill', 'random', 'toxic', 'excessive', 'no reason'],
        rules: [
          {
            code: 'C09.02',
            title: 'RANDOM DEATH MATCH',
            reasoning: 'Killing without proper roleplay initiation'
          },
          {
            code: 'C03.03', 
            title: 'EXCESSIVE TOXICITY',
            reasoning: 'Behavior intended to cause harm and disturbance'
          }
        ],
        judgment: 'MULTIPLE VIOLATIONS'
      },

      'vdm_toxicity': {
        keywords: ['vehicle', 'running over', 'downed', 'repeatedly'],
        rules: [
          {
            code: 'C09.01',
            title: 'VEHICLE DEATH MATCH',
            reasoning: 'Using vehicle as weapon against others'
          },
          {
            code: 'C03.03',
            title: 'EXCESSIVE TOXICITY', 
            reasoning: 'Repeatedly running over downed bodies'
          }
        ],
        judgment: 'MULTIPLE VIOLATIONS'
      },

      'combat_logging_vdm': {
        keywords: ['disconnect', 'crash', 'chase', 'pursuit', 'log'],
        rules: [
          {
            code: 'C07.06',
            title: 'COMBAT LOGGING',
            reasoning: 'Disconnecting during active scene'
          },
          {
            code: 'C05.01',
            title: 'LAW ENFORCEMENT INTERACTIONS',
            reasoning: 'Avoiding law enforcement interaction'
          }
        ],
        judgment: 'MULTIPLE VIOLATIONS'
      },

      'exploiting_economy': {
        keywords: ['exploit', 'money', 'dupe', 'economy', 'advantage'],
        rules: [
          {
            code: 'C07.07',
            title: 'EXPLOITING',
            reasoning: 'Taking advantage of unintended server features'
          },
          {
            code: 'C07.02',
            title: 'CURRENCY & ITEM EXCHANGING',
            reasoning: 'Gaining unintended economic advantage'
          }
        ],
        judgment: 'MULTIPLE VIOLATIONS'
      },

      'government_corruption_power': {
        keywords: ['government', 'abuse', 'power', 'corrupt', 'equipment'],
        rules: [
          {
            code: 'C05.04',
            title: 'GOVERNMENT CORRUPTION',
            reasoning: 'Abusing government powers and equipment'
          },
          {
            code: 'C07.05',
            title: 'POWER GAMING',
            reasoning: 'Forcing roleplay through authority abuse'
          }
        ],
        judgment: 'MULTIPLE VIOLATIONS'
      }
    };

    // Track compound violations for analysis
    this.detectedCompounds = [];
  }

  detectCompoundViolations(scenario, context = {}) {
    const lowerScenario = scenario.toLowerCase();
    const detectedCompounds = [];

    // Check each compound pattern
    for (const [patternName, pattern] of Object.entries(this.compoundPatterns)) {
      const keywordMatches = pattern.keywords.filter(keyword => 
        lowerScenario.includes(keyword.toLowerCase())
      );

      // Require at least 2 keyword matches for compound detection
      if (keywordMatches.length >= 2) {
        const compound = {
          patternName,
          judgment: pattern.judgment,
          rules: pattern.rules,
          matchedKeywords: keywordMatches,
          confidence: Math.min(100, (keywordMatches.length / pattern.keywords.length) * 100),
          scenario: scenario.substring(0, 200)
        };

        detectedCompounds.push(compound);
      }
    }

    // Sort by confidence and return best matches
    detectedCompounds.sort((a, b) => b.confidence - a.confidence);

    // Log detection for analysis
    if (detectedCompounds.length > 0) {
      this.detectedCompounds.push({
        timestamp: Date.now(),
        scenario: scenario.substring(0, 100),
        compounds: detectedCompounds.length,
        topMatch: detectedCompounds[0].patternName
      });
    }

    return detectedCompounds.slice(0, 2); // Return top 2 matches
  }

  generateCompoundResponse(compounds) {
    if (!compounds || compounds.length === 0) return null;

    let response = `**MULTIPLE VIOLATIONS DETECTED**\n\n`;
    
    compounds.forEach((compound, index) => {
      response += `**Violation ${index + 1}:**\n`;
      compound.rules.forEach(rule => {
        response += `• **${rule.code} - ${rule.title}**: ${rule.reasoning}\n`;
      });
      response += `\n`;
    });

    // Add infraction guidance
    response += `**Consequences:** Multiple rule violations result in escalated infractions. `;
    response += `Each rule violation is processed separately, leading to cumulative infraction points.\n\n`;
    
    response += `**Recommendation:** Contact staff immediately for clarification on compound violations.`;

    return response;
  }

  // Check for rule relationships
  findRuleRelationships(ruleCode1, ruleCode2) {
    const relationships = {
      'C07.05_C05.01': 'Power gaming often involves avoiding law enforcement',
      'C09.01_C03.03': 'VDM frequently escalates to excessive toxicity',
      'C07.03_C02.01': 'Meta gaming and external targeting often occur together',
      'C07.06_C05.01': 'Combat logging commonly occurs during police interactions',
      'C05.04_C07.05': 'Government corruption typically involves power gaming elements'
    };

    const relationshipKey = `${ruleCode1}_${ruleCode2}`;
    const reverseKey = `${ruleCode2}_${ruleCode1}`;

    return relationships[relationshipKey] || relationships[reverseKey] || null;
  }

  // Enhanced detection with context from previous messages
  detectWithContext(scenario, conversationContext) {
    const baseDetection = this.detectCompoundViolations(scenario);
    
    if (conversationContext && conversationContext.mentionedRules.length > 1) {
      // Check if previously mentioned rules form a compound violation
      const recentRules = conversationContext.mentionedRules.slice(-3);
      
      for (let i = 0; i < recentRules.length - 1; i++) {
        const relationship = this.findRuleRelationships(recentRules[i], recentRules[i + 1]);
        if (relationship) {
          baseDetection.push({
            patternName: 'contextual_compound',
            judgment: 'RELATED VIOLATIONS',
            rules: [
              { code: recentRules[i], title: 'Previously Discussed', reasoning: relationship },
              { code: recentRules[i + 1], title: 'Currently Discussed', reasoning: 'Related violation pattern' }
            ],
            matchedKeywords: ['context', 'related'],
            confidence: 75,
            scenario: scenario.substring(0, 200)
          });
        }
      }
    }

    return baseDetection;
  }

  // Generate statistics for admin use
  getDetectionStats() {
    const now = Date.now();
    const last24Hours = this.detectedCompounds.filter(d => now - d.timestamp < 24 * 60 * 60 * 1000);
    
    const patternCounts = {};
    last24Hours.forEach(detection => {
      patternCounts[detection.topMatch] = (patternCounts[detection.topMatch] || 0) + 1;
    });

    return {
      total_detected: this.detectedCompounds.length,
      last_24_hours: last24Hours.length,
      top_patterns: Object.entries(patternCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      detection_rate: this.detectedCompounds.length > 0 ? 
        (last24Hours.length / this.detectedCompounds.length * 100).toFixed(1) + '%' : '0%'
    };
  }

  // Clear old detection data
  clearOldDetections(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoff = Date.now() - maxAge;
    this.detectedCompounds = this.detectedCompounds.filter(d => d.timestamp > cutoff);
  }
}

module.exports = new CompoundRuleDetector();