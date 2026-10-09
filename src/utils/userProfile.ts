/**
 * PB CivilLab — User Profile & Report Authorship Management
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 */

import { UserProfile } from '../types';

export const USER_PROFILE_STORAGE_KEY = 'pb_civillab_user_profile';

export const DEFAULT_USER_PROFILE: UserProfile = {
  engineerName: 'Prokash Biswas',
  designation: 'Site Engineer',
  companyName: 'PB CivilLab Infrastructure Consult',
  licenseNumber: 'PE-48291',
  email: 'prokashbiswas8801@gmail.com',
  phone: '+880 1700-000000',
  companyAddress: 'Dhaka, Bangladesh',
  notes: 'Certified Civil Engineering Calculation Engine',
  autoIncludePreparedBy: true,
  roleType: 'site_engineer',
};

/**
 * Loads the user profile from localStorage with fallback to default profile.
 */
export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.engineerName) {
        return {
          ...DEFAULT_USER_PROFILE,
          ...parsed,
          autoIncludePreparedBy: parsed.autoIncludePreparedBy !== false,
        };
      }
    }
    // Check fallback in settings
    const rawSettings = localStorage.getItem('pb_civillab_settings');
    if (rawSettings) {
      const parsedSettings = JSON.parse(rawSettings);
      if (parsedSettings?.userProfile) {
        return {
          ...DEFAULT_USER_PROFILE,
          ...parsedSettings.userProfile,
          autoIncludePreparedBy: parsedSettings.userProfile.autoIncludePreparedBy !== false,
        };
      }
    }
  } catch (err) {
    console.warn('[PB CivilLab] Failed to load user profile from storage', err);
  }
  return { ...DEFAULT_USER_PROFILE };
}

/**
 * Saves the user profile to localStorage under pb_civillab_user_profile
 * and synchronizes with app settings.
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    const cleanProfile: UserProfile = {
      ...profile,
      autoIncludePreparedBy: profile.autoIncludePreparedBy !== false,
    };
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(cleanProfile));

    // Keep settings in sync
    const rawSettings = localStorage.getItem('pb_civillab_settings');
    if (rawSettings) {
      const parsedSettings = JSON.parse(rawSettings);
      parsedSettings.userProfile = cleanProfile;
      localStorage.setItem('pb_civillab_settings', JSON.stringify(parsedSettings));
    }

    // Dispatch custom event for real-time app update
    window.dispatchEvent(new CustomEvent('pb_civillab_user_profile_updated', { detail: cleanProfile }));
  } catch (err) {
    console.error('[PB CivilLab] Failed to save user profile', err);
  }
}

/**
 * Formats authorship for "PREPARED BY" based on profile and toggle state:
 * - If autoIncludePreparedBy is false, returns empty string.
 * - If true, formats e.g. "Prokash Biswas (Site Engineer)".
 */
export function formatPreparedBy(profile?: UserProfile | null): string {
  if (!profile) return '';
  if (profile.autoIncludePreparedBy === false) return '';
  if (!profile.engineerName || !profile.engineerName.trim()) return '';

  const name = profile.engineerName.trim();
  const designation = profile.designation?.trim();

  if (designation) {
    return `${name} (${designation})`;
  }
  return name;
}
