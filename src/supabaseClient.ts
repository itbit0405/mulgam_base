import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase is not fully configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment/Vercel settings.\n' +
    'The application will fall back to local browser state for preview.'
  );
}

// Lazy initializer for supabase client to prevent crashing on missing keys
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * 1. PROFILES Table Helpers
 */
export async function getProfileByKakaoId(kakaoId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('PROFILES')
      .select('*')
      .eq('kakao_id', kakaoId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching Supabase profile:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('getProfileByKakaoId failed:', err);
    return null;
  }
}

export async function upsertProfile(profile: { id?: string; kakao_id: string; nickname: string; role: string }) {
  if (!supabase) return null;
  try {
    // If id (uuid) is not provided, we can look up if profile already exists or let database auto-generate/use auth.uid
    const existing = await getProfileByKakaoId(profile.kakao_id);
    const payload = {
      kakao_id: profile.kakao_id,
      nickname: profile.nickname,
      role: profile.role,
      ...(existing?.id ? { id: existing.id } : (profile.id ? { id: profile.id } : {}))
    };

    const { data, error } = await supabase
      .from('PROFILES')
      .upsert(payload, { onConflict: 'kakao_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting Supabase profile:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('upsertProfile failed:', err);
    return null;
  }
}

/**
 * 2. WRITER_APPLICATIONS & APPLICATION_FILES Table Helpers
 */
export async function submitWriterApplication(userId: string, description: string, files: { file_type: string; file_url: string }[]) {
  if (!supabase) return null;
  try {
    // Resolve UUID for userId (which might be Kakao ID)
    let profileUuid = userId;
    if (userId.startsWith('kakao-') || userId.startsWith('user_kakaotalk_') || userId.startsWith('artist_kakaotalk_') || userId.startsWith('admin_kakaotalk_')) {
      const profile = await getProfileByKakaoId(userId);
      if (profile && profile.id) {
        profileUuid = profile.id;
      } else {
        // If profile doesn't exist, upsert it first to get UUID
        const newProfile = await upsertProfile({
          kakao_id: userId,
          nickname: '임시사용자',
          role: 'user'
        });
        if (newProfile && newProfile.id) {
          profileUuid = newProfile.id;
        }
      }
    }

    // Insert into WRITER_APPLICATIONS
    const { data: appData, error: appError } = await supabase
      .from('WRITER_APPLICATIONS')
      .insert({
        user_id: profileUuid,
        status: 'pending'
      })
      .select()
      .single();

    if (appError) {
      console.error('Error creating writer application:', appError);
      return null;
    }

    // Insert files if present
    if (files && files.length > 0) {
      const filesPayload = files.map(file => ({
        application_id: appData.id,
        file_type: file.file_type,
        file_url: file.file_url
      }));

      const { error: filesError } = await supabase
        .from('APPLICATION_FILES')
        .insert(filesPayload);

      if (filesError) {
        console.error('Error inserting application files:', filesError);
      }
    }

    // Optional: Update bio/description in PROFILE
    await supabase
      .from('PROFILES')
      .update({ description })
      .eq('id', profileUuid);

    return appData;
  } catch (err) {
    console.error('submitWriterApplication failed:', err);
    return null;
  }
}

export async function getWriterApplications() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('WRITER_APPLICATIONS')
      .select(`
        *,
        PROFILES:user_id (id, nickname, kakao_id),
        APPLICATION_FILES (id, file_type, file_url)
      `);

    if (error) {
      console.error('Error getting applications:', error);
      return [];
    }
    return data;
  } catch (err) {
    console.error('getWriterApplications failed:', err);
    return [];
  }
}

/**
 * 3. WRITERS & NFC_CARDS Table Helpers
 */
export async function approveWriterApplication(applicationId: string, userId: string, serialNumber: string, adminId: string) {
  if (!supabase) return false;
  try {
    // Resolve UUID for userId (which might be Kakao ID)
    let profileUuid = userId;
    if (userId.startsWith('kakao-') || userId.startsWith('user_kakaotalk_') || userId.startsWith('artist_kakaotalk_') || userId.startsWith('admin_kakaotalk_')) {
      const profile = await getProfileByKakaoId(userId);
      if (profile && profile.id) {
        profileUuid = profile.id;
      }
    }

    // Resolve UUID for adminId (which might be Kakao ID)
    let adminUuid = adminId;
    if (adminId.startsWith('kakao-') || adminId.startsWith('user_kakaotalk_') || adminId.startsWith('artist_kakaotalk_') || adminId.startsWith('admin_kakaotalk_')) {
      const adminProfile = await getProfileByKakaoId(adminId);
      if (adminProfile && adminProfile.id) {
        adminUuid = adminProfile.id;
      }
    }

    // 1. Create a row in WRITERS
    const { data: writerData, error: writerError } = await supabase
      .from('WRITERS')
      .upsert({
        id: profileUuid, // Use UUID
        serial_number: serialNumber,
        approved_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (writerError) {
      console.error('Error inserting/upserting WRITER:', writerError);
      return false;
    }

    // 2. Update WRITER_APPLICATIONS status
    const { error: appUpdateError } = await supabase
      .from('WRITER_APPLICATIONS')
      .update({
        status: 'approved',
        reviewed_by: adminUuid
      })
      .eq('id', applicationId);

    if (appUpdateError) {
      console.error('Error updating application status:', appUpdateError);
    }

    // 3. Update PROFILE role to 'artist'
    const { error: profileUpdateError } = await supabase
      .from('PROFILES')
      .update({ role: 'artist' })
      .eq('id', profileUuid);

    if (profileUpdateError) {
      console.error('Error updating user profile role:', profileUpdateError);
    }

    return true;
  } catch (err) {
    console.error('approveWriterApplication failed:', err);
    return false;
  }
}

export async function registerNfcCard(tagUid: string, writerId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('NFC_CARDS')
      .insert({
        tag_uid: tagUid,
        writer_id: writerId
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering NFC card:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('registerNfcCard failed:', err);
    return null;
  }
}

/**
 * 4. FAVORITES Table Helpers
 */
export async function toggleFavoriteWriter(userId: string, writerId: string, source: string = 'web') {
  if (!supabase) return null;
  try {
    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from('FAVORITES')
      .select('*')
      .eq('user_id', userId)
      .eq('writer_id', writerId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking favorite:', checkError);
      return null;
    }

    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('FAVORITES')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Error deleting favorite:', deleteError);
        return null;
      }
      return { action: 'removed', id: existing.id };
    } else {
      // Add favorite
      const { data, error: insertError } = await supabase
        .from('FAVORITES')
        .insert({
          user_id: userId,
          writer_id: writerId,
          source
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting favorite:', insertError);
        return null;
      }
      return { action: 'added', data };
    }
  } catch (err) {
    console.error('toggleFavoriteWriter failed:', err);
    return null;
  }
}

export async function getFavoritesByUser(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('FAVORITES')
      .select(`
        *,
        WRITERS:writer_id (
          id,
          serial_number,
          PROFILES:id (nickname, profile_image)
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user favorites:', error);
      return [];
    }
    return data;
  } catch (err) {
    console.error('getFavoritesByUser failed:', err);
    return [];
  }
}
