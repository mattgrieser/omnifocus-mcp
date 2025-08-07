import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * OmniFocusBridge handles all JavaScript automation execution
 * This centralizes the communication with OmniFocus
 */
export class OmniFocusBridge {
  /**
   * Execute JavaScript code in OmniFocus context
   * @param {string} script - JavaScript code to execute
   * @returns {Promise<string>} - Script output
   */
  async executeScript(script) {
    // Check if script already includes the wrapper
    const hasWrapper =
      script.includes('var app = Application') && script.includes('var doc = app.defaultDocument');

    const fullScript = hasWrapper
      ? script
      : `
        var app = Application('OmniFocus');
        app.includeStandardAdditions = true;
        var doc = app.defaultDocument;
        
        ${script}
      `;

    try {
      const { stdout } = await execAsync(
        `osascript -l JavaScript -e '${fullScript.replace(/'/g, "'\"'\"'")}'`
      );
      return stdout.trim();
    } catch (error) {
      throw new Error(`OmniFocus automation failed: ${error.message}`);
    }
  }

  /**
   * Execute JavaScript code and safely parse JSON response
   * @param {string} script - JavaScript code to execute
   * @returns {Promise<object>} - Parsed JSON response
   */
  async executeScriptAndParse(script) {
    const result = await this.executeScript(script);

    try {
      return JSON.parse(result);
    } catch (error) {
      throw new Error(
        `Failed to parse OmniFocus response: ${error.message}. Raw response: ${result}`
      );
    }
  }

  /**
   * Check if OmniFocus is available and accessible
   * @returns {Promise<boolean>} - True if OmniFocus is available
   */
  async isOmniFocusAvailable() {
    try {
      const script = `
        var app = Application('OmniFocus');
        app.includeStandardAdditions = true;
        var doc = app.defaultDocument;
        JSON.stringify({available: true, version: app.version()});
      `;

      await this.executeScript(script);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper to find a task by name or ID
   * @param {string} identifier - Task name or ID
   * @returns {string} - JavaScript code to find the task
   */
  getFindTaskScript(identifier) {
    return `
      var tasks = doc.flattenedTasks();
      var task = null;
      
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].name() === ${JSON.stringify(identifier)} || 
            tasks[i].id() === ${JSON.stringify(identifier)}) {
          task = tasks[i];
          break;
        }
      }
    `;
  }

  /**
   * Helper to find a project by name or ID
   * @param {string} identifier - Project name or ID
   * @returns {string} - JavaScript code to find the project
   */
  getFindProjectScript(identifier) {
    return `
      var projects = doc.flattenedProjects();
      var project = null;
      
      for (var i = 0; i < projects.length; i++) {
        if (projects[i].name() === ${JSON.stringify(identifier)} || 
            projects[i].id() === ${JSON.stringify(identifier)}) {
          project = projects[i];
          break;
        }
      }
    `;
  }

  /**
   * Helper to find or create a tag
   * @param {string} tagName - Tag name
   * @returns {string} - JavaScript code to find or create the tag
   */
  getFindOrCreateTagScript(tagName) {
    return `
      var tags = doc.flattenedTags();
      var tag = null;
      
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].name() === ${tagName}) {
          tag = tags[i];
          break;
        }
      }
      
      if (!tag) {
        tag = app.Tag({name: ${tagName}});
        doc.tags.push(tag);
      }
    `;
  }

  /**
   * Helper to format a task object for output
   * @param {string} varName - JavaScript variable name containing the task
   * @returns {string} - JavaScript code to format the task
   */
  getTaskFormatterScript(varName = 'task') {
    return `{
      id: ${varName}.id(),
      name: ${varName}.name(),
      note: ${varName}.note() || "",
      completed: ${varName}.completed(),
      flagged: ${varName}.flagged(),
      dueDate: ${varName}.dueDate() ? ${varName}.dueDate().toISOString() : null,
      deferDate: ${varName}.deferDate() ? ${varName}.deferDate().toISOString() : null,
      project: ${varName}.containingProject() ? ${varName}.containingProject().name() : null,
      tags: ${varName}.tags().map(function(tag) { return tag.name(); }),
      estimatedMinutes: ${varName}.estimatedMinutes() || null
    }`;
  }

  /**
   * Helper to format a project object for output
   * @param {string} varName - JavaScript variable name containing the project
   * @returns {string} - JavaScript code to format the project
   */
  getProjectFormatterScript(varName = 'project') {
    return `{
      id: ${varName}.id(),
      name: ${varName}.name(),
      note: ${varName}.note() || "",
      status: ${varName}.status(),
      sequential: ${varName}.sequential(),
      dueDate: ${varName}.dueDate() ? ${varName}.dueDate().toISOString() : null,
      deferDate: ${varName}.deferDate() ? ${varName}.deferDate().toISOString() : null,
      folder: ${varName}.container() && ${varName}.container().constructor.name === 'Folder' ? 
              ${varName}.container().name() : null,
      taskCount: ${varName}.tasks().length,
      completedTaskCount: ${varName}.tasks().filter(function(t) { return t.completed(); }).length
    }`;
  }
}

export default new OmniFocusBridge();
