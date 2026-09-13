import { useState, useEffect, useMemo } from 'react';
import { fetchUsers, updateUserRole } from '../api/userGridApi';

export function useUserGridData(rowsPerPage = 100) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const changeRole = async (userId, newRole) => {
    await updateUserRole(userId, newRole);
    await loadUsers();
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.city && u.city.toLowerCase().includes(query));
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesQuery && matchesRole;
      })
      .sort((a, b) => {
        let valA = (a[sortBy] || '').toString().toLowerCase();
        let valB = (b[sortBy] || '').toString().toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [users, searchQuery, roleFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  return {
    users: paginatedUsers,
    totalCount: filteredUsers.length,
    totalPages,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    changeRole
  };
}