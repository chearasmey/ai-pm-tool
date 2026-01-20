import { ProjectService } from "@/api/project.api"
import type { UserRoleEnum } from "@/types/role";
import { ref } from "vue";

export function usePermission() {
    const isSystemAdmin = ref(false);
    const isProjectAdmin = ref(false);
    const isMemberAsAdmin = ref(false);

    const getMemberRole = async (projectId: number): Promise<string> =>{
        const {data: response} = await ProjectService.getMemberRole(projectId);
        return response.data?.role??'member';
    }


    const syncPermission = async (projectId: number, role: UserRoleEnum) => {
        isSystemAdmin.value = role === 'system_admin';
        isProjectAdmin.value = role === 'project_admin';
        if(projectId) {
            const role = await getMemberRole(projectId);
           isMemberAsAdmin.value = role.toLocaleLowerCase() === 'admin';
        }
    }

    const isAllowed = (): boolean => {
        return [isMemberAsAdmin.value, isProjectAdmin.value, isSystemAdmin.value].includes(true)??false;
    }

    return {
        isMemberAsAdmin,
        isSystemAdmin,
        isProjectAdmin,
        syncPermission,
        isAllowed
    }
}