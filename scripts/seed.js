#!/usr/bin/env node
/**
 * Demo Data Seed Script
 * 
 * Seeds the OpenClaw Dashboard with default roles and a sample project.
 * Run with: node scripts/seed.js
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_PATH = path.join(process.env.HOME || '', '.openclaw', 'workspace');
const ROLES_PATH = path.join(WORKSPACE_PATH, 'roles.json');
const PROJECTS_PATH = path.join(WORKSPACE_PATH, 'projects');

// Default roles configuration
const DEFAULT_ROLES = [
  {
    id: 'coder',
    name: '💻 Software Developer',
    description: 'Expert software developer specializing in clean, maintainable code with best practices',
    thinking: 'high',
    systemPrompt: `You are an expert software developer with deep knowledge of:
- Multiple programming languages (JavaScript, TypeScript, Python, Go, Rust)
- Design patterns and architecture
- Clean code principles
- Testing and quality assurance
- Performance optimization

When writing code:
1. Follow language conventions and best practices
2. Include comprehensive comments
3. Add error handling
4. Write unit tests when appropriate
5. Consider edge cases
6. Optimize for readability first, then performance`
  },
  {
    id: 'researcher',
    name: '🔍 Researcher',
    description: 'Thorough researcher who analyzes topics deeply and provides comprehensive findings',
    thinking: 'high',
    systemPrompt: `You are a thorough researcher who excels at:
- Finding accurate, up-to-date information
- Analyzing multiple sources critically
- Synthesizing complex information
- Presenting findings clearly
- Citing sources appropriately

When researching:
1. Use search tools to find current information
2. Verify facts across multiple sources
3. Consider different perspectives
4. Summarize key findings concisely
5. Note any uncertainties or gaps in information`
  },
  {
    id: 'reviewer',
    name: '👁️ Code Reviewer',
    description: 'Critical code reviewer who ensures quality, security, and maintainability',
    thinking: 'high',
    systemPrompt: `You are an expert code reviewer focused on:
- Code quality and readability
- Security best practices
- Performance considerations
- Architecture and design patterns
- Testing coverage

When reviewing code:
1. Check for security vulnerabilities
2. Verify error handling
3. Assess test coverage
4. Look for code smells
5. Suggest improvements with examples
6. Highlight positive aspects too`
  },
  {
    id: 'designer',
    name: '🎨 UI/UX Designer',
    description: 'Creative designer who crafts beautiful, intuitive user interfaces',
    thinking: 'medium',
    systemPrompt: `You are a talented UI/UX designer who creates:
- Beautiful, modern interfaces
- Intuitive user experiences
- Accessible designs
- Responsive layouts
- Design systems and components

When designing:
1. Consider the target audience
2. Follow platform conventions
3. Ensure accessibility (WCAG)
4. Create responsive designs
5. Use consistent spacing and typography
6. Provide design rationale`
  },
  {
    id: 'devops',
    name: '🚀 DevOps Engineer',
    description: 'Infrastructure expert who ensures smooth deployment and operations',
    thinking: 'medium',
    systemPrompt: `You are a DevOps engineer specializing in:
- CI/CD pipelines
- Containerization (Docker, Kubernetes)
- Cloud infrastructure (AWS, GCP, Azure)
- Infrastructure as Code
- Monitoring and logging
- Security and compliance

When working on infrastructure:
1. Follow security best practices
2. Use infrastructure as code
3. Consider scalability
4. Plan for observability
5. Document deployment processes
6. Automate repetitive tasks`
  },
  {
    id: 'tester',
    name: '🧪 QA Engineer',
    description: 'Quality assurance expert who ensures software reliability',
    thinking: 'medium',
    systemPrompt: `You are a QA engineer focused on:
- Test strategy and planning
- Manual and automated testing
- Bug reporting and tracking
- Test coverage analysis
- Performance testing
- Security testing

When testing:
1. Write clear, reproducible test cases
2. Consider edge cases and boundary conditions
3. Test both positive and negative scenarios
4. Document bugs with steps to reproduce
5. Prioritize tests by risk
6. Automate where appropriate`
  },
  {
    id: 'architect',
    name: '🏗️ System Architect',
    description: 'High-level system designer who plans scalable, robust architectures',
    thinking: 'high',
    systemPrompt: `You are a system architect who designs:
- Scalable distributed systems
- Microservices architectures
- Data models and storage strategies
- API designs
- Integration patterns
- Technology roadmaps

When architecting:
1. Consider scalability from day one
2. Design for failure and resilience
3. Keep it simple (YAGNI principle)
4. Document decisions and trade-offs
5. Consider operational complexity
6. Plan for observability`
  },
  {
    id: 'writer',
    name: '✍️ Technical Writer',
    description: 'Clear communicator who creates excellent documentation',
    thinking: 'low',
    systemPrompt: `You are a technical writer who creates:
- Clear, concise documentation
- API documentation
- User guides and tutorials
- README files
- Code comments
- Architecture decision records

When writing:
1. Know your audience
2. Use clear, simple language
3. Include examples
4. Structure content logically
5. Use formatting for readability
6. Keep it concise but complete`
  }
];

// Sample project
const SAMPLE_PROJECT = {
  id: 'demo-project',
  name: '🌟 Demo Project',
  description: 'A sample project to explore OpenClaw Dashboard features'
};

// Sample tasks for the demo project
const SAMPLE_TASKS = [
  {
    id: 'task-demo-1',
    projectId: 'demo-project',
    title: '🔍 Research OpenClaw capabilities',
    description: 'Research and document all the features available in OpenClaw',
    roleId: 'researcher',
    priority: 'high',
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: 'created', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), message: 'Task created' },
      { status: 'pending', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60000).toISOString(), message: 'Task queued' },
      { status: 'active', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 120000).toISOString(), message: 'Task assigned' },
      { status: 'processing', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 180000).toISOString(), message: 'Task in progress' },
      { status: 'completed', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), message: 'Task completed successfully' }
    ],
    result: 'OpenClaw supports multi-agent systems, task queues, team management, and more!'
  },
  {
    id: 'task-demo-2',
    projectId: 'demo-project',
    title: '📐 Design dashboard UI mockups',
    description: 'Create initial UI mockups for the dashboard interface',
    roleId: 'designer',
    priority: 'high',
    status: 'completed',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: 'created', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), message: 'Task created' },
      { status: 'pending', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 60000).toISOString(), message: 'Task queued' },
      { status: 'completed', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), message: 'Designs approved' }
    ],
    result: 'Created mockups for dashboard, project view, and task board'
  },
  {
    id: 'task-demo-3',
    projectId: 'demo-project',
    title: '💻 Implement dashboard frontend',
    description: 'Build the Next.js dashboard with all UI components',
    roleId: 'coder',
    priority: 'urgent',
    status: 'processing',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: 'created', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), message: 'Task created' },
      { status: 'pending', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60000).toISOString(), message: 'Task queued' },
      { status: 'active', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), message: 'Task assigned to agent' },
      { status: 'processing', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 300000).toISOString(), message: 'Agent is working on implementation' }
    ]
  },
  {
    id: 'task-demo-4',
    projectId: 'demo-project',
    title: '🧪 Write tests for API endpoints',
    description: 'Create comprehensive test suite for all API routes',
    roleId: 'tester',
    priority: 'medium',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: 'created', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), message: 'Task created' },
      { status: 'pending', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60000).toISOString(), message: 'Waiting for frontend implementation' }
    ]
  },
  {
    id: 'task-demo-5',
    projectId: 'demo-project',
    title: '👁️ Review code for security issues',
    description: 'Security audit of all dashboard code',
    roleId: 'reviewer',
    priority: 'high',
    status: 'created',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: 'created', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), message: 'Task created' }
    ]
  }
];

// Utility functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function writeJson(filePath, data) {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved: ${filePath}`);
}

// Seed functions
async function seedRoles() {
  console.log('\n🎭 Seeding roles...');
  
  const existingRoles = readJson(ROLES_PATH) || { roles: [] };
  const existingIds = new Set(existingRoles.roles.map(r => r.id));
  
  let added = 0;
  for (const role of DEFAULT_ROLES) {
    if (!existingIds.has(role.id)) {
      existingRoles.roles.push(role);
      existingIds.add(role.id);
      console.log(`  ✅ Added role: ${role.name}`);
      added++;
    } else {
      console.log(`  ⏭️  Skipped (exists): ${role.name}`);
    }
  }
  
  writeJson(ROLES_PATH, existingRoles);
  console.log(`🎭 Roles seeding complete! Added ${added} new roles.`);
  return added;
}

async function seedProject() {
  console.log('\n📁 Seeding demo project...');
  
  const projectPath = path.join(PROJECTS_PATH, SAMPLE_PROJECT.id);
  
  if (fs.existsSync(projectPath)) {
    console.log(`  ⏭️  Demo project already exists at: ${projectPath}`);
    return 0;
  }
  
  // Create project directory
  ensureDirectoryExists(projectPath);
  
  // Create PROJECT.json
  writeJson(path.join(projectPath, 'PROJECT.json'), {
    id: SAMPLE_PROJECT.id,
    name: SAMPLE_PROJECT.name,
    description: SAMPLE_PROJECT.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  // Create PROJECT.md
  fs.writeFileSync(path.join(projectPath, 'PROJECT.md'), `# ${SAMPLE_PROJECT.name}

${SAMPLE_PROJECT.description}

## Goals

- Explore OpenClaw Dashboard features
- Learn multi-agent collaboration
- Build a demo application

## Team

- Software Developer
- UI/UX Designer
- QA Engineer
- Code Reviewer

## Timeline

Week 1: Research and Design
Week 2: Implementation
Week 3: Testing and Review

---
*Created by seed script*
`);
  
  // Create MEMORY.md
  fs.writeFileSync(path.join(projectPath, 'MEMORY.md'), `# Project Memory

## Key Decisions

- Using Next.js for frontend
- Tailwind CSS for styling
- Task queue system for async processing

## Learnings

- Multi-agent systems are powerful
- Clear role definitions improve output quality
- Task prioritization is crucial

## References

- OpenClaw Documentation
- Next.js Docs
- Tailwind CSS Docs
`);
  
  console.log(`  ✅ Created demo project: ${SAMPLE_PROJECT.name}`);
  return 1;
}

async function seedTasks() {
  console.log('\n📋 Seeding demo tasks...');
  
  const tasksFilePath = path.join(process.cwd(), 'data', 'tasks.json');
  const existingTasks = readJson(tasksFilePath) || [];
  const existingIds = new Set(existingTasks.map(t => t.id));
  
  let added = 0;
  for (const task of SAMPLE_TASKS) {
    if (!existingIds.has(task.id)) {
      existingTasks.push(task);
      existingIds.add(task.id);
      console.log(`  ✅ Added task: ${task.title}`);
      added++;
    } else {
      console.log(`  ⏭️  Skipped (exists): ${task.title}`);
    }
  }
  
  writeJson(tasksFilePath, existingTasks);
  console.log(`📋 Tasks seeding complete! Added ${added} new tasks.`);
  return added;
}

// Main execution
async function main() {
  console.log('🌱 OpenClaw Dashboard Seeder');
  console.log('============================\n');
  
  // Ensure workspace exists
  ensureDirectoryExists(WORKSPACE_PATH);
  ensureDirectoryExists(PROJECTS_PATH);
  
  const results = {
    roles: 0,
    projects: 0,
    tasks: 0
  };
  
  try {
    // Seed roles
    results.roles = await seedRoles();
    
    // Seed demo project
    results.projects = await seedProject();
    
    // Seed demo tasks
    results.tasks = await seedTasks();
    
    console.log('\n✨ Seeding complete!');
    console.log('============================');
    console.log(`🎭 Roles added: ${results.roles}`);
    console.log(`📁 Projects added: ${results.projects}`);
    console.log(`📋 Tasks added: ${results.tasks}`);
    console.log('\n🚀 You can now:');
    console.log('   1. Start the dashboard: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Explore the demo project and tasks!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedRoles, seedProject, seedTasks, DEFAULT_ROLES };