import React from "react";
import { GuessPokemonCard } from "./GuessPokemonCard";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";

type DefiResult = {
  pokemonId: number;
  userAnswer: string;
  correctName: string | null;
  isCorrect: boolean;
  passed: boolean;
  timeTaken: number; // en secondes
};

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const NB_POKEMON_OPTIONS = [10, 20, 30, 40, 50, 100];
const MAX_ATTEMPTS_OPTIONS = [1, 2, 3];
const MODES = ["normal", "lacunes"] as const;
type Mode = typeof MODES[number];

export function Defi() {
  const [open, setOpen] = React.useState(false);
  // Initialisation des paramètres depuis le localStorage
  const [selectedGens, setSelectedGens] = React.useState<number[]>(() => {
    const saved = localStorage.getItem("defi.selectedGens");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.every((g) => typeof g === "number")) {
          return arr;
        }
      } catch {}
    }
    return GENERATIONS;
  });
  const [nbPokemon, setNbPokemon] = React.useState<number>(() => {
    const saved = localStorage.getItem("defi.nbPokemon");
    if (saved) {
      const n = Number(saved);
      if (NB_POKEMON_OPTIONS.includes(n)) return n;
    }
    return 20;
  });
  const [maxAttempts, setMaxAttempts] = React.useState<number>(() => {
    const saved = localStorage.getItem("defi.maxAttempts");
    if (saved) {
      const n = Number(saved);
      if (MAX_ATTEMPTS_OPTIONS.includes(n)) return n;
    }
    return 1;
  });
  const [mode, setMode] = React.useState<Mode>(() => {
    const saved = localStorage.getItem("defi.mode") as Mode;
    if (saved && MODES.includes(saved)) return saved;
    return "normal";
  });

  // Barre de paramètres compacte, toujours visible en haut
  function DefiSettingsBar() {
    return (
      <div className="w-full flex flex-row flex-wrap items-center gap-8 p-2 mb-4 ">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Mode :</span>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value) {
                setMode(value as Mode);
                setSeed((s) => s + 1);
              }
            }}
            className="flex flex-row gap-1"
          >
            {MODES.map((m) => (
              <ToggleGroupItem
                key={m}
                value={m}
                onClick={() => setSeed((s) => s + 1)}
                className="px-2 py-1 text-xs cursor-pointer"
              >
                {m}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Générations :</span>
          <ToggleGroup
            type="multiple"
            value={selectedGens.map(String)}
            onValueChange={(values) => {
              const next = values.map(Number);
              setSelectedGens(next);
              setSeed((s) => s + 1);
            }}
            className="flex flex-row flex-wrap gap-1"
          >
            {GENERATIONS.map((gen) => (
              <ToggleGroupItem
                key={gen}
                value={String(gen)}
                onClick={() => setSeed((s) => s + 1)}
                className="px-2 py-1 text-xs  cursor-pointer"
              >
                {gen}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Nombre :</span>
          <ToggleGroup
            type="single"
            value={String(nbPokemon)}
            onValueChange={(value) => {
              if (value) {
                setNbPokemon(Number(value));
                setSeed((s) => s + 1);
              }
            }}
            className="flex flex-row gap-1"
          >
            {NB_POKEMON_OPTIONS.map((n) => (
              <ToggleGroupItem
                key={n}
                value={String(n)}
                onClick={() => setSeed((s) => s + 1)}
                className="px-2 py-1 text-xs cursor-pointer"
              >
                {n}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Essais max :</span>
          <ToggleGroup
            type="single"
            value={String(maxAttempts)}
            onValueChange={(value) => {
              if (value) {
                setMaxAttempts(Number(value));
                setSeed((s) => s + 1);
              }
            }}
            className="flex flex-row gap-1"
          >
            {MAX_ATTEMPTS_OPTIONS.map((n) => (
              <ToggleGroupItem
                key={n}
                value={String(n)}
                onClick={() => setSeed((s) => s + 1)}
                className="px-2 py-1 text-xs cursor-pointer"
              >
                {n}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        
      </div>
    );
  }

  // Pour relancer le défi
  const [seed, setSeed] = React.useState(0);

  // State du défi
  const [pokemonIds, setPokemonIds] = React.useState<number[]>([]);
  const [current, setCurrent] = React.useState(0);
  const [results, setResults] = React.useState<DefiResult[]>([]);
  const [finished, setFinished] = React.useState(false);
  const [streak, setStreak] = React.useState(0);
  const [streakAnim, setStreakAnim] = React.useState<"up" | "reset" | null>(
    null
  );
  // Timer pour chaque question
  const [questionStart, setQuestionStart] = React.useState<number>(Date.now());

  // Sauvegarde des paramètres à chaque modification
  React.useEffect(() => {
    localStorage.setItem("defi.selectedGens", JSON.stringify(selectedGens));
  }, [selectedGens]);
  React.useEffect(() => {
    localStorage.setItem("defi.nbPokemon", String(nbPokemon));
  }, [nbPokemon]);
  React.useEffect(() => {
    localStorage.setItem("defi.maxAttempts", String(maxAttempts));
  }, [maxAttempts]);
  React.useEffect(() => {
    localStorage.setItem("defi.mode", mode);
  }, [mode]);

  React.useEffect(() => {
    if (streakAnim) {
      const timeout = setTimeout(() => setStreakAnim(null), 700);
      return () => clearTimeout(timeout);
    }
  }, [streakAnim]);

  // Ajout : état pour savoir si les données sont prêtes ou corrompues
  const [dataReady, setDataReady] = React.useState<
    "loading" | "ready" | "error"
  >("loading");

  React.useEffect(() => {
    const key = "pokemon";
    const loadData = () => {
      const data = localStorage.getItem(key);
      if (!data) {
        setDataReady("loading");
        return false;
      }

      try {
        const parsed = JSON.parse(data);
        if (!parsed.pokemon || !Array.isArray(parsed.pokemon)) {
          setDataReady("error");
          return false;
        }

        // Récupérer tous les Pokémon disponibles pour les générations sélectionnées
        let allIds: number[] = [];
        for (const gen of selectedGens) {
          const found = parsed.pokemon.find((g: any) => g.generation === gen);
          if (found) allIds = allIds.concat(found.ids);
        }

        let selectedIds: number[] = [];

        if (mode === "lacunes") {
          // Récupérer les stats utilisateur
          const statsRaw = localStorage.getItem("user_stats");
          if (statsRaw) {
            const stats = JSON.parse(statsRaw);
            console.log("Stats utilisateur :", stats);
            if (stats && Array.isArray(stats.pokemons)) {
              // Créer un map des stats pour un accès plus rapide
              const statsMap: Record<number, { success: number; attempts: number }> = {};
              for (const p of stats.pokemons) {
                statsMap[p.id] = { success: p.success, attempts: p.attempts };
              }
              console.log("Map des stats :", statsMap);              // Filtrer pour ne garder que les Pokémon avec un taux de réussite < 50%
              selectedIds = allIds.filter(id => {
                const stat = statsMap[id];
                return stat && stat.attempts > 0 && stat.success / stat.attempts < 0.5;
              });
              console.log("Pokémon problématiques :", selectedIds);
              // Si on a assez de Pokémon problématiques
              if (selectedIds.length > nbPokemon) {
                selectedIds = shuffleArray(selectedIds).slice(0, nbPokemon);
              }
            }
          }
        } else {
          // Mode normal : sélection aléatoire simple
          selectedIds = shuffleArray(allIds).slice(0, nbPokemon);
        }

        // Si on n'a pas assez de Pokémon sélectionnés (peut arriver en mode lacunes)
        if (selectedIds.length < nbPokemon) {
          // Compléter avec des Pokémon aléatoires
          const remainingIds = allIds.filter(id => !selectedIds.includes(id));
          const additional = shuffleArray(remainingIds).slice(0, nbPokemon - selectedIds.length);
          selectedIds = [...selectedIds, ...additional];
        }

        setPokemonIds(selectedIds);
        setDataReady(selectedIds.length > 0 ? "ready" : "error");
        setCurrent(0);
        return true;

      } catch (e) {
        setDataReady("error");
        return false;
      }
    };

    // Premier essai de chargement
    if (!loadData()) {
      // Si échec, on met en place le polling
      const interval = setInterval(() => {
        if (loadData()) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [selectedGens, nbPokemon, seed, mode]);

  function shuffleArray<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const handleAnswer = (
    userAnswer: string,
    correctName: string | null,
    isCorrect: boolean,
    passed: boolean
  ) => {
    const now = Date.now();
    const timeTaken = (now - questionStart) / 1000;
    setResults((prev) => [
      ...prev,
      {
        pokemonId: pokemonIds[current],
        userAnswer,
        correctName,
        isCorrect,
        passed,
        timeTaken,
      },
    ]);
    if (isCorrect) {
      setStreak((s) => {
        setStreakAnim("up");
        return s + 1;
      });
    } else {
      setStreak(() => {
        setStreakAnim("reset");
        return 0;
      });
    }
    if (current + 1 < nbPokemon) {
      setCurrent(current + 1);
      setQuestionStart(Date.now());
    } else {
      setFinished(true);
    }
  };

  // Composant de paramétrage du défi

  if (dataReady === "loading") {
    return (
      <div className="text-center py-4">
        Initialisation des données du défi…
      </div>
    );
  }
  if (dataReady === "error") {
    return (
      <div>
        <DefiSettingsBar />
        <div className="text-red-600">
          Erreur lors du chargement des données du défi.
          <br />
          Veuillez réinitialiser la page ou vider le localStorage.
        </div>
      </div>
    );
  }
  if (pokemonIds.length === 0) {
    return (
      <div>
        <DefiSettingsBar />
        <div>Chargement du défi…</div>
      </div>
    );
  }

  if (finished) {
    const score = results.filter((r) => r.isCorrect).length;

    // Récupérer les stats du localStorage
    let userStats: Record<number, { attempts: number; success: number }> = {};
    try {
      const statsRaw = localStorage.getItem("user_stats");
      if (statsRaw) {
        const stats = JSON.parse(statsRaw);
        if (stats && Array.isArray(stats.pokemons)) {
          for (const p of stats.pokemons) {
            userStats[p.id] = { attempts: p.attempts, success: p.success };
          }
        }
      }
    } catch {}

    // Fonction pour relancer un défi
    function restartDefi() {
      setResults([]);
      setFinished(false);
      setCurrent(0);
      setStreak(0);
      setStreakAnim(null);
      setSeed((s) => s + 1);
      setQuestionStart(Date.now());
    }

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center">
        <DefiSettingsBar />
        <h2 className="text-2xl font-bold">Défi terminé !</h2>
        <div className="text-lg">
          Score : {score} / {nbPokemon}
        </div>
        <Button variant="default" onClick={restartDefi}>
          Relancer un défi
        </Button>
        <div className="w-full overflow-x-auto mb-4">
          <h3 className="font-semibold mb-2">Récapitulatif :</h3>
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-background">
                <th className="border px-2 py-1">Pokémon</th>
                <th className="border px-2 py-1">Proposition</th>
                <th className="border px-2 py-1">Réponse attendue</th>
                <th className="border px-2 py-1">Temps (s)</th>
                <th className="border px-2 py-1">Stats</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr
                  key={idx}
                  className={
                    r.isCorrect
                      ? "bg-green-400"
                      : r.passed
                      ? "bg-gray-400"
                      : "bg-red-400"
                  }
                >
                  <td className="border px-2 py-1 text-center">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${r.pokemonId}.png`}
                      alt={`Pokémon #${r.pokemonId}`}
                      className="w-12 h-12 mx-auto"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="text-xs text-gray-500">#{r.pokemonId}</div>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {r.passed ? (
                      <span className="text-gray-500">Passé</span>
                    ) : (
                      r.userAnswer
                    )}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {r.correctName}
                  </td>                  <td className="border px-2 py-1 text-center">
                    {r.timeTaken.toFixed(1)}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {userStats[r.pokemonId]
                      ? `${userStats[r.pokemonId].success} / ${
                          userStats[r.pokemonId].attempts
                        }`
                      : "0 / 0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <DefiSettingsBar />
      <div className="mb-4 text-lg font-semibold">
        Pokémon {current + 1} / {nbPokemon}
      </div>      
      <GuessPokemonCard
        key={`${seed}-${pokemonIds[current]}`}
        pokemonId={pokemonIds[current]}
        onResult={handleAnswer}
        streak={streak}
        streakAnim={streakAnim}
        maxAttempts={maxAttempts}
      />
    </div>
  );
}
