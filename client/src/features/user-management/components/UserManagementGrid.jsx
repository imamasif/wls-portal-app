import React, { useState, useEffect } from 'react';
import './UserManagementGrid.css';

export function UserManagementGrid({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const pageSize = 50; // Initial 50 records requirement

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers.length / pageSize) || 1;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedUserIds.size === paginatedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(paginatedUsers.map((u) => u._id || u.email)));
    }
  };

  const toggleSelectUser = (id) => {
    const updated = new Set(selectedUserIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedUserIds(updated);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="grid-wrapper">
      <h2>User Management Directory</h2>

      <div className="grid-controls">
        <input
          type="text"
          placeholder="Search by name, email, or city..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          className="role-select"
        >
          <option value="ALL">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="WLS_ADMIN">WLS Admin</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th className="th-checkbox">
                <input type="checkbox" onChange={toggleSelectAll} checked={paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length} />
              </th>
              <th onClick={() => handleSort('name')}>Name {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('email')}>Email {sortField === 'email' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('role')}>Role {sortField === 'role' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('city')}>City / Country {sortField === 'city' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
              <th>Profession</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-records">No users found.</td>
              </tr>
            ) : (
              paginatedUsers.map((user, idx) => {
                const userId = user._id || user.email;
                const isSelected = selectedUserIds.has(userId);
                
                // Row color classes based on roles and selection
                let rowClass = idx % 2 === 0 ? 'row-even' : 'row-odd';
                if (user.role === 'SUPER_ADMIN') rowClass += ' super-admin-row';
                if (user.role === 'WLS_ADMIN') rowClass += ' wls-admin-row';
                if (isSelected) rowClass += ' selected-row';

                return (
                  <tr key={userId} className={rowClass}>
                    <td className="td-checkbox">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelectUser(userId)} onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="td-name" onClick={() => onSelectUser(user)}>
                      <div className="user-cell-content">
                        {user.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt="" className="user-avatar" />
                        ) : (
                          <div className="user-avatar-placeholder">👤</div>
                        )}
                        <span>{user.name || 'Unnamed User'}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-muted">{user.city ? `${user.city}, ` : ''}{user.country}</td>
                    <td className="text-muted">{user.profession || 'N/A'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-footer">
        <span className="pagination-info">
          Showing {paginatedUsers.length} of {sortedUsers.length} users (Page {currentPage} of {totalPages})
        </span>
        <div className="pagination-buttons">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="page-btn"
          >
            Previous
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="page-btn"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}