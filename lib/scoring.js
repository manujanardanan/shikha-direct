import { query } from "./db";

const ATTEMPT_SIZE = 15;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function buildL1Session() {
  const { rows: domains } = await query("select key from content_domains");
  const chosenKeys = [];
  for (const d of domains) {
    const { rows } = await query(
      "select key from content_l1_stories where primary_domain = $1",
      [d.key]
    );
    if (rows.length === 0) continue;
    const pick = rows[Math.floor(Math.random() * rows.length)];
    chosenKeys.push(pick.key);
  }
  const storyKeys = shuffle(chosenKeys);

  const { rows: stories } = await query(
    `select key, icon, title, story_text, decisions
     from content_l1_stories where key = any($1::text[])`,
    [storyKeys]
  );
  const byKey = Object.fromEntries(stories.map((s) => [s.key, s]));
  const ordered = storyKeys.map((k) => sanitizeStory(byKey[k]));
  return { storyKeys, stories: ordered };
}

export async function buildL2Session(domainKey) {
  const { rows: stories } = await query(
    `select key, icon, title, story_text, decisions
     from content_l2_stories where domain_key = $1`,
    [domainKey]
  );
  const storyKeys = shuffle(stories.map((s) => s.key));
  const byKey = Object.fromEntries(stories.map((s) => [s.key, s]));
  const ordered = storyKeys.map((k) => sanitizeStory(byKey[k]));
  return { storyKeys, stories: ordered };
}

function sanitizeStory(story) {
  const decisions = story.decisions.map((d) => ({
    prompt: d.prompt,
    options: d.options.map((o, idx) => ({ index: idx, text: o.t })),
  }));
  return {
    key: story.key,
    icon: story.icon,
    title: story.title,
    text: story.story_text,
    decisions,
  };
}

export async function buildL3Session(testKey) {
  const { rows: questions } = await query(
    `select id, subject, topic, question_text, options
     from content_l3_questions where test_key = $1`,
    [testKey]
  );
  const chosen = shuffle(questions).slice(0, ATTEMPT_SIZE);
  const questionIds = chosen.map((q) => q.id);
  const sanitized = chosen.map((q) => ({
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    question: q.question_text,
    options: q.options.map((text, idx) => ({ index: idx, text })),
  }));
  return { questionIds, questions: sanitized };
}

export async function gradeL1(sessionId) {
  const { rows: answers } = await query(
    "select story_key, decision_index, option_index from l1_answers where session_id = $1",
    [sessionId]
  );
  const { rows: stories } = await query(
    "select key, decisions from content_l1_stories where key = any($1::text[])",
    [answers.map((a) => a.story_key)]
  );
  const byKey = Object.fromEntries(stories.map((s) => [s.key, s.decisions]));

  const tally = {};
  for (const a of answers) {
    const decisions = byKey[a.story_key];
    if (!decisions) continue;
    const opt = decisions[a.decision_index]?.options?.[a.option_index];
    if (!opt) continue;
    tally[opt.d] = (tally[opt.d] || 0) + 1;
  }
  const topDomain = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { tally, topDomain };
}

export async function gradeL2(sessionId) {
  const { rows: answers } = await query(
    "select story_key, decision_index, option_index from l2_answers where session_id = $1",
    [sessionId]
  );
  const { rows: stories } = await query(
    "select key, decisions from content_l2_stories where key = any($1::text[])",
    [answers.map((a) => a.story_key)]
  );
  const byKey = Object.fromEntries(stories.map((s) => [s.key, s.decisions]));

  const tally = {};
  for (const a of answers) {
    const decisions = byKey[a.story_key];
    if (!decisions) continue;
    const opt = decisions[a.decision_index]?.options?.[a.option_index];
    if (!opt) continue;
    tally[opt.c] = (tally[opt.c] || 0) + 1;
  }
  const topCareer = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { tally, topCareer };
}

export async function gradeL3(sessionId) {
  const { rows: answers } = await query(
    `select a.question_id, a.chosen_option_id, q.correct_option_id, q.topic
     from l3_answers a
     join content_l3_questions q on q.id = a.question_id
     where a.session_id = $1`,
    [sessionId]
  );
  let correctCount = 0;
  const weakTopicCounts = {};
  const breakdown = answers.map((a) => {
    const isCorrect = a.chosen_option_id === a.correct_option_id;
    if (isCorrect) correctCount++;
    else weakTopicCounts[a.topic] = (weakTopicCounts[a.topic] || 0) + 1;
    return {
      questionId: a.question_id,
      chosenOptionId: a.chosen_option_id,
      correctOptionId: a.correct_option_id,
      isCorrect,
    };
  });
  const total = answers.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const band = score >= 80 ? "Strong" : score >= 55 ? "On track" : "Needs work";
  const weakTopics = Object.entries(weakTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);

  return { correctCount, total, score, band, weakTopics, breakdown };
}
