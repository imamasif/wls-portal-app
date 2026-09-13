import React, { useState, useEffect } from 'react';
import { UserProfileDetail } from './UserProfileDetail';
import styles from './UserGridView.module.css';

export function UserGridView() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  // Sleek Light Blue Back Button view when inspecting a single user
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
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back
          </button>
        </div>
        <UserProfileDetail overrideUser={selectedProfileUser} />
      </div>
    );
  }

  // Filter Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  // Pagination Logic
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

      {/* Control Bar */}
      <div className={styles.controlsBar}>
        <input
          type="text"
          placeholder="Search by name, email, or city..."
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
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="SUPER_USER">Super User</option>
          <option value="WLS_ADMIN">WLS Admin</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      {/* Grid Table */}
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
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((uItem, idx) => {
                const userId = uItem._id || uItem.email;
                const isSelected = selectedUserIds.has(userId);

                let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                if (isSelected) rowBg = '#f1f5f9';

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
                    <td>
                      <span className="role-badge">
                        {uItem.role}
                      </span>
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

      {/* Pagination Footer */}
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
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className={styles.pageBtn}
          >
            « First
          </button>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={styles.pageBtn}
          >
            ‹ Prev
          </button>

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

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={styles.pageBtn}
          >
            Next ›
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className={styles.pageBtn}
          >
            Last »
          </button>
        </div>
      </div>
    </div>
  );
}