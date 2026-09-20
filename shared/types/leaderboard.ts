/** Wire contracts for the package leaderboard endpoints. */
export interface LeaderboardRow {
  rank: number
  name: string
  score: number
  /** Public podium initials. The owner endpoint may omit this field. */
  avatar?: string
  avatarUrl?: string
  isMe?: boolean
}

export interface PublicLeaderboardResponse {
  podium: LeaderboardRow[]
  participants: number
  newThisWeek: number
}

export interface MyLeaderboardResponse {
  period: 'all' | 'week'
  weekStart: number
  weekEnd: number
  participants: number
  podium: LeaderboardRow[]
  rows: LeaderboardRow[]
  me: {
    rank: number
    score: number
    participants: number
  } | null
}

export interface TutorLeaderboardSummary {
  participants: number
  average: number
  highest: number
}
