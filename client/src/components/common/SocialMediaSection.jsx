// src/components/common/SocialMediaSection.jsx
import React from 'react';
import { TextInput, Select, ActionIcon, Group, Stack, Text, Box, Tooltip } from '@mantine/core';
import { 
  IconPlus, 
  IconTrash, 
  IconBrandLinkedin, 
  IconBrandYoutube, 
  IconBrandFacebook, 
  IconBrandTwitter, 
  IconBrandInstagram, 
  IconWorld 
} from '@tabler/icons-react';

export function SocialMediaSection({ socialMedia = [], onChange, onAdd, onRemove }) {
  const platforms = [
    { value: 'LinkedIn', label: 'LinkedIn', icon: <IconBrandLinkedin size={18} color="#0a66c2" /> },
    { value: 'YouTube', label: 'YouTube', icon: <IconBrandYoutube size={18} color="#ff0000" /> },
    { value: 'Facebook', label: 'Facebook', icon: <IconBrandFacebook size={18} color="#1877f2" /> },
    { value: 'Twitter X', label: 'Twitter X', icon: <IconBrandTwitter size={18} color="#000000" /> },
    { value: 'Instagram', label: 'Instagram', icon: <IconBrandInstagram size={18} color="#e4405f" /> },
    { value: 'Other', label: 'Other', icon: <IconWorld size={18} color="gray" /> },
  ];

  // Custom renderer so icons appear inside the dropdown menu list items
  const renderSelectOption = ({ option }) => {
    const item = platforms.find((p) => p.value === option.value);
    return (
      <Group gap="sm" wrap="nowrap">
        {item ? item.icon : <IconWorld size={18} color="gray" />}
        <Text size="sm" style={{ fontFamily: 'Inter, sans-serif' }}>{option.label}</Text>
      </Group>
    );
  };

  // Fetches the correct icon to display inside the select input box based on current value
  const getPlatformIcon = (val) => {
    const found = platforms.find(p => p.value === (val || 'LinkedIn'));
    return found ? found.icon : <IconBrandLinkedin size={18} color="#0a66c2" />;
  };

  return (
    <Box w="100%">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600} c="#1e293b" style={{ fontFamily: 'Inter, sans-serif' }}>
          Social Media Accounts
        </Text>
        <Tooltip label="Add social media account" position="left" withArrow>
          <ActionIcon
            variant="light"
            color="teal"
            size="md"
            onClick={onAdd}
            aria-label="Add social media account"
            style={{ boxShadow: '0 2px 5px rgba(15, 118, 110, 0.15)' }}
          >
            <IconPlus size={18} stroke={2.5} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Stack gap="sm" w="100%">
        {socialMedia.map((sm, idx) => (
          <Group key={idx} align="center" wrap="nowrap" gap="md" w="100%">
            
            {/* Platform Dropdown with Icon */}
            <Box style={{ width: '185px', flexShrink: 0 }}>
              <Select
                placeholder="Platform"
                data={platforms.map(p => ({ value: p.value, label: p.label }))}
                value={sm.platform || 'LinkedIn'}
                onChange={(val) => onChange(idx, 'platform', val || 'LinkedIn')}
                leftSection={getPlatformIcon(sm.platform)}
                renderOption={renderSelectOption}
                size="md"
                styles={{ 
                  input: { fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400 },
                  dropdown: { fontFamily: 'Inter, sans-serif' }
                }}
              />
            </Box>

            {/* Spacious URL Input Box */}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                placeholder="Profile URL or @handle"
                value={sm.handleUrl || ''}
                onChange={(e) => onChange(idx, 'handleUrl', e.target.value)}
                size="md"
                styles={{ input: { fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400 } }}
              />
            </Box>

            {/* Compact Delete Button on the Far Right */}
            <Box style={{ flexShrink: 0 }}>
              <Tooltip label="Remove account" position="right" withArrow>
                <ActionIcon
                  color="red"
                  variant="light"
                  size="lg"
                  onClick={() => onRemove(idx)}
                  aria-label="Remove social link"
                  style={{ width: '38px', height: '38px' }}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </Box>
          </Group>
        ))}

        {socialMedia.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" py="xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            No social accounts added yet. Click the plus icon above to add one.
          </Text>
        )}
      </Stack>
    </Box>
  );
}