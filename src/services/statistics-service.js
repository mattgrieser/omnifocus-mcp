import omniFocusBridge from '../utils/omnifocus-bridge.js';

/**
 * StatisticsService handles productivity analytics and statistics
 */
export class StatisticsService {
  constructor() {
    this.bridge = omniFocusBridge;
  }

  /**
   * Get productivity statistics
   */
  async getStatistics(args) {
    const script = `
      var tasks = doc.flattenedTasks();
      var now = new Date();
      var stats = {
        total: 0,
        completed: 0,
        incomplete: 0,
        overdue: 0,
        due_soon: 0,
        flagged: 0,
        has_project: 0,
        by_project: {},
        by_tag: {},
        completion_rate: 0
      };
      
      // Calculate period boundaries
      var periodStart = null;
      var periodEnd = new Date();
      
      switch (${JSON.stringify(args.period || 'week')}) {
        case 'today':
          periodStart = new Date();
          periodStart.setHours(0,0,0,0);
          break;
        case 'week':
          periodStart = new Date();
          periodStart.setDate(periodStart.getDate() - 7);
          break;
        case 'month':
          periodStart = new Date();
          periodStart.setMonth(periodStart.getMonth() - 1);
          break;
        case 'year':
          periodStart = new Date();
          periodStart.setFullYear(periodStart.getFullYear() - 1);
          break;
        case 'all':
          periodStart = new Date(2000, 0, 1); // Far past date
          break;
      }
      
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var createdDate = task.creationDate();
        var completedDate = task.completionDate();
        
        // Skip tasks outside period
        if (createdDate && createdDate < periodStart) {
          // For completed tasks, check completion date
          if (!task.completed() || (completedDate && completedDate < periodStart)) {
            continue;
          }
        }
        
        stats.total++;
        
        if (task.completed()) {
          stats.completed++;
        } else {
          stats.incomplete++;
          
          var dueDate = task.dueDate();
          if (dueDate) {
            if (dueDate < now) {
              stats.overdue++;
            } else if (dueDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
              stats.due_soon++;
            }
          }
        }
        
        if (task.flagged()) stats.flagged++;
        
        var project = task.containingProject();
        if (project) {
          stats.has_project++;
          var projectName = project.name();
          
          if (${JSON.stringify(args.group_by)} === 'project') {
            if (!stats.by_project[projectName]) {
              stats.by_project[projectName] = {
                total: 0,
                completed: 0,
                overdue: 0
              };
            }
            stats.by_project[projectName].total++;
            if (task.completed()) {
              stats.by_project[projectName].completed++;
            } else if (task.dueDate() && task.dueDate() < now) {
              stats.by_project[projectName].overdue++;
            }
          }
        }
        
        if (${JSON.stringify(args.group_by)} === 'tag') {
          var tags = task.tags();
          for (var j = 0; j < tags.length; j++) {
            var tagName = tags[j].name();
            if (!stats.by_tag[tagName]) {
              stats.by_tag[tagName] = {
                total: 0,
                completed: 0,
                overdue: 0
              };
            }
            stats.by_tag[tagName].total++;
            if (task.completed()) {
              stats.by_tag[tagName].completed++;
            } else if (task.dueDate() && task.dueDate() < now) {
              stats.by_tag[tagName].overdue++;
            }
          }
        }
      }
      
      stats.completion_rate = stats.total > 0 ? 
        Math.round((stats.completed / stats.total) * 100) : 0;
      
      JSON.stringify(stats);
    `;

    const result = await this.bridge.executeScript(script);
    const stats = JSON.parse(result);

    let output = `Statistics for ${args.period || 'week'}:\n`;
    output += `Total tasks: ${stats.total}\n`;
    output += `Completed: ${stats.completed} (${stats.completion_rate}%)\n`;
    output += `Incomplete: ${stats.incomplete}\n`;
    output += `Overdue: ${stats.overdue}\n`;
    output += `Due soon: ${stats.due_soon}\n`;
    output += `Flagged: ${stats.flagged}\n`;
    output += `With project: ${stats.has_project}\n`;

    if (args.group_by === 'project' && Object.keys(stats.by_project).length > 0) {
      output += '\nBy Project:\n';
      for (const [project, data] of Object.entries(stats.by_project)) {
        output += `  ${project}: ${data.total} total, ${data.completed} completed, ${data.overdue} overdue\n`;
      }
    }

    if (args.group_by === 'tag' && Object.keys(stats.by_tag).length > 0) {
      output += '\nBy Tag:\n';
      for (const [tag, data] of Object.entries(stats.by_tag)) {
        output += `  ${tag}: ${data.total} total, ${data.completed} completed, ${data.overdue} overdue\n`;
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
}

export default new StatisticsService();
