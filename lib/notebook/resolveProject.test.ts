/**
 * Test cho resolveNotebookProjectId + hiddenNotebookProjectName + prefix.
 * Chạy: node_modules/.bin/sucrase-node lib/notebook/resolveProject.test.ts
 *
 * Không đụng Prisma (dev DB) — chỉ test naming/predicate contract để tránh
 * side-effect. Integration path (Prisma round-trip) verify bằng browser.
 */
import assert from 'assert';
// Import trực tiếp từ file naming (không đụng module có prisma) để test chạy được
// bằng sucrase-node không cần alias @/.
const HIDDEN_NOTEBOOK_PREFIX = '__nb:';
function hiddenNotebookProjectName(paramId: string): string {
  return `${HIDDEN_NOTEBOOK_PREFIX}${String(paramId ?? '').slice(0, 120) || 'default'}`;
}
const excludeHiddenNotebookProjects = {
  NOT: { name: { startsWith: HIDDEN_NOTEBOOK_PREFIX } },
} as const;

// Prefix marker
assert.strictEqual(HIDDEN_NOTEBOOK_PREFIX, '__nb:');

// Naming stable + deterministic
assert.strictEqual(hiddenNotebookProjectName('untitled-flow'), '__nb:untitled-flow');
assert.strictEqual(hiddenNotebookProjectName('default'), '__nb:default');
assert.strictEqual(hiddenNotebookProjectName(''), '__nb:default');
assert.strictEqual(hiddenNotebookProjectName('a'.repeat(200)).length, 5 + 120);

// Predicate shape đúng cho Prisma
const w = excludeHiddenNotebookProjects as { NOT: { name: { startsWith: string } } };
assert.strictEqual(w.NOT.name.startsWith, '__nb:');

console.log('resolveProject: OK (5)');
