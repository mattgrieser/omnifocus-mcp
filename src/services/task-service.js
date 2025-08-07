import omniFocusBridge from '../utils/omnifocus-bridge.js';

/**
 * TaskService handles all task-related operations
 */
export class TaskService {
  constructor() {
    this.bridge = omniFocusBridge;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateString - Date string to validate
   * @returns {boolean} - True if valid date format
   */
  isValidDate(dateString) {
    if (typeof dateString !== 'string') return false;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return (
      date instanceof Date &&
      !isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === dateString
    );
  }

  /**
   * Sanitize string input to prevent script injection
   * @param {string} input - Input string to sanitize
   * @returns {string} - Sanitized string
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return '';

    // Remove any potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }

  /**
   * Check if OmniFocus is available
   * @returns {Promise<boolean>} - True if OmniFocus is available
   */
  async isOmniFocusAvailable() {
    return await this.bridge.isOmniFocusAvailable();
  }

  /**
   * Get tasks with optional filtering
   */
  async getTasks(args) {
    try {
      const script = `
        var tasks = doc.flattenedTasks();
        var result = [];
        
        for (var i = 0; i < tasks.length; i++) {
          var task = tasks[i];
          
          // Apply filters
          if (!${args.completed || false} && task.completed()) continue;
          if (${args.completed || false} && !task.completed()) continue;
          
          var taskInfo = ${this.bridge.getTaskFormatterScript('task')};
          
          // Apply additional filters
          var include = true;
          
          if (${JSON.stringify(args.project || null)} && taskInfo.project !== ${JSON.stringify(args.project || null)}) {
            include = false;
          }
          
          if (${args.flagged || false} && !taskInfo.flagged) {
            include = false;
          }
          
          if (${JSON.stringify(args.tag || null)} && !taskInfo.tags.includes(${JSON.stringify(args.tag || null)})) {
            include = false;
          }
          
          if (${args.due_today || false}) {
            if (!taskInfo.dueDate) {
              include = false;
            } else {
              var today = new Date();
              today.setHours(0,0,0,0);
              var tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              var dueDate = new Date(taskInfo.dueDate);
              if (dueDate < today || dueDate >= tomorrow) {
                include = false;
              }
            }
          }
          
          if (${args.due_soon || false}) {
            if (!taskInfo.dueDate) {
              include = false;
            } else {
              var weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              if (new Date(taskInfo.dueDate) > weekFromNow) {
                include = false;
              }
            }
          }
          
          if (include) {
            result.push(taskInfo);
          }
        }
        
        JSON.stringify(result);
      `;

      const result = await this.bridge.executeScript(script);

      // Handle potential JSON parsing errors
      let tasks;
      try {
        tasks = JSON.parse(result);
      } catch (error) {
        throw new Error(
          `Failed to parse OmniFocus response: ${error.message}. Raw response: ${result}`
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}:\n${JSON.stringify(tasks, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving tasks: ${error.message}`,
          },
        ],
      };
    }
  }

  /**
   * Create a new task
   */
  async createTask(args) {
    try {
      // Check if OmniFocus is available
      const isAvailable = await this.isOmniFocusAvailable();
      if (!isAvailable) {
        throw new Error(
          'OmniFocus is not available. Please make sure OmniFocus is running and accessible.'
        );
      }

      // Validate required arguments
      if (!args.name || typeof args.name !== 'string' || args.name.trim() === '') {
        throw new Error('Task name is required and must be a non-empty string');
      }

      // Validate optional arguments
      if (
        args.estimated_minutes &&
        (typeof args.estimated_minutes !== 'number' || args.estimated_minutes < 0)
      ) {
        throw new Error('Estimated minutes must be a positive number');
      }

      if (args.due_date && !this.isValidDate(args.due_date)) {
        throw new Error('Invalid due date format. Use YYYY-MM-DD format');
      }

      if (args.defer_date && !this.isValidDate(args.defer_date)) {
        throw new Error('Invalid defer date format. Use YYYY-MM-DD format');
      }

      // Build the script with proper variable handling
      let script = `
        var task;
      `;

      // Add to project or inbox
      if (args.project) {
        script += `
          ${this.bridge.getFindProjectScript(args.project)}
          
          if (!project) {
            // Create the project if it doesn't exist
            project = app.Project({name: ${JSON.stringify(args.project)}});
            doc.projects.push(project);
          }
          
          task = app.Task({name: ${JSON.stringify(args.name.trim())}});
          project.tasks.push(task);
        `;
      } else {
        script += `
          // Add to inbox
          task = app.Task({name: ${JSON.stringify(args.name.trim())}});
          doc.inboxTasks.push(task);
        `;
      }

      // Set task properties
      if (args.note) {
        script += `task.note = ${JSON.stringify(args.note)};\n`;
      }

      if (args.flagged) {
        script += `task.flagged = true;\n`;
      }

      if (args.estimated_minutes) {
        script += `task.estimatedMinutes = ${args.estimated_minutes};\n`;
      }

      if (args.due_date) {
        script += `task.dueDate = new Date(${JSON.stringify(args.due_date)});\n`;
      }

      if (args.defer_date) {
        script += `task.deferDate = new Date(${JSON.stringify(args.defer_date)});\n`;
      }

      // Note: Tag assignment is not supported in OmniFocus JavaScript automation
      // Tags will need to be added manually in OmniFocus
      if (args.tags && args.tags.length > 0) {
        script += `
          // Create tags for manual assignment later
          var tagNames = ${JSON.stringify(args.tags)};
          for (var i = 0; i < tagNames.length; i++) {
            var currentTagName = tagNames[i];
            var tags = doc.flattenedTags();
            var tag = null;
            
            for (var j = 0; j < tags.length; j++) {
              if (tags[j].name() === currentTagName) {
                tag = tags[j];
                break;
              }
            }
            
            if (!tag) {
              tag = app.Tag({name: currentTagName});
              doc.tags.push(tag);
            }
            // Note: task.addTag(tag) is not supported in OmniFocus JavaScript automation
          }
        `;
      }

      script += `
        JSON.stringify({
          id: task.id(),
          name: task.name(),
          message: "Task created successfully"
        });
      `;

      const result = await this.bridge.executeScript(script);

      // Handle potential JSON parsing errors
      let taskInfo;
      try {
        taskInfo = JSON.parse(result);
      } catch (error) {
        throw new Error(
          `Failed to parse OmniFocus response: ${error.message}. Raw response: ${result}`
        );
      }

      let responseText = taskInfo.message + `: "${taskInfo.name}"`;

      // Add note about tag limitation if tags were requested
      if (args.tags && args.tags.length > 0) {
        responseText += `\n\nNote: Tags (${args.tags.join(', ')}) were created but not assigned to the task due to OmniFocus JavaScript automation limitations. Please manually assign tags in OmniFocus.`;
      }

      return {
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating task: ${error.message}`,
          },
        ],
      };
    }
  }

  /**
   * Create multiple tasks at once
   */
  async createTasksBatch(args) {
    const results = [];

    for (const taskData of args.tasks) {
      try {
        await this.createTask(taskData);
        results.push(`✓ Created: ${taskData.name}`);
      } catch (error) {
        results.push(`✗ Failed to create "${taskData.name}": ${error.message}`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Batch task creation results:\n${results.join('\n')}`,
        },
      ],
    };
  }

  /**
   * Update an existing task
   */
  async updateTask(args) {
    try {
      // Validate required arguments
      if (!args.task_id || typeof args.task_id !== 'string' || args.task_id.trim() === '') {
        throw new Error('Task ID is required and must be a non-empty string');
      }

      // Validate optional arguments
      if (args.name && (typeof args.name !== 'string' || args.name.trim() === '')) {
        throw new Error('Task name must be a non-empty string');
      }

      if (args.due_date && !this.isValidDate(args.due_date)) {
        throw new Error('Invalid due date format. Use YYYY-MM-DD format');
      }

      if (args.defer_date && !this.isValidDate(args.defer_date)) {
        throw new Error('Invalid defer date format. Use YYYY-MM-DD format');
      }

      const script = `
        ${this.bridge.getFindTaskScript(args.task_id)}
        
        if (!task) {
          JSON.stringify({error: "Task not found: " + ${JSON.stringify(args.task_id)}});
        } else {
          // Update task properties
          if (${JSON.stringify(args.name || null)}) {
            task.name = ${JSON.stringify(args.name.trim())};
          }
          
          if (${JSON.stringify(args.note || null)}) {
            task.note = ${JSON.stringify(args.note)};
          }
          
          if (${args.flagged !== undefined ? 'true' : 'false'}) {
            task.flagged = ${args.flagged || false};
          }
          
          if (${JSON.stringify(args.due_date || null)}) {
            task.dueDate = new Date(${JSON.stringify(args.due_date)});
          }
          
          if (${JSON.stringify(args.defer_date || null)}) {
            task.deferDate = new Date(${JSON.stringify(args.defer_date)});
          }
          
          JSON.stringify({
            id: task.id(),
            name: task.name(),
            message: "Task updated successfully"
          });
        }
      `;

      const result = await this.bridge.executeScript(script);

      // Handle potential JSON parsing errors
      let response;
      try {
        response = JSON.parse(result);
      } catch (error) {
        throw new Error(
          `Failed to parse OmniFocus response: ${error.message}. Raw response: ${result}`
        );
      }

      if (response.error) {
        throw new Error(response.error);
      }

      return {
        content: [
          {
            type: 'text',
            text: response.message + `: "${response.name}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating task: ${error.message}`,
          },
        ],
      };
    }
  }

  /**
   * Complete a task
   */
  async completeTask(args) {
    const script = `
      ${this.bridge.getFindTaskScript(args.task_id)}
      
      if (!task) {
        JSON.stringify({error: "Task not found: " + ${JSON.stringify(args.task_id)}});
      } else {
        task.markComplete();
        JSON.stringify({
          name: task.name(),
          message: "Task completed"
        });
      }
    `;

    const result = await this.bridge.executeScript(script);
    const response = JSON.parse(result);

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      content: [
        {
          type: 'text',
          text: `${response.message}: "${response.name}"`,
        },
      ],
    };
  }

  /**
   * Delete a task
   */
  async deleteTask(args) {
    const script = `
      ${this.bridge.getFindTaskScript(args.task_id)}
      
      if (!task) {
        JSON.stringify({error: "Task not found: " + ${JSON.stringify(args.task_id)}});
      } else {
        var taskName = task.name();
        task.delete();
        JSON.stringify({
          name: taskName,
          message: "Task deleted"
        });
      }
    `;

    const result = await this.bridge.executeScript(script);
    const response = JSON.parse(result);

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      content: [
        {
          type: 'text',
          text: `${response.message}: "${response.name}"`,
        },
      ],
    };
  }

  /**
   * Search tasks with advanced query
   */
  async searchTasks(args) {
    const script = `
      var tasks = doc.flattenedTasks();
      var result = [];
      var query = ${JSON.stringify(args.query.toLowerCase())};
      
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        
        // Skip completed unless requested
        if (!${args.include_completed || false} && task.completed()) continue;
        
        // Search in name and note
        var name = task.name().toLowerCase();
        var note = (task.note() || "").toLowerCase();
        
        if (name.indexOf(query) === -1 && note.indexOf(query) === -1) continue;
        
        var taskInfo = ${this.bridge.getTaskFormatterScript('task')};
        
        // Apply date range filter
        if (${JSON.stringify(args.date_range || null)}) {
          var dateRange = ${JSON.stringify(args.date_range || {})};
          if (dateRange.start || dateRange.end) {
            var taskDate = task.dueDate() || task.deferDate();
            if (!taskDate) continue;
            
            if (dateRange.start && taskDate < new Date(dateRange.start)) continue;
            if (dateRange.end && taskDate > new Date(dateRange.end)) continue;
          }
        }
        
        // Apply project filter
        if (${JSON.stringify(args.projects || null)}) {
          var projects = ${JSON.stringify(args.projects || [])};
          if (projects.length > 0 && (!taskInfo.project || projects.indexOf(taskInfo.project) === -1)) {
            continue;
          }
        }
        
        // Apply tag filter
        if (${JSON.stringify(args.tags || null)}) {
          var requiredTags = ${JSON.stringify(args.tags || [])};
          var hasAllTags = true;
          for (var j = 0; j < requiredTags.length; j++) {
            if (taskInfo.tags.indexOf(requiredTags[j]) === -1) {
              hasAllTags = false;
              break;
            }
          }
          if (!hasAllTags) continue;
        }
        
        result.push(taskInfo);
      }
      
      JSON.stringify(result);
    `;

    const result = await this.bridge.executeScript(script);
    const tasks = JSON.parse(result);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''} matching "${args.query}":\n${JSON.stringify(tasks, null, 2)}`,
        },
      ],
    };
  }

  /**
   * Create a recurring task
   */
  async createRecurringTask(args) {
    // Build the script with proper variable handling
    let script = `
      var task = app.Task({name: ${JSON.stringify(args.name)}});
      
      // Set basic properties
    `;

    if (args.note) {
      script += `task.note = ${JSON.stringify(args.note)};\n`;
    }

    script += `
      // Set repeat rule
      var repeatRule = ${JSON.stringify(args.repeat_rule)};
      var repetitionRule = app.RepetitionRule();
      
      // Set frequency
      switch (repeatRule.frequency) {
        case 'daily':
          repetitionRule.unit = 'day';
          break;
        case 'weekly':
          repetitionRule.unit = 'week';
          // Handle specific days for weekly recurrence
          if (repeatRule.days_of_week && repeatRule.days_of_week.length > 0) {
            repetitionRule.daysOfWeek = repeatRule.days_of_week;
          }
          break;
        case 'monthly':
          repetitionRule.unit = 'month';
          break;
        case 'yearly':
          repetitionRule.unit = 'year';
          break;
      }
      
      repetitionRule.steps = repeatRule.interval || 1;
      
      // Set repeat method
      if (repeatRule.repeat_from === 'completion_date') {
        repetitionRule.method = 'start after completion';
      } else {
        repetitionRule.method = 'due again';
      }
      
      task.repetitionRule = repetitionRule;
    `;

    if (args.first_due_date) {
      script += `task.dueDate = new Date(${JSON.stringify(args.first_due_date)});\n`;
    }

    // Add to project or inbox
    if (args.project) {
      script += `
        ${this.bridge.getFindProjectScript(args.project)}
        
        if (!project) {
          project = app.Project({name: ${JSON.stringify(args.project)}});
          doc.projects.push(project);
        }
        
        project.tasks.push(task);
      `;
    } else {
      script += `doc.inboxTasks.push(task);\n`;
    }

    // Note: Tag assignment is not supported in OmniFocus JavaScript automation
    // Tags will need to be added manually in OmniFocus
    if (args.tags && args.tags.length > 0) {
      script += `
          // Create tags for manual assignment later
          var tagNames = ${JSON.stringify(args.tags)};
          for (var j = 0; j < tagNames.length; j++) {
            var currentTagName = tagNames[j];
            var tags = doc.flattenedTags();
            var tag = null;
            
            for (var k = 0; k < tags.length; k++) {
              if (tags[k].name() === currentTagName) {
                tag = tags[k];
                break;
              }
            }
            
            if (!tag) {
              tag = app.Tag({name: currentTagName});
              doc.tags.push(tag);
            }
            // Note: task.addTag(tag) is not supported in OmniFocus JavaScript automation
          }
        `;
    }

    script += `
      JSON.stringify({
        id: task.id(),
        name: task.name(),
        message: "Recurring task created successfully"
      });
    `;

    const result = await this.bridge.executeScript(script);
    const taskInfo = JSON.parse(result);

    let responseText = `${taskInfo.message}: "${taskInfo.name}" (${args.repeat_rule.frequency})`;

    // Add note about tag limitation if tags were requested
    if (args.tags && args.tags.length > 0) {
      responseText += `\n\nNote: Tags (${args.tags.join(', ')}) were created but not assigned to the task due to OmniFocus JavaScript automation limitations. Please manually assign tags in OmniFocus.`;
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  /**
   * Defer multiple tasks
   */
  async deferTasks(args) {
    const script = `
      var results = [];
      var taskNames = ${JSON.stringify(args.tasks)};
      var newDeferDate = new Date(${JSON.stringify(args.defer_to)});
      
      for (var i = 0; i < taskNames.length; i++) {
        ${this.bridge.getFindTaskScript('taskNames[i]')}
        
        if (!task) {
          results.push("Task not found: " + taskNames[i]);
          continue;
        }
        
        var oldDeferDate = task.deferDate();
        task.deferDate = newDeferDate;
        
        // Adjust due date if requested
        if (${args.adjust_due_dates || false} && task.dueDate()) {
          var oldDueDate = task.dueDate();
          var deferDiff = newDeferDate - (oldDeferDate || new Date());
          var newDueDate = new Date(oldDueDate.getTime() + deferDiff);
          task.dueDate = newDueDate;
          results.push(task.name() + ": deferred to " + newDeferDate.toDateString() + 
                      ", due date adjusted to " + newDueDate.toDateString());
        } else {
          results.push(task.name() + ": deferred to " + newDeferDate.toDateString());
        }
      }
      
      JSON.stringify(results);
    `;

    const result = await this.bridge.executeScript(script);
    const results = JSON.parse(result);

    return {
      content: [
        {
          type: 'text',
          text: `Defer results:\n${results.join('\n')}`,
        },
      ],
    };
  }

  /**
   * Organize tasks by moving or tagging
   */
  async organizeTasks(args) {
    // Build the script with proper variable handling
    let script = `
      var results = [];
      var taskNames = ${JSON.stringify(args.tasks)};
      
      for (var i = 0; i < taskNames.length; i++) {
        ${this.bridge.getFindTaskScript('taskNames[i]')}
        
        if (!task) {
          results.push("Task not found: " + taskNames[i]);
          continue;
        }
        
        var actions = [];
    `;

    // Move to project
    if (args.target_project) {
      script += `
        // Move to project
        ${this.bridge.getFindProjectScript(args.target_project)}
        
        if (project) {
          project.tasks.push(task);
          actions.push("moved to " + project.name());
        } else {
          actions.push("project not found: " + ${JSON.stringify(args.target_project)});
        }
      `;
    }

    // Note: Tag assignment is not supported in OmniFocus JavaScript automation
    if (args.add_tags && args.add_tags.length > 0) {
      script += `
            // Create tags for manual assignment later
            var addTags = ${JSON.stringify(args.add_tags)};
            for (var l = 0; l < addTags.length; l++) {
              var currentAddTag = addTags[l];
              var tags = doc.flattenedTags();
              var tag = null;
              
              for (var m = 0; m < tags.length; m++) {
                if (tags[m].name() === currentAddTag) {
                  tag = tags[m];
                  break;
                }
              }
              
              if (!tag) {
                tag = app.Tag({name: currentAddTag});
                doc.tags.push(tag);
              }
              // Note: task.addTag(tag) is not supported in OmniFocus JavaScript automation
              actions.push("created tag: " + currentAddTag + " (manual assignment required)");
            }
          `;
    }

    // Remove tags
    if (args.remove_tags && args.remove_tags.length > 0) {
      script += `
        // Remove tags
        var removeTags = ${JSON.stringify(args.remove_tags)};
        var taskTags = task.tags();
        
        for (var n = 0; n < removeTags.length; n++) {
          var removeTagName = removeTags[n];
          
          for (var o = 0; o < taskTags.length; o++) {
            if (taskTags[o].name() === removeTagName) {
              task.removeTag(taskTags[o]);
              actions.push("removed tag: " + removeTagName);
              break;
            }
          }
        }
      `;
    }

    script += `
        results.push(task.name() + ": " + (actions.length > 0 ? actions.join(", ") : "no changes"));
      }
      
      JSON.stringify(results);
    `;

    const result = await this.bridge.executeScript(script);
    const results = JSON.parse(result);

    return {
      content: [
        {
          type: 'text',
          text: `Organization results:\n${results.join('\n')}`,
        },
      ],
    };
  }
}

export default new TaskService();
