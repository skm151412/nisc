/**
 * NISC Approved Voter Allowlist Specification
 * Exactly 79 verified voter email addresses.
 */

export const RAW_VOTER_EMAILS = [
  '2410030472@klh.edu.in',
  '2410030302@klh.edu.in',
  '2410080042@klh.edu.in',
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
  '2410080017@klh.edu.in',
  '2410080023@klh.edu.in',
  '2410080026@klh.edu.in',
  '2410030285@klh.edu.in',
  '2410030021@klh.edu.in',
  '2410030515@klh.edu.in',
  '2410040023@klh.edu.in',
  'anshul.raj@klh.edu.in',
  'nv.mohammedfazal@klh.edu.in',
  't.abhshek@klh.edu.in',
  'm.ruchee@klh.edu.in',
  'bhavesh.kumar@klh.edu.in',
  'manash.kumar@klh.edu.in',
  '2510520036@klh.edu.in',
  '2510030181@klh.edu.in',
  'abhijith.jayan@klh.edu.in',
  '2510030436@klh.edu.in',
  'krishna.biradar@klh.edu.in',
  '2510040039@klh.edu.in',
  'priyankarupnar@klh.edu.in',
  '2510080004@klh.edu.in',
  'sameer.sahu@klh.edu.in',
  'baibhaba.choudhury@klh.edu.in',
  'binamra.maity@klh.edu.in',
  'shriyan.bohra@klh.edu.in',
  'paridhi.gupta@klh.edu.in',
  'vanshika.agarwal@klh.edu.in',
  'alpansh.sharma@klh.edu.in',
  'dhananjay.sharma@klh.edu.in',
  '2510030350@klh.edu.in',
  '2510040078@klh.edu.in',
  '2510030235@klh.edu.in',
  '2510030352@klh.edu.in',
  'samrith.jain@klh.edu.in',
  'armaan.reza@klh.edu.in',
  '2510040014@klh.edu.in',
  'piyush.kumar@klh.edu.in',
  'gaurav.dhanraj@klh.edu.in',
  'mohammed.farhaan@klh.edu.in',
  'kamal.nayan@klh.edu.in',
  'lucky.ali@klh.edu.in',
  'ayush.gupta@klh.edu.in',
  'manasvi.chaurasia@klh.edu.in',
  'chaitanya.gaur@klh.edu.in',
  'somyansu.panda@klh.edu.in',
  'vedant.sahu@klh.edu.in',
  'juthikakar@klh.edu.in',
  'i.vishwabhargav@klh.edu.in',
  'aryan.yadav@klh.edu.in',
  '2610030388@klh.edu.in',
  'adwait.tripathi@klh.edu.in',
  'shashank.singh@klh.edu.in',
  'dhanushchandra.l@klh.edu.in',
  'hriday.vij@klh.edu.in',
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
 * Derives departmental metadata from institutional student roll number or institutional name
 */
export function deriveMemberDetailsFromEmail(email: string) {
  const normalized = normalizeEmail(email);
  const identifier = normalized.split('@')[0] || '';
  const isNumericRoll = /^\d+$/.test(identifier);

  let batchYear = '2026';
  let department = 'Computer Science & Engineering';
  let name = `Student (${identifier})`;

  if (isNumericRoll) {
    if (identifier.startsWith('24')) batchYear = '2024';
    else if (identifier.startsWith('25')) batchYear = '2025';
    else if (identifier.startsWith('26')) batchYear = '2026';

    if (identifier.includes('008')) department = 'AI & Data Science';
    else if (identifier.includes('004')) department = 'Electronics & Communication';
    else if (identifier.includes('025') || identifier.includes('052')) department = 'Information Technology';
  } else {
    // Name format like "anshul.raj", "nv.mohammedfazal", "priyankarupnar"
    const parts = identifier.split('.').filter(Boolean);
    name = parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    department = 'NISC Member';
    batchYear = '2026';
  }

  return {
    rollNumber: identifier,
    batch: isNumericRoll ? `Batch ${batchYear}` : 'Class of 2026',
    department,
    name,
  };
}

/**
 * Generates initial member records seed matching Phase 3 schema
 */
export function generateInitialMemberSeeds() {
  return APPROVED_VOTER_EMAILS.map((email, idx) => {
    const details = deriveMemberDetailsFromEmail(email);
    const safeId = details.rollNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      id: `member_${safeId}`,
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
