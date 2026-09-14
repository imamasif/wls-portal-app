import React, { useState, useEffect } from 'react';
import { UserProfileDetail } from './UserProfileDetail';
import { UserRole, isSuperUserRole } from '../../../types/user';
import styles from './UserGridView.module.css';

export function UserGridView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Determine if the logged-in user can modify roles
  const canManageRoles = isSuperUserRole(currentUser?.role);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  // Handle inline role update via API
  const handleRoleChange = async (targetUser, newRole, e) => {
    e.stopPropagation(); // Prevent opening profile detail
    if (targetUser.role === newRole) return;

    const targetId = targetUser._id || targetUser.id;
    setUpdatingUserId(targetId);

    try {
      const res = await fetch(`/api/users/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetUser, role: newRole }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers((prev) =>
          prev.map((u) => ((u._id || u.id) === targetId ? updatedUser : u))
        );
      } else {
        console.error('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (selectedProfileUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button 
            onClick={() => setSelectedProfileUser(null)}
            style={{
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0284c7',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)'
            }}
          >
            ← Back
          </button>
        </div>
        <UserProfileDetail 
          overrideUser={selectedProfileUser} 
          onUserUpdated={(updated) => {
            setSelectedProfileUser(updated);
            setUsers((prev) => prev.map((u) => ((u._id || u.id) === (updated._id || updated.id) ? updated : u)));
          }}
        />
      </div>
    );
  }

  // Filter Logic
  const filteredUsers = users.filter((user) => {
    const primaryPhone = user.phones?.find((p) => p.isPrimary)?.number || user.phone || '';
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      primaryPhone.includes(searchTerm);
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Sort Logic
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
    <div className={styles.card}>
      <div className={styles.gridHeader}>
        <h2 className={styles.gridTitle}>User Management Directory</h2>
      </div>

      <div className={styles.controlsBar}>
        <input
          type="text"
          placeholder="Search by name, email, phone, or city..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className={styles.searchInput}
          style={{ flex: 1, minWidth: '260px' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          className={styles.roleSelect}
        >
          <option value="ALL">All Roles</option>
          <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
          <option value={UserRole.SUPER_USER}>Super User</option>
          <option value={UserRole.WLS_ADMIN}>WLS Admin</option>
          <option value={UserRole.STUDENT}>Student</option>
          <option value={UserRole.USER}>User</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input 
                  type="checkbox" 
                  onChange={toggleSelectAll} 
                  checked={paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length} 
                />
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                Email {sortField === 'email' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th>Phone</th>
              <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                Role {sortField === 'role' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => handleSort('city')} style={{ cursor: 'pointer' }}>
                City / Country {sortField === 'city' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th>Profession</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((uItem, idx) => {
                const userId = uItem._id || uItem.id || uItem.email;
                const isSelected = selectedUserIds.has(userId);
                const isSelf = userId === (currentUser?._id || currentUser?.id);

                let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                if (isSelected) rowBg = '#f1f5f9';

                const primaryPhoneObj = uItem.phones?.find((p) => p.isPrimary) || uItem.phones?.[0];
                const displayPhone = primaryPhoneObj ? primaryPhoneObj.number : (uItem.phone || 'N/A');

                return (
                  <tr 
                    key={userId} 
                    className={styles.tableRow}
                    style={{ backgroundColor: rowBg }}
                    onClick={() => setSelectedProfileUser(uItem)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleSelectUser(userId)} 
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {uItem.profilePictureUrl ? (
                          <img src={uItem.profilePictureUrl} alt="" className={styles.gridAvatar} />
                        ) : (
                          <div className={styles.gridAvatarFallback}>
                            {uItem.name ? uItem.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <span style={{ fontWeight: 600, color: '#0284c7' }}>
                          {uItem.name || 'Unnamed User'}
                        </span>
                      </div>
                    </td>
                    <td>{uItem.email}</td>
                    <td style={{ fontSize: '13px', color: '#334155' }}>{displayPhone}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {canManageRoles && !isSelf ? (
                        <select
                          value={uItem.role || UserRole.USER}
                          disabled={updatingUserId === userId}
                          onChange={(e) => handleRoleChange(uItem, e.target.value, e)}
                          className={styles.inlineRoleSelect}
                        >
                          <option value={UserRole.USER}>USER</option>
                          <option value={UserRole.STUDENT}>STUDENT</option>
                          <option value={UserRole.WLS_ADMIN}>WLS ADMIN</option>
                          <option value={UserRole.SUPER_USER}>SUPER USER</option>
                          <option value={UserRole.SUPER_ADMIN}>SUPER ADMIN</option>
                        </select>
                      ) : (
                        <span className="role-badge">
                          {uItem.role || UserRole.USER}
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {uItem.city ? `${uItem.city}, ` : ''}{uItem.country || ''}
                    </td>
                    <td style={{ color: '#64748b' }}>{uItem.profession || 'N/A'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationBar}>
        <div className={styles.paginationInfo}>
          <span>Rows per page:</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className={styles.pageSizeSelect}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            Showing {sortedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedUsers.length)} of {sortedUsers.length} users
          </span>
        </div>

        <div className={styles.pageControls}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className={styles.pageBtn}>« First</button>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className={styles.pageBtn}>‹ Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`${styles.pageNumberBtn} ${currentPage === pageNum ? styles.activePageNumber : ''}`}
              >
                {pageNum}
              </button>
            ))}

          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)} className={styles.pageBtn}>Next ›</button>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} className={styles.pageBtn}>Last »</button>
        </div>
      </div>
    </div>
  );
}