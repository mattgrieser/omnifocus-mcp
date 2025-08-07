import omnifocusBridge from '../utils/omnifocus-bridge.js';

/**
 * Folder service for managing OmniFocus folders
 */
class FolderService {
  /**
   * Get all folders from OmniFocus
   * @param {Object} args - Arguments object
   * @param {string} args.status - Filter by status (active, completed, dropped, all)
   * @returns {Promise<Object>} - Formatted response with folders
   */
  async getFolders(args = {}) {
    const { status = 'active' } = args;

    const script = `
      var folders = doc.flattenedFolders();
      var filteredFolders = [];
      
      for (var i = 0; i < folders.length; i++) {
        var folder = folders[i];
        var include = false;
        
        switch(${JSON.stringify(status)}) {
          case 'active':
            include = folder.status() === 'active';
            break;
          case 'completed':
            include = folder.status() === 'completed';
            break;
          case 'dropped':
            include = folder.status() === 'dropped';
            break;
          case 'all':
            include = true;
            break;
        }
        
        if (include) {
          filteredFolders.push(${omnifocusBridge.getFolderFormatterScript('folder')});
        }
      }
      
      JSON.stringify({
        folders: filteredFolders,
        count: filteredFolders.length
      });
    `;

    try {
      const result = await omnifocusBridge.executeScriptAndParse(script);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${result.count} folders:\n\n${result.folders
              .map(
                (folder) =>
                  `• ${folder.name} (ID: ${folder.id})\n  Status: ${folder.status}\n  Projects: ${folder.projectCount}\n  Notes: ${folder.note || 'None'}`
              )
              .join('\n\n')}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get folders: ${error.message}`);
    }
  }

  /**
   * Update a folder's name
   * @param {Object} args - Arguments object
   * @param {string} args.folder_id - Folder ID or name to update
   * @param {string} args.name - New folder name
   * @returns {Promise<Object>} - Formatted response
   */
  async updateFolderName(args) {
    const { folder_id, name } = args;

    if (!folder_id || !name) {
      throw new Error('Both folder_id and name are required');
    }

    const script = `
      var folders = doc.flattenedFolders();
      var folder = null;
      
      for (var i = 0; i < folders.length; i++) {
        if (folders[i].name() === ${JSON.stringify(folder_id)} || 
            folders[i].id() === ${JSON.stringify(folder_id)}) {
          folder = folders[i];
          break;
        }
      }
      
      if (!folder) {
        throw new Error('Folder not found');
      }
      
      var oldName = folder.name();
      folder.name = ${JSON.stringify(name)};
      
      JSON.stringify({
        success: true,
        oldName: oldName,
        newName: ${JSON.stringify(name)},
        id: folder.id()
      });
    `;

    try {
      const result = await omnifocusBridge.executeScriptAndParse(script);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully renamed folder from "${result.oldName}" to "${result.newName}" (ID: ${result.id})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update folder name: ${error.message}`);
    }
  }

  /**
   * Remove emojis from all folder names
   * @param {Object} args - Arguments object
   * @param {boolean} args.dry_run - Preview changes without making them
   * @returns {Promise<Object>} - Formatted response
   */
  async removeEmojisFromFolderNames(args = {}) {
    const { dry_run = false } = args;

    const script = `
      function removeEmojis(text) {
        // Remove emoji characters (Unicode ranges for emojis)
        return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]/gu, '').trim();
      }
      
      var folders = doc.flattenedFolders();
      var changes = [];
      
      for (var i = 0; i < folders.length; i++) {
        var folder = folders[i];
        var originalName = folder.name();
        var cleanName = removeEmojis(originalName);
        
        if (cleanName !== originalName && cleanName.length > 0) {
          if (!${dry_run}) {
            folder.name = cleanName;
          }
          
          changes.push({
            id: folder.id(),
            oldName: originalName,
            newName: cleanName
          });
        }
      }
      
      JSON.stringify({
        changes: changes,
        count: changes.length,
        dryRun: ${dry_run}
      });
    `;

    try {
      const result = await omnifocusBridge.executeScriptAndParse(script);

      if (result.count === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No folders with emojis found.',
            },
          ],
        };
      }

      const action = dry_run ? 'would be renamed' : 'were renamed';
      const changesText = result.changes
        .map((change) => `• "${change.oldName}" → "${change.newName}" (ID: ${change.id})`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `${result.count} folders ${action}:\n\n${changesText}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to remove emojis from folder names: ${error.message}`);
    }
  }

  /**
   * Create a new folder
   * @param {Object} args - Arguments object
   * @param {string} args.name - Folder name
   * @param {string} args.note - Folder description
   * @param {string} args.parent_folder - Parent folder name or ID
   * @returns {Promise<Object>} - Formatted response
   */
  async createFolder(args) {
    const { name, note, parent_folder } = args;

    if (!name) {
      throw new Error('Folder name is required');
    }

    const script = `
      var parentFolder = null;
      
      if (${JSON.stringify(parent_folder)}) {
        var folders = doc.flattenedFolders();
        for (var i = 0; i < folders.length; i++) {
          if (folders[i].name() === ${JSON.stringify(parent_folder)} || 
              folders[i].id() === ${JSON.stringify(parent_folder)}) {
            parentFolder = folders[i];
            break;
          }
        }
      }
      
      var newFolder = app.Folder({
        name: ${JSON.stringify(name)},
        note: ${JSON.stringify(note || '')}
      });
      
      if (parentFolder) {
        parentFolder.folders.push(newFolder);
      } else {
        doc.folders.push(newFolder);
      }
      
      JSON.stringify({
        success: true,
        folder: ${omnifocusBridge.getFolderFormatterScript('newFolder')}
      });
    `;

    try {
      const result = await omnifocusBridge.executeScriptAndParse(script);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created folder "${result.folder.name}" (ID: ${result.folder.id})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  /**
   * Delete a folder
   * @param {Object} args - Arguments object
   * @param {string} args.folder_id - Folder ID or name to delete
   * @returns {Promise<Object>} - Formatted response
   */
  async deleteFolder(args) {
    const { folder_id } = args;

    if (!folder_id) {
      throw new Error('Folder ID or name is required');
    }

    const script = `
      var folders = doc.flattenedFolders();
      var folder = null;
      var folderIndex = -1;
      var parentContainer = null;
      
      for (var i = 0; i < folders.length; i++) {
        if (folders[i].name() === ${JSON.stringify(folder_id)} || 
            folders[i].id() === ${JSON.stringify(folder_id)}) {
          folder = folders[i];
          break;
        }
      }
      
      if (!folder) {
        throw new Error('Folder not found');
      }
      
      // Find the parent container
      var allFolders = doc.folders;
      for (var i = 0; i < allFolders.length; i++) {
        if (allFolders[i].id() === folder.id()) {
          parentContainer = doc;
          folderIndex = i;
          break;
        }
      }
      
      if (parentContainer) {
        var folderName = folder.name();
        var folderId = folder.id();
        parentContainer.folders.splice(folderIndex, 1);
        
        JSON.stringify({
          success: true,
          name: folderName,
          id: folderId
        });
      } else {
        throw new Error('Could not find folder in document structure');
      }
    `;

    try {
      const result = await omnifocusBridge.executeScriptAndParse(script);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted folder "${result.name}" (ID: ${result.id})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete folder: ${error.message}`);
    }
  }
}

export default new FolderService();
