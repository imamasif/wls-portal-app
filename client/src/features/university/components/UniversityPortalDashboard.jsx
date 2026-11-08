import React, { useState } from "react";
import { Box, SegmentedControl, Group, Paper, Text, Badge } from "@mantine/core";
import {
  IconBuildingBank,
  IconSchool,
  IconUserCheck,
} from "@tabler/icons-react";
import { useAuth } from "../../../context/AuthContext";
import { hasUserRole, UserRole } from "../../../types/user";
import { UniversitySuperUserView } from "./UniversitySuperUserView";
import { UniversityInstructorView } from "./UniversityInstructorView";
import { UniversityStudentView } from "./UniversityStudentView";

export function UniversityPortalDashboard() {
  const { user } = useAuth();

  const isSuperUser =
    hasUserRole(user, UserRole.UNIVERSITY_SUPER_USER) ||
    user?.role?.toUpperCase() === "SUPER_USER";

  const isInstructor =
    hasUserRole(user, UserRole.UNIVERSITY_ADMIN) ||
    user?.role?.toUpperCase() === "WLS_ADMIN";

  // Default mode according to user permissions
  const defaultMode = isSuperUser
    ? "super_user"
    : isInstructor
    ? "instructor"
    : "student";

  const [activeMode, setActiveMode] = useState(defaultMode);

  return (
    <Box>
      {/* Super User Mode Switcher Pill */}
      {isSuperUser && (
        <Paper p="xs" radius="md" withBorder mb="md" bg="white" shadow="xs">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <IconBuildingBank size={18} color="#2563eb" />
              <Text size="xs" fw={700} c="gray.8">
                University Role Perspective:
              </Text>
              <Badge color="indigo" variant="light" size="xs">
                Super Admin Access
              </Badge>
            </Group>

            <SegmentedControl
              size="xs"
              color="indigo"
              value={activeMode}
              onChange={setActiveMode}
              data={[
                {
                  value: "super_user",
                  label: (
                    <CenterLabel
                      icon={<IconBuildingBank size={14} />}
                      label="Admin Studio"
                    />
                  ),
                },
                {
                  value: "instructor",
                  label: (
                    <CenterLabel
                      icon={<IconSchool size={14} />}
                      label="Instructor View"
                    />
                  ),
                },
                {
                  value: "student",
                  label: (
                    <CenterLabel
                      icon={<IconUserCheck size={14} />}
                      label="Student View"
                    />
                  ),
                },
              ]}
            />
          </Group>
        </Paper>
      )}

      {/* Render selected perspective */}
      {activeMode === "super_user" && isSuperUser && (
        <UniversitySuperUserView currentUser={user} />
      )}
      {activeMode === "instructor" && (
        <UniversityInstructorView currentUser={user} />
      )}
      {activeMode === "student" && <UniversityStudentView currentUser={user} />}
    </Box>
  );
}

function CenterLabel({ icon, label }) {
  return (
    <Group gap={4} wrap="nowrap" justify="center">
      {icon}
      <span>{label}</span>
    </Group>
  );
}

export default UniversityPortalDashboard;
