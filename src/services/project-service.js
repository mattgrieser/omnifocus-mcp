import omniFocusBridge from '../utils/omnifocus-bridge.js';

/**
 * ProjectService handles all project-related operations
 */
export class ProjectService {
  constructor() {
    this.bridge = omniFocusBridge;
  }

  /**
   * Create a new project
   */
  async createProject(args) {
    const script = `
      var project = app.Project({name: ${JSON.stringify(args.name)}});
      
      if (${JSON.stringify(args.note || null)}) {
        project.note = ${JSON.stringify(args.note)};
      }
      
      if (${args.sequential || false}) {
        project.sequential = true;
      }
      
      if (${JSON.stringify(args.due_date || null)}) {
        project.dueDate = new Date(${JSON.stringify(args.due_date)});
      }
      
      if (${JSON.stringify(args.defer_date || null)}) {
        project.deferDate = new Date(${JSON.stringify(args.defer_date)});
      }
      
      // Add to folder if specified
      if (${JSON.stringify(args.folder || null)}) {
        var folders = doc.flattenedFolders();
        var folder = null;
        
        for (var i = 0; i < folders.length; i++) {
          if (folders[i].name() === ${JSON.stringify(args.folder)}) {
            folder = folders[i];
            break;
          }
        }
        
        if (!folder) {
          folder = app.Folder({name: ${JSON.stringify(args.folder)}});
          doc.folders.push(folder);
        }
        
        folder.projects.push(project);
      } else {
        doc.projects.push(project);
      }
      
      // Add initial tasks if provided
      var createdTasks = [];
      if (${JSON.stringify(args.tasks || null)}) {
        var tasks = ${JSON.stringify(args.tasks || [])};
        for (var i = 0; i < tasks.length; i++) {
          var taskData = tasks[i];
          var task = app.Task({name: taskData.name});
          
          if (taskData.note) task.note = taskData.note;
          if (taskData.flagged) task.flagged = true;
          if (taskData.due_date) task.dueDate = new Date(taskData.due_date);
          if (taskData.defer_date) task.deferDate = new Date(taskData.defer_date);
          if (taskData.estimated_minutes) task.estimatedMinutes = taskData.estimated_minutes;
          
          project.tasks.push(task);
          createdTasks.push(task.name());
        }
      }
      
      JSON.stringify({
        id: project.id(),
        name: project.name(),
        taskCount: createdTasks.length,
        tasks: createdTasks,
        message: "Project created successfully"
      });
    `;

    const result = await this.bridge.executeScript(script);
    const projectInfo = JSON.parse(result);

    let message = `${projectInfo.message}: "${projectInfo.name}"`;
    if (projectInfo.taskCount > 0) {
      message += `\nAdded ${projectInfo.taskCount} task${projectInfo.taskCount !== 1 ? 's' : ''}: ${projectInfo.tasks.join(', ')}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
  }

  /**
   * Get projects with filtering
   */
  async getProjects(args) {
    const script = `
      var projects = doc.flattenedProjects();
      var result = [];
      
      for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var status = project.status();
        
        // Filter by status
        if (${JSON.stringify(args.status || 'active')} !== 'all' && 
            status !== ${JSON.stringify(args.status || 'active')}) {
          continue;
        }
        
        var projectInfo = ${this.bridge.getProjectFormatterScript('project')};
        
        // Filter by folder
        if (${JSON.stringify(args.folder || null)} && 
            projectInfo.folder !== ${JSON.stringify(args.folder || null)}) {
          continue;
        }
        
        result.push(projectInfo);
      }
      
      JSON.stringify(result);
    `;

    const result = await this.bridge.executeScript(script);
    const projects = JSON.parse(result);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${projects.length} project${projects.length !== 1 ? 's' : ''}:\n${JSON.stringify(projects, null, 2)}`,
        },
      ],
    };
  }

  /**
   * Get all tags
   */
  async getTags() {
    const script = `
      var tags = doc.flattenedTags();
      var result = [];
      
      for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        result.push({
          id: tag.id(),
          name: tag.name(),
          taskCount: tag.tasks().length
        });
      }
      
      JSON.stringify(result);
    `;

    const result = await this.bridge.executeScript(script);
    const tags = JSON.parse(result);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${tags.length} tag${tags.length !== 1 ? 's' : ''}:\n${JSON.stringify(tags, null, 2)}`,
        },
      ],
    };
  }

  /**
   * Update tag names to remove emojis
   */
  async updateTagNames(args = {}) {
    const { dry_run = false } = args;

    const script = `
      function removeEmojis(text) {
        // Remove emoji characters (Unicode ranges for emojis)
        return text.replace(/[\\u{1F600}-\\u{1F64F}]|[\\u{1F300}-\\u{1F5FF}]|[\\u{1F680}-\\u{1F6FF}]|[\\u{1F1E0}-\\u{1F1FF}]|[\\u{2600}-\\u{26FF}]|[\\u{2700}-\\u{27BF}]|[\\u{1F900}-\\u{1F9FF}]|[\\u{1F018}-\\u{1F270}]|[\\u{238C}-\\u{2454}]|[\\u{20D0}-\\u{20FF}]|[\\u{FE00}-\\u{FE0F}]|[\\u{1F900}-\\u{1F9FF}]|[\\u{1F018}-\\u{1F270}]|[\\u{238C}-\\u{2454}]|[\\u{20D0}-\\u{20FF}]|[\\u{FE00}-\\u{FE0F}]/gu, '').trim();
      }
      
      var tags = doc.flattenedTags();
      var results = [];
      var updatedCount = 0;
      
      for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        var originalName = tag.name();
        var newName = removeEmojis(originalName);
        
        if (newName !== originalName && newName.length > 0) {
          var existingTag = null;
          for (var j = 0; j < tags.length; j++) {
            if (i !== j && tags[j].name() === newName) {
              existingTag = tags[j];
              break;
            }
          }
          
          if (!${dry_run}) {
            if (existingTag) {
              var tasks = tag.tasks();
              for (var k = 0; k < tasks.length; k++) {
                var task = tasks[k];
                task.addTag(existingTag);
                task.removeTag(tag);
              }
              tag.delete();
              results.push("Merged tag '" + originalName + "' into existing tag '" + newName + "'");
            } else {
              tag.name = newName;
              results.push("Renamed tag '" + originalName + "' to '" + newName + "'");
            }
          } else {
            if (existingTag) {
              results.push("Would merge tag '" + originalName + "' into existing tag '" + newName + "'");
            } else {
              results.push("Would rename tag '" + originalName + "' to '" + newName + "'");
            }
          }
          updatedCount++;
        }
      }
      
      JSON.stringify({
        updatedCount: updatedCount,
        results: results,
        dryRun: ${dry_run}
      });
    `;

    const result = await this.bridge.executeScript(script);
    const response = JSON.parse(result);

    return {
      content: [
        {
          type: 'text',
          text: `Updated ${response.updatedCount} tag${response.updatedCount !== 1 ? 's' : ''}:\n${response.results.join('\n')}`,
        },
      ],
    };
  }

  /**
   * Get projects that need review
   */
  async getProjectsForReview(args) {
    const script = `
      var projects = doc.flattenedProjects();
      var now = new Date();
      var reviewInterval = ${args.review_interval_days || 7} * 24 * 60 * 60 * 1000;
      var projectsForReview = [];
      
      for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        
        // Skip non-active projects
        if (project.status() !== 'active') continue;
        
        var lastReviewDate = project.lastReviewDate();
        var needsReview = false;
        
        if (!lastReviewDate) {
          // Never reviewed
          needsReview = true;
        } else if ((now - lastReviewDate) > reviewInterval) {
          needsReview = true;
        }
        
        if (needsReview) {
          var taskCounts = {
            total: 0,
            completed: 0,
            overdue: 0
          };
          
          var tasks = project.tasks();
          for (var j = 0; j < tasks.length; j++) {
            taskCounts.total++;
            if (tasks[j].completed()) {
              taskCounts.completed++;
            } else if (tasks[j].dueDate() && tasks[j].dueDate() < now) {
              taskCounts.overdue++;
            }
          }
          
          projectsForReview.push({
            id: project.id(),
            name: project.name(),
            lastReviewDate: lastReviewDate ? lastReviewDate.toISOString() : null,
            daysSinceReview: lastReviewDate ? 
              Math.floor((now - lastReviewDate) / (24 * 60 * 60 * 1000)) : null,
            folder: project.container() && project.container().constructor.name === 'Folder' ? 
                    project.container().name() : null,
            taskCounts: taskCounts
          });
        }
      }
      
      // Sort by days since review (oldest first)
      projectsForReview.sort(function(a, b) {
        if (!a.lastReviewDate) return -1;
        if (!b.lastReviewDate) return 1;
        return b.daysSinceReview - a.daysSinceReview;
      });
      
      JSON.stringify(projectsForReview);
    `;

    const result = await this.bridge.executeScript(script);
    const projects = JSON.parse(result);

    if (projects.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No projects need review!',
          },
        ],
      };
    }

    let output = `Found ${projects.length} project${projects.length !== 1 ? 's' : ''} for review:\n\n`;

    projects.forEach((project) => {
      output += `${project.name}`;
      if (project.folder) output += ` (${project.folder})`;
      output += '\n';

      if (project.lastReviewDate) {
        output += `  Last reviewed: ${project.daysSinceReview} days ago\n`;
      } else {
        output += `  Never reviewed\n`;
      }

      output += `  Tasks: ${project.taskCounts.total} total, ${project.taskCounts.completed} completed`;
      if (project.taskCounts.overdue > 0) {
        output += `, ${project.taskCounts.overdue} overdue`;
      }
      output += '\n\n';
    });

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
   * Mark a project as reviewed
   */
  async markProjectReviewed(args) {
    const script = `
      ${this.bridge.getFindProjectScript(args.project_id)}
      
      if (!project) {
        JSON.stringify({error: "Project not found: " + ${JSON.stringify(args.project_id)}});
      } else {
        project.lastReviewDate = new Date();
        
        // Add review notes to project note if provided
        if (${JSON.stringify(args.notes || null)}) {
          var existingNote = project.note() || "";
          var reviewNote = "\\n\\n--- Review " + new Date().toLocaleDateString() + " ---\\n" + 
                          ${JSON.stringify(args.notes)};
          project.note = existingNote + reviewNote;
        }
        
        JSON.stringify({
          name: project.name(),
          lastReviewDate: project.lastReviewDate().toISOString(),
          message: "Project marked as reviewed"
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
}

export default new ProjectService();
