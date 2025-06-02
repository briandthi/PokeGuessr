import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getGenerationPokemonIds } from "@/lib/pokeapi";

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

const GENERATION_LABELS: Record<number, string> = {
  1: "Génération 1",
  2: "Génération 2",
  3: "Génération 3",
  4: "Génération 4",
  5: "Génération 5",
  6: "Génération 6",
  7: "Génération 7",
  8: "Génération 8",
  9: "Génération 9",
};

export function UserStatsTabs() {
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [genData, setGenData] = React.useState<Record<number, number[]> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Récupère les stats utilisateur du localStorage
    try {
      const raw = localStorage.getItem("user_stats");
      if (raw) setStats(JSON.parse(raw));
      else setStats({ pokemons: [] });
    } catch {
      setStats({ pokemons: [] });
    }
  }, []);

  React.useEffect(() => {
    // Récupère la liste des pokémons par génération
    async function fetchGenData() {
      const data: Record<number, number[]> = {};
      for (let gen = 1; gen <= 9; gen++) {
        data[gen] = await getGenerationPokemonIds(gen);
      }
      setGenData(data);
      setLoading(false);
    }
    fetchGenData();
  }, []);

  if (loading || !genData || !stats) {
    return <div>Chargement des statistiques...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Statistiques par génération</h2>
      <div className="flex flex-col gap-6">
        {Object.entries(GENERATION_LABELS).map(([genStr, label]) => {
          const gen = Number(genStr);
          const pokemonsInGen = genData[gen] || [];
          const userFound = stats.pokemons.filter(
            (p) => p.generation === gen && p.success > 0
          ).map((p) => p.id);
          const percent =
            pokemonsInGen.length > 0
              ? Math.round((userFound.length / pokemonsInGen.length) * 100)
              : 0;
          return (
            <div key={gen}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">{label}</span>
                <span>
                  {userFound.length} / {pokemonsInGen.length} (
                  {percent}
                  %)
                </span>
              </div>
              <Progress value={percent} />
            </div>
          );
        })}
      </div>
    </div>
  );
}