import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_USER_ID = 'default-user';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create or get default user
  const user = await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      email: 'user@aiworkspace.com',
      name: 'AI Workspace User',
    },
  });
  console.log('✅ User created:', user.email);

  // Create sample tasks
  const tasks = [
    {
      title: 'Review quarterly reports',
      description: 'Go through Q3 performance metrics and prepare summary',
      status: 'in_progress',
      priority: 'high',
      category: 'Work',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      title: 'Schedule team meeting',
      description: 'Organize bi-weekly sync with the development team',
      status: 'pending',
      priority: 'medium',
      category: 'Management',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
    {
      title: 'Update project documentation',
      description: 'Add API documentation for new endpoints',
      status: 'pending',
      priority: 'low',
      category: 'Documentation',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      title: 'Fix critical bug in production',
      description: 'User authentication failing for some accounts',
      status: 'in_progress',
      priority: 'high',
      category: 'Bug',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    },
    {
      title: 'Research AI integration options',
      description: 'Evaluate different AI models for chat functionality',
      status: 'pending',
      priority: 'medium',
      category: 'Research',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    },
    {
      title: 'Completed: Deploy v2.0 to production',
      description: 'Successfully deployed the new version',
      status: 'completed',
      priority: 'high',
      category: 'Deployment',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      completedAt: new Date(),
    },
  ];

  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId: user.id,
      },
    });
    console.log(`✅ Created task: ${task.title} (${task.status}, ${task.priority})`);
  }

  console.log('');
  console.log('✨ Database seeded successfully!');
  console.log(`📝 Created ${tasks.length} sample tasks`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

