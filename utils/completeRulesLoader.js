const fs = require('fs');
const path = require('path');

class CompleteRulesLoader {
  constructor() {
    this.communityRules = '';
    this.crewRules = '';
    this.loadRules();
  }

  loadRules() {
    try {
      // Load the complete community rules document
      const communityRulesPath = path.join(__dirname, '..', 'rules', 'COMMUNITY REGULATORY GUIDELINES AND RULES.txt');
      if (fs.existsSync(communityRulesPath)) {
        this.communityRules = fs.readFileSync(communityRulesPath, 'utf8');
        console.log('✅ Loaded complete community rules document');
      } else {
        console.log('⚠️ Community rules file not found, using embedded rules');
        this.communityRules = this.getEmbeddedCommunityRules();
      }

      // Load the complete crew rules document  
      const crewRulesPath = path.join(__dirname, '..', 'rules', 'CREW REGULATORY GUIDELINES.txt');
      if (fs.existsSync(crewRulesPath)) {
        this.crewRules = fs.readFileSync(crewRulesPath, 'utf8');
        console.log('✅ Loaded complete crew rules document');
      } else {
        console.log('⚠️ Crew rules file not found, using embedded rules');
        this.crewRules = this.getEmbeddedCrewRules();
      }
    } catch (error) {
      console.error('❌ Error loading rules files:', error);
      console.log('📋 Using embedded rules as fallback');
      this.communityRules = this.getEmbeddedCommunityRules();
      this.crewRules = this.getEmbeddedCrewRules();
    }
  }

  searchRules(searchTerm) {
    const results = [];
    const term = searchTerm.toLowerCase();
    
    // Search in community rules
    const communityMatches = this.searchInText(this.communityRules, term, 'community');
    results.push(...communityMatches);
    
    // Search in crew rules
    const crewMatches = this.searchInText(this.crewRules, term, 'crew');
    results.push(...crewMatches);
    
    return results.slice(0, 10); // Limit results
  }

  searchInText(text, searchTerm, type) {
    const results = [];
    const lines = text.split('\n');
    
    // Look for rule sections (pattern: C##.## or similar)
    const rulePattern = /^([C][0-9]{2}\.[0-9]{2})\s*-\s*(.+):/;
    
    let currentRule = null;
    let currentContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const ruleMatch = line.match(rulePattern);
      
      if (ruleMatch) {
        // Process previous rule if it matches search term
        if (currentRule && this.ruleMatchesSearch(currentRule, currentContent, searchTerm)) {
          results.push({
            code: currentRule.code,
            title: currentRule.title,
            content: currentContent.join('\n'),
            type: type
          });
        }
        
        // Start new rule
        currentRule = {
          code: ruleMatch[1],
          title: ruleMatch[2]
        };
        currentContent = [line];
      } else if (currentRule && line) {
        currentContent.push(line);
        
        // Stop at next section header to avoid bleeding into other rules
        if (line.match(/^SECTION\s+\d+/)) {
          break;
        }
      }
    }
    
    // Process last rule
    if (currentRule && this.ruleMatchesSearch(currentRule, currentContent, searchTerm)) {
      results.push({
        code: currentRule.code,
        title: currentRule.title,
        content: currentContent.join('\n'),
        type: type
      });
    }
    
    return results;
  }

  ruleMatchesSearch(rule, content, searchTerm) {
    const searchText = (rule.code + ' ' + rule.title + ' ' + content.join(' ')).toLowerCase();
    return searchText.includes(searchTerm.toLowerCase());
  }

  getRule(ruleCode) {
    const upperCode = ruleCode.toUpperCase();
    
    // Search for specific rule in community rules
    const communityRule = this.findSpecificRule(this.communityRules, upperCode, 'community');
    if (communityRule) return communityRule;
    
    // Search for specific rule in crew rules
    const crewRule = this.findSpecificRule(this.crewRules, upperCode, 'crew');
    if (crewRule) return crewRule;
    
    return null;
  }

  findSpecificRule(text, ruleCode, type) {
    const lines = text.split('\n');
    const rulePattern = new RegExp(`^${ruleCode}\\s*-\\s*(.+):`);
    
    let currentContent = [];
    let foundRule = false;
    let title = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const ruleMatch = line.match(rulePattern);
      
      if (ruleMatch) {
        foundRule = true;
        title = ruleMatch[1];
        currentContent = [line];
      } else if (foundRule) {
        // Check if we've hit the next rule (stop collecting)
        if (line.match(/^[C][0-9]{2}\.[0-9]{2}\s*-/)) {
          break;
        }
        if (line) {
          currentContent.push(line);
        }
      }
    }
    
    if (foundRule) {
      return {
        code: ruleCode,
        title: title,
        content: currentContent.join('\n'),
        type: type
      };
    }
    
    return null;
  }

  getCompleteRulesContext(searchTerms) {
    if (!this.communityRules && !this.crewRules) {
      return 'ERROR: No rule files loaded. Cannot provide accurate rule information.';
    }

    const relevantRules = [];
    
    searchTerms.forEach(term => {
      const results = this.searchRules(term);
      results.slice(0, 2).forEach(rule => {
        if (!relevantRules.find(r => r.code === rule.code)) {
          relevantRules.push(rule);
        }
      });
    });
    
    return relevantRules.slice(0, 3).map(rule => 
      `${rule.code} - ${rule.title}:\n${rule.content}`
    ).join('\n\n---\n\n');
  }

  // Placeholder methods - you'll need to implement these with your actual embedded rules
  getEmbeddedCommunityRules() {
    return `
SECTION 1: COMMUNITY GUIDELINES
C01.01 - Respectful Communication:
All members must communicate respectfully with others at all times.

C01.02 - No Harassment:
Harassment of any kind is strictly prohibited.

SECTION 2: GAMEPLAY RULES
C02.01 - Roleplay Standards:
Maintain character at all times during roleplay scenarios.

C02.02 - Metagaming:
Using out-of-character information in-character is prohibited.

C02.03 - Power Gaming:
Forcing roleplay scenarios without allowing others to respond is not allowed.
    `.trim();
  }

  getEmbeddedCrewRules() {
    return `
SECTION 1: CREW RESPONSIBILITIES
CR01.01 - Professional Conduct:
Crew members must maintain professional behavior at all times.

CR01.02 - Confidentiality:
Crew information and discussions must remain confidential.

SECTION 2: ADMINISTRATIVE DUTIES
CR02.01 - Fair Enforcement:
Rules must be enforced fairly and consistently across all players.

CR02.02 - Documentation:
All administrative actions must be properly documented.
    `.trim();
  }
}

module.exports = new CompleteRulesLoader();