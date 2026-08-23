"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Game } from "@/data/games";
import { saveScore } from "@/data/scores";
import { useSession } from "@/app/lib/session";
import {
  createAsteroidsGame,
  type AsteroidsGame,
} from "@/app/components/games/asteroids-engine";

export function AsteroidsPlayerClient({ game }: { game: Game }) {
  const { user } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AsteroidsGame | null>(null);

  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createAsteroidsGame(canvas, (score) => {
      setFinalScore(score);
      setOver(true);
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const togglePause = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) {
      engine.resume();
    } else {
      engine.pause();
    }
    setPaused((p) => !p);
  };

  const endGame = () => {
    engineRef.current?.forceGameOver();
  };

  const restart = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset();
    engine.resume();
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  const handleSaveScore = async () => {
    setSaving(true);
    await saveScore({ gameId: game.id, playerName: name, score: finalScore });
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }} />
        <div className="hud-actions">
          <button className="btn yellow" onClick={togglePause}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/game/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{finalScore.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={handleSaveScore}
                  disabled={saving}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
