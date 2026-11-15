import { getMembership } from '../../lib/household/policy';
import { readFamilyMembers, type DB } from '../../lib/household/dashboard';

/** Routing context contains first names only; never financial data or emails. */
export async function buildFamilyContext(db: DB, userId: string): Promise<string | null> {
  const viewer = await getMembership(db, userId);
  if (!viewer || viewer.role === 'child') return null;
  const members = await readFamilyMembers(db, viewer.householdId);
  const firstNames = members.map(({ name }) => name?.trim().split(/\s+/)[0]).filter(Boolean);
  return `The user is in a family (${viewer.household.name}) with members ${firstNames.join(', ') || 'whose first names are unavailable'}; use analyze_family_spending for family questions.`;
}
