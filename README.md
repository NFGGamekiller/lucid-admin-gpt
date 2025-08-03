# Lucid City RP Community Assistant Bot

An official Discord AI bot for the Lucid City RP community that provides rule assistance, support guidance, and basic technical help.

## 🎯 Purpose

This bot is designed to serve public-facing users of the Lucid City Discord by:
- Answering questions about in-game rules clearly and correctly
- Providing community support information (crash reporting, ban appeals, etc.)
- Redirecting users to proper channels when needed
- Helping players understand rule applications and crew conduct
- Providing limited technical support for FiveM client-side issues

## 🔒 Security & Scope

**CRITICAL**: This bot only references the two official public rules documents:
- `COMMUNITY REGULATORY GUIDELINES AND RULES.txt`
- `CREW REGULATORY GUIDELINES.txt`

The bot **NEVER** references or leaks internal/staff-only documents.

## 📁 Project Structure

```
lucid-city-assistant/
├── index.js                 # Main bot file
├── utils/
│   └── rulesHandler.js      # Rules parsing and AI handling
├── rules/                   # Official rules documents (REQUIRED)
│   ├── COMMUNITY REGULATORY GUIDELINES AND RULES.txt
│   └── CREW REGULATORY GUIDELINES.txt
├── test/
│   └── rulesTest.js         # Test script for rules system
├── package.json
├── .env                     # Environment variables (create from template)
├── .env.template            # Template for environment setup
└── README.md
```

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18.0.0 or higher
- Discord Bot Token
- OpenAI API Key
- The two official rules documents

### 2. Installation

```bash
# Clone or download the project
git clone <repository-url>
cd lucid-city-assistant

# Install dependencies
npm install

# Copy environment template
cp .env.template .env
```

### 3. Configuration

Edit `.env` file with your credentials:

```env
DISCORD_TOKEN=your_discord_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Rules Documents

**CRITICAL**: Place the official rules documents in the `rules/` directory:

```
rules/
├── COMMUNITY REGULATORY GUIDELINES AND RULES.txt
└── CREW REGULATORY GUIDELINES.txt
```

These files must be named exactly as shown above.

### 5. Testing

Run the test script to verify everything is working:

```bash
npm test
```

This will check:
- ✅ Rules documents are loaded correctly
- ✅ Rule parsing is working
- ✅ OpenAI connection is functional
- ✅ Bot can process queries

### 6. Starting the Bot

```bash
npm start
```

## 🤖 Bot Features

### Conversation Mode
- **Tag the bot** (@BotName) to start an intelligent conversation
- **Type "end"** to finish any conversation
- Maintains context within conversations
- 5-minute conversation timeout for inactivity

### Quick Commands
- `!rule [search term]` - Quick rule lookup
- `!C##.##` - Direct rule code lookup (e.g., `!C06.01`)

### What the Bot Helps With

#### Rules & Regulations
- Explains specific rule codes and their applications
- Clarifies infraction categories and consequences
- Helps understand crew vs community rules
- Provides context for rule violations

#### Community Support
- Guides users to proper support channels
- Explains ban appeal process
- Crash reporting format assistance
- Basic technical troubleshooting

#### Channel Navigation
- Redirects users to appropriate channels
- Explains when to use Waiting Room vs Community Support
- Provides proper contact methods for different issues

## 📋 Static Server Information

The bot provides these official links and channels:

- **Discord**: https://discord.gg/LucidCity
- **Connect**: `connect play.lucidcityrp.com`
- **Rules**: <#791819254374465536>
- **Community Support**: <#794297874070241301>
- **Waiting Room**: <#790344631048208435>
- **Game Crashes**: <#847957461603581972>
- **Ban Appeals**: https://forums.lucidcityrp.com/forms/29-20-ban-appeal/

## 🔧 Channel-Specific Guidance

### Waiting Room (`#790344631048208435`)
- Voice channel for staff support
- Used for player reports
- Direct staff assistance

### Community Support (`#794297874070241301`)
- Text channel for general help
- NOT for player reports or ban questions
- Technical support and guidance

### Game Crashes (`#847957461603581972`)
- **ONLY** for notifying others during active scenes
- Specific format required:
  ```
  Character Name: [Your character's name]
  Date and Time: [When the crash occurred]
  Location of Crash: [Where in the city]
  Scene currently involved in: [What you were doing]
  Estimated time to return to scene: [How long to reconnect]
  ```

## 🛠️ Development

### Adding New Rules Documents

To add new official rules documents:

1. Place the document in the `rules/` directory
2. Update `rulesHandler.js` to include the new file
3. Test with `npm test`

### Modifying Responses

The bot's behavior is controlled in `rulesHandler.js`:
- `buildSystemPrompt()` - Controls AI personality and instructions
- `findRelevantRules()` - Determines which rules are relevant to queries
- `extractKeywords()` - Identifies important terms in user messages

### Testing Changes

Always run the test suite after making changes:

```bash
npm test
```

## 📊 Bot Statistics

Use the built-in stats to monitor the rules system:

```javascript
// In the bot console or through a command
const stats = rulesHandler.getRulesStats();
console.log(stats);
```

## 🚨 Troubleshooting

### Common Issues

1. **Rules not loading**
   - Check file names match exactly
   - Verify files are in `rules/` directory
   - Check file permissions

2. **OpenAI errors**
   - Verify API key is correct
   - Check API quota/billing
   - Monitor rate limits

3. **Discord connection issues**
   - Verify bot token
   - Check bot permissions in Discord
   - Ensure bot is invited to server

### Error Codes

- `❌ Missing rules files` - Rules documents not found
- `❌ OpenAI connection failed` - API key or connection issue
- `❌ Failed to parse rules` - Document format issue

## 📝 Support

For issues with the bot:

1. Run `npm test` to diagnose problems
2. Check console logs for specific errors
3. Verify all configuration is correct
4. Contact the development team with specific error messages

## 🔐 Security Notes

- Never commit `.env` files to version control
- Keep OpenAI API keys secure
- Only reference public rules documents
- Monitor for any attempts to access internal information

---

**Ready to help the Lucid City RP community with official rules and support guidance!**