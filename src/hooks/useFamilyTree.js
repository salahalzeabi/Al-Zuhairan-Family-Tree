import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const buildTree = (members) => {
  const memberMap = {};
  members.forEach((member) => {
    memberMap[member.id] = { ...member, children: [] };
  });

  const tree = [];
  members.forEach((member) => {
    if (member.parent_id && memberMap[member.parent_id]) {
      memberMap[member.parent_id].children.push(memberMap[member.id]);
    } else {
      tree.push(memberMap[member.id]);
    }
  });
  return tree.length > 0 ? tree[0] : null;
};


const STORAGE_BUCKET = 'uploads';
const STORAGE_FOLDER = ''; 

const DEFAULT_IMAGES = [
  '/assets/members/default.svg'
];

export const useFamilyTree = () => {
  const [familyData, setFamilyData] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [viewRootId, setViewRootId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [background, setBackgroundState] = useState('bg-slate-800');
  const [logo, setLogoState] = useState('/assets/members/default.svg');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFamilyData = useCallback(async () => {
    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      return;
    }

    setAllMembers(members || []);

    if (members && members.length > 0) {
      const tree = buildTree(members);
      setFamilyData(tree);

      if (!viewRootId || !members.some((m) => m.id === viewRootId)) {
        const rootId = members.find((m) => !m.parent_id)?.id || members[0].id;
        setViewRootId(rootId);
        setExpandedNodes(new Set([rootId]));
      }
    } else {
      
      const { data: newRoot, error: insertError } = await supabase
        .from('family_members')
        .insert({ name: 'عبدالعزيز', image_url: '/assets/members/default.svg' })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating root:', insertError);
      } else if (newRoot) {
        setAllMembers([newRoot]);
        setFamilyData({ ...newRoot, children: [] });
        setViewRootId(newRoot.id);
        setExpandedNodes(new Set([newRoot.id]));
      }
    }
  }, [viewRootId]);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*');

    
    if (error) {
      console.warn('Settings table fetch skipped:', error.message || error);
      return;
    }

    const settingsMap = (data || []).reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    if (settingsMap.logo) setLogoState(settingsMap.logo);
    if (settingsMap.background) setBackgroundState(settingsMap.background);
  }, []);

  const fetchMedia = useCallback(async () => {
    const listPath = (STORAGE_FOLDER || '').replace(/^\/|\/$/g, '');

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(listPath || '', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.warn('Storage list error:', error.message || error);
      setImages(DEFAULT_IMAGES);
      return;
    }

    const urls = (data || [])
      .filter((f) => f && f.name)
      .map((f) => {
        const path = listPath ? `${listPath}/${f.name}` : f.name;
        return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      });

    const unique = Array.from(new Set([...DEFAULT_IMAGES, ...urls]));
    setImages(unique);
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchFamilyData(), fetchSettings(), fetchMedia()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchFamilyData, fetchSettings, fetchMedia]);

  const addMember = async (memberData, parentId) => {
    const { error } = await supabase
      .from('family_members')
      .insert({ name: memberData.name, image_url: memberData.image_url, parent_id: parentId });

    if (error) {
      console.error('Error adding member:', error);
      return;
    }
    await fetchFamilyData();
    if (parentId) {
      setExpandedNodes((prev) => new Set([...prev, parentId]));
    }
  };

  const editMember = async (memberData, memberId) => {
    const { error } = await supabase
      .from('family_members')
      .update({ name: memberData.name, image_url: memberData.image_url })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member:', error);
      return;
    }
    await fetchFamilyData();
  };

  const deleteMember = async (memberToDelete) => {
    const { error } = await supabase.from('family_members').delete().eq('id', memberToDelete.id);

    if (error) {
      console.error('Delete error:', error);
      alert('لا يمكن حذف عضو لديه أبناء. يرجى حذف الأبناء أولاً.');
      return;
    }

    if (memberToDelete.id === viewRootId) {
      const fallback =
        memberToDelete.parent_id || (allMembers.find((m) => !m.parent_id) || {}).id || null;
      setViewRootId(fallback);
    }

    await fetchFamilyData();
  };

  const setLogo = async (logoUrl) => {
    setLogoState(logoUrl);
    const { error } = await supabase.from('settings').upsert({ key: 'logo', value: logoUrl });
    if (error) console.warn('save logo failed (settings missing?)', error.message || error);
  };

  const setBackground = async (backgroundUrl) => {
    setBackgroundState(backgroundUrl);
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'background', value: backgroundUrl });
    if (error) console.warn('save background failed (settings missing?)', error.message || error);
  };

  return {
    familyData,
    allMembers,
    viewRootId,
    setViewRootId,
    expandedNodes,
    setExpandedNodes,
    background,
    setBackground,
    logo,
    setLogo,
    images,
    loading,
    addMember,
    editMember,
    deleteMember,
    fetchMedia,
    fetchFamilyData,
  };
};
