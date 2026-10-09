import type { Tri } from "@/i18n/core";

/** 위치 선택·지도·장소 검색 (§11, §34) */
export const locationMsgs = {
  "loc.pickup": { ko: "픽업", id: "Jemput", en: "Pickup" },
  "loc.destination": { ko: "목적지", id: "Tujuan", en: "Destination" },
  "loc.currentLocation": { ko: "현재 위치", id: "Lokasi saat ini", en: "Current location" },
  "loc.pickupHere": { ko: "현재 위치에서 픽업", id: "Jemput di lokasi saya", en: "Pick me up here" },
  "loc.favorites": { ko: "즐겨찾기", id: "Favorit", en: "Favorites" },
  "loc.recentPlaces": { ko: "최근 장소", id: "Tempat terakhir", en: "Recent places" },
  "loc.recentDestinations": { ko: "최근 목적지", id: "Tujuan terakhir", en: "Recent destinations" },
  "loc.chooseOnMap": { ko: "지도에서 선택", id: "Pilih di peta", en: "Choose on map" },
  "loc.search": { ko: "장소 검색", id: "Cari tempat", en: "Search places" },
  "loc.pickPickup": { ko: "픽업 위치 선택", id: "Pilih titik jemput", en: "Choose pickup" },
  "loc.pickDestination": { ko: "목적지 선택", id: "Pilih tujuan", en: "Choose destination" },
  "loc.deniedTitle": { ko: "현재 위치를 사용할 수 없습니다.", id: "Lokasi saat ini tidak tersedia.", en: "Current location is unavailable." },
  "loc.deniedBody": {
    ko: "설정에서 위치 권한을 허용하거나 지도에서 직접 위치를 선택해주세요.",
    id: "Izinkan akses lokasi di pengaturan, atau pilih lokasi langsung di peta.",
    en: "Allow location access in settings, or pick a spot on the map.",
  },
  "loc.notFound": {
    ko: "현재 위치를 찾지 못했습니다. 지도에서 직접 선택해주세요.",
    id: "Lokasi tidak ditemukan. Pilih langsung di peta.",
    en: "Couldn't find your location. Please pick it on the map.",
  },
  "loc.poorTitle": { ko: "위치가 정확하지 않을 수 있어요", id: "Lokasi mungkin kurang akurat", en: "Your location may be inaccurate" },
  "loc.poorAccuracy": { ko: "GPS 오차가 약 {m}m 입니다.", id: "Akurasi GPS sekitar {m} m.", en: "GPS accuracy is about {m} m." },
  "loc.poorQuestion": {
    ko: "지도에서 정확한 위치로 수정하시겠어요?",
    id: "Perbaiki ke lokasi yang tepat di peta?",
    en: "Adjust to the exact spot on the map?",
  },
  "loc.fixOnMap": { ko: "지도에서 수정", id: "Perbaiki di peta", en: "Adjust on map" },
  "loc.useAsIs": { ko: "이대로 사용", id: "Pakai apa adanya", en: "Use as is" },
  "loc.unsupported": {
    ko: "이 기기에서는 위치를 사용할 수 없습니다.",
    id: "Lokasi tidak tersedia di perangkat ini.",
    en: "Location isn't available on this device.",
  },
  "loc.noCoords": {
    ko: "선택한 장소의 위치 정보를 찾을 수 없습니다.",
    id: "Koordinat tempat yang dipilih tidak ditemukan.",
    en: "Couldn't find coordinates for that place.",
  },

  // ── 지도에서 선택
  "map.keyProblem": {
    ko: "지도 API Key 설정에 문제가 있습니다 (허용 도메인·API·결제 설정 확인 필요).",
    id: "Ada masalah pada pengaturan API Key peta (periksa domain, API, dan penagihan).",
    en: "There's a problem with the map API key (check allowed domains, APIs and billing).",
  },
  "map.noGps": {
    ko: "현재 위치를 가져올 수 없습니다. 지도를 움직여 직접 선택해주세요.",
    id: "Lokasi tidak bisa didapat. Geser peta untuk memilih sendiri.",
    en: "Couldn't get your location. Move the map to pick a spot.",
  },
  "map.selected": { ko: "선택한 위치", id: "Lokasi terpilih", en: "Selected location" },
  "map.cannotShow": { ko: "지도를 표시할 수 없습니다", id: "Peta tidak dapat ditampilkan", en: "The map can't be shown" },
  "map.toMyLocation": { ko: "현재 위치로 이동", id: "Ke lokasi saya", en: "Go to my location" },
  "map.moving": { ko: "지도를 멈추면 주소를 찾습니다…", id: "Alamat dicari saat peta berhenti…", en: "Stop moving the map to find the address…" },
  "map.resolving": { ko: "주소를 찾는 중…", id: "Mencari alamat…", en: "Finding address…" },
  "map.noAddress": {
    ko: "주소를 찾지 못했습니다 (좌표로 저장됩니다)",
    id: "Alamat tidak ditemukan (disimpan sebagai koordinat)",
    en: "No address found (will be saved as coordinates)",
  },
  "map.hint": { ko: "지도를 움직여 위치를 맞춰주세요", id: "Geser peta untuk menentukan lokasi", en: "Move the map to set the spot" },
  "map.choose": { ko: "이 위치로 선택", id: "Pilih lokasi ini", en: "Use this location" },

  // ── 장소 검색
  "search.placeholder": {
    ko: "장소·주소 검색 (예: Grand Indonesia)",
    id: "Cari tempat/alamat (contoh: Grand Indonesia)",
    en: "Search place or address (e.g. Grand Indonesia)",
  },
  "search.failed": {
    ko: "검색하지 못했습니다. 인터넷 연결 또는 지도 설정을 확인해주세요.",
    id: "Pencarian gagal. Periksa koneksi internet atau pengaturan peta.",
    en: "Search failed. Check your connection or map settings.",
  },
  "search.noResults": {
    ko: "검색 결과가 없습니다. 다른 이름으로 검색하거나 지도에서 직접 선택해주세요.",
    id: "Tidak ada hasil. Coba nama lain atau pilih langsung di peta.",
    en: "No results. Try another name or pick on the map.",
  },
} satisfies Record<string, Tri>;
