Merge notifications script

Use this script to merge a JSON backup of notifications into the yearly archive files.

Prerequisites:
- Stop the server process that may write to `server/data` (e.g., `pm2 stop git-exam`)
- Have a JSON file containing an array of notification objects, e.g. `backup.json`.

Dry run:

```bash
node server/scripts/merge-notifications.js /path/to/backup.json --dry
```

This prints counts and performs no writes.

Perform merge:

```bash
pm2 stop git-exam
node server/scripts/merge-notifications.js /path/to/backup.json
pm2 start git-exam
```

Notes:
- The script deduplicates by `id` and prefers items with newer `createdAt` values.
- If a backup item has no `id`, a synthetic id will be generated.
- Always run the dry-run first to verify counts.
