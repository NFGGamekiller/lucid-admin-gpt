require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const gptHandler = require('./utils/conversationalGPTHandler');
const rulesDB = require('./utils/rulesDatabase');

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Create client with necessary intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

// Active conversations tracker
const activeConversations = new Map();
const CONVERSATION_TIMEOUT = 60000; // 60 seconds

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
    
    // Keep only last 10 messages to manage token usage
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
    
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`📝 Conversation ended (${reason}) - User: ${this.userId}, Duration: ${duration}s, Messages: ${this.messageHistory.length}`);
    
    activeConversations.delete(this.userId);
    
    // Send timeout message if needed
    if (reason === 'timeout') {
      const channel = client.channels.cache.get(this.channelId);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle('⏰ Conversation Timed Out')
          .setDescription('Our conversation has ended due to inactivity. Feel free to ping me again if you need more help!')
          .setFooter({ text: 'Tip: Type "End" to manually end our conversation anytime' });
        
        channel.send({ embeds: [embed] }).catch(console.error);
      }
    }
  }

  getHistory() {
    return this.messageHistory;
  }
}

// Bot ready event
client.once('ready', () => {
  console.log('🤖 Lucid City RP Community Assistant is online!');
  console.log(`   📊 Logged in as: ${client.user.tag}`);
  console.log(`   🏠 Serving ${client.guilds.cache.size} guild(s)`);
  console.log(`   👥 Ready to help ${client.users.cache.size} user(s)`);
  console.log('   💬 Conversational mode active - ping me to start chatting!');
  
  // Set bot activity
  client.user.setActivity('Ping me for help! | Lucid City RP', { type: ActivityType.Watching });
});

// Handle messages
client.on('messageCreate', async message => {
  // Ignore bot messages and system messages
  if (message.author.bot || message.system) return;

  const userId = message.author.id;
  const channelId = message.channel.id;
  const isBotMentioned = message.mentions.has(client.user);
  const hasActiveConversation = activeConversations.has(userId);

  try {
    // Check if user wants to end conversation
    if (hasActiveConversation && message.content.trim().toLowerCase() === 'end') {
      const session = activeConversations.get(userId);
      session.end('manual');
      
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Conversation Ended')
        .setDescription('Thanks for chatting! I\'m here whenever you need help with Lucid City RP.')
        .setFooter({ text: 'Ping me anytime to start a new conversation!' });
      
      return await message.reply({ embeds: [embed] });
    }

    // Start new conversation if bot is mentioned
    if (isBotMentioned && !hasActiveConversation) {
      const session = new ConversationSession(userId, channelId);
      activeConversations.set(userId, session);
      
      console.log(`💬 New conversation started - User: ${message.author.tag} (${userId}) in ${message.guild?.name || 'DM'}`);
      
      // Add initial message to history
      const userMessage = message.content.replace(`<@${client.user.id}>`, '').trim();
      session.addMessage('user', userMessage);
      
      // Send thinking indicator
      await message.channel.sendTyping();
      
      // Get AI response
      const response = await gptHandler.handleConversation(userMessage, session.getHistory(), {
        isNewConversation: true,
        userName: message.author.displayName || message.author.username,
        guildName: message.guild?.name || 'Direct Message'
      });
      
      session.addMessage('assistant', response);
      
      // Send response with conversation info
      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('🤖 Lucid City RP Assistant')
        .setDescription(response)
        .setFooter({ text: 'I\'m listening to your messages now! Type "End" to finish our conversation.' });
      
      await message.reply({ embeds: [embed] });
      return;
    }

    // Continue existing conversation
    if (hasActiveConversation && !isBotMentioned) {
      const session = activeConversations.get(userId);
      
      // Make sure the message is in the same channel
      if (session.channelId !== channelId) {
        return; // Ignore messages in other channels
      }
      
      session.addMessage('user', message.content);
      
      // Send thinking indicator
      await message.channel.sendTyping();
      
      // Get AI response
      const response = await gptHandler.handleConversation(message.content, session.getHistory(), {
        isNewConversation: false,
        userName: message.author.displayName || message.author.username,
        guildName: message.guild?.name || 'Direct Message'
      });
      
      session.addMessage('assistant', response);
      
      // Send response
      await message.reply(response);
      return;
    }

    // If bot is mentioned but user has active conversation in different channel
    if (isBotMentioned && hasActiveConversation) {
      const session = activeConversations.get(userId);
      if (session.channelId !== channelId) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle('⚠️ Active Conversation')
          .setDescription(`I'm already chatting with you in <#${session.channelId}>! Please continue our conversation there, or type "End" there to start a new one here.`)
          .setFooter({ text: 'I can only have one conversation per user at a time' });
        
        await message.reply({ embeds: [embed] });
      }
      return;
    }

  } catch (error) {
    console.error('❌ Message handling error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Error')
      .setDescription('I encountered an error while processing your message. Please try again or contact staff if the issue persists.')
      .setTimestamp();

    try {
      await message.reply({ embeds: [errorEmbed] });
    } catch (replyError) {
      console.error('❌ Failed to send error message:', replyError);
    }
  }
});

// Handle guild join events
client.on('guildCreate', guild => {
  console.log(`📈 Joined new guild: ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
  
  // Try to send a welcome message to the system channel
  if (guild.systemChannel) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('🤖 Lucid City RP Assistant Has Arrived!')
      .setDescription('Thanks for adding me! I\'m here to help your community with Lucid City RP rules and support.')
      .addFields(
        { name: '💬 How to Use Me', value: '**Just ping me** (@Lucid City RP Assistant) and ask your question!\nI\'ll start a conversation with you and help with rules, procedures, and general questions.', inline: false },
        { name: '🔄 Conversation Control', value: '• **To start:** Ping me with your question\n• **To end:** Type "End" in a message\n• **Auto-timeout:** 60 seconds of inactivity', inline: false },
        { name: '📋 What I Can Help With', value: '• Server rules and explanations\n• Finding the right support channels\n• Roleplay guidance and best practices\n• Appeals and reporting procedures\n• General community questions', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Ping me to start chatting!' });

    guild.systemChannel.send({ embeds: [welcomeEmbed] }).catch(() => {
      console.log(`Could not send welcome message to ${guild.name}`);
    });
  }
});

// Handle guild leave events  
client.on('guildDelete', guild => {
  console.log(`📉 Left guild: ${guild.name} (${guild.id})`);
});

// Clean up conversations on bot shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  console.log(`📊 Active conversations: ${activeConversations.size}`);
  
  // End all active conversations
  for (const [userId, session] of activeConversations) {
    session.end('shutdown');
  }
  
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  
  // End all active conversations
  for (const [userId, session] of activeConversations) {
    session.end('shutdown');
  }
  
  client.destroy();
  process.exit(0);
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('🔄 Attempting graceful shutdown...');
  
  // End all active conversations
  for (const [userId, session] of activeConversations) {
    session.end('error');
  }
  
  client.destroy();
  process.exit(1);
});

// Login to Discord
console.log('🚀 Starting Lucid City RP Community Assistant...');
console.log('💬 Conversational Mode: Ping me to start chatting!');
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('✅ Successfully logged in to Discord');
    console.log('🌟 Ready to have conversations with the Lucid City RP community!');
  })
  .catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
  });