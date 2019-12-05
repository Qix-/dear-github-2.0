const {spawnSync} = require('child_process');
const parseDiff = require('parse-diff');

const baseRef = process.env.GITHUB_BASE_REF;
const headRef = process.env.GITHUB_REF;

console.log('base ref:', baseRef);
console.log('head ref:', headRef);

const proc = spawnSync('git', [
	'diff',
	`${baseRef}..${headRef}`,
	'--oneline'
]);

if (proc.error) throw proc.error;

const diffOutput = proc.stdout.toString('utf-8');
const diff = parseDiff(diffOutput);

const readme = diff.filter(({from, to}) => (from === to) && (from == 'README.md'));

if (readme.length !== 1) {
	console.error('Not a README change (or some larger change)');
	process.exit(1);
}

const chunks = readme[0].chunks;

if (chunks.length !== 1) {
	console.error('Too many things changed in the README.');
	process.exit(1);
}

const added = chunks[0].changes.filter(c => c.add);

if (added.length !== 1) {
	console.error('Expected exactly one added line');
	process.exit(1);
}

const content = added[0].content.substring(1); // cut off initial '+'

const valid = content.match(/^\- (?:[^,]+), @([^ ,]+)(?: \([^)]+\))?$/);
if (!valid) {
	console.error('Invalid format for signature line!');
	process.exit(1);
}

if (valid[1] !== process.env.GITHUB_ACTOR) {
	console.error('Added username does not match pull requester!');
	console.error('- Detected from README:', valid[1]);
	console.error('- GITHUB_ACTOR:', process.env.GITHUB_ACTOR);
	process.exit(1);
}
