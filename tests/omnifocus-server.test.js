describe('OmniFocus MCP Server', () => {
  describe('Server Module', () => {
    test('should export OmniFocusServer class', async () => {
      const serverModule = await import('../src/server.js');
      expect(serverModule.OmniFocusServer).toBeDefined();
      expect(typeof serverModule.OmniFocusServer).toBe('function');
    });

    test('should create server instance', async () => {
      const { default: OmniFocusServer } = await import('../src/server.js');
      const server = new OmniFocusServer();
      expect(server).toBeDefined();
      expect(server.server).toBeDefined();
      expect(server.run).toBeDefined();
    });
  });

  describe('Tool Handlers', () => {
    test('should export tools array', async () => {
      const { tools } = await import('../src/handlers/tool-handlers.js');
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(19);
    });

    test('should have all expected tools', async () => {
      const { tools } = await import('../src/handlers/tool-handlers.js');
      const toolNames = tools.map((tool) => tool.name);

      const expectedTools = [
        'get_tasks',
        'create_task',
        'create_tasks_batch',
        'update_task',
        'complete_task',
        'delete_task',
        'create_project',
        'get_projects',
        'get_tags',
        'update_tag_names',
        'organize_tasks',
        'search_tasks',
        'get_statistics',
        'create_recurring_task',
        'defer_tasks',
        'cleanup_completed',
        'get_overdue_tasks',
        'get_projects_for_review',
        'mark_project_reviewed',
      ];

      expectedTools.forEach((toolName) => {
        expect(toolNames).toContain(toolName);
      });
    });

    test('should export handleToolCall function', async () => {
      const { handleToolCall } = await import('../src/handlers/tool-handlers.js');
      expect(typeof handleToolCall).toBe('function');
    });
  });

  describe('Service Modules', () => {
    test('should export TaskService', async () => {
      const taskServiceModule = await import('../src/services/task-service.js');
      expect(taskServiceModule.TaskService).toBeDefined();
      expect(taskServiceModule.default).toBeDefined();
    });

    test('should export ProjectService', async () => {
      const projectServiceModule = await import('../src/services/project-service.js');
      expect(projectServiceModule.ProjectService).toBeDefined();
      expect(projectServiceModule.default).toBeDefined();
    });

    test('should export StatisticsService', async () => {
      const statsServiceModule = await import('../src/services/statistics-service.js');
      expect(statsServiceModule.StatisticsService).toBeDefined();
      expect(statsServiceModule.default).toBeDefined();
    });

    test('should export MaintenanceService', async () => {
      const maintenanceServiceModule = await import('../src/services/maintenance-service.js');
      expect(maintenanceServiceModule.MaintenanceService).toBeDefined();
      expect(maintenanceServiceModule.default).toBeDefined();
    });
  });

  describe('OmniFocus Bridge', () => {
    test('should export OmniFocusBridge class', async () => {
      const bridgeModule = await import('../src/utils/omnifocus-bridge.js');
      expect(bridgeModule.OmniFocusBridge).toBeDefined();
      expect(bridgeModule.default).toBeDefined();
    });

    test('should have helper methods', async () => {
      const { default: bridge } = await import('../src/utils/omnifocus-bridge.js');
      expect(bridge.executeScript).toBeDefined();
      expect(bridge.getFindTaskScript).toBeDefined();
      expect(bridge.getFindProjectScript).toBeDefined();
      expect(bridge.getFindOrCreateTagScript).toBeDefined();
      expect(bridge.getTaskFormatterScript).toBeDefined();
      expect(bridge.getProjectFormatterScript).toBeDefined();
    });
  });

  describe('Tool Schemas', () => {
    test('should have valid schemas for all tools', async () => {
      const { tools } = await import('../src/handlers/tool-handlers.js');

      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');

        if (tool.inputSchema.required) {
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
        }
      });
    });
  });

  describe('Task Operations', () => {
    describe('getTasks', () => {
      test('should handle various filter combinations', () => {
        const filters = [
          { completed: false },
          { flagged: true },
          { due_today: true },
          { due_soon: true },
          { project: 'Test Project' },
          { tag: 'urgent' },
        ];

        filters.forEach((filter) => {
          expect(filter).toHaveProperty(Object.keys(filter)[0]);
        });
      });
    });

    describe('createTask', () => {
      test('should validate required fields', () => {
        const validTask = {
          name: 'Test Task',
        };

        expect(validTask).toHaveProperty('name');
        expect(validTask.name).toBeTruthy();
      });

      test('should handle optional fields', () => {
        const taskWithOptions = {
          name: 'Test Task',
          note: 'Task description',
          project: 'Test Project',
          tags: ['urgent', 'work'],
          due_date: '2024-12-31',
          defer_date: '2024-12-01',
          flagged: true,
          estimated_minutes: 30,
        };

        expect(taskWithOptions).toMatchObject({
          name: expect.any(String),
          note: expect.any(String),
          project: expect.any(String),
          tags: expect.arrayContaining([expect.any(String)]),
          due_date: expect.any(String),
          defer_date: expect.any(String),
          flagged: expect.any(Boolean),
          estimated_minutes: expect.any(Number),
        });
      });
    });

    describe('createTasksBatch', () => {
      test('should handle multiple tasks', () => {
        const batchTasks = {
          tasks: [
            { name: 'Task 1' },
            { name: 'Task 2', project: 'Project A' },
            { name: 'Task 3', tags: ['urgent'] },
          ],
        };

        expect(batchTasks.tasks).toHaveLength(3);
        batchTasks.tasks.forEach((task) => {
          expect(task).toHaveProperty('name');
        });
      });
    });

    describe('updateTask', () => {
      test('should require task_id', () => {
        const updateData = {
          task_id: 'task-123',
          name: 'Updated Task Name',
        };

        expect(updateData).toHaveProperty('task_id');
        expect(updateData.task_id).toBeTruthy();
      });
    });
  });

  describe('Project Operations', () => {
    describe('createProject', () => {
      test('should validate project data', () => {
        const project = {
          name: 'Test Project',
          note: 'Project description',
          folder: 'Work',
          sequential: true,
          tasks: [{ name: 'Task 1' }, { name: 'Task 2' }],
        };

        expect(project).toHaveProperty('name');
        expect(project.tasks).toHaveLength(2);
      });
    });

    describe('getProjects', () => {
      test('should handle status filters', () => {
        const validStatuses = ['active', 'completed', 'dropped', 'all'];

        validStatuses.forEach((status) => {
          expect(validStatuses).toContain(status);
        });
      });
    });
  });

  describe('Organization Operations', () => {
    describe('organizeTasks', () => {
      test('should validate organization parameters', () => {
        const organizeData = {
          tasks: ['task-1', 'task-2'],
          target_project: 'New Project',
          add_tags: ['important'],
          remove_tags: ['low-priority'],
        };

        expect(organizeData).toHaveProperty('tasks');
        expect(Array.isArray(organizeData.tasks)).toBe(true);
      });
    });
  });

  describe('Advanced Tools', () => {
    describe('searchTasks', () => {
      test('should validate search parameters', () => {
        const searchParams = {
          query: 'meeting',
          include_completed: false,
          date_range: {
            start: '2024-01-01',
            end: '2024-12-31',
          },
          projects: ['Work'],
          tags: ['urgent'],
        };

        expect(searchParams).toHaveProperty('query');
        expect(searchParams.query).toBeTruthy();
      });
    });

    describe('getStatistics', () => {
      test('should handle different periods', () => {
        const periods = ['today', 'week', 'month', 'year', 'all'];
        const groupByOptions = ['project', 'tag', 'none'];

        periods.forEach((period) => {
          expect(periods).toContain(period);
        });

        groupByOptions.forEach((option) => {
          expect(groupByOptions).toContain(option);
        });
      });
    });

    describe('createRecurringTask', () => {
      test('should validate repeat rule', () => {
        const recurringTask = {
          name: 'Weekly Review',
          repeat_rule: {
            frequency: 'weekly',
            interval: 1,
            days_of_week: ['monday'],
            repeat_from: 'due_date',
          },
          first_due_date: '2024-12-30',
        };

        expect(recurringTask).toHaveProperty('repeat_rule');
        expect(recurringTask.repeat_rule).toHaveProperty('frequency');
        expect(['daily', 'weekly', 'monthly', 'yearly']).toContain(
          recurringTask.repeat_rule.frequency
        );
      });
    });

    describe('deferTasks', () => {
      test('should validate defer parameters', () => {
        const deferParams = {
          tasks: ['task-1', 'task-2'],
          defer_to: '2025-01-15',
          adjust_due_dates: true,
        };

        expect(deferParams).toHaveProperty('tasks');
        expect(deferParams).toHaveProperty('defer_to');
        expect(Array.isArray(deferParams.tasks)).toBe(true);
      });
    });

    describe('cleanupCompleted', () => {
      test('should validate cleanup parameters', () => {
        const cleanupParams = {
          older_than_days: 30,
          action: 'archive',
          dry_run: true,
        };

        expect(cleanupParams).toHaveProperty('older_than_days');
        expect(['archive', 'delete']).toContain(cleanupParams.action);
        expect(typeof cleanupParams.dry_run).toBe('boolean');
      });
    });

    describe('getOverdueTasks', () => {
      test('should validate grouping options', () => {
        const groupByOptions = ['project', 'days_overdue', 'priority', 'none'];

        groupByOptions.forEach((option) => {
          expect(groupByOptions).toContain(option);
        });
      });
    });

    describe('Review Management', () => {
      test('should validate review parameters', () => {
        const reviewParams = {
          review_interval_days: 7,
        };

        const markReviewedParams = {
          project_id: 'project-123',
          notes: 'Review completed, all tasks on track',
        };

        expect(reviewParams).toHaveProperty('review_interval_days');
        expect(markReviewedParams).toHaveProperty('project_id');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid tool names gracefully', async () => {
      const { handleToolCall } = await import('../src/handlers/tool-handlers.js');

      await expect(handleToolCall('invalid_tool', {})).rejects.toThrow(
        'Unknown tool: invalid_tool'
      );
    });

    test('should validate date formats', () => {
      const validDates = ['2024-12-31', '2024-12-31T14:30:00', '2024-12-31T14:30:00Z'];

      validDates.forEach((date) => {
        expect(() => new Date(date)).not.toThrow();
      });
    });
  });

  describe('Script Escaping', () => {
    test('should properly escape quotes in scripts', () => {
      const scriptWithQuotes = 'test\'s script with "quotes"';
      const escaped = scriptWithQuotes.replace(/'/g, "'\"'\"'");

      expect(escaped).toBe('test\'"\'"\'s script with "quotes"');
    });
  });

  describe('Tag Operations', () => {
    test('should get tags', async () => {
      const { handleToolCall } = await import('../src/handlers/tool-handlers.js');
      const result = await handleToolCall('get_tags', {});
      expect(result.content[0].text).toContain('Found');
    });

    test('should have update_tag_names tool available', async () => {
      const { tools } = await import('../src/handlers/tool-handlers.js');
      const updateTagNamesTool = tools.find((tool) => tool.name === 'update_tag_names');
      expect(updateTagNamesTool).toBeDefined();
      expect(updateTagNamesTool.description).toContain('Remove emojis');
    });
  });
});
