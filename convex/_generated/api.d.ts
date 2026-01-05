/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as battle from "../battle.js";
import type * as dailyRewards from "../dailyRewards.js";
import type * as inventory from "../inventory.js";
import type * as leaderboard from "../leaderboard.js";
import type * as multiplayer from "../multiplayer.js";
import type * as pvpBattle from "../pvpBattle.js";
import type * as shop from "../shop.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  battle: typeof battle;
  dailyRewards: typeof dailyRewards;
  inventory: typeof inventory;
  leaderboard: typeof leaderboard;
  multiplayer: typeof multiplayer;
  pvpBattle: typeof pvpBattle;
  shop: typeof shop;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
