// Team names suggested when tagging a bar. Any other team (an English soccer club, a college) can be typed in too.
export const TEAM_GROUPS = [
  { league: 'NFL', teams: ['Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills', 'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns', 'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers', 'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs', 'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins', 'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants', 'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers', 'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'] },
  { league: 'NBA', teams: ['Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers', 'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat', 'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks', 'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns', 'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors', 'Utah Jazz', 'Washington Wizards'] },
  { league: 'WNBA', teams: ['Atlanta Dream', 'Chicago Sky', 'Connecticut Sun', 'Dallas Wings', 'Golden State Valkyries', 'Indiana Fever', 'Las Vegas Aces', 'Los Angeles Sparks', 'Minnesota Lynx', 'New York Liberty', 'Phoenix Mercury', 'Portland Fire', 'Seattle Storm', 'Toronto Tempo', 'Washington Mystics'] },
  { league: 'NHL', teams: ['Anaheim Ducks', 'Boston Bruins', 'Buffalo Sabres', 'Calgary Flames', 'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche', 'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings', 'Edmonton Oilers', 'Florida Panthers', 'Los Angeles Kings', 'Minnesota Wild', 'Montreal Canadiens', 'Nashville Predators', 'New Jersey Devils', 'New York Islanders', 'New York Rangers', 'Ottawa Senators', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks', 'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning', 'Toronto Maple Leafs', 'Utah Mammoth', 'Vancouver Canucks', 'Vegas Golden Knights', 'Washington Capitals', 'Winnipeg Jets'] },
  { league: 'MLB', teams: ['Arizona Diamondbacks', 'Athletics', 'Atlanta Braves', 'Baltimore Orioles', 'Boston Red Sox', 'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds', 'Cleveland Guardians', 'Colorado Rockies', 'Detroit Tigers', 'Houston Astros', 'Kansas City Royals', 'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins', 'Milwaukee Brewers', 'Minnesota Twins', 'New York Mets', 'New York Yankees', 'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 'San Francisco Giants', 'Seattle Mariners', 'St. Louis Cardinals', 'Tampa Bay Rays', 'Texas Rangers', 'Toronto Blue Jays', 'Washington Nationals'] },
  { league: 'MLS', teams: ['Atlanta United', 'Austin FC', 'CF Montréal', 'Charlotte FC', 'Chicago Fire FC', 'Colorado Rapids', 'Columbus Crew', 'D.C. United', 'FC Cincinnati', 'FC Dallas', 'Houston Dynamo FC', 'Inter Miami CF', 'LA Galaxy', 'LAFC', 'Minnesota United FC', 'Nashville SC', 'New England Revolution', 'New York City FC', 'New York Red Bulls', 'Orlando City SC', 'Philadelphia Union', 'Portland Timbers', 'Real Salt Lake', 'San Diego FC', 'San Jose Earthquakes', 'Seattle Sounders FC', 'Sporting Kansas City', 'St. Louis City SC', 'Toronto FC', 'Vancouver Whitecaps FC'] },
  { league: 'NWSL', teams: ['Angel City FC', 'Bay FC', 'Boston Legacy FC', 'Chicago Stars FC', 'Denver Summit FC', 'Houston Dash', 'Kansas City Current', 'NJ/NY Gotham FC', 'North Carolina Courage', 'Orlando Pride', 'Portland Thorns FC', 'Racing Louisville FC', 'San Diego Wave FC', 'Seattle Reign FC', 'Utah Royals FC', 'Washington Spirit'] },
  // 2026-27 season. Three clubs go up and three go down each May, so update this list each summer.
  { league: 'Premier League', teams: ['Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton & Hove Albion', 'Chelsea', 'Coventry City', 'Crystal Palace', 'Everton', 'Fulham', 'Hull City', 'Ipswich Town', 'Leeds United', 'Liverpool', 'Manchester City', 'Manchester United', 'Newcastle United', 'Nottingham Forest', 'Sunderland', 'Tottenham Hotspur'] },
];

// Other names fans use. `names` clearly mean one club, so typing one saves the standard name.
// `nicknames` are too vague to save ("Reds", "United") but still help search.
export const TEAM_ALIASES = {
  Arsenal: { names: ['Arsenal FC'], nicknames: ['Gunners'] },
  'Aston Villa': { names: ['Aston Villa FC'], nicknames: ['Villa'] },
  Bournemouth: { names: ['AFC Bournemouth'], nicknames: ['Cherries'] },
  Brentford: { names: ['Brentford FC'], nicknames: ['Bees'] },
  'Brighton & Hove Albion': { names: ['Brighton', 'Brighton and Hove Albion', 'Brighton & Hove'], nicknames: ['Seagulls'] },
  Chelsea: { names: ['Chelsea FC'], nicknames: ['Blues'] },
  'Coventry City': { names: ['Coventry', 'Coventry City FC'], nicknames: ['Sky Blues'] },
  'Crystal Palace': { names: ['Crystal Palace FC'], nicknames: ['Palace', 'Eagles'] },
  Everton: { names: ['Everton FC'], nicknames: ['Toffees'] },
  Fulham: { names: ['Fulham FC'], nicknames: ['Cottagers'] },
  'Hull City': { names: ['Hull', 'Hull City AFC'], nicknames: ['Tigers'] },
  'Ipswich Town': { names: ['Ipswich', 'Ipswich Town FC'], nicknames: ['Tractor Boys'] },
  'Leeds United': { names: ['Leeds', 'Leeds United FC', 'Leeds Utd'], nicknames: ['Whites'] },
  Liverpool: { names: ['Liverpool FC', 'LFC'], nicknames: ['Reds'] },
  'Manchester City': { names: ['Man City', 'Manchester City FC'], nicknames: ['City', 'Citizens'] },
  'Manchester United': { names: ['Man United', 'Man Utd', 'Manchester United FC', 'Manchester Utd'], nicknames: ['United', 'Red Devils'] },
  'Newcastle United': { names: ['Newcastle', 'Newcastle United FC', 'Newcastle Utd'], nicknames: ['Magpies', 'Toon'] },
  'Nottingham Forest': { names: ["Nott'm Forest", 'Nottm Forest', 'Nottingham Forest FC'], nicknames: ['Forest'] },
  Sunderland: { names: ['Sunderland AFC'], nicknames: ['Black Cats'] },
  'Tottenham Hotspur': { names: ['Tottenham', 'Spurs', 'Tottenham Hotspur FC'], nicknames: [] },
};

export const KNOWN_TEAMS = TEAM_GROUPS.flatMap((g) => g.teams);
const byLower = new Map(KNOWN_TEAMS.map((t) => [t.toLowerCase(), t]));
for (const [team, { names }] of Object.entries(TEAM_ALIASES)) {
  for (const n of names) if (!byLower.has(n.toLowerCase())) byLower.set(n.toLowerCase(), team);
}

// Every name a team goes by, for search.
export const teamNames = (team) => [team, ...(TEAM_ALIASES[team]?.names ?? []), ...(TEAM_ALIASES[team]?.nicknames ?? [])];

// Tidies a typed team name, and uses the standard spelling when it's a known team ("cleveland browns" -> "Cleveland Browns").
export function canonicalTeam(name) {
  const s = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return byLower.get(s.toLowerCase()) ?? s;
}
