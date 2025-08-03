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
      // Load the complete community rules document - FIXED FILE NAME
      const communityRulesPath = path.join(__dirname, '..', 'rules', 'COMMUNITY REGULATORY GUIDELINES AND RULES.txt');
      if (fs.existsSync(communityRulesPath)) {
        this.communityRules = fs.readFileSync(communityRulesPath, 'utf8');
        console.log('✅ Loaded complete community rules document');
      } else {
        console.log('⚠️ Community rules file not found, using embedded rules');
        this.communityRules = this.getEmbeddedCommunityRules();
      }

      // Load the complete crew rules document - FIXED FILE NAME  
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
      } else if (currentRule && !line) {
        // Empty line - check if next non-empty line is a new rule or section
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) {
          j++;
        }
        if (j < lines.length) {
          const nextLine = lines[j].trim();
          if (nextLine.match(rulePattern) || nextLine.startsWith('SECTION ')) {
            // End of current rule
            if (this.ruleMatchesSearch(currentRule, currentContent, searchTerm)) {
              results.push({
                code: currentRule.code,
                title: currentRule.title,
                content: currentContent.join('\n'),
                type: type
              });
            }
            currentRule = null;
            currentContent = [];
          }
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
        // Check if we've hit the next rule or section (stop collecting)
        if (line.match(/^[C][0-9]{2}\.[0-9]{2}\s*-/) || line.startsWith('SECTION ')) {
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
    const relevantRules = [];
    const ruleScores = new Map(); // Track rule relevance scores
    
    searchTerms.forEach(term => {
      const results = this.searchRules(term);
      results.forEach(rule => {
        if (!relevantRules.find(r => r.code === rule.code)) {
          relevantRules.push(rule);
          ruleScores.set(rule.code, 1);
        } else {
          // Increase score for rules found multiple times
          ruleScores.set(rule.code, ruleScores.get(rule.code) + 1);
        }
      });
    });
    
    // Sort by relevance score and prioritize general conduct rules over government-specific ones
    relevantRules.sort((a, b) => {
      const scoreA = ruleScores.get(a.code);
      const scoreB = ruleScores.get(b.code);
      
      // Deprioritize government-specific rules (C05.xx) unless specifically about government
      const isGovA = a.code.startsWith('C05');
      const isGovB = b.code.startsWith('C05');
      
      if (isGovA && !isGovB) return 1; // B comes first
      if (!isGovA && isGovB) return -1; // A comes first
      
      // Otherwise sort by score
      return scoreB - scoreA;
    });
    
    return relevantRules.slice(0, 4).map(rule => 
      `${rule.code} - ${rule.title}:\n${rule.content}`
    ).join('\n\n---\n\n');
  }

  // CORRECTED embedded rules with ACTUAL content from your documents
  getEmbeddedCommunityRules() {
    return `LUCID CITY ROLEPLAY
COMMUNITY REGULATORY GUIDELINES

SECTION 06 - ROBBERY & ROAMING GUIDELINES:

C06.01 - PLAYER ROAMING LIMITATIONS:
Infraction Category: [A > B > C > D > E]
General Information: Players which are not affiliated through membership to a crew is permitted to roam in groups of up to 6 individuals at a time. This is applicable to generalized roaming as well as participation in heists and other interactions which involve law enforcement officers. Furthermore, this policy applies to crew affiliated persons should it involve law enforcement.

[... other rules ...]`;
  }

  getEmbeddedCrewRules() {
    return `LUCID CITY ROLEPLAY
CREW REGULATORY GUIDELINES

SECTION 11 - CREW ROAMING GUIDELINES:

C11.01 - ROAMING LIMITATIONS:
Infraction Category: [B > E]
General Information: As members of a crew you are allocated additional roaming slots as crews should be a force to be reckoned with. The standard roaming limitation for members is 6, but for a crew it is 16 individuals. However, this limitation is 6 should you encounter any interaction with law enforcement officers. Crews are also permitted to have their full roster present during any turf contests.

[... other rules ...]`;
  }
}

module.exports = new CompleteRulesLoader();