import { TEAM_GROUPS } from '@/lib/teams';

// Suggestions for team name boxes. People can still type any team.
export default function TeamOptions({ id = 'team-list' }) {
  return (
    <datalist id={id}>
      {TEAM_GROUPS.flatMap((g) => g.teams.map((t) => <option key={`${g.league}-${t}`} value={t} label={g.league} />))}
    </datalist>
  );
}
