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

export function Defi() {
  // Paramètres du défi
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

  // Barre de paramètres compacte, toujours visible en haut
  function DefiSettingsBar() {
    return (
      <div className="w-full flex flex-row flex-wrap items-center gap-4 p-2 mb-4 bg-white ">
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

  // Composant Popover pour les paramètres
  // Composant paramètres du défi en accordéon
  function DefiSettingsAccordion() {
    return (
      <Accordion type="single" collapsible className="mb-6 max-w-lg mx-auto">
        <AccordionItem value="defi-settings">
          <AccordionTrigger>Paramètres du défi</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 p-4 border rounded bg-white">
              <div>
                <div className="font-semibold mb-2">Générations</div>
                <ToggleGroup
                  type="multiple"
                  value={selectedGens.map(String)}
                  onValueChange={(values) => {
                    const next = values.map(Number);
                    setSelectedGens(next);
                    setSeed((s) => s + 1);
                  }}
                  className="flex flex-wrap gap-2"
                >
                  {GENERATIONS.map((gen) => (
                    <ToggleGroupItem
                      key={gen}
                      value={String(gen)}
                      onClick={() => setSeed((s) => s + 1)}
                    >
                      {gen}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div>
                <div className="font-semibold mb-2">Nombre de Pokémon</div>
                <ToggleGroup
                  type="single"
                  value={String(nbPokemon)}
                  onValueChange={(value) => {
                    if (value) {
                      setNbPokemon(Number(value));
                      setSeed((s) => s + 1);
                    }
                  }}
                  className="flex flex-wrap gap-2"
                >
                  {NB_POKEMON_OPTIONS.map((n) => (
                    <ToggleGroupItem
                      key={n}
                      value={String(n)}
                      onClick={() => setSeed((s) => s + 1)}
                    >
                      {n}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

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
    const data = localStorage.getItem(key);
    if (!data) {
      setDataReady("loading");
      // On attend que App.tsx initialise la clé
      const interval = setInterval(() => {
        const d = localStorage.getItem(key);
        if (d) {
          clearInterval(interval);
          setDataReady("ready");
        }
      }, 300);
      return () => clearInterval(interval);
    }
    try {
      const parsed = JSON.parse(data);
      if (!parsed.pokemon || !Array.isArray(parsed.pokemon)) {
        setDataReady("error");
        return;
      }
      let ids: number[] = [];
      for (const gen of selectedGens) {
        const found = parsed.pokemon.find((g: any) => g.generation === gen);
        if (found) ids = ids.concat(found.ids);
      }
      ids = shuffleArray(ids).slice(0, nbPokemon);
      setPokemonIds(ids);
      setDataReady(ids.length > 0 ? "ready" : "error");
      setCurrent(0);
    } catch (e) {
      setDataReady("error");
    }
  }, [selectedGens, nbPokemon, seed]);

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
    const timeTaken = Math.round((now - questionStart) / 1000);
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
      <div>
        <DefiSettingsAccordion />
        <div>Initialisation des données du défi…</div>
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
              <tr className="bg-gray-100">
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
                      ? "bg-green-50"
                      : r.passed
                      ? "bg-gray-50"
                      : "bg-red-50"
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
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {r.timeTaken}
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
    <div>
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
      />
    </div>
  );
}
