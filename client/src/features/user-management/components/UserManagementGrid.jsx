import React, { useState, useEffect } from 'react';
import { DataTable } from 'mantine-datatable';
import { 
  TextInput, 
  Select, 
  Group, 
  Paper, 
  Title, 
  Avatar, 
  Text, 
  Badge 
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export function UserManagementGrid({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortStatus, setSortStatus] = useState({ columnAccessor: 'name', direction: 'asc' });
  const [selectedRecords, setSelectedRecords] = useState([]);

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
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ width: '100%', overflow: 'hidden' }}>
      <Group justify="space-between" mb="md">
        <Title order={3} c="blue.8">User Management Directory</Title>
      </Group>

      <Group mb="md">
        <TextInput
          placeholder="Search by name, email, or city..."
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
            { value: 'SUPER_ADMIN', label: 'Super Admin' },
            { value: 'WLS_ADMIN', label: 'WLS Admin' },
            { value: 'STUDENT', label: 'Student' },
          ]}
        />
      </Group>

      <DataTable
        withTableBorder
        borderRadius="md"
        striped
        highlightOnHover
        fz="xs"
        verticalSpacing="xs"
        horizontalSpacing="xs"
        styles={{
          root: { width: '100%', overflow: 'hidden' },
          table: { tableLayout: 'fixed', width: '100%' },
        }}
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
        onRowClick={({ record }) => onSelectUser && onSelectUser(record)}
        columns={[
          {
            accessor: 'name',
            title: 'Name',
            sortable: true,
            render: (u) => (
              <Group gap={4} wrap="nowrap">
                <Avatar src={u.profilePictureUrl} radius="xl" size={18} color="blue">
                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Text size="11px" fw={600} c="blue.7" lineClamp={1}>
                  {u.name || 'Unnamed User'}
                </Text>
              </Group>
            ),
          },
          { 
            accessor: 'email', 
            title: 'Email', 
            sortable: true,
            render: (u) => (
              <Text size="11px" lineClamp={1}>
                {u.email}
              </Text>
            )
          },
          {
            accessor: 'phone',
            title: 'Phone',
            render: (u) => (
              <Text size="11px" lineClamp={1}>
                {u.phones?.find((p) => p.isPrimary)?.number || u.phone || 'N/A'}
              </Text>
            ),
          },
          {
            accessor: 'role',
            title: 'Role',
            sortable: true,
            render: (u) => <Badge size="xs" variant="light">{u.role || 'USER'}</Badge>,
          },
          {
            accessor: 'location',
            title: 'City / Country',
            render: (u) => (
              <Text size="11px" lineClamp={1}>
                {`${u.city ? u.city + ', ' : ''}${u.country || ''}`}
              </Text>
            ),
          },
        ]}
      />
    </Paper>
  );
}