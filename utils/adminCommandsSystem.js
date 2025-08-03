// utils/adminCommandsSystem.js - Admin commands and statistics system

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

class AdminCommandsSystem {
  constructor() {
    this.authorizedUsers = new Set([
      // Add admin user IDs here
      'YOUR_ADMIN_USER_ID_1',
      'YOUR_ADMIN_USER_ID_2'
    ]);

    this.authorizedRoles = new Set([
      'Admin',
      'Staff',
      'Management',
      'Developer'
    ]);

    this.commandStats = {
      accuracyCommands: 0,
      reloadCommands: 0,
      statsCommands: 0,
      lastReset: Date.now()
    };
  }

  isAuthorized(member) {
    // Check if user ID is in authorized list
    if (this.authorizedUsers.has(member.id)) {
      return true;
    }

    // Check if user has authorized role
    return member.roles.cache.some(role => 
      this.authorizedRoles.has(role.name)
    );

    // Check if user has admin permissions
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return true;
    }

    return false;
  }

  async handleCommand(message, command, args) {
    if (!this.isAuthorized(message.member)) {
      return await message.reply('❌ You do not have permission to use admin commands.');
    }

    try {
      switch (command.toLowerCase()) {
        case 'accuracystats':
        case 'accuracy':
          return await this.handleAccuracyStats(message);
          
        case 'reloadrules':
        case 'reload':
          return await this.handleReloadRules(message);
          
        case 'techstats':
        case 'technical':
          return await this.handleTechnicalStats(message);
          
        case 'botinfo':
        case 'info':
          return await this.handleBotInfo(message);
          
        case 'compoundstats':
        case 'compound':
          return await this.handleCompoundStats(message);
          
        case 'clearstats':
          return await this.handleClearStats(message, args);
          
        case 'exportlogs':
        case 'export':
          return await this.handleExportLogs(message, args);
          
        default:
          return await this.handleHelp(message);
      }
    } catch (error) {
      console.error('Admin command error:', error);
      return await message.reply('❌ Error executing admin command: ' + error.message);
    }
  }

  async handleAccuracyStats(message) {
    this.commandStats.accuracyCommands++;
    
    try {
      // Get stats from various systems
      const enhancedRulesParser = require('./enhancedRulesParser');
      const ruleAccuracyEnhancer = require('./ruleAccuracyEnhancer');
      
      const parserStats = enhancedRulesParser.getStats();
      
      // Calculate session accuracy from active conversations
      let totalAccuracy = { correct: 0, total: 0, ambiguous: 0 };
      let activeConversations = 0;
      
      // This would be accessed from the main bot instance
      if (global.activeConversations) {
        activeConversations = global.activeConversations.size;
        
        for (const [userId, session] of global.activeConversations) {
          const context = session.getConversationContext();
          if (context.accuracy) {
            totalAccuracy.correct += context.accuracy.correct;
            totalAccuracy.total += context.accuracy.total;
            totalAccuracy.ambiguous += context.accuracy.ambiguous;
          }
        }
      }

      const overallAccuracy = totalAccuracy.total > 0 ? 
        Math.round((totalAccuracy.correct / totalAccuracy.total) * 100) : 0;
      
      const ambiguityRate = totalAccuracy.total > 0 ? 
        Math.round((totalAccuracy.ambiguous / totalAccuracy.total) * 100) : 0;

      const embed = new EmbedBuilder()
        .setTitle('🎯 Rule Accuracy Statistics')
        .setColor(overallAccuracy >= 90 ? 0x00ff00 : overallAccuracy >= 75 ? 0xffaa00 : 0xff0000)
        .addFields([
          {
            name: '📊 Rule Database',
            value: [
              `Total Rules: ${parserStats.totalRules}`,
              `Community: ${parserStats.communityRules}`,
              `Crew: ${parserStats.crewRules}`,
              `Concepts: ${parserStats.concepts}`,
              `Relationships: ${parserStats.relationships}`
            ].join('\n'),
            inline: true
          },
          {
            name: '🎯 Current Accuracy',
            value: [
              `Overall: ${overallAccuracy}%`,
              `Correct: ${totalAccuracy.correct}/${totalAccuracy.total}`,
              `Ambiguous: ${ambiguityRate}%`,
              `Target: 90%+`
            ].join('\n'),
            inline: true
          },
          {
            name: '💬 Active Sessions',
            value: [
              `Conversations: ${activeConversations}`,
              `Responses: ${totalAccuracy.total}`,
              `Status: ${overallAccuracy >= 90 ? '✅ Excellent' : overallAccuracy >= 75 ? '⚠️ Good' : '❌ Needs Work'}`
            ].join('\n'),
            inline: true
          }
        ])
        .setFooter({ 
          text: `Last updated: ${new Date().toLocaleTimeString()} | Quiz baseline: 78.8%` 
        })
        .setTimestamp();

      // Add improvement recommendations if accuracy is low
      if (overallAccuracy < 90) {
        let recommendations = [];
        if (overallAccuracy < 75) {
          recommendations.push('• Check critical rule mappings');
        }
        if (ambiguityRate > 5) {
          recommendations.push('• Review system prompts for decisiveness');
        }
        if (totalAccuracy.total < 10) {
          recommendations.push('• Need more test data for accurate metrics');
        }

        if (recommendations.length > 0) {
          embed.addFields([{
            name: '💡 Recommendations',
            value: recommendations.join('\n'),
            inline: false
          }]);
        }
      }

      return await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Accuracy stats error:', error);
      return await message.reply('❌ Error retrieving accuracy statistics: ' + error.message);
    }
  }

  async handleReloadRules(message) {
    this.commandStats.reloadCommands++;
    
    try {
      const reloadMessage = await message.reply('🔄 Reloading rule systems...');
      
      // Clear module cache for rule-related modules
      const modulesToReload = [
        './enhancedRulesParser',
        './ruleAccuracyEnhancer',
        './compoundRuleDetector',
        './enhancedTechnicalSupport'
      ];

      for (const modulePath of modulesToReload) {
        try {
          const fullPath = require.resolve(modulePath);
          delete require.cache[fullPath];
          console.log(`✅ Cleared cache for ${modulePath}`);
        } catch (error) {
          console.warn(`⚠️ Could not reload ${modulePath}:`, error.message);
        }
      }

      // Reinitialize systems
      try {
        const enhancedRulesParser = require('./enhancedRulesParser');
        const ruleAccuracyEnhancer = require('./ruleAccuracyEnhancer');
        
        const stats = enhancedRulesParser.getStats();
        
        await reloadMessage.edit(`✅ Rules reloaded successfully!\n\n**Stats:**\n• Total Rules: ${stats.totalRules}\n• Community: ${stats.communityRules}\n• Crew: ${stats.crewRules}\n• Concepts: ${stats.concepts}`);
        
      } catch (error) {
        await reloadMessage.edit('❌ Error reinitializing rule systems: ' + error.message);
      }
      
    } catch (error) {
      console.error('Reload rules error:', error);
      return await message.reply('❌ Error reloading rules: ' + error.message);
    }
  }

  async handleTechnicalStats(message) {
    try {
      const enhancedTechnicalSupport = require('./enhancedTechnicalSupport');
      const stats = enhancedTechnicalSupport.getTechnicalStats();

      const embed = new EmbedBuilder()
        .setTitle('🔧 Technical Support Statistics')
        .setColor(0x3498db)
        .addFields([
          {
            name: '📊 Issue Overview',
            value: [
              `Total Issues: ${stats.total_issues}`,
              `Last 24h: ${stats.last_24_hours}`,
              `Avg Confidence: ${stats.average_confidence}%`
            ].join('\n'),
            inline: true
          },
          {
            name: '🔝 Top Issues (24h)',
            value: stats.top_issues.length > 0 ? 
              stats.top_issues.map(([issue, count]) => 
                `${issue.replace(/_/g, ' ')}: ${count}`
              ).join('\n') : 'No issues detected',
            inline: true
          }
        ])
        .setFooter({ text: 'Technical support statistics' })
        .setTimestamp();

      return await message.reply({ embeds: [embed] });
      
    } catch (error) {
      return await message.reply('❌ Error retrieving technical statistics: ' + error.message);
    }
  }

  async handleCompoundStats(message) {
    try {
      const compoundRuleDetector = require('./compoundRuleDetector');
      const stats = compoundRuleDetector.getDetectionStats();

      const embed = new EmbedBuilder()
        .setTitle('🔗 Compound Rule Violation Statistics')
        .setColor(0xe74c3c)
        .addFields([
          {
            name: '📊 Detection Overview',
            value: [
              `Total Detected: ${stats.total_detected}`,
              `Last 24h: ${stats.last_24_hours}`,
              `Detection Rate: ${stats.detection_rate}`
            ].join('\n'),
            inline: true
          },
          {
            name: '🔝 Top Patterns',
            value: stats.top_patterns.length > 0 ?
              stats.top_patterns.map(([pattern, count]) => 
                `${pattern.replace(/_/g, ' ')}: ${count}`
              ).join('\n') : 'No patterns detected',
            inline: true
          }
        ])
        .setFooter({ text: 'Compound violation statistics' })
        .setTimestamp();

      return await message.reply({ embeds: [embed] });
      
    } catch (error) {
      return await message.reply('❌ Error retrieving compound statistics: ' + error.message);
    }
  }

  async handleBotInfo(message) {
    const uptime = process.uptime();
    const uptimeString = this.formatUptime(uptime);

    const embed = new EmbedBuilder()
      .setTitle('🤖 Lucid City RP Assistant Info')
      .setColor(0x2ecc71)
      .addFields([
        {
          name: '📈 System Stats',
          value: [
            `Uptime: ${uptimeString}`,
            `Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            `Node.js: ${process.version}`,
            `Discord.js: ${require('discord.js').version}`
          ].join('\n'),
          inline: true
        },
        {
          name: '🎯 Features',
          value: [
            '✅ Rule Accuracy System',
            '✅ Critical Rule Mapping',
            '✅ Compound Violation Detection',
            '✅ Technical Support AI',
            '✅ Context Persistence'
          ].join('\n'),
          inline: true
        },
        {
          name: '📊 Command Stats',
          value: [
            `Accuracy Checks: ${this.commandStats.accuracyCommands}`,
            `Rule Reloads: ${this.commandStats.reloadCommands}`,
            `Stats Requests: ${this.commandStats.statsCommands}`,
            `Since: ${new Date(this.commandStats.lastReset).toLocaleDateString()}`
          ].join('\n'),
          inline: true
        }
      ])
      .setFooter({ text: 'Lucid City RP Assistant v2.0' })
      .setTimestamp();

    return await message.reply({ embeds: [embed] });
  }

  async handleClearStats(message, args) {
    const type = args[0]?.toLowerCase();
    
    try {
      switch (type) {
        case 'technical':
          const enhancedTechnicalSupport = require('./enhancedTechnicalSupport');
          enhancedTechnicalSupport.clearOldIssues(0); // Clear all
          return await message.reply('✅ Technical statistics cleared.');
          
        case 'compound':
          const compoundRuleDetector = require('./compoundRuleDetector');
          compoundRuleDetector.clearOldDetections(0); // Clear all
          return await message.reply('✅ Compound violation statistics cleared.');
          
        case 'commands':
          this.commandStats = {
            accuracyCommands: 0,
            reloadCommands: 0,
            statsCommands: 0,
            lastReset: Date.now()
          };
          return await message.reply('✅ Command statistics cleared.');
          
        case 'all':
          // Clear all stats
          this.handleClearStats(message, ['technical']);
          this.handleClearStats(message, ['compound']);
          this.handleClearStats(message, ['commands']);
          return await message.reply('✅ All statistics cleared.');
          
        default:
          return await message.reply('❌ Usage: `!clearstats <technical|compound|commands|all>`');
      }
    } catch (error) {
      return await message.reply('❌ Error clearing statistics: ' + error.message);
    }
  }

  async handleExportLogs(message, args) {
    const type = args[0]?.toLowerCase() || 'accuracy';
    
    try {
      let exportData = {};
      
      switch (type) {
        case 'accuracy':
          // Export accuracy data
          if (global.activeConversations) {
            exportData.sessions = [];
            for (const [userId, session] of global.activeConversations) {
              exportData.sessions.push(session.generateContextSummary());
            }
          }
          break;
          
        case 'technical':
          const enhancedTechnicalSupport = require('./enhancedTechnicalSupport');
          exportData = enhancedTechnicalSupport.getTechnicalStats();
          break;
          
        case 'compound':
          const compoundRuleDetector = require('./compoundRuleDetector');
          exportData = compoundRuleDetector.getDetectionStats();
          break;
      }
      
      const jsonData = JSON.stringify(exportData, null, 2);
      const filename = `lucid-bot-${type}-${Date.now()}.json`;
      
      // Create a temporary file buffer
      const buffer = Buffer.from(jsonData, 'utf8');
      
      return await message.reply({
        content: `📄 Exported ${type} data:`,
        files: [{
          attachment: buffer,
          name: filename
        }]
      });
      
    } catch (error) {
      return await message.reply('❌ Error exporting logs: ' + error.message);
    }
  }

  async handleHelp(message) {
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Admin Commands Help')
      .setColor(0x9b59b6)
      .setDescription('Available admin commands for the Lucid City RP Assistant')
      .addFields([
        {
          name: '📊 Statistics Commands',
          value: [
            '`!accuracystats` - View rule accuracy statistics',
            '`!techstats` - View technical support statistics', 
            '`!compoundstats` - View compound violation statistics',
            '`!botinfo` - View bot system information'
          ].join('\n'),
          inline: false
        },
        {
          name: '🔧 Management Commands',
          value: [
            '`!reloadrules` - Reload rule parsing systems',
            '`!clearstats <type>` - Clear statistics (technical/compound/commands/all)',
            '`!exportlogs <type>` - Export logs as JSON (accuracy/technical/compound)'
          ].join('\n'),
          inline: false
        },
        {
          name: '🔐 Authorization',
          value: 'Commands require Admin role or Administrator permissions',
          inline: false
        }
      ])
      .setFooter({ text: 'Use these commands to monitor and manage the bot' })
      .setTimestamp();

    return await message.reply({ embeds: [embed] });
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Add admin user or role
  addAuthorization(type, value) {
    if (type === 'user') {
      this.authorizedUsers.add(value);
    } else if (type === 'role') {
      this.authorizedRoles.add(value);
    }
  }

  // Remove admin user or role
  removeAuthorization(type, value) {
    if (type === 'user') {
      this.authorizedUsers.delete(value);
    } else if (type === 'role') {
      this.authorizedRoles.delete(value);
    }
  }
}

module.exports = new AdminCommandsSystem();