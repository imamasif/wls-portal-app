import React, { useState } from 'react';
import { SliderCountSelector } from '../../../common/components/SliderCountSelector';
import styles from './WlsGroupAssigner.module.css';

export function WlsGroupAssigner({ users = [], wlsAdmins = [], groupAssignments, onAssignmentsChange }) {
  const [groupCount, setGroupCount] = useState(1);

  const handleUserToggle = (groupIdx, userId) => {
    // Single Group Constraint Verification
    const isAssignedElsewhere = Object.entries(groupAssignments).some(([gIdx, data]) => {
      return Number(gIdx) !== groupIdx && data.userIds.includes(userId);
    });

    if (isAssignedElsewhere) {
      alert('User is already assigned to another group in this WLS Session.');
      return;
    }

    const currentGroup = groupAssignments[groupIdx] || { userIds: [], adminIds: [] };
    const exists = currentGroup.userIds.includes(userId);
    const updatedUserIds = exists
      ? currentGroup.userIds.filter((id) => id !== userId)
      : [...currentGroup.userIds, userId];

    onAssignmentsChange(groupIdx, { ...currentGroup, userIds: updatedUserIds });
  };

  const handleAdminToggle = (groupIdx, adminId) => {
    const currentGroup = groupAssignments[groupIdx] || { userIds: [], adminIds: [] };
    const exists = currentGroup.adminIds.includes(adminId);
    const updatedAdminIds = exists
      ? currentGroup.adminIds.filter((id) => id !== adminId)
      : [...currentGroup.adminIds, adminId];

    onAssignmentsChange(groupIdx, { ...currentGroup, adminIds: updatedAdminIds });
  };

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Group Configuration & Member Assignment</h4>
      <SliderCountSelector
        label="Total Groups to Create"
        min={1}
        max={100}
        value={groupCount}
        onChange={(val) => setGroupCount(val)}
      />

      <div className={styles.accordionList}>
        {Array.from({ length: groupCount }, (_, i) => {
          const groupIdx = i + 1;
          const assignedData = groupAssignments[groupIdx] || { userIds: [], adminIds: [] };

          return (
            <details key={groupIdx} className={styles.accordion}>
              <summary className={styles.accordionHeader}>
                Group {groupIdx} ({assignedData.userIds.length} Users, {assignedData.adminIds.length} Admins)
              </summary>
              
              <div className={styles.assignmentPanel}>
                <div className={styles.section}>
                  <h5 className={styles.sectionTitle}>Assign WLS-Admins (Monitoring)</h5>
                  <div className={styles.checkboxGrid}>
                    {wlsAdmins.map((admin) => (
                      <label key={admin._id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={assignedData.adminIds.includes(admin._id)}
                          onChange={() => handleAdminToggle(groupIdx, admin._id)}
                        />
                        <span>{admin.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h5 className={styles.sectionTitle}>Assign Users</h5>
                  <div className={styles.checkboxGrid}>
                    {users.map((u) => (
                      <label key={u._id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={assignedData.userIds.includes(u._id)}
                          onChange={() => handleUserToggle(groupIdx, u._id)}
                        />
                        <span>{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}