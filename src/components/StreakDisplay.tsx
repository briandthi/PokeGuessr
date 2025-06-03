import React from "react";

type StreakDisplayProps = {
  streak: number;
  anim: "up" | "reset" | null;
};

export function StreakDisplay({ streak, anim }: StreakDisplayProps) {
  // Détermine l’intensité de l’animation selon le palier de streak
  let intensity = 1;
  if (streak >= 15) intensity = 3;
  else if (streak >= 10) intensity = 2;
  else if (streak >= 5) intensity = 1.5;

  // Couleur dynamique
  // Palette : gris (0), vert (1-4), jaune (5-9), orange (10-14), rouge (15+)
  const color =
    streak === 0
      ? "#a3a3a3" // gris
      : streak < 5
      ? "#4ade80" // vert
      : streak < 10
      ? "#ffe066" // jaune
      : streak < 15
      ? "#ff7f00" // orange
      : "#ff1a1a"; // rouge

  // Glow dynamique
  const glow =
    streak >= 15
      ? "0 0 32px 8px #ff1a1a, 0 0 64px 16px #ff7f00"
      : streak >= 10
      ? "0 0 24px 6px #ff7f00, 0 0 48px 12px #ffa500"
      : streak >= 5
      ? "0 0 16px 4px #ffa500"
      : "0 0 8px 2px #ffb347";

  return (
    <div
      className="absolute -top-4 -right-7 flex items-center gap-1 z-20 select-none pointer-events-none justify-center rotate-45"
      style={{
        minWidth: 64,
        minHeight: 40,
        filter: `drop-shadow(${glow})`,
        transition: "filter 0.2s",
      }}
    >
      <span
        className={`text-2xl font-extrabold ${
          streak === 0
            ? "text-gray-400"
            : streak < 5
            ? "text-green-400"
            : streak < 10
            ? "text-yellow-400"
            : streak < 15
            ? "text-orange-500"
            : "text-red-600"
        } ${
          anim === "up" ? "animate-streak-smash" : anim === "reset" ? "animate-streak-reset" : ""
        }`}
        style={{
          color: color,
          textShadow:
            streak >= 15
              ? "0 0 12px #fff, 0 0 24px #ff1a1a"
              : streak >= 10
              ? "0 0 8px #fff, 0 0 16px #ff7f00"
              : streak >= 5
              ? "0 0 4px #fff, 0 0 8px #ffe066"
              : undefined,
          fontSize: 24 + intensity * 4,
          transition: "color 0.2s, text-shadow 0.2s, font-size 0.2s"
        }}
      >
        x{streak}
      </span>
      <style>
        {`
        @keyframes streak-smash {
          0% { transform: scale(1) rotate(0deg);}
          20% { transform: scale(${1 + 0.7 * intensity}) rotate(-12deg);}
          40% { transform: scale(${1 + 0.3 * intensity}) rotate(8deg);}
          60% { transform: scale(${1 + 0.1 * intensity}) rotate(-4deg);}
          80% { transform: scale(1.1) rotate(2deg);}
          100% { transform: scale(1) rotate(0deg);}
        }
        .animate-streak-smash {
          animation: streak-smash 0.7s cubic-bezier(.4,2,.6,1) both;
        }
        @keyframes streak-reset {
          0% { transform: scale(1) rotate(0deg);}
          20% { transform: scale(${1 + 0.5 * intensity}) rotate(-10deg);}
          40% { transform: scale(${1 - 0.2 * intensity}) rotate(10deg);}
          60% { transform: scale(${1 + 0.1 * intensity}) rotate(-8deg);}
          100% { transform: scale(1) rotate(0deg);}
        }
        .animate-streak-reset {
          animation: streak-reset 0.7s cubic-bezier(.4,2,.6,1) both;
        }
        `}
      </style>
    </div>
  );
}