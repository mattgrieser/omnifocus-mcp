// Example: Remove emojis from all active tag names in OmniFocus
// This script demonstrates how to use the update_tag_names tool

const removeEmojisFromTags = {
  tool: 'update_tag_names',
  arguments: {},
};

// Usage instructions:
// 1. Make sure OmniFocus is running
// 2. Call this tool through your MCP client
// 3. The tool will:
//    - Find all tags in OmniFocus
//    - Remove emoji characters from tag names
//    - Merge tags if a non-emoji version already exists
//    - Rename tags if no conflict exists
//    - Report back the changes made

// eslint-disable-next-line no-console
console.log('To remove emojis from all tag names:');
// eslint-disable-next-line no-console
console.log(JSON.stringify(removeEmojisFromTags, null, 2));

export default removeEmojisFromTags;
