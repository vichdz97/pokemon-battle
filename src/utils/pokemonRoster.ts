export const POKEMON_ROSTER: { id: number, category: string }[] = [
  { id: 1, category: "Grass/Poison" },  // Bulbasaur
  { id: 2, category: "Grass/Poison" },  // Ivysaur
  { id: 3, category: "Grass/Poison" },  // Venusaur
  { id: 4, category: "Fire" },          // Charmander
  { id: 5, category: "Fire" },          // Charmeleon
  { id: 6, category: "Fire/Flying" },   // Charizard
  { id: 7, category: "Water"},          // Squirtle
  { id: 8, category: "Water" },         // Wartortle
  { id: 9, category: "Water" },         // Blastoise
  { id: 25, category: "Electric" },     // Pikachu
  { id: 59, category: "Fire" },         // Arcanine
  { id: 65, category: "Psychic" },      // Alakazam
  { id: 68, category: "Fighting" },     // Machamp
  { id: 76, category: "Rock/Ground" },  // Golem
  { id: 94, category: "Ghost/Poison" }, // Gengar
  { id: 131, category: "Water/Ice" },   // Lapras
  { id: 143, category: "Normal" },      // Snorlax
  { id: 149, category: "Dragon" },      // Dragonite
  { id: 150, category: "Legendary" },   // Mewtwo
];

export const getPokemonCategory = (id: number): string => {
	const foundPokemon = POKEMON_ROSTER.find(pokemon => pokemon.id === id);
  return foundPokemon?.category ?? "Unknown";
};