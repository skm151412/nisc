/**
 * NISC Election Configuration & Candidates Data
 * Authoritative baseline data definitions for Phase 3
 */

import { Candidate, Election, ElectionStatus } from '../types';
import { APPROVED_VOTER_EMAILS } from './voterAllowlist';

export const INITIAL_ELECTION_ID = 'nisc-election-2026';

export const INITIAL_ELECTION: Election = {
  id: INITIAL_ELECTION_ID,
  title: 'NISC Executive Council General Election 2026',
  description:
    'Official NISC student governance election for Presidential and Vice-Presidential council representation across all batches and academic departments.',
  status: ElectionStatus.UPCOMING,
  totalEligibleVoters: APPROVED_VOTER_EMAILS.length,
  createdAt: '2026-08-21T00:00:00.000Z',
  updatedAt: '2026-08-21T00:00:00.000Z',
  openedAt: null,
  closedAt: null,
  resultsPublishedAt: null,
};

export const CANDIDATE_IMAGE_VERSION = 'v=20260902_2';

export function resolveCandidateArtwork(
  candidate?: {
    id?: string;
    name?: string;
    codename?: string;
    house?: string;
    image?: string;
    imageUrl?: string;
  } | null | string
): string {
  if (!candidate) return `/candidates/paridhi.jpg?${CANDIDATE_IMAGE_VERSION}`;
  const key = typeof candidate === 'string'
    ? candidate.toLowerCase()
    : `${candidate.id || ''} ${candidate.name || ''} ${candidate.codename || ''} ${candidate.house || ''}`.toLowerCase();
  if (key.includes('paridhi') || key.includes('isis') || key.includes('athena')) {
    return `/candidates/paridhi.jpg?${CANDIDATE_IMAGE_VERSION}`;
  }
  if (key.includes('anshul') || key.includes('anubis') || key.includes('zeus')) {
    return `/candidates/anshul.jpg?${CANDIDATE_IMAGE_VERSION}`;
  }
  return `/candidates/aryan.jpg?${CANDIDATE_IMAGE_VERSION}`;
}

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'athena',
    slug: 'isis',
    name: 'Paridhi Gupta',
    codename: 'ISiS',
    house: 'ISiS',
    year: 'Y25',
    department: 'ECE',
    branch: 'ECE',
    state: 'NISC',
    color: '#D97706',
    colorLight: '#FEF3C7',
    icon: '🐍',
    image: resolveCandidateArtwork('paridhi'),
    imageUrl: resolveCandidateArtwork('paridhi'),
    imageAlt: 'Paridhi Gupta — ISiS candidate artwork',
    contestingFor: ['President', 'Vice President'],
    position: 'Candidate for President & Vice President',
    roleInfo: 'Founding Member & Former Y25 Year Admin',
    vision:
      'I want to serve NISC because I believe a strong student community is built through participation, trust, and consistent effort. As one of the founding members of NISC and someone who has represented Y25 as a Year Admin, I have seen how much can be achieved when students work together.\n\nIf given the opportunity to serve, my focus will be on making NISC more useful, inclusive, active, and connected for every member.',
    pillars: [
      {
        title: 'Academic Support',
        description:
          'I want to encourage peer-to-peer learning through study groups, shared resources, doubt-solving sessions, and branch-wise academic support. Seniors can guide juniors in academics, projects, and adapting to college life.',
      },
      {
        title: 'Mentorship & Career Guidance',
        description:
          'NISC can create opportunities for students to learn from seniors and alumni. Wherever possible, we can organise resume reviews, DSA sessions, mock interviews, placement discussions, and career-oriented interactions.',
      },
      {
        title: 'Stronger Community',
        description:
          'NISC should feel like a community where students can approach one another for guidance and support. I want to encourage stronger interaction between different batches, branches, and backgrounds.',
      },
      {
        title: 'Representation & Collaboration',
        description:
          'Student concerns should have a proper channel. I will work towards communicating genuine concerns through the appropriate NISC structure and encourage collaboration with other clubs, cells, and student communities.',
      },
      {
        title: 'Culture With Inclusion',
        description:
          'Our cultural identity is important, but NISC can be much more than cultural activities. We can create opportunities for academic growth, networking, leadership, creativity, and mutual support while respecting our diverse backgrounds.',
      },
    ],
    closingStatement:
      'I do not want to make promises that depend entirely on external approvals. What I can promise is effort, transparency, responsibility, and accountability.\n\nNISC was built by students, and its future should also be built together.',
    signature: '— Paridhi Gupta\n\nY25 | ECE | Founding Member & Former Y25 Year Admin\n\nISiS',
    voteCount: 0,
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: 'zeus',
    slug: 'anubis',
    name: 'Anshul Raj',
    codename: 'ANUBIS',
    house: 'ANUBIS',
    year: 'Y25',
    department: 'CSE',
    branch: 'CSE',
    state: 'NISC',
    color: '#2563EB',
    colorLight: '#EFF6FF',
    icon: '🐺',
    image: resolveCandidateArtwork('anshul'),
    imageUrl: resolveCandidateArtwork('anshul'),
    imageAlt: 'Anshul Raj — ANUBIS candidate artwork',
    contestingFor: ['President', 'Vice President'],
    position: 'Candidate for President & Vice President',
    roleInfo: '',
    vision:
      'I am contesting for a leadership position in NISC because I believe leadership is about being responsible, listening to people, and working with the team to solve problems. I want NISC to become a community where students feel connected, supported, and comfortable sharing their ideas and concerns.\n\nMy vision is to make NISC more connected, active, transparent, and student-focused.',
    pillars: [
      {
        title: 'Student Support',
        description:
          'Students face different challenges during college, whether related to academics, attendance, college processes, or other concerns. I want NISC to provide a proper platform where students can seek guidance and support from fellow members and seniors.',
      },
      {
        title: 'Technical Growth',
        description:
          'NISC can create more opportunities for students to learn and develop practical skills. I would like to encourage activities such as hackathons, coding sessions, technical workshops, project discussions, and skill-based events, based on student interest and available opportunities.',
      },
      {
        title: 'Better Communication',
        description:
          'Good communication is essential for any student community. I want to make communication between students and NISC leadership more accessible, organised, and transparent.',
      },
      {
        title: 'More Student Participation',
        description:
          'NISC should not depend only on a few active members. I want to encourage participation from different years, branches, and backgrounds so that more students can contribute their ideas and talents.',
      },
      {
        title: 'Student Voice',
        description:
          'Students should have a meaningful platform to express their concerns. I want to encourage regular feedback and, wherever feasible, communicate genuine student concerns to the appropriate authorities through proper channels.',
      },
      {
        title: 'Transparency & Accountability',
        description:
          "Leadership comes with responsibility. I will not make promises that are outside NISC's control. Instead, I will focus on honest communication, consistent effort, teamwork, and accountability.",
      },
    ],
    closingStatement:
      "I don't believe one person can build NISC alone. If given the opportunity, I want to work with the members, with the team, and for the community.",
    signature: '— Anshul Raj\n\nY25 | CSE | Candidate for President & Vice President\n\nANUBIS',
    voteCount: 0,
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: 'poseidon',
    slug: 'horus',
    name: 'Aryan Yadav',
    codename: 'HORUS',
    house: 'HORUS',
    year: 'Y26',
    department: 'CSE',
    branch: 'CSE',
    state: 'NISC',
    color: '#0D9488',
    colorLight: '#F0FDFA',
    icon: '🦅',
    image: resolveCandidateArtwork('aryan'),
    imageUrl: resolveCandidateArtwork('aryan'),
    imageAlt: 'Aryan Yadav — HORUS candidate artwork',
    contestingFor: ['President'],
    position: 'Candidate for President',
    roleInfo: '',
    vision:
      'I want to serve as an NISC leader because I want to contribute to the college community, develop my leadership skills, and help fellow students grow. I believe NISC can become an even more active and welcoming community when every member gets an opportunity to participate.\n\nMy vision is simple: a more inclusive, active, student-friendly, and connected NISC.',
    pillars: [
      {
        title: 'Student Engagement',
        description:
          'I want to encourage more students to participate in NISC activities instead of limiting involvement to a small group. Everyone should have the opportunity to contribute ideas, take responsibilities, and be part of the community.',
      },
      {
        title: 'Better Communication',
        description:
          'A strong organisation needs clear communication. I want to improve communication between students and NISC leaders so that members know what is happening and feel comfortable sharing their suggestions and concerns.',
      },
      {
        title: 'Meaningful Events',
        description:
          'I would like to encourage more events, workshops, discussions, and activities focused on learning and skill development. The aim should be to create activities that students actually find useful and enjoyable.',
      },
      {
        title: 'Listening to Students',
        description:
          'Leadership should begin with listening. I want students to have a space where they can openly share their concerns, ideas, and feedback. Where possible, I will work with the team to find practical solutions.',
      },
      {
        title: 'Teamwork & Growth',
        description:
          'NISC should be built around teamwork rather than individual leadership. I want to promote teamwork, creativity, discipline, and a positive learning environment, while giving members opportunities to grow their own leadership skills.',
      },
      {
        title: 'Honest Leadership',
        description:
          'I do not want to make unrealistic promises. My commitment is to lead honestly, take responsibility for my role, listen to members, and work consistently for the benefit of the NISC community.',
      },
    ],
    closingStatement:
      'NISC belongs to all its members. If given the opportunity to lead, I want to help create an environment where everyone can participate, contribute, and grow together.',
    signature: '— Aryan Yadav\n\nY26 | CSE | Candidate for President\n\nHORUS',
    voteCount: 0,
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
];
