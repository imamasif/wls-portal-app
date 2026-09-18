import React, { useState, useEffect } from 'react';
import { 
  TextInput, 
  Select, 
  Group, 
  Paper, 
  Title, 
  Avatar, 
  Text, 
  Badge, 
  Button,
  Notification,
  Modal,
  Container,
  Stack
} from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { 
  IconSearch, 
  IconArrowLeft, 
  IconCheck, 
  IconX, 
  IconUsers 
} from '@tabler/icons-react';
import { UserProfileDetail } from './UserProfileDetail';
import { AdminUserControls } from './AdminUserControls';
import { UserRole, isSuperUserRole } from '../../../types/user';

export function UserGridView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortStatus, setSortStatus] = useState({ columnAccessor: 'name', direction: 'asc' });
  const [selectedRecords, setSelectedRecords] = useState([]);
  
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isSuperAdmin = isSuperUserRole(currentUser?.role);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  const triggerConfirmation = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const executeRoleChange = async (targetUser, newRole) => {
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
        setUsers((prev) => prev.map((u) => ((u._id || u.id) === targetId ? updatedUser : u)));
        showToast(`Role updated successfully to ${newRole}!`);
      } else {
        showToast('Failed to update user role.', 'error');
      }
    } catch (err) {
      showToast('Server error while updating role.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChangeRequest = (targetUser, newRole) => {
    if (targetUser.role === newRole) return;

    if (!isSuperAdmin) {
      showToast('Only SUPER_USER can change user roles.', 'error');
      return;
    }

    triggerConfirmation(
      'Confirm Role Change',
      `Are you sure you want to change ${targetUser.name || 'this user'}'s role to ${newRole}?`,
      () => executeRoleChange(targetUser, newRole)
    );
  };

  if (selectedProfileUser) {
    return (
      <Container size="lg" py="md">
        <Paper p="lg" radius="md" withBorder shadow="sm">
          <Button 
            leftSection={<IconArrowLeft size={16} />} 
            variant="light" 
            mb="md"
            onClick={() => setSelectedProfileUser(null)}
          >
            Back to Directory
          </Button>
          <UserProfileDetail 
            overrideUser={selectedProfileUser} 
            onUserUpdated={(updated) => {
              if (!updated) {
                setSelectedProfileUser(null);
                setUsers((prev) => prev.filter((u) => (u._id || u.id) !== (selectedProfileUser._id || selectedProfileUser.id)));
                showToast('User deleted successfully.');
              } else {
                setSelectedProfileUser(updated);
                setUsers((prev) => prev.map((u) => ((u._id || u.id) === (updated._id || updated.id) ? updated : u)));
                showToast('User details updated successfully!');
              }
            }}
          />
        </Paper>
      </Container>
    );
  }

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

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = a[sortStatus.columnAccessor] || '';
    let bVal = b[sortStatus.columnAccessor] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortStatus.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortStatus.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const records = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Container size="xl" py="md">
      <Stack spacing="md">
        <Paper p="md" radius="md" withBorder shadow="sm" style={{ position: 'relative', width: '100%' }}>
          {toastMessage && (
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
              <Notification 
                icon={toastMessage.type === 'error' ? <IconX size={18} /> : <IconCheck size={18} />}
                color={toastMessage.type === 'error' ? 'red' : 'green'}
                onClose={() => setToastMessage(null)}
              >
                {toastMessage.msg}
              </Notification>
            </div>
          )}

          {/* Directory Header */}
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconUsers size={26} color="var(--mantine-color-indigo-6)" />
              <Title order={3} c="indigo.8">User Management Directory</Title>
            </Group>
          </Group>

          <Group mb="md">
            <TextInput
              placeholder="Search by name, email, phone, city..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.currentTarget.value); setPage(1); }}
              style={{ flex: 1, minWidth: 200 }}
            />
            <Select
              value={roleFilter}
              onChange={(val) => { setRoleFilter(val || 'ALL'); setPage(1); }}
              data={[
                { value: 'ALL', label: 'All Roles' },
                { value: UserRole.SUPER_USER, label: 'Super Admin' },
                { value: UserRole.WLS_ADMIN, label: 'WLS Admin' },
                { value: UserRole.USER, label: 'Student' },
              ]}
            />
          </Group>

          <DataTable
            withTableBorder
            borderRadius="md"
            striped
            highlightOnHover
            fz="xs"
            verticalSpacing="sm"
            horizontalSpacing="sm"
            records={records}
            totalRecords={sortedUsers.length}
            recordsPerPage={pageSize}
            page={page}
            onPageChange={(p) => setPage(p)}
            recordsPerPageOptions={[10, 25, 50, 100]}
            onRecordsPerPageChange={setPageSize}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            selectedRecords={selectedRecords}
            onSelectedRecordsChange={setSelectedRecords}
            onRowClick={({ record }) => setSelectedProfileUser(record)}
            columns={[
              {
                accessor: 'name',
                title: 'Name',
                width: 220,
                sortable: true,
                render: (u) => (
                  <Group gap="xs" wrap="nowrap">
                    <Avatar src={u.profilePictureUrl} radius="xl" size="sm" color="blue">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Text size="xs" fw={600} c="blue.7" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name || 'Unnamed User'}
                    </Text>
                  </Group>
                ),
              },
              { 
                accessor: 'email', 
                title: 'Email', 
                width: 220,
                sortable: true,
                render: (u) => (
                  <Text size="xs" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.email}
                  </Text>
                )
              },
              {
                accessor: 'phone',
                title: 'Phone',
                width: 140,
                render: (u) => (
                  <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                    {u.phones?.find((p) => p.isPrimary)?.number || u.phone || 'N/A'}
                  </Text>
                ),
              },
              {
                accessor: 'role',
                title: 'Role',
                width: 160,
                sortable: true,
                render: (u) => {
                  const currentUserId = currentUser?._id || currentUser?.id;
                  const isSelf = Boolean(currentUserId && (u._id || u.id) === currentUserId);

                  if (isSuperAdmin && !isSelf) {
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          size="xs"
                          w={130}
                          comboboxProps={{ width: 150, zIndex: 1000 }}
                          value={u.role || UserRole.USER}
                          disabled={updatingUserId === (u._id || u.id)}
                          onChange={(val) => handleRoleChangeRequest(u, val)}
                          data={[
                            { value: UserRole.USER, label: 'USER' },
                            { value: UserRole.WLS_ADMIN, label: 'WLS ADMIN' },
                            { value: UserRole.SUPER_USER, label: 'SUPER USER' },
                          ]}
                        />
                      </div>
                    );
                  }
                  return <Badge size="sm" variant="light">{u.role || UserRole.USER}</Badge>;
                },
              },
              {
                accessor: 'location',
                title: 'City / Country',
                width: 160,
                render: (u) => (
                  <Text size="xs" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {`${u.city ? u.city + ', ' : ''}${u.country || ''}`}
                  </Text>
                ),
              },
              ...(isSuperAdmin ? [{
                accessor: 'actions',
                title: 'Actions',
                width: 80,
                render: (u) => (
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '4px' }}>
                    <AdminUserControls
                      targetUser={u}
                      currentUser={currentUser}
                      compact={true}
                      onConfirmAction={(title, msg, action) => triggerConfirmation(title, msg, action)}
                      onUserUpdated={(updatedUser, meta) => {
                        if (meta?.deletedId) {
                          setUsers((prev) => prev.filter((item) => (item._id || item.id) !== meta.deletedId));
                          showToast('User deleted successfully.');
                        } else if (updatedUser) {
                          setUsers((prev) =>
                            prev.map((item) => ((item._id || item.id) === (updatedUser._id || updatedUser.id) ? updatedUser : item))
                          );
                          showToast('User updated successfully.');
                        }
                      }}
                    />
                  </div>
                ),
              }] : []),
            ]}
          />
        </Paper>
      </Stack>

      {/* Global Confirmation Modal */}
      <Modal 
        opened={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })} 
        title={confirmModal.title} 
        centered
      >
        <Text size="sm" mb="lg">{confirmModal.message}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}>
            Cancel
          </Button>
          <Button color="blue" onClick={() => { 
            confirmModal.onConfirm?.(); 
            setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null }); 
          }}>
            Confirm
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}