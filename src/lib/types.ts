export interface Result {
    created: number;
    times: number[];
    avg: number;
    errors: number;
    ingested: number;
}

export interface WobbleWatch {
    state: "initial" | "countdown" | "waiting" | "stopped" | "error";
    times: number[];
    begin: number;
    errors: number;
    ingested: number;
    results: Result[];
}

export const defaultWobbleWatch: WobbleWatch = {
    state: "initial",
    times: [],
    begin: Date.now(),
    errors: 0,
    ingested: 0,
    results: [],
};
