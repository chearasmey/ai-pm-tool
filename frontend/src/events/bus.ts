import mitt from "mitt";

type Events = {
    "search:open": { initialQuery?: string } | undefined;
    "search:close": undefined;
};

export const bus = mitt<Events>();
