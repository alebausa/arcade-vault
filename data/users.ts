export type User = {
  id: string;
  name: string;
  email: string | null;
  isGuest: boolean;
  createdAt: string;
};

export const PLAYERS = [
  "PX_KAI", "NEONFOX", "Z3R0COOL", "M00NRYU", "VAULT_07", "GLITCHA",
  "ATARI_KID", "CYBER_LU", "MAGENTA88", "SCANLINE", "BIT_LORD", "ARKADYA",
  "DROID_X", "RGB_QUEEN", "PIXEL_DAD", "RETROVIRA", "VECTORX", "JOY_STK",
];

export async function authenticateUser(input: {
  username: string;
  password: string;
}): Promise<User> {
  return {
    id: `u_${Date.now()}`,
    name: input.username,
    email: null,
    isGuest: false,
    createdAt: new Date().toISOString(),
  };
}

export async function createGuestUser(): Promise<User> {
  return {
    id: `guest_${Date.now()}`,
    name: "INVITADO",
    email: null,
    isGuest: true,
    createdAt: new Date().toISOString(),
  };
}
