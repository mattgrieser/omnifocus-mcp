# OmniFocus MCP Server

A Model Context Protocol (MCP) server for managing OmniFocus tasks and projects through Claude Desktop or other MCP-compatible clients.

## Features

- **Task Management**
  - Create, update, complete, and delete tasks
  - Batch task creation
  - Advanced search with text queries and filters
  - Filter tasks by project, tag, completion status, flagged status, and due dates
  - Search for tasks due today or within the next 7 days
  - Create recurring tasks with flexible repeat rules

- **Project Management**
  - Create projects with optional initial tasks
  - List projects with filtering by folder and status
  - Support for sequential and parallel projects
  - Project review tracking and management

- **Organization & Productivity**
  - Bulk organize tasks by moving them to projects
  - Add or remove tags from multiple tasks at once
  - View all available tags
  - Defer multiple tasks with optional due date adjustment
  - Get productivity statistics and analytics
  - Track overdue tasks with smart grouping

- **Maintenance**
  - Clean up old completed tasks
  - Archive or delete tasks in bulk
  - Dry run mode for safe previewing

- **Rich Task Properties**
  - Notes/descriptions
  - Due dates and defer dates
  - Time estimates
  - Flagged status
  - Multiple tags per task
  - Recurring task patterns

## Installation

### 1. Clone this repository

```bash
git clone https://github.com/yourusername/omnifocus-mcp.git
cd omnifocus-mcp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Make the server executable

```bash
chmod +x src/index.js
```

## Configuration

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "omnifocus": {
      "command": "node",
      "args": ["/path/to/omnifocus-mcp/src/index.js"]
    }
  }
}
```

Replace `/path/to/omnifocus-mcp` with the actual path where you cloned this repository.

## Usage

Once configured, you can use the following commands in Claude Desktop:

### Task Operations

**Get tasks with filters:**

```bash
Use the get_tasks tool to show me all tasks due today

Use the get_tasks tool to show me flagged tasks in the "Work" project

Use the get_tasks tool to show me tasks due within the next 7 days
```

**Create a single task:**

```bash
Use the create_task tool to create a task called "Review quarterly report" in the "Work" project with a due date of 2024-12-31 and tag it as "urgent"
```

**Create multiple tasks:**

```bash
Use the create_tasks_batch tool to create these tasks:
1. "Call dentist" - due tomorrow, flagged
2. "Buy groceries" - in "Personal" project, tag "errands"
3. "Prepare presentation" - in "Work" project, estimated 120 minutes
```

**Update a task:**

```bash
Use the update_task tool to change "Call dentist" to be due next Monday and add a note "Ask about insurance coverage"
```

**Complete or delete tasks:**

```bash
Use the complete_task tool to mark "Buy groceries" as done

Use the delete_task tool to remove "Old task name"
```

### Project Operations

**Create a project with tasks:**

```bash
Use the create_project tool to create a project called "Website Redesign" in the "Work" folder with these tasks:
- Research competitors
- Create wireframes
- Design mockups
- Implement frontend
- Test and deploy
Make it sequential so tasks must be done in order.
```

**List projects:**

```bash
Use the get_projects tool to show me all active projects in the "Work" folder

Use the get_projects tool to show me all completed projects
```

### Organization

**Organize multiple tasks:**

```bash
Use the organize_tasks tool to move tasks ["Task 1", "Task 2", "Task 3"] to the "New Project" project and add the "high-priority" tag
```

**View all tags:**

```bash
Use the get_tags tool to show me all available tags
```

**Remove emojis from tag names:**

```bash
Use the update_tag_names tool to remove emojis from all active tag names in OmniFocus
```

### Advanced Search & Analytics

**Search for tasks:**

```bash
Use the search_tasks tool to find all tasks containing "meeting" in incomplete tasks only

Use the search_tasks tool to search for "report" in tasks from projects ["Work", "Research"] with tags ["urgent"]
```

**Get productivity statistics:**

```bash
Use the get_statistics tool to show me my task statistics for this week

Use the get_statistics tool to show me statistics for the past month grouped by project
```

### Task Scheduling

**Create recurring tasks:**

```bash
Use the create_recurring_task tool to create a "Weekly Team Meeting" task that repeats every Monday with first due date 2025-01-06

Use the create_recurring_task tool to create a "Monthly Report" task that repeats monthly on the 1st, repeating from completion date
```

**Defer multiple tasks:**

```bash
Use the defer_tasks tool to defer tasks ["Email client", "Update website", "Fix bug"] to 2025-01-15

Use the defer_tasks tool to defer ["Project review", "Planning meeting"] to next Monday and adjust their due dates accordingly
```

### Maintenance & Review

**Clean up old tasks:**

```bash
Use the cleanup_completed tool with dry_run true to see what tasks completed more than 30 days ago would be cleaned up

Use the cleanup_completed tool to delete all tasks completed more than 60 days ago
```

**Manage overdue tasks:**

```bash
Use the get_overdue_tasks tool to show me all overdue tasks grouped by how many days they're overdue

Use the get_overdue_tasks tool to show overdue tasks grouped by project, excluding tasks with future defer dates
```

**Project reviews:**

```bash
Use the get_projects_for_review tool to show me projects that haven't been reviewed in the last 7 days

Use the mark_project_reviewed tool to mark "Q1 Marketing Campaign" as reviewed with notes "On track, 3 tasks completed this week"
```

## Available Tools

### get_tasks

Retrieves tasks with optional filtering.

Parameters:

- `project` (string, optional): Filter by project name
- `tag` (string, optional): Filter by tag name
- `completed` (boolean, optional): Include completed tasks (default: false)
- `flagged` (boolean, optional): Show only flagged tasks
- `due_today` (boolean, optional): Show only tasks due today
- `due_soon` (boolean, optional): Show tasks due within 7 days

### create_task

Creates a new task in OmniFocus.

Parameters:

- `name` (string, required): Task name
- `note` (string, optional): Task description
- `project` (string, optional): Project to add task to
- `tags` (array of strings, optional): Tags to assign
- `due_date` (string, optional): Due date in ISO format
- `defer_date` (string, optional): Defer date in ISO format
- `flagged` (boolean, optional): Mark as flagged
- `estimated_minutes` (number, optional): Time estimate in minutes

### create_tasks_batch

Creates multiple tasks at once.

Parameters:

- `tasks` (array, required): Array of task objects with same properties as create_task

### update_task

Updates an existing task.

Parameters:

- `task_id` (string, required): Task name or ID
- `name` (string, optional): New task name
- `note` (string, optional): New description
- `flagged` (boolean, optional): Update flagged status
- `due_date` (string, optional): New due date
- `defer_date` (string, optional): New defer date

### complete_task

Marks a task as completed.

Parameters:

- `task_id` (string, required): Task name or ID

### delete_task

Deletes a task from OmniFocus.

Parameters:

- `task_id` (string, required): Task name or ID

### create_project

Creates a new project with optional initial tasks.

Parameters:

- `name` (string, required): Project name
- `note` (string, optional): Project description
- `folder` (string, optional): Folder to place project in
- `sequential` (boolean, optional): Tasks must be done in order
- `due_date` (string, optional): Project due date
- `defer_date` (string, optional): Project defer date
- `tasks` (array, optional): Initial tasks to add

### get_projects

Lists projects with optional filtering.

Parameters:

- `folder` (string, optional): Filter by folder name
- `status` (string, optional): Filter by status (active, completed, dropped, all)

### get_tags

Lists all available tags in OmniFocus.

### update_tag_names

Removes emoji characters from all active tag names in OmniFocus. If a tag with the same name (without emojis) already exists, the emoji tag will be merged into the existing tag. Otherwise, the tag will be renamed.

This tool is useful for cleaning up tag names that contain emojis and standardizing tag naming conventions.

### organize_tasks

Bulk organize tasks by moving or tagging.

Parameters:

- `tasks` (array of strings, required): Task names or IDs
- `target_project` (string, optional): Project to move tasks to
- `add_tags` (array of strings, optional): Tags to add
- `remove_tags` (array of strings, optional): Tags to remove

### search_tasks

Advanced search for tasks with multiple filter options.

Parameters:

- `query` (string, required): Search text in task names and notes
- `include_completed` (boolean, optional): Include completed tasks (default: false)
- `date_range` (object, optional): Filter by date range with `start` and `end` ISO dates
- `projects` (array of strings, optional): Limit search to specific projects
- `tags` (array of strings, optional): Limit search to tasks with these tags

### get_statistics

Get productivity statistics and analytics.

Parameters:

- `period` (string, optional): Time period - "today", "week", "month", "year", "all" (default: "week")
- `group_by` (string, optional): Group by "project", "tag", or "none" (default: "none")

### create_recurring_task

Create a task that repeats on a schedule.

Parameters:

- `name` (string, required): Task name
- `repeat_rule` (object, required): Repetition settings
  - `frequency` (string, required): "daily", "weekly", "monthly", "yearly"
  - `interval` (number, optional): Interval between repeats (default: 1)
  - `days_of_week` (array, optional): For weekly repeats, specific days
  - `repeat_from` (string, optional): "due_date" or "completion_date" (default: "due_date")
- `first_due_date` (string, optional): First due date for the recurring task
- `note`, `project`, `tags`: Same as create_task

### defer_tasks

Bulk defer tasks to a future date.

Parameters:

- `tasks` (array of strings, required): Task names or IDs to defer
- `defer_to` (string, required): New defer date in ISO format
- `adjust_due_dates` (boolean, optional): Also adjust due dates by same amount (default: false)

### cleanup_completed

Archive or remove old completed tasks.

Parameters:

- `older_than_days` (number, optional): Tasks completed more than X days ago (default: 30)
- `action` (string, optional): "archive" or "delete" (default: "archive")
- `dry_run` (boolean, optional): Preview without making changes (default: false)

### get_overdue_tasks

Get all overdue tasks with grouping options.

Parameters:

- `group_by` (string, optional): "project", "days_overdue", "priority", or "none" (default: "days_overdue")
- `include_defer_dates` (boolean, optional): Include tasks with future defer dates (default: false)

### get_projects_for_review

Get projects that need review.

Parameters:

- `review_interval_days` (number, optional): Projects not reviewed in X days (default: 7)

### mark_project_reviewed

Mark a project as reviewed.

Parameters:

- `project_id` (string, required): Project name or ID to mark as reviewed
- `notes` (string, optional): Review notes to add to project

## Requirements

- macOS (OmniFocus is Mac-only)
- OmniFocus 3 or later
- Node.js 16 or later
- Claude Desktop or another MCP-compatible client

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Troubleshooting

### "OmniFocus automation failed" error

- Make sure OmniFocus is installed and running
- Check that you've granted automation permissions in System Preferences > Security & Privacy > Privacy > Automation

### Tasks not appearing in the correct project

- Ensure the project name exactly matches (case-sensitive)
- The project will be created if it doesn't exist

### Date format errors

- Use ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
- Examples: "2024-12-31" or "2024-12-31T14:30:00"

## Development

### Project Structure

```text
omnifocus-mcp/
├── src/
│   └── index.js        # Main server implementation
├── tests/
│   └── omnifocus-server.test.js  # Test suite
├── examples/           # Example usage (see below)
├── package.json
├── tsconfig.json      # TypeScript configuration for type checking
└── README.md
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT

## Acknowledgments

Built using the [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol) by Anthropic.
