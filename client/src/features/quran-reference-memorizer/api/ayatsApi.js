// client/src/features/quran-reference-memorizer/api/ayatsApi.js
import { API_BASE } from "../../../config/constants";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function fetchAyats({
  page = 1,
  limit = 20,
  search = "",
  categoryId = "",
  lectureId = "",
  surahNumber = "",
  ayatNumber = "",
} = {}) {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search) params.append("search", search);
  if (categoryId) params.append("categoryId", categoryId);
  if (lectureId) params.append("lectureId", lectureId);
  if (surahNumber) params.append("surahNumber", surahNumber);
  if (ayatNumber) params.append("ayatNumber", ayatNumber);

  const res = await fetch(`${API_BASE}/ayats?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch ayats: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVerseReferences(surahNumber, ayatNumber) {
  const params = new URLSearchParams({
    surah_number: surahNumber,
    ayat_number: ayatNumber,
  });
  const res = await fetch(`${API_BASE}/ayats/references?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch verse references");
  }
  return res.json();
}

export async function fetchAyatById(id) {
  const res = await fetch(`${API_BASE}/ayats/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch ayat details");
  }
  return res.json();
}

export async function createAyat(payload) {
  const res = await fetch(`${API_BASE}/ayats`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create ayat record");
  }
  return res.json();
}

export async function updateAyat(id, payload) {
  const res = await fetch(`${API_BASE}/ayats/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update ayat record");
  }
  return res.json();
}

export async function deleteAyat(id) {
  const res = await fetch(`${API_BASE}/ayats/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete ayat record");
  }
  return res.json();
}

export async function fetchQuranVerseFromProxy(surah, ayah) {
  const res = await fetch(`${API_BASE}/quran/verse/${surah}/${ayah}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch from Quran API proxy (${res.status})`);
  }
  return res.json();
}
