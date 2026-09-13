import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Linkedin, 
  Youtube, 
  Facebook, 
  Twitter, 
  Github, 
  Link as GenericLink 
} from 'lucide-react';
import { EditProfileCard } from './EditProfileCard';
import styles from './UserProfileDetail.module.css';

// Helper component to render brand-specific icons
const SocialIcon = ({ platform }) => {
  const normalized = (platform || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalized.includes('linkedin')) {
    return <Linkedin size={16} className={styles.linkedinIcon} />;
  }
  if (normalized.includes('youtube')) {
    return <Youtube size={16} className={styles.youtubeIcon} />;
  }
  if (normalized.includes('facebook')) {
    return <Facebook size={16} className={styles.facebookIcon} />;
  }
  if (normalized.includes('twitter') || normalized.includes('x')) {
    return <Twitter size={16} className={styles.twitterIcon} />;
  }
  if (normalized.includes('github')) {
    return <Github size={16} className={styles.githubIcon} />;
  }

  return <GenericLink size={16} className={styles.defaultIcon} />;
};

export function UserProfileDetail({ overrideUser, onUserUpdated }) {
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Use overrideUser if passed from the grid view, otherwise fallback to logged-in user
  const user = overrideUser || authUser;

  if (!user) return null;

  // Toggle directly into the inline metallic EditProfileCard
  if (isEditing) {
    return (
      <EditProfileCard
        targetUser={user}
        onCancel={() => setIsEditing(false)}
        onSaveSuccess={(updatedData) => {
          setIsEditing(false);
          if (onUserUpdated) onUserUpdated(updatedData);
        }}
      />
    );
  }

  // Flexible check for Drive Link
  const driveUrl = user.driveFolderPath || user.drive;

  const displayRole = user.profession 
    ? user.profession 
    : user.role === 'SUPER_USER' || user.role === 'SUPER_ADMIN'
      ? 'Super User' 
      : 'User';

  const userInitials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  return (
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

        <button
          className={styles.btnEditProfile}
          onClick={() => setIsEditing(true)}
        >
          ✏️ Edit Profile
        </button>
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

      {/* Social Handles Section with Lucide Icons */}
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
  );
}