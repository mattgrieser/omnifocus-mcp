import taskService from '../services/task-service.js';
import projectService from '../services/project-service.js';
import statisticsService from '../services/statistics-service.js';
import maintenanceService from '../services/maintenance-service.js';
import folderService from '../services/folder-service.js';

/**
 * Tool definitions for the MCP server
 */
export const tools = [
  {
    name: 'get_tasks',
    description: 'Get tasks from OmniFocus with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Filter by project name',
        },
        tag: {
          type: 'string',
          description: 'Filter by tag/context',
        },
        completed: {
          type: 'boolean',
          description: 'Include completed tasks',
          default: false,
        },
        flagged: {
          type: 'boolean',
          description: 'Filter flagged tasks only',
        },
        due_today: {
          type: 'boolean',
          description: 'Filter tasks due today',
        },
        due_soon: {
          type: 'boolean',
          description: 'Filter tasks due within 7 days',
        },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in OmniFocus',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Task name',
        },
        note: {
          type: 'string',
          description: 'Task note/description',
        },
        project: {
          type: 'string',
          description: 'Project name to add task to',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Tags to assign to the task',
        },
        due_date: {
          type: 'string',
          description: 'Due date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)',
        },
        defer_date: {
          type: 'string',
          description: 'Defer date in ISO format',
        },
        flagged: {
          type: 'boolean',
          description: 'Mark as flagged',
          default: false,
        },
        estimated_minutes: {
          type: 'number',
          description: 'Estimated time in minutes',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_tasks_batch',
    description: 'Create multiple tasks at once',
    inputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              note: { type: 'string' },
              project: { type: 'string' },
              tags: {
                type: 'array',
                items: { type: 'string' },
              },
              due_date: { type: 'string' },
              defer_date: { type: 'string' },
              flagged: { type: 'boolean' },
              estimated_minutes: { type: 'number' },
            },
            required: ['name'],
          },
          description: 'Array of tasks to create',
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID or name to update',
        },
        name: {
          type: 'string',
          description: 'New task name',
        },
        note: {
          type: 'string',
          description: 'New task note',
        },
        flagged: {
          type: 'boolean',
          description: 'Update flagged status',
        },
        due_date: {
          type: 'string',
          description: 'New due date',
        },
        defer_date: {
          type: 'string',
          description: 'New defer date',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID or name to complete',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task from OmniFocus',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID or name to delete',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project in OmniFocus with optional tasks',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Project name',
        },
        note: {
          type: 'string',
          description: 'Project note/description',
        },
        folder: {
          type: 'string',
          description: 'Folder to place project in',
        },
        sequential: {
          type: 'boolean',
          description: 'Whether tasks must be completed sequentially',
          default: false,
        },
        due_date: {
          type: 'string',
          description: 'Project due date',
        },
        defer_date: {
          type: 'string',
          description: 'Project defer date',
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              note: { type: 'string' },
              flagged: { type: 'boolean' },
              due_date: { type: 'string' },
              defer_date: { type: 'string' },
              estimated_minutes: { type: 'number' },
            },
            required: ['name'],
          },
          description: 'Initial tasks to add to the project',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_projects',
    description: 'Get all projects from OmniFocus',
    inputSchema: {
      type: 'object',
      properties: {
        folder: {
          type: 'string',
          description: 'Filter by folder name',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'dropped', 'all'],
          description: 'Project status filter',
          default: 'active',
        },
      },
    },
  },
  {
    name: 'get_tags',
    description: 'Get all tags from OmniFocus',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_tag_names',
    description:
      'Remove emojis from all active tag names in OmniFocus. If a tag with the same name (without emojis) already exists, the emoji tag will be merged into the existing tag. Otherwise, the tag will be renamed.',
    inputSchema: {
      type: 'object',
      properties: {
        dry_run: {
          type: 'boolean',
          description: 'Preview changes without making them',
          default: false,
        },
      },
    },
  },
  {
    name: 'organize_tasks',
    description: 'Bulk organize tasks by moving to projects or adding tags',
    inputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of task names or IDs',
        },
        target_project: {
          type: 'string',
          description: 'Project to move tasks to',
        },
        add_tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Tags to add to all tasks',
        },
        remove_tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Tags to remove from all tasks',
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'search_tasks',
    description: 'Search tasks with advanced query capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search text in task names and notes',
        },
        include_completed: {
          type: 'boolean',
          description: 'Include completed tasks in search',
          default: false,
        },
        date_range: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              description: 'Start date in ISO format',
            },
            end: {
              type: 'string',
              description: 'End date in ISO format',
            },
          },
          description: 'Filter by date range',
        },
        projects: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Limit search to specific projects',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Limit search to tasks with these tags',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_statistics',
    description: 'Get productivity statistics and analytics',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'week', 'month', 'year', 'all'],
          description: 'Time period for statistics',
          default: 'week',
        },
        group_by: {
          type: 'string',
          enum: ['project', 'tag', 'none'],
          description: 'Group statistics by category',
          default: 'none',
        },
      },
    },
  },
  {
    name: 'create_recurring_task',
    description: 'Create a task that repeats on a schedule',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Task name',
        },
        note: {
          type: 'string',
          description: 'Task note',
        },
        project: {
          type: 'string',
          description: 'Project for the recurring task',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Tags for the task',
        },
        repeat_rule: {
          type: 'object',
          properties: {
            frequency: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'yearly'],
              description: 'Repeat frequency',
            },
            interval: {
              type: 'number',
              description: 'Interval between repeats (e.g., 2 for every 2 weeks)',
              default: 1,
            },
            days_of_week: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'sunday',
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                ],
              },
              description: 'For weekly repeats, specific days',
            },
            repeat_from: {
              type: 'string',
              enum: ['due_date', 'completion_date'],
              description: 'Calculate next occurrence from',
              default: 'due_date',
            },
          },
          required: ['frequency'],
        },
        first_due_date: {
          type: 'string',
          description: 'First due date for the recurring task',
        },
      },
      required: ['name', 'repeat_rule'],
    },
  },
  {
    name: 'defer_tasks',
    description: 'Bulk defer tasks to a future date',
    inputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Task names or IDs to defer',
        },
        defer_to: {
          type: 'string',
          description: 'New defer date in ISO format',
        },
        adjust_due_dates: {
          type: 'boolean',
          description: 'Also adjust due dates by same amount',
          default: false,
        },
      },
      required: ['tasks', 'defer_to'],
    },
  },
  {
    name: 'cleanup_completed',
    description: 'Archive or remove old completed tasks',
    inputSchema: {
      type: 'object',
      properties: {
        older_than_days: {
          type: 'number',
          description: 'Tasks completed more than X days ago',
          default: 30,
        },
        action: {
          type: 'string',
          enum: ['archive', 'delete'],
          description: 'What to do with old tasks',
          default: 'archive',
        },
        dry_run: {
          type: 'boolean',
          description: 'Preview what would be affected without making changes',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_overdue_tasks',
    description: 'Get all overdue tasks with grouping options',
    inputSchema: {
      type: 'object',
      properties: {
        group_by: {
          type: 'string',
          enum: ['project', 'days_overdue', 'priority', 'none'],
          description: 'How to group overdue tasks',
          default: 'days_overdue',
        },
        include_defer_dates: {
          type: 'boolean',
          description: 'Include tasks with future defer dates',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_projects_for_review',
    description: 'Get projects that need review',
    inputSchema: {
      type: 'object',
      properties: {
        review_interval_days: {
          type: 'number',
          description: 'Projects not reviewed in X days',
          default: 7,
        },
      },
    },
  },
  {
    name: 'mark_project_reviewed',
    description: 'Mark a project as reviewed',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Project name or ID to mark as reviewed',
        },
        notes: {
          type: 'string',
          description: 'Review notes to add',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_folders',
    description: 'Get all folders from OmniFocus with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'completed', 'dropped', 'all'],
          description: 'Filter by folder status',
          default: 'active',
        },
      },
    },
  },
  {
    name: 'update_folder_name',
    description: 'Update a folder name',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'Folder ID or name to update',
        },
        name: {
          type: 'string',
          description: 'New folder name',
        },
      },
      required: ['folder_id', 'name'],
    },
  },
  {
    name: 'remove_emojis_from_folder_names',
    description: 'Remove emojis from all folder names in OmniFocus',
    inputSchema: {
      type: 'object',
      properties: {
        dry_run: {
          type: 'boolean',
          description: 'Preview changes without making them',
          default: false,
        },
      },
    },
  },
  {
    name: 'create_folder',
    description: 'Create a new folder in OmniFocus',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Folder name',
        },
        note: {
          type: 'string',
          description: 'Folder description',
        },
        parent_folder: {
          type: 'string',
          description: 'Parent folder name or ID',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_folder',
    description: 'Delete a folder from OmniFocus',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'Folder ID or name to delete',
        },
      },
      required: ['folder_id'],
    },
  },
];

/**
 * Handle tool execution
 */
export async function handleToolCall(name, args) {
  switch (name) {
    // Task operations
    case 'get_tasks':
      return await taskService.getTasks(args);
    case 'create_task':
      return await taskService.createTask(args);
    case 'create_tasks_batch':
      return await taskService.createTasksBatch(args);
    case 'update_task':
      return await taskService.updateTask(args);
    case 'complete_task':
      return await taskService.completeTask(args);
    case 'delete_task':
      return await taskService.deleteTask(args);
    case 'search_tasks':
      return await taskService.searchTasks(args);
    case 'create_recurring_task':
      return await taskService.createRecurringTask(args);
    case 'defer_tasks':
      return await taskService.deferTasks(args);
    case 'organize_tasks':
      return await taskService.organizeTasks(args);

    // Project operations
    case 'create_project':
      return await projectService.createProject(args);
    case 'get_projects':
      return await projectService.getProjects(args);
    case 'get_tags':
      return await projectService.getTags();
    case 'update_tag_names':
      return await projectService.updateTagNames(args);
    case 'get_projects_for_review':
      return await projectService.getProjectsForReview(args);
    case 'mark_project_reviewed':
      return await projectService.markProjectReviewed(args);

    // Statistics
    case 'get_statistics':
      return await statisticsService.getStatistics(args);

    // Maintenance
    case 'cleanup_completed':
      return await maintenanceService.cleanupCompleted(args);
    case 'get_overdue_tasks':
      return await maintenanceService.getOverdueTasks(args);

    // Folder operations
    case 'get_folders':
      return await folderService.getFolders(args);
    case 'update_folder_name':
      return await folderService.updateFolderName(args);
    case 'remove_emojis_from_folder_names':
      return await folderService.removeEmojisFromFolderNames(args);
    case 'create_folder':
      return await folderService.createFolder(args);
    case 'delete_folder':
      return await folderService.deleteFolder(args);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
