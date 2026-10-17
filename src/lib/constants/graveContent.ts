export const EPITAPHS = [
  "It lived fast, it died in production.",
  "The README was the entire product.",
  "Here lies a side project. It never saw npm publish.",
  "Born on a Friday night, dead by Monday standup.",
  "It compiled once. We should have stopped there.",
  "Gone, but the open tabs remain.",
  "It had a roadmap. It had no users.",
  "Rest in peace, rest in pieces of unfinished tickets.",
  "It was going to be the next big thing.",
  "The git history is the only thing that survived.",
  "It died doing what it loved: accumulating TODOs.",
  "A landing page with no backend. A dream with no deadline.",
  "It was feature complete. Nobody ever knew.",
  "Killed by a better idea at 2am.",
  "It never left localhost.",
  "The tests passed. The motivation didn't.",
  "It asked for funding. It got a star on GitHub instead.",
  "Deployed once, visited never.",
  "It had a logo before it had a purpose.",
  "Here lies a brilliant idea, buried under better priorities.",
];

export const CAUSES = [
  "Shiny New Idea Syndrome",
  "Scope Creep",
  "Lost Interest",
  "Market Timing",
  "Disrupted",
  "Perfectionism",
  "Bad Idea",
  "No Time",
  "Ran Out of Coffee",
  "Dependency Hell",
  "Merge Conflict With Reality",
  "Burnout",
  "Competing Side Project",
  "Nobody Asked For It",
  "Over-Engineering",
  "Analysis Paralysis",
  "Framework Fatigue",
  "Day Job Got in the Way",
  "Co-founder Breakup",
  "It Just Stopped Being Fun",
];

export function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
