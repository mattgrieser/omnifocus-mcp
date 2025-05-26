import omniFocusBridge from '../utils/omnifocus-bridge.js';

/**
 * MaintenanceService handles cleanup, overdue tasks, and other maintenance operations
 */
export class MaintenanceService {
  constructor() {
    this.bridge = omniFocusBridge;
  }

  /**
   * Clean up old completed tasks
   */
  async cleanupCompleted(args) {
    const script = `
      var tasks = doc.flattenedTasks();
      var cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ${args.older_than_days || 30});
      
      var results = {
        found: 0,
        processed: 0,
        tasks: []
      };
      
      for (var i = tasks.length - 1; i >= 0; i--) {
        var task = tasks[i];
        
        if (!task.completed()) continue;
        
        var completionDate = task.completionDate();
        if (!completionDate || completionDate > cutoffDate) continue;
        
        results.found++;
        results.tasks.push({
          name: task.name(),
          completed: completionDate.toDateString(),
          project: task.containingProject() ? task.containingProject().name() : "No project"
        });
        
        if (!${args.dry_run || false}) {
          if (${JSON.stringify(args.action || 'archive')} === 'delete') {
            task.delete();
          } else {
            // Archive by moving to a special project or marking
            task.flagged = false; // Remove flag from archived tasks
            // Note: OmniFocus doesn't have a direct "archive" API, 
            // so we're just cleaning up flags. Users can use OmniFocus's 
            // built-in archive feature for full archiving.
          }
          results.processed++;
        }
      }
      
      JSON.stringify(results);
    `;

    const result = await this.bridge.executeScript(script);
    const results = JSON.parse(result);
    
    let output = `Found ${results.found} completed task${results.found !== 1 ? 's' : ''} older than ${args.older_than_days || 30} days\n`;
    
    if (args.dry_run) {
      output += '\nDRY RUN - No changes made. Tasks that would be affected:\n';
      results.tasks.forEach(task => {
        output += `- ${task.name} (completed ${task.completed}, project: ${task.project})\n`;
      });
    } else {
      output += `\nProcessed ${results.processed} task${results.processed !== 1 ? 's' : ''}`;
      if (args.action === 'delete') {
        output += ' (deleted)';
      } else {
        output += ' (cleaned up)';
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(args) {
    const script = `
      var tasks = doc.flattenedTasks();
      var now = new Date();
      now.setHours(23, 59, 59, 999); // End of today
      var overdueTasks = [];
      
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        
        if (task.completed()) continue;
        
        var dueDate = task.dueDate();
        if (!dueDate || dueDate >= now) continue;
        
        // Check defer date filter
        if (!${args.include_defer_dates || false}) {
          var deferDate = task.deferDate();
          if (deferDate && deferDate > now) continue;
        }
        
        var daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        
        overdueTasks.push({
          id: task.id(),
          name: task.name(),
          dueDate: dueDate.toISOString(),
          daysOverdue: daysOverdue,
          project: task.containingProject() ? task.containingProject().name() : null,
          flagged: task.flagged(),
          tags: task.tags().map(function(tag) { return tag.name(); })
        });
      }
      
      // Sort by days overdue (most overdue first)
      overdueTasks.sort(function(a, b) {
        return b.daysOverdue - a.daysOverdue;
      });
      
      JSON.stringify(overdueTasks);
    `;

    const result = await this.bridge.executeScript(script);
    const tasks = JSON.parse(result);
    
    if (tasks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No overdue tasks found!',
          },
        ],
      };
    }
    
    let output = `Found ${tasks.length} overdue task${tasks.length !== 1 ? 's' : ''}:\n\n`;
    
    if (args.group_by === 'days_overdue') {
      const groups = {};
      tasks.forEach(task => {
        const key = task.daysOverdue === 1 ? '1 day' : `${task.daysOverdue} days`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      });
      
      Object.entries(groups).forEach(([days, taskList]) => {
        output += `Overdue by ${days}:\n`;
        taskList.forEach(task => {
          output += `  - ${task.name}${task.project ? ` (${task.project})` : ''}${task.flagged ? ' 🚩' : ''}\n`;
        });
        output += '\n';
      });
    } else if (args.group_by === 'project') {
      const groups = {};
      tasks.forEach(task => {
        const key = task.project || 'No Project';
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      });
      
      Object.entries(groups).forEach(([project, taskList]) => {
        output += `${project}:\n`;
        taskList.forEach(task => {
          output += `  - ${task.name} (${task.daysOverdue} day${task.daysOverdue !== 1 ? 's' : ''} overdue)${task.flagged ? ' 🚩' : ''}\n`;
        });
        output += '\n';
      });
    } else {
      tasks.forEach(task => {
        output += `- ${task.name} (${task.daysOverdue} day${task.daysOverdue !== 1 ? 's' : ''} overdue)`;
        if (task.project) output += ` - ${task.project}`;
        if (task.flagged) output += ' 🚩';
        output += '\n';
      });
    }
    
    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }
}

export default new MaintenanceService();