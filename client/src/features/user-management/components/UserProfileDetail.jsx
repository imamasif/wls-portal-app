import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Linkedin, 
  Youtube, 
  Facebook, 
  Twitter, 
  Github, 
  Link as GenericLink 
} from 'lucide-react';
import styles from './UserProfileDetail.module.css';

// Helper component to render brand-specific icons
const SocialIcon = ({ platform }) => {
  const normalized = (platform || '').toLowerCase().trim();

  switch (normalized) {
    case 'linkedin':
      return <Linkedin size={16} className={styles.linkedinIcon} />;
    case 'youtube':
      return <Youtube size={16} className={styles.youtubeIcon} />;
    case 'facebook':
      return <Facebook size={16} className={styles.facebookIcon} />;
    case 'twitter':
    case 'twitter/x':
    case 'x':
      return <Twitter size={16} className={styles.twitterIcon} />;
    case 'github':
      return <Github size={16} className={styles.githubIcon} />;
    default:
      return <GenericLink size={16} className={styles.defaultIcon} />;
  }
};

export function UserProfileDetail() {
  const { user, setShowAuthModal } = useAuth();

  if (!user) return null;

  const displayRole = user.profession 
    ? user.profession 
    : user.role === 'SUPER_USER' 
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
          <h2 className={styles.userName}>{user.name}</h2>
          <div className={styles.userRole}>{displayRole}</div>
          <div className={styles.locationBadge}>
            📍 {user.city ? `${user.city}, ` : ''}{user.state ? `${user.state}, ` : ''}{user.country || 'Canada'}
          </div>
        </div>

        <button
          className={styles.btnEditProfile}
          onClick={() => setShowAuthModal(true)}
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
          <p className={styles.fieldValue}>{user.education || "Bachelor's Degree"}</p>
        </div>

        <div className={styles.gridItem}>
          <span className={styles.fieldLabel}>Email</span>
          <p className={styles.fieldValue}>{user.email}</p>
        </div>

        <div className={styles.gridItem}>
          <span className={styles.fieldLabel}>Drive Shared Folder</span>
          {user.driveFolderPath ? (
            <a
              href={user.driveFolderPath}
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
                    <strong>{sm.platform}:</strong> {sm.handleUrl}
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