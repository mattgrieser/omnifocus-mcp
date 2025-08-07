import folderService from '../src/services/folder-service.js';

describe('FolderService', () => {
  describe('getFolders', () => {
    it('should be a function', () => {
      expect(typeof folderService.getFolders).toBe('function');
    });
  });

  describe('updateFolderName', () => {
    it('should be a function', () => {
      expect(typeof folderService.updateFolderName).toBe('function');
    });

    it('should throw error for missing parameters', async () => {
      await expect(folderService.updateFolderName({})).rejects.toThrow(
        'Both folder_id and name are required'
      );
    });
  });

  describe('removeEmojisFromFolderNames', () => {
    it('should be a function', () => {
      expect(typeof folderService.removeEmojisFromFolderNames).toBe('function');
    });
  });

  describe('createFolder', () => {
    it('should be a function', () => {
      expect(typeof folderService.createFolder).toBe('function');
    });

    it('should throw error for missing name', async () => {
      await expect(folderService.createFolder({})).rejects.toThrow('Folder name is required');
    });
  });

  describe('deleteFolder', () => {
    it('should be a function', () => {
      expect(typeof folderService.deleteFolder).toBe('function');
    });

    it('should throw error for missing folder_id', async () => {
      await expect(folderService.deleteFolder({})).rejects.toThrow('Folder ID or name is required');
    });
  });
});
