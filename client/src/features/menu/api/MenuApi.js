export const MenuApi = {
  async fetchMenuPermissions(role) {
    try {
      const res = await fetch(`/api/menu-permissions?role=${role}`);
      return await res.json();
    } catch (err) {
      console.error("Failed to load dynamic navigation", err);
      return [];
    }
  },
};
