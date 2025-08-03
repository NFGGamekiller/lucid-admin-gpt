// Enhanced conversation session with persistent context
class EnhancedConversationSession {
  constructor(userId, channelId) {
    this.userId = userId;
    this.channelId = channelId;
    this.startTime = Date.now();
    this.lastActivity = Date.now();
    this.messageHistory = [];
    
    // ENHANCED: Persistent rule context across turns
    this.ruleContext = {
      mentionedRules: new Set(),
      discussedConcepts: new Set(),
      compoundViolations: [],
      technicalIssues: [],
      accuracyTracking: { correct: 0, total: 0, ambiguous: 0 }
    };
    
    this.timeout = null;
    this.resetTimeout();
  }

  addMessage(role, content) {
    this.messageHistory.push({ 
      role, 
      content, 
      timestamp: Date.now() 
    });
    this.lastActivity = Date.now();
    this.resetTimeout();
    
    // ENHANCED: Extract and accumulate context
    this.extractAndAccumulateContext(content);
    
    // Keep manageable history
    if (this.messageHistory.length > 12) {
      this.messageHistory = this.messageHistory.slice(-12);
    }
  }

  extractAndAccumulateContext(content) {
    // Extract rule codes
    const ruleCodes = content.match(/[cC]\d{2}\.?\d{0,2}/g);
    if (ruleCodes) {
      ruleCodes.forEach(code => {
        this.ruleContext.mentionedRules.add(code.toUpperCase().replace(/(\d{2})(\d{2})/, '$1.$2'));
      });
    }

    // Extract concepts with better detection
    const conceptKeywords = {
      'value_of_life': ['value of life', 'outgunned', 'comply', 'threaten'],
      'excessive_toxicity': ['toxic', 'running over', 'downed', 'excessive', 'carrying'],
      'meta_gaming': ['meta', 'discord', 'external', 'stream', 'information'],
      'power_gaming': ['power', 'force', 'unrealistic', 'emote', 'advantage'],
      'roaming_limits': ['roam', 'group', 'people', 'limit', 'crew'],
      'breaking_character': ['character', 'ooc', 'infraction', 'points', 'lag'],
      'combat_logging': ['combat', 'log', 'disconnect', 'crash'],
      'rdm_vdm': ['rdm', 'vdm', 'random', 'vehicle', 'death'],
      'government_rules': ['police', 'ems', 'government', 'law enforcement'],
      'technical_issues': ['crash', 'connection', 'error', 'fivem', 'server']
    };
    
    const lowerContent = content.toLowerCase();
    for (const [concept, keywords] of Object.entries(conceptKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        this.ruleContext.discussedConcepts.add(concept);
      }
    }

    // Track compound violations (multiple rules in same context)
    if (this.ruleContext.mentionedRules.size > 1) {
      const currentRules = Array.from(this.ruleContext.mentionedRules);
      if (currentRules.length >= 2) {
        this.ruleContext.compoundViolations.push({
          rules: currentRules.slice(-2), // Last 2 rules mentioned
          timestamp: Date.now(),
          context: content.substring(0, 100)
        });
      }
    }

    // Track technical issues
    if (this.ruleContext.discussedConcepts.has('technical_issues')) {
      this.ruleContext.technicalIssues.push({
        issue: content.substring(0, 100),
        timestamp: Date.now()
      });
    }
  }

  // ENHANCED: Get accumulated context for next query
  getAccumulatedContext() {
    return {
      mentionedRules: Array.from(this.ruleContext.mentionedRules),
      mentionedConcepts: Array.from(this.ruleContext.discussedConcepts),
      hasContext: this.ruleContext.mentionedRules.size > 0 || this.ruleContext.discussedConcepts.size > 0,
      compoundViolations: this.ruleContext.compoundViolations,
      technicalIssues: this.ruleContext.technicalIssues,
      conversationDepth: this.messageHistory.length,
      accuracy: this.ruleContext.accuracyTracking
    };
  }

  // Track response accuracy
  recordAccuracy(isCorrect, isAmbiguous = false) {
    this.ruleContext.accuracyTracking.total++;
    if (isCorrect) this.ruleContext.accuracyTracking.correct++;
    if (isAmbiguous) this.ruleContext.accuracyTracking.ambiguous++;
  }

  resetTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    this.timeout = setTimeout(() => {
      if (activeConversations && activeConversations.has(this.userId)) {
        this.end('timeout');
      }
    }, 60000); // 60 seconds
  }

  end(reason = 'manual') {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const context = this.getAccumulatedContext();
    
    console.log(`📝 Enhanced conversation ended (${reason})`);
    console.log(`   👤 User: ${this.userId}`);
    console.log(`   ⏱️  Duration: ${duration}s`);
    console.log(`   💬 Messages: ${this.messageHistory.length}`);
    console.log(`   📋 Rules: ${context.mentionedRules.join(', ') || 'None'}`);
    console.log(`   🧠 Concepts: ${context.mentionedConcepts.join(', ') || 'None'}`);
    console.log(`   🎯 Accuracy: ${context.accuracy.correct}/${context.accuracy.total} (${context.accuracy.ambiguous} ambiguous)`);
    
    if (context.compoundViolations.length > 0) {
      console.log(`   🔗 Compound violations: ${context.compoundViolations.length}`);
    }
    
    if (activeConversations) {
      activeConversations.delete(this.userId);
    }
    
    if (reason === 'timeout') {
      const channel = this.getChannel();
      if (channel) {
        let timeoutMessage = 'Our conversation has ended due to inactivity.';
        
        if (context.mentionedRules.length > 0) {
          timeoutMessage += `\n\n**Rules discussed:** ${context.mentionedRules.join(', ')}`;
        }
        
        if (context.accuracy.total > 0) {
          const accuracyPercent = Math.round((context.accuracy.correct / context.accuracy.total) * 100);
          timeoutMessage += `\n**Accuracy:** ${accuracyPercent}%`;
        }
        
        timeoutMessage += '\n\nPing me again for more rule assistance!';
        
        channel.send(timeoutMessage).catch(console.error);
      }
    }
  }

  getChannel() {
    try {
      return client?.channels?.cache?.get(this.channelId);
    } catch (error) {
      return null;
    }
  }

  getHistory() {
    return this.messageHistory;
  }

  getConversationContext() {
    const accumulated = this.getAccumulatedContext();
    return {
      ...accumulated,
      duration: Date.now() - this.startTime,
      messageCount: this.messageHistory.length
    };
  }

  // Generate context summary for debugging
  generateContextSummary() {
    const context = this.getAccumulatedContext();
    
    return {
      session_id: this.userId,
      duration_seconds: Math.round((Date.now() - this.startTime) / 1000),
      total_messages: this.messageHistory.length,
      rules_mentioned: context.mentionedRules,
      concepts_discussed: context.mentionedConcepts,
      compound_violations: context.compoundViolations.length,
      technical_issues: context.technicalIssues.length,
      accuracy_rate: context.accuracy.total > 0 ? 
        Math.round((context.accuracy.correct / context.accuracy.total) * 100) : 0,
      ambiguity_rate: context.accuracy.total > 0 ? 
        Math.round((context.accuracy.ambiguous / context.accuracy.total) * 100) : 0
    };
  }
}

module.exports = EnhancedConversationSession;