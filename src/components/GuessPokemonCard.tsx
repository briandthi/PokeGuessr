import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPokemonNameFr, getPokemonGeneration } from "@/lib/pokeapi";
import { StreakDisplay } from "./StreakDisplay";

type UserStats = {
  pokemons: {
    id: number;
    generation: number | null;
    attempts: number;
    success: number;
    error: number;
    pass: number;
  }[];
};

async function updateUserStats(pokemonId: number, generation: number | null, result: "success" | "error" | "pass") {
  let stats: UserStats;
  try {
    stats = JSON.parse(localStorage.getItem("user_stats") || "");
    if (!stats || !Array.isArray(stats.pokemons)) throw new Error();
  } catch {
    stats = { pokemons: [] };
  }
  let entry = stats.pokemons.find((p) => p.id === pokemonId);
  if (!entry) {
    entry = { id: pokemonId, generation, attempts: 0, success: 0, error: 0, pass: 0 };
    stats.pokemons.push(entry);
  }
  entry.generation = generation; // Toujours à jour si jamais modifié
  entry.attempts += 1;
  if (result === "success") entry.success += 1;
  if (result === "error") entry.error += 1;
  if (result === "pass") entry.pass += 1;
  localStorage.setItem("user_stats", JSON.stringify(stats));
}

type GuessPokemonCardProps = {
  pokemonId: number;
  onResult?: (
    userAnswer: string,
    correctName: string | null,
    isCorrect: boolean,
    passed: boolean
  ) => void;
  streak?: number;
  streakAnim?: "up" | "reset" | null;
};

export function GuessPokemonCard({
  pokemonId,
  onResult,
  streak,
  streakAnim,
}: GuessPokemonCardProps) {
  const [answer, setAnswer] = React.useState("");
  const [solution, setSolution] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<
    null | "correct" | "incorrect"
  >(null);
  const [loading, setLoading] = React.useState(true);
  // Callback ref pour focus auto dès que l'input est monté
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const setInputRef = React.useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
    if (el) {
      el.focus();
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setFeedback(null);
    setAnswer("");
    getPokemonNameFr(pokemonId).then((nameFr) => {
      setSolution(nameFr);
      setLoading(false);
    });
  }, [pokemonId]);

  // Focus automatique sur l'input à chaque changement de Pokémon
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [pokemonId]);

  // Refocus input dès que loading passe à false (input réactivé)
  React.useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  // Comparaison insensible à la casse et aux accents
  function normalizeString(str: string) {
    return str
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solution) return;
    const isCorrect =
      normalizeString(answer) === normalizeString(solution);
    setFeedback(isCorrect ? "correct" : "incorrect");
    // Enregistrement dans le localStorage avec génération
    const generation = await getPokemonGeneration(pokemonId);
    await updateUserStats(
      pokemonId,
      generation,
      isCorrect ? "success" : "error"
    );
    // Le focus est aussi garanti par le callback ref
    if (onResult) {
      setTimeout(() => {
        onResult(answer, solution, isCorrect, false);
      }, 800);
    }
  };

  const handlePass = async () => {
    // Enregistrement dans le localStorage pour "pass" avec génération
    const generation = await getPokemonGeneration(pokemonId);
    await updateUserStats(pokemonId, generation, "pass");
    // Refocus input après passage (sauf si on change de Pokémon)
    // Le focus est aussi garanti par le callback ref
    if (onResult) {
      onResult(answer, solution, false, true);
    }
  };

  return (
    <Card className="w-full max-w-xs mx-auto relative overflow-visible border-none shadow-none">
      {/* StreakDisplay en superposition coin haut droit */}
      {typeof streak === "number" && streakAnim !== undefined && (
        <StreakDisplay streak={streak} anim={streakAnim ?? null} />
      )}
      <CardHeader>
        <CardTitle>Qui est ce Pokémon ?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {pokemonId && (
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`}
            alt="Pokémon"
            className="w-80 h-80 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        )}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
          <input
            ref={setInputRef}
            type="text"
            placeholder="Nom du Pokémon"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="border rounded px-3 py-2"
            disabled={loading}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                handlePass();
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !answer}>
              Valider (Entrer)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePass}
              disabled={loading}
            >
              Passer (Echap)
            </Button>
          </div>
        </form>
        {feedback === "correct" && (
          <div className="text-green-600 font-semibold">
            Bravo, c'est la bonne réponse !
          </div>
        )}
        {feedback === "incorrect" && (
          <div className="text-red-600 font-semibold">
            Mauvaise réponse. Réessaie !
          </div>
        )}
      </CardContent>
      <CardFooter />
    </Card>
  );
}
