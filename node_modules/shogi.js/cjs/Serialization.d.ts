import { ISettingType, Shogi } from "./shogi";
export declare function fromPreset(shogi: Shogi, setting: ISettingType): void;
export declare function toCSA(shogi: Shogi): string;
export declare function fromSfen(shogi: Shogi, sfen: string): void;
export declare function toSfen(shogi: Shogi, moveCount: any): string;
