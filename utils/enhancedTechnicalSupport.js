// utils/enhancedTechnicalSupport.js - Advanced FiveM technical support with log analysis

class EnhancedTechnicalSupport {
  constructor() {
    // Enhanced error signature patterns
    this.errorSignatures = {
      'resource_error': {
        patterns: [
          /couldn't start resource/i,
          /failed to start resource/i,
          /resource .+ failed/i,
          /script error in resource/i
        ],
        solution: [
          '**Resource Error Detected**',
          '1. Check if resource is included in server.cfg',
          '2. Verify resource folder structure and fxmanifest.lua',
          '3. Check for missing dependencies in resource',
          '4. Restart server and monitor console for specific errors',
          '5. Remove or disable problematic resource temporarily'
        ],
        category: 'server_resource',
        severity: 'medium'
      },

      'connection_timeout': {
        patterns: [
          /connection timed out/i,
          /failed to connect/i,
          /server not responding/i,
          /timeout.*connecting/i
        ],
        solution: [
          '**Connection Timeout Fix**',
          '1. Check server status in Discord announcements',
          '2. Clear FiveM cache: %localappdata%\\FiveM\\FiveM.app\\data\\cache',
          '3. Try direct connect: F8 → connect lucidcityrp.com',
          '4. Check firewall and antivirus settings',
          '5. Restart router/modem if other servers work'
        ],
        category: 'connection',
        severity: 'high'
      },

      'game_crash': {
        patterns: [
          /game.*crash/i,
          /fivem.*crash/i,
          /gta.*crash/i,
          /application.*crash/i,
          /exception.*code/i
        ],
        solution: [
          '**Game Crash Resolution**',
          '1. Clear FiveM cache completely',
          '2. Verify GTA V files through Steam/Epic Games',
          '3. Update graphics drivers (NVIDIA/AMD)',
          '4. Run FiveM as Administrator',
          '5. Lower graphics settings in GTA V',
          '6. Disable mods and texture packs temporarily'
        ],
        category: 'stability',
        severity: 'high'
      },

      'script_error': {
        patterns: [
          /script error/i,
          /lua.*error/i,
          /runtime error/i,
          /attempt to.*nil/i,
          /bad argument/i
        ],
        solution: [
          '**Script Error Fix**',
          '1. Note which resource is causing the error',
          '2. Report to staff with full error message',
          '3. Try rejoining the server',
          '4. Clear cache if error persists',
          '5. Avoid actions that trigger the error until fixed'
        ],
        category: 'script',
        severity: 'low'
      },

      'memory_issue': {
        patterns: [
          /out of memory/i,
          /memory.*allocation/i,
          /heap.*overflow/i,
          /stack.*overflow/i
        ],
        solution: [
          '**Memory Issue Resolution**',
          '1. Close unnecessary programs before playing',
          '2. Increase virtual memory in Windows',
          '3. Lower graphics settings to reduce memory usage',
          '4. Clear FiveM cache to free up space',
          '5. Consider upgrading RAM if issue persists'
        ],
        category: 'performance',
        severity: 'medium'
      },

      'authentication_error': {
        patterns: [
          /authentication.*failed/i,
          /login.*failed/i,
          /steam.*authentication/i,
          /invalid.*ticket/i
        ],
        solution: [
          '**Authentication Error Fix**',
          '1. Restart Steam completely',
          '2. Verify Steam is running and logged in',
          '3. Check Steam server status',
          '4. Run Steam as Administrator',
          '5. Clear Steam authentication cache'
        ],
        category: 'authentication',
        severity: 'medium'
      },

      'graphics_error': {
        patterns: [
          /graphics.*error/i,
          /directx.*error/i,
          /vulkan.*error/i,
          /shader.*error/i,
          /texture.*error/i
        ],
        solution: [
          '**Graphics Error Resolution**',
          '1. Update graphics drivers to latest version',
          '2. Switch graphics API (DirectX ↔ Vulkan)',
          '3. Lower texture quality and draw distance',
          '4. Disable graphics mods/ENB',
          '5. Verify GTA V file integrity'
        ],
        category: 'graphics',
        severity: 'medium'
      }
    };

    // Common FiveM file paths and commands
    this.fivemPaths = {
      cache: '%localappdata%\\FiveM\\FiveM.app\\data\\cache',
      logs: '%localappdata%\\FiveM\\FiveM.app\\logs',
      citizen: '%localappdata%\\FiveM\\FiveM.app\\CitizenFX.ini',
      crashes: '%localappdata%\\FiveM\\FiveM.app\\crashes'
    };

    // Track technical issues for analysis
    this.technicalIssues = [];
  }

  analyzeIssue(input) {
    const lowerInput = input.toLowerCase();
    let detectedIssues = [];

    // Check against error signatures
    for (const [errorType, signature] of Object.entries(this.errorSignatures)) {
      const matches = signature.patterns.filter(pattern => pattern.test(input));
      
      if (matches.length > 0) {
        detectedIssues.push({
          type: errorType,
          signature: signature,
          confidence: (matches.length / signature.patterns.length) * 100,
          matchedPatterns: matches
        });
      }
    }

    // Sort by confidence
    detectedIssues.sort((a, b) => b.confidence - a.confidence);

    // Log for analysis
    if (detectedIssues.length > 0) {
      this.technicalIssues.push({
        timestamp: Date.now(),
        input: input.substring(0, 200),
        detectedType: detectedIssues[0].type,
        confidence: detectedIssues[0].confidence
      });
    }

    return detectedIssues.slice(0, 2); // Return top 2 matches
  }

  generateSolution(issues) {
    if (!issues || issues.length === 0) {
      return this.getGenericTroubleshooting();
    }

    const primaryIssue = issues[0];
    let response = primaryIssue.signature.solution.join('\n');

    // Add additional context for multiple issues
    if (issues.length > 1) {
      response += '\n\n**Additional Issues Detected:**\n';
      issues.slice(1).forEach(issue => {
        response += `• ${issue.type.replace(/_/g, ' ').toUpperCase()}\n`;
      });
    }

    // Add severity warning
    if (primaryIssue.signature.severity === 'high') {
      response += '\n\n⚠️ **High Priority Issue** - Contact staff if these steps don\'t resolve the problem immediately.';
    }

    // Add log collection guidance
    response += '\n\n📋 **For Staff Support:**\n';
    response += `• Crash logs: \`${this.fivemPaths.crashes}\`\n`;
    response += `• Game logs: \`${this.fivemPaths.logs}\`\n`;
    response += '• Include full error message when reporting';

    return {
      type: 'technical_support',
      category: primaryIssue.signature.category,
      severity: primaryIssue.signature.severity,
      solution: response,
      confidence: primaryIssue.confidence,
      note: this.getSeverityNote(primaryIssue.signature.severity)
    };
  }

  getGenericTroubleshooting() {
    return {
      type: 'technical_support',
      category: 'general',
      severity: 'low',
      solution: [
        '**General FiveM Troubleshooting**',
        '1. Clear FiveM cache: %localappdata%\\FiveM\\FiveM.app\\data\\cache',
        '2. Verify GTA V file integrity',
        '3. Update graphics drivers',
        '4. Run as Administrator',
        '5. Disable antivirus temporarily',
        '6. Check Windows updates'
      ].join('\n'),
      confidence: 50,
      note: 'Generic troubleshooting steps - provide more details for specific help'
    };
  }

  getSeverityNote(severity) {
    const notes = {
      'high': 'Critical issue requiring immediate attention',
      'medium': 'Moderate issue that may impact gameplay', 
      'low': 'Minor issue with simple resolution'
    };
    return notes[severity] || 'Contact staff if issues persist';
  }

  // Enhanced log analysis
  analyzeLogSnippet(logText) {
    const lines = logText.split('\n');
    const analysis = {
      errors: [],
      warnings: [],
      resources: [],
      timestamps: [],
      patterns: []
    };

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // Extract timestamps
      const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/);
      if (timestampMatch) {
        analysis.timestamps.push(timestampMatch[0]);
      }

      // Identify errors
      if (lowerLine.includes('error') || lowerLine.includes('exception')) {
        analysis.errors.push({ line: index + 1, content: line.trim() });
      }

      // Identify warnings
      if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
        analysis.warnings.push({ line: index + 1, content: line.trim() });
      }

      // Extract resource names
      const resourceMatch = line.match(/resource\s+[`']?([^`'\s]+)[`']?/i);
      if (resourceMatch) {
        analysis.resources.push(resourceMatch[1]);
      }

      // Check for known patterns
      const issues = this.analyzeIssue(line);
      if (issues.length > 0) {
        analysis.patterns.push({
          line: index + 1,
          type: issues[0].type,
          confidence: issues[0].confidence
        });
      }
    });

    return analysis;
  }

  generateLogAnalysisReport(analysis) {
    let report = '**Log Analysis Report**\n\n';

    if (analysis.errors.length > 0) {
      report += `**🔴 Errors Found (${analysis.errors.length}):**\n`;
      analysis.errors.slice(0, 3).forEach(error => {
        report += `Line ${error.line}: ${error.content.substring(0, 100)}...\n`;
      });
      report += '\n';
    }

    if (analysis.warnings.length > 0) {
      report += `**⚠️ Warnings Found (${analysis.warnings.length}):**\n`;
      analysis.warnings.slice(0, 2).forEach(warning => {
        report += `Line ${warning.line}: ${warning.content.substring(0, 100)}...\n`;
      });
      report += '\n';
    }

    if (analysis.patterns.length > 0) {
      report += `**🔍 Issue Patterns Detected:**\n`;
      const uniquePatterns = [...new Set(analysis.patterns.map(p => p.type))];
      uniquePatterns.forEach(pattern => {
        report += `• ${pattern.replace(/_/g, ' ').toUpperCase()}\n`;
      });
      report += '\n';
    }

    if (analysis.resources.length > 0) {
      const uniqueResources = [...new Set(analysis.resources)];
      report += `**📦 Resources Mentioned (${uniqueResources.length}):**\n`;
      uniqueResources.slice(0, 5).forEach(resource => {
        report += `• ${resource}\n`;
      });
      report += '\n';
    }

    report += '**📋 Recommendation:** Share this analysis with staff for targeted assistance.';

    return report;
  }

  // Advanced troubleshooting based on system info
  generateSystemSpecificAdvice(systemInfo = {}) {
    let advice = [];

    // GPU-specific advice
    if (systemInfo.gpu) {
      const gpu = systemInfo.gpu.toLowerCase();
      if (gpu.includes('nvidia')) {
        advice.push('NVIDIA Users: Update drivers through GeForce Experience');
        advice.push('Try switching from DirectX to Vulkan in GTA V settings');
      } else if (gpu.includes('amd')) {
        advice.push('AMD Users: Update drivers through Radeon Software');
        advice.push('Enable Radeon Anti-Lag for better performance');
      }
    }

    // RAM-specific advice
    if (systemInfo.ram && parseInt(systemInfo.ram) < 16) {
      advice.push('Low RAM detected: Close background applications before playing');
      advice.push('Consider increasing virtual memory to 8GB+');
    }

    // OS-specific advice
    if (systemInfo.os && systemInfo.os.includes('Windows 11')) {
      advice.push('Windows 11: Disable VBS (Virtualization-based Security) for better performance');
    }

    return advice;
  }

  // Get statistics for admin dashboard
  getTechnicalStats() {
    const now = Date.now();
    const last24Hours = this.technicalIssues.filter(issue => now - issue.timestamp < 24 * 60 * 60 * 1000);
    
    const issueCounts = {};
    last24Hours.forEach(issue => {
      issueCounts[issue.detectedType] = (issueCounts[issue.detectedType] || 0) + 1;
    });

    return {
      total_issues: this.technicalIssues.length,
      last_24_hours: last24Hours.length,
      top_issues: Object.entries(issueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      average_confidence: last24Hours.length > 0 ? 
        (last24Hours.reduce((sum, issue) => sum + issue.confidence, 0) / last24Hours.length).toFixed(1) : 0
    };
  }

  // Check for known FiveM server issues
  checkServerStatus() {
    // This would ideally check actual server status
    // For now, provide guidance on checking status
    return {
      type: 'server_status_check',
      solution: [
        '**Check Server Status:**',
        '1. Visit Discord announcements channel',
        '2. Check #server-status if available',
        '3. Try connecting to other FiveM servers to test connection',
        '4. Ask other players if they\'re experiencing issues',
        '5. Check FiveM status page: status.fivem.net'
      ].join('\n'),
      note: 'Server-side issues require staff attention'
    };
  }

  // Generate comprehensive troubleshooting guide
  generateComprehensiveGuide(issueType = 'general') {
    const guides = {
      'connection': [
        '**Complete Connection Troubleshooting Guide**',
        '',
        '**Step 1: Basic Checks**',
        '• Verify server is online in Discord',
        '• Check your internet connection',
        '• Ensure Steam is running and logged in',
        '',
        '**Step 2: FiveM Cache**',
        '• Press Windows+R, type: %localappdata%\\FiveM\\FiveM.app\\data\\cache',
        '• Delete all folders inside cache directory',
        '• Restart FiveM',
        '',
        '**Step 3: Network Configuration**',
        '• Disable VPN if using one',
        '• Check firewall exceptions for FiveM',
        '• Try direct connect: F8 → connect lucidcityrp.com',
        '',
        '**Step 4: Advanced Solutions**',
        '• Flush DNS: cmd → ipconfig /flushdns',
        '• Reset network: cmd → netsh winsock reset',
        '• Update network drivers',
        '',
        '**If Still Not Working:**',
        '• Contact staff with your IP region',
        '• Provide FiveM version and connection logs'
      ],
      
      'performance': [
        '**Complete Performance Optimization Guide**',
        '',
        '**Graphics Settings:**',
        '• Lower texture quality to High or Normal',
        '• Reduce draw distance to 50-75%',
        '• Disable advanced graphics options',
        '• Use DirectX 11 instead of DirectX 12',
        '',
        '**System Optimization:**',
        '• Close background applications',
        '• Set FiveM to High priority in Task Manager',
        '• Disable Windows Game Mode',
        '• Update graphics drivers',
        '',
        '**FiveM Specific:**',
        '• Clear cache regularly',
        '• Remove unnecessary mods/scripts',
        '• Monitor resource usage with Task Manager',
        '',
        '**Hardware Considerations:**',
        '• Minimum 8GB RAM recommended',
        '• SSD installation improves loading times',
        '• CPU with 4+ cores recommended'
      ]
    };

    return guides[issueType] || guides['general'] || ['No specific guide available for this issue type.'];
  }

  // Clean old technical issue data
  clearOldIssues(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoff = Date.now() - maxAge;
    this.technicalIssues = this.technicalIssues.filter(issue => issue.timestamp > cutoff);
  }
}

module.exports = new EnhancedTechnicalSupport();