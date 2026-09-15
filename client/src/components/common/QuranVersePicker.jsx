import React, { useState } from 'react';
import { Group, Select, Button, Badge, Text, Stack, Card, ActionIcon } from '@mantine/core';
import { IconPlus, IconX, IconBook, IconBookmark, IconBooks, IconQuotes } from '@tabler/icons-react';

export const SURAH_LIST = [
  { value: '1', label: '1. Al-Fatihah (7 Ayats)', total: 7 },
  { value: '2', label: '2. Al-Baqarah (286 Ayats)', total: 286 },
  { value: '3', label: '3. Ali \'Imran (200 Ayats)', total: 200 },
  { value: '4', label: '4. An-Nisa (176 Ayats)', total: 176 },
  { value: '5', label: '5. Al-Ma\'idah (120 Ayats)', total: 120 },
  { value: '6', label: '6. Al-An\'am (165 Ayats)', total: 165 },
  { value: '7', label: '7. Al-A\'raf (206 Ayats)', total: 206 },
  { value: '8', label: '8. Al-Anfal (75 Ayats)', total: 75 },
  { value: '9', label: '9. At-Tawbah (129 Ayats)', total: 129 },
  { value: '10', label: '10. Yunus (109 Ayats)', total: 109 },
  { value: '11', label: '11. Hud (123 Ayats)', total: 123 },
  { value: '12', label: '12. Yusuf (111 Ayats)', total: 111 },
  { value: '13', label: '13. Ar-Ra\'d (43 Ayats)', total: 43 },
  { value: '14', label: '14. Ibrahim (52 Ayats)', total: 52 },
  { value: '15', label: '15. Al-Hijr (99 Ayats)', total: 99 },
  { value: '16', label: '16. An-Nahl (128 Ayats)', total: 128 },
  { value: '17', label: '17. Al-Isra (111 Ayats)', total: 111 },
  { value: '18', label: '18. Al-Kahf (110 Ayats)', total: 110 },
  { value: '19', label: '19. Maryam (98 Ayats)', total: 98 },
  { value: '20', label: '20. Ta-Ha (135 Ayats)', total: 135 },
  { value: '21', label: '21. Al-Anbiya (112 Ayats)', total: 112 },
  { value: '22', label: '22. Al-Hajj (78 Ayats)', total: 78 },
  { value: '23', label: '23. Al-Mu\'minun (118 Ayats)', total: 118 },
  { value: '24', label: '24. An-Nur (64 Ayats)', total: 64 },
  { value: '25', label: '25. Al-Furqan (77 Ayats)', total: 77 },
  { value: '26', label: '26. Ash-Shu\'ara (227 Ayats)', total: 227 },
  { value: '27', label: '27. An-Naml (93 Ayats)', total: 93 },
  { value: '28', label: '28. Al-Qasas (88 Ayats)', total: 88 },
  { value: '29', label: '29. Al-Ankabut (69 Ayats)', total: 69 },
  { value: '30', label: '30. Ar-Rum (60 Ayats)', total: 60 },
  { value: '31', label: '31. Luqman (34 Ayats)', total: 34 },
  { value: '32', label: '32. As-Sajdah (30 Ayats)', total: 30 },
  { value: '33', label: '33. Al-Ahzab (73 Ayats)', total: 73 },
  { value: '34', label: '34. Saba (54 Ayats)', total: 54 },
  { value: '35', label: '35. Fatir (45 Ayats)', total: 45 },
  { value: '36', label: '36. Ya-Sin (83 Ayats)', total: 83 },
  { value: '37', label: '37. As-Saffat (182 Ayats)', total: 182 },
  { value: '38', label: '38. Sad (88 Ayats)', total: 88 },
  { value: '39', label: '39. Az-Zumar (75 Ayats)', total: 75 },
  { value: '40', label: '40. Ghafir (85 Ayats)', total: 85 },
  { value: '41', label: '41. Fussilat (54 Ayats)', total: 54 },
  { value: '42', label: '42. Ash-Shura (53 Ayats)', total: 53 },
  { value: '43', label: '43. Az-Zukhruf (89 Ayats)', total: 89 },
  { value: '44', label: '44. Ad-Dukhan (59 Ayats)', total: 59 },
  { value: '45', label: '45. Al-Jathiyah (37 Ayats)', total: 37 },
  { value: '46', label: '46. Al-Ahqaf (35 Ayats)', total: 35 },
  { value: '47', label: '47. Muhammad (38 Ayats)', total: 38 },
  { value: '48', label: '48. Al-Fath (29 Ayats)', total: 29 },
  { value: '49', label: '49. Al-Hujurat (18 Ayats)', total: 18 },
  { value: '50', label: '50. Qaf (45 Ayats)', total: 45 },
  { value: '51', label: '51. Adh-Dhariyat (60 Ayats)', total: 60 },
  { value: '52', label: '52. At-Tur (49 Ayats)', total: 49 },
  { value: '53', label: '53. An-Najm (62 Ayats)', total: 62 },
  { value: '54', label: '54. Al-Qamar (55 Ayats)', total: 55 },
  { value: '55', label: '55. Ar-Rahman (78 Ayats)', total: 78 },
  { value: '56', label: '56. Al-Waqi\'ah (96 Ayats)', total: 96 },
  { value: '57', label: '57. Al-Hadid (29 Ayats)', total: 29 },
  { value: '58', label: '58. Al-Mujadila (22 Ayats)', total: 22 },
  { value: '59', label: '59. Al-Hashr (24 Ayats)', total: 24 },
  { value: '60', label: '60. Al-Mumtahanah (13 Ayats)', total: 13 },
  { value: '61', label: '61. As-Saff (14 Ayats)', total: 14 },
  { value: '62', label: '62. Al-Jumu\'ah (11 Ayats)', total: 11 },
  { value: '63', label: '63. Al-Munafiqun (11 Ayats)', total: 11 },
  { value: '64', label: '64. At-Taghabun (18 Ayats)', total: 18 },
  { value: '65', label: '65. At-Talaq (12 Ayats)', total: 12 },
  { value: '66', label: '66. At-Tahrim (12 Ayats)', total: 12 },
  { value: '67', label: '67. Al-Mulk (30 Ayats)', total: 30 },
  { value: '68', label: '68. Al-Qalam (52 Ayats)', total: 52 },
  { value: '69', label: '69. Al-Haqqah (52 Ayats)', total: 52 },
  { value: '70', label: '70. Al-Ma\'arij (44 Ayats)', total: 44 },
  { value: '71', label: '71. Nuh (28 Ayats)', total: 28 },
  { value: '72', label: '72. Al-Jinn (28 Ayats)', total: 28 },
  { value: '73', label: '73. Al-Muzzammil (20 Ayats)', total: 20 },
  { value: '74', label: '74. Al-Muddaththir (56 Ayats)', total: 56 },
  { value: '75', label: '75. Al-Qiyamah (40 Ayats)', total: 40 },
  { value: '76', label: '76. Al-Insan (31 Ayats)', total: 31 },
  { value: '77', label: '77. Al-Mursalat (50 Ayats)', total: 50 },
  { value: '78', label: '78. An-Naba (40 Ayats)', total: 40 },
  { value: '79', label: '79. An-Nazi\'at (46 Ayats)', total: 46 },
  { value: '80', label: '80. \'Abasa (42 Ayats)', total: 42 },
  { value: '81', label: '81. At-Takwir (29 Ayats)', total: 29 },
  { value: '82', label: '82. Al-Infitar (19 Ayats)', total: 19 },
  { value: '83', label: '83. Al-Mutaffifin (36 Ayats)', total: 36 },
  { value: '84', label: '84. Al-Inshiqaq (25 Ayats)', total: 25 },
  { value: '85', label: '85. Al-Buruj (22 Ayats)', total: 22 },
  { value: '86', label: '86. At-Tariq (17 Ayats)', total: 17 },
  { value: '87', label: '87. Al-A\'la (19 Ayats)', total: 19 },
  { value: '88', label: '88. Al-Ghashiyah (26 Ayats)', total: 26 },
  { value: '89', label: '89. Al-Fajr (30 Ayats)', total: 30 },
  { value: '90', label: '90. Al-Balad (20 Ayats)', total: 20 },
  { value: '91', label: '91. Ash-Shams (15 Ayats)', total: 15 },
  { value: '92', label: '92. Al-Lail (21 Ayats)', total: 21 },
  { value: '93', label: '93. Ad-Duha (11 Ayats)', total: 11 },
  { value: '94', label: '94. Ash-Sharh (8 Ayats)', total: 8 },
  { value: '95', label: '95. At-Tin (8 Ayats)', total: 8 },
  { value: '96', label: '96. Al-Alaq (19 Ayats)', total: 19 },
  { value: '97', label: '97. Al-Qadr (5 Ayats)', total: 5 },
  { value: '98', label: '98. Al-Bayyinah (8 Ayats)', total: 8 },
  { value: '99', label: '99. Az-Zalzalah (8 Ayats)', total: 8 },
  { value: '100', label: '100. Al-Adiyat (11 Ayats)', total: 11 },
  { value: '101', label: '101. Al-Qari\'ah (11 Ayats)', total: 11 },
  { value: '102', label: '102. At-Takathur (8 Ayats)', total: 8 },
  { value: '103', label: '103. Al-Asr (3 Ayats)', total: 3 },
  { value: '104', label: '104. Al-Humazah (9 Ayats)', total: 9 },
  { value: '105', label: '105. Al-Fil (5 Ayats)', total: 5 },
  { value: '106', label: '106. Quraysh (4 Ayats)', total: 4 },
  { value: '107', label: '107. Al-Ma\'un (7 Ayats)', total: 7 },
  { value: '108', label: '108. Al-Kawthar (3 Ayats)', total: 3 },
  { value: '109', label: '109. Al-Kafirun (6 Ayats)', total: 6 },
  { value: '110', label: '110. An-Nasr (3 Ayats)', total: 3 },
  { value: '111', label: '111. Al-Masad (5 Ayats)', total: 5 },
  { value: '112', label: '112. Al-Ikhlas (4 Ayats)', total: 4 },
  { value: '113', label: '113. Al-Falaq (5 Ayats)', total: 5 },
  { value: '114', label: '114. An-Nas (6 Ayats)', total: 6 }
];

export function QuranVersePicker({ selectedAyats = [], onChange }) {
  const [selectedSurah, setSelectedSurah] = useState('');
  const [selectedAyat, setSelectedAyat] = useState('');

  const activeSurahObj = SURAH_LIST.find((s) => s.value === selectedSurah);

  const ayatOptions = activeSurahObj
    ? Array.from({ length: activeSurahObj.total }, (_, i) => ({
        value: `${i + 1}`,
        label: `Ayat ${i + 1}`,
      }))
    : [];

  const handleAddAyat = () => {
    if (!selectedSurah || !selectedAyat) return;
    const tag = `Surah ${selectedSurah}:${selectedAyat}`;
    if (!selectedAyats.includes(tag)) {
      onChange([...selectedAyats, tag]);
    }
    setSelectedAyat('');
  };

  const handleRemoveAyat = (tagToRemove) => {
    onChange(selectedAyats.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Stack gap="sm">
      {/* Header with Bookmark / Signmark Icon */}
      <Group justify="space-between" align="center">
        <Group gap={6} align="center">
          <IconBookmark size={18} color="var(--mantine-color-teal-6)" />
          <Text fw={600} size="sm">
            Select Quranic Verses
          </Text>
        </Group>
        {selectedAyats.length > 0 && (
          <Badge variant="light" color="teal" size="sm">
            {selectedAyats.length} selected
          </Badge>
        )}
      </Group>

      <Group align="flex-end" gap="xs">
        {/* Surah Dropdown with Chapter Icon */}
        <Select
          label={
            <Group gap={4} align="center" style={{ display: 'inline-flex' }}>
              <IconBooks size={15} color="var(--mantine-color-indigo-6)" />
              <span>Surah</span>
            </Group>
          }
          placeholder="Search Surah..."
          leftSection={<IconBook size={16} />}
          data={SURAH_LIST.map((s) => ({ value: s.value, label: s.label }))}
          value={selectedSurah}
          searchable
          clearable
          onChange={(val) => {
            setSelectedSurah(val || '');
            setSelectedAyat('');
          }}
          style={{ flex: 2 }}
          size="sm"
        />

        {/* Ayat Dropdown with Verse/Sentence Icon */}
        <Select
          label={
            <Group gap={4} align="center" style={{ display: 'inline-flex' }}>
              <IconQuotes size={15} color="var(--mantine-color-teal-6)" />
              <span>Ayat</span>
            </Group>
          }
          placeholder="Ayat #"
          data={ayatOptions}
          value={selectedAyat}
          disabled={!selectedSurah}
          searchable
          clearable
          onChange={(val) => setSelectedAyat(val || '')}
          style={{ flex: 1 }}
          size="sm"
        />

        <Button
          size="sm"
          variant="filled"
          color="teal"
          leftSection={<IconPlus size={16} />}
          onClick={handleAddAyat}
          disabled={!selectedSurah || !selectedAyat}
        >
          Add
        </Button>
      </Group>

      <Card p="xs" radius="md" withBorder bg="var(--mantine-color-gray-0)">
        <Group gap={6}>
          {selectedAyats.length === 0 ? (
            <Text size="xs" c="dimmed" p={4}>
              No verses added yet. Choose a Surah and Ayat above.
            </Text>
          ) : (
            selectedAyats.map((tag) => (
              <Badge
                key={tag}
                variant="light"
                color="teal"
                size="md"
                pr={3}
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="teal"
                    radius="xl"
                    variant="subtle"
                    onClick={() => handleRemoveAyat(tag)}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                {tag}
              </Badge>
            ))
          )}
        </Group>
      </Card>
    </Stack>
  );
}