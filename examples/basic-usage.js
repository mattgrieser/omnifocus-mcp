// Example usage of OmniFocus MCP Server tools
// These examples show how to structure tool calls from an MCP client

// Example 1: Get all tasks due today
const getTasksDueToday = {
  tool: 'get_tasks',
  arguments: {
    due_today: true,
  },
};

// Example 2: Create a simple task
const createSimpleTask = {
  tool: 'create_task',
  arguments: {
    name: 'Review meeting notes',
    note: "Go through notes from Monday's team meeting",
    due_date: '2024-12-31',
    flagged: true,
  },
};

// Example 3: Create a task in a specific project with tags
const createProjectTask = {
  tool: 'create_task',
  arguments: {
    name: 'Update API documentation',
    project: 'Website Development',
    tags: ['documentation', 'high-priority'],
    estimated_minutes: 90,
    defer_date: '2024-12-28',
  },
};

// Example 4: Create multiple tasks at once
const createMultipleTasks = {
  tool: 'create_tasks_batch',
  arguments: {
    tasks: [
      {
        name: 'Call insurance company',
        project: 'Personal',
        tags: ['calls'],
        flagged: true,
      },
      {
        name: 'Renew car registration',
        project: 'Personal',
        tags: ['errands'],
        due_date: '2025-01-15',
      },
      {
        name: 'Schedule dentist appointment',
        project: 'Personal',
        tags: ['health', 'calls'],
      },
    ],
  },
};

// Example 5: Create a complete project with tasks
const createProjectWithTasks = {
  tool: 'create_project',
  arguments: {
    name: 'Q1 Marketing Campaign',
    note: 'Planning and execution for Q1 2025 marketing initiatives',
    folder: 'Work',
    sequential: true,
    due_date: '2025-03-31',
    tasks: [
      {
        name: 'Research target demographics',
        estimated_minutes: 180,
        due_date: '2025-01-15',
      },
      {
        name: 'Create campaign strategy',
        estimated_minutes: 240,
        due_date: '2025-01-22',
      },
      {
        name: 'Design creative assets',
        estimated_minutes: 480,
        due_date: '2025-02-01',
      },
      {
        name: 'Set up ad campaigns',
        estimated_minutes: 120,
        due_date: '2025-02-10',
      },
      {
        name: 'Launch and monitor',
        flagged: true,
        due_date: '2025-02-15',
      },
    ],
  },
};

// Example 6: Update an existing task
const updateTask = {
  tool: 'update_task',
  arguments: {
    task_id: 'Review meeting notes',
    note: 'Focus on action items and follow-ups from the engineering sync',
    due_date: '2024-12-30',
    flagged: false,
  },
};

// Example 7: Organize multiple tasks
const organizeTasks = {
  tool: 'organize_tasks',
  arguments: {
    tasks: ['Update API documentation', 'Fix login bug', 'Add unit tests'],
    target_project: 'Sprint 24',
    add_tags: ['current-sprint', 'development'],
  },
};

// Example 8: Get projects in a specific folder
const getWorkProjects = {
  tool: 'get_projects',
  arguments: {
    folder: 'Work',
    status: 'active',
  },
};

// Example 9: Complete a task
const completeTask = {
  tool: 'complete_task',
  arguments: {
    task_id: 'Review meeting notes',
  },
};

// Example 10: Get flagged tasks in a specific project
const getFlaggedWorkTasks = {
  tool: 'get_tasks',
  arguments: {
    project: 'Website Development',
    flagged: true,
    completed: false,
  },
};

// Example 11: Remove emojis from all active tag names
const removeEmojisFromTags = {
  tool: 'update_tag_names',
  arguments: {},
};

export default {
  getTasksDueToday,
  createSimpleTask,
  createProjectTask,
  createMultipleTasks,
  createProjectWithTasks,
  updateTask,
  organizeTasks,
  getWorkProjects,
  completeTask,
  getFlaggedWorkTasks,
  removeEmojisFromTags,
};
