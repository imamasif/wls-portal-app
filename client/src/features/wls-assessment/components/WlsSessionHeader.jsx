import React from 'react';
import { Card, Group, Text, ThemeIcon, Box, Select } from '@mantine/core';
import { IconCalendarEvent, IconUserCheck, IconChevronDown } from '@tabler/icons-react';

export function WlsSessionHeader({ sessionInfo, allSessions, selectedSessionId, onSessionSwitch, currentAdminName }) {
  return (
    <Card
      shadow="lg"
      padding="lg"
      radius="lg"
      withBorder
      mb="lg"
      style={{
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 40%, #bcccdc 100%)',
        borderColor: '#9fb3c8',
        borderWidth: '1.5px',
        boxShadow: '0 8px 24px rgba(18, 52, 86, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 4px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Glossy sheen overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(105deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 60%)',
        pointerEvents: 'none'
      }} />

      <Group justify="space-between" align="center" wrap="wrap" gap="md" style={{ position: 'relative', zIndex: 1 }}>
        <Group gap="md">
          <ThemeIcon 
            size={54} 
            radius="xl" 
            variant="gradient"
            gradient={{ from: '#486581', to: '#243b53', deg: 45 }}
            style={{ boxShadow: '0 4px 12px rgba(36, 59, 83, 0.3), inset 0 2px 4px rgba(255,255,255,0.4)' }}
          >
            <IconCalendarEvent size={28} color="#ffffff" />
          </ThemeIcon>
          <Box>
            <Text fw={900} size="xl" style={{ color: '#102a43', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
              Name : {sessionInfo.topic}
            </Text>
            {sessionInfo.date && (
              <Text size="xs" mt={2} fw={600} style={{ color: '#486581' }}>
                Session Date: {new Date(sessionInfo.date).toLocaleString()}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap="lg" align="center" wrap="wrap">
          <Select
            label={
              <Text size="xs" fw={800} c="#334e68" style={{ letterSpacing: 0.5 }}>
                WLS Session
              </Text>
            }
            placeholder="Select active session..."
            leftSection={<IconCalendarEvent size={18} color="#486581" />}
            rightSection={<IconChevronDown size={16} color="#486581" />}
            data={allSessions.map((s) => ({
              value: s.id || s._id,
              label: s.topic || s.topicName || s.title || `Session (${(s.id || s._id).slice(-4)})`
            }))}
            value={selectedSessionId}
            onChange={onSessionSwitch}
            style={{ width: '340px' }}
            size="md"
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 700,
                fontSize: '14px',
                color: '#102a43',
                borderColor: '#9fb3c8',
                borderWidth: '1.5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                borderRadius: '8px',
                paddingLeft: '38px'
              },
              section: { pointerEvents: 'none' }
            }}
          />

          <Group 
            gap="sm" 
            px="md" 
            py="xs" 
            style={{ 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,244,248,0.95) 100%)', 
              border: '1.5px solid #9fb3c8',
              boxShadow: '0 4px 12px rgba(36, 59, 83, 0.1), inset 0 1px 1px rgba(255,255,255,0.9)'
            }}
          >
            <ThemeIcon 
              size="lg" 
              radius="xl" 
              variant="gradient"
              gradient={{ from: '#486581', to: '#102a43', deg: 45 }}
              style={{ boxShadow: '0 2px 6px rgba(36, 59, 83, 0.2)' }}
            >
              <IconUserCheck size={20} color="#ffffff" />
            </ThemeIcon>
            <Box>
              <Text size="sm" fw={900} style={{ color: '#102a43', letterSpacing: -0.2 }}>
                {currentAdminName || 'Syed Imam'}
              </Text>
            </Box>
          </Group>
        </Group>
      </Group>
    </Card>
  );
}