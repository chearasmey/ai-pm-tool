import api from "./axios";

export class SemanticAdminService {
    static async reindex() {
        // const res = await fetch("/api/semantic/reindex", {
        //     method: "POST",
        //     headers: {
        //         Authorization: `Bearer ${accessToken}`
        //     }
        // });

        // const json = await res.json().catch(() => null);
        // if (!res.ok) throw new Error(json?.message || "Reindex failed");
        // return json.data ?? json;
        return api.post(`/semantic/reindex`);
    }
}
