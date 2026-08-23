const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

export async function getCategories(): Promise<string[]> {
  return CATS;
}
