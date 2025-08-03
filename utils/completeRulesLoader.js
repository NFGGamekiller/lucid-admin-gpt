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
      const communityRulesPath = path.join(__dirname, '..', 'rules', 'COMMUNITY_REGULATORY_GUIDELINES_AND_RULES.txt');
      if (fs.existsSync(communityRulesPath)) {
        this.communityRules = fs.readFileSync(communityRulesPath, 'utf8');
        console.log('✅ Loaded complete community rules document');
      } else {
        console.log('⚠️ Community rules file not found, using embedded rules');
        this.communityRules = this.getEmbeddedCommunityRules();
      }

      // Load the complete crew rules document  
      const crewRulesPath = path.join(__dirname, '..', 'rules', 'CREW_REGULATORY_GUIDELINES.txt');
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

  // Embedded rules as fallback (your current rules from the documents)
  getEmbeddedCommunityRules() {
    return `LUCID CITY ROLEPLAY
COMMUNITY REGULATORY GUIDELINES

SECTION 01 - PAGE INFORMATION:

C01.01 - JURISDICTIONS:
General Information: These are the official community regulatory guidelines of the Lucid City roleplay public server. These regulatory guidelines dictate and set forth the expectations for the players of the public server. These guidelines are applicable to the public game server, forums, and any affiliated servers with the following classifications:
Crew Management servers
Event Management servers
Official Government servers
Business Management servers

C01.02 - CORRECTIVE ACTION:
General Information: Conduct that has been deemed inappropriate, destructive, malicious, and/or unfitting within the Lucid City roleplay community will be handled in accordance with the standard and crew regulatory guidelines. Repeatedly engaging in this kind of conduct will result in actions ranging from a permanent ban to a community removal.

C01.03 - INFRACTION CLASSIFICATIONS:
General Information: Regulatory guidelines are marked with specific classifications to set forth the severity and impact of any infractions related to the specific guideline. These classifications determine the actions which will be taken against any individual and crew that is in direct violation of one or several guidelines. The maximum amount of infraction points an individual can reach prior to a community removal infraction is 125. These classifications are as follows:

STANDARD INFRACTION GUIDELINES:
Classification A: An infraction that consists of either a 1 day suspension from Lucid City community servers or a written warning. Receiving this infraction comes with 5 infraction points which will be added to your record, they expire from your record after 3 months.
Classification B: An infraction that consists of either a 3 day suspension from Lucid City community servers or a written warning. Receiving this infraction comes with 10 infraction points which will be added to your record, they expire from your record after 6 months.
Classification C: An infraction that consists of either a 5 day suspension from Lucid City community servers or a written warning. Receiving this infraction comes with 15 infraction points which will be added to your record, they expire from your record after 6 months.
Classification D: An infraction that consists of a 7 day suspension from Lucid City community servers. Receiving this infraction comes with 20 infraction points which will be added to your record, they expire from your record after 12 months.
Classification E: An infraction that consists of a 14 day suspension from Lucid City community servers. Receiving this infraction comes with 25 infraction points which will be added to your record, they expire from your record after 12 months.
Classification F: An infraction that consists of an appealable but permanent suspension from Lucid City community servers. Receiving this infraction comes with 50 infraction points which will be added to your record, these infraction points do not expire whatsoever.

SPECIALIZED INFRACTION GUIDELINES:
Community Removal (CR): An infraction that is issued upon an individual that has surpassed the infraction point maximum by Lucid City management due to representing themselves as a repeat offender. This infraction consists of a indefinite removal from the Lucid City roleplay community without the ability to appeal and return.
Character Deletion (CD): An infraction that is issued upon an individual that has engaged in activities which has granted the user's character unintended advantages such as items and/or money. This infraction consists of one or several character's being deleted to ensure the integrity of the economy and server experiences.
Government Blacklist (GB): An infraction that is issued upon an individual that has engaged in acts of extreme misconduct and/or corruption within the government sector. This infraction consists of a permanent and unappealable blacklist from all government funded jobs. These are jobs within the law enforcement, judicial, and emergency services classifications.
Specialized Instances (SI): An infraction that may be issued situationally in specialized instances for infractions such as currency trading and repeated infractions within and outside the server itself should it have any moderate to major impact on another community member. This infraction justifies a suspension of 31 days or higher.

C01.04 - FINAL INFRACTION POLICY:
General Information: The final infraction policy is implemented in order to deal with individuals which have repeated the same infraction regardless of classification and infraction type to the point additional actions are warranted to settle the user's negative conduct. This policy exists to deter repeat offenders from going too far and to remove players who display repeated actions of malice. Any individual that goes past the maximum infraction category for one infraction will be issued a Community Removal (CR) infraction.

SECTION 02 - VERBAL CONDUCT & BEHAVIOR:

C02.01 - EXTERNAL TARGETING & COMMUNICATION:
Infraction Category: [E > F]
General Information: Player interactions, scenes, and/or information which originate within the constraints of roleplay is to remain within roleplay. You are not permitted to take any of this outside of character with the intent to maliciously use it against another person. This also includes but is not limited to actions which result in the targeting of others, reaching out to others about things to be handled within roleplay, and so on. Examples are as follows:
Degrading the individual reputation of another person.
Contacting a person to bother, insult and/or harass them.
Contacting a person to talk about an interaction that did not go in their favor on Discord.
Influencing other people to turn on an individual for something that occurred in roleplay.

C02.02 - BREAKING CHARACTER:
Infraction Category: [A > B > C > D > E]
General Information: Throughout your time on Lucid City servers, you are expected and mandated to approach any interaction with roleplay centered terminology and behavior. Play with the traits and story of your character, refrain from breaking the boundaries of that sphere. Terminology that is unfamiliar and unfitting for roleplay should be avoided. Here is a few examples:
Terminology referring to staff. These are words such as angels, government, and gods.
Terminology referring to the waiting room. These are words such as upstairs and above.
Terminology referring to crew management. These are words such as disbandment, strikes, warnings, and infraction points.
Terminology referring to the community regulations. These are words such as city laws, city rules, and government rules.
Terminology referring to the community guidelines. These are words such as infraction points, suspensions, bans, and community removals.

C02.03 - DISCRIMINATORY BEHAVIOR & TERMINOLOGY:
Infraction Category: [F]
General Information: Interacting with others through speech and behavior that can be tied to discrimination and malicious intentions is prohibited. We are all human beings with different views, beliefs, opinions, and origins. It is beyond important to respect that regardless of how you see the world. Disagreements are fine within the boundary of it being respectful and reasonable, but do not take it to a level of offensive, derogatory, discriminatory, and/or sensitive. Examples of this are as follows:
Use of terminology that may be tied towards hate speech.
Conduct related to that of discriminatory remarks, racism, homophobia, transphobia, and so forth.
Conduct related to other protected categories such as religious and cultural beliefs.

[Content continues with all sections through C13.02...]`;
  }

  getEmbeddedCrewRules() {
    return `LUCID CITY ROLEPLAY
CREW REGULATORY GUIDELINES

[Full crew rules content here...]`;
  }
}

module.exports = new CompleteRulesLoader();