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
import { Badge } from "@/components/ui/badge";

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

async function updateUserStats(
  pokemonId: number,
  generation: number | null,
  result: "success" | "error" | "pass"
) {
  let stats: UserStats;
  try {
    stats = JSON.parse(localStorage.getItem("user_stats") || "");
    if (!stats || !Array.isArray(stats.pokemons)) throw new Error();
  } catch {
    stats = { pokemons: [] };
  }
  let entry = stats.pokemons.find((p) => p.id === pokemonId);
  if (!entry) {
    entry = {
      id: pokemonId,
      generation,
      attempts: 0,
      success: 0,
      error: 0,
      pass: 0,
    };
    stats.pokemons.push(entry);
  }
  entry.generation = generation; // Toujours à jour si jamais modifié
  entry.attempts += 1;
  if (result === "success") entry.success += 1;
  if (result === "error") entry.error += 1;
  if (result === "pass") entry.pass += 1;
  localStorage.setItem("user_stats", JSON.stringify(stats));
}

function getPokemonStatus(pokemonId: number): {
  status: "first-time" | "mastered" | "validate" | "data";
  ratio: number | null;
} {
  try {
    const stats = JSON.parse(
      localStorage.getItem("user_stats") || ""
    ) as UserStats;
    if (!stats || !Array.isArray(stats.pokemons)) {
      return { status: "first-time", ratio: null };
    }

    const entry = stats.pokemons.find(
      (p: UserStats["pokemons"][0]) => p.id === pokemonId
    );
    if (!entry || entry.attempts === 0) {
      return { status: "first-time", ratio: null };
    }

    const ratio = entry.success / entry.attempts;
    if (ratio >= 0.75) return { status: "mastered", ratio };
    if (ratio >= 0.5) return { status: "validate", ratio };
    if (ratio >= 0.25) return { status: "validate", ratio };
    return { status: "data", ratio };
  } catch {
    return { status: "first-time", ratio: null };
  }
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
  maxAttempts?: number;
};

export function GuessPokemonCard({
  pokemonId,
  onResult,
  streak,
  streakAnim,
  maxAttempts = 1,
}: GuessPokemonCardProps) {
  const [answer, setAnswer] = React.useState("");
  const [solution, setSolution] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<
    null | "correct" | "incorrect" | "pass"
  >(null);
  const [attempts, setAttempts] = React.useState(0);
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
        .replace(/[♀♂]/g, "") // Supprime les caractères spéciaux de genre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solution) return;
    const isCorrect = normalizeString(answer) === normalizeString(solution);
    if (!isCorrect) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setFeedback("incorrect");

      const generation = await getPokemonGeneration(pokemonId);
      await updateUserStats(pokemonId, generation, "error");

      // Si on a atteint le nombre max d'essais, on envoie une erreur finale avec un délai
      if (nextAttempts >= maxAttempts) {
        if (onResult) {
          setTimeout(() => {
            onResult(answer, solution, false, false);
          }, 1400);
        }
        return;
      }

      // Si on n'a pas atteint le nombre max d'essais, on continue
      setAnswer(""); // Vider le champ pour la prochaine tentative
      return;
    }

    // Si la réponse est correcte
    setFeedback("correct");
    const generation = await getPokemonGeneration(pokemonId);
    await updateUserStats(pokemonId, generation, "success");

    // Le focus est aussi garanti par le callback ref
    if (onResult) {
      setTimeout(() => {
        onResult(answer, solution, true, false);
      }, 800);
    }
  };

  const handlePass = async () => {
    // Enregistrement dans le localStorage pour "pass" avec génération
    const generation = await getPokemonGeneration(pokemonId);
    await updateUserStats(pokemonId, generation, "pass");
    setFeedback("pass");
    // Affiche la solution comme pour une mauvaise réponse finale
    if (onResult) {
      setTimeout(() => {
        onResult(answer, solution, false, true);
      }, 1400);
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
          <>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`}
              alt="Pokémon"
              className="w-80 h-80 object-contain"
              style={{ imageRendering: "pixelated" }}
            />
            {(() => {
              const status = getPokemonStatus(pokemonId);
              return (
                <Badge
                  variant={
                    status.status === "first-time"
                      ? "default"
                      : status.status === "mastered"
                      ? "secondary"
                      : status.status === "validate"
                      ? "outline"
                      : "destructive"
                  }
                  className="mt-2"
                >
                  {status.status === "first-time"
                    ? "Première rencontre"
                    : status.status === "mastered"
                    ? "Maîtrisé"
                    : status.status === "validate"
                    ? "À valider"
                    : "À revoir"}
                  {status.ratio !== null &&
                    ` (${Math.round(status.ratio * 100)}%)`}
                </Badge>
              );
            })()}
          </>
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
        </form>{" "}
        {feedback === "correct" && (
          <div className="text-green-600 font-semibold">
            Bravo, c'est la bonne réponse !
          </div>
        )}
        {feedback === "incorrect" && (
          <div className="text-red-600 font-semibold">
            Mauvaise réponse.
            {attempts < maxAttempts ? (
              <span className="text-sm ml-2">
                {maxAttempts - attempts} essai
                {maxAttempts - attempts > 1 ? "s" : ""} restant
                {maxAttempts - attempts > 1 ? "s" : ""}
              </span>
            ) : (
             <span className="text-lg ml-2 font-bold text-primary-foreground border-b-2 border-primary">
                 {solution ? normalizeString(solution) : ""}
             </span>
            )}
          </div>
        )}
         {feedback === "pass" && (
           <div className="text-yellow-700 font-semibold">
             Passé. La réponse était :
             <span className="text-lg ml-2 font-bold text-primary-foreground border-b-2 border-primary">
                 {solution ? normalizeString(solution) : ""}
             </span>
           </div>
         )}
      </CardContent>
       <CardFooter />
     </Card>
   );
 }
