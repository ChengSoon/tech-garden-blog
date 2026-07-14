import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ListeningTrack } from '../../data/listening';
import './immersive-deck.css';

interface Props {
  tracks: ListeningTrack[];
  /** 仅作背景大碟机；点击大碟切换 */
  mode?: 'bg' | 'page';
}

export default function ImmersiveDeck({ tracks, mode = 'bg' }: Props) {
  const labelId = useId();
  const list = useMemo(() => tracks.filter(Boolean), [tracks]);
  const [index, setIndex] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [bump, setBump] = useState(false);
  const bumpTimer = useRef<number | null>(null);

  const track = list[index] ?? list[0];

  useEffect(() => {
    return () => {
      if (bumpTimer.current != null) window.clearTimeout(bumpTimer.current);
    };
  }, []);

  const switchDisc = useCallback(() => {
    if (list.length < 2) return;
    setBump(true);
    setSpinning(false);
    if (bumpTimer.current != null) window.clearTimeout(bumpTimer.current);
    bumpTimer.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % list.length);
      setBump(false);
      setSpinning(true);
    }, 280);
  }, [list.length]);

  if (!track) return null;

  const accent = track.accent ?? '#9b7b4a';
  const monogram = track.monogram ?? track.title.slice(0, 2).toUpperCase();
  const nextTrack = list[(index + 1) % list.length];

  return (
    <div
      className={`bgdeck bgdeck--${mode}${spinning ? ' is-spinning' : ''}${bump ? ' is-bump' : ''}`}
      style={{ ['--deck-accent' as string]: accent }}
      aria-labelledby={labelId}
    >
      {/* soft cover wash */}
      <img className="bgdeck__wash" src={track.cover} alt="" aria-hidden="true" />
      <div className="bgdeck__veil" aria-hidden="true" />

      {/* one big machine in the background */}
      <button
        type="button"
        className="bgdeck__machine"
        onClick={switchDisc}
        aria-label={`当前《${track.title}》，点击切换到下一张${nextTrack && list.length > 1 ? `《${nextTrack.title}》` : ''}`}
        title="点击切换碟片"
      >
        <span className="bgdeck__chassis" aria-hidden="true">
          <span className="bgdeck__panel" />
          <span className="bgdeck__vent" />
          <span className="bgdeck__feet" />
        </span>

        <span className="bgdeck__platter" aria-hidden="true">
          <span className="bgdeck__mat" />
          <span className={`bgdeck__disc${spinning ? ' is-on' : ''}`}>
            <span className="bgdeck__disc-face">
              <span className="bgdeck__grooves" />
              <span className="bgdeck__iris" />
              <span className="bgdeck__label">
                <img src={track.cover} alt="" />
                <em>{monogram}</em>
              </span>
              <span className="bgdeck__hub" />
              <span className="bgdeck__shine" />
            </span>
          </span>
          <span className={`bgdeck__arm${spinning ? ' is-down' : ''}`}>
            <i className="bgdeck__arm-pivot" />
            <i className="bgdeck__arm-rod" />
            <i className="bgdeck__arm-head" />
          </span>
          <span className="bgdeck__spindle" />
        </span>

        <span className="bgdeck__caption">
          <span className="bgdeck__kicker" id={labelId}>
            Now Playing · click to switch
          </span>
          <span className="bgdeck__title">{track.title}</span>
          <span className="bgdeck__meta">
            {track.artist} · {track.album}
          </span>
          <span className="bgdeck__index">
            {String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
          </span>
        </span>
      </button>
    </div>
  );
}
