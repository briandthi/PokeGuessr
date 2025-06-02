/**
 * Fonctions utilitaires pour interroger la PokéAPI.
 * https://pokeapi.co/
 */

export async function getPokemonSprite(pokemonId: number): Promise<string | null> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  if (!res.ok) return null;
  const data = await res.json();
  // Accès à sprites.other.official-artwork.front_default
  return data?.sprites?.other?.['official-artwork']?.front_default ?? null;
}

export async function getPokemonNameFr(pokemonId: number): Promise<string | null> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
  if (!res.ok) return null;
  const data = await res.json();
  // Cherche le nom en français dans names
  const frName = data?.names?.find(
    (n: any) => n.language?.name === 'fr'
  );
  return frName?.name ?? null;
}
/**
 * Retourne la génération d'un Pokémon à partir de son ID.
 * @param pokemonId
 * @returns numéro de génération (1 à 9), ou null si non trouvé
 */
export async function getPokemonGeneration(pokemonId: number): Promise<number | null> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
  if (!res.ok) return null;
  const data = await res.json();
  // data.generation.url est du type "https://pokeapi.co/api/v2/generation/1/"
  const genUrl: string | undefined = data?.generation?.url;
  if (!genUrl) return null;
  const match = genUrl.match(/\/generation\/(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
}

export async function getGenerationPokemonIds(generationId: number): Promise<number[]> {
  const res = await fetch(`https://pokeapi.co/api/v2/generation/${generationId}/`);
  if (!res.ok) return [];
  const data = await res.json();
  // pokemon_species est une liste d'objets {name, url}
  // On extrait l'id de l'url (ex: .../pokemon-species/495/)
  return (data?.pokemon_species ?? []).map((species: any) => {
    const match = species.url.match(/\/pokemon-species\/(\d+)\//);
    return match ? parseInt(match[1], 10) : null;
  }).filter((id: number | null) => id !== null);
}