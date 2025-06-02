import React from "react";
import { Defi } from "@/components/Defi";
import { UserStatsTabs } from "@/components/UserStatsTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getGenerationPokemonIds } from "@/lib/pokeapi";

function App() {
  React.useEffect(() => {
    const key = "pokemon";
    const existing = localStorage.getItem(key);
    if (!existing) {
      // Générations 1 à 9
      const generations = Array.from({ length: 9 }, (_, i) => i + 1);
      Promise.all(
        generations.map(async (gen) => ({
          generation: gen,
          ids: await getGenerationPokemonIds(gen),
        }))
      ).then((results) => {
        localStorage.setItem(key, JSON.stringify({ pokemon: results }));
      });
    }
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-start w-full">
      <h1 className="mt-4">Pokemon Guessr</h1>
      <Tabs defaultValue="defi" className="w-full max-w-2xl mt-8">
        <TabsList className="grid w-full grid-cols-3 mb-2">
          <TabsTrigger value="defi">Défi</TabsTrigger>
          <TabsTrigger value="stats">Stats utilisateur</TabsTrigger>
          <TabsTrigger value="other" disabled={true}>
            Un autre mode?
          </TabsTrigger>
        </TabsList>
        <TabsContent value="defi">
          <Defi />
        </TabsContent>
        <TabsContent value="stats">
          <UserStatsTabs />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
