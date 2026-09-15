export const getEmbeddableDriveUrl = (url) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : url;
  }
  return url;
};

// Color map transition: 1-2 (Red), 3-4 (Yellow), 5-6 (Blue), 7-8 (Pink), 9-10 (Green)
export const getSliderColor = (val) => {
  if (val <= 1) return '#d32f2f'; // Dark Red
  if (val === 2) return '#ef5350'; // Light Red
  if (val === 3) return '#fbc02d'; // Light Yellow
  if (val === 4) return '#f57f17'; // Dark Yellow
  if (val === 5) return '#29b6f6'; // Light Blue
  if (val === 6) return '#0288d1'; // Dark Blue
  if (val === 7) return '#f48fb1'; // Light Pink
  if (val === 8) return '#c2185b'; // Dark Pink
  if (val === 9) return '#66bb6a'; // Light Green
  return '#2e7d32';               // 10: Dark Green
};