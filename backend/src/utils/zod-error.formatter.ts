import { ZodError } from "zod";

export const formatZodErrors = (error: ZodError) => {
    const errors: Record<string, string[]> = {};

    error.issues.forEach(issue => {
        /**
         * issue.path example:
         * ["body", "email"]
         * ["params", "id"]
         *
         * We remove the first element ("body", "params", "query")
         */
        const [, ...fieldPathParts] = issue.path;
        const fieldPath =
            fieldPathParts.join(".") || "global";

        if (!errors[fieldPath]) {
            errors[fieldPath] = [];
        }

        errors[fieldPath].push(issue.message);
    });

    return errors;
};
