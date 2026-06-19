/**
 * Default curated track ids (Spotify track id) shown per entry point.
 * Picks are theme-aligned and usually expose a 30s preview (replace ids if your market has none).
 */
export const CURATED_TRACK_IDS: Record<
  "study" | "party" | "sports" | "headphones",
  readonly string[]
> = {
  /** Study: piano / calm */
  study: [
    "6CcJMwDgXMW13BUWJMjNKi", // Yiruma – River Flows in You
    "6JYwdfSQBQvnkYFrTLvaWm", // Ludovico Einaudi – Nuvole Bianche
    "5jzKL4BDMClWqRguW5q6vh", // Simon & Garfunkel – The Sound of Silence
  ],
  /** Sports: high energy (Blinding Lights often has no 30s preview; Seven Nation Army used instead) */
  sports: [
    "2KH16WveTQWE6GLPUsIsuQ", // Survivor – Eye of the Tiger
    "32OlwWuMpZ6b0aN2RZOeMS", // Mark Ronson ft. Bruno Mars – Uptown Funk
    "11mvDO91FbNYREvlHY106q", // The White Stripes – Seven Nation Army
  ],
  /** Party: pop / dance */
  party: [
    "7qiZfU4dY1lWllzX7mP83H", // Ed Sheeran – Shape of You
    "4uLU6hcVCNGVQkTSJNBMYu", // Rick Astley – Never Gonna Give You Up
    "60nZcOmwrnYyhQdTa8vrWh", // Pharrell Williams – Happy
  ],
  /** Chill / headphone listening — ambient & orchestral (IDs may vary by catalogue) */
  headphones: [
    "6Xajr512QEGAZ20bqAWkyT", // Ólafur Arnalds — Near Light
    "79MKKQE73OQLZrC4BPboEw", // Max Richter — On the Nature of Daylight (example release)
    "060CTdPpXnhcP4nvaMTxiN", // Coldplay — Clocks (common catalogue id)
  ],
};
