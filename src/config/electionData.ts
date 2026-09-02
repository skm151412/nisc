/**
 * NISC Election Configuration & Candidates Data
 * Authoritative baseline data definitions for Phase 3
 */

import { Candidate, Election, ElectionStatus } from '../types';

export const INITIAL_ELECTION_ID = 'nisc-election-2026';

export const INITIAL_ELECTION: Election = {
  id: INITIAL_ELECTION_ID,
  title: 'NISC Executive Council General Election 2026',
  description:
    'Official NISC student governance election for Presidential and Vice-Presidential council representation across all batches and academic departments.',
  status: ElectionStatus.UPCOMING,
  totalEligibleVoters: 70,
  createdAt: '2026-08-21T00:00:00.000Z',
  updatedAt: '2026-08-21T00:00:00.000Z',
  openedAt: null,
  closedAt: null,
  resultsPublishedAt: null,
};

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'zeus',
    slug: 'zeus',
    name: 'Anshul Raj',
    codename: 'Zeus',
    year: 'Y25',
    department: 'CSE',
    state: 'Andaman & Nicobar',
    color: '#F59E0B',
    colorLight: '#FEF3C7',
    icon: '⚡',
    contestingFor: ['President', 'Vice President'],
    vision:
      'To transform NISC into a dynamic, tech-forward, and transparent student governing body that fosters innovation, bridges departmental gaps, and champions every student voice across all batches.',
    pillars: [
      {
        title: 'Digital Infrastructure & Academic Excellence',
        description:
          'Modernize academic support, open-source repository sharing, hackathons, and high-performance computing resources.',
      },
      {
        title: 'Transparent Governance & Student Advocacy',
        description:
          'Bi-weekly open senate hearings, budget transparency dashboards, and direct student representation to faculty leadership.',
      },
      {
        title: 'Campus Inclusivity & Cross-Batch Mentorship',
        description:
          'Dedicated transition programs for incoming batches, national cultural showcases, and equal opportunity clubs.',
      },
      {
        title: 'Career Pathways & Industry Synergy',
        description:
          'Direct partnerships with tech hubs, tier-1 internship drives, alumni mentorship circles, and skill certifications.',
      },
    ],
    closingStatement:
      'Together, we bring lightning speed to student welfare and visionary leadership to NISC. Vote for Zeus to empower every student’s ambition.',
    voteCount: 0,
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: 'athena',
    slug: 'athena',
    name: 'Paridhi Gupta',
    codename: 'Athena',
    year: 'Y25',
    department: 'ECE',
    state: 'Rajasthan',
    color: '#8B5CF6',
    colorLight: '#EDE9FE',
    icon: '🛡️',
    contestingFor: ['President', 'Vice President'],
    vision:
      'To build a resilient, equitable, and empathetic student council anchored in robust institutional policy, holistic student well-being, and multidisciplinary collaboration.',
    pillars: [
      {
        title: 'Student Welfare & Mental Health Support',
        description:
          '24/7 peer support networks, wellness workshops, balanced academic scheduling, and expanded campus amenities.',
      },
      {
        title: 'Multidisciplinary Research & Innovation',
        description:
          'Collaborative research grants across engineering streams, inter-departmental design challenges, and lab access democratization.',
      },
      {
        title: 'Sustainable Campus & Infrastructure Upgrade',
        description:
          'Eco-friendly campus initiatives, green mobility, upgraded library access, and digitized lab reservations.',
      },
      {
        title: 'Diversity, Equity & Professional Leadership',
        description:
          'Women in STEM symposiums, leadership accelerators, public speaking leagues, and ethical governance standards.',
      },
    ],
    closingStatement:
      'With wisdom, strategy, and unwavering defense of student rights, Athena stands for a council that listens, protects, and delivers.',
    voteCount: 0,
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: 'poseidon',
    slug: 'poseidon',
    name: 'Granth Jigneshbhai Mangukiya',
    codename: 'Poseidon',
    year: 'Y25',
    department: 'CSE',
    state: 'Gujarat',
    color: '#06B6D4',
    colorLight: '#CFFAFE',
    icon: '🔱',
    contestingFor: ['President', 'Vice President'],
    vision:
      'To unleash an unstoppable wave of student empowerment, entrepreneurial spirit, and vibrant collegiate culture across the National Institute campus.',
    pillars: [
      {
        title: 'Entrepreneurship & Incubation Hub',
        description:
          'Seed funding for student startups, incubator office hours with founders, and patent filing mentorship.',
      },
      {
        title: 'Cultural Renaissance & Sports Grand Prix',
        description:
          'Revitalized inter-university cultural fests, upgraded athletic facilities, esports arenas, and collegiate leagues.',
      },
      {
        title: 'Practical Skill Academies & Hands-on Workshops',
        description:
          'Hardware maker spaces, cloud certifications, product design sprints, and real-world project credits.',
      },
      {
        title: 'Community Outreach & Social Impact',
        description:
          'Student-led social innovation projects, regional STEM teaching initiatives, and environmental action waves.',
      },
    ],
    closingStatement:
      'Ride the tide of transformative progress and dynamic student life. Vote for Poseidon to build a legacy of unstoppable achievement.',
    voteCount: 0,
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
];
