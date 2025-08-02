class RulesDatabase {
  constructor() {
    this.communityRules = {
      // SECTION 01 - PAGE INFORMATION
      "C01.01": {
        title: "JURISDICTIONS",
        category: "Page Information",
        description: "These are the official community regulatory guidelines of the Lucid City roleplay public server.",
        infraction: null
      },
      "C01.02": {
        title: "CORRECTIVE ACTION", 
        category: "Page Information",
        description: "Inappropriate, destructive, malicious conduct will be handled according to guidelines.",
        infraction: null
      },
      "C01.03": {
        title: "INFRACTION CLASSIFICATIONS",
        category: "Page Information", 
        description: "Classifications A-F determine severity and consequences. Maximum 125 points before community removal.",
        infraction: null
      },
      "C01.04": {
        title: "FINAL INFRACTION POLICY",
        category: "Page Information",
        description: "Repeated same infractions lead to Community Removal regardless of classification.",
        infraction: null
      },

      // SECTION 02 - VERBAL CONDUCT & BEHAVIOR
      "C02.01": {
        title: "EXTERNAL TARGETING & COMMUNICATION",
        category: "Verbal Conduct",
        description: "Taking roleplay conflicts outside of character to target/harass others is prohibited.",
        infraction: ["E", "F"],
        examples: ["Degrading someone's reputation", "Contacting to harass", "Taking Discord arguments about RP"]
      },
      "C02.02": {
        title: "BREAKING CHARACTER",
        category: "Verbal Conduct",
        description: "Must stay in character and use appropriate roleplay terminology at all times.",
        infraction: ["A", "B", "C", "D", "E"],
        examples: ["Referring to staff as 'angels/gods'", "Mentioning 'upstairs/waiting room'", "Talking about 'city rules' instead of laws"]
      },
      "C02.03": {
        title: "DISCRIMINATORY BEHAVIOR & TERMINOLOGY",
        category: "Verbal Conduct", 
        description: "Hate speech, discrimination, and offensive behavior based on protected categories is prohibited.",
        infraction: ["F"],
        examples: ["Hate speech", "Racism, homophobia, transphobia", "Religious/cultural discrimination"]
      },

      // SECTION 03 - UNREASONABLE CONDUCT
      "C03.01": {
        title: "GRIEFING & UNWARRANTED INTERACTIONS",
        category: "Unreasonable Conduct",
        description: "Initiating scenes with intent to grief or negatively impact others without reason.",
        infraction: ["D", "E", "F"],
        examples: ["Throwaway troll characters", "Modifying others' vehicles without permission"]
      },
      "C03.02": {
        title: "LOOPHOLING & BAITING",
        category: "Unreasonable Conduct",
        description: "Attempting to circumvent rules or bait others into violations is prohibited.",
        infraction: ["E", "F"]
      },
      "C03.03": {
        title: "EXCESSIVE TOXICITY",
        category: "Unreasonable Conduct",
        description: "Behaviors intended to cause harm, malice, or disturbance to other players.",
        infraction: ["C", "E", "F"],
        examples: ["Excessive mag dumping", "Running over downed bodies", "Teabagging/dancing on bodies"]
      },
      "C03.04": {
        title: "BODY DUMPING",
        category: "Unreasonable Conduct",
        description: "Maliciously relocating/dumping other players' bodies is prohibited.",
        infraction: ["A", "D", "E"]
      },

      // SECTION 04 - CHARACTER CONDUCT
      "C04.01": {
        title: "CHARACTER BLENDING",
        category: "Character Conduct",
        description: "Keep character knowledge, resources, and storylines separate between characters.",
        infraction: ["C", "E", "F"],
        examples: ["Using multiple characters to retaliate", "Transferring money between characters", "Same house on multiple characters"]
      },
      "C04.02": {
        title: "LOW EFFORT ROLEPLAY & NO INTENT TO ROLEPLAY",
        category: "Character Conduct",
        description: "Must prioritize interactive roleplay with unique character personalities.",
        infraction: ["F", "CR"],
        requiresApproval: "Head Administration+"
      },
      "C04.03": {
        title: "VALUE OF LIFE",
        category: "Character Conduct",
        description: "Must value your character's life realistically and comply when outgunned.",
        infraction: ["C", "D", "E", "F"],
        examples: ["Outgunned 3 to 1", "Outgunned 5 to 2", "etc."]
      },
      "C04.04": {
        title: "CHARACTER INJURY",
        category: "Character Conduct",
        description: "Act appropriately when injured - sound hurt and build immersion.",
        infraction: ["A", "B", "C"]
      },
      "C04.05": {
        title: "NEW LIFE RULE",
        category: "Character Conduct",
        description: "If you respawn instead of getting medical treatment, forget the interaction that led to death.",
        infraction: ["A", "B", "C", "D"]
      },
      "C04.06": {
        title: "RETURNING TO SCENE & COMBAT TIMER", 
        category: "Character Conduct",
        description: "Cannot re-engage in scene after being downed. 30-minute combat timer after medical care.",
        infraction: ["A", "C", "D", "E"]
      },

      // SECTION 05 - GOVERNMENT EMPLOYEES
      "C05.01": {
        title: "LAW ENFORCEMENT INTERACTIONS",
        category: "Government Employees",
        description: "Don't maliciously interfere with or bait law enforcement officers.",
        infraction: ["A", "C", "D", "F"],
        examples: ["Baiting police chases", "Purposely bothering officers", "Ambush baiting"]
      },
      "C05.02": {
        title: "GOVERNMENT ROBBERIES",
        category: "Government Employees", 
        description: "Cannot rob government employees. Can retrieve your items within 1 hour.",
        infraction: ["E", "F"]
      },
      "C05.03": {
        title: "EMERGENCY MEDICAL SERVICE",
        category: "Government Employees",
        description: "EMS are support characters - violence only as last resort if they won't comply.",
        infraction: ["C", "E", "F"]
      },
      "C05.04": {
        title: "GOVERNMENT CORRUPTION",
        category: "Government Employees",
        description: "Government employees cannot abuse powers, distribute equipment, or leak information.",
        infraction: ["F", "GB"]
      },
      "C05.05": {
        title: "GOVERNMENT IMPERSONATION",
        category: "Government Employees",
        description: "Cannot pretend to be government employee or wear their clothing without authorization.",
        infraction: ["A", "D", "E"]
      },

      // SECTION 06 - ROBBERY & ROAMING GUIDELINES
      "C06.01": {
        title: "PLAYER ROAMING LIMITATIONS",
        category: "Robbery & Roaming",
        description: "Non-crew players limited to 6 people. Crew members limited to 6 in law enforcement interactions.",
        infraction: ["A", "B", "C", "D", "E"]
      },
      "C06.02": {
        title: "SCENE INTERFERENCE",
        category: "Robbery & Roaming",
        description: "Don't interfere with roleplay scenes you're not involved in without valid reason.",
        infraction: ["A", "C", "D", "E"]
      },
      "C06.03": {
        title: "HEIST COOLDOWNS",
        category: "Robbery & Roaming",
        description: "One hour cooldown between heists, plus specific cooldowns for different heist types.",
        infraction: ["A", "B", "C", "D"],
        examples: ["Pacific Standard: 6H", "Fleeca: 3H", "Vangelico: 3H", "Bank Truck: 2H"]
      },
      "C06.04": {
        title: "HOSTAGE RESTRICTIONS",
        category: "Robbery & Roaming",
        description: "Hostages for leverage only. Cannot harm, rob, or hold beyond 45 minutes.",
        infraction: ["A", "B", "C", "D"]
      },
      "C06.05": {
        title: "LOW EFFORT ROBBERY",
        category: "Robbery & Roaming",
        description: "Robberies require proper initiation, reasoning, and mutual interaction.",
        infraction: ["A", "D", "E"]
      },
      "C06.06": {
        title: "CAMPING WITH INTENT TO ROB",
        category: "Robbery & Roaming",
        description: "Cannot camp locations to rob others or prevent them from activities.",
        infraction: ["A", "D", "E", "F"]
      },

      // SECTION 07 - DISHONEST & FRAUDULENT CONDUCT
      "C07.01": {
        title: "LOW EFFORT SCAMMING",
        category: "Dishonest & Fraudulent",
        description: "Scamming requires excellent scenes with counterplay opportunities.",
        infraction: ["A", "D", "E", "F"]
      },
      "C07.02": {
        title: "CURRENCY & ITEM EXCHANGING",
        category: "Dishonest & Fraudulent",
        description: "Cannot exchange in-game items/currency for real money or vice versa.",
        infraction: ["SI", "CD"]
      },
      "C07.03": {
        title: "META GAMING & EXTERNAL INFORMATION",
        category: "Dishonest & Fraudulent",
        description: "Cannot use information obtained outside of roleplay within roleplay.",
        infraction: ["B", "D", "E", "F"]
      },
      "C07.04": {
        title: "FACILITATION OF EXTERNAL MARKETPLACES",
        category: "Dishonest & Fraudulent",
        description: "Cannot facilitate non-roleplay trading platforms or marketplaces.",
        infraction: ["F"]
      },
      "C07.05": {
        title: "POWER GAMING",
        category: "Dishonest & Fraudulent",
        description: "Cannot force roleplay outcomes or abuse game features.",
        infraction: ["B", "D", "E", "F"],
        examples: ["Using emotes to avoid damage", "Storing vehicles during pursuits", "Forcing withdrawals"]
      },
      "C07.06": {
        title: "COMBAT LOGGING",
        category: "Dishonest & Fraudulent",
        description: "Cannot disconnect during or shortly after active scenes.",
        infraction: ["D", "E", "F"]
      },
      "C07.07": {
        title: "EXPLOITING",
        category: "Dishonest & Fraudulent",
        description: "Cannot intentionally use bugs or third-party tools for advantage.",
        infraction: ["F", "CD"]
      },
      "C07.08": {
        title: "MODDING & CHEATING",
        category: "Dishonest & Fraudulent",
        description: "Any modification clients, injectors, or cheat software prohibited.",
        infraction: ["CR"]
      },
      "C07.09": {
        title: "ALTERED FILES",
        category: "Dishonest & Fraudulent",
        description: "Cannot use texture packs or file modifications that provide advantages.",
        infraction: ["D", "E", "F"]
      },
      "C07.10": {
        title: "ADVERTISING",
        category: "Dishonest & Fraudulent",
        description: "Cannot advertise other servers without management approval.",
        infraction: ["CR"]
      },
      "C07.11": {
        title: "BAN EVASION",
        category: "Dishonest & Fraudulent",
        description: "Cannot attempt to bypass infractions or bans.",
        infraction: ["CR"]
      },
      "C07.12": {
        title: "RETALIATORY & UNNECESSARY REPORTING",
        category: "Dishonest & Fraudulent",
        description: "Cannot report others in retaliation or for wrong reasons.",
        infraction: ["A", "D", "E", "F"]
      },

      // SECTION 08 - RESTART & TSUNAMI CONDUCT
      "C08.01": {
        title: "PRE-RESTART CONDUCT",
        category: "Restart & Tsunami",
        description: "No hostile interactions in the 20 minutes before server restart.",
        infraction: ["A", "A", "B", "C", "D"]
      },
      "C08.02": {
        title: "POST-RESTART CONDUCT",
        category: "Restart & Tsunami",
        description: "No hostile interactions for 20 minutes after server restart.",
        infraction: ["A", "A", "B", "C", "D"]
      },

      // SECTION 09 - HOSTILE CONDUCT
      "C09.01": {
        title: "VEHICLE DEATH MATCH",
        category: "Hostile Conduct",
        description: "Cannot intentionally harm others with vehicles except when cornered.",
        infraction: ["A", "B", "D", "E"]
      },
      "C09.02": {
        title: "RANDOM DEATH MATCH",
        category: "Hostile Conduct",
        description: "Cannot harm others without proper roleplay initiation and reasoning.",
        infraction: ["A", "D", "E", "F"]
      },

      // SECTION 10 - JOB CONDUCT
      "C10.01": {
        title: "JOB ABUSE",
        category: "Job Conduct",
        description: "Cannot abuse job features to gain unfair advantages or harm businesses.",
        infraction: ["E", "F"]
      },

      // SECTION 11 - SAFE ZONE CONDUCT
      "C11.01": {
        title: "SAFE ZONES",
        category: "Safe Zone Conduct",
        description: "No hostile interactions in safe zones (hospitals, Tinsel Towers).",
        infraction: ["A", "C", "D", "E"]
      },

      // SECTION 12 - STAFF RELATED CONDUCT
      "C12.01": {
        title: "STAFF IMPERSONATION",
        category: "Staff Related",
        description: "Cannot impersonate staff members.",
        infraction: ["F"]
      },
      "C12.02": {
        title: "MINI MODDING & RULE VIGILANTES",
        category: "Staff Related",
        description: "Cannot attempt to enforce rules in character or call out violations.",
        infraction: ["C", "E", "F"]
      },

      // SECTION 13 - INAPPROPRIATE ROLEPLAY
      "C13.01": {
        title: "SEXUAL ROLEPLAY",
        category: "Inappropriate Roleplay",
        description: "Sexual roleplay not recommended, must be private and consensual if done.",
        infraction: ["E", "F"]
      },
      "C13.02": {
        title: "SUICIDE ROLEPLAY",
        category: "Inappropriate Roleplay",
        description: "Self-harm or suicide roleplay should be avoided regardless of consent.",
        infraction: ["E", "F"]
      }
    };

    this.crewRules = {
      // Basic crew rule structure
      "CR01.01": {
        title: "CREW MANAGEMENT SERVER MANDATE",
        category: "Crew Creation",
        description: "All crew members must be in the crew management Discord server.",
        infraction: ["A", "B", "CD"]
      },
      "CR02.01": {
        title: "STRUCTURAL INFORMATION",
        category: "Crew Creation",
        description: "Crews must have proper structure: 1 tablet holder, up to 2 leaders, up to 5 officers, up to 24 members.",
        infraction: ["A", "B", "CD"]
      },
      "CR03.01": {
        title: "CLOTHING IDENTIFICATION MANDATE",
        category: "Crew Representation",
        description: "Crews must choose specific clothing combinations for identification during conflicts.",
        infraction: ["B", "D"]
      },
      "CR04.01": {
        title: "IMPROPER INITIATION OF CONFLICT",
        category: "Conflicts & Disputes",
        description: "Cannot start conflicts over minor issues or non-roleplay reasons.",
        infraction: ["B", "D"]
      },
      "CR05.01": {
        title: "INDIVIDUAL TAXATION",
        category: "Taxation Guidelines",
        description: "Can tax individuals up to $10,000 per restart if providing services in return.",
        infraction: ["B", "C", "D"]
      },
      "CR09.01": {
        title: "LAW ENFORCEMENT INTERACTIONS",
        category: "Government Personnel",
        description: "Cannot ambush or bait law enforcement unnecessarily.",
        infraction: ["A", "D", "E"]
      }
    };
  }

  searchRules(searchTerm) {
    const results = [];
    const term = searchTerm.toLowerCase();

    // Search community rules
    for (const [code, rule] of Object.entries(this.communityRules)) {
      if (
        code.toLowerCase().includes(term) ||
        rule.title.toLowerCase().includes(term) ||
        rule.description.toLowerCase().includes(term) ||
        rule.category.toLowerCase().includes(term) ||
        (rule.examples && rule.examples.some(ex => ex.toLowerCase().includes(term)))
      ) {
        results.push({ code, ...rule, type: 'community' });
      }
    }

    // Search crew rules  
    for (const [code, rule] of Object.entries(this.crewRules)) {
      if (
        code.toLowerCase().includes(term) ||
        rule.title.toLowerCase().includes(term) ||
        rule.description.toLowerCase().includes(term) ||
        rule.category.toLowerCase().includes(term)
      ) {
        results.push({ code, ...rule, type: 'crew' });
      }
    }

    return results.slice(0, 10); // Limit results
  }

  getRule(ruleCode) {
    const upperCode = ruleCode.toUpperCase();
    
    if (this.communityRules[upperCode]) {
      return { code: upperCode, ...this.communityRules[upperCode], type: 'community' };
    }
    
    if (this.crewRules[upperCode]) {
      return { code: upperCode, ...this.crewRules[upperCode], type: 'crew' };
    }
    
    return null;
  }

  getRulesByCategory(category) {
    const results = [];
    
    for (const [code, rule] of Object.entries(this.communityRules)) {
      if (rule.category.toLowerCase().includes(category.toLowerCase())) {
        results.push({ code, ...rule, type: 'community' });
      }
    }
    
    for (const [code, rule] of Object.entries(this.crewRules)) {
      if (rule.category.toLowerCase().includes(category.toLowerCase())) {
        results.push({ code, ...rule, type: 'crew' });
      }
    }
    
    return results;
  }

  getCategories() {
    const categories = new Set();
    
    Object.values(this.communityRules).forEach(rule => categories.add(rule.category));
    Object.values(this.crewRules).forEach(rule => categories.add(rule.category));
    
    return Array.from(categories).sort();
  }

  getInfractionInfo(classification) {
    const infractions = {
      'A': { name: 'Warning/1 Day', points: 5, duration: '1 day suspension or warning', expires: '3 months' },
      'B': { name: '3 Day Suspension', points: 10, duration: '3 day suspension or warning', expires: '6 months' },
      'C': { name: '5 Day Suspension', points: 15, duration: '5 day suspension or warning', expires: '6 months' },
      'D': { name: '7 Day Suspension', points: 20, duration: '7 day suspension', expires: '12 months' },
      'E': { name: '14 Day Suspension', points: 25, duration: '14 day suspension', expires: '12 months' },
      'F': { name: 'Permanent Ban', points: 50, duration: 'Appealable permanent ban', expires: 'Never' },
      'CR': { name: 'Community Removal', points: null, duration: 'Indefinite removal without appeal', expires: 'Never' },
      'CD': { name: 'Character Deletion', points: null, duration: 'Character(s) deleted', expires: 'N/A' },
      'GB': { name: 'Government Blacklist', points: null, duration: 'Permanent government job ban', expires: 'Never' },
      'SI': { name: 'Specialized Instance', points: null, duration: '31+ day suspension', expires: 'Varies' }
    };
    
    return infractions[classification.toUpperCase()] || null;
  }

  // Helper method to get rule context for AI
  getRuleContext(searchTerms) {
    const relevantRules = [];
    
    searchTerms.forEach(term => {
      const results = this.searchRules(term);
      results.slice(0, 2).forEach(rule => {
        if (!relevantRules.find(r => r.code === rule.code)) {
          relevantRules.push(rule);
        }
      });
    });
    
    return relevantRules.slice(0, 5).map(rule => 
      `${rule.code} - ${rule.title}: ${rule.description}${rule.examples ? ' Examples: ' + rule.examples.join(', ') : ''}`
    ).join('\n\n');
  }
}

module.exports = new RulesDatabase();