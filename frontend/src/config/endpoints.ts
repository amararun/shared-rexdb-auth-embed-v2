export const flowiseEndpoints = [
  {
    id: 1,
    name: "Google Gemini Flash 2.0",
    url: import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI_NOERR,
    description: "🔎 Analysis ➔ gemini-2.0-flash   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "excellent Perf. - Lowest Cost"
  },
  {
    id: 4,
    name: "Deepseek-R1",
    url: import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_DEEPSEEK,
    description: "🔎 Analysis ➔ deepseek-r1   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "Top Level Perf. -Higher Cost"
  },
  {
    id: 3,
    name: "Open AI o3-mini",
    url: import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT,
    description: "🔎 Analysis ➔ o3-mini   ⚡️ Reviewer + Executor ➔ gpt-4o",
    type: "OK Perf. -Low Cost"
  },
  {
    id: 2,
    name: "Gemini Flash 2.0 + Error Handling",
    url: import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI,
    description: "🔎 Analysis ➔ gemini-2.0-flash   ⚡️ Reviewer + Executor ➔ gpt-4o-mini   🛠️ Error Handler ➔ gpt-4o-mini",
    type: "testing"
  },
  {
    id: 5,
    name: "Gemini Flash 2.0 + Debugger Agent",
    url: import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI_DEBUG,
    description: "🔎 Analysis ➔ gemini-2.0-flash   ⚡️ Reviewer + Executor ➔ gpt-4o-mini   🛠️ Seperate Error Debugger Agent ➔ gpt-4o",
    type: "testing"
  },
  {
    id: 6,
    name: "Claude 3.7 Sonnet",
    url: import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_CLAUDE,
    description: "🔎 Analysis ➔ claude-3.7-sonnet   ⚡️ Reviewer + Executor ➔ gpt-4o" ,
    type: "Best Performance - Highest Cost"
  }
];

// Change default endpoint to Google Gemini Flash 2.0 (first endpoint)
export const defaultEndpoint = flowiseEndpoints[0]; 

// General Analyst Note - Edit this to update the note in the UI
export const GENERAL_ANALYST_NOTE = "Note: Each Advanced Analyst framework includes a General Analyst Agent (gpt-4o-mini) that handles simpler queries as a unified analyzer and executor agent.";

/**
 * Note: Each Advanced Analyst framework includes a General Analyst Agent (gpt-4o-mini)
 * that handles simpler queries as a unified analyzer and executor agent.
 */ 