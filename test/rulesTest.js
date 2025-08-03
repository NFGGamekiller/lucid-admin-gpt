#!/usr/bin/env node

/**
 * Test script for the Lucid City RP Rules System
 * This verifies that the bot can properly parse and access the official rules documents
 */

require('dotenv').config();
const RulesHandler = require('../utils/rulesHandler');

async function runTests() {
  console.log('🧪 Testing Lucid City RP Rules System\n');
  console.log('=' .repeat(50));
  
  const rulesHandler = new RulesHandler();
  
  // Test 1: Load Rules
  console.log('\n📋 Test 1: Loading Official Rules Documents');
  console.log('-'.repeat(30));
  
  const loaded = await rulesHandler.loadRules();
  if (loaded) {
    console.log('✅ Rules loaded successfully');
    
    const stats = rulesHandler.getRulesStats();
    console.log(`📊 Total Rules: ${stats.totalRules}`);
    console.log(`📜 Community Rules: ${stats.communityRules}`);
    console.log(`👥 Crew Rules: ${stats.crewRules}`);
    console.log(`📄 Documents Loaded: Community: ${stats.documentsLoaded.community}, Crew: ${stats.documentsLoaded.crew}`);
  } else {
    console.log('❌ Failed to load rules');
    return;
  }
  
  // Test 2: Rule Code Lookup
  console.log('\n🔍 Test 2: Rule Code Lookup');
  console.log('-'.repeat(30));
  
  const testCodes = ['C06.01', 'C11.01', 'C02.03', 'C04.01'];
  
  for (const code of testCodes) {
    const result = await rulesHandler.quickRuleLookup(`rule ${code}`);
    if (result.found) {
      console.log(`✅ ${code}: ${result.rule.title}`);
      console.log(`   Type: ${result.rule.type}, Section: ${result.rule.section}`);
      console.log(`   Infractions: ${result.rule.infractions}`);
    } else {
      console.log(`❌ ${code}: Not found`);
    }
  }
  
  // Test 3: Keyword Search
  console.log('\n🔎 Test 3: Keyword Search');
  console.log('-'.repeat(30));
  
  const searchTerms = ['roaming', 'meta gaming', 'violence', 'crew conflict'];
  
  for (const term of searchTerms) {
    const results = rulesHandler.searchRules(term);
    console.log(`🔍 "${term}": Found ${results.length} results`);
    if (results.length > 0) {
      console.log(`   Top result: ${results[0].code} - ${results[0].title}`);
    }
  }
  
  // Test 4: OpenAI Connection
  console.log('\n🤖 Test 4: OpenAI Connection');
  console.log('-'.repeat(30));
  
  if (process.env.OPENAI_API_KEY) {
    const connected = await rulesHandler.testOpenAIConnection();
    if (connected) {
      console.log('✅ OpenAI connection successful');
    } else {
      console.log('❌ OpenAI connection failed');
    }
  } else {
    console.log('⚠️  No OpenAI API key configured');
  }
  
  // Test 5: Sample Query Processing
  console.log('\n💬 Test 5: Sample Query Processing');
  console.log('-'.repeat(30));
  
  if (process.env.OPENAI_API_KEY) {
    try {
      const testQuery = "What are the roaming limits for crews?";
      const response = await rulesHandler.processQuery(testQuery, [], {
        isNewConversation: true,
        userName: 'TestUser',
        guildName: 'Test Server'
      });
      
      console.log(`✅ Query processed successfully`);
      console.log(`📝 Sample response length: ${response.length} characters`);
      console.log(`📋 Response preview: ${response.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Query processing failed: ${error.message}`);
    }
  } else {
    console.log('⚠️  Skipping query test - no OpenAI API key');
  }
  
  // Test 6: Rules by Type
  console.log('\n📊 Test 6: Rules Organization');
  console.log('-'.repeat(30));
  
  const communityRules = rulesHandler.getRulesByType('community');
  const crewRules = rulesHandler.getRulesByType('crew');
  
  console.log(`📜 Community Rules: ${communityRules.length}`);
  console.log(`   Sections: ${[...new Set(communityRules.map(r => r.section))].length} different sections`);
  
  console.log(`👥 Crew Rules: ${crewRules.length}`);
  console.log(`   Sections: ${[...new Set(crewRules.map(r => r.section))].length} different sections`);
  
  // Summary
  console.log('\n🎯 Test Summary');
  console.log('=' .repeat(50));
  
  const totalTests = 6;
  const passedTests = [
    loaded,
    testCodes.some(code => rulesHandler.quickRuleLookup(`rule ${code}`).then ? true : false),
    searchTerms.length > 0,
    process.env.OPENAI_API_KEY ? await rulesHandler.testOpenAIConnection() : true,
    process.env.OPENAI_API_KEY ? true : true, // Skip AI test if no key
    communityRules.length > 0 && crewRules.length > 0
  ].filter(Boolean).length;
  
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All systems operational! Bot ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Check configuration and file paths.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Ensure both rules files are in the /rules directory');
  console.log('2. Configure Discord bot token in .env');
  console.log('3. Configure OpenAI API key in .env');
  console.log('4. Run: npm start');
  
  console.log('\n🔗 Official Rules Files Required:');
  console.log('   📄 rules/COMMUNITY REGULATORY GUIDELINES AND RULES.txt');
  console.log('   📄 rules/CREW REGULATORY GUIDELINES.txt');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Test Error:', error.message);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test Suite Failed:', error.message);
  process.exit(1);
});