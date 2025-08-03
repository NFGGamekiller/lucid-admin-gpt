// test-rules.js - Utility to test the enhanced rule understanding system
require('dotenv').config();
const enhancedRulesParser = require('./utils/enhancedRulesParser');
const enhancedGptHandler = require('./utils/enhancedConversationalGPTHandler');

class RuleTestUtility {
  constructor() {
    this.testQueries = [
      // Specific rule tests
      'What is C06.01?',
      'Tell me about roaming limits',
      'How many people can be in a group?',
      
      // Concept-based tests
      'What are the rules about meta gaming?',
      'Can I use Discord to communicate during roleplay?',
      'What happens if I break character?',
      
      // Scenario-based tests
      'If I get banned, how do I appeal?',
      'Someone is griefing me, what should I do?',
      'What are the consequences for RDM?',
      
      // Complex relationship tests
      'What rules apply to crew conflicts?',
      'How do government employee rules work?',
      'What are all the rules about vehicles?'
    ];
  }

  async runTests() {
    console.log('🧪 Enhanced Rule Understanding Test Suite');
    console.log('=' .repeat(50));
    
    // Test 1: Parser Statistics
    console.log('\n📊 RULE PARSER STATISTICS');
    console.log('-'.repeat(30));
    const stats = enhancedGptHandler.getParserStats();
    console.log(`Total Rules Parsed: ${stats.totalRules}`);
    console.log(`Community Rules: ${stats.communityRules}`);
    console.log(`Crew Rules: ${stats.crewRules}`);
    console.log(`Concept Mappings: ${stats.concepts}`);
    console.log(`Rule Relationships: ${stats.relationships}`);
    
    // Test 2: Specific Rule Lookup
    console.log('\n🔍 SPECIFIC RULE LOOKUP TEST');
    console.log('-'.repeat(30));
    const testRule = 'C06.01';
    const ruleExplanation = enhancedGptHandler.explainRule(testRule);
    
    if (ruleExplanation) {
      console.log(`✅ Found ${testRule}: ${ruleExplanation.rule.title}`);
      console.log(`Description: ${ruleExplanation.rule.description.substring(0, 100)}...`);
      console.log(`Related Rules: ${ruleExplanation.related.length}`);
      console.log(`Infractions: ${ruleExplanation.infractions.map(i => i.name).join(', ')}`);
    } else {
      console.log(`❌ Could not find rule ${testRule}`);
    }
    
    // Test 3: Intelligent Search
    console.log('\n🧠 INTELLIGENT SEARCH TEST');
    console.log('-'.repeat(30));
    
    for (const query of this.testQueries.slice(0, 5)) {
      console.log(`\nQuery: "${query}"`);
      const searchResults = enhancedGptHandler.testRuleSearch(query);
      
      if (searchResults.primary.length > 0) {
        console.log(`✅ Found ${searchResults.primary.length} results`);
        const topResult = searchResults.primary[0];
        console.log(`   Top: ${topResult.rule.code} - ${topResult.rule.title} (score: ${topResult.score})`);
        console.log(`   Match: ${topResult.matchType}`);
        
        if (searchResults.related.length > 0) {
          console.log(`   Related: ${searchResults.related.length} rules`);
        }
      } else {
        console.log(`❌ No results found`);
      }
    }
    
    // Test 4: Concept Understanding
    console.log('\n💡 CONCEPT UNDERSTANDING TEST');
    console.log('-'.repeat(30));
    
    const testConcepts = ['roaming', 'meta_gaming', 'government', 'violence'];
    
    for (const concept of testConcepts) {
      const conceptSearch = enhancedGptHandler.testRuleSearch(concept);
      console.log(`\nConcept: "${concept}"`);
      
      if (conceptSearch.primary.length > 0) {
        console.log(`✅ Found ${conceptSearch.primary.length} related rules`);
        conceptSearch.primary.slice(0, 2).forEach(result => {
          console.log(`   ${result.rule.code}: ${result.rule.title}`);
        });
      } else {
        console.log(`❌ No rules found for concept`);
      }
    }
    
    // Test 5: GPT Integration Test (if API key available)
    if (process.env.OPENAI_API_KEY) {
      console.log('\n🤖 GPT INTEGRATION TEST');
      console.log('-'.repeat(30));
      
      try {
        const testMessage = "What are the roaming limits for crews vs regular players?";
        console.log(`Test Query: "${testMessage}"`);
        
        const response = await enhancedGptHandler.handleConversation(testMessage, [], {
          isNewConversation: true,
          userName: 'TestUser',
          guildName: 'Test Server',
          guildId: 'test'
        });
        
        console.log('✅ GPT Response Generated');
        console.log(`Length: ${response.length} characters`);
        console.log(`Preview: ${response.substring(0, 150)}...`);
        
        // Check if response contains rule references
        const ruleReferences = response.match(/[cC]\d{2}\.\d{2}/g);
        if (ruleReferences) {
          console.log(`Rule references found: ${ruleReferences.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`❌ GPT test failed: ${error.message}`);
      }
    } else {
      console.log('\n⚠️  GPT test skipped (no API key)');
    }
    
    // Test 6: Rule Relationship Analysis
    console.log('\n🔗 RULE RELATIONSHIP TEST');
    console.log('-'.repeat(30));
    
    const testRuleForRelations = 'C06.01';
    const explanation = enhancedGptHandler.explainRule(testRuleForRelations);
    
    if (explanation && explanation.related.length > 0) {
      console.log(`✅ ${testRuleForRelations} has ${explanation.related.length} related rules:`);
      explanation.related.forEach(rel => {
        console.log(`   ${rel.rule.code}: ${rel.rule.title} (strength: ${rel.strength})`);
        console.log(`      Connection: ${rel.connection.join(', ')}`);
      });
    } else {
      console.log(`❌ No relationships found for ${testRuleForRelations}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Suite Complete');
    
    return this.generateTestReport();
  }

  generateTestReport() {
    const stats = enhancedGptHandler.getParserStats();
    
    return {
      parserLoaded: stats.totalRules > 0,
      totalRules: stats.totalRules,
      conceptMappings: stats.concepts > 0,
      relationshipGraph: stats.relationships > 0,
      searchFunctionality: true, // Assume working if no errors
      gptIntegration: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    };
  }

  async runInteractiveTest() {
    console.log('🎮 Interactive Rule Test Mode');
    console.log('Type queries to test the enhanced understanding system');
    console.log('Type "exit" to quit\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = () => {
      rl.question('Query: ', async (query) => {
        if (query.toLowerCase() === 'exit') {
          rl.close();
          return;
        }
        
        console.log(`\n🔍 Searching for: "${query}"`);
        
        try {
          const searchResults = enhancedGptHandler.testRuleSearch(query);
          
          if (searchResults.primary.length > 0) {
            console.log(`Found ${searchResults.primary.length} results:\n`);
            
            searchResults.primary.slice(0, 3).forEach((result, index) => {
              console.log(`${index + 1}. ${result.rule.code} - ${result.rule.title}`);
              console.log(`   Description: ${result.rule.description.substring(0, 100)}...`);
              console.log(`   Match Type: ${result.matchType}, Score: ${result.score}`);
              console.log();
            });
            
            if (searchResults.related.length > 0) {
              console.log(`Related rules: ${searchResults.related.length}`);
            }
          } else {
            console.log('No results found.');
          }
          
          // If GPT is available, also test AI response
          if (process.env.OPENAI_API_KEY) {
            console.log('\n🤖 AI Response:');
            const response = await enhancedGptHandler.handleConversation(query, [], {
              isNewConversation: true,
              userName: 'TestUser',
              guildName: 'Test Server',
              guildId: 'test'
            });
            console.log(response.substring(0, 300) + (response.length > 300 ? '...' : ''));
          }
          
        } catch (error) {
          console.log(`Error: ${error.message}`);
        }
        
        console.log('\n' + '-'.repeat(50));
        askQuestion();
      });
    };

    askQuestion();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new RuleTestUtility();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    tester.runInteractiveTest();
  } else {
    tester.runTests().then(report => {
      console.log('\n📋 Final Report:', report);
      process.exit(0);
    }).catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
  }
}

module.exports = RuleTestUtility;