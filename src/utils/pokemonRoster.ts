export const POKEMON_ROSTER: { id: number, category: string }[] = [
  { id: 3, category: "Grass/Poison" },      // Venusaur
  { id: 6, category: "Fire/Flying" },       // Charizard
  { id: 9, category: "Water" },             // Blastoise
  { id: 25, category: "Electric" },         // Pikachu
  { id: 59, category: "Fire" },             // Arcanine
  { id: 68, category: "Fighting" },         // Machamp
  { id: 94, category: "Ghost/Poison" },     // Gengar
  { id: 131, category: "Water/Ice" },       // Lapras
  { id: 143, category: "Normal" },          // Snorlax
  { id: 149, category: "Dragon" },          // Dragonite
  { id: 150, category: "Psychic" },         // Mewtwo
  { id: 151, category: "Psychic" },         // Mew
  { id: 212, category: "Bug/Steel" },       // Scizor
  { id: 282, category: "Psychic/Fairy" },   // Gardevoir
  { id: 398, category: "Normal/Flying" },   // Staraptor
  { id: 445, category: "Dragon/Ground" },   // Garchomp
  { id: 448, category: "Fighting/Steel" },  // Lucario
  { id: 491, category: "Dark" },            // Darkrai
  { id: 658, category: "Water/Dark" },      // Greninja
  { id: 663, category: "Fire/Flying" },     // Talonflame
  { id: 700, category: "Fairy" },           // Sylveon
  { id: 724, category: "Grass/Ghost" },     // Decidueye
  { id: 887, category: "Dragon/Ghost" },    // Dragapult
  { id: 937, category: "Fire/Ghost" },      // Ceruledge
];

export const getPokemonCategory = (id: number): string => {
	const foundPokemon = POKEMON_ROSTER.find(pokemon => pokemon.id === id);
  return foundPokemon?.category ?? "Unknown";
};