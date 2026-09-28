/**
 * Sanity-checks the mock data after you edit it.
 * Run with: npm run validate
 *
 * Catches the mistakes that would silently break the schedule engine:
 * unknown ids, dependencies listed after their dependents, missing launch
 * milestones, weekend dates and dangling references.
 */
import { getAllocations, getDecisions, getProjects, getRisks, getRoles, getWaitingItems } from "@/data";
import { CAPACITY_WEEKS } from "@/lib/config";
import { toDate } from "@/lib/dates";
import { projectHealth } from "@/lib/health";

const errors: string[] = [];
const warn = (msg: string) => errors.push(msg);
const projects = getProjects();
const projectIds = new Set(projects.map((p) => p.id));
const isWeekend = (iso: string) => [0, 6].includes(toDate(iso).getUTCDay());

for (const p of projects) {
  const seen = new Set<string>();
  const launches = p.milestones.filter((m) => m.kind === "launch");
  if (launches.length !== 1) warn(`${p.id}: needs exactly one "launch" milestone (found ${launches.length})`);

  p.milestones.forEach((m, i) => {
    const where = `${p.id} › ${m.id}`;
    if (seen.has(m.id)) warn(`${where}: duplicate milestone id`);
    if (m.end < m.start) warn(`${where}: end is before start`);
    if (isWeekend(m.start) || isWeekend(m.end)) warn(`${where}: starts or ends on a weekend`);
    const deps = m.dependsOn ?? (i > 0 ? [p.milestones[i - 1].id] : []);
    for (const d of deps) {
      if (!seen.has(d)) warn(`${where}: depends on "${d}", which must be listed earlier in the array`);
    }
    if (m.external) {
      const other = projects.find((x) => x.id === m.external!.projectId);
      if (!other?.milestones.some((x) => x.id === m.external!.milestoneId)) {
        warn(`${where}: external dependency ${m.external.projectId} › ${m.external.milestoneId} not found`);
      }
    }
    seen.add(m.id);
  });

  if (p.healthHistory.length !== 3) warn(`${p.id}: healthHistory should hold 3 weekly scores`);
}

const checkRefs = (kind: string, items: { id: string; projectId: string; milestoneId?: string }[]) => {
  for (const x of items) {
    if (!projectIds.has(x.projectId)) warn(`${kind} ${x.id}: unknown projectId "${x.projectId}"`);
    const project = projects.find((p) => p.id === x.projectId);
    if (x.milestoneId && !project?.milestones.some((m) => m.id === x.milestoneId)) {
      warn(`${kind} ${x.id}: unknown milestoneId "${x.milestoneId}"`);
    }
  }
};
checkRefs("Risk", getRisks());
checkRefs("Waiting item", getWaitingItems());
checkRefs("Decision", getDecisions());

const roleIds = new Set(getRoles().map((r) => r.id));
for (const a of getAllocations()) {
  if (!projectIds.has(a.projectId)) warn(`Allocation: unknown projectId "${a.projectId}"`);
  if (!roleIds.has(a.roleId)) warn(`Allocation: unknown roleId "${a.roleId}"`);
  if (a.hours.length !== CAPACITY_WEEKS.length) warn(`Allocation ${a.projectId}/${a.roleId}: expected ${CAPACITY_WEEKS.length} weekly values`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} problem(s) found:\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(`✔ Data is consistent: ${projects.length} projects.\n`);
for (const p of projects) {
  const h = projectHealth(p);
  console.log(`  ${String(h.score).padStart(3)}  ${h.band.padEnd(8)} ${p.status.padEnd(10)} ${p.name}`);
}
