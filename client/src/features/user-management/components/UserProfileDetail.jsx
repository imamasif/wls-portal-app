import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Paper, 
  Stack
} from '@mantine/core';
import { 
  IconBrandLinkedin, 
  IconBrandYoutube, 
  IconBrandFacebook, 
  IconBrandTwitter, 
  IconBrandGithub, 
  IconLink
} from '@tabler/icons-react';
import { EditProfileCard } from './EditProfileCard';
import { AdminUserControls } from './AdminUserControls';
import { UserGroupMemberships } from './UserGroupMemberships';
import styles from './UserProfileDetail.module.css';

const SocialIcon = ({ platform }) => {
  const normalized = (platform || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalized.includes('linkedin')) return <IconBrandLinkedin size={16} className={styles.linkedinIcon} />;
  if (normalized.includes('youtube')) return <IconBrandYoutube size={16} className={styles.youtubeIcon} />;
  if (normalized.includes('facebook')) return <IconBrandFacebook size={16} className={styles.facebookIcon} />;
  if (normalized.includes('twitter') || normalized.includes('x')) return <IconBrandTwitter size={16} className={styles.twitterIcon} />;
  if (normalized.includes('github')) return <IconBrandGithub size={16} className={styles.githubIcon} />;

  return <IconLink size={16} className={styles.defaultIcon} />;
};

export function UserProfileDetail({ overrideUser, onUserUpdated }) {
  const { user: authUser, saveUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const user = overrideUser || authUser;

  if (!user) return null;

  if (isEditing) {
    return (
      <EditProfileCard
        targetUser={user}
        onCancel={() => setIsEditing(false)}
        onSaveSuccess={(updatedData) => {
          setIsEditing(false);
          saveUserData(updatedData);
          if (onUserUpdated) onUserUpdated(updatedData);
        }}
      />
    );
  }

  const driveUrl = user.driveFolderPath || user.drive;

  const displayRole = user.profession 
    ? user.profession 
    : user.role === 'SUPER_USER' || user.role === 'SUPER_ADMIN'
      ? 'Super User' 
      : 'User';

  const userInitials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  const userId = user._id || user.id;

  return (
    <Stack gap="lg">
      {/* Primary Profile Details Card */}
      <div className={styles.profileCard}>
        {/* Header Row */}
        <div className={styles.header}>
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.name}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>{userInitials}</div>
          )}

          <div className={styles.headerInfo}>
            <h2 className={styles.userName}>{user.name || user.email?.split('@')[0]}</h2>
            <div className={styles.userRole}>{displayRole}</div>
            <div className={styles.locationBadge}>
              📍 {user.city ? `${user.city}, ` : ''}{user.state ? `${user.state}, ` : ''}{user.country || 'Canada'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <button
              className={styles.btnEditProfile}
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit Profile
            </button>

            {/* Render Admin User Controls */}
            <AdminUserControls
              targetUser={user}
              currentUser={authUser}
              compact={false}
              onUserUpdated={(updatedUser, meta) => {
                if (meta?.deletedId) {
                  if (onUserUpdated) onUserUpdated(null);
                } else if (onUserUpdated) {
                  onUserUpdated(updatedUser);
                }
              }}
            />
          </div>
        </div>

        {/* Grid Fields */}
        <div className={styles.detailsGrid}>
          <div className={styles.gridItem}>
            <span className={styles.fieldLabel}>Timezone Difference</span>
            <p className={styles.fieldValue}>Same time as Toronto (America/Toronto)</p>
          </div>

          <div className={styles.gridItem}>
            <span className={styles.fieldLabel}>Highest Education</span>
            <p className={styles.fieldValue}>{user.education || 'Not provided'}</p>
          </div>

          <div className={styles.gridItem}>
            <span className={styles.fieldLabel}>Email</span>
            <p className={styles.fieldValue}>{user.email}</p>
          </div>

          {/* Multi-Phone Display Field */}
          <div className={styles.gridItem}>
            <span className={styles.fieldLabel}>Phone / Mobile Numbers</span>
            {user.phones && user.phones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {user.phones.map((p, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconPhone size={13} style={{ color: '#0284c7' }} />
                    <strong>{p.type || 'Phone'}:</strong> {p.number}
                    {p.isPrimary && (
                      <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0284c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.fieldValue}>{user.phone || 'N/A'}</p>
            )}
          </div>

          <div className={styles.gridItem}>
            <span className={styles.fieldLabel}>Drive Shared Folder</span>
            {driveUrl ? (
              <a
                href={driveUrl.startsWith('http') ? driveUrl : `https://${driveUrl}`}
                target="_blank"
                rel="noreferrer"
                className={styles.driveLink}
              >
                Open Shared Drive ↗
              </a>
            ) : (
              <p className={styles.fieldValue}>Not connected</p>
            )}
          </div>
        </div>

        {/* Cause Support Section */}
        {user.causeContribution && (
          <div className={styles.causeSection}>
            <span className={styles.fieldLabel}>How I Can Help in Cause</span>
            <p className={styles.causeText}>{user.causeContribution}</p>
          </div>
        )}

        {/* Social Handles Section */}
        {user.socialMedia && user.socialMedia.length > 0 && (
          <div className={styles.socialSection}>
            <span className={styles.fieldLabel}>Social Profiles</span>
            <div className={styles.socialList}>
              {user.socialMedia.map((sm, i) => {
                if (!sm.handleUrl) return null;

                const href = sm.handleUrl.startsWith('http') 
                  ? sm.handleUrl 
                  : `https://${sm.handleUrl}`;

                return (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialBadge}
                  >
                    <SocialIcon platform={sm.platform} />
                    <span>
                      <strong>{sm.platform || 'Link'}:</strong> {sm.handleUrl}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Group Assignment & Membership Management Component */}
      <Paper p="lg" radius="md" bg="white" shadow="xs">
        <UserGroupMemberships userId={userId} />
      </Paper>
    </Stack>
  );
}