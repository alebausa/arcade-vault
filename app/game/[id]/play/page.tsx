import { notFound } from "next/navigation";
import { getGameById } from "@/data/games";
import { GamePlayerClient } from "@/app/components/game-player-client";
import { AsteroidsPlayerClient } from "@/app/components/asteroids-player-client";

export default async function GamePlayPage({
  params,
}: PageProps<"/game/[id]/play">) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    notFound();
  }

  if (game.id === "rocas") {
    return <AsteroidsPlayerClient game={game} />;
  }

  return <GamePlayerClient game={game} />;
}
