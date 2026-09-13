'use strict';

const { OpenAI } = require('openai');
const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * AI Service — handles OpenAI API integration, prompt engineering, and response validation.
 */

// Initialize OpenAI client if API key is provided
let openaiClient = null;
if (config.openai.apiKey && config.openai.apiKey !== 'your_openai_api_key_here') {
  openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
}

// ── PROMPT ENGINEERING ─────────────────────────────────────────────────────────

/**
 * System prompt instructing OpenAI to act as a Principal Code Reviewer & Security Auditor.
 */
const PR_REVIEW_SYSTEM_PROMPT = `
You are a Principal Software Engineer and Application Security Auditor.
Your task is to conduct a thorough code review on a GitHub Pull Request.

Analyze the code diff provided and identify potential bugs, security vulnerabilities, performance bottlenecks, code quality smells, and missing test coverage.

You MUST respond strictly with valid JSON. Do not include markdown code block formatting like \`\`\`json. Return raw JSON matching this schema:

{
  "overallScore": number (0.0 to 10.0, where 10 is flawless code),
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "High level executive summary of the changes and overall quality",
  "findings": [
    {
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "category": "security" | "performance" | "bug" | "quality" | "error-handling",
      "file": "string (filename where issue exists)",
      "line": number (approximate line number if applicable or 0),
      "title": "Short descriptive title of the issue",
      "explanation": "Detailed explanation of why this is a problem",
      "recommendation": "Concrete actionable code or architectural recommendation to fix it"
    }
  ],
  "testingRecommendations": [
    "string (recommended unit or integration test case)"
  ]
}
`.trim();

/**
 * System prompt instructing OpenAI to conduct root-cause bug analysis.
 */
const BUG_ANALYSIS_SYSTEM_PROMPT = `
You are a Staff Debugging Expert and System Architect.
Your task is to analyze a developer's bug description and determine probable root causes, severity, recommended fixes, and test cases.

You MUST respond strictly with valid JSON. Do not include markdown code block formatting like \`\`\`json. Return raw JSON matching this schema:

{
  "severity": "low" | "medium" | "high" | "critical",
  "possibleCause": "Primary technical cause of the bug",
  "explanation": "Detailed step-by-step breakdown of how the issue occurs",
  "recommendedFix": "Concrete code snippet or architectural resolution",
  "recommendedTests": [
    "string (specific test case to prevent regression)"
  ]
}
`.trim();

// ── MOCK FALLBACK GENERATORS (for dev testing without API key) ─────────────────

const generateMockPRReview = (prDetails, files) => {
  const fileCount = files ? files.length : 1;
  const totalAdditions = files ? files.reduce((acc, f) => acc + (f.additions || 0), 0) : 15;
  const totalDeletions = files ? files.reduce((acc, f) => acc + (f.deletions || 0), 0) : 5;

  const sampleFile = files && files[0] ? files[0].filename : 'src/index.js';

  return {
    overallScore: 8.2,
    riskLevel: totalAdditions > 100 ? 'medium' : 'low',
    summary: `Reviewed ${fileCount} changed file(s) (+${totalAdditions} -${totalDeletions}). Code quality is generally good with strong structure. Identified minor security and error-handling improvements.`,
    findings: [
      {
        severity: 'medium',
        category: 'error-handling',
        file: sampleFile,
        line: 24,
        title: 'Missing async exception wrapper',
        explanation: 'Asynchronous operations inside route handlers without catch blocks can lead to unhandled promise rejections.',
        recommendation: 'Wrap controller logic in an async error handler wrapper (e.g. asyncHandler).',
      },
      {
        severity: 'low',
        category: 'security',
        file: sampleFile,
        line: 42,
        title: 'Ensure input validation on external params',
        explanation: 'Parameters accepted from HTTP query strings should be sanitized before processing.',
        recommendation: 'Use express-validator or Zod to enforce strict schema checks on request parameters.',
      },
    ],
    testingRecommendations: [
      `Add unit test verifying error propagation in ${sampleFile}`,
      'Add integration test checking API rate limiting under high concurrency',
    ],
  };
};

const generateMockBugAnalysis = (description) => {
  const isHighSeverity = description.toLowerCase().includes('crash') || description.toLowerCase().includes('fail') || description.toLowerCase().includes('error');

  return {
    severity: isHighSeverity ? 'high' : 'medium',
    possibleCause: 'Unhandled race condition or unparsed null/undefined state during asynchronous state updates.',
    explanation: `The described issue ("${description.slice(0, 80)}...") typically occurs when asynchronous operations complete out of order or when expected API properties are accessed before resolution.`,
    recommendedFix: 'Implement guarded optional chaining (?.), validate property presence before invocation, and utilize state locking or idempotency keys for concurrent calls.',
    recommendedTests: [
      'Write a regression test reproducing concurrent user interactions',
      'Verify component state handling when network latency exceeds 2000ms',
    ],
  };
};

// ── CORE SERVICE FUNCTIONS ─────────────────────────────────────────────────────

/**
 * Run AI Code Review on Pull Request files.
 */
const analyzePRCode = async (prDetails, files) => {
  // If OpenAI client is not initialized, use smart mock response for seamless dev testing
  if (!openaiClient) {
    console.log('ℹ️  OpenAI API key not set — generating structured mock PR review');
    return generateMockPRReview(prDetails, files);
  }

  const formattedFiles = files.map((f) => `--- FILE: ${f.filename} (+${f.additions} -${f.deletions})\n${f.patch || '(No diff patch)'}`).join('\n\n');

  const userPrompt = `
PULL REQUEST TITLE: ${prDetails.title}
AUTHOR: ${prDetails.author}
SOURCE BRANCH: ${prDetails.sourceBranch} -> TARGET BRANCH: ${prDetails.targetBranch}

CHANGED FILES & DIFF PATCHES:
${formattedFiles}
`.trim();

  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Fast, cost-effective model for code review
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PR_REVIEW_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // Low temperature for deterministic analysis
      max_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    // Basic structure validation
    return {
      overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 8.0,
      riskLevel: ['low', 'medium', 'high', 'critical'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
      summary: parsed.summary || 'Code review completed.',
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      testingRecommendations: Array.isArray(parsed.testingRecommendations) ? parsed.testingRecommendations : [],
    };
  } catch (err) {
    console.error('OpenAI API Error during PR Review:', err.message);
    throw new AppError(`AI Review failed: ${err.message}`, 500);
  }
};

/**
 * Run AI Bug Root-Cause Analysis.
 */
const analyzeBug = async (description) => {
  if (!description || !description.trim()) {
    throw new AppError('Bug description is required.', 400);
  }

  if (!openaiClient) {
    console.log('ℹ️  OpenAI API key not set — generating structured mock bug analysis');
    return generateMockBugAnalysis(description);
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: BUG_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: `BUG DESCRIPTION:\n${description}` },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity) ? parsed.severity : 'medium',
      possibleCause: parsed.possibleCause || 'Possible asynchronous or logic error',
      explanation: parsed.explanation || 'Detailed breakdown unavailable.',
      recommendedFix: parsed.recommendedFix || 'Inspect log files and enforce parameter validation.',
      recommendedTests: Array.isArray(parsed.recommendedTests) ? parsed.recommendedTests : [],
    };
  } catch (err) {
    console.error('OpenAI API Error during Bug Analysis:', err.message);
    throw new AppError(`AI Bug Analysis failed: ${err.message}`, 500);
  }
};

module.exports = {
  analyzePRCode,
  analyzeBug,
  PR_REVIEW_SYSTEM_PROMPT,
  BUG_ANALYSIS_SYSTEM_PROMPT,
};
