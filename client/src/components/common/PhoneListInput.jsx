// src/components/common/PhoneListInput.jsx
import React from 'react';
import { Group, Select, Button, Radio, Text, Box, Stack, TextInput } from '@mantine/core';
import { 
  IconPlus, 
  IconTrash, 
  IconDeviceMobile, 
  IconBriefcase, 
  IconHome, 
  IconDots,
  IconPhone
} from '@tabler/icons-react';

export function PhoneListInput({ phones = [], onChange }) {
  const sanitizeE164 = (val) => {
    if (!val) return '';
    const clean = val.replace(/[^\d+]/g, '');
    return clean.startsWith('+') ? clean : `+${clean}`;
  };

  const handleAddPhone = () => {
    onChange([
      ...phones,
      { number: '', type: 'Mobile', isPrimary: phones.length === 0 }
    ]);
  };

  const handleRemovePhone = (index) => {
    const updated = phones.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleChange = (index, key, value) => {
    const updated = [...phones];
    if (key === 'number') {
      updated[index][key] = sanitizeE164(value);
    } else {
      updated[index][key] = value;
    }

    if (key === 'isPrimary' && value === true) {
      updated.forEach((p, i) => {
        p.isPrimary = i === index;
      });
    }
    onChange(updated);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Mobile': return <IconDeviceMobile size={16} />;
      case 'Work': return <IconBriefcase size={16} />;
      case 'Home': return <IconHome size={16} />;
      default: return <IconDots size={16} />;
    }
  };

  const renderSelectOption = ({ option }) => (
    <Group gap="xs" wrap="nowrap">
      {getTypeIcon(option.value)}
      <Text size="sm">{option.label}</Text>
    </Group>
  );

  return (
    <Box w="100%">
      <Group justify="space-between" mb={6}>
        <Text size="sm" fw={600} c="#212529">Phone / Mobile Numbers</Text>
        <Button
          type="button"
          size="xs"
          color="teal"
          onClick={handleAddPhone}
          p={6}
          title="Add Phone Number"
        >
          <IconPlus size={18} />
        </Button>
      </Group>

      <Stack gap="sm" w="100%">
        {phones.length === 0 ? (
          <Text size="sm" c="dimmed" fs="italic">No phone numbers added yet.</Text>
        ) : (
          phones.map((phone, index) => (
            <Box 
              key={index} 
              p="sm"
              bg="gray.0"
              w="100%"
              style={{
                borderRadius: '8px',
                border: '1px solid var(--mantine-color-gray-3)'
              }}
            >
              <Group wrap="wrap" align="center" gap="md" w="100%">
                <Select
                  data={[
                    { value: 'Mobile', label: 'Mobile' },
                    { value: 'Work', label: 'Work' },
                    { value: 'Home', label: 'Home' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  value={phone.type}
                  onChange={(val) => handleChange(index, 'type', val || 'Mobile')}
                  leftSection={getTypeIcon(phone.type)}
                  renderOption={renderSelectOption}
                  comboboxProps={{ shadow: 'md', width: 180 }}
                  style={{ flex: '1 1 140px', minWidth: '130px' }}
                />

                <TextInput
                  placeholder="+1 (555) 000-0000"
                  value={phone.number}
                  onChange={(e) => handleChange(index, 'number', e.target.value)}
                  leftSection={<IconPhone size={16} />}
                  style={{ flex: '2 1 220px', minWidth: '200px' }}
                />

                <Group gap="sm" style={{ marginLeft: 'auto' }}>
                  <Radio
                    label="Primary"
                    checked={phone.isPrimary || false}
                    onChange={() => handleChange(index, 'isPrimary', true)}
                    size="sm"
                  />

                  <Button
                    color="red"
                    variant="light"
                    size="xs"
                    p={8}
                    onClick={() => handleRemovePhone(index)}
                    title="Delete Phone"
                  >
                    <IconTrash size={16} />
                  </Button>
                </Group>
              </Group>
            </Box>
          ))
        )}
      </Stack>
    </Box>
  );
}