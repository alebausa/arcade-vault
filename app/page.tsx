import { getGames } from "@/data/games";
import { getCategories } from "@/data/categories";
import { LibraryClient } from "@/app/components/library-client";

export default async function Home() {
  const [games, categories] = await Promise.all([getGames(), getCategories()]);

  return <LibraryClient games={games} categories={categories} />;
}
