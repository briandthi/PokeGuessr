import React from "react";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { getGenerationPokemonIds } from "@/lib/pokeapi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  RadarChart,
  Radar,
  PolarAngleAxis,
  PolarGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  1: "Gen 1",
  2: "Gen 2",
  3: "Gen 3",
  4: "Gen 4",
  5: "Gen 5",
  6: "Gen 6",
  7: "Gen 7",
  8: "Gen 8",
  9: "Gen 9",
};

export function UserStatsTabs() {
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [genData, setGenData] = React.useState<Record<number, number[]> | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  // Couleurs du radar issues de la charte graphique (CSS variables)
  const [radarColors, setRadarColors] = React.useState({
    testedStroke: "#a259ff", // fallback violet
    testedFill: "#a259ff",
    foundStroke: "#d1b3ff", // fallback violet clair
    foundFill: "#d1b3ff",
  });

  React.useEffect(() => {
    // Récupère dynamiquement les couleurs CSS de la charte graphique
    const style = getComputedStyle(document.documentElement);
    const testedStroke =
      style.getPropertyValue("--primary-500")?.trim() || "#a259ff";
    const foundStroke =
      style.getPropertyValue("--primary-200")?.trim() || "#d1b3ff";
    setRadarColors({
      testedStroke,
      testedFill: testedStroke,
      foundStroke,
      foundFill: foundStroke,
    });
  }, []);

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

  // Fonction utilitaire pour l'URL de sprite officiel (rapide, pas de fetch)
  function getSpriteUrl(id: number) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  // Préparation des données pour le radar chart
  const radarData = Object.entries(GENERATION_LABELS).map(([genStr, label]) => {
    const gen = Number(genStr);
    const pokemonsInGen = genData[gen] || [];
    const userStats = stats.pokemons.filter((p) => p.generation === gen);
    const tested = userStats.filter((p) => p.attempts > 0).length;
    const found = userStats.filter((p) => p.success > 0).length;
    return {
      generation: label,
      testés: tested,
      trouvés: found,
      total: pokemonsInGen.length,
    };
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Statistiques par génération</h2>
      <Card className="mb-6">
        <CardContent>
          <div className="w-full flex justify-center">
            <ResponsiveContainer width={400} height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="generation" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}`,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                />
                <Radar
                  name="Testés"
                  dataKey="testés"
                  stroke={radarColors.testedStroke}
                  fill={radarColors.testedFill}
                  fillOpacity={0.3}
                />
                <Radar
                  name="Trouvés"
                  dataKey="trouvés"
                  stroke={radarColors.foundStroke}
                  fill={radarColors.foundFill}
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Accordion type="multiple" className="w-full">
        {Object.entries(GENERATION_LABELS).map(([genStr, label]) => {
          const gen = Number(genStr);
          const pokemonsInGen = genData[gen] || [];
          // Map des stats utilisateur par id pour accès rapide
          const userStatsById = Object.fromEntries(
            stats.pokemons
              .filter((p) => p.generation === gen)
              .map((p) => [p.id, p])
          );
          const userFound = stats.pokemons
            .filter((p) => p.generation === gen && p.success > 0)
            .map((p) => p.id);
          const percent =
            pokemonsInGen.length > 0
              ? Math.round((userFound.length / pokemonsInGen.length) * 100)
              : 0;

          return (
            <AccordionItem key={gen} value={`gen-${gen}`}>
              <AccordionTrigger>
                <div className="flex justify-between items-center w-full gap-4">
                  <span className="font-semibold text-nowrap">{label}</span>
                  <Progress value={percent} />
                  <span className="text-nowrap">
                    {userFound.length} / {pokemonsInGen.length} ({percent}%)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pokémon</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Succès</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pokemonsInGen
                      .sort((a, b) => a - b)
                      .map((pokeId) => {
                        const stat = userStatsById[pokeId] || {
                          attempts: 0,
                          success: 0,
                        };
                        const percentSuccess =
                          stat.attempts > 0
                            ? Math.round((stat.success / stat.attempts) * 100)
                            : 0;
                        return (
                          <TableRow
                            key={pokeId}
                            className={
                              stat.attempts > 0
                                ? percentSuccess > 50
                                  ? "bg-gradient-to-r from-green-400/60 to-green-600/60 transition-colors duration-700"
                                  : percentSuccess <= 50
                                  ? "bg-gradient-to-r from-red-400/60 to-red-600/60 transition-colors duration-700"
                                  : ""
                                : ""
                            }
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <img
                                  src={getSpriteUrl(pokeId)}
                                  alt={`Pokémon #${pokeId}`}
                                  className="w-10 h-10"
                                  loading="lazy"
                                />
                                <span>#{pokeId}</span>
                              </div>
                            </TableCell>
                            <TableCell>{stat.attempts}</TableCell>
                            <TableCell>
                              {stat.success} / {stat.attempts}{" "}
                              {stat.attempts > 0 ? (
                                <span className="text-xs text-muted-foreground">
                                  ({percentSuccess}%)
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  (0%)
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
