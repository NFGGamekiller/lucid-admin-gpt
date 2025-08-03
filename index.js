require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const RulesHandler = require('./utils/rulesHandler');

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Create Discord client
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

// Initialize rules handler
const rulesHandler = new RulesHandler();

// Active conversations tracker
const activeConversations = new Map();
const CONVERSATION_TIMEOUT = 300000; // 5 minutes

// Static server information
const SERVER_INFO = {
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

class ConversationSession {
  constructor(userId, channelId) {
    this.userId = userId;
    this.channelId = channelId;
    this.startTime = Date.now();
    this.lastActivity = Date.now();
    this.messageHistory = [];
    this.timeout = null;
    this.resetTimeout();
  }

  addMessage(role, content) {
    this.messageHistory.push({ role, content, timestamp: Date.now() });
    this.lastActivity = Date.now();
    this.resetTimeout();
    
    // Keep last 10 messages for context
    if (this.messageHistory.length > 10) {
      this.messageHistory = this.messageHistory.slice(-10);
    }
  }

  resetTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(() => {
      this.end('timeout');
    }, CONVERSATION_TIMEOUT);
  }

  end(reason = 'manual') {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    activeConversations.delete(this.userId);
    
    if (reason === 'timeout') {
      const channel = client.channels.cache.get(this.channelId);
      if (channel) {
        channel.send('Our conversation has ended due to inactivity. Tag me again if you need more help with Lucid City RP rules or support.').catch(console.error);
      }
    }
  }

  getHistory() {
    return this.messageHistory;
  }
}

// Bot ready event
client.once('ready', async () => {
  console.log('🤖 Lucid City RP Community Assistant is online!');
  console.log(`   📊 Logged in as: ${client.user.tag}`);
  console.log(`   🏠 Serving ${client.guilds.cache.size} guild(s)`);
  
  // Load rules from the Rules/ directory
  const rulesLoaded = await rulesHandler.loadRules();
  if (rulesLoaded) {
    console.log('📋 Successfully loaded official rules documents');
  } else {
    console.error('❌ Failed to load rules - bot will have limited functionality');
  }
  
  // Test OpenAI connection
  const openAIConnected = await rulesHandler.testOpenAIConnection();
  console.log(`   🤖 OpenAI Connection: ${openAIConnected ? '✅ Active' : '❌ Failed'}`);
  
  // Set bot activity
  client.user.setActivity('Lucid City RP Rules | Tag me for help!', { type: ActivityType.Watching });
});

// Main message handler
client.on('messageCreate', async message => {
  if (message.author.bot || message.system) return;

  const userId = message.author.id;
  const channelId = message.channel.id;
  const isBotMentioned = message.mentions.has(client.user);
  const hasActiveConversation = activeConversations.has(userId);

  try {
    // Handle conversation end command
    if (hasActiveConversation && message.content.trim().toLowerCase() === 'end') {
      const session = activeConversations.get(userId);
      session.end('manual');
      return await message.reply('Conversation ended. Tag me again if you need more help with Lucid City RP!');
    }

    // Handle quick rule lookups (!rule command)
    if (message.content.startsWith('!rule ') || message.content.match(/^![cC]\d{2}\.\d{2}/)) {
      await handleQuickRuleLookup(message);
      return;
    }

    // Handle crash report formatting help
    if (message.content.toLowerCase().includes('crash format') || 
        (message.channel.id === SERVER_INFO.channels.gameCrashes.replace(/[<>#]/g, '') && 
         message.content.toLowerCase().includes('help'))) {
      await handleCrashFormatHelp(message);
      return;
    }

    // Start new conversation when bot is mentioned
    if (isBotMentioned && !hasActiveConversation) {
      await startNewConversation(message, userId, channelId);
      return;
    }

    // Continue existing conversation
    if (hasActiveConversation && !isBotMentioned) {
      await continueConversation(message, userId);
      return;
    }

    // Handle mention while conversation is active in different channel
    if (isBotMentioned && hasActiveConversation) {
      const session = activeConversations.get(userId);
      if (session.channelId !== channelId) {
        await message.reply(`I'm already chatting with you in <#${session.channelId}>. Continue our conversation there, or type "end" there to start a new one here.`);
      }
      return;
    }

  } catch (error) {
    console.error('❌ Message handling error:', error);
    
    try {
      await message.reply('I encountered an error processing your message. Please try again or contact staff in ' + SERVER_INFO.channels.communitySupport + ' if this persists.');
    } catch (replyError) {
      console.error('❌ Failed to send error message:', replyError);
    }
  }
});

async function startNewConversation(message, userId, channelId) {
  const session = new ConversationSession(userId, channelId);
  activeConversations.set(userId, session);
  
  const userMessage = message.content.replace(`<@${client.user.id}>`, '').trim();
  session.addMessage('user', userMessage);
  
  await message.channel.sendTyping();
  
  const response = await rulesHandler.processQuery(userMessage, session.getHistory(), {
    isNewConversation: true,
    userName: message.author.displayName || message.author.username,
    guildName: message.guild?.name || 'Direct Message',
    channelId: channelId
  });
  
  session.addMessage('assistant', response);
  
  const replyContent = `${response}\n\n*Type "end" to finish our conversation, or continue asking about Lucid City RP rules and support.*`;
  await message.reply(replyContent);
}

async function continueConversation(message, userId) {
  const session = activeConversations.get(userId);
  
  if (session.channelId !== message.channel.id) {
    return; // Ignore messages in other channels
  }
  
  session.addMessage('user', message.content);
  
  await message.channel.sendTyping();
  
  const response = await rulesHandler.processQuery(message.content, session.getHistory(), {
    isNewConversation: false,
    userName: message.author.displayName || message.author.username,
    guildName: message.guild?.name || 'Direct Message',
    channelId: message.channel.id
  });
  
  session.addMessage('assistant', response);
  await message.reply(response);
}

async function handleQuickRuleLookup(message) {
  await message.channel.sendTyping();
  
  const query = message.content.replace(/^!/, '').trim();
  const result = await rulesHandler.quickRuleLookup(query);
  
  if (result.found) {
    const embed = new EmbedBuilder()
      .setTitle(`${result.rule.code} - ${result.rule.title}`)
      .setDescription(result.rule.description)
      .setColor(0x3498db)
      .addFields([
        {
          name: 'Section',
          value: result.rule.section || 'N/A',
          inline: true
        },
        {
          name: 'Infractions',
          value: result.rule.infractions || 'See full rule',
          inline: true
        },
        {
          name: 'Type',
          value: result.rule.type === 'community' ? 'Community Rule' : 'Crew Rule',
          inline: true
        }
      ]);
    
    if (result.rule.examples && result.rule.examples.length > 0) {
      embed.addFields([{
        name: 'Examples',
        value: result.rule.examples.slice(0, 2).join('\n• '),
        inline: false
      }]);
    }
    
    await message.reply({ 
      embeds: [embed],
      content: 'Tag me for detailed discussion about this rule or related questions.'
    });
  } else {
    await message.reply('Rule not found. Tag me to start a conversation for help finding what you need, or check ' + SERVER_INFO.channels.rules + ' for the complete rules list.');
  }
}

async function handleCrashFormatHelp(message) {
  const embed = new EmbedBuilder()
    .setTitle('Game Crash Report Format')
    .setDescription('Use this format when reporting crashes in ' + SERVER_INFO.channels.gameCrashes)
    .setColor(0xe74c3c)
    .addFields([
      {
        name: 'Required Format',
        value: `\`\`\`
Character Name: [Your character's name]
Date and Time: [When the crash occurred]
Location of Crash: [Where in the city]
Scene currently involved in: [What you were doing]
Estimated time to return to scene: [How long to reconnect]
\`\`\``,
        inline: false
      },
      {
        name: 'Important Notes',
        value: '• This channel is ONLY for notifying others during active scenes\n• For crash troubleshooting, ask in ' + SERVER_INFO.channels.communitySupport + '\n• Technical support should go to staff through ' + SERVER_INFO.channels.waitingRoom,
        inline: false
      }
    ]);
  
  await message.reply({ embeds: [embed] });
}

// Guild join handler
client.on('guildCreate', guild => {
  console.log(`📈 Joined new guild: ${guild.name} (${guild.id})`);
  
  if (guild.systemChannel) {
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('Lucid City RP Community Assistant')
      .setDescription('I\'m here to help with Lucid City RP rules, support, and guidance!')
      .setColor(0x3498db)
      .addFields([
        {
          name: 'How to Use Me',
          value: '• **Tag me** (@' + client.user.displayName + ') to start a conversation\n• **Quick lookup:** `!rule [search]` or `!C##.##` for instant rule info\n• **Type "end"** to finish any conversation',
          inline: false
        },
        {
          name: 'What I Can Help With',
          value: '• Server rules and infractions\n• Community support guidance\n• Ban appeal process\n• Basic technical support\n• Channel navigation',
          inline: false
        },
        {
          name: 'Important Channels',
          value: `• Rules: ${SERVER_INFO.channels.rules}\n• Support: ${SERVER_INFO.channels.communitySupport}\n• Staff Help: ${SERVER_INFO.channels.waitingRoom}\n• Crashes: ${SERVER_INFO.channels.gameCrashes}`,
          inline: false
        },
        {
          name: 'Official Links',
          value: `• Server: \`${SERVER_INFO.connectCommand}\`\n• Discord: ${SERVER_INFO.discordInvite}\n• Ban Appeals: ${SERVER_INFO.banAppealForm}`,
          inline: false
        }
      ])
      .setFooter({ text: 'Ready to help with Lucid City RP!' });

    guild.systemChannel.send({ embeds: [welcomeEmbed] }).catch(() => {
      console.log(`Could not send welcome message to ${guild.name}`);
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  
  for (const [userId, session] of activeConversations) {
    session.end('shutdown');
  }
  
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down...');
  
  for (const [userId, session] of activeConversations) {
    session.end('shutdown');
  }
  
  client.destroy();
  process.exit(0);
});

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  
  for (const [userId, session] of activeConversations) {
    session.end('error');
  }
  
  client.destroy();
  process.exit(1);
});

// Login to Discord
console.log('🚀 Starting Lucid City RP Community Assistant...');
console.log('📋 Loading official rules documents...');

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('✅ Successfully logged in to Discord');
    console.log('🌟 Ready to help with Lucid City RP rules and support!');
  })
  .catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
  });