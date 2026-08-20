import { Component } from '../core/Component';
import { Icon } from './Icon';

export interface LeaderboardEntry {
  rank: number;
  score: number;
  track?: string;
  mode?: string;
  date?: string;
}

export interface LeaderboardRowOptions {
  entry: LeaderboardEntry;
  columns: Array<'rank' | 'score' | 'track' | 'mode' | 'date'>;
}

/**
 * Single leaderboard table row with medal formatting and tabular-nums alignment.
 */
export class LeaderboardRow extends Component<HTMLTableRowElement> {
  constructor(opts: LeaderboardRowOptions) {
    super('tr', '');
    const { entry, columns } = opts;

    if (entry.rank <= 3) this.el.classList.add('top-three');

    for (const col of columns) {
      const td = document.createElement('td');

      switch (col) {
        case 'rank': {
          td.className = 'rank-col';
          if (entry.rank <= 3) {
            const icon = new Icon({ name: 'medal', size: 16 });
            icon.el.style.verticalAlign = 'middle';
            icon.el.style.marginRight = '4px';
            td.appendChild(icon.el);
          }
          td.appendChild(document.createTextNode(String(entry.rank)));
          break;
        }
        case 'score': {
          td.className = 'score-col';
          td.textContent = entry.score.toLocaleString();
          break;
        }
        case 'track': {
          td.textContent = entry.track ?? '—';
          break;
        }
        case 'mode': {
          td.textContent = entry.mode ?? '—';
          break;
        }
        case 'date': {
          td.textContent = entry.date ?? '—';
          break;
        }
      }

      this.el.appendChild(td);
    }
  }
}
