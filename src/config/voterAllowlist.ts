/**
 * NISC Approved Voter Allowlist Specification
 * Exactly 70 verified voter email addresses.
 */

export const RAW_VOTER_EMAILS = [
  '2410080042@klh.edu.in',
  '2410030472@klh.edu.in',
  '2410030302@klh.edu.in',
  '2410080043@klh.edu.in',
  '2410080035@klh.edu.in',
  '2410030075@klh.edu.in',
  '2410030111@klh.edu.in',
  '2410030510@klh.edu.in',
  '2410030469@klh.edu.in',
  '2410030456@klh.edu.in',
  '2410030346@klh.edu.in',
  '2410030096@klh.edu.in',
  '2410030520@klh.edu.in',
  '2410030109@klh.edu.in',
  '2410080017@klh.edu.in',
  '2410030026@klh.edu.in',
  '2410030316@klh.edu.in',
  '2410080008@klh.edu.in',
  '2410030196@klh.edu.in',
  '2410030530@klh.edu.in',
  '2410030404@klh.edu.in',
  '2410030023@klh.edu.in',
  '2410030521@klh.edu.in',
  '2410030110@klh.edu.in',
  '2410030170@klh.edu.in',
  '2410080075@klh.edu.in',
  '2410080023@klh.edu.in',
  '2410080026@klh.edu.in',
  '2410030285@klh.edu.in',
  '2410030021@klh.edu.in',
  '2410030515@klh.edu.in',
  '2410040023@klh.edu.in',
  '2510030203@klh.edu.in',
  '2510030062@klh.edu.in',
  '2510030088@klh.edu.in',
  '2510030087@klh.edu.in',
  '2510030077@klh.edu.in',
  '2510040121@klh.edu.in',
  '2510520036@klh.edu.in',
  '2510030181@klh.edu.in',
  '2510030390@klh.edu.in',
  '2510030436@klh.edu.in',
  '2510030053@klh.edu.in',
  '2510040039@klh.edu.in',
  '2510080004@klh.edu.in',
  '2510030059@klh.edu.in',
  '2510030152@klh.edu.in',
  '2510030057@klh.edu.in',
  '2510040024@klh.edu.in',
  '2510040034@klh.edu.in',
  '2510030356@klh.edu.in',
  '2510030080@klh.edu.in',
  '2510030350@klh.edu.in',
  '2510040078@klh.edu.in',
  '2510030235@klh.edu.in',
  '2510030352@klh.edu.in',
  '2510030299@klh.edu.in',
  '2510040014@klh.edu.in',
  '2510030052@klh.edu.in',
  '2520030540@klh.edu.in',
  '2510250035@klh.edu.in',
  '2610030324@klh.edu.in',
  '2610030377@klh.edu.in',
  '2610030343@klh.edu.in',
  '2610030395@klh.edu.in',
  '2610030362@klh.edu.in',
  '2610030348@klh.edu.in',
  '2610030388@klh.edu.in',
  '2610030015@klh.edu.in',
  '2610030123@klh.edu.in',
];

/**
 * Normalizes email address for strict exact comparison (trimmed, lowercase)
 */
export function normalizeEmail(email?: string | null): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Deduplicated, normalized list of approved voter emails
 */
export const APPROVED_VOTER_EMAILS: string[] = Array.from(
  new Set(RAW_VOTER_EMAILS.map((email) => normalizeEmail(email)))
);

/**
 * Fast lookup Set for constant-time allowlist verification
 */
export const APPROVED_VOTER_SET: Set<string> = new Set(APPROVED_VOTER_EMAILS);

/**
 * Authorized Administrator Emails
 */
export const DESIGNATED_ADMIN_EMAIL: string = 'skm151412@gmail.com';
export const DESIGNATED_ADMIN_EMAILS: string[] = [
  'skm151412@gmail.com',
  'mohiuddinahmad9abcs@gmail.com',
];

/**
 * Validates if an email is in the exact voter allowlist
 */
export function isVoterAllowlisted(email?: string | null): boolean {
  if (!email) return false;
  return APPROVED_VOTER_SET.has(normalizeEmail(email));
}

/**
 * Validates if an email is an authorized administrator
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return DESIGNATED_ADMIN_EMAILS.some((admin) => normalizeEmail(admin) === normalized);
}

/**
 * Derives departmental metadata from institutional student roll number
 */
export function deriveMemberDetailsFromEmail(email: string) {
  const normalized = normalizeEmail(email);
  const rollNumber = normalized.split('@')[0] || '';
  
  let batchYear = '2024';
  if (rollNumber.startsWith('24')) batchYear = '2024';
  else if (rollNumber.startsWith('25')) batchYear = '2025';
  else if (rollNumber.startsWith('26')) batchYear = '2026';

  let department = 'Computer Science & Engineering';
  if (rollNumber.includes('008')) department = 'AI & Data Science';
  else if (rollNumber.includes('004')) department = 'Electronics & Communication';
  else if (rollNumber.includes('025') || rollNumber.includes('052')) department = 'Information Technology';

  return {
    rollNumber,
    batch: `Batch ${batchYear}`,
    department,
    name: `Student (${rollNumber})`,
  };
}

/**
 * Generates initial member records seed matching Phase 3 schema
 */
export function generateInitialMemberSeeds() {
  return APPROVED_VOTER_EMAILS.map((email, idx) => {
    const details = deriveMemberDetailsFromEmail(email);
    return {
      id: `member_${details.rollNumber}`,
      name: details.name,
      email,
      rollNumber: details.rollNumber,
      batch: details.batch,
      department: details.department,
      state: 'ACTIVE',
      eligible: true,
      hasVoted: false,
      createdAt: '2026-08-21T00:00:00.000Z',
      updatedAt: '2026-08-21T00:00:00.000Z',
      uid: null,
      order: idx + 1,
    };
  });
}

export const APPROVED_VOTERS = generateInitialMemberSeeds();
