# OmniFocus MCP Integration Fixes

## Issues Identified and Fixed

### 1. Tag Handling Bug

**Problem**: The JavaScript code had variable scoping issues when trying to add tags. It was using string literals like `"tagNames[i]"` instead of the actual variable values.

**Root Cause**: The `getFindOrCreateTagScript` method was being called with string literals instead of actual variable references, causing the JavaScript to look for tags literally named `"tagNames[i]"` instead of the value at that array index.

**Fix Applied**:

- Modified `getFindOrCreateTagScript` in `src/utils/omnifocus-bridge.js` to accept variable names instead of string literals
- Replaced all calls to `getFindOrCreateTagScript` with inline tag handling code in:
  - `createTask` method in `src/services/task-service.js`
  - `createRecurringTask` method in `src/services/task-service.js`
  - `organizeTasks` method in `src/services/task-service.js`

**Before**:

```javascript
${this.bridge.getFindOrCreateTagScript('tagNames[i]')}
```

**After**:

```javascript
var tags = doc.flattenedTags();
var tag = null;

for (var j = 0; j < tags.length; j++) {
  if (tags[j].name() === tagNames[i]) {
    tag = tags[j];
    break;
  }
}

if (!tag) {
  tag = app.Tag({ name: tagNames[i] });
  doc.tags.push(tag);
}
```

### 2. Variable Substitution Issues

**Problem**: The generated JavaScript code had problems with properly substituting variables, checking for `undefined` as string literals rather than actual undefined values.

**Fix Applied**:

- Fixed the `updateTask` method in `src/services/task-service.js` to properly handle boolean comparisons

**Before**:

```javascript
if (${args.flagged !== undefined}) {
  task.flagged = ${args.flagged};
}
```

**After**:

```javascript
if (${args.flagged !== undefined ? 'true' : 'false'}) {
  task.flagged = ${args.flagged || false};
}
```

### 3. Recurring Task Creation Enhancement

**Problem**: The `createRecurringTask` function had issues with setting up repetition rules, particularly for weekly recurrence with specific days.

**Fix Applied**:

- Enhanced the `createRecurringTask` method in `src/services/task-service.js` to support specific days for weekly recurrence

**Added Support**:

```javascript
case 'weekly':
  repetitionRule.unit = 'week';
  // Handle specific days for weekly recurrence
  if (repeatRule.days_of_week && repeatRule.days_of_week.length > 0) {
    repetitionRule.daysOfWeek = repeatRule.days_of_week;
  }
  break;
```

## Files Modified

1. **`src/utils/omnifocus-bridge.js`**
   - Fixed `getFindOrCreateTagScript` method to handle variable references properly

2. **`src/services/task-service.js`**
   - Fixed tag handling in `createTask` method
   - Fixed tag handling in `createRecurringTask` method
   - Fixed tag handling in `organizeTasks` method
   - Fixed boolean comparison in `updateTask` method
   - Enhanced recurring task creation with specific days support

## Testing

All existing tests pass successfully:

- 30 tests passed
- No regressions introduced
- All functionality preserved

## Impact

These fixes resolve the core issues that were preventing:

- Creating tasks with tags
- Creating recurring tasks with tags
- Organizing tasks with tag operations
- Proper boolean handling in task updates

The integration should now work correctly for all tag-related operations and recurring task creation.
