import { query } from "./db";
import { CAREER_CONTENT, DOMAIN_EXPOSURE_ACTIVITIES } from "./careerContent";

export const RIASEC_MAP = {
  explorer: {
    code: "I",
    name: "Investigative",
    description:
      "analytical and curious -- energized by understanding how things work, solving open-ended problems, and digging into cause and effect",
  },
  creator: {
    code: "A",
    name: "Artistic",
    description:
      "expressive and original -- motivated by self-expression, aesthetics, and work that has few fixed rules",
  },
  helper: {
    code: "S",
    name: "Social",
    description: "supportive and communicative -- drawn to teaching, guiding, or caring for other people",
  },
  builder: {
    code: "R",
    name: "Realistic",
    description:
      "hands-on and practical -- prefers working with tools, machines, or the physical world over abstract discussion",
  },
  leader: {
    code: "E",
    name: "Enterprising",
    description:
      "persuasive and ambitious -- energized by leading, organizing, or influencing others toward a goal",
  },
  organizer: {
    code: "C",
    name: "Conventional",
    description: "methodical and detail-oriented -- thrives with structure, accuracy, and clear procedures",
  },
};

// Softer, non-clinical band language for a product with no counselor in the
// loop to contextualize a harsher-sounding label in person. Internal `band`
// values ("Strong" / "On track" / "Needs work") are unchanged for scoring
// logic and for the school product's tone -- this is purely a display layer.
const SAFE_BAND_LABEL = {
  Strong: "Well-prepared",
  "On track": "Building well",
  "Needs work": "Just getting started",
};

const BAND_TEXT = {
  Strong: {
    headline: "shows strong readiness",
    note:
      "is already answering at a level consistent with the subject-matter demands of this path. The recommendation here is to maintain momentum -- consider advanced coursework, competitions, or mentorship opportunities rather than remedial review.",
  },
  "On track": {
    headline: "is on track, with room to close gaps",
    note:
      "shows genuine aptitude for this path but hasn't yet consolidated it. Targeted practice on the specific weak topics below -- rather than broad revision -- is likely to move this score meaningfully before any real exam.",
  },
  "Needs work": {
    headline: "is at an early stage on subject readiness",
    note:
      "this doesn't mean a poor fit for this path -- interest and current readiness are measuring different things. It does mean the subject fundamentals need direct attention before this becomes a realistic near-term goal. Treat this as a starting point for a study plan, not a verdict.",
  },
};

const STANDARD_CAVEATS = [
  "This result reflects a first instinct captured through a short, guided exercise -- not a diagnosis, an aptitude test in the clinical sense, or a fixed prediction of who this student will become.",
  "Interests at this age are heavily shaped by exposure. A quieter result in one domain does not mean a student is unsuited to it -- only that today's exercise didn't surface it as a first instinct.",
  "This is one input among many that should inform a conversation -- alongside academic performance, direct exposure to a field, and the student's own evolving sense of themselves.",
  "It's genuinely common for a result to differ from what a parent expected or hoped for. That's not a cause for concern -- it's simply useful information to talk through together, calmly, rather than a decision made from this result alone.",
  "If you're considering a retake, we'd recommend waiting at least 6 months. Retaking sooner tends to reflect short-term mood rather than a meaningful shift in genuine interest.",
];

function buildNarrative({ student, l1, l2, l3, riasec }) {
  const body = [];
  if (l1) {
    body.push(
      `${student} was guided through six short scenario-based stories, each surfacing natural leanings across six broad domains rather than asking directly "what do you want to be." The strongest and most consistent pattern across those choices placed them in the ${l1.domain.label} domain -- ${l1.domain.blurb}`
    );
  }
  if (l2) {
    body.push(
      `Within that domain, a second, more specific round of scenarios -- framed as "a day in the life" of different careers -- narrowed this further toward ${l2.career.label}. ${l2.career.blurb}`
    );
  }
  if (l3) {
    const bandInfo = BAND_TEXT[l3.band] || BAND_TEXT["On track"];
    let l3text = `To check how this interest lines up with real subject-matter demand, ${student} completed a subject-based readiness check aligned to this path. At this level, the student ${bandInfo.headline}: ${bandInfo.note}`;
    if (l3.weakTopics && l3.weakTopics.length > 0) {
      l3text += ` The specific topics worth another look: ${l3.weakTopics.join(", ")}.`;
    }
    body.push(l3text);
  } else if (l2) {
    body.push(
      `A subject-matter readiness check for this specific career isn't available yet in the question bank -- interest and direction are established, but there's no readiness score to report yet.`
    );
  }

  const intro = riasec
    ? `This report is grounded in Holland's RIASEC theory of vocational choice (Holland, 1959) -- the most widely used framework in career counseling. Based on ${student}'s choices across this journey, their strongest profile match is ${riasec.name} (${riasec.code}): ${riasec.description}.`
    : `This student has not yet completed Level 1, so no RIASEC-grounded profile is available.`;

  return { intro, body };
}

// Builds the report for one student. Returns a trimmed "teaser" shape when
// locked=false, and the full report (matching the school product's depth)
// when locked=true is overridden by an actual unlock record.
export async function buildStudentReport(studentId) {
  const { rows: studentRows } = await query(
    "select display_name from students where id = $1",
    [studentId]
  );
  if (studentRows.length === 0) return null;
  const studentName = studentRows[0].display_name;

  const { rows: unlockRows } = await query(
    "select unlocked_at from report_unlocks where student_id = $1",
    [studentId]
  );
  const unlocked = unlockRows.length > 0;

  const { rows: l1Rows } = await query(
    `select result_domain, result_tally, completed_at from l1_sessions
     where student_id = $1 and completed_at is not null
     order by completed_at desc limit 1`,
    [studentId]
  );

  let l1 = null;
  let riasec = null;
  if (l1Rows.length > 0) {
    const { rows: domainRows } = await query(
      "select key, label, blurb, stream from content_domains where key = $1",
      [l1Rows[0].result_domain]
    );
    if (domainRows.length > 0) {
      l1 = { domain: domainRows[0], completedAt: l1Rows[0].completed_at };
      riasec = RIASEC_MAP[domainRows[0].key];
      if (l1Rows[0].result_tally) {
        const { rows: allDomains } = await query("select key, label from content_domains");
        const labelByKey = Object.fromEntries(allDomains.map((d) => [d.key, d.label]));
        const total = Object.values(l1Rows[0].result_tally).reduce((a, b) => a + b, 0);
        l1.tallyBreakdown = Object.entries(l1Rows[0].result_tally)
          .map(([key, count]) => ({ key, label: labelByKey[key] || key, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 }))
          .sort((a, b) => b.count - a.count);
      }
    }
  }

  const { rows: l2Rows } = await query(
    `select domain_key, result_career, result_tally, completed_at from l2_sessions
     where student_id = $1 and completed_at is not null
     order by completed_at desc limit 1`,
    [studentId]
  );

  let l2 = null;
  let careerDetail = null;
  if (l2Rows.length > 0) {
    const { rows: careerRows } = await query(
      "select career_key, label, blurb from content_l2_careers where domain_key = $1 and career_key = $2",
      [l2Rows[0].domain_key, l2Rows[0].result_career]
    );
    if (careerRows.length > 0) {
      l2 = { career: careerRows[0], completedAt: l2Rows[0].completed_at };
      careerDetail = CAREER_CONTENT[careerRows[0].career_key] || null;

      if (l2Rows[0].result_tally) {
        const { rows: allCareers } = await query(
          "select career_key, label from content_l2_careers where domain_key = $1",
          [l2Rows[0].domain_key]
        );
        const labelByKey = Object.fromEntries(allCareers.map((c) => [c.career_key, c.label]));
        const total = Object.values(l2Rows[0].result_tally).reduce((a, b) => a + b, 0);
        l2.tallyBreakdown = Object.entries(l2Rows[0].result_tally)
          .map(([key, count]) => ({ key, label: labelByKey[key] || key, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 }))
          .sort((a, b) => b.count - a.count);
      }
    }
  }

  const { rows: l3Rows } = await query(
    `select score, band, weak_topics, computed_at from l3_results
     where student_id = $1 order by computed_at desc limit 1`,
    [studentId]
  );
  let l3 = null;
  if (l3Rows.length > 0) {
    l3 = {
      score: l3Rows[0].score,
      band: l3Rows[0].band,
      safeBand: SAFE_BAND_LABEL[l3Rows[0].band] || l3Rows[0].band,
      weakTopics: l3Rows[0].weak_topics || [],
      computedAt: l3Rows[0].computed_at,
    };
  }

  // ---- TEASER (free): identity of the result, no depth, no raw score ----
  const teaser = {
    locked: true,
    student: studentName,
    topDomainLabel: l1?.domain?.label || null,
    topCareerLabel: l2?.career?.label || null,
    readinessBand: l3?.safeBand || null,
  };

  if (!unlocked) {
    return teaser;
  }

  // ---- FULL REPORT (paid): same depth as the school product ----
  const narrative = buildNarrative({ student: studentName, l1, l2, l3, riasec });

  return {
    locked: false,
    student: studentName,
    l1,
    l2,
    l3,
    riasec,
    narrative,
    careerDetail,
    caveats: STANDARD_CAVEATS,
    generatedAt: new Date().toISOString(),
  };
}
