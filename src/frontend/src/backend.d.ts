import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Item {
    id: string;
    name: string;
    description: string;
    category: string;
    price: bigint;
}
export interface PlayerProfile {
    coinBalance: bigint;
    bestScore: bigint;
    lifetimeCoins: bigint;
    purchasedItems: Array<string>;
}
export interface backendInterface {
    addCoins(coins: bigint): Promise<void>;
    getLeaderboard(): Promise<Array<[Principal, PlayerProfile]>>;
    getOrCreateProfile(): Promise<PlayerProfile>;
    getPlayerProfile(): Promise<PlayerProfile>;
    getShopCatalog(): Promise<Array<Item>>;
    purchaseItem(itemId: string): Promise<void>;
    submitScore(score: bigint): Promise<boolean>;
}
