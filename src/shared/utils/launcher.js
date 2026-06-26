/**
 * launcher.js — shared command detection for all Jarvis entry points
 * Used by: Mini.jsx, Chat.jsx, Dashboard (future)
 *
 * To add a new openable window, add its name to LAUNCHABLE.
 * Make sure the matching entry exists in WINDOW_CONFIG in electron.cjs.
 */

const LAUNCHABLE = ['dashboard', 'chat', 'calendar', 'tasks', 'notes', 'settings']

/**
 * Returns the feature name if the text is a launcher command, otherwise null.
 * e.g. "open calendar" → "calendar",  "what's the weather?" → null
 */
export function detectLauncherCommand(text) {
  const t = text.trim().toLowerCase()
  const match = t.match(/^open (\w+)$/)
  if (!match) return null
  return LAUNCHABLE.includes(match[1]) ? match[1] : null
}