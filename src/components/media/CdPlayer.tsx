import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ListeningTrack } from '../../data/listening';
import { formatTime } from '../../lib/time';
import './cd-player.css';

interface Props {
  tracks: ListeningTrack[];
  /** full: /now 展示台；compact: 首页 */
  variant?: 'full' | 'compact';
  initialId?: string;
}

export default function CdPlayer({ tracks, variant = 'full', initialId }: Props) {
  const labelId = useId();
  const list = useMemo(() => tracks.filter(Boolean), [tracks]);
  const startIndex = Math.max(
    0,
    list.findIndex((t) => t.id === initialId),
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  const [index, setIndex] = useState(startIndex === -1 ? 0 : startIndex);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [swapDir, setSwapDir] = useState<'next' | 'prev'>('next');

  const track = list[index] ?? list[0];
  const duration = track?.durationSec ?? 0;
  const hasAudio = Boolean(track?.src);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const resetClock = useCallback(() => {
    stopRaf();
    startedAtRef.current = null;
    accumulatedRef.current = 0;
    setCurrent(0);
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [stopRaf]);

  const tickSim = useCallback(() => {
    const started = startedAtRef.current;
    if (started == null) return;
    const elapsed = accumulatedRef.current + (performance.now() - started) / 1000;
    if (elapsed >= duration) {
      setCurrent(duration);
      setPlaying(false);
      accumulatedRef.current = 0;
      startedAtRef.current = null;
      stopRaf();
      return;
    }
    setCurrent(elapsed);
    rafRef.current = requestAnimationFrame(tickSim);
  }, [duration, stopRaf]);

  useEffect(() => () => stopRaf(), [stopRaf]);

  useEffect(() => {
    if (!hasAudio || !audioRef.current || !track?.src) return;
    const el = audioRef.current;
    el.src = track.src;
    const onTime = () => setCurrent(el.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
    };
  }, [hasAudio, track?.src, track?.id]);

  async function toggle() {
    if (!track) return;
    if (hasAudio && audioRef.current) {
      const el = audioRef.current;
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        try {
          await el.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        }
      }
      return;
    }

    if (playing) {
      if (startedAtRef.current != null) {
        accumulatedRef.current += (performance.now() - startedAtRef.current) / 1000;
      }
      startedAtRef.current = null;
      stopRaf();
      setPlaying(false);
      return;
    }

    if (current >= duration) {
      setCurrent(0);
      accumulatedRef.current = 0;
    }
    startedAtRef.current = performance.now();
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tickSim);
  }

  function seek(ratio: number) {
    const next = Math.min(duration, Math.max(0, ratio * duration));
    setCurrent(next);
    if (hasAudio && audioRef.current) {
      audioRef.current.currentTime = next;
      return;
    }
    accumulatedRef.current = next;
    if (playing) startedAtRef.current = performance.now();
  }

  function changeDisc(dir: 'next' | 'prev') {
    if (list.length < 2 || swapping) return;
    setSwapDir(dir);
    setSwapping(true);
    resetClock();
    window.setTimeout(() => {
      setIndex((i) => {
        if (dir === 'next') return (i + 1) % list.length;
        return (i - 1 + list.length) % list.length;
      });
      setSwapping(false);
    }, 280);
  }

  function selectDisc(i: number) {
    if (i === index || swapping) return;
    setSwapDir(i > index ? 'next' : 'prev');
    setSwapping(true);
    resetClock();
    window.setTimeout(() => {
      setIndex(i);
      setSwapping(false);
    }, 280);
  }

  if (!track) return null;

  const progress = duration > 0 ? current / duration : 0;
  const monogram = track.monogram ?? track.title.slice(0, 2).toUpperCase();
  const accent = track.accent ?? 'var(--brass)';

  return (
    <section
      className={`cdp cdp--${variant}${playing ? ' is-playing' : ''}${swapping ? ' is-swapping' : ''}`}
      style={{ ['--cd-accent' as string]: accent }}
      aria-labelledby={labelId}
    >
      <audio ref={audioRef} preload="metadata" />

      <div className="cdp__showcase">
        <div className={`cdp__jacket cdp__swap-${swapDir}${swapping ? ' is-out' : ''}`}>
          <div className="cdp__jacket-spine" aria-hidden="true" />
          <div className="cdp__jacket-face">
            <img
              src={track.cover}
              alt={`${track.album} 封面`}
              width={480}
              height={480}
              draggable={false}
            />
            <div className="cdp__jacket-glare" aria-hidden="true" />
          </div>
          <div className="cdp__jacket-shadow" aria-hidden="true" />
        </div>

        <div className="cdp__stage" aria-hidden="true">
          <div className="cdp__platter">
            <div className="cdp__shadow" />
            <div
              className={`cdp__disc${playing ? ' is-spinning' : ''} cdp__swap-${swapDir}${swapping ? ' is-out' : ''}`}
            >
              <div className="cdp__grooves" />
              <div className="cdp__iridescence" />
              <div className="cdp__label">
                <img src={track.cover} alt="" className="cdp__label-art" draggable={false} />
                <span className="cdp__mono">{monogram}</span>
              </div>
              <div className="cdp__hub" />
              <div className="cdp__shine" />
            </div>
            <div className={`cdp__arm${playing ? ' is-down' : ''}`}>
              <span className="cdp__arm-base" />
              <span className="cdp__arm-bar" />
              <span className="cdp__arm-head" />
            </div>
          </div>
        </div>
      </div>

      <div className="cdp__panel">
        <div className="cdp__panel-top">
          <p className="eyebrow" id={labelId}>
            Listening Deck
          </p>
          <span className="cdp__count muted">
            {String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
          </span>
        </div>

        <h2 className="display cdp__title">{track.title}</h2>
        <p className="cdp__meta">
          <span>{track.artist}</span>
          <span className="cdp__dot" aria-hidden="true">
            ·
          </span>
          <span>{track.album}</span>
        </p>
        {variant === 'full' && track.note ? (
          <p className="cdp__note muted">{track.note}</p>
        ) : null}

        {list.length > 1 ? (
          <div className="cdp__rack" role="listbox" aria-label="选择碟片">
            {list.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={i === index}
                className={`cdp__thumb${i === index ? ' is-active' : ''}`}
                onClick={() => selectDisc(i)}
                title={t.title}
              >
                <img src={t.cover} alt="" width={72} height={72} draggable={false} />
                <span className="cdp__thumb-meta">
                  <strong>{t.title}</strong>
                  <em>{t.artist}</em>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="cdp__transport">
          <div className="cdp__nav">
            <button
              type="button"
              className="btn cdp__icon-btn"
              onClick={() => changeDisc('prev')}
              disabled={list.length < 2}
              aria-label="上一张碟"
            >
              ‹
            </button>
            <button
              type="button"
              className="cdp__play btn btn-primary"
              onClick={toggle}
              aria-pressed={playing}
              aria-label={playing ? '暂停' : '播放'}
            >
              <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
              <span>{playing ? '暂停' : '播放'}</span>
            </button>
            <button
              type="button"
              className="btn cdp__icon-btn"
              onClick={() => changeDisc('next')}
              disabled={list.length < 2}
              aria-label="下一张碟"
            >
              ›
            </button>
          </div>

          <div className="cdp__scrub">
            <div className="cdp__times">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="cdp__track-wrap">
              <div className="cdp__track" aria-hidden="true">
                <span className="cdp__fill" style={{ transform: `scaleX(${progress})` }} />
              </div>
              <input
                className="cdp__range"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                aria-label="播放进度"
                onChange={(e) => seek(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {!hasAudio && variant === 'full' ? (
          <p className="cdp__hint muted">演示模式 · 在 listening.ts 为曲目添加 src 可真播放</p>
        ) : null}
      </div>
    </section>
  );
}
