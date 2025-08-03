// test-accuracy.js - Complete test suite for rule accuracy improvements
require('dotenv').config();

// Handle missing modules gracefully during testing
let correctedGptHandler, ruleAccuracyEnhancer;

try {
  correctedGptHandler = require('./utils/correctedGPTHandler');
} catch (error) {
  console.warn('⚠️ correctedGPTHandler not found, using fallback');
  try {
    correctedGptHandler = require('./utils/enhancedConversationalGPTHandler');
  } catch (fallbackError) {
    console.warn('⚠️ enhancedConversationalGPTHandler not found either');
    correctedGptHandler = null;
  }
}

try {
  ruleAccuracyEnhancer = require('./utils/ruleAccuracyEnhancer');
} catch (error) {
  console.warn('⚠️ ruleAccuracyEnhancer not found, creating minimal fallback');
  ruleAccuracyEnhancer = {
    determineExactRule: () => null,
    generateTechnicalSupport: () => null
  };
}

class AccuracyTestSuite {
  constructor() {
    // Test cases that previously failed in the quiz
    this.criticalTestCases = [
      {
        id: 1,
        query: "A player is threatened by three armed individuals and pulls out their weapon to fight",
        expectedRule: "C04.03",
        expectedJudgment: "NOT PERMISSIBLE",
        expectedReasoning: "must comply when outgunned"
      },
      {
        id: 8,
        query: "A player is repeatedly running over downed bodies without roleplay reason",
        expectedRule: "C03.03",
        expectedJudgment: "VIOLATION",
        expectedReasoning: "excessive toxicity"
      },
      {
        id: 9,
        query: "Can a player participate in a Casino Heist with 14 crew members",
        expectedRule: "C06.01", 
        expectedJudgment: "NOT ALLOWED",
        expectedReasoning: "maximum 6 people"
      },
      {
        id: 25,
        query: "Is it acceptable to mention infraction points within roleplay scenarios",
        expectedRule: "C02.02",
        expectedJudgment: "VIOLATION",
        expectedReasoning: "breaking character"
      },
      {
        id: 26,
        query: "A player picks up another player and runs around for 20 minutes without roleplay purpose",
        expectedRule: "C03.03",
        expectedJudgment: "VIOLATION", 
        expectedReasoning: "excessive toxicity"
      }
    ];

    // Additional accuracy test cases
    this.additionalTests = [
      {
        query: "How many people can I rob a store with if I'm not in a crew",
        expectedRule: "C06.01",
        expectedAnswer: "6 people maximum"
      },
      {
        query: "What is the combat timer after being downed",
        expectedRule: "C04.06",
        expectedAnswer: "30 minutes"
      },
      {
        query: "Can crew members roam with 16 people",
        expectedRule: "C11.01", 
        expectedAnswer: "Yes, 16 people for crews"
      },
      {
        query: "Using Discord to communicate during roleplay",
        expectedRule: "C07.03",
        expectedAnswer: "Meta gaming violation"
      }
    ];

    this.results = {
      critical: { passed: 0, total: 0 },
      additional: { passed: 0, total: 0 },
      ambiguityCount: 0,
      decisiveCount: 0
    };
  }

  async runFullTest() {
    console.log('🧪 LUCID CITY RP RULE ACCURACY TEST SUITE');
    console.log('=' .repeat(60));
    console.log('Target: Fix critical failures and achieve 90%+ accuracy\n');

    // Check if we have the required modules
    if (!correctedGptHandler) {
      console.log('❌ Cannot run AI tests - GPT handler not available');
      console.log('💡 Create utils/correctedGPTHandler.js or utils/enhancedConversationalGPTHandler.js first');
      return this.generateBasicReport();
    }

    // Test 1: Critical Rule Mapping
    console.log('🎯 CRITICAL RULE MAPPING TEST');
    console.log('-'.repeat(40));
    await this.testCriticalMappings();

    // Test 2: Decisiveness Check
    console.log('\n⚡ DECISIVENESS TEST');
    console.log('-'.repeat(40));
    await this.testDecisiveness();

    // Test 3: Additional Accuracy Tests
    console.log('\n📋 ADDITIONAL ACCURACY TESTS');
    console.log('-'.repeat(40));
    await this.testAdditionalAccuracy();

    // Test 4: FiveM Technical Support
    console.log('\n🔧 FIVEM TECHNICAL SUPPORT TEST');
    console.log('-'.repeat(40));
    this.testTechnicalSupport();

    // Final Report
    return this.generateFinalReport();
  }

  async testCriticalMappings() {
    this.results.critical.total = this.criticalTestCases.length;
    
    for (const testCase of this.criticalTestCases) {
      console.log(`\nTest ${testCase.id}: ${testCase.query.substring(0, 60)}...`);
      
      try {
        // Test critical rule mapping if available
        if (ruleAccuracyEnhancer && typeof ruleAccuracyEnhancer.determineExactRule === 'function') {
          const criticalResult = ruleAccuracyEnhancer.determineExactRule(testCase.query);
          
          if (criticalResult) {
            const ruleMatch = criticalResult.code === testCase.expectedRule;
            const judgmentMatch = criticalResult.judgment.includes(testCase.expectedJudgment);
            const reasoningMatch = criticalResult.reasoning.toLowerCase().includes(testCase.expectedReasoning.toLowerCase());
            
            console.log(`   🎯 Critical Mapping: ${criticalResult.code} - ${criticalResult.title}`);
            console.log(`   📝 Judgment: ${criticalResult.judgment}`);
            console.log(`   ✅ Rule Match: ${ruleMatch ? 'PASS' : 'FAIL'}`);
            console.log(`   ✅ Judgment Match: ${judgmentMatch ? 'PASS' : 'FAIL'}`);
            console.log(`   ✅ Reasoning Match: ${reasoningMatch ? 'PASS' : 'FAIL'}`);
            
            if (ruleMatch && judgmentMatch && reasoningMatch) {
              this.results.critical.passed++;
              console.log(`   🏆 OVERALL: PASS`);
            } else {
              console.log(`   ❌ OVERALL: FAIL`);
            }
          } else {
            console.log(`   ❌ No critical mapping found - FAIL`);
          }
        } else {
          console.log(`   ⚠️ Critical mapping system not available`);
        }

        // Test AI response for comparison
        if (correctedGptHandler && process.env.OPENAI_API_KEY) {
          try {
            const aiResponse = await correctedGptHandler.handleConversation(testCase.query, [], {
              isNewConversation: true,
              userName: 'TestUser',
              guildName: 'Test Server',
              guildId: 'test'
            });
            
            const isDecisive = !this.containsAmbiguousLanguage(aiResponse);
            const mentionsExpectedRule = aiResponse.includes(testCase.expectedRule);
            
            console.log(`   🤖 AI Decisive: ${isDecisive ? 'YES' : 'NO'}`);
            console.log(`   📋 Mentions Expected Rule: ${mentionsExpectedRule ? 'YES' : 'NO'}`);
            
            if (isDecisive) this.results.decisiveCount++;
            if (!isDecisive) this.results.ambiguityCount++;
            
            // Show a preview of the response
            console.log(`   💬 AI Response Preview: ${aiResponse.substring(0, 100)}...`);
            
          } catch (aiError) {
            console.log(`   ❌ AI Error: ${aiError.message}`);
          }
        } else {
          console.log(`   ⚠️ AI testing skipped (no API key or handler)`);
        }
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
  }

  async testDecisiveness() {
    const ambiguousQueries = [
      "What happens if I break this rule?",
      "Is this allowed in roleplay?", 
      "Can I do this action?"
    ];

    for (const query of ambiguousQueries) {
      console.log(`\nTesting decisiveness: "${query}"`);
      
      try {
        if (correctedGptHandler && process.env.OPENAI_API_KEY) {
          const response = await correctedGptHandler.handleConversation(query, [], {
            isNewConversation: true,
            userName: 'TestUser',
            guildName: 'Test Server',
            guildId: 'test'
          });
          
          const isDecisive = !this.containsAmbiguousLanguage(response);
          console.log(`   Result: ${isDecisive ? '✅ DECISIVE' : '❌ AMBIGUOUS'}`);
          
          if (response.length > 150) {
            console.log(`   Preview: ${response.substring(0, 150)}...`);
          } else {
            console.log(`   Full: ${response}`);
          }
          
          if (isDecisive) {
            this.results.decisiveCount++;
          } else {
            this.results.ambiguityCount++;
            console.log(`   🚨 Contains ambiguous language!`);
          }
        } else {
          console.log(`   ⚠️ Skipped (no AI handler or API key)`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
  }

  async testAdditionalAccuracy() {
    this.results.additional.total = this.additionalTests.length;
    
    for (const test of this.additionalTests) {
      console.log(`\nTesting: "${test.query}"`);
      
      try {
        if (correctedGptHandler && process.env.OPENAI_API_KEY) {
          const response = await correctedGptHandler.handleConversation(test.query, [], {
            isNewConversation: true,
            userName: 'TestUser',
            guildName: 'Test Server',
            guildId: 'test'
          });
          
          const mentionsExpectedRule = response.includes(test.expectedRule);
          const containsExpectedAnswer = response.toLowerCase().includes(test.expectedAnswer.toLowerCase());
          const isDecisive = !this.containsAmbiguousLanguage(response);
          
          console.log(`   📋 Expected Rule (${test.expectedRule}): ${mentionsExpectedRule ? '✅ FOUND' : '❌ MISSING'}`);
          console.log(`   💬 Expected Answer: ${containsExpectedAnswer ? '✅ FOUND' : '❌ MISSING'}`);
          console.log(`   ⚡ Decisive: ${isDecisive ? '✅ YES' : '❌ NO'}`);
          
          if (mentionsExpectedRule && containsExpectedAnswer && isDecisive) {
            this.results.additional.passed++;
            console.log(`   🏆 OVERALL: PASS`);
          } else {
            console.log(`   ❌ OVERALL: FAIL`);
          }
          
          console.log(`   📝 Response: ${response.substring(0, 200)}...`);
        } else {
          console.log(`   ⚠️ Skipped (no AI handler or API key)`);
        }
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
  }

  testTechnicalSupport() {
    const technicalIssues = [
      'My game keeps crashing',
      'I can\'t connect to the server',
      'FiveM won\'t start',
      'Getting connection errors'
    ];

    for (const issue of technicalIssues) {
      console.log(`\nTesting technical support: "${issue}"`);
      
      try {
        if (ruleAccuracyEnhancer && typeof ruleAccuracyEnhancer.generateTechnicalSupport === 'function') {
          const technicalSupport = ruleAccuracyEnhancer.generateTechnicalSupport(issue);
          
          if (technicalSupport) {
            console.log(`   ✅ Technical support provided`);
            console.log(`   🔧 Type: ${technicalSupport.type}`);
            console.log(`   📋 Steps: ${technicalSupport.solution.split('\n').length} steps`);
            console.log(`   📝 Note: ${technicalSupport.note}`);
          } else {
            console.log(`   ❌ No technical support detected`);
          }
        } else {
          console.log(`   ⚠️ Technical support system not available`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
  }

  containsAmbiguousLanguage(text) {
    const ambiguousPhrases = [
      'could be seen as',
      'might be considered',
      'may be viewed as', 
      'potentially violates',
      'depending on the circumstances',
      'it would depend',
      'could be considered',
      'might violate'
    ];

    const lowerText = text.toLowerCase();
    return ambiguousPhrases.some(phrase => lowerText.includes(phrase));
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL ACCURACY REPORT');
    console.log('='.repeat(60));
    
    // Critical Tests Results
    const criticalAccuracy = this.results.critical.total > 0 ? 
      Math.round((this.results.critical.passed / this.results.critical.total) * 100) : 0;
    
    console.log(`\n🎯 CRITICAL RULE MAPPING:`);
    console.log(`   Passed: ${this.results.critical.passed}/${this.results.critical.total}`);
    console.log(`   Accuracy: ${criticalAccuracy}%`);
    console.log(`   Status: ${criticalAccuracy >= 90 ? '✅ EXCELLENT' : criticalAccuracy >= 75 ? '⚠️ GOOD' : '❌ NEEDS WORK'}`);
    
    // Additional Tests Results
    const additionalAccuracy = this.results.additional.total > 0 ?
      Math.round((this.results.additional.passed / this.results.additional.total) * 100) : 0;
    
    console.log(`\n📋 ADDITIONAL ACCURACY TESTS:`);
    console.log(`   Passed: ${this.results.additional.passed}/${this.results.additional.total}`);
    console.log(`   Accuracy: ${additionalAccuracy}%`);
    console.log(`   Status: ${additionalAccuracy >= 90 ? '✅ EXCELLENT' : additionalAccuracy >= 75 ? '⚠️ GOOD' : '❌ NEEDS WORK'}`);
    
    // Decisiveness Results
    const totalResponses = this.results.decisiveCount + this.results.ambiguityCount;
    const decisivenessPercent = totalResponses > 0 ?
      Math.round((this.results.decisiveCount / totalResponses) * 100) : 0;
    
    console.log(`\n⚡ DECISIVENESS ANALYSIS:`);
    console.log(`   Decisive Responses: ${this.results.decisiveCount}`);
    console.log(`   Ambiguous Responses: ${this.results.ambiguityCount}`);
    console.log(`   Decisiveness Rate: ${decisivenessPercent}%`);
    console.log(`   Status: ${decisivenessPercent >= 95 ? '✅ EXCELLENT' : decisivenessPercent >= 80 ? '⚠️ GOOD' : '❌ NEEDS WORK'}`);
    
    // Overall Assessment
    const overallAccuracy = (this.results.critical.total + this.results.additional.total) > 0 ?
      Math.round(((this.results.critical.passed + this.results.additional.passed) / 
      (this.results.critical.total + this.results.additional.total)) * 100) : 0;
    
    console.log(`\n🏆 OVERALL ASSESSMENT:`);
    console.log(`   Combined Accuracy: ${overallAccuracy}%`);
    console.log(`   Decisiveness: ${decisivenessPercent}%`);
    
    if (overallAccuracy >= 90 && decisivenessPercent >= 95) {
      console.log(`   🌟 STATUS: EXCELLENT - Ready for production!`);
    } else if (overallAccuracy >= 80 && decisivenessPercent >= 80) {
      console.log(`   ⚠️  STATUS: GOOD - Minor improvements needed`);
    } else {
      console.log(`   ❌ STATUS: NEEDS WORK - Significant improvements required`);
    }
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    if (criticalAccuracy < 90) {
      console.log(`   • Enhance critical rule mappings in ruleAccuracyEnhancer.js`);
    }
    
    if (decisivenessPercent < 95) {
      console.log(`   • Strengthen system prompt to eliminate ambiguous language`);
      console.log(`   • Add more validation checks for decisive responses`);
    }
    
    if (additionalAccuracy < 90) {
      console.log(`   • Improve rule search accuracy in enhancedRulesParser.js`);
      console.log(`   • Add more concept mappings for edge cases`);
    }
    
    console.log(`\n📈 COMPARISON TO QUIZ RESULTS:`);
    console.log(`   Previous Bot Accuracy: 78.8% (C+/B-)`);
    console.log(`   Current System Accuracy: ${overallAccuracy}%`);
    
    if (overallAccuracy > 78.8) {
      console.log(`   Improvement: +${(overallAccuracy - 78.8).toFixed(1)}%`);
    } else {
      console.log(`   Change: ${(overallAccuracy - 78.8).toFixed(1)}%`);
    }
    
    if (overallAccuracy >= 90) {
      console.log(`   🎯 TARGET ACHIEVED: 90%+ accuracy reached!`);
    } else {
      console.log(`   🎯 TARGET: ${90 - overallAccuracy}% improvement needed for 90%+ goal`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
      criticalAccuracy,
      additionalAccuracy,
      overallAccuracy,
      decisivenessPercent,
      passed: overallAccuracy >= 90 && decisivenessPercent >= 95
    };
  }

  generateBasicReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BASIC SYSTEM CHECK REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🔧 SYSTEM STATUS:`);
    console.log(`   GPT Handler: ${correctedGptHandler ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Rule Accuracy Enhancer: ${ruleAccuracyEnhancer ? '✅ Available' : '❌ Missing'}`);
    console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    
    console.log(`\n💡 NEXT STEPS:`);
    if (!correctedGptHandler) {
      console.log(`   • Create utils/correctedGPTHandler.js`);
    }
    if (!ruleAccuracyEnhancer.determineExactRule || ruleAccuracyEnhancer.determineExactRule() === null) {
      console.log(`   • Create utils/ruleAccuracyEnhancer.js`);
    }
    if (!process.env.OPENAI_API_KEY) {
      console.log(`   • Add OPENAI_API_KEY to .env file`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
      criticalAccuracy: 0,
      additionalAccuracy: 0,
      overallAccuracy: 0,
      decisivenessPercent: 0,
      passed: false
    };
  }

  async runQuickTest() {
    console.log('⚡ QUICK ACCURACY TEST');
    console.log('-'.repeat(30));
    
    if (!ruleAccuracyEnhancer || typeof ruleAccuracyEnhancer.determineExactRule !== 'function') {
      console.log('❌ Cannot run quick test - ruleAccuracyEnhancer not available');
      return false;
    }
    
    // Test the top 3 critical scenarios
    const quickTests = this.criticalTestCases.slice(0, 3);
    let passed = 0;
    
    for (const test of quickTests) {
      console.log(`\nTesting: ${test.query.substring(0, 50)}...`);
      
      try {
        const criticalResult = ruleAccuracyEnhancer.determineExactRule(test.query);
        const isCorrect = criticalResult && criticalResult.code === test.expectedRule;
        
        console.log(`Expected: ${test.expectedRule}, Got: ${criticalResult?.code || 'None'}`);
        console.log(`Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
        
        if (isCorrect) passed++;
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
      }
    }
    
    const accuracy = Math.round((passed / quickTests.length) * 100);
    console.log(`\n🎯 Quick Test Accuracy: ${accuracy}% (${passed}/${quickTests.length})`);
    
    return accuracy >= 90;
  }

  async runInteractiveTest() {
    console.log('🎮 INTERACTIVE ACCURACY TEST');
    console.log('Test the bot with your own queries');
    console.log('Type "exit" to quit\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = () => {
      rl.question('Enter test query: ', async (query) => {
        if (query.toLowerCase() === 'exit') {
          rl.close();
          return;
        }
        
        console.log(`\n🔍 Testing: "${query}"`);
        
        try {
          // Test critical mapping
          if (ruleAccuracyEnhancer && typeof ruleAccuracyEnhancer.determineExactRule === 'function') {
            const criticalResult = ruleAccuracyEnhancer.determineExactRule(query);
            if (criticalResult) {
              console.log(`🎯 Critical Mapping Found:`);
              console.log(`   Rule: ${criticalResult.code} - ${criticalResult.title}`);
              console.log(`   Judgment: ${criticalResult.judgment}`);
              console.log(`   Reasoning: ${criticalResult.reasoning}`);
            } else {
              console.log(`🎯 No critical mapping found`);
            }
          }
          
          // Test AI response
          if (correctedGptHandler && process.env.OPENAI_API_KEY) {
            console.log(`\n🤖 AI Response:`);
            const response = await correctedGptHandler.handleConversation(query, [], {
              isNewConversation: true,
              userName: 'TestUser',
              guildName: 'Test Server',
              guildId: 'test'
            });
            
            console.log(response);
            
            const isDecisive = !this.containsAmbiguousLanguage(response);
            console.log(`\n⚡ Analysis:`);
            console.log(`   Decisive: ${isDecisive ? '✅ YES' : '❌ NO'}`);
            console.log(`   Length: ${response.length} characters`);
            
            if (!isDecisive) {
              console.log(`   🚨 Contains ambiguous language!`);
            }
          } else {
            console.log(`\n⚠️ AI testing not available (missing handler or API key)`);
          }
          
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('\n' + '-'.repeat(50));
        askQuestion();
      });
    };

    askQuestion();
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new AccuracyTestSuite();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    tester.runQuickTest().then(passed => {
      console.log(`\n${passed ? '🎯 QUICK TEST PASSED' : '❌ QUICK TEST FAILED'}`);
      process.exit(passed ? 0 : 1);
    }).catch(error => {
      console.error('❌ Quick test failed:', error);
      process.exit(1);
    });
  } else if (args.includes('--interactive') || args.includes('-i')) {
    tester.runInteractiveTest();
  } else {
    tester.runFullTest().then(results => {
      console.log('\n🏁 Test suite completed');
      process.exit(results.passed ? 0 : 1);
    }).catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
  }
}

module.exports = AccuracyTestSuite;