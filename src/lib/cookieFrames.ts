import { publicAsset } from "./publicAsset";

export const FRAMES = 96;

/**
 * Phones decode at 760px, so shipping them the 1600px set was 4x the pixels for
 * an identical picture. The set is chosen from the same flag that drives decode.
 */
export function framePath(i: number, mobile: boolean): string {
  const n = String(i + 1).padStart(3, "0");
  return publicAsset(`cookie/${mobile ? 760 : 1600}/f_${n}.webp`);
}
